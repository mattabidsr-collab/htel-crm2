import bcrypt from "bcryptjs";

import { db } from "@/lib/db";

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@heritagetel.com";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin user ${email} already exists (id ${existing.id}).`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await db.user.create({
    data: {
      email,
      name: "Heritage Administrator",
      passwordHash,
      role: "ADMINISTRATOR",
    },
  });

  console.log(`Created administrator ${user.email} (id ${user.id}).`);
  console.log(`Temporary password: ${password}`);
  console.log("Sign in and enroll MFA immediately — it is required for administrators.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
