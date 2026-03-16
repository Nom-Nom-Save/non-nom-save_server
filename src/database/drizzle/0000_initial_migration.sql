CREATE TYPE "public"."subscription_status" AS ENUM('active', 'cancelled', 'expired', 'pending');--> statement-breakpoint
CREATE TABLE "box_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"box_id" uuid NOT NULL,
	"product_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "boxes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bound_to" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"recommended_price" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"quantity_of_items" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "establishments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"is_email_verified" boolean DEFAULT false NOT NULL,
	"password" varchar(255),
	"name" varchar(255),
	"description" text,
	"address" text,
	"latitude" numeric,
	"longitude" numeric,
	"working_hours" varchar(255),
	"rating" numeric(3, 2),
	"bound_to" varchar(255) DEFAULT encode(gen_random_bytes(110), 'hex') NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"status" varchar(20) GENERATED ALWAYS AS (CASE 
      WHEN name IS NOT NULL 
       AND address IS NOT NULL
       AND bound_to IS NOT NULL 
      THEN 'Active' 
      ELSE 'Inactive' 
    END) STORED NOT NULL,
	CONSTRAINT "establishments_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "favorite_establishments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"establishment_id" uuid NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "google_oauth_credentials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"establishment_id" uuid,
	"google_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "google_oauth_credentials_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "google_oauth_credentials_establishment_id_unique" UNIQUE("establishment_id"),
	CONSTRAINT "google_oauth_credentials_google_id_unique" UNIQUE("google_id"),
	CONSTRAINT "google_oauth_exclusive_owner_check" CHECK (num_nonnulls("google_oauth_credentials"."user_id", "google_oauth_credentials"."establishment_id") = 1)
);
--> statement-breakpoint
CREATE TABLE "menu_prices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"menu_item_id" uuid NOT NULL,
	"total_quantity" integer NOT NULL,
	"available_quantity" integer NOT NULL,
	"original_price" integer NOT NULL,
	"discount_price" integer,
	"start_time" timestamp,
	"end_time" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "menu" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"establishment_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"item_type" varchar(50) NOT NULL,
	"status" varchar(50) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"menu_price_id" uuid NOT NULL,
	"quantity" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"total_price" integer NOT NULL,
	"order_status" varchar(50) NOT NULL,
	"qr_code_data" varchar(255),
	"reserved_at" timestamp,
	"expires_at" timestamp,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "product_allergens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_product" uuid NOT NULL,
	"id_allergen" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_product" uuid NOT NULL,
	"id_type" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bound_to" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"weight" integer,
	"description" text,
	"recommended_price" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"establishment_id" uuid,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	CONSTRAINT "refresh_tokens_token_unique" UNIQUE("token"),
	CONSTRAINT "exclusive_owner_check" CHECK (num_nonnulls("refresh_tokens"."user_id", "refresh_tokens"."establishment_id") = 1)
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"establishment_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"price" numeric(10, 2) NOT NULL,
	"currency" char(3) NOT NULL,
	"duration_days" integer NOT NULL,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"subscription_plan_id" uuid,
	"paypal_subscription_id" varchar(255),
	"status" "subscription_status" DEFAULT 'pending' NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	CONSTRAINT "subscriptions_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "subscriptions_paypal_subscription_id_unique" UNIQUE("paypal_subscription_id")
);
--> statement-breakpoint
CREATE TABLE "type_boxes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type_id" uuid NOT NULL,
	"box_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "types_of_allergens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "types_of_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255),
	"full_name" varchar(255),
	"is_email_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_code" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"code" varchar(4) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "verification_code_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "box_items" ADD CONSTRAINT "box_items_box_id_boxes_id_fk" FOREIGN KEY ("box_id") REFERENCES "public"."boxes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "box_items" ADD CONSTRAINT "box_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boxes" ADD CONSTRAINT "boxes_bound_to_establishments_id_fk" FOREIGN KEY ("bound_to") REFERENCES "public"."establishments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorite_establishments" ADD CONSTRAINT "favorite_establishments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorite_establishments" ADD CONSTRAINT "favorite_establishments_establishment_id_establishments_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "google_oauth_credentials" ADD CONSTRAINT "google_oauth_credentials_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "google_oauth_credentials" ADD CONSTRAINT "google_oauth_credentials_establishment_id_establishments_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_prices" ADD CONSTRAINT "menu_prices_menu_item_id_menu_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu" ADD CONSTRAINT "menu_establishment_id_establishments_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders_details" ADD CONSTRAINT "orders_details_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders_details" ADD CONSTRAINT "orders_details_menu_price_id_menu_prices_id_fk" FOREIGN KEY ("menu_price_id") REFERENCES "public"."menu_prices"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_allergens" ADD CONSTRAINT "product_allergens_id_product_products_id_fk" FOREIGN KEY ("id_product") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_allergens" ADD CONSTRAINT "product_allergens_id_allergen_types_of_allergens_id_fk" FOREIGN KEY ("id_allergen") REFERENCES "public"."types_of_allergens"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_types" ADD CONSTRAINT "product_types_id_product_products_id_fk" FOREIGN KEY ("id_product") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_types" ADD CONSTRAINT "product_types_id_type_types_of_products_id_fk" FOREIGN KEY ("id_type") REFERENCES "public"."types_of_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_bound_to_establishments_id_fk" FOREIGN KEY ("bound_to") REFERENCES "public"."establishments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_establishment_id_establishments_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_establishment_id_establishments_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_subscription_plan_id_subscription_plans_id_fk" FOREIGN KEY ("subscription_plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "type_boxes" ADD CONSTRAINT "type_boxes_type_id_types_of_products_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."types_of_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "type_boxes" ADD CONSTRAINT "type_boxes_box_id_boxes_id_fk" FOREIGN KEY ("box_id") REFERENCES "public"."boxes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_code" ADD CONSTRAINT "verification_code_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;