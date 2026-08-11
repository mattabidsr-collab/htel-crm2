import { recordAuditEvent } from "@/lib/audit";
import * as contractsRepo from "@/modules/contracts/repository";
import { regenerateRenewalAlertTasks } from "@/modules/contracts/renewal";
import type {
  CreateContractInput,
  ListContractsQuery,
  UpdateContractInput,
} from "@/modules/contracts/schema";

export async function createContract(input: CreateContractInput, actorId: string) {
  const contract = await contractsRepo.createContract(input);

  await recordAuditEvent({
    actorId,
    action: "contract.create",
    entityType: "Contract",
    entityId: contract.id,
    after: contract,
  });

  if (contract.endDate) {
    await regenerateRenewalAlertTasks(
      contract.id,
      contract.organizationId,
      contract.ownerId ?? actorId,
      actorId,
      contract,
    );
  }

  return contract;
}

export class ContractNotFoundError extends Error {
  constructor() {
    super("Contract not found");
  }
}

export async function updateContract(id: string, input: UpdateContractInput, actorId: string) {
  const before = await contractsRepo.findContractById(id);
  if (!before) throw new ContractNotFoundError();

  const contract = await contractsRepo.updateContract(id, input);

  await recordAuditEvent({
    actorId,
    action: "contract.update",
    entityType: "Contract",
    entityId: id,
    before: {
      status: before.status,
      endDate: before.endDate,
      renewalDisposition: before.renewalDisposition,
    },
    after: {
      status: contract.status,
      endDate: contract.endDate,
      renewalDisposition: contract.renewalDisposition,
    },
  });

  if (contract.endDate) {
    await regenerateRenewalAlertTasks(
      contract.id,
      contract.organizationId,
      contract.ownerId ?? actorId,
      actorId,
      contract,
    );
  }

  return contract;
}

export function listContracts(query: ListContractsQuery) {
  return contractsRepo.listContracts(query);
}

export function listRenewalWorkspace() {
  return contractsRepo.listAllActiveContractsWithEndDate();
}
