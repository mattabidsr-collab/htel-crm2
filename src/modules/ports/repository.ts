import { db } from "@/lib/db";
import type { CreatePortProjectInput } from "@/modules/ports/schema";

export function createPortProject(input: CreatePortProjectInput) {
  const { didNumbers, ...projectData } = input;
  return db.portProject.create({
    data: {
      ...projectData,
      items: { create: didNumbers.map((didNumber) => ({ didNumber, status: projectData.status })) },
    },
    include: { items: true },
  });
}

export function listPortProjects(organizationId: string) {
  return db.portProject.findMany({
    where: { organizationId },
    include: { items: true },
    orderBy: { createdAt: "asc" },
  });
}
