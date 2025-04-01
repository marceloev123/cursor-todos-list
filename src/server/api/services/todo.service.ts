import { supabaseClient } from "~/server/supabase-client/client";
import { type CreateTodoDto, type UpdateTodoDto } from "../dto/todo.dto";

export const TodoService = {
  async find() {
    return (
      await supabaseClient
        .from("todos")
        .select()
        .order("created_at", { ascending: false })
    ).data;
  },

  async findOne(id: string) {
    return (await supabaseClient.from("todos").select().eq("id", id)).data?.[0];
  },

  async create(todo: CreateTodoDto) {
    return await supabaseClient.from("todos").insert(todo);
  },

  async update(id: string, todo: UpdateTodoDto) {
    return await supabaseClient.from("todos").update(todo).match({ id });
  },

  async delete(id: string) {
    return await supabaseClient.from("todos").delete().match({ id });
  },
};
