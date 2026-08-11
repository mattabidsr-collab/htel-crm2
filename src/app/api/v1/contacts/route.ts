import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { requireRole, toErrorResponse } from "@/lib/api-auth";
import { createContactSchema, listContactsQuerySchema } from "@/modules/contacts/schema";
import * as contactsService from "@/modules/contacts/service";

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

    const query = listContactsQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
    const contacts = await contactsService.listContacts(query);
    return NextResponse.json({ data: contacts });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(UserRole.ADMINISTRATOR, UserRole.OPERATIONS_LEADER, UserRole.SALES);

    const body = createContactSchema.parse(await request.json());
    const contact = await contactsService.createContact(body, user.id);
    return NextResponse.json({ data: contact }, { status: 201 });
  } catch (error) {
    if (error instanceof contactsService.DuplicateContactError) {
      return NextResponse.json(
        { error: error.message, existingId: error.existingId },
        { status: 409 },
      );
    }
    return toErrorResponse(error);
  }
}
