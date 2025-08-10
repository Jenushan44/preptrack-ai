import { db } from "../../firebase/firebaseConfig";
import {
  addDoc,
  collection,
  serverTimestamp
} from "firebase/firestore"

export type Priority = "Low" | "Medium" | "High"; // Priority can only be 1 of 3 values
export type TaskType = "Study" | "Fitness" | "Other"

export type Task = { // Defines Task object and checks if all required fields are present
  id: string;
  name: string;
  type: TaskType;
  priority: Priority;
  estimatedMin: number;
  completed: boolean;
  createdAt?: any;
  updatedAt?: any;
};

export async function createTask(
  uid: string,
  // data inclides only the fields that the user can set
  // "id", "createdAt" and "updatedAt" are removed because Firestore generates them
  data: Omit<Task, "id" | "createdAt" | "updatedAt">
) {

  const ref = collection(db, "users", uid, "tasks"); // Firestore function collection gives a reference to specific data in the database 
  // creates new document in collection with a unique ID 
  // await used since Firestore writes take time
  await addDoc(ref, {
    ...data, // spreads all the user fields into the document 
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

}