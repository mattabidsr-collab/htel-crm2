import { db } from "@/lib/db";
import type {
  CreatePlatformAccountInput,
  ListPlatformAccountsQuery,
} from "@/modules/platform-accounts/schema";

export function createPlatformAccount(input: CreatePlatformAccountInput) {
  return db.platformAccount.create({ data: input });
}

export function listPlatformAccounts(query: ListPlatformAccountsQuery) {
  return db.platformAccount.findMany({
    where: { organizationId: query.organizationId },
    orderBy: { createdAt: "asc" },
  });
}
