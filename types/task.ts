// Defines what a tasks should look like accross the entire app 
// Firestore documents will be adapted to match this shape (ex: Timestamp -> Date)
// Components can also import this type 

export type TaskStatus = "pending" | "done"; // keep status locked to only valid values

export interface Task { // Blueprint that defines the shape of an object
  id: string; // Comes from Firestore doc id 
  name: string;
  category: string;
  priority: 1 | 2 | 3;
  estMinutes: number;
  createdAt: Date;
  status: TaskStatus;
}
