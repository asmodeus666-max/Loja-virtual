import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "../db";
import { users, wallets, coinTransactions } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Coins Router", () => {
  let testUserId: number;
  let db: any;

  beforeAll(async () => {
    db = await getDb();
    if (!db) {
      throw new Error("Database not available for tests");
    }

    // Create a test user
    const result = await db.insert(users).values({
      openId: "test-user-coins",
      name: "Test User",
      email: "test@escola.pr.gov.br",
      role: "user",
    });

    // Get the inserted user ID
    const insertedUser = await db
      .select()
      .from(users)
      .where(eq(users.openId, "test-user-coins"))
      .limit(1);

    testUserId = insertedUser[0].id;

    // Create wallet for test user
    await db.insert(wallets).values({
      userId: testUserId,
      coins: 100,
    });
  });

  afterAll(async () => {
    if (!db) return;

    // Clean up test data
    await db.delete(coinTransactions).where(eq(coinTransactions.userId, testUserId));
    await db.delete(wallets).where(eq(wallets.userId, testUserId));
    await db.delete(users).where(eq(users.openId, "test-user-coins"));
  });

  it("should get user wallet", async () => {
    const wallet = await db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, testUserId))
      .limit(1);

    expect(wallet).toHaveLength(1);
    expect(wallet[0].coins).toBe(100);
  });

  it("should add coins to wallet", async () => {
    const wallet = await db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, testUserId))
      .limit(1);

    const initialCoins = wallet[0].coins;

    // Simulate adding coins
    await db
      .update(wallets)
      .set({ coins: initialCoins + 50 })
      .where(eq(wallets.userId, testUserId));

    const updatedWallet = await db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, testUserId))
      .limit(1);

    expect(updatedWallet[0].coins).toBe(initialCoins + 50);
  });

  it("should record coin transaction", async () => {
    await db.insert(coinTransactions).values({
      userId: testUserId,
      amount: 25,
      reason: "Test transaction",
    });

    const transactions = await db
      .select()
      .from(coinTransactions)
      .where(eq(coinTransactions.userId, testUserId));

    expect(transactions.length).toBeGreaterThan(0);
    expect(transactions[transactions.length - 1].amount).toBe(25);
  });
});
