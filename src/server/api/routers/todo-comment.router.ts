import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { TodoCommentService } from "../services/todo-comment.service";
import {
  CreateTodoCommentSchema,
  UpdateTodoCommentSchema,
} from "../dto/todo-comment.dto";
import { z } from "zod";

export const todoCommentRouter = createTRPCRouter({
  find: publicProcedure.query(() => {
    return TodoCommentService.find();
  }),

  findOne: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      }),
    )
    .query(({ input }) => {
      return TodoCommentService.findOne(input.id);
    }),

  findByTodoId: publicProcedure
    .input(
      z.object({
        todoId: z.string().uuid(),
      }),
    )
    .query(({ input }) => {
      return TodoCommentService.findByTodoId(input.todoId);
    }),

  create: publicProcedure
    .input(CreateTodoCommentSchema)
    .mutation(({ input }) => {
      return TodoCommentService.create(input);
    }),

  update: publicProcedure
    .input(UpdateTodoCommentSchema)
    .mutation(({ input }) => {
      return TodoCommentService.update(input.id, input);
    }),

  delete: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      }),
    )
    .mutation(({ input }) => {
      return TodoCommentService.delete(input.id);
    }),
});
