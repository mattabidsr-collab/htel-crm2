import { recordAuditEvent } from "@/lib/audit";
import * as contactsRepo from "@/modules/contacts/repository";
import type { CreateContactInput, ListContactsQuery } from "@/modules/contacts/schema";

export class DuplicateContactError extends Error {
  constructor(public existingId: string) {
    super("A contact with this email already exists");
  }
}

export async function createContact(input: CreateContactInput, actorId: string) {
  if (input.emails.length > 0) {
    const duplicates = await contactsRepo.findContactsByEmail(input.emails);
    if (duplicates.length > 0) {
      throw new DuplicateContactError(duplicates[0].id);
    }
  }

  const { contact, affiliation } = await contactsRepo.createContactWithAffiliation(input);

  await recordAuditEvent({
    actorId,
    action: "contact.create",
    entityType: "Contact",
    entityId: contact.id,
    after: { contact, affiliation },
  });

  return contact;
}

export function listContacts(query: ListContactsQuery) {
  return contactsRepo.listContacts(query);
}

export function listContactsForOrganization(organizationId: string, take = 100) {
  return contactsRepo.listContactsForOrganization(organizationId, take);
}
