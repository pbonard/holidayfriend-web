from __future__ import annotations

import os
import random
import re
import subprocess
import sys
import time
from typing import Callable

MANIFEST_PATH = "k8s/web.yaml"
IMAGE = "holidayfriend/web"
ATTEMPTS = 10


def git(*args: str, check: bool = True) -> subprocess.CompletedProcess:
    return subprocess.run(["git", *args], check=check, capture_output=True, text=True)


def image_line(image: str) -> re.Pattern:
    # matches the image with its registry, `image: "ghcr.io/owner/holidayfriend/web:<tag>"`
    return re.compile(r'(image: "[^"\s]*/?' + re.escape(image) + r':)([^"\s]+)')


def get_manifest_tag(manifest: str, image: str) -> str:
    """The tag the image has in the manifest, the image must appear exactly once."""
    matches = image_line(image).findall(manifest)
    if len(matches) != 1:
        raise ValueError(f"expected exactly one image line for {image}, found {len(matches)}")
    return matches[0][1]


def replace_tag(manifest: str, image: str, tag: str) -> str:
    """Replaces only the tag of the image's line, the rest of the file stays byte for byte."""
    return image_line(image).sub(lambda m: f"{m.group(1)}{tag}", manifest)


def is_older(sha: str, tag: str) -> bool:
    """Whether this push's commit is an ancestor of the given tag, i.e. an older build."""
    # a tag that isn't a commit (latest) is never newer
    if git("cat-file", "-e", f"{tag}^{{commit}}", check=False).returncode != 0:
        return False
    return git("merge-base", "--is-ancestor", sha, tag, check=False).returncode == 0


def plan(manifest: str, image: str, sha: str, is_older: Callable[[str, str], bool] = is_older) -> str | None:
    """Returns the new manifest, or None when nothing is to be written.
    is_older is a parameter only so tests can answer it without a git repository."""
    tag = sha[:7]
    current = get_manifest_tag(manifest, image)
    if current == tag:
        print(f"{image} is already at {tag}, don't need to rewrite")
        return None
    # a later push can deploy first, an older build must not replace a newer tag
    if is_older(sha, current):
        print(f"skip: this build's commit ({tag}) is older than the deployed one ({current}), we don't overwrite")
        return None
    return replace_tag(manifest, image, tag)


def deploy(manifest_path: str, image: str, sha: str, branch: str) -> None:
    tag = sha[:7]
    git("config", "user.name", "github-actions[bot]")
    git("config", "user.email", "41898282+github-actions[bot]@users.noreply.github.com")

    # pushes made close together race on the branch, a rejected push resets and redoes the edit
    for _ in range(ATTEMPTS):
        git("pull", "--rebase", "--quiet", "origin", branch)
        with open(manifest_path) as f:
            manifest = plan(f.read(), image, sha)
        if manifest is None:
            print("nothing to deploy")
            return
        with open(manifest_path, "w") as f:
            f.write(manifest)

        git("commit", "-qa", "-m", f"deploy: {tag}")
        # a push made with GITHUB_TOKEN triggers no workflow, so this can't loop
        if git("push", "--quiet", "origin", f"HEAD:{branch}", check=False).returncode == 0:
            print(f"deployed {tag}")
            return
        git("reset", "--quiet", "--hard", f"origin/{branch}")
        # a random 1-5s wait, so runs that collided don't retry in lockstep
        time.sleep(random.randint(1, 5))

    sys.exit(f"could not push the tag after {ATTEMPTS} attempts")


def main() -> None:
    deploy(MANIFEST_PATH, IMAGE, os.environ["GITHUB_SHA"], os.environ["GITHUB_REF_NAME"])


if __name__ == "__main__":
    main()
