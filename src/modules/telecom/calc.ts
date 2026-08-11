// Pure calculation helpers, kept free of Prisma so they're unit-testable
// without a database.

export interface ServiceLine {
  status: string;
  activationDate: Date | null;
  terminationDate: Date | null;
  quantity: number;
  unitPrice: number;
  unitCost: number | null;
}

export function isActiveAt(
  service: { status: string; activationDate: Date | null; terminationDate: Date | null },
  effectiveDate: Date,
) {
  if (service.status !== "ACTIVE") return false;
  if (service.activationDate && service.activationDate > effectiveDate) return false;
  if (service.terminationDate && service.terminationDate <= effectiveDate) return false;
  return true;
}

// Business rule 1: MRR equals the sum of active recurring service-line
// extended prices for the selected effective date. Business rule 2: an
// incomplete vendor cost mapping must show "Incomplete", never a
// misleading zero.
export function summarizeServiceLines(services: ServiceLine[], effectiveDate: Date) {
  const active = services.filter((s) => isActiveAt(s, effectiveDate));

  const mrr = active.reduce((sum, s) => sum + s.unitPrice * s.quantity, 0);

  const hasIncompleteCost = active.some((s) => s.unitCost === null);
  const estimatedCost = hasIncompleteCost
    ? null
    : active.reduce((sum, s) => sum + (s.unitCost as number) * s.quantity, 0);

  return {
    mrr,
    estimatedCost,
    estimatedMargin: estimatedCost === null ? null : mrr - estimatedCost,
    activeServiceCount: active.length,
  };
}
