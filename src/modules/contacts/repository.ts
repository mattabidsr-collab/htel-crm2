import { db } from "@/lib/db";
import type { CreateContactInput, ListContactsQuery } from "@/modules/contacts/schema";

// ACC-06: duplicate detection on normalized email during entry.
export function findContactsByEmail(emails: string[]) {
  if (emails.length === 0) return Promise.resolve([]);
  return db.contact.findMany({
    where: { deletedAt: null, emails: { hasSome: emails.map((e) => e.toLowerCase()) } },
  });
}

export function createContactWithAffiliation(input: CreateContactInput) {
  return db.$transaction(async (tx) => {
    const contact = await tx.contact.create({
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        emails: input.emails.map((e) => e.toLowerCase()),
        phones: input.phones,
        preferredChannel: input.preferredChannel,
        emailOptIn: input.emailOptIn,
        smsOptIn: input.smsOptIn,
      },
    });

    const affiliation = await tx.contactAffiliation.create({
      data: {
        contactId: contact.id,
        organizationId: input.organizationId,
        siteId: input.siteId,
        role: input.role,
        title: input.title,
        isPrimary: input.isPrimary,
      },
    });

    return { contact, affiliation };
  });
}

export function listContactsForOrganization(organizationId: string, take: number) {
  return db.contact.findMany({
    where: { deletedAt: null, affiliations: { some: { organizationId } } },
    include: { affiliations: { where: { organizationId } } },
    take,
    orderBy: { lastName: "asc" },
  });
}

export function listContacts(query: ListContactsQuery) {
  if (query.organizationId) {
    return listContactsForOrganization(query.organizationId, query.take);
  }
  return db.contact.findMany({
    where: { deletedAt: null },
    take: query.take,
    orderBy: { lastName: "asc" },
  });
}
