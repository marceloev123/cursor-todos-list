import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { TodoService } from "../services/todo.service";
import { CreateTodoSchema, UpdateTodoSchema } from "../dto/todo.dto";
import { z } from "zod";

export const todoRouter = createTRPCRouter({
  find: publicProcedure.query(() => {
    return TodoService.find();
  }),

  findOne: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      }),
    )
    .query(({ input }) => {
      return TodoService.findOne(input.id);
    }),

  create: publicProcedure.input(CreateTodoSchema).mutation(({ input }) => {
    return TodoService.create(input);
  }),

  update: publicProcedure.input(UpdateTodoSchema).mutation(({ input }) => {
    return TodoService.update(input.id, input);
  }),

  delete: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      }),
    )
    .mutation(({ input }) => {
      return TodoService.delete(input.id);
    }),
});
