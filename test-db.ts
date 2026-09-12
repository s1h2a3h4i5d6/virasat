import { prisma } from "./lib/db/prisma";

async function main() {
  const result = await prisma.$queryRaw`SELECT NOW()`;
  console.log("DATABASE CONNECTION SUCCESS:", result);
}

main()
  .catch((error) => {
    console.error("DATABASE CONNECTION FAILED:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });