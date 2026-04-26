/**
 * Fake Activity Bot
 * Creates fake users and logs random sessions to make the app look busy.
 * Runs on Railway as a cron job (daily at 8 AM UTC).
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Fake user data
const FAKE_USERS = [
  { name: "Alex Chen", email: "bot-alex@gravitacio.app" },
  { name: "Jordan Lee", email: "bot-jordan@gravitacio.app" },
  { name: "Sam Rivera", email: "bot-sam@gravitacio.app" },
  { name: "Taylor Kim", email: "bot-taylor@gravitacio.app" },
  { name: "Morgan Wu", email: "bot-morgan@gravitacio.app" },
  { name: "Casey Patel", email: "bot-casey@gravitacio.app" },
  { name: "Riley Santos", email: "bot-riley@gravitacio.app" },
  { name: "Jamie Torres", email: "bot-jamie@gravitacio.app" },
  { name: "Avery Nguyen", email: "bot-avery@gravitacio.app" },
  { name: "Quinn Davis", email: "bot-quinn@zoneit.app" },
];

const SESSION_TITLES = [
  "Power Endurance",
  "Technique Drill",
  "Boulder Blast",
  "Lead Climbing",
  "Finger Strength",
  "Campus Board",
  "Hangboard Session",
  "Movement Practice",
  "Project Burns",
  "Volume Day",
];

const SESSION_SUBTITLES = [
  "Focusing on overhangs",
  "Slab practice",
  "Crimps and pinches",
  "Dynamic moves",
  "Static positions",
  "Footwork drills",
  null,
  null,
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(daysBack: number): Date {
  const now = new Date();
  const msBack = randomInt(0, daysBack * 24 * 60 * 60 * 1000);
  return new Date(now.getTime() - msBack);
}

async function ensureFakeUsers() {
  console.log("Ensuring fake users exist...");

  for (const fakeUser of FAKE_USERS) {
    const existing = await prisma.user.findUnique({
      where: { email: fakeUser.email },
    });

    if (!existing) {
      await prisma.user.create({
        data: {
          googleId: `bot-${fakeUser.email}`,
          email: fakeUser.email,
          name: fakeUser.name,
          picture: null,
        },
      });
      console.log(`  Created: ${fakeUser.name}`);
    } else {
      console.log(`  Exists: ${fakeUser.name}`);
    }
  }
}

async function createRandomSession(userId: string) {
  const durationMinutes = randomInt(30, 120);
  const exerciseCount = randomInt(8, 20);

  await prisma.sessionLog.create({
    data: {
      userId,
      sessionTitle: randomChoice(SESSION_TITLES),
      sessionSubtitle: randomChoice(SESSION_SUBTITLES),
      startedAt: randomDate(7), // Within last 7 days
      durationSeconds: durationMinutes * 60,
      exerciseCount,
      notes: "",
    },
  });
}

async function generateDailyActivity() {
  console.log("Generating daily activity...");

  // Get all fake users
  const fakeUsers = await prisma.user.findMany({
    where: {
      email: { startsWith: "bot-" },
    },
  });

  if (fakeUsers.length === 0) {
    console.log("  No fake users found. Run ensureFakeUsers first.");
    return;
  }

  // Randomly select 2-5 users to have sessions today
  const numActive = randomInt(2, 5);
  const shuffled = fakeUsers.sort(() => Math.random() - 0.5);
  const activeUsers = shuffled.slice(0, numActive);

  for (const user of activeUsers) {
    // Each active user gets 1-2 sessions
    const numSessions = randomInt(1, 2);
    for (let i = 0; i < numSessions; i++) {
      await createRandomSession(user.id);
      console.log(`  Created session for ${user.name}`);
    }
  }

  console.log(`Created sessions for ${activeUsers.length} users`);
}

async function main() {
  try {
    console.log("=== Fake Activity Bot ===\n");

    await ensureFakeUsers();
    console.log("");
    await generateDailyActivity();

    console.log("\nDone!");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
