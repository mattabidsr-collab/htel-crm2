import { db } from "@/lib/db";
import type {
  CreateContractInput,
  ListContractsQuery,
  UpdateContractInput,
} from "@/modules/contracts/schema";

export function createContract(input: CreateContractInput) {
  return db.contract.create({ data: input });
}

export function findContractById(id: string) {
  return db.contract.findUnique({ where: { id } });
}

export function updateContract(id: string, data: UpdateContractInput) {
  return db.contract.update({ where: { id }, data });
}

export function listContracts(query: ListContractsQuery) {
  return db.contract.findMany({
    where: { organizationId: query.organizationId },
    include: { owner: { select: { id: true, name: true } } },
    orderBy: { endDate: "asc" },
  });
}

export function listAllActiveContractsWithEndDate() {
  return db.contract.findMany({
    where: { endDate: { not: null }, status: { in: ["ACTIVE", "DRAFT"] } },
    include: {
      organization: { select: { id: true, name: true } },
      owner: { select: { id: true, name: true } },
    },
    orderBy: { endDate: "asc" },
  });
}
