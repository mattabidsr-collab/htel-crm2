import { NextResponse } from "next/server";

import { requireUser, toErrorResponse } from "@/lib/api-auth";
import { startMfaEnrollment } from "@/modules/auth/service";

export async function POST() {
  try {
    const user = await requireUser();
    const { otpauthUri, qrCodeDataUrl } = await startMfaEnrollment(user.id, user.email ?? "");
    return NextResponse.json({ otpauthUri, qrCodeDataUrl });
  } catch (error) {
    return toErrorResponse(error);
  }
}
