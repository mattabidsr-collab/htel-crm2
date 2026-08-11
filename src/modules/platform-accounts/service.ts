import { recordAuditEvent } from "@/lib/audit";
import * as platformAccountsRepo from "@/modules/platform-accounts/repository";
import type {
  CreatePlatformAccountInput,
  ListPlatformAccountsQuery,
} from "@/modules/platform-accounts/schema";

export async function createPlatformAccount(input: CreatePlatformAccountInput, actorId: string) {
  const account = await platformAccountsRepo.createPlatformAccount(input);

  await recordAuditEvent({
    actorId,
    action: "platform_account.create",
    entityType: "PlatformAccount",
    entityId: account.id,
    after: account,
  });

  return account;
}

export function listPlatformAccounts(query: ListPlatformAccountsQuery) {
  return platformAccountsRepo.listPlatformAccounts(query);
}
