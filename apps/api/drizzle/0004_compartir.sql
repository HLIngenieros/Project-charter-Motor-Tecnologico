CREATE TABLE "charter_acceso" (
	"charter_id" text NOT NULL,
	"correo" text NOT NULL,
	"rol" text NOT NULL,
	"creado_en" text NOT NULL,
	"actualizado_en" text NOT NULL,
	CONSTRAINT "charter_acceso_charter_id_correo_pk" PRIMARY KEY("charter_id","correo")
);
--> statement-breakpoint
ALTER TABLE "charter_acceso" ADD CONSTRAINT "charter_acceso_charter_id_charter_id_fk" FOREIGN KEY ("charter_id") REFERENCES "public"."charter"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "charter_acceso_correo_idx" ON "charter_acceso" USING btree ("correo");