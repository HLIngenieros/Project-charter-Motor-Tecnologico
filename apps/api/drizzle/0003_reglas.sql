CREATE TABLE `parametros` (
	`id` integer PRIMARY KEY NOT NULL,
	`reglas` text NOT NULL,
	`actualizado_por` text,
	`actualizado_en` text NOT NULL,
	FOREIGN KEY (`actualizado_por`) REFERENCES `usuario`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
ALTER TABLE `charter` ADD `reglas` text DEFAULT '{"sumaPesos":"aviso","sinPeso":"fuera","reparto":"calendario","proyeccion":"desviacion","diasGracia":0}' NOT NULL;