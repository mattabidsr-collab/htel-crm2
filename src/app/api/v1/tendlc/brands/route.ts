import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { z } from "zod";

import { requireRole, toErrorResponse } from "@/lib/api-auth";
import { createTenDlcBrandSchema } from "@/modules/tendlc/schema";
import * as tendlcService from "@/modules/tendlc/service";

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

    const { organizationId } = z
      .object({ organizationId: z.string().uuid() })
      .parse(Object.fromEntries(request.nextUrl.searchParams));
    const brands = await tendlcService.listBrands(organizationId);
    return NextResponse.json({ data: brands });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(UserRole.ADMINISTRATOR, UserRole.OPERATIONS_LEADER, UserRole.SUPPORT);

    const body = createTenDlcBrandSchema.parse(await request.json());
    const brand = await tendlcService.createBrand(body, user.id);
    return NextResponse.json({ data: brand }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
