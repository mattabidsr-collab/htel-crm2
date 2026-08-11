import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { z } from "zod";

import { requireRole, toErrorResponse } from "@/lib/api-auth";
import { createPortProjectSchema } from "@/modules/ports/schema";
import * as portsService from "@/modules/ports/service";

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

    const { organizationId } = z
      .object({ organizationId: z.string().uuid() })
      .parse(Object.fromEntries(request.nextUrl.searchParams));
    const projects = await portsService.listPortProjects(organizationId);
    return NextResponse.json({ data: projects });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(UserRole.ADMINISTRATOR, UserRole.OPERATIONS_LEADER, UserRole.SUPPORT);

    const body = createPortProjectSchema.parse(await request.json());
    const project = await portsService.createPortProject(body, user.id);
    return NextResponse.json({ data: project }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
