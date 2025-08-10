import { db } from "../../firebase/firebaseConfig";
import {
  addDoc,
  collection,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
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

/* 
createTask adds a new task to Firestore under a specific user's account.
It is called when a user submits a form in the app to add a new task.

1. Accepts the logged-in user's ID and task details (without id, createdAt, or updatedAt).
2. Finds the Firestore path: /users/{uid}/tasks.
3. Creates a new document in that collection with a unique Firestore-generated ID.
4. Adds all user-provided fields to the document.
5. Automatically sets createdAt and updatedAt to Firestore's server time.

It returns nothing but when finished, the new task document exists in Firestore.
*/

export async function createTask(
  uid: string,
  // data includes only the fields that the user can set
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

/*
subscribeTasks is used to listen to a user's tasks in Firestore in real time 
It is called when the app needs to display a tasks list that automatically updates 

1. Accepts the logged-in-user's ID and a function to callback. 
2. Finds the Firestore path: /users/{userID}/tasks. 
3. Creates a query to order the tasks by createdAt in descending order making it newst first
4. Whenever the tasks are added, updated or deleted, it maps each document to a Task object 
   and passes the updated array of tasks to the callback function

It returns an unsubscribe function which is used to stop listening for any updates. 
*/

export function subscribeTasks(
  userId: string,
  tasksUpdate: (tasks: Task[]) => void // Tells TypeScript what type of function is expected
) {

  const tasksRef = collection(db, "users", userId, "tasks");
  const tasksQuery = query(tasksRef, orderBy("createdAt", "desc")); // Orders tasks by createdAt in descending order

  return onSnapshot(tasksQuery, (snapshot) => {
    const tasksList = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Task, "id">),
    }));
    tasksUpdate(tasksList);
  });
}