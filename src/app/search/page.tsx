import Link from "next/link";

import { searchAll } from "@/modules/search/service";

export default async function SearchPage(props: PageProps<"/search">) {
  const searchParams = await props.searchParams;
  const q = typeof searchParams.q === "string" ? searchParams.q : "";
  const results = q ? await searchAll(q) : { organizations: [], sites: [], contacts: [] };

  return (
    <div>
      <h1>Search results for &ldquo;{q}&rdquo;</h1>

      <section className="home__card">
        <h2>Organizations ({results.organizations.length})</h2>
        <ul>
          {results.organizations.map((org) => (
            <li key={org.id}>
              <Link href={`/organizations/${org.id}`}>{org.name}</Link>
              {org.dba && ` (${org.dba})`}
            </li>
          ))}
        </ul>
      </section>

      <section className="home__card">
        <h2>Sites ({results.sites.length})</h2>
        <ul>
          {results.sites.map((site) => (
            <li key={site.id}>
              <Link href={`/organizations/${site.organizationId}/sites`}>
                {site.name} — {site.organization.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="home__card">
        <h2>Contacts ({results.contacts.length})</h2>
        <ul>
          {results.contacts.map((contact) => (
            <li key={contact.id}>
              {contact.affiliations[0] ? (
                <Link href={`/organizations/${contact.affiliations[0].organization.id}/contacts`}>
                  {contact.firstName} {contact.lastName} — {contact.affiliations[0].organization.name}
                </Link>
              ) : (
                <span>
                  {contact.firstName} {contact.lastName}
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>

      {results.organizations.length === 0 &&
        results.sites.length === 0 &&
        results.contacts.length === 0 && <p className="home__empty-state">No matches.</p>}
    </div>
  );
}
