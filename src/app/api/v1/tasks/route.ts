import { NextRequest, NextResponse } from "next/server";

import { requireUser, toErrorResponse } from "@/lib/api-auth";
import { createTaskSchema } from "@/modules/tasks/schema";
import * as tasksService from "@/modules/tasks/service";

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = createTaskSchema.parse(await request.json());
    const task = await tasksService.createTask(body, user.id);
    return NextResponse.json({ data: task }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
