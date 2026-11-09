-- Los umbrales pasan de días a puntos de brecha (spec §4.4): los anteriores no se conservan.
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_charter` (
	`id` text PRIMARY KEY NOT NULL,
	`propietario_id` text NOT NULL,
	`nombre` text NOT NULL,
	`codigo` text,
	`categoria_id` text,
	`area_id` text,
	`responsable` text DEFAULT '' NOT NULL,
	`patrocinador` text DEFAULT '' NOT NULL,
	`revision` text DEFAULT '' NOT NULL,
	`razon_de_ser` text DEFAULT '' NOT NULL,
	`objetivo_general` text DEFAULT '' NOT NULL,
	`estado` text DEFAULT 'activo' NOT NULL,
	`umbral_atencion` real DEFAULT 10 NOT NULL,
	`umbral_riesgo` real DEFAULT 25 NOT NULL,
	`umbral_atraso` real DEFAULT 50 NOT NULL,
	`creado_en` text NOT NULL,
	`actualizado_en` text NOT NULL,
	FOREIGN KEY (`propietario_id`) REFERENCES `usuario`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`categoria_id`) REFERENCES `categoria`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`area_id`) REFERENCES `area`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
INSERT INTO `__new_charter`("id", "propietario_id", "nombre", "codigo", "categoria_id", "area_id", "responsable", "patrocinador", "revision", "razon_de_ser", "objetivo_general", "estado", "umbral_atencion", "umbral_riesgo", "umbral_atraso", "creado_en", "actualizado_en") SELECT "id", "propietario_id", "nombre", "codigo", "categoria_id", "area_id", "responsable", "patrocinador", "revision", "razon_de_ser", "objetivo_general", "estado", 10, 25, 50, "creado_en", "actualizado_en" FROM `charter`;--> statement-breakpoint
DROP TABLE `charter`;--> statement-breakpoint
ALTER TABLE `__new_charter` RENAME TO `charter`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `charter_propietario_idx` ON `charter` (`propietario_id`);