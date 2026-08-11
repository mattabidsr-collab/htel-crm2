import { CreateDidForm } from "@/components/telecom/CreateDidForm";
import { CreatePlatformAccountForm } from "@/components/telecom/CreatePlatformAccountForm";
import { CreatePortProjectForm } from "@/components/telecom/CreatePortProjectForm";
import { CreateServiceForm } from "@/components/telecom/CreateServiceForm";
import { CreateTenDlcBrandForm } from "@/components/telecom/CreateTenDlcBrandForm";
import { CreateTenDlcCampaignForm } from "@/components/telecom/CreateTenDlcCampaignForm";
import * as didsService from "@/modules/dids/service";
import * as platformAccountsService from "@/modules/platform-accounts/service";
import * as portsService from "@/modules/ports/service";
import * as servicesService from "@/modules/services/service";
import * as tendlcService from "@/modules/tendlc/service";
import { getComplianceExceptions } from "@/modules/telecom/compliance";
import { calcMrr, calcSeatAndDidCounts } from "@/modules/telecom/metrics";

export default async function OrganizationTelecomPage(
  props: PageProps<"/organizations/[id]/telecom">,
) {
  const { id } = await props.params;

  const [platformAccounts, services, dids, brands, ports, exceptions, mrr, counts] =
    await Promise.all([
      platformAccountsService.listPlatformAccounts({ organizationId: id }),
      servicesService.listServices({ organizationId: id }),
      didsService.listDids({ organizationId: id }),
      tendlcService.listBrands(id),
      portsService.listPortProjects(id),
      getComplianceExceptions(id),
      calcMrr(id),
      calcSeatAndDidCounts(id),
    ]);

  return (
    <div>
      <section className="home__card">
        <h2>Summary</h2>
        <dl className="org-header__stats">
          <div>
            <dt>MRR</dt>
            <dd>${mrr.mrr.toFixed(2)}</dd>
          </div>
          <div>
            <dt>Est. cost</dt>
            <dd>{mrr.estimatedCost === null ? "Incomplete" : `$${mrr.estimatedCost.toFixed(2)}`}</dd>
          </div>
          <div>
            <dt>Active seats</dt>
            <dd>{counts.activeSeats}</dd>
          </div>
          <div>
            <dt>Active DIDs</dt>
            <dd>{counts.activeDids}</dd>
          </div>
        </dl>
      </section>

      {exceptions.length > 0 && (
        <section className="home__card telecom-exceptions">
          <h2>Compliance exceptions ({exceptions.length})</h2>
          <ul>
            {exceptions.map((exc) => (
              <li key={`${exc.type}-${exc.didId}`}>
                <strong>{exc.number}</strong>: {exc.detail}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="home__card">
        <h2>Platform accounts ({platformAccounts.length})</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Provider</th>
              <th>Account ID</th>
              <th>NetSapiens domain</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {platformAccounts.map((account) => (
              <tr key={account.id}>
                <td>{account.provider}</td>
                <td>{account.providerAccountId ?? "—"}</td>
                <td>{account.netsapiensDomain ?? "—"}</td>
                <td>{account.status}</td>
              </tr>
            ))}
            {platformAccounts.length === 0 && (
              <tr>
                <td colSpan={4} className="home__empty-state">
                  No platform accounts yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <CreatePlatformAccountForm organizationId={id} />
      </section>

      <section className="home__card">
        <h2>Services ({services.length})</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Status</th>
              <th>Qty</th>
              <th>Unit price</th>
              <th>Unit cost</th>
              <th>Site</th>
            </tr>
          </thead>
          <tbody>
            {services.map((service) => (
              <tr key={service.id}>
                <td>{service.type}</td>
                <td>{service.status}</td>
                <td>{service.quantity}</td>
                <td>${Number(service.unitPrice).toFixed(2)}</td>
                <td>{service.unitCost === null ? "Incomplete" : `$${Number(service.unitCost).toFixed(2)}`}</td>
                <td>{service.site?.name ?? "—"}</td>
              </tr>
            ))}
            {services.length === 0 && (
              <tr>
                <td colSpan={6} className="home__empty-state">
                  No services yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <CreateServiceForm organizationId={id} />
      </section>

      <section className="home__card">
        <h2>DIDs ({dids.length})</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Number</th>
              <th>Status</th>
              <th>SMS</th>
              <th>E911</th>
              <th>Port</th>
            </tr>
          </thead>
          <tbody>
            {dids.map((did) => (
              <tr key={did.id}>
                <td>{did.number}</td>
                <td>{did.status}</td>
                <td>{did.smsStatus}</td>
                <td>{did.e911Status}</td>
                <td>{did.portStatus}</td>
              </tr>
            ))}
            {dids.length === 0 && (
              <tr>
                <td colSpan={5} className="home__empty-state">
                  No numbers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <CreateDidForm organizationId={id} />
      </section>

      <section className="home__card">
        <h2>10DLC brands &amp; campaigns ({brands.length})</h2>
        {brands.map((brand) => (
          <div key={brand.id} className="tendlc-brand">
            <p>
              <strong>{brand.legalName ?? "Unnamed brand"}</strong> — {brand.status}
            </p>
            <ul>
              {brand.campaigns.map((campaign) => (
                <li key={campaign.id}>
                  {campaign.useCase ?? "Campaign"} — {campaign.status}
                </li>
              ))}
              {brand.campaigns.length === 0 && <li className="home__empty-state">No campaigns yet.</li>}
            </ul>
            <CreateTenDlcCampaignForm brandId={brand.id} />
          </div>
        ))}
        {brands.length === 0 && <p className="home__empty-state">No 10DLC brands yet.</p>}
        <CreateTenDlcBrandForm organizationId={id} />
      </section>

      <section className="home__card">
        <h2>Porting projects ({ports.length})</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Losing carrier</th>
              <th>Status</th>
              <th>Numbers</th>
            </tr>
          </thead>
          <tbody>
            {ports.map((project) => (
              <tr key={project.id}>
                <td>{project.losingCarrier ?? "—"}</td>
                <td>{project.status}</td>
                <td>{project.items.map((item) => item.didNumber).join(", ")}</td>
              </tr>
            ))}
            {ports.length === 0 && (
              <tr>
                <td colSpan={3} className="home__empty-state">
                  No porting projects yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <CreatePortProjectForm organizationId={id} />
      </section>
    </div>
  );
}
