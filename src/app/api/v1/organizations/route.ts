import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { requireRole, toErrorResponse } from "@/lib/api-auth";
import { createOrganizationSchema, listOrganizationsQuerySchema } from "@/modules/organizations/schema";
import * as organizationsService from "@/modules/organizations/service";

export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(
      UserRole.ADMINISTRATOR,
      UserRole.OPERATIONS_LEADER,
      UserRole.SALES,
      UserRole.SUPPORT,
      UserRole.BILLING_ADMIN,
      UserRole.READ_ONLY,
    );
    void user;

    const query = listOrganizationsQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );
    const organizations = await organizationsService.listOrganizations(query);
    return NextResponse.json({ data: organizations });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(UserRole.ADMINISTRATOR, UserRole.OPERATIONS_LEADER, UserRole.SALES);

    const body = createOrganizationSchema.parse(await request.json());
    const organization = await organizationsService.createOrganization(body, user.id);
    return NextResponse.json({ data: organization }, { status: 201 });
  } catch (error) {
    if (error instanceof organizationsService.DuplicateOrganizationError) {
      return NextResponse.json(
        { error: error.message, existingId: error.existingId },
        { status: 409 },
      );
    }
    return toErrorResponse(error);
  }
}
