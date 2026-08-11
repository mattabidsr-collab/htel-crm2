export interface NormalizedEmailAttachment {
  filename: string;
  contentType: string;
  sizeBytes: number;
}

// Normalized shape core business logic depends on — never the raw vendor
// payload (spec section 10).
export interface NormalizedEmailMessage {
  providerMessageId: string;
  providerThreadId: string;
  direction: "INBOUND" | "OUTBOUND";
  fromAddress: string;
  toAddresses: string[];
  ccAddresses: string[];
  subject: string | null;
  bodyText: string | null;
  bodyHtml: string | null; // raw, unsanitized — sanitize before storage/display
  sentAt: Date;
  attachments: NormalizedEmailAttachment[];
}

export interface EmailProvider {
  listMessagesSince(mailboxAddress: string, since: Date): Promise<NormalizedEmailMessage[]>;
}
