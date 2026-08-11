import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { requireRole, toErrorResponse } from "@/lib/api-auth";
import { createMailboxSchema } from "@/modules/mailboxes/schema";
import * as mailboxesService from "@/modules/mailboxes/service";

export async function GET() {
  try {
    await requireRole(UserRole.ADMINISTRATOR);
    const mailboxes = await mailboxesService.listMailboxes();
    return NextResponse.json({ data: mailboxes });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(UserRole.ADMINISTRATOR);
    const body = createMailboxSchema.parse(await request.json());
    const mailbox = await mailboxesService.createMailbox(body, user.id);
    return NextResponse.json({ data: mailbox }, { status: 201 });
  } catch (error) {
    if (error instanceof mailboxesService.DuplicateMailboxError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return toErrorResponse(error);
  }
}
