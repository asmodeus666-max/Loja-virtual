import { eq, and } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { cartItems, products, wallets, orders, coinTransactions } from "../../drizzle/schema";
import { z } from "zod";
import { notifyOwner } from "../_core/notification";

export const cartRouter = router({
  // Get user's cart
  getCart: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const cart = await db
      .select({
        id: cartItems.id,
        productId: cartItems.productId,
        productName: products.name,
        productImage: products.imageUrl,
        price: products.price,
        quantity: cartItems.quantity,
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.userId, ctx.user.id));

    // Calculate total price for each item
    return cart.map((item) => ({
      ...item,
      totalPrice: item.price * item.quantity,
    }));
  }),

  // Add item to cart
  addToCart: protectedProcedure
    .input(
      z.object({
        productId: z.number(),
        quantity: z.number().positive().default(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check if product exists
      const product = await db
        .select()
        .from(products)
        .where(eq(products.id, input.productId))
        .limit(1);

      if (!product[0]) {
        throw new Error("Product not found");
      }

      // Check if item already in cart
      const existing = await db
        .select()
        .from(cartItems)
        .where(
          and(
            eq(cartItems.userId, ctx.user.id),
            eq(cartItems.productId, input.productId)
          )
        )
        .limit(1);

      if (existing[0]) {
        // Update quantity
        await db
          .update(cartItems)
          .set({ quantity: existing[0].quantity + input.quantity })
          .where(eq(cartItems.id, existing[0].id));
      } else {
        // Insert new item
        await db.insert(cartItems).values({
          userId: ctx.user.id,
          productId: input.productId,
          quantity: input.quantity,
        });
      }

      return { success: true };
    }),

  // Update cart item quantity
  updateQuantity: protectedProcedure
    .input(
      z.object({
        cartItemId: z.number(),
        quantity: z.number().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify ownership
      const item = await db
        .select()
        .from(cartItems)
        .where(eq(cartItems.id, input.cartItemId))
        .limit(1);

      if (!item[0] || item[0].userId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }

      await db
        .update(cartItems)
        .set({ quantity: input.quantity })
        .where(eq(cartItems.id, input.cartItemId));

      return { success: true };
    }),

  // Remove item from cart
  removeFromCart: protectedProcedure
    .input(z.object({ cartItemId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify ownership
      const item = await db
        .select()
        .from(cartItems)
        .where(eq(cartItems.id, input.cartItemId))
        .limit(1);

      if (!item[0] || item[0].userId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }

      await db.delete(cartItems).where(eq(cartItems.id, input.cartItemId));

      return { success: true };
    }),

  // Checkout (create orders from cart)
  checkout: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get cart items
    const cart = await db
      .select({
        id: cartItems.id,
        productId: cartItems.productId,
        productName: products.name,
        quantity: cartItems.quantity,
        price: products.price,
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.userId, ctx.user.id));

    if (cart.length === 0) {
      throw new Error("Cart is empty");
    }

    // Calculate total
    let totalCoins = 0;
    for (const item of cart) {
      totalCoins += item.price * item.quantity;
    }

    // Get wallet
    const wallet = await db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, ctx.user.id))
      .limit(1);

    if (!wallet[0]) {
      throw new Error("User wallet not found");
    }

    if (wallet[0].coins < totalCoins) {
      throw new Error("Insufficient coins");
    }

    // Deduct coins
    await db
      .update(wallets)
      .set({ coins: wallet[0].coins - totalCoins })
      .where(eq(wallets.userId, ctx.user.id));

    // Create orders for each item
    for (const item of cart) {
      const totalPrice = item.price * item.quantity;

      await db.insert(orders).values({
        userId: ctx.user.id,
        productId: item.productId,
        quantity: item.quantity,
        totalPrice: totalPrice,
        status: "pending",
      });

      // Record transaction
      await db.insert(coinTransactions).values({
        userId: ctx.user.id,
        amount: -totalPrice,
        reason: `Purchase: ${item.productName}`,
      });
    }

    // Clear cart
    await db.delete(cartItems).where(eq(cartItems.userId, ctx.user.id));

    // Send notification
    const itemsList = cart.map((item) => `${item.quantity}x ${item.productName}`).join(", ");
    await notifyOwner({
      title: "Novo Pedido na 3D LabShop",
      content: `${ctx.user.name} fez checkout com ${cart.length} item(s): ${itemsList}. Total: ${totalCoins} moedas.`,
    });

    return { success: true, ordersCreated: cart.length, totalCoins };
  }),

  // Clear cart
  clearCart: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    await db.delete(cartItems).where(eq(cartItems.userId, ctx.user.id));

    return { success: true };
  }),
});
