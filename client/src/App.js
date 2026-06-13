import { useState, useEffect, useCallback } from "react";
import "./App.css";

const API = "/api/todos";

const priorityConfig = {
  high:   { label: "High",   color: "var(--high)", dot: "🔴" },
  medium: { label: "Medium", color: "var(--med)",  dot: "🟡" },
  low:    { label: "Low",    color: "var(--low)",  dot: "🟢" },
};

export default function App() {
  const [todos, setTodos]       = useState([]);
  const [input, setInput]       = useState("");
  const [priority, setPriority] = useState("medium");
  const [filter, setFilter]     = useState("all");
  const [loading, setLoading]   = useState(true);
  const [adding, setAdding]     = useState(false);
  const [editId, setEditId]     = useState(null);
  const [editText, setEditText] = useState("");
  const [removing, setRemoving] = useState(new Set());
  const [search, setSearch]     = useState("");
  const [toast, setToast]       = useState(null);

  const showToast = (msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  const fetchTodos = useCallback(async () => {
    try {
      const res = await fetch(`${API}?filter=${filter}`);
      const data = await res.json();
      setTodos(data);
    } catch { showToast("Failed to connect to server", "error"); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { fetchTodos(); }, [fetchTodos]);

  const addTodo = async () => {
    if (!input.trim()) return;
    setAdding(true);
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input, priority }),
      });
      const todo = await res.json();
      if (filter === "all" || filter === "active") setTodos((p) => [todo, ...p]);
      setInput("");
      showToast("Task added! ✨", "success");
    } catch { showToast("Failed to add task", "error"); }
    finally { setAdding(false); }
  };

  const toggleTodo = async (id, completed) => {
    try {
      const res = await fetch(`${API}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !completed }),
      });
      const updated = await res.json();
      if (filter === "all") {
        setTodos((p) => p.map((t) => (t.id === id ? updated : t)));
      } else {
        animateRemove(id, () => setTodos((p) => p.filter((t) => t.id !== id)));
      }
    } catch { showToast("Failed to update task", "error"); }
  };

  const animateRemove = (id, cb) => {
    setRemoving((p) => new Set([...p, id]));
    setTimeout(() => {
      cb();
      setRemoving((p) => { const n = new Set(p); n.delete(id); return n; });
    }, 350);
  };

  const deleteTodo = async (id) => {
    animateRemove(id, async () => {
      try {
        await fetch(`${API}/${id}`, { method: "DELETE" });
        setTodos((p) => p.filter((t) => t.id !== id));
        showToast("Task removed", "info");
      } catch { showToast("Failed to delete task", "error"); }
    });
  };

  const saveEdit = async (id) => {
    if (!editText.trim()) return;
    try {
      const res = await fetch(`${API}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: editText }),
      });
      const updated = await res.json();
      setTodos((p) => p.map((t) => (t.id === id ? updated : t)));
      setEditId(null);
      showToast("Task updated ✏️", "success");
    } catch { showToast("Failed to update task", "error"); }
  };

  const clearCompleted = async () => {
    try {
      await fetch(API, { method: "DELETE" });
      setTodos((p) => p.filter((t) => !t.completed));
      showToast("Cleared completed tasks 🧹", "info");
    } catch { showToast("Failed to clear tasks", "error"); }
  };

  const toggleAll = async () => {
    const allDone = todos.every((t) => t.completed);
    await Promise.all(
      todos.map((t) =>
        fetch(`${API}/${t.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ completed: !allDone }),
        })
      )
    );
    setTodos((p) => p.map((t) => ({ ...t, completed: !allDone })));
  };

  const displayed = todos.filter((t) =>
    search ? t.text.toLowerCase().includes(search.toLowerCase()) : true
  );

  const activeCount    = todos.filter((t) => !t.completed).length;
  const completedCount = todos.filter((t) => t.completed).length;
  const progress       = todos.length ? Math.round((completedCount / todos.length) * 100) : 0;

  return (
    <div className="app">
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}

      <header className="header">
        <div className="header-top">
          <div className="logo">
            <span className="logo-icon">✦</span>
            <span className="logo-text">Taskly</span>
          </div>
          <div className="stats">
            <span className="stat"><b>{activeCount}</b> left</span>
            <span className="stat-sep">·</span>
            <span className="stat"><b>{completedCount}</b> done</span>
          </div>
        </div>
        {todos.length > 0 && (
          <div className="progress-wrap">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <span className="progress-label">{progress}%</span>
          </div>
        )}
      </header>

      <main className="main">
        {/* ── Add Todo ── */}
        <div className="add-card">
          <div className="add-row">
            <input
              className="add-input"
              placeholder="What needs to be done?"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTodo()}
            />
            <button className="add-btn" onClick={addTodo} disabled={adding || !input.trim()}>
              {adding ? <span className="spinner" /> : <span>+</span>}
            </button>
          </div>
          <div className="priority-row">
            <span className="priority-label">Priority:</span>
            {Object.entries(priorityConfig).map(([key, { label, color }]) => (
              <button
                key={key}
                className={`prio-btn ${priority === key ? "active" : ""}`}
                style={{ "--p-color": color }}
                onClick={() => setPriority(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Controls ── */}
        <div className="controls">
          <div className="filters">
            {["all", "active", "completed"].map((f) => (
              <button
                key={f}
                className={`filter-btn ${filter === f ? "active" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <div className="actions">
            {todos.length > 0 && (
              <button className="action-btn" onClick={toggleAll}>◎ All</button>
            )}
            {completedCount > 0 && (
              <button className="action-btn danger" onClick={clearCompleted}>🗑 Clear done</button>
            )}
          </div>
        </div>

        {/* ── Search ── */}
        {todos.length > 2 && (
          <div className="search-wrap">
            <span className="search-icon">⌕</span>
            <input
              className="search-input"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && <button className="search-clear" onClick={() => setSearch("")}>×</button>}
          </div>
        )}

        {/* ── Todo List ── */}
        <div className="todo-list">
          {loading ? (
            <div className="empty">
              <div className="loading-dots"><span/><span/><span/></div>
            </div>
          ) : displayed.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">{search ? "🔍" : filter === "completed" ? "🏆" : "✨"}</div>
              <p>{search ? "No matching tasks" : filter === "completed" ? "No completed tasks yet" : "All clear! Add a task above"}</p>
            </div>
          ) : (
            displayed.map((todo) => (
              <div
                key={todo.id}
                className={`todo-item ${todo.completed ? "done" : ""} ${removing.has(todo.id) ? "removing" : ""}`}
                style={{ "--p-color": priorityConfig[todo.priority]?.color }}
              >
                <button
                  className={`check-btn ${todo.completed ? "checked" : ""}`}
                  onClick={() => toggleTodo(todo.id, todo.completed)}
                >
                  {todo.completed && <span className="check-mark">✓</span>}
                </button>

                <div className="todo-body">
                  {editId === todo.id ? (
                    <input
                      className="edit-input"
                      value={editText}
                      autoFocus
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit(todo.id);
                        if (e.key === "Escape") setEditId(null);
                      }}
                      onBlur={() => saveEdit(todo.id)}
                    />
                  ) : (
                    <span
                      className="todo-text"
                      onDoubleClick={() => { setEditId(todo.id); setEditText(todo.text); }}
                    >
                      {todo.text}
                    </span>
                  )}
                  <div className="todo-meta">
                    <span className="prio-badge" style={{ color: priorityConfig[todo.priority]?.color }}>
                      {priorityConfig[todo.priority]?.dot} {priorityConfig[todo.priority]?.label}
                    </span>
                    <span className="todo-date">
                      {new Date(todo.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                </div>

                <div className="todo-actions">
                  {!todo.completed && editId !== todo.id && (
                    <button
                      className="icon-btn edit"
                      onClick={() => { setEditId(todo.id); setEditText(todo.text); }}
                    >✏</button>
                  )}
                  <button className="icon-btn delete" onClick={() => deleteTodo(todo.id)}>✕</button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      <footer className="footer">
        Double-click a task to edit · <span className="mono">Enter</span> to add
      </footer>
    </div>
  );
}