import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { requireRole, toErrorResponse } from "@/lib/api-auth";
import { syncVisionTickets } from "@/modules/vision/sync";

export async function POST() {
  try {
    const user = await requireRole(UserRole.ADMINISTRATOR, UserRole.OPERATIONS_LEADER);
    const result = await syncVisionTickets(user.id);
    return NextResponse.json({ data: result });
  } catch (error) {
    return toErrorResponse(error);
  }
}
