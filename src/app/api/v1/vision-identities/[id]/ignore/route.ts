import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { requireRole, toErrorResponse } from "@/lib/api-auth";
import * as mappingService from "@/modules/vision/mapping";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole(UserRole.ADMINISTRATOR, UserRole.OPERATIONS_LEADER, UserRole.SUPPORT);
    const { id } = await params;
    const mapping = await mappingService.ignoreIdentity(id, user.id);
    return NextResponse.json({ data: mapping });
  } catch (error) {
    if (error instanceof mappingService.MappingNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return toErrorResponse(error);
  }
}
