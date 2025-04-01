import Head from "next/head";
import { useState, useEffect, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { ThemeToggle } from "~/components/theme/theme-toggle";
import {
  MoreVertical,
  Pencil,
  Trash2,
  CheckCircle2,
  SlidersHorizontal,
  Search,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "~/components/ui/dropdown-menu";

import { api } from "~/utils/api";
import { AddTaskDialog } from "~/components/task/add-task-dialog";
import type { Database } from "database.types";

// Define todo type based on the database schema
export type Todo = Database["public"]["Tables"]["todos"]["Row"];

// Define user type based on the database schema
export type User = Database["public"]["Tables"]["users"]["Row"];

// Define all available columns
type ColumnId =
  | "name"
  | "description"
  | "priority"
  | "status"
  | "storyPoints"
  | "dueDate"
  | "assignee"
  | "creator"
  | "createdAt";

type ColumnDef = {
  id: ColumnId;
  name: string;
  defaultVisible: boolean;
};

const columns: ColumnDef[] = [
  { id: "name", name: "Name", defaultVisible: true },
  { id: "description", name: "Description", defaultVisible: true },
  { id: "priority", name: "Priority", defaultVisible: true },
  { id: "status", name: "Status", defaultVisible: true },
  { id: "storyPoints", name: "Story Points", defaultVisible: true },
  { id: "dueDate", name: "Due Date", defaultVisible: false },
  { id: "assignee", name: "Assignee", defaultVisible: false },
  { id: "creator", name: "Creator", defaultVisible: false },
  { id: "createdAt", name: "Created At", defaultVisible: false },
];

export default function Home() {
  // State hooks
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<ColumnId[]>(
    columns
      .filter((column) => column.defaultVisible)
      .map((column) => column.id),
  );

  // API hooks - all React hooks must be called unconditionally at the top level
  const utils = api.useUtils();
  const todoQuery = api.todo.find.useQuery(undefined, {
    refetchOnWindowFocus: true, // Refetch when window gets focus
    refetchOnMount: true, // Refetch when component mounts
    refetchInterval: false, // Don't auto-refetch at intervals
  });
  const usersQuery = api.user.find.useQuery();
  const markCompletedMutation = api.todo.update.useMutation({
    onSuccess: () => void utils.todo.find.invalidate(),
  });
  const deleteMutation = api.todo.delete.useMutation({
    onSuccess: () => void utils.todo.find.invalidate(),
  });

  // Client-side rendering effect
  useEffect(() => {
    setMounted(true);
  }, []);

  // Derived data
  const todos = useMemo(() => todoQuery.data ?? [], [todoQuery.data]);
  const users = useMemo(() => usersQuery.data ?? [], [usersQuery.data]);

  // User map for looking up usernames from IDs
  const userMap = useMemo(() => {
    const map = new Map<string, string>();
    users.forEach((user) => {
      map.set(user.id, user.username);
    });
    return map;
  }, [users]);

  // Filtered todos based on search query
  const filteredTodos = useMemo(() => {
    if (!searchQuery.trim()) return todos;

    const query = searchQuery.toLowerCase().trim();

    return todos.filter((todo) => {
      const assigneeUsername = todo.assignee_id
        ? (userMap.get(todo.assignee_id)?.toLowerCase() ?? "")
        : "";
      const creatorUsername = todo.creator_id
        ? (userMap.get(todo.creator_id)?.toLowerCase() ?? "")
        : "";

      return (
        todo.name.toLowerCase().includes(query) ||
        (todo.description?.toLowerCase().includes(query) ?? false) ||
        todo.priority.toLowerCase().includes(query) ||
        todo.status.toLowerCase().includes(query) ||
        (todo.story_points?.toString().includes(query) ?? false) ||
        assigneeUsername.includes(query) ||
        creatorUsername.includes(query)
      );
    });
  }, [todos, searchQuery, userMap]);

  // Column visibility functions
  const toggleColumn = (columnId: ColumnId) => {
    setVisibleColumns((current) =>
      current.includes(columnId)
        ? current.filter((id) => id !== columnId)
        : [...current, columnId],
    );
  };

  const isColumnVisible = (columnId: ColumnId) => {
    return visibleColumns.includes(columnId);
  };

  // Action handlers
  const handleTaskAdded = async () => {
    console.log("Task added, refreshing data...");
    try {
      await utils.todo.find.invalidate();
      // We want to get fresh data
      const result = await todoQuery.refetch();
      console.log("Refetch result:", {
        success: result.isSuccess,
        data: result.data,
        dataLength: result.data?.length ?? 0,
      });
    } catch (error) {
      console.error("Error refetching todos:", error);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  const markTaskCompleted = (todoId: string) => {
    markCompletedMutation.mutate({
      id: todoId,
      status: "completed",
    });
  };

  const deleteTask = (todoId: string) => {
    if (confirm("Are you sure you want to delete this task?")) {
      deleteMutation.mutate({ id: todoId });
    }
  };

  // UI helper functions
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return (
          <span className="bg-destructive/20 text-destructive rounded-full px-2.5 py-0.5 text-xs font-medium">
            High
          </span>
        );
      case "medium":
        return (
          <span className="rounded-full bg-yellow-500/20 px-2.5 py-0.5 text-xs font-medium text-yellow-500">
            Medium
          </span>
        );
      case "low":
        return (
          <span className="rounded-full bg-green-500/20 px-2.5 py-0.5 text-xs font-medium text-green-500">
            Low
          </span>
        );
      default:
        return <span>{priority}</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return (
          <span className="rounded-full bg-blue-500/20 px-2.5 py-0.5 text-xs font-medium text-blue-500">
            Pending
          </span>
        );
      case "in_progress":
        return (
          <span className="rounded-full bg-purple-500/20 px-2.5 py-0.5 text-xs font-medium text-purple-500">
            In Progress
          </span>
        );
      case "completed":
        return (
          <span className="rounded-full bg-green-500/20 px-2.5 py-0.5 text-xs font-medium text-green-500">
            Completed
          </span>
        );
      case "archived":
        return (
          <span className="rounded-full bg-gray-500/20 px-2.5 py-0.5 text-xs font-medium text-gray-500">
            Archived
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  // Debug effect
  useEffect(() => {
    console.log("Current todos:", todos);
    console.log("Current filtered todos:", filteredTodos);
    console.log("Current users:", users);
    console.log("todoQuery status:", {
      isLoading: todoQuery.isLoading,
      isError: todoQuery.isError,
      isFetching: todoQuery.isFetching,
      isSuccess: todoQuery.isSuccess,
      dataUpdatedAt: todoQuery.dataUpdatedAt,
    });
  }, [
    todos,
    filteredTodos,
    users,
    todoQuery.isLoading,
    todoQuery.isError,
    todoQuery.isFetching,
    todoQuery.dataUpdatedAt,
    todoQuery.isSuccess,
  ]);

  // Handle SSR
  if (!mounted) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Todo List App</title>
        <meta name="description" content="T3 Todo List Application" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="bg-background min-h-screen p-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-foreground text-4xl font-bold">Todo List</h1>
            <ThemeToggle />
          </div>

          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row">
            <div className="relative w-full sm:w-96">
              <div className="relative">
                <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search tasks..."
                  className="w-full pr-10 pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    className="text-muted-foreground hover:text-foreground absolute top-2.5 right-2.5 h-4 w-4"
                    onClick={clearSearch}
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Clear search</span>
                  </button>
                )}
              </div>
              {searchQuery && (
                <div className="text-muted-foreground mt-1 text-sm">
                  Found {filteredTodos.length}{" "}
                  {filteredTodos.length === 1 ? "result" : "results"}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <SlidersHorizontal className="mr-2 h-4 w-4" />
                    Columns
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {columns.map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={isColumnVisible(column.id)}
                      onCheckedChange={() => toggleColumn(column.id)}
                    >
                      {column.name}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <AddTaskDialog onTaskAdded={handleTaskAdded} />
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              {todoQuery.isLoading ? (
                <div className="flex justify-center py-8">
                  <p>Loading tasks...</p>
                </div>
              ) : todoQuery.isError ? (
                <div className="flex justify-center py-8">
                  <p>Error loading tasks: {todoQuery.error.message}</p>
                </div>
              ) : todos.length === 0 ? (
                <div className="flex justify-center py-8">
                  <p>No tasks found. Create your first task!</p>
                </div>
              ) : filteredTodos.length === 0 ? (
                <div className="flex justify-center py-8">
                  <p>
                    No tasks match your search. Try a different query or{" "}
                    <button
                      onClick={clearSearch}
                      className="text-primary hover:underline"
                    >
                      clear the search
                    </button>
                    .
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {isColumnVisible("name") && <TableHead>Name</TableHead>}
                        {isColumnVisible("description") && (
                          <TableHead>Description</TableHead>
                        )}
                        {isColumnVisible("priority") && (
                          <TableHead>Priority</TableHead>
                        )}
                        {isColumnVisible("status") && (
                          <TableHead>Status</TableHead>
                        )}
                        {isColumnVisible("storyPoints") && (
                          <TableHead>Story Points</TableHead>
                        )}
                        {isColumnVisible("dueDate") && (
                          <TableHead>Due Date</TableHead>
                        )}
                        {isColumnVisible("assignee") && (
                          <TableHead>Assignee</TableHead>
                        )}
                        {isColumnVisible("creator") && (
                          <TableHead>Creator</TableHead>
                        )}
                        {isColumnVisible("createdAt") && (
                          <TableHead>Created At</TableHead>
                        )}
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTodos.map((todo) => (
                        <TableRow key={todo.id}>
                          {isColumnVisible("name") && (
                            <TableCell className="font-medium">
                              {todo.name}
                            </TableCell>
                          )}
                          {isColumnVisible("description") && (
                            <TableCell>{todo.description ?? "N/A"}</TableCell>
                          )}
                          {isColumnVisible("priority") && (
                            <TableCell>
                              {getPriorityBadge(todo.priority)}
                            </TableCell>
                          )}
                          {isColumnVisible("status") && (
                            <TableCell>{getStatusBadge(todo.status)}</TableCell>
                          )}
                          {isColumnVisible("storyPoints") && (
                            <TableCell>{todo.story_points ?? "N/A"}</TableCell>
                          )}
                          {isColumnVisible("dueDate") && (
                            <TableCell>{formatDate(todo.due_date)}</TableCell>
                          )}
                          {isColumnVisible("assignee") && (
                            <TableCell>
                              {todo.assignee_id
                                ? (userMap.get(todo.assignee_id) ?? "Unknown")
                                : "Unassigned"}
                            </TableCell>
                          )}
                          {isColumnVisible("creator") && (
                            <TableCell>
                              {userMap.get(todo.creator_id) ?? "Unknown"}
                            </TableCell>
                          )}
                          {isColumnVisible("createdAt") && (
                            <TableCell>{formatDate(todo.created_at)}</TableCell>
                          )}
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => markTaskCompleted(todo.id)}
                                >
                                  <CheckCircle2 className="mr-2 h-4 w-4" />
                                  <span>Mark completed</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  <span>Edit</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => deleteTask(todo.id)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  <span>Delete</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
