import { CreateSiteForm } from "@/components/organizations/CreateSiteForm";
import * as sitesService from "@/modules/sites/service";

export default async function OrganizationSitesPage(
  props: PageProps<"/organizations/[id]/sites">,
) {
  const { id } = await props.params;
  const sites = await sitesService.listSites({ organizationId: id, take: 100 });

  return (
    <div>
      <CreateSiteForm organizationId={id} />

      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Status</th>
            <th>City</th>
            <th>State</th>
            <th>Timezone</th>
          </tr>
        </thead>
        <tbody>
          {sites.map((site) => (
            <tr key={site.id}>
              <td>{site.name}</td>
              <td>{site.status}</td>
              <td>{site.serviceCity ?? "—"}</td>
              <td>{site.serviceState ?? "—"}</td>
              <td>{site.timezone}</td>
            </tr>
          ))}
          {sites.length === 0 && (
            <tr>
              <td colSpan={5} className="home__empty-state">
                No sites yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
