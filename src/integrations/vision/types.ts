// Normalized shape core business logic depends on — never the raw vendor
// payload (spec section 10).
export interface NormalizedVisionTicket {
  externalTicketId: string; // Vision's human-facing ticket code (e.g. "QBZC-364991")
  externalNumericId?: string; // Vision's internal numeric ticket ID, needed alongside the code for deep links
  externalUrl: string;
  subject: string;
  status: string;
  isOpen: boolean;
  priority?: string;
  category?: string;
  requesterEmail?: string;
  requesterName?: string;
  technician?: string;
  externalCustomerId: string;
  externalCustomerName?: string;
  visionCreatedAt: Date;
  visionUpdatedAt: Date;
  visionResolvedAt?: Date;
}

export interface VisionClient {
  fetchRecentTickets(since: Date): Promise<NormalizedVisionTicket[]>;
}
