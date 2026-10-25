import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TETO'Clock — Full Steam Ahead",
  description:
    "Meet TETO'Clock: a friendlier way to wake up, powered by Kasane Teto and a little Arduino magic.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
