ALTER TABLE "verification_code" DROP CONSTRAINT "verification_code_user_id_unique";--> statement-breakpoint
ALTER TABLE "establishments" ALTER COLUMN "status" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "verification_code" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "verification_code" ADD COLUMN "establishment_id" uuid;--> statement-breakpoint
ALTER TABLE "verification_code" ADD CONSTRAINT "verification_code_establishment_id_establishments_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE cascade ON UPDATE no action;