import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { requireRole, toErrorResponse } from "@/lib/api-auth";
import { createCallNoteSchema, listCallNotesQuerySchema } from "@/modules/call-notes/schema";
import * as callNotesService from "@/modules/call-notes/service";

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

    const { organizationId } = listCallNotesQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );
    const callNotes = await callNotesService.listCallNotes(organizationId);
    return NextResponse.json({ data: callNotes });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(
      UserRole.ADMINISTRATOR,
      UserRole.OPERATIONS_LEADER,
      UserRole.SALES,
      UserRole.SUPPORT,
      UserRole.BILLING_ADMIN,
    );

    const body = createCallNoteSchema.parse(await request.json());
    const callNote = await callNotesService.createCallNote(body, user.id);
    return NextResponse.json({ data: callNote }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
