import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Starting Virasat database seed...");

  const maharashtra = await prisma.state.upsert({
    where: { slug: "maharashtra" },
    update: {},
    create: {
      name: "Maharashtra",
      slug: "maharashtra",
      description:
        "A land of forts, folk traditions, literature, music, festivals, handicrafts and living cultural heritage.",
    },
  });

  const pune = await prisma.district.upsert({
    where: {
      stateId_slug: {
        stateId: maharashtra.id,
        slug: "pune",
      },
    },
    update: {},
    create: {
      name: "Pune",
      slug: "pune",
      stateId: maharashtra.id,
      imageUrl: null,
    },
  });

  const categories = [
    "Folk Dance",
    "Folk Music",
    "Traditional Instruments",
    "Handicrafts",
    "Traditional Clothing",
    "Festivals",
    "Tribal Traditions",
    "Food",
    "Languages",
    "Folk Tales",
    "Traditional Games",
    "Martial Arts",
    "Rituals",
    "Architecture",
    "Traditional Occupations",
    "Indigenous Knowledge",
  ];

  const categoryMap: Record<string, string> = {};

  for (const name of categories) {
    const category = await prisma.category.upsert({
      where: {
        name,
      },
      update: {},
      create: {
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      },
    });

    categoryMap[name] = category.id;
  }

  const forts = [
    {
      name: "Shivneri Fort",
      slug: "shivneri-fort",
      districtId: pune.id,
      categoryId: categoryMap["Architecture"],
      shortDescription:
        "A historic hill fort associated with the early life of Chhatrapati Shivaji Maharaj.",
      history:
        "Shivneri is a historic hill fort in Maharashtra and is traditionally associated with the birth and early life of Chhatrapati Shivaji Maharaj.",
      significance:
        "The fort is an important part of Maharashtra's historical and cultural heritage.",
    },
    {
      name: "Torna Fort",
      slug: "torna-fort",
      districtId: pune.id,
      categoryId: categoryMap["Architecture"],
      shortDescription:
        "A historic hill fort remembered as an important early fort of Swarajya.",
      history:
        "Torna is one of the historically significant forts of Maharashtra and is associated with the early expansion of Swarajya.",
      significance:
        "The fort represents the military and architectural heritage of the region.",
    },
    {
      name: "Rajgad Fort",
      slug: "rajgad-fort",
      districtId: pune.id,
      categoryId: categoryMap["Architecture"],
      shortDescription:
        "A major hill fort of Maharashtra known for its strategic location and fortification.",
      history:
        "Rajgad is a prominent historic fort in Maharashtra and served an important role during the period of Swarajya.",
      significance:
        "Its fortifications, terrain and historical associations make it an important heritage site.",
    },
    {
      name: "Sinhagad Fort",
      slug: "sinhagad-fort",
      districtId: pune.id,
      categoryId: categoryMap["Architecture"],
      shortDescription:
        "A famous hill fort near Pune with major historical significance.",
      history:
        "Sinhagad is one of the best-known historic forts near Pune and is associated with important events in Maratha history.",
      significance:
        "The fort is an important symbol of Maharashtra's military and cultural heritage.",
    },
  ];

  for (const fort of forts) {
    await prisma.heritage.upsert({
      where: {
        slug: fort.slug,
      },
      update: {},
      create: {
        name: fort.name,
        slug: fort.slug,
        districtId: fort.districtId,
        stateId: maharashtra.id,
        categoryId: fort.categoryId,
        shortDescription: fort.shortDescription,
        history: fort.history,
        significance: fort.significance,
        preservationStatus: "STABLE",
        verified: true,
      },
    });
  }

  const powada = await prisma.heritage.upsert({
    where: {
      slug: "powada",
    },
    update: {},
    create: {
      name: "Powada",
      slug: "powada",
      stateId: maharashtra.id,
      categoryId: categoryMap["Folk Music"],
      shortDescription:
        "A traditional Marathi narrative performance form that celebrates historical figures, events and heroic stories.",
      description:
        "Powada is a traditional Marathi narrative performance tradition combining storytelling, music and dramatic expression.",
      significance:
        "It forms an important part of Maharashtra's living oral and performing heritage.",
      language: "Marathi",
      regions: "Maharashtra",
      preservationStatus: "VULNERABLE",
      verified: true,
    },
  });

  await prisma.heritage.upsert({
    where: {
      slug: "lavani",
    },
    update: {},
    create: {
      name: "Lavani",
      slug: "lavani",
      stateId: maharashtra.id,
      categoryId: categoryMap["Folk Dance"],
      shortDescription:
        "A traditional Maharashtrian performance tradition combining expressive dance, music and poetry.",
      significance:
        "Lavani is an important performing-art tradition of Maharashtra.",
      language: "Marathi",
      regions: "Maharashtra",
      preservationStatus: "VULNERABLE",
      verified: true,
    },
  });

  const slideshowData = [
    {
      title: "Discover Maharashtra",
      subtitle:
        "Explore forts, traditions, stories and living heritage.",
      imageUrl: "/uploads/media/b0544e79-160a-41c3-aea9-60a2eef9952d.jpg",
      buttonText: "Explore Heritage",
      buttonUrl: "/explore",
      sortOrder: 1,
    },
    {
      title: "Forts of Swarajya",
      subtitle:
        "Experience the history and architecture of Maharashtra's historic forts.",
      imageUrl: "/uploads/media/97afd93f-ecd6-4c03-9623-68cb154b26cb.jpg",
      buttonText: "Explore Forts",
      buttonUrl: "/map",
      sortOrder: 2,
    },
    {
      title: "Living Traditions",
      subtitle:
        "Discover music, dance, stories, crafts and traditions passed through generations.",
      imageUrl: "/books/karnataka-the-living-heritage/page-01.png",
      buttonText: "Discover Traditions",
      buttonUrl: "/explore",
      sortOrder: 3,
    },
  ];

  for (const slide of slideshowData) {
    const existing = await prisma.slideshow.findFirst({
      where: {
        title: slide.title,
      },
    });

    if (!existing) {
      await prisma.slideshow.create({
        data: slide,
      });
    }
  }

  console.log("Virasat database seed completed successfully.");
  console.log(`State created: ${maharashtra.name}`);
  console.log(`District created: ${pune.name}`);
  console.log(`Categories created: ${categories.length}`);
  console.log(`Heritage records created/verified: ${forts.length + 2}`);
  console.log(`Powada record available: ${powada.name}`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

