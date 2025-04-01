import { supabaseClient } from "~/server/supabase-client/client";
import { type CreateUserDto, type UpdateUserDto } from "../dto/user.dto";

export const UserService = {
  async find() {
    return (
      await supabaseClient
        .from("users")
        .select()
        .order("created_at", { ascending: false })
    ).data;
  },

  async findOne(id: string) {
    return (await supabaseClient.from("users").select().eq("id", id)).data?.[0];
  },

  async create(user: CreateUserDto) {
    return await supabaseClient.from("users").insert(user);
  },

  async update(id: string, user: UpdateUserDto) {
    return await supabaseClient.from("users").update(user).match({ id });
  },

  async delete(id: string) {
    return await supabaseClient.from("users").delete().match({ id });
  },
};
