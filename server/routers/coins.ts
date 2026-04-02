import { eq, and } from "drizzle-orm";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { wallets, coinTransactions, users } from "../../drizzle/schema";
import { z } from "zod";

export const coinsRouter = router({
  // Get user's wallet
  getWallet: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const wallet = await db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, ctx.user.id))
      .limit(1);

    return wallet[0] || { coins: 0, userId: ctx.user.id };
  }),

  // Get coin transactions history
  getTransactionHistory: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const transactions = await db
      .select({
        id: coinTransactions.id,
        amount: coinTransactions.amount,
        reason: coinTransactions.reason,
        createdBy: coinTransactions.createdBy,
        createdAt: coinTransactions.createdAt,
        createdByName: users.name,
      })
      .from(coinTransactions)
      .leftJoin(users, eq(coinTransactions.createdBy, users.id))
      .where(eq(coinTransactions.userId, ctx.user.id))
      .orderBy((t) => t.createdAt);

    return transactions;
  }),

  // Admin: Add coins to user
  addCoinsToUser: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        amount: z.number().positive(),
        reason: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get user's wallet
      const wallet = await db
        .select()
        .from(wallets)
        .where(eq(wallets.userId, input.userId))
        .limit(1);

      if (!wallet[0]) {
        throw new Error("User wallet not found");
      }

      // Update wallet
      await db
        .update(wallets)
        .set({
          coins: wallet[0].coins + input.amount,
        })
        .where(eq(wallets.userId, input.userId));

      // Record transaction
      await db.insert(coinTransactions).values({
        userId: input.userId,
        amount: input.amount,
        reason: input.reason,
        createdBy: ctx.user.id,
      });

      return { success: true, newBalance: wallet[0].coins + input.amount };
    }),

  // Admin: Remove coins from user
  removeCoinsFromUser: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        amount: z.number().positive(),
        reason: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get user's wallet
      const wallet = await db
        .select()
        .from(wallets)
        .where(eq(wallets.userId, input.userId))
        .limit(1);

      if (!wallet[0]) {
        throw new Error("User wallet not found");
      }

      if (wallet[0].coins < input.amount) {
        throw new Error("Insufficient coins");
      }

      // Update wallet
      await db
        .update(wallets)
        .set({
          coins: wallet[0].coins - input.amount,
        })
        .where(eq(wallets.userId, input.userId));

      // Record transaction
      await db.insert(coinTransactions).values({
        userId: input.userId,
        amount: -input.amount,
        reason: input.reason,
        createdBy: ctx.user.id,
      });

      return { success: true, newBalance: wallet[0].coins - input.amount };
    }),

  // Admin: Get all users with their wallets
  getAllUsersWallets: adminProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const usersWithWallets = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        coins: wallets.coins,
        role: users.role,
      })
      .from(users)
      .leftJoin(wallets, eq(users.id, wallets.userId));

    return usersWithWallets;
  }),

  // Admin: Promote user to admin
  promoteToAdmin: adminProcedure
    .input(
      z.object({
        userId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(users)
        .set({
          role: "admin",
        })
        .where(eq(users.id, input.userId));

      return { success: true };
    }),

  // Admin: Remove admin role from user
  removeAdminRole: adminProcedure
    .input(
      z.object({
        userId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(users)
        .set({
          role: "user",
        })
        .where(eq(users.id, input.userId));

      return { success: true };
    }),
});
