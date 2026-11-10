import Sidebar from '@/components/Sidebar';

export default function PostsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Sidebar>{children}</Sidebar>;
}
