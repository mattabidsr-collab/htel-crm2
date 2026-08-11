import { NextResponse } from "next/server";

import { requireWebhookSecret, toErrorResponse } from "@/lib/api-auth";
import { env } from "@/lib/env";
import { InvalidConnectUcPayloadError } from "@/integrations/connectuc/normalize";
import { ingestConnectUcCdrEvent } from "@/modules/connectuc/ingest";

// Configure this as the target of an Activepieces flow's HTTP request
// action, triggered by ConnectUC's "New CDR" event. Auth is a shared
// secret (CONNECTUC_WEBHOOK_SECRET), not a user session — see
// PUBLIC_PATHS in src/proxy.ts.
export async function POST(request: Request) {
  try {
    requireWebhookSecret(request, env.CONNECTUC_WEBHOOK_SECRET);
    const body = (await request.json()) as Record<string, unknown>;
    const result = await ingestConnectUcCdrEvent(body);
    return NextResponse.json({ data: result });
  } catch (error) {
    if (error instanceof InvalidConnectUcPayloadError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return toErrorResponse(error);
  }
}
