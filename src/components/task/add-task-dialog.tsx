import { useState, useEffect, useMemo } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Calendar } from "~/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

import { api } from "~/utils/api";
import { PlusCircle } from "lucide-react";

// Create a schema for the form using Zod
const formSchema = z.object({
  name: z.string().min(1, "Task name is required"),
  description: z.string().nullable().optional(),
  priority: z.string().min(1, "Priority is required"),
  status: z.string().min(1, "Status is required"),
  story_points: z.number().nullable().optional(),
  // We'll handle date transformation in onSubmit
  due_date: z.date().nullable().optional(),
  // For now, we'll use a fixed creator_id since we don't have auth yet
  creator_id: z.string().uuid(),
  assignee_id: z
    .union([z.string().uuid(), z.literal("unassigned")])
    .transform((val) => (val === "unassigned" ? null : val))
    .nullable(),
});

// Define the type for the form values
export type TaskFormValues = z.infer<typeof formSchema>;

// Define the type for the final formatted values to match the backend DTO
export type CreateTodoFormattedValues = {
  name: string;
  description: string | null;
  priority: string;
  status: string;
  story_points: number | null;
  due_date: string | null;
  creator_id: string;
  assignee_id: string | null;
};

// Define the type for user from the API
type User = {
  id: string;
  username: string;
  email: string;
  created_at: string | null;
  updated_at: string | null;
};

interface AddTaskDialogProps {
  onTaskAdded?: () => Promise<void>;
}

export function AddTaskDialog({ onTaskAdded }: AddTaskDialogProps) {
  const [open, setOpen] = useState(false);

  // Get users for assignee dropdown
  const usersQuery = api.user.find.useQuery();
  const users = useMemo(
    () => usersQuery.data ?? [],
    [usersQuery.data],
  ) as User[];

  // Create form instance
  const form = useForm<TaskFormValues>({
    defaultValues: {
      name: "",
      description: "",
      priority: "medium",
      status: "pending",
      story_points: null,
      due_date: null,
      // Default creator - in a real app we'd use the logged-in user's ID
      creator_id: users[0]?.id ?? "",
      assignee_id: "unassigned",
    },
    resolver: zodResolver(formSchema),
  });

  // Update the form when users are loaded
  useEffect(() => {
    if (users.length > 0 && !form.getValues("creator_id")) {
      form.reset({
        ...form.getValues(),
        creator_id: users[0]?.id ?? "",
      });
    }
  }, [users, form]);

  // Create task mutation
  const utils = api.useUtils();
  const createTaskMutation = api.todo.create.useMutation({
    onSuccess: async () => {
      console.log("Task created successfully!");
      setOpen(false);
      form.reset();
      // Invalidate the todos query to refresh the data
      await utils.todo.find.invalidate();
      // Call onTaskAdded callback if provided
      if (onTaskAdded) await onTaskAdded();
    },
    onError: (error) => {
      console.error("Error creating task:", error);
      alert("Failed to create task. Please try again.");
    },
  });

  // Handle form submission
  const onSubmit: SubmitHandler<TaskFormValues> = (values) => {
    console.log("Form submission values:", values);

    // Format dates for the backend
    const formattedValues: CreateTodoFormattedValues = {
      name: values.name,
      description: values.description ?? null,
      priority: values.priority,
      status: values.status,
      story_points: values.story_points ?? null,
      due_date: values.due_date ? values.due_date.toISOString() : null,
      creator_id: values.creator_id,
      assignee_id: values.assignee_id,
    };

    console.log("Formatted values for submission:", formattedValues);
    createTaskMutation.mutate(formattedValues);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-4 py-4"
          >
            {/* Task Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Task name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Task description"
                      className="resize-none"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Priority and Status in a row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Priority */}
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Story Points and Due Date in a row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Story Points */}
              <FormField
                control={form.control}
                name="story_points"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Story Points</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Story points"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : null,
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Due Date */}
              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Due Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className="w-full pl-3 text-left font-normal"
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span className="text-muted-foreground">
                                Pick a date
                              </span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ?? undefined}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Assignee */}
            <FormField
              control={form.control}
              name="assignee_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assignee</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? "unassigned"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Assign to..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.username}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createTaskMutation.isPending}>
                {createTaskMutation.isPending ? "Saving..." : "Save Task"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
