import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { requireRole, toErrorResponse } from "@/lib/api-auth";
import { inviteUserSchema } from "@/modules/users/schema";
import * as usersService from "@/modules/users/service";

export async function GET() {
  try {
    await requireRole(UserRole.ADMINISTRATOR);
    const users = await usersService.listUsers();
    return NextResponse.json({ data: users });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireRole(UserRole.ADMINISTRATOR);
    const body = inviteUserSchema.parse(await request.json());
    const { user, temporaryPassword } = await usersService.inviteUser(body, actor.id);
    return NextResponse.json({ data: user, temporaryPassword }, { status: 201 });
  } catch (error) {
    if (error instanceof usersService.DuplicateUserError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return toErrorResponse(error);
  }
}
