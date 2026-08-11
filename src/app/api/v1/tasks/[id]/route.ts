import { NextRequest, NextResponse } from "next/server";

import { requireUser, toErrorResponse } from "@/lib/api-auth";
import { updateTaskSchema } from "@/modules/tasks/schema";
import * as tasksService from "@/modules/tasks/service";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = updateTaskSchema.parse(await request.json());
    const task = await tasksService.updateTask(id, body, user.id);
    return NextResponse.json({ data: task });
  } catch (error) {
    return toErrorResponse(error);
  }
}
