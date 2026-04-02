import { eq, and } from "drizzle-orm";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { challenges, questions, userAnswers, wallets, coinTransactions, users } from "../../drizzle/schema";
import { z } from "zod";
import { defaultChallenges } from "../data/defaultChallenges";

export const challengesRouter = router({
  // Get all challenges
  getAll: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const allChallenges = await db.select().from(challenges);
    return allChallenges;
  }),

  // Get challenge with questions
  getChallenge: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const challenge = await db
        .select()
        .from(challenges)
        .where(eq(challenges.id, input.id))
        .limit(1);

      if (!challenge[0]) {
        throw new Error("Challenge not found");
      }

      const challengeQuestions = await db
        .select()
        .from(questions)
        .where(eq(questions.challengeId, input.id));

      return { ...challenge[0], questions: challengeQuestions };
    }),

  // Submit challenge answers
  submitAnswers: protectedProcedure
    .input(
      z.object({
        challengeId: z.number(),
        answers: z.array(
          z.object({
            questionId: z.number(),
            answer: z.enum(["A", "B", "C", "D"]),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get challenge
      const challenge = await db
        .select()
        .from(challenges)
        .where(eq(challenges.id, input.challengeId))
        .limit(1);

      if (!challenge[0]) {
        throw new Error("Challenge not found");
      }

      let correctCount = 0;

      // Process each answer
      for (const answer of input.answers) {
        const question = await db
          .select()
          .from(questions)
          .where(eq(questions.id, answer.questionId))
          .limit(1);

        if (!question[0]) continue;

        const isCorrect = question[0].correctAnswer === answer.answer ? 1 : 0;
        if (isCorrect) correctCount++;

        // Save user answer
        await db.insert(userAnswers).values({
          userId: ctx.user.id,
          challengeId: input.challengeId,
          questionId: answer.questionId,
          answer: answer.answer,
          isCorrect: isCorrect,
        });
      }

      // If all answers are correct, award coins
      if (correctCount === input.answers.length) {
        const wallet = await db
          .select()
          .from(wallets)
          .where(eq(wallets.userId, ctx.user.id))
          .limit(1);

        if (wallet[0]) {
          const newBalance = wallet[0].coins + challenge[0].rewardCoins;
          await db
            .update(wallets)
            .set({ coins: newBalance })
            .where(eq(wallets.userId, ctx.user.id));

          // Record transaction
          await db.insert(coinTransactions).values({
            userId: ctx.user.id,
            amount: challenge[0].rewardCoins,
            reason: `Challenge completed: ${challenge[0].title}`,
          });

          return {
            success: true,
            correctCount,
            totalQuestions: input.answers.length,
            coinsEarned: challenge[0].rewardCoins,
            newBalance,
          };
        }
      }

      return {
        success: true,
        correctCount,
        totalQuestions: input.answers.length,
        coinsEarned: 0,
      };
    }),

  // Admin: Create challenge
  create: adminProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        subject: z.enum(["Ciências", "Português", "Matemática", "História", "Geografia"]),
        rewardCoins: z.number().positive().default(10),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.insert(challenges).values({
        title: input.title,
        description: input.description || null,
        subject: input.subject,
        rewardCoins: input.rewardCoins,
      });

      return { success: true };
    }),

  // Admin: Add question to challenge
  addQuestion: adminProcedure
    .input(
      z.object({
        challengeId: z.number(),
        text: z.string().min(1),
        optionA: z.string().min(1),
        optionB: z.string().min(1),
        optionC: z.string().min(1),
        optionD: z.string().min(1),
        correctAnswer: z.enum(["A", "B", "C", "D"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.insert(questions).values({
        challengeId: input.challengeId,
        text: input.text,
        optionA: input.optionA,
        optionB: input.optionB,
        optionC: input.optionC,
        optionD: input.optionD,
        correctAnswer: input.correctAnswer,
      });

      return { success: true };
    }),

  // Admin: Update challenge
  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        rewardCoins: z.number().positive().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const updateData: Record<string, any> = {};
      if (input.title) updateData.title = input.title;
      if (input.description !== undefined) updateData.description = input.description || null;
      if (input.rewardCoins) updateData.rewardCoins = input.rewardCoins;

      await db.update(challenges).set(updateData).where(eq(challenges.id, input.id));

      return { success: true };
    }),

  // Admin: Delete challenge
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Delete questions first
      await db.delete(questions).where(eq(questions.challengeId, input.id));

      // Delete challenge
      await db.delete(challenges).where(eq(challenges.id, input.id));

      return { success: true };
    }),

  // Admin: Seed default challenges
  seedDefaults: adminProcedure.mutation(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    let createdCount = 0;

    for (const challenge of defaultChallenges) {
      // Check if challenge already exists
      const existing = await db
        .select()
        .from(challenges)
        .where(eq(challenges.title, challenge.title))
        .limit(1);

      if (existing.length > 0) {
        continue; // Skip if already exists
      }

      // Insert challenge
      await db.insert(challenges).values({
        title: challenge.title,
        description: challenge.description || null,
        subject: challenge.subject,
        rewardCoins: challenge.rewardCoins,
      });

      // Get the inserted challenge ID
      const inserted = await db
        .select()
        .from(challenges)
        .where(eq(challenges.title, challenge.title))
        .limit(1);

      if (inserted[0]) {
        createdCount++;

        // Insert questions
        for (const q of challenge.questions) {
          await db.insert(questions).values({
            challengeId: inserted[0].id,
            text: q.text,
            optionA: q.optionA,
            optionB: q.optionB,
            optionC: q.optionC,
            optionD: q.optionD,
            correctAnswer: q.correctAnswer as 'A' | 'B' | 'C' | 'D',
          });
        }
      }
    }

    return { success: true, createdCount };
  }),
});
