"use client";

import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import Icon from "./Icon";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SiteNav() {
  const pathname = usePathname();
  const dashboard = pathname === "/my-tetoclock";

  return (
    <header className={`site-header${dashboard ? " site-header--solid" : ""}`}>
      <Link className="brand" href="/" aria-label="TETO'Clock home">
        <img className="brand-mark" src="/teto-logo.png" alt="" />
        <span className="brand-name"><span className="brand-name-highlight">TETO</span>&apos;Clock</span>
      </Link>
      <div className="header-actions">
        <nav className="main-nav" aria-label="Main navigation">
          <Link className={!dashboard ? "nav-link nav-link--active" : "nav-link"} href="/">
            Home
          </Link>
        </nav>
        <Link className="nav-cta" href="/my-tetoclock">
          My TetoClock <Icon name="arrow-up-right" />
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
      </div>
    </header>
  );
}
