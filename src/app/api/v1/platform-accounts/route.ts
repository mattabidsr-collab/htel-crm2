import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { requireRole, toErrorResponse } from "@/lib/api-auth";
import {
  createPlatformAccountSchema,
  listPlatformAccountsQuerySchema,
} from "@/modules/platform-accounts/schema";
import * as platformAccountsService from "@/modules/platform-accounts/service";

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

    const query = listPlatformAccountsQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );
    const accounts = await platformAccountsService.listPlatformAccounts(query);
    return NextResponse.json({ data: accounts });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(UserRole.ADMINISTRATOR, UserRole.OPERATIONS_LEADER);

    const body = createPlatformAccountSchema.parse(await request.json());
    const account = await platformAccountsService.createPlatformAccount(body, user.id);
    return NextResponse.json({ data: account }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
