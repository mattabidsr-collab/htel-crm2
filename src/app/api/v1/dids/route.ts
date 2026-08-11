import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { requireRole, toErrorResponse } from "@/lib/api-auth";
import { createDidSchema, listDidsQuerySchema } from "@/modules/dids/schema";
import * as didsService from "@/modules/dids/service";

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

    const query = listDidsQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
    const dids = await didsService.listDids(query);
    return NextResponse.json({ data: dids });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(UserRole.ADMINISTRATOR, UserRole.OPERATIONS_LEADER, UserRole.SUPPORT);

    const body = createDidSchema.parse(await request.json());
    const did = await didsService.createDid(body, user.id);
    return NextResponse.json({ data: did }, { status: 201 });
  } catch (error) {
    if (error instanceof didsService.DuplicateDidError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return toErrorResponse(error);
  }
}
