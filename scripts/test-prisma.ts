import { prisma } from "@/lib/prisma";

console.log("AI Knowledge Document:", typeof prisma.aIKnowledgeDocument);
console.log("AI Knowledge Chunk:", typeof prisma.aIKnowledgeChunk);
console.log("Heritage:", typeof prisma.heritage);
