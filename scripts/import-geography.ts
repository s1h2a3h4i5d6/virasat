import fs from "fs";
import { prisma } from "../lib/db/prisma";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

type Feature = {
  properties?: {
    st_nm?: string;
    district?: string;
  };
};

type GeoJSON = {
  features: Feature[];
};

async function main() {
  console.log("");
  console.log("======================================");
  console.log(" Virasat Geographic Data Import");
  console.log("======================================");
  console.log("");

  const file = "public/maps/india.geojson";

  if (!fs.existsSync(file)) {
    throw new Error(
      "public/maps/india.geojson not found."
    );
  }

  const data: GeoJSON = JSON.parse(
    fs.readFileSync(file, "utf8")
  );

  const states = new Map<string, Set<string>>();

  for (const feature of data.features) {
    const stateName =
      feature.properties?.st_nm?.trim();

    const districtName =
      feature.properties?.district?.trim();

    if (!stateName || !districtName) {
      continue;
    }

    if (!states.has(stateName)) {
      states.set(
        stateName,
        new Set<string>()
      );
    }

    states
      .get(stateName)!
      .add(districtName);
  }

  console.log(
    `Found ${states.size} states in GeoJSON.`
  );

  console.log("");

  let stateCount = 0;
  let districtCount = 0;

  for (const [stateName, districts] of states) {
    const stateSlug = slugify(stateName);

    const state = await prisma.state.upsert({
      where: {
        slug: stateSlug,
      },
      update: {
        name: stateName,
      },
      create: {
        name: stateName,
        slug: stateSlug,
      },
    });

    stateCount++;

    for (const districtName of districts) {
      const districtSlug =
        slugify(districtName);

      await prisma.district.upsert({
        where: {
          stateId_slug: {
            stateId: state.id,
            slug: districtSlug,
          },
        },
        update: {
          name: districtName,
        },
        create: {
          name: districtName,
          slug: districtSlug,
          stateId: state.id,
        },
      });

      districtCount++;
    }

    console.log(
      `✓ ${stateName}: ${districts.size} districts`
    );
  }

  console.log("");
  console.log("======================================");
  console.log(" Geographic Import Completed");
  console.log("======================================");
  console.log(
    `States processed: ${stateCount}`
  );
  console.log(
    `District records processed: ${districtCount}`
  );
  console.log("");
}

main()
  .catch((error) => {
    console.error("");
    console.error(
      "Geography import failed:"
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });