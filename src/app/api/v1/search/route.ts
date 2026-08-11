import { NextRequest, NextResponse } from "next/server";

import { requireUser, toErrorResponse } from "@/lib/api-auth";
import { searchAll } from "@/modules/search/service";

export async function GET(request: NextRequest) {
  try {
    await requireUser();
    const q = request.nextUrl.searchParams.get("q") ?? "";
    const results = await searchAll(q);
    return NextResponse.json({ data: results });
  } catch (error) {
    return toErrorResponse(error);
  }
}
