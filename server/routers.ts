import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { coinsRouter } from "./routers/coins";
import { productsRouter } from "./routers/products";
import { ordersRouter } from "./routers/orders";
import { challengesRouter } from "./routers/challenges";
import { cartRouter } from "./routers/cart";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  coins: coinsRouter,
  products: productsRouter,
  orders: ordersRouter,
  challenges: challengesRouter,
  cart: cartRouter,
});

export type AppRouter = typeof appRouter;
