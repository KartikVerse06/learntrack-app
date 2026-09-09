import { PrismaClient, Priority } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding LearnTrack database...");

  const demoEmail = "demo@learntrack.app";
  const existingUser = await prisma.user.findUnique({
    where: { email: demoEmail },
  });

  let user = existingUser;

  if (!user) {
    const passwordHash = await bcrypt.hash("Password123!", 10);
    user = await prisma.user.create({
      data: {
        name: "Alex Learner",
        email: demoEmail,
        passwordHash,
        timezone: "UTC",
        settings: {
          create: {
            defaultFocusDuration: 2700,
            soundEnabled: true,
            soundVolume: 0.8,
            soundChoice: "bell",
            notificationsEnabled: true,
          },
        },
      },
    });
    console.log(`✅ Created demo user: ${user.email} (${user.id})`);
  } else {
    console.log(`ℹ️ Demo user already exists: ${user.email} (${user.id})`);
  }

  // Seed default categories
  const categoriesData = [
    { name: "Algorithms", color: "#3B82F6" },
    { name: "System Design", color: "#10B981" },
    { name: "Frontend Architecture", color: "#8B5CF6" },
  ];

  const categories = [];
  for (const cat of categoriesData) {
    const category = await prisma.category.upsert({
      where: {
        userId_name: {
          userId: user.id,
          name: cat.name,
        },
      },
      update: { color: cat.color },
      create: {
        userId: user.id,
        name: cat.name,
        color: cat.color,
      },
    });
    categories.push(category);
  }
  console.log(`✅ Upserted ${categories.length} categories for user ${user.id}`);

  // Seed a sample planned task if user has no tasks
  const taskCount = await prisma.learningTask.count({
    where: { userId: user.id },
  });

  if (taskCount === 0) {
    const sysDesignCat = categories.find((c) => c.name === "System Design");
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const sampleTask = await prisma.learningTask.create({
      data: {
        userId: user.id,
        categoryId: sysDesignCat?.id,
        title: "B-Trees and LSM-Trees Storage Engines",
        description: "Study append-only logs, SSTables, memtables, and compaction strategies.",
        plannedDate: today,
        priority: Priority.HIGH,
        estimatedSessions: 2,
        status: "PLANNED",
      },
    });
    console.log(`✅ Created sample planned task: "${sampleTask.title}" (${sampleTask.id})`);
  }

  console.log("🚀 Seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
