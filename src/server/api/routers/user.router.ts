import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { UserService } from "../services/user.service";
import { CreateUserSchema, UpdateUserSchema } from "../dto/user.dto";
import { z } from "zod";

export const userRouter = createTRPCRouter({
  find: publicProcedure.query(() => {
    return UserService.find();
  }),

  findOne: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      }),
    )
    .query(({ input }) => {
      return UserService.findOne(input.id);
    }),

  create: publicProcedure.input(CreateUserSchema).mutation(({ input }) => {
    return UserService.create(input);
  }),

  update: publicProcedure.input(UpdateUserSchema).mutation(({ input }) => {
    return UserService.update(input.id, input);
  }),

  delete: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      }),
    )
    .mutation(({ input }) => {
      return UserService.delete(input.id);
    }),
});
