import { ContractDispositionForm } from "@/components/contracts/ContractDispositionForm";
import { CreateContractForm } from "@/components/contracts/CreateContractForm";
import { computeActionDeadline } from "@/modules/contracts/renewal";
import * as contractsService from "@/modules/contracts/service";

export default async function OrganizationContractsPage(
  props: PageProps<"/organizations/[id]/contracts">,
) {
  const { id } = await props.params;
  const contracts = await contractsService.listContracts({ organizationId: id });

  return (
    <div>
      <CreateContractForm organizationId={id} />

      <table className="table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Status</th>
            <th>End date</th>
            <th>Action deadline</th>
            <th>Auto-renew</th>
            <th>Disposition</th>
            <th>Owner</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {contracts.map((contract) => {
            const deadline = computeActionDeadline(contract);
            return (
              <tr key={contract.id}>
                <td>{contract.type}</td>
                <td>{contract.status}</td>
                <td>{contract.endDate?.toISOString().slice(0, 10) ?? "—"}</td>
                <td>{deadline?.toISOString().slice(0, 10) ?? "—"}</td>
                <td>{contract.autoRenew ? "Yes" : "No"}</td>
                <td>{contract.renewalDisposition}</td>
                <td>{contract.owner?.name ?? "Unassigned"}</td>
                <td>
                  <ContractDispositionForm contractId={contract.id} />
                </td>
              </tr>
            );
          })}
          {contracts.length === 0 && (
            <tr>
              <td colSpan={8} className="home__empty-state">
                No contracts yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
