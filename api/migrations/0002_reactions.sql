CREATE TABLE "event_reactions" (
	"event_id" text NOT NULL,
	"user_id" integer NOT NULL,
	"reaction" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_reactions_event_id_user_id_reaction_pk" PRIMARY KEY("event_id","user_id","reaction")
);
--> statement-breakpoint
CREATE INDEX "event_reactions_user_idx" ON "event_reactions" USING btree ("user_id");