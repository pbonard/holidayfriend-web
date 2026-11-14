import { Suspense } from 'react';

// the explore screens wait inside this suspense for what's only there on request: the role tab (?role=, the
// query string) of /explore and a city's screen, and a post's id (/explore/jp/tokyo/{id}, not known ahead). what's
// prerendered is the sidebar around them
export default function ExploreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Suspense>{children}</Suspense>;
}
