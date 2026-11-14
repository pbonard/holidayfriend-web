import Tab from '@/components/Tab';

export default function PostsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Tab>{children}</Tab>;
}
