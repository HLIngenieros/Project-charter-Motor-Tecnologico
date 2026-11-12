ALTER TABLE "indicador" ALTER COLUMN "meta_valor" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "indicador" ALTER COLUMN "meta_valor" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "riesgo" ADD COLUMN "probabilidad" integer;--> statement-breakpoint
ALTER TABLE "riesgo" ADD COLUMN "impacto" integer;