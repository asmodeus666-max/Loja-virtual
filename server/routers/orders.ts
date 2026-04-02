import { eq, and } from "drizzle-orm";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { orders, products, wallets, users, coinTransactions } from "../../drizzle/schema";
import { z } from "zod";
import { notifyOwner } from "../_core/notification";

export const ordersRouter = router({
  // Get user's orders
  getMyOrders: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const userOrders = await db
      .select({
        id: orders.id,
        productId: orders.productId,
        productName: products.name,
        productImage: products.imageUrl,
        quantity: orders.quantity,
        totalPrice: orders.totalPrice,
        status: orders.status,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .innerJoin(products, eq(orders.productId, products.id))
      .where(eq(orders.userId, ctx.user.id));

    return userOrders;
  }),

  // Create order (buy product)
  createOrder: protectedProcedure
    .input(
      z.object({
        productId: z.number(),
        quantity: z.number().positive().default(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get product
      const product = await db
        .select()
        .from(products)
        .where(eq(products.id, input.productId))
        .limit(1);

      if (!product[0]) {
        throw new Error("Product not found");
      }

      const totalPrice = product[0].price * input.quantity;

      // Get user's wallet
      const wallet = await db
        .select()
        .from(wallets)
        .where(eq(wallets.userId, ctx.user.id))
        .limit(1);

      if (!wallet[0]) {
        throw new Error("User wallet not found");
      }

      if (wallet[0].coins < totalPrice) {
        throw new Error("Insufficient coins");
      }

      // Deduct coins from wallet
      await db
        .update(wallets)
        .set({
          coins: wallet[0].coins - totalPrice,
        })
        .where(eq(wallets.userId, ctx.user.id));

      // Create order
      await db.insert(orders).values({
        userId: ctx.user.id,
        productId: input.productId,
        quantity: input.quantity,
        totalPrice: totalPrice,
        status: "pending",
      });

      // Record transaction
      await db.insert(coinTransactions).values({
        userId: ctx.user.id,
        amount: -totalPrice,
        reason: `Purchase: ${product[0].name}`,
      });

      // Send notification to owner
      await notifyOwner({
        title: "Novo Pedido na 3D LabShop",
        content: `${ctx.user.name} fez um pedido de ${input.quantity}x ${product[0].name} por ${totalPrice} moedas.`,
      });

      return { success: true, newBalance: wallet[0].coins - totalPrice };
    }),

  // Admin: Get all pending orders
  getPendingOrders: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const pendingOrders = await db
      .select({
        id: orders.id,
        userId: orders.userId,
        userName: users.name,
        userEmail: users.email,
        productId: orders.productId,
        productName: products.name,
        quantity: orders.quantity,
        totalPrice: orders.totalPrice,
        status: orders.status,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .innerJoin(users, eq(orders.userId, users.id))
      .innerJoin(products, eq(orders.productId, products.id))
      .where(eq(orders.status, "pending"));

    return pendingOrders;
  }),

  // Admin: Get all delivered orders
  getDeliveredOrders: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const deliveredOrders = await db
      .select({
        id: orders.id,
        userId: orders.userId,
        userName: users.name,
        userEmail: users.email,
        productId: orders.productId,
        productName: products.name,
        quantity: orders.quantity,
        totalPrice: orders.totalPrice,
        status: orders.status,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
      })
      .from(orders)
      .innerJoin(users, eq(orders.userId, users.id))
      .innerJoin(products, eq(orders.productId, products.id))
      .where(eq(orders.status, "delivered"));

    return deliveredOrders;
  }),

  // Admin: Mark order as delivered
  markAsDelivered: adminProcedure
    .input(z.object({ orderId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get order details
      const order = await db
        .select({
          id: orders.id,
          userId: orders.userId,
          productName: products.name,
        })
        .from(orders)
        .innerJoin(products, eq(orders.productId, products.id))
        .where(eq(orders.id, input.orderId))
        .limit(1);

      if (!order[0]) {
        throw new Error("Order not found");
      }

      // Get user email
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, order[0].userId))
        .limit(1);

      await db
        .update(orders)
        .set({ status: "delivered" })
        .where(eq(orders.id, input.orderId));

      // Send notification to owner
      await notifyOwner({
        title: "Pedido Entregue na 3D LabShop",
        content: `Pedido #${input.orderId} de ${user[0]?.name} (${order[0].productName}) foi marcado como entregue.`,
      });

      return { success: true };
    }),
});
