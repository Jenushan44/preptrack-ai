import fs from "fs";
import admin from "firebase-admin";

const serviceAccount = JSON.parse(

  fs.readFileSync(new URL("./serviceAccountKey.json", import.meta.url), "utf8")
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),

  });
}

const db = admin.firestore();

async function exportTasks() {
  const snapshot = await db.collectionGroup("tasks").get();

  console.log(`Found ${snapshot.size} tasks`);
  fs.writeFileSync("tasks_train.csv", "goalId,name,category,priority,estMinutes\n");

  snapshot.forEach((doc) => {
    const t = doc.data();
    fs.appendFileSync(
      "tasks_train.csv", `${t.goalId},${t.name},${t.category},${t.priority},${t.estMinutes}\n`
    );
  });
  console.log("Export finished. Saved to tasks_train.csv");
}

exportTasks();
