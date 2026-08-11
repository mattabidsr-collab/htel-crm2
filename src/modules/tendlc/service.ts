import { recordAuditEvent } from "@/lib/audit";
import * as tendlcRepo from "@/modules/tendlc/repository";
import type { CreateTenDlcBrandInput, CreateTenDlcCampaignInput } from "@/modules/tendlc/schema";

export async function createBrand(input: CreateTenDlcBrandInput, actorId: string) {
  const brand = await tendlcRepo.createBrand(input);
  await recordAuditEvent({
    actorId,
    action: "tendlc_brand.create",
    entityType: "TenDlcBrand",
    entityId: brand.id,
    after: brand,
  });
  return brand;
}

export function listBrands(organizationId: string) {
  return tendlcRepo.listBrands(organizationId);
}

export class BrandNotFoundError extends Error {
  constructor() {
    super("10DLC brand not found");
  }
}

export async function createCampaign(
  brandId: string,
  input: CreateTenDlcCampaignInput,
  actorId: string,
) {
  const brand = await tendlcRepo.findBrandById(brandId);
  if (!brand) throw new BrandNotFoundError();

  const campaign = await tendlcRepo.createCampaign(brandId, input);
  await recordAuditEvent({
    actorId,
    action: "tendlc_campaign.create",
    entityType: "TenDlcCampaign",
    entityId: campaign.id,
    after: campaign,
  });
  return campaign;
}
