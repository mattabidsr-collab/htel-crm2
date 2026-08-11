import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { requireRole, toErrorResponse } from "@/lib/api-auth";
import { createTenDlcCampaignSchema } from "@/modules/tendlc/schema";
import * as tendlcService from "@/modules/tendlc/service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ brandId: string }> },
) {
  try {
    const user = await requireRole(UserRole.ADMINISTRATOR, UserRole.OPERATIONS_LEADER, UserRole.SUPPORT);

    const { brandId } = await params;
    const body = createTenDlcCampaignSchema.parse(await request.json());
    const campaign = await tendlcService.createCampaign(brandId, body, user.id);
    return NextResponse.json({ data: campaign }, { status: 201 });
  } catch (error) {
    if (error instanceof tendlcService.BrandNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return toErrorResponse(error);
  }
}
