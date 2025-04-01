import type { Database } from "database.types";
import { z } from "zod";

export type CreateTodoDto = Omit<
  Database["public"]["Tables"]["todos"]["Insert"],
  "id" | "created_at" | "updated_at"
>;
export type UpdateTodoDto = Database["public"]["Tables"]["todos"]["Update"];
export type DeleteTodoDto = { id: string };

export const CreateTodoSchema = z.object({
  name: z.string(),
  description: z.string().nullable(),
  priority: z.string(),
  status: z.string(),
  story_points: z.number().nullable(),
  due_date: z.string().nullable(),
  creator_id: z.string().uuid(),
  assignee_id: z.string().uuid().nullable(),
});

export const UpdateTodoSchema = CreateTodoSchema.partial().extend({
  id: z.string().uuid(),
});
