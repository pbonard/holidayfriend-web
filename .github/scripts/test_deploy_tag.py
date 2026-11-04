import os
import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest import mock

import deploy_tag
from deploy_tag import deploy, get_manifest_tag, plan, replace_tag

IMAGE = "holidayfriend/web"
MANIFEST = """spec:
  containers:
    - name: web
      image: "ghcr.io/pbonard/holidayfriend/web:latest"
      imagePullPolicy: Always
"""


class TagTest(unittest.TestCase):
    def test_reads_the_tag_behind_the_registry(self):
        self.assertEqual(get_manifest_tag(MANIFEST, IMAGE), "latest")

    def test_rejects_a_missing_image(self):
        with self.assertRaises(ValueError):
            get_manifest_tag(MANIFEST, "holidayfriend/api")

    def test_a_name_that_is_a_prefix_of_the_image_is_not_matched(self):
        with self.assertRaises(ValueError):
            get_manifest_tag(MANIFEST, "holidayfriend/we")

    def test_rejects_an_image_that_appears_twice(self):
        with self.assertRaises(ValueError):
            get_manifest_tag(MANIFEST + MANIFEST, IMAGE)

    def test_replace_tag_changes_only_the_tag(self):
        self.assertEqual(replace_tag(MANIFEST, IMAGE, "abc1234"), MANIFEST.replace(":latest", ":abc1234"))


class PlanTest(unittest.TestCase):
    def test_writes_a_new_tag(self):
        self.assertIn(":abc1234", plan(MANIFEST, IMAGE, "abc1234ffff", lambda sha, tag: False))

    def test_nothing_when_already_at_the_tag(self):
        current = MANIFEST.replace(":latest", ":abc1234")
        self.assertIsNone(plan(current, IMAGE, "abc1234ffff", lambda sha, tag: False))

    def test_an_older_build_does_not_replace_a_newer_tag(self):
        self.assertIsNone(plan(MANIFEST, IMAGE, "abc1234ffff", lambda sha, tag: True))


def run(cwd, *args):
    return subprocess.run(args, cwd=cwd, check=True, capture_output=True, text=True).stdout.strip()


class DeployTest(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.addCleanup(os.chdir, os.getcwd())
        root = Path(tmp.name)
        self.origin, self.seed = root / "origin.git", root / "seed"
        run(root, "git", "init", "-q", "--bare", "-b", "main", str(self.origin))
        run(root, "git", "clone", "-q", str(self.origin), str(self.seed))
        self.config(self.seed)
        run(self.seed, "git", "checkout", "-q", "-B", "main")
        (self.seed / "web.yaml").write_text(MANIFEST)
        self.old = self.commit("web.yaml")
        (self.seed / "a").write_text("a")
        self.new = self.commit("a")
        self.clone = root / "clone"
        run(root, "git", "clone", "-q", str(self.origin), str(self.clone))
        os.chdir(self.clone)

    def config(self, path):
        run(path, "git", "config", "user.email", "a@b.c")
        run(path, "git", "config", "user.name", "seed")

    def commit(self, path):
        run(self.seed, "git", "add", path)
        run(self.seed, "git", "commit", "-qm", f"add {path}")
        run(self.seed, "git", "push", "-q", "origin", "main")
        return run(self.seed, "git", "rev-parse", "HEAD")

    def pushed_manifest(self):
        return run(self.seed, "git", "show", "origin/main:web.yaml") + "\n"

    def fetch(self):
        run(self.seed, "git", "fetch", "-q", "origin")

    def test_pushes_the_tag_as_a_deploy_commit(self):
        deploy("web.yaml", IMAGE, self.new, "main")
        self.fetch()
        self.assertEqual(get_manifest_tag(self.pushed_manifest(), IMAGE), self.new[:7])
        self.assertEqual(run(self.seed, "git", "log", "-1", "--format=%s", "origin/main"), f"deploy: {self.new[:7]}")

    def test_an_older_build_after_a_newer_one_changes_nothing(self):
        deploy("web.yaml", IMAGE, self.new, "main")
        deploy("web.yaml", IMAGE, self.old, "main")
        self.fetch()
        self.assertEqual(get_manifest_tag(self.pushed_manifest(), IMAGE), self.new[:7])

    def test_a_rejected_push_is_redone_on_top_of_the_other_push(self):
        real_git, raced = deploy_tag.git, []

        def racing_git(*args, **kwargs):
            # another push lands right before this run's first push
            if args[0] == "push" and not raced:
                raced.append(True)
                (self.seed / "b").write_text("b")
                self.commit("b")
            return real_git(*args, **kwargs)

        with mock.patch.object(deploy_tag, "git", racing_git), mock.patch.object(deploy_tag.time, "sleep"):
            deploy("web.yaml", IMAGE, self.new, "main")
        self.fetch()
        self.assertEqual(get_manifest_tag(self.pushed_manifest(), IMAGE), self.new[:7])
        self.assertEqual(run(self.seed, "git", "show", "origin/main:b"), "b")


if __name__ == "__main__":
    unittest.main()
