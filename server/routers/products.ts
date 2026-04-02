import { eq, desc } from "drizzle-orm";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { products } from "../../drizzle/schema";
import { z } from "zod";

export const productsRouter = router({
  // Get all products
  getAll: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const allProducts = await db.select().from(products);
    return allProducts;
  }),

  // Get product by id
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const product = await db
        .select()
        .from(products)
        .where(eq(products.id, input.id))
        .limit(1);

      return product[0] || null;
    }),

  // Admin: Create product
  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        price: z.number().positive(),
        imageUrl: z.string().url().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.insert(products).values({
        name: input.name,
        description: input.description || null,
        price: input.price,
        imageUrl: input.imageUrl || null,
      });

      return { success: true };
    }),

  // Admin: Update product
  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        price: z.number().positive().optional(),
        imageUrl: z.string().url().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const updateData: Record<string, any> = {};
      if (input.name) updateData.name = input.name;
      if (input.description !== undefined) updateData.description = input.description || null;
      if (input.price) updateData.price = input.price;
      if (input.imageUrl !== undefined) updateData.imageUrl = input.imageUrl || null;

      await db.update(products).set(updateData).where(eq(products.id, input.id));

      return { success: true };
    }),

  // Admin: Delete product
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.delete(products).where(eq(products.id, input.id));

      return { success: true };
    }),

  // Search and filter products
  search: publicProcedure
    .input(
      z.object({
        query: z.string().optional(),
        minPrice: z.number().optional(),
        maxPrice: z.number().optional(),
        sortBy: z.enum(["name", "price", "newest"]).optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get all products first
      let allProducts = await db.select().from(products);

      // Filter by query
      if (input.query) {
        const query = input.query.toLowerCase();
        allProducts = allProducts.filter(
          (p) =>
            p.name.toLowerCase().includes(query) ||
            (p.description?.toLowerCase().includes(query) ?? false)
        );
      }

      // Filter by price range
      if (input.minPrice !== undefined) {
        const minPrice = input.minPrice;
        allProducts = allProducts.filter((p) => p.price >= minPrice);
      }
      if (input.maxPrice !== undefined) {
        const maxPrice = input.maxPrice;
        allProducts = allProducts.filter((p) => p.price <= maxPrice);
      }

      // Sort
      if (input.sortBy === "price") {
        allProducts.sort((a, b) => a.price - b.price);
      } else if (input.sortBy === "newest") {
        allProducts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      } else {
        allProducts.sort((a, b) => a.name.localeCompare(b.name));
      }

      return allProducts;
    }),
});
