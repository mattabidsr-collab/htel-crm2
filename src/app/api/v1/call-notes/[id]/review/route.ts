import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { requireRole, toErrorResponse } from "@/lib/api-auth";
import { completeCallNoteReviewSchema } from "@/modules/call-notes/schema";
import * as callNotesService from "@/modules/call-notes/service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireRole(
      UserRole.ADMINISTRATOR,
      UserRole.OPERATIONS_LEADER,
      UserRole.SALES,
      UserRole.SUPPORT,
      UserRole.BILLING_ADMIN,
    );

    const { id } = await params;
    const body = completeCallNoteReviewSchema.parse(await request.json());
    const callNote = await callNotesService.completeCallNoteReview(id, body, user.id);
    return NextResponse.json({ data: callNote });
  } catch (error) {
    if (error instanceof callNotesService.CallNoteNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return toErrorResponse(error);
  }
}
