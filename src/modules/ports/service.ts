import { recordAuditEvent } from "@/lib/audit";
import * as portsRepo from "@/modules/ports/repository";
import type { CreatePortProjectInput } from "@/modules/ports/schema";

export async function createPortProject(input: CreatePortProjectInput, actorId: string) {
  const project = await portsRepo.createPortProject(input);

  await recordAuditEvent({
    actorId,
    action: "port_project.create",
    entityType: "PortProject",
    entityId: project.id,
    after: project,
  });

  return project;
}

export function listPortProjects(organizationId: string) {
  return portsRepo.listPortProjects(organizationId);
}
