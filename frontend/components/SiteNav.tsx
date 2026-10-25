"use client";

import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SiteNav() {
  const pathname = usePathname();
  const dashboard = pathname === "/my-tetoclock";

  return (
    <header className={`site-header${dashboard ? " site-header--solid" : ""}`}>
      <Link className="brand" href="/" aria-label="TETO'Clock home">
        <span className="brand-mark" aria-hidden="true">
          T
        </span>
        <span>TETO&apos;Clock</span>
      </Link>
      <nav className="main-nav" aria-label="Main navigation">
        <Link className={!dashboard ? "nav-link nav-link--active" : "nav-link"} href="/">
          Home
        </Link>
        <Link
          className={dashboard ? "nav-link nav-link--active" : "nav-link"}
          href="/my-tetoclock"
        >
          My TetoClock
        </Link>
      </nav>
      <Link className="nav-cta" href="/my-tetoclock">
        Wake up with Teto <span aria-hidden="true">↗</span>
      </Link>
      <div className="auth-controls">
        <SignedOut>
          <SignInButton mode="modal">
            <button className="auth-link" type="button">Sign in</button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="auth-signup" type="button">Create account</button>
          </SignUpButton>
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </div>
    </header>
  );
}
