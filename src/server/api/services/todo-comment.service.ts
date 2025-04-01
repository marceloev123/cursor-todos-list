import { supabaseClient } from "~/server/supabase-client/client";
import {
  type CreateTodoCommentDto,
  type UpdateTodoCommentDto,
} from "../dto/todo-comment.dto";

export const TodoCommentService = {
  async find() {
    return (
      await supabaseClient
        .from("todo_comments")
        .select()
        .order("created_at", { ascending: false })
    ).data;
  },

  async findOne(id: string) {
    return (await supabaseClient.from("todo_comments").select().eq("id", id))
      .data?.[0];
  },

  async findByTodoId(todoId: string) {
    return (
      await supabaseClient
        .from("todo_comments")
        .select()
        .eq("todo_id", todoId)
        .order("created_at", { ascending: false })
    ).data;
  },

  async create(comment: CreateTodoCommentDto) {
    return await supabaseClient.from("todo_comments").insert(comment);
  },

  async update(id: string, comment: UpdateTodoCommentDto) {
    return await supabaseClient
      .from("todo_comments")
      .update(comment)
      .match({ id });
  },

  async delete(id: string) {
    return await supabaseClient.from("todo_comments").delete().match({ id });
  },
};
