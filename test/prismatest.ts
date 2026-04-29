/// <reference types="node" />
import "dotenv/config";
import prisma from "../src/utils/prisma";

async function main() {
  console.log("🔌 Testing Prisma connection...");

  const users = await prisma.user.findMany();
  console.log("✅ Connected successfully!");
  console.log("Users:", users);
}

main()
  .catch((error) => {
    console.error("❌ Error:", error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });