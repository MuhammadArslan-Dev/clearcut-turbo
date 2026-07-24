"use client";

import { useState } from "react";
import { Reorder, motion } from "framer-motion";

type Task = {
  id: number;
  title: string;
  tag: string;
  priority: "Low" | "Medium" | "High";
};

const initialTasks: Task[] = [
  { id: 1, title: "Design landing page hero", tag: "Design", priority: "High" },
  { id: 2, title: "Implement auth flow", tag: "Development", priority: "High" },
  { id: 3, title: "Write onboarding emails", tag: "Marketing", priority: "Medium" },
  { id: 4, title: "Prepare product demo", tag: "Sales", priority: "Medium" },
  { id: 5, title: "Fix dashboard bugs", tag: "QA", priority: "Low" },
];

export default function Page() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <DraggableTaskList />
    </div>
  );
}

function DraggableTaskList() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);



  return (
    <motion.div
      className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/80 p-5 text-slate-50 shadow-2xl backdrop-blur-xl"
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 120, damping: 18 }}
    >
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-sm font-semibold tracking-tight">
            Today&apos;s Tasks
          </h1>
          <p className="text-[11px] text-slate-400">
            Drag tasks to reorder by priority.
          </p>
        </div>
        <span className="rounded-full bg-slate-800 px-2 py-1 text-[10px] text-slate-300">
          {tasks.length} items
        </span>
      </header>

      {/* Reorder.Group makes the list sortable by drag */}
      <Reorder.Group
        axis="y"
        values={tasks}
        onReorder={setTasks}
        className="space-y-2"
      >
        {tasks.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
      </Reorder.Group>
    </motion.div>
  );
}

/* ---------------- Task item ---------------- */

function TaskItem({ task }: { task: Task }) {
  const priorityColor =
    task.priority === "High"
      ? "from-rose-500 to-orange-400"
      : task.priority === "Medium"
      ? "from-amber-400 to-emerald-400"
      : "from-sky-400 to-indigo-400";

  return (
    <Reorder.Item
      value={task} // required by Reorder
      id={task.id.toString()}
      // layout gives smooth movement when other items move around it
      layout
      // as={motion.div}
      className="group relative flex cursor-grab items-start gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 px-3 py-3 text-sm shadow-sm active:cursor-grabbing"
      whileHover={{
        y: -2,
        borderColor: "#38bdf8",
      }}
      whileDrag={{
        scale: 1.03,
        boxShadow: "0 18px 45px rgba(15,23,42,0.9)",
      }}
      drag
      dragElastic={0.15}
    >
      {/* Left priority bar */}
      <motion.div
        className={`mt-1 h-10 w-1.5 rounded-full bg-gradient-to-b ${priorityColor}`}
        layout
      />

      <div className="flex-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-[13px] font-medium text-slate-50">
            {task.title}
          </h3>
          <span className="rounded-full bg-slate-800/90 px-2 py-0.5 text-[10px] text-slate-300">
            {task.priority}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-slate-400">{task.tag}</p>
      </div>

      {/* Drag handle visual (three dots) */}
      <motion.div
        className="flex h-full items-center pl-1 text-slate-500"
        layout
      >
        <div className="flex flex-col gap-0.5 pr-1 opacity-60 group-hover:opacity-100">
          <span className="h-0.5 w-3 rounded-full bg-slate-600" />
          <span className="h-0.5 w-3 rounded-full bg-slate-600" />
          <span className="h-0.5 w-3 rounded-full bg-slate-600" />
        </div>
      </motion.div>
    </Reorder.Item>
  );
}