"use client";

import React, { useState } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

// --- Mock Database ---
let mockTodos = [
  { id: 1, title: "Buy groceries" },
  { id: 2, title: "Walk the dog" },
  { id: 3, title: "Finish React project" },
];

// --- Mock API Functions ---
async function getTodos() {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  return mockTodos;
}

async function postTodo(newTodo: { id: number; title: string }) {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));
  mockTodos = [...mockTodos, newTodo];
  return newTodo;
}

// --- React Query Client ---
const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Todos />
    </QueryClientProvider>
  );
}

function Todos() {
  const queryClient = useQueryClient();

  // Fetch todos
  const { data, isLoading, isError } = useQuery({
    queryKey: ["todos"],
    queryFn: getTodos,
  });

  // Handle mutations
  const mutation = useMutation({
    mutationFn: postTodo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });

  if (isLoading) return <p>Loading todos...</p>;
  if (isError) return <p>Something went wrong!</p>;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Todo List</h1>
      <ul className="list-disc list-inside space-y-1">
        {data?.map((todo) => (
          <li key={todo.id}>{todo.title}</li>
        ))}
      </ul>

      <button
        className="px-4 py-2 bg-blue-500 text-white rounded"
        onClick={() =>
          mutation.mutate({ id: Date.now(), title: "Do Laundry" })
        }
      >
        Add Todo
      </button>
    </div>
  );
}
