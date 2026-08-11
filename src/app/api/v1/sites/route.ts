import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { requireRole, toErrorResponse } from "@/lib/api-auth";
import { createSiteSchema, listSitesQuerySchema } from "@/modules/sites/schema";
import * as sitesService from "@/modules/sites/service";

export async function GET(request: NextRequest) {
  try {
    await requireRole(
      UserRole.ADMINISTRATOR,
      UserRole.OPERATIONS_LEADER,
      UserRole.SALES,
      UserRole.SUPPORT,
      UserRole.BILLING_ADMIN,
      UserRole.READ_ONLY,
    );

    const query = listSitesQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
    const sites = await sitesService.listSites(query);
    return NextResponse.json({ data: sites });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(UserRole.ADMINISTRATOR, UserRole.OPERATIONS_LEADER, UserRole.SALES);

    const body = createSiteSchema.parse(await request.json());
    const site = await sitesService.createSite(body, user.id);
    return NextResponse.json({ data: site }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
