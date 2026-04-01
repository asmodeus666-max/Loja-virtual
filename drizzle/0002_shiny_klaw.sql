ALTER TABLE `orders` DROP FOREIGN KEY `orders_productId_products_id_fk`;
--> statement-breakpoint
ALTER TABLE `questions` DROP FOREIGN KEY `questions_challengeId_challenges_id_fk`;
--> statement-breakpoint
ALTER TABLE `userAnswers` DROP FOREIGN KEY `userAnswers_challengeId_challenges_id_fk`;
--> statement-breakpoint
ALTER TABLE `userAnswers` DROP FOREIGN KEY `userAnswers_questionId_questions_id_fk`;
--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `questions` ADD CONSTRAINT `questions_challengeId_challenges_id_fk` FOREIGN KEY (`challengeId`) REFERENCES `challenges`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `userAnswers` ADD CONSTRAINT `userAnswers_challengeId_challenges_id_fk` FOREIGN KEY (`challengeId`) REFERENCES `challenges`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `userAnswers` ADD CONSTRAINT `userAnswers_questionId_questions_id_fk` FOREIGN KEY (`questionId`) REFERENCES `questions`(`id`) ON DELETE cascade ON UPDATE no action;
