require("dotenv").config({ path: require("path").join(process.cwd(), ".env") });

const { PrismaClient } = require("../generated/prisma/client");

const p = new PrismaClient();

p.media.count()
  .then((count) => {
    console.log("Existing Media records:", count);
  })
  .catch((error) => {
    console.error(error);
  })
  .finally(() => {
    p.$disconnect();
  });
