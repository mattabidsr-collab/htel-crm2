"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { slug: "", label: "Overview" },
  { slug: "sites", label: "Sites" },
  { slug: "contacts", label: "Contacts" },
  { slug: "telecom", label: "Telecom" },
  { slug: "contracts", label: "Contracts & Billing" },
  { slug: "vision-tickets", label: "Vision Tickets" },
  { slug: "opportunities", label: "Opportunities" },
  { slug: "activity", label: "Activity" },
];

export function OrgTabs({ organizationId }: { organizationId: string }) {
  const pathname = usePathname();
  const base = `/organizations/${organizationId}`;

  return (
    <nav className="tabs">
      {TABS.map((tab) => {
        const href = tab.slug ? `${base}/${tab.slug}` : base;
        const active = pathname === href;
        return (
          <Link key={tab.slug} href={href} className={active ? "active" : undefined}>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
