import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL
})

const prismaClientSingleton = () => {
    return new PrismaClient({ adapter })
}

declare const globalThis: {
    prismaGlobalV3: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobalV3 || prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobalV3 = prisma;

export default prisma;