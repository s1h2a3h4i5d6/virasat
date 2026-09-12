import "dotenv/config";
import { prisma } from "./lib/db/prisma";

async function main() {
  const count = await prisma.heritage.count();
  const records = await prisma.heritage.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      preservationStatus: true,
    },
  });

  console.log("HERITAGE COUNT:", count);
  console.log(JSON.stringify(records, null, 2));
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
