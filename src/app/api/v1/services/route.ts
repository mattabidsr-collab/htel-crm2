import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { requireRole, toErrorResponse } from "@/lib/api-auth";
import { createServiceSchema, listServicesQuerySchema } from "@/modules/services/schema";
import * as servicesService from "@/modules/services/service";

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

    const query = listServicesQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
    const services = await servicesService.listServices(query);
    return NextResponse.json({ data: services });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(UserRole.ADMINISTRATOR, UserRole.OPERATIONS_LEADER, UserRole.BILLING_ADMIN);

    const body = createServiceSchema.parse(await request.json());
    const service = await servicesService.createService(body, user.id);
    return NextResponse.json({ data: service }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
