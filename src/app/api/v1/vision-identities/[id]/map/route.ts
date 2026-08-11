import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { z } from "zod";

import { requireRole, toErrorResponse } from "@/lib/api-auth";
import * as mappingService from "@/modules/vision/mapping";

const bodySchema = z.object({ organizationId: z.string().uuid() });

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole(UserRole.ADMINISTRATOR, UserRole.OPERATIONS_LEADER, UserRole.SUPPORT);
    const { id } = await params;
    const { organizationId } = bodySchema.parse(await request.json());
    const mapping = await mappingService.mapIdentity(id, organizationId, user.id);
    return NextResponse.json({ data: mapping });
  } catch (error) {
    if (error instanceof mappingService.MappingNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return toErrorResponse(error);
  }
}
