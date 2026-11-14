import type { Metadata } from 'next';
import Invites from '@/components/invite/Invites';

export const metadata: Metadata = {
  title: 'Invites · Holidayfriend',
};

// /invites: the people who said hi to the viewer, to accept or decline
export default function InvitesPage() {
  return <Invites />;
}
