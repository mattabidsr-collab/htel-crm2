import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { z } from "zod";

import { requireRole, toErrorResponse } from "@/lib/api-auth";
import * as reviewService from "@/modules/email/review";

const bodySchema = z.object({ reason: z.string().optional() });

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole(
      UserRole.ADMINISTRATOR,
      UserRole.OPERATIONS_LEADER,
      UserRole.SALES,
      UserRole.SUPPORT,
    );
    const { id } = await params;
    const { reason } = bodySchema.parse(await request.json());
    const thread = await reviewService.excludeThread(id, user.id, reason);
    return NextResponse.json({ data: thread });
  } catch (error) {
    if (error instanceof reviewService.ThreadNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return toErrorResponse(error);
  }
}
