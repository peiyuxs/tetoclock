"use client";

import { usePathname } from "next/navigation";

export default function RouteTransition({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  return (
    <div className="route-transition" key={pathname}>
      {children}
    </div>
  );
}
