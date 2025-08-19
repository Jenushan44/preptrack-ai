import { db } from "../../firebase/firebaseConfig"
import { addDoc, collection, serverTimestamp } from "firebase/firestore"

//Only allows these strings to be passed when logging an event
export type EventType = "complete" | "reschedule" | "regenerate";

export async function logEvent(
  uid: string,
  type: EventType,
  optional?: { taskId?: string; details?: string }
) {
  await addDoc(collection(db, "users", uid, "events"), {
    type,
    taskId: optional?.taskId ?? null,
    details: optional?.details ?? null,
    timestamp: serverTimestamp(),
  });
}