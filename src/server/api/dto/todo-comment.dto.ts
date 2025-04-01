import type { Database } from "database.types";
import { z } from "zod";

export type CreateTodoCommentDto = Omit<
  Database["public"]["Tables"]["todo_comments"]["Insert"],
  "id" | "created_at"
>;
export type UpdateTodoCommentDto =
  Database["public"]["Tables"]["todo_comments"]["Update"];
export type DeleteTodoCommentDto = { id: string };

export const CreateTodoCommentSchema = z.object({
  comment: z.string(),
  todo_id: z.string().uuid(),
  user_id: z.string().uuid(),
});

export const UpdateTodoCommentSchema = CreateTodoCommentSchema.partial().extend(
  {
    id: z.string().uuid(),
  },
);
