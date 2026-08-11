import { db } from "@/lib/db";

// ADM-04: global search across organizations, sites, and contacts (name,
// DBA, email, phone). DIDs, domains, and Vision ticket IDs join in as
// those modules land in later stages. Simple ILIKE for MVP scale; move to
// Postgres trigram indexes if this gets slow (section 12).
export async function searchAll(query: string) {
  if (query.trim().length < 2) {
    return { organizations: [], sites: [], contacts: [] };
  }

  const [organizations, sites, contacts] = await Promise.all([
    db.organization.findMany({
      where: {
        deletedAt: null,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { legalName: { contains: query, mode: "insensitive" } },
          { dba: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 10,
    }),
    db.site.findMany({
      where: {
        deletedAt: null,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { serviceCity: { contains: query, mode: "insensitive" } },
        ],
      },
      include: { organization: { select: { id: true, name: true } } },
      take: 10,
    }),
    db.contact.findMany({
      where: {
        deletedAt: null,
        OR: [
          { firstName: { contains: query, mode: "insensitive" } },
          { lastName: { contains: query, mode: "insensitive" } },
          // Array membership is exact-match only; a full email/phone paste
          // matches, but partial matches would need a raw unnest query.
          { emails: { hasSome: [query.toLowerCase()] } },
          { phones: { hasSome: [query] } },
        ],
      },
      include: { affiliations: { take: 1, include: { organization: { select: { id: true, name: true } } } } },
      take: 10,
    }),
  ]);

  return { organizations, sites, contacts };
}
