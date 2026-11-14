import { Suspense } from 'react';
import type { Metadata } from 'next';
import ProfileDetail from '@/components/profile/ProfileDetail';

type Params = Promise<{ userId: string }>;

export const metadata: Metadata = {
  title: 'Profile · Holidayfriend',
};

// /profile/{id}: a person's profile, its about me and prompts, and their posts beside it as far as they're
// scrolled. as wide as the explore screen, its about me and posts as wide as a city's posts. the id is read inside
// the page's own suspense, so going from one profile to another doesn't wait for it before anything shows
export default function ProfilePage({ params }: { params: Params }) {
  return (
    <Suspense>
      <Profile params={params} />
    </Suspense>
  );
}

async function Profile({ params }: { params: Params }) {
  const { userId } = await params;
  return <ProfileDetail userId={userId} />;
}
