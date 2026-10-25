import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import RouteTransition from "../components/RouteTransition";
import "./globals.css";

export const metadata: Metadata = {
  title: "TETO'Clock",
  description: "Full Steam Ahead: It's TETO'Clock!",
  icons: {
    icon: "/teto-favicon.png",
    shortcut: "/teto-favicon.png",
    apple: "/teto-favicon.png",
  },
  openGraph: {
    title: "TETO'Clock",
    description: "Full Steam Ahead: It's TETO'Clock!",
  },
  twitter: {
    title: "TETO'Clock",
    description: "Full Steam Ahead: It's TETO'Clock!",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider>
          <RouteTransition>{children}</RouteTransition>
        </ClerkProvider>
      </body>
    </html>
  );
}