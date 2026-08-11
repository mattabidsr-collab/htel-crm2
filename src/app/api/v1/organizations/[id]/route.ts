import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { requireRole, toErrorResponse } from "@/lib/api-auth";
import * as organizationsService from "@/modules/organizations/service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole(
      UserRole.ADMINISTRATOR,
      UserRole.OPERATIONS_LEADER,
      UserRole.SALES,
      UserRole.SUPPORT,
      UserRole.BILLING_ADMIN,
      UserRole.READ_ONLY,
    );

    const { id } = await params;
    const organization = await organizationsService.getOrganization(id);
    if (!organization) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ data: organization });
  } catch (error) {
    return toErrorResponse(error);
  }
}
