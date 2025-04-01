import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { todoRouter } from "./routers/todo.router";
import { todoCommentRouter } from "./routers/todo-comment.router";
import { userRouter } from "./routers/user.router";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  todo: todoRouter,
  todoComment: todoCommentRouter,
  user: userRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
