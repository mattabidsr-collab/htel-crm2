import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

import { auth } from "@/lib/auth";
import { LogoutButton } from "@/components/LogoutButton";
import { SearchBox } from "@/components/SearchBox";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Heritage CRM",
  description: "Heritage Telecom's operational system of record.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await auth();

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <header className="app-header">
          <span className="app-header__brand">Heritage CRM</span>
          {session?.user && (
            <>
              <nav className="app-header__nav">
                <Link href="/">My Work</Link>
                <Link href="/organizations">Organizations</Link>
                <Link href="/renewals">Renewals</Link>
                {session.user.role === "ADMINISTRATOR" && (
                  <>
                    <Link href="/admin/users">Users</Link>
                    <Link href="/admin/audit-log">Audit Log</Link>
                  </>
                )}
              </nav>
              <div className="app-header__search">
                <SearchBox />
              </div>
              <div className="app-header__user">
                <span>{session.user.email}</span>
                <span className="badge">{session.user.role}</span>
                <LogoutButton />
              </div>
            </>
          )}
        </header>
        <main className="app-main">{children}</main>
      </body>
    </html>
  );
}
