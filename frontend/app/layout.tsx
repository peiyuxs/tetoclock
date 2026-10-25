import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import RouteTransition from "../components/RouteTransition";
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
      <body>
        <ClerkProvider>
          <RouteTransition>{children}</RouteTransition>
        </ClerkProvider>
      </body>
    </html>
  );
}