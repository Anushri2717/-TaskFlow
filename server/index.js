const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// In-memory store (replace with DB for production)
let todos = [
  { id: uuidv4(), text: "Welcome to your Todo App! 🎉", completed: false, priority: "high", createdAt: new Date().toISOString() },
  { id: uuidv4(), text: "Click the circle to complete a task", completed: true, priority: "medium", createdAt: new Date().toISOString() },
  { id: uuidv4(), text: "Try adding a new task below", completed: false, priority: "low", createdAt: new Date().toISOString() },
];

// GET all todos
app.get("/api/todos", (req, res) => {
  const { filter } = req.query;
  let result = [...todos];
  if (filter === "active") result = todos.filter((t) => !t.completed);
  if (filter === "completed") result = todos.filter((t) => t.completed);
  res.json(result);
});

// POST create todo
app.post("/api/todos", (req, res) => {
  const { text, priority = "medium" } = req.body;
  if (!text || !text.trim()) return res.status(400).json({ error: "Text is required" });
  const todo = { id: uuidv4(), text: text.trim(), completed: false, priority, createdAt: new Date().toISOString() };
  todos.unshift(todo);
  res.status(201).json(todo);
});

// PATCH update todo
app.patch("/api/todos/:id", (req, res) => {
  const { id } = req.params;
  const index = todos.findIndex((t) => t.id === id);
  if (index === -1) return res.status(404).json({ error: "Todo not found" });
  todos[index] = { ...todos[index], ...req.body };
  res.json(todos[index]);
});

// DELETE one todo
app.delete("/api/todos/:id", (req, res) => {
  const { id } = req.params;
  const index = todos.findIndex((t) => t.id === id);
  if (index === -1) return res.status(404).json({ error: "Todo not found" });
  todos.splice(index, 1);
  res.json({ success: true });
});

// DELETE all completed
app.delete("/api/todos", (req, res) => {
  todos = todos.filter((t) => !t.completed);
  res.json({ success: true });
});

app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));