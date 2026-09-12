const { PrismaClient } = require("./generated/prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
require("dotenv/config");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const email = "yuvrajbadhe3@gmail.com".toLowerCase().trim();

  const user = await prisma.user.update({
    where: { email },
    data: { role: "ADMIN" },
  });

  console.log(`Admin role assigned to: ${user.email}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
