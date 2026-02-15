import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    const email = "google-reviewer@splitsahi.com";
    const password = "QualityTest@123";
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.upsert({
        where: { email },
        update: {
            passwordHash: hashedPassword,
            emailVerified: true,
        },
        create: {
            email,
            username: "googletester",
            name: "Google Reviewer",
            passwordHash: hashedPassword,
            emailVerified: true,
            emoji: "🤖",
        },
    });

    console.log("Reviewer user created/updated:", user.email);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
