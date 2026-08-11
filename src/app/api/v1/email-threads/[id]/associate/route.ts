import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { z } from "zod";

import { requireRole, toErrorResponse } from "@/lib/api-auth";
import * as reviewService from "@/modules/email/review";

const bodySchema = z.object({ organizationId: z.string().uuid(), reason: z.string().optional() });

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole(
      UserRole.ADMINISTRATOR,
      UserRole.OPERATIONS_LEADER,
      UserRole.SALES,
      UserRole.SUPPORT,
    );
    const { id } = await params;
    const { organizationId, reason } = bodySchema.parse(await request.json());
    const thread = await reviewService.associateThread(id, organizationId, user.id, reason);
    return NextResponse.json({ data: thread });
  } catch (error) {
    if (error instanceof reviewService.ThreadNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return toErrorResponse(error);
  }
}
