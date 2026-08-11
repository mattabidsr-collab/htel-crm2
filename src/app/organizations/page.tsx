import Link from "next/link";

import { CreateOrganizationForm } from "@/components/organizations/CreateOrganizationForm";
import * as organizationsService from "@/modules/organizations/service";

export default async function OrganizationsPage(props: PageProps<"/organizations">) {
  const searchParams = await props.searchParams;
  const q = typeof searchParams.q === "string" ? searchParams.q : undefined;

  const organizations = await organizationsService.listOrganizations({ q, take: 100 });

  return (
    <div>
      <h1>Organizations</h1>

      <div className="org-list__toolbar">
        <form method="get">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Filter by name, legal name, or DBA…"
            className="search-box"
          />
        </form>
        <CreateOrganizationForm />
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Lifecycle</th>
            <th>Vertical</th>
          </tr>
        </thead>
        <tbody>
          {organizations.map((org) => (
            <tr key={org.id}>
              <td>
                <Link href={`/organizations/${org.id}`}>{org.name}</Link>
                {org.dba && <span className="org-list__dba"> ({org.dba})</span>}
              </td>
              <td>{org.types.join(", ")}</td>
              <td>{org.lifecycleStatus}</td>
              <td>{org.vertical ?? "—"}</td>
            </tr>
          ))}
          {organizations.length === 0 && (
            <tr>
              <td colSpan={4} className="home__empty-state">
                No organizations yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
