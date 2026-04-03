// pages/api/tasks.js
import { getTasks, updateTaskStatus, addTask, deleteTask } from "../../lib/sheets";

export default async function handler(req, res) {
  try {
    switch (req.method) {
      case "GET": {
        const projects = await getTasks();
        return res.status(200).json({ projects });
      }

      case "POST": {
        const task = req.body;
        const result = await addTask(task);
        return res.status(201).json(result);
      }

      case "PATCH": {
        const { taskId, status } = req.body;
        const result = await updateTaskStatus(taskId, status);
        return res.status(200).json(result);
      }

      case "DELETE": {
        const { taskId } = req.body;
        const result = await deleteTask(taskId);
        return res.status(200).json(result);
      }

      default:
        res.setHeader("Allow", ["GET", "POST", "PATCH", "DELETE"]);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
