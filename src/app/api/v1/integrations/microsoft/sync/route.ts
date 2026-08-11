import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { requireRole, toErrorResponse } from "@/lib/api-auth";
import { syncAllMailboxes } from "@/modules/email/sync";

export async function POST() {
  try {
    const user = await requireRole(UserRole.ADMINISTRATOR);
    const results = await syncAllMailboxes(user.id);
    return NextResponse.json({ data: results });
  } catch (error) {
    return toErrorResponse(error);
  }
}
