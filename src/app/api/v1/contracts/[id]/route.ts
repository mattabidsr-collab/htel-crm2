import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { requireRole, toErrorResponse } from "@/lib/api-auth";
import { updateContractSchema } from "@/modules/contracts/schema";
import * as contractsService from "@/modules/contracts/service";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole(UserRole.ADMINISTRATOR, UserRole.OPERATIONS_LEADER, UserRole.BILLING_ADMIN);

    const { id } = await params;
    const body = updateContractSchema.parse(await request.json());
    const contract = await contractsService.updateContract(id, body, user.id);
    return NextResponse.json({ data: contract });
  } catch (error) {
    if (error instanceof contractsService.ContractNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return toErrorResponse(error);
  }
}
