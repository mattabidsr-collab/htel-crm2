import { notFound } from "next/navigation";

import { OrgTabs } from "@/components/OrgTabs";
import * as organizationsService from "@/modules/organizations/service";
import { calcMrr } from "@/modules/telecom/metrics";

export default async function OrganizationLayout(
  props: LayoutProps<"/organizations/[id]">,
) {
  const { id } = await props.params;
  const [organization, mrr] = await Promise.all([
    organizationsService.getOrganization(id),
    calcMrr(id),
  ]);
  if (!organization) notFound();

  return (
    <div>
      <div className="org-header">
        <div>
          <h1>{organization.name}</h1>
          <p className="org-header__meta">
            {organization.dba && <span>DBA {organization.dba} · </span>}
            {organization.parent && <span>Part of {organization.parent.name} · </span>}
            {organization.vertical && <span>{organization.vertical} · </span>}
            <span className="badge">{organization.lifecycleStatus}</span>
          </p>
        </div>
        <dl className="org-header__stats">
          <div>
            <dt>Owner</dt>
            <dd>{organization.owner?.name ?? "Unassigned"}</dd>
          </div>
          <div>
            <dt>MRR</dt>
            <dd>${mrr.mrr.toFixed(2)}</dd>
          </div>
          <div>
            <dt>Est. margin</dt>
            <dd>{mrr.estimatedMargin === null ? "Incomplete" : `$${mrr.estimatedMargin.toFixed(2)}`}</dd>
          </div>
          <div>
            <dt>Health</dt>
            <dd>Not yet available</dd>
          </div>
        </dl>
      </div>

      <OrgTabs organizationId={organization.id} />

      {props.children}
    </div>
  );
}
