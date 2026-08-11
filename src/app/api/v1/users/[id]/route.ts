import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { requireRole, toErrorResponse } from "@/lib/api-auth";
import { updateUserSchema } from "@/modules/users/schema";
import * as usersService from "@/modules/users/service";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireRole(UserRole.ADMINISTRATOR);
    const { id } = await params;
    const body = updateUserSchema.parse(await request.json());
    const result = await usersService.updateUser(id, body, actor.id);
    return NextResponse.json({ data: result.user, openTaskCount: result.openTaskCount });
  } catch (error) {
    return toErrorResponse(error);
  }
}
