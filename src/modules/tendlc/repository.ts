import { db } from "@/lib/db";
import type { CreateTenDlcBrandInput, CreateTenDlcCampaignInput } from "@/modules/tendlc/schema";

export function createBrand(input: CreateTenDlcBrandInput) {
  return db.tenDlcBrand.create({ data: input });
}

export function listBrands(organizationId: string) {
  return db.tenDlcBrand.findMany({
    where: { organizationId },
    include: { campaigns: true },
    orderBy: { createdAt: "asc" },
  });
}

export function findBrandById(id: string) {
  return db.tenDlcBrand.findUnique({ where: { id } });
}

export function createCampaign(brandId: string, input: CreateTenDlcCampaignInput) {
  return db.tenDlcCampaign.create({ data: { ...input, brandId } });
}
