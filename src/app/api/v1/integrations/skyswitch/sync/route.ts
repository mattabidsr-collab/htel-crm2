import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { requireRole, toErrorResponse } from "@/lib/api-auth";
import { syncSkySwitchCallLogs } from "@/integrations/skyswitch/sync";

export async function POST() {
  try {
    const user = await requireRole(UserRole.ADMINISTRATOR, UserRole.OPERATIONS_LEADER);
    const result = await syncSkySwitchCallLogs(user.id);
    return NextResponse.json({ data: result });
  } catch (error) {
    return toErrorResponse(error);
  }
}
