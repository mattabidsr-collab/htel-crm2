import type { UserRole } from "@prisma/client";

import { db } from "@/lib/db";

const userListSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  isActive: true,
  mfaEnabled: true,
  deactivatedAt: true,
  createdAt: true,
  _count: { select: { ownedTasks: true, ownedOrganizations: true } },
} as const;

export function listUsers() {
  return db.user.findMany({ select: userListSelect, orderBy: { name: "asc" } });
}

export function findUserById(id: string) {
  return db.user.findUnique({ where: { id }, select: userListSelect });
}

export function findUserByEmail(email: string) {
  return db.user.findUnique({ where: { email } });
}

export function createUser(input: {
  email: string;
  name: string;
  role: UserRole;
  passwordHash: string;
}) {
  return db.user.create({ data: input, select: userListSelect });
}

interface UpdateUserData {
  role?: UserRole;
  isActive?: boolean;
  deactivatedAt?: Date | null;
}

export function updateUser(id: string, data: UpdateUserData) {
  return db.user.update({ where: { id }, data, select: userListSelect });
}

export function countOpenTasksForOwner(ownerId: string) {
  return db.task.count({ where: { ownerId, status: { in: ["OPEN", "IN_PROGRESS"] } } });
}
