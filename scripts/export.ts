import * as fs from "fs";
import * as path from "path";
import admin from "firebase-admin";


// Load key files 
const keyFilePath = path.join(process.cwd(), "scripts", "serviceAccountKey.json");
const serviceAccountJson = JSON.parse(fs.readFileSync(keyFilePath, "utf8"));


if (admin.apps.length === 0) { // Connect to Firebase once 
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountJson),
  });
}
const firestore = admin.firestore();


function toDateSafe(value: any): Date | null {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();

  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function getTimeOfDayBin(date: Date): "night" | "morning" | "afternoon" | "evening" {
  const hour = date.getHours();
  if (hour < 6) return "night";
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

function getDayOfWeekIndex(date: Date): number {
  return date.getDay();
}


function getDaysUntilDue(startDate: Date, dueDate: Date | null): string | number {
  if (!dueDate) return "";
  const ms = dueDate.getTime() - startDate.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function isSameLocalDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function escapeForCsv(value: any): string {
  if (value === null || value === undefined) return "";
  const stringValue = String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}


async function exportDataset() {
  const outputDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

  const outputPath = path.join(outputDir, "tasks_train.csv");
  const csvRows: string[] = [];

  csvRows.push(
    [
      "userId",
      "taskId",
      "category",
      "priority",
      "estMinutes",
      "timeOfDayBin",
      "dayOfWeek",
      "daysUntilDue",
      "wasRegenerated",
      "pastSuccessRate_category",
      "pastSuccessRate_overall",
      "completed_on_time",
    ].join(",")
  );

  const usersSnapshot = await firestore.collection("users").get();

  for (const userDoc of usersSnapshot.docs) {
    const userId = userDoc.id;



    const eventsSnapshot = await firestore
      .collection("users")
      .doc(userId)
      .collection("events")
      .get();

    const regenEventDates: Date[] = [];
    for (const eventDoc of eventsSnapshot.docs) {
      const eventData = eventDoc.data();
      if (eventData.type === "regen") {
        const eventTime = toDateSafe(eventData.timestamp);
        if (eventTime) regenEventDates.push(eventTime);
      }
    }

    const tasksSnapshot = await firestore
      .collection("users")
      .doc(userId)
      .collection("tasks")
      .get();

    type Attempt = {
      userId: string;
      taskId: string;
      category: string;
      priority: string;
      estMinutes: number;
      scheduledStart: Date;
      scheduledEnd: Date;
      dueAt: Date | null;
      completedAt: Date | null;
      wasRegenerated: number;
    };

    const attemptList: Attempt[] = [];


    for (const taskDoc of tasksSnapshot.docs) {
      const taskData = taskDoc.data();

      const scheduledStart = toDateSafe(taskData.scheduledStart);
      const scheduledEnd = toDateSafe(taskData.scheduledEnd);

      if (!scheduledStart || !scheduledEnd) {
        continue;
      }

      const category = taskData.category || "General";
      const priority = taskData.priority || "Medium";

      const estMinutes = typeof taskData.estMinutes === "number" ? taskData.estMinutes : taskData.estMinutes ? Number(taskData.estMinutes) : 0;

      const dueAt = toDateSafe(taskData.dueAt);
      const completedAt = toDateSafe(taskData.completedAt);

      let wasRegenerated = 0;
      for (const regenDate of regenEventDates) {
        if (isSameLocalDay(regenDate, scheduledStart)) {
          wasRegenerated = 1;
          break;
        }
      }

      attemptList.push({
        userId,
        taskId: taskDoc.id,
        category,
        priority,
        estMinutes,
        scheduledStart,
        scheduledEnd,
        dueAt,
        completedAt,
        wasRegenerated,
      });
    }

    attemptList.sort(
      (left, right) => left.scheduledStart.getTime() - right.scheduledStart.getTime()
    );

    let totalAttemptsOverall = 0;
    let successfulAttemptsOverall = 0;
    const totalAttemptsByCategory = new Map<string, number>();
    const successfulAttemptsByCategory = new Map<string, number>();

    for (const attempt of attemptList) {
      let completedOnTime: "" | 0 | 1 = "";
      if (attempt.completedAt) {
        completedOnTime = attempt.completedAt.getTime() <= attempt.scheduledEnd.getTime() ? 1 : 0;
      }

      const previousOverallRate =
        totalAttemptsOverall > 0 ? successfulAttemptsOverall / totalAttemptsOverall : "";

      const previousCategoryTotal =
        totalAttemptsByCategory.get(attempt.category) || 0;
      const previousCategoryWins =
        successfulAttemptsByCategory.get(attempt.category) || 0;

      const previousCategoryRate =
        previousCategoryTotal > 0 ? previousCategoryWins / previousCategoryTotal : "";

      const timeOfDayBin = getTimeOfDayBin(attempt.scheduledStart);
      const dayOfWeek = getDayOfWeekIndex(attempt.scheduledStart);
      const daysUntilDue = getDaysUntilDue(attempt.scheduledStart, attempt.dueAt);

      csvRows.push(
        [
          escapeForCsv(attempt.userId),
          escapeForCsv(attempt.taskId),
          escapeForCsv(attempt.category),
          escapeForCsv(attempt.priority),
          escapeForCsv(attempt.estMinutes),
          escapeForCsv(timeOfDayBin),
          escapeForCsv(dayOfWeek),
          escapeForCsv(daysUntilDue),
          escapeForCsv(attempt.wasRegenerated),
          escapeForCsv(previousCategoryRate === "" ? "" : previousCategoryRate.toFixed(3)),
          escapeForCsv(previousOverallRate === "" ? "" : previousOverallRate.toFixed(3)),
          escapeForCsv(completedOnTime),

        ].join(",")

      );

      totalAttemptsOverall += 1;
      if (completedOnTime === 1) successfulAttemptsOverall += 1;

      const newCategoryTotal = (totalAttemptsByCategory.get(attempt.category) || 0) + 1;

      totalAttemptsByCategory.set(attempt.category, newCategoryTotal);

      if (completedOnTime === 1) {
        const newCategoryWins = (successfulAttemptsByCategory.get(attempt.category) || 0) + 1; successfulAttemptsByCategory.set(attempt.category, newCategoryWins);
      }
    }
  }

  fs.writeFileSync(outputPath, csvRows.join("\n"), "utf8");

  console.log(`Wrote ${outputPath} with ${csvRows.length - 1} rows`);
}

exportDataset().catch((error) => {
  console.error("Export failed:", error);
  process.exit(1);
});
