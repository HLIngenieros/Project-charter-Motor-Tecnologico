ALTER TABLE "charter" ADD COLUMN "pesos_relativos" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "charter" ALTER COLUMN "pesos_relativos" SET DEFAULT true;