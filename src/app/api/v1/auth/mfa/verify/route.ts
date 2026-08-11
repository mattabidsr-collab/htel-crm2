import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireUser, toErrorResponse } from "@/lib/api-auth";
import { confirmMfaEnrollment, MfaVerificationError } from "@/modules/auth/service";

const verifySchema = z.object({ code: z.string().min(6).max(6) });

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const { code } = verifySchema.parse(await request.json());
    await confirmMfaEnrollment(user.id, code);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof MfaVerificationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return toErrorResponse(error);
  }
}
