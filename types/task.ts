export type TaskStatus = "pending" | "done"; // keep status locked to only valid values

export interface Task {
  id: string; // Comes from Firestore doc id 
  name: string;
  category: string;
  priority: 1 | 2 | 3;
  estMinutes: number;
  createdAt: Date;
  status: TaskStatus;
};
