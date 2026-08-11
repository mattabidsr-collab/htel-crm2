import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { requireRole, toErrorResponse } from "@/lib/api-auth";
import { createContractSchema, listContractsQuerySchema } from "@/modules/contracts/schema";
import * as contractsService from "@/modules/contracts/service";

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

    const query = listContractsQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
    const contracts = await contractsService.listContracts(query);
    return NextResponse.json({ data: contracts });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(UserRole.ADMINISTRATOR, UserRole.OPERATIONS_LEADER, UserRole.BILLING_ADMIN);

    const body = createContractSchema.parse(await request.json());
    const contract = await contractsService.createContract(body, user.id);
    return NextResponse.json({ data: contract }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
