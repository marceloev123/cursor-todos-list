import type { Database } from "database.types";
import { z } from "zod";

export type CreateUserDto = Omit<
  Database["public"]["Tables"]["users"]["Insert"],
  "id" | "created_at" | "updated_at"
>;
export type UpdateUserDto = Database["public"]["Tables"]["users"]["Update"];
export type DeleteUserDto = { id: string };

export const CreateUserSchema = z.object({
  username: z.string(),
  email: z.string().email(),
});

export const UpdateUserSchema = CreateUserSchema.partial().extend({
  id: z.string().uuid(),
});
