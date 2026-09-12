import pg from "pg";

const { Client } = pg;

async function main() {
  const client = new Client({
    host: "127.0.0.1",
    port: 5433,
    user: "postgres",
    password: "Virasat@12345",
    database: "virasat",
  });

  try {
    await client.connect();
    console.log("DIRECT POSTGRES CONNECTION SUCCESS");

    const result = await client.query("SELECT NOW()");
    console.log(result.rows);

    await client.end();
  } catch (error) {
    console.error("DIRECT POSTGRES CONNECTION FAILED:");
    console.error(error);
  }
}

main();