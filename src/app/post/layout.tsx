import Sidebar from '@/components/Sidebar';

export default function PostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Sidebar>{children}</Sidebar>;
}
