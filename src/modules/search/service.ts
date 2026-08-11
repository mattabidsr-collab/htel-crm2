import { db } from "@/lib/db";

// ADM-04: global search across organizations, sites, contacts, and DIDs
// (name, DBA, email, phone, number). Vision ticket IDs and domains join in
// as those modules land in later stages. Simple ILIKE/contains for MVP
// scale; move to Postgres trigram indexes if this gets slow (section 12).
export async function searchAll(query: string) {
  if (query.trim().length < 2) {
    return { organizations: [], sites: [], contacts: [], dids: [] };
  }

  const [organizations, sites, contacts, dids] = await Promise.all([
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
    db.dID.findMany({
      where: { number: { contains: query } },
      include: { organization: { select: { id: true, name: true } } },
      take: 10,
    }),
  ]);

  return { organizations, sites, contacts, dids };
}
