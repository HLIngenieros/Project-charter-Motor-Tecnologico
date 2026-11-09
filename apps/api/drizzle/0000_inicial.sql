CREATE TABLE `actividad` (
	`id` text PRIMARY KEY NOT NULL,
	`charter_id` text NOT NULL,
	`padre_id` text,
	`orden` integer NOT NULL,
	`nombre` text NOT NULL,
	`entregable` text,
	`peso` real,
	`inicio` text,
	`fin` text,
	`creado_en` text NOT NULL,
	`actualizado_en` text NOT NULL,
	FOREIGN KEY (`charter_id`) REFERENCES `charter`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`padre_id`) REFERENCES `actividad`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `actividad_charter_idx` ON `actividad` (`charter_id`);--> statement-breakpoint
CREATE INDEX `actividad_padre_idx` ON `actividad` (`padre_id`);--> statement-breakpoint
CREATE TABLE `actividad_responsable` (
	`actividad_id` text NOT NULL,
	`nombre` text NOT NULL,
	`orden` integer NOT NULL,
	`creado_en` text NOT NULL,
	`actualizado_en` text NOT NULL,
	PRIMARY KEY(`actividad_id`, `orden`),
	FOREIGN KEY (`actividad_id`) REFERENCES `actividad`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `area` (
	`id` text PRIMARY KEY NOT NULL,
	`nombre` text NOT NULL,
	`activa` integer DEFAULT true NOT NULL,
	`orden` integer DEFAULT 0 NOT NULL,
	`creado_en` text NOT NULL,
	`actualizado_en` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `avance` (
	`corte_id` text NOT NULL,
	`actividad_id` text NOT NULL,
	`item` text NOT NULL,
	`nombre` text NOT NULL,
	`pct_real` real DEFAULT 0 NOT NULL,
	`peso` real,
	`inicio` text,
	`fin` text,
	`creado_en` text NOT NULL,
	`actualizado_en` text NOT NULL,
	PRIMARY KEY(`corte_id`, `actividad_id`),
	FOREIGN KEY (`corte_id`) REFERENCES `corte`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `categoria` (
	`id` text PRIMARY KEY NOT NULL,
	`nombre` text NOT NULL,
	`color` text NOT NULL,
	`color_fondo` text NOT NULL,
	`activa` integer DEFAULT true NOT NULL,
	`orden` integer DEFAULT 0 NOT NULL,
	`creado_en` text NOT NULL,
	`actualizado_en` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `charter` (
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
	`umbral_atencion` real DEFAULT -3 NOT NULL,
	`umbral_atraso` real DEFAULT -10 NOT NULL,
	`creado_en` text NOT NULL,
	`actualizado_en` text NOT NULL,
	FOREIGN KEY (`propietario_id`) REFERENCES `usuario`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`categoria_id`) REFERENCES `categoria`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`area_id`) REFERENCES `area`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `charter_propietario_idx` ON `charter` (`propietario_id`);--> statement-breakpoint
CREATE TABLE `corte` (
	`id` text PRIMARY KEY NOT NULL,
	`charter_id` text NOT NULL,
	`fecha` text NOT NULL,
	`nota` text DEFAULT '' NOT NULL,
	`pv_proyecto` real DEFAULT 0 NOT NULL,
	`ev_proyecto` real DEFAULT 0 NOT NULL,
	`desv_proyecto` real DEFAULT 0 NOT NULL,
	`creado_en` text NOT NULL,
	`actualizado_en` text NOT NULL,
	FOREIGN KEY (`charter_id`) REFERENCES `charter`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `corte_charter_fecha_unq` ON `corte` (`charter_id`,`fecha`);--> statement-breakpoint
CREATE TABLE `indicador` (
	`id` text PRIMARY KEY NOT NULL,
	`charter_id` text NOT NULL,
	`nombre` text NOT NULL,
	`formula` text DEFAULT '' NOT NULL,
	`meta_operador` text DEFAULT '>=' NOT NULL,
	`meta_valor` real DEFAULT 0 NOT NULL,
	`meta_unidad` text DEFAULT '' NOT NULL,
	`observaciones` text DEFAULT '' NOT NULL,
	`orden` integer DEFAULT 0 NOT NULL,
	`creado_en` text NOT NULL,
	`actualizado_en` text NOT NULL,
	FOREIGN KEY (`charter_id`) REFERENCES `charter`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `item_lista` (
	`id` text PRIMARY KEY NOT NULL,
	`charter_id` text NOT NULL,
	`tipo` text NOT NULL,
	`texto` text NOT NULL,
	`orden` integer DEFAULT 0 NOT NULL,
	`creado_en` text NOT NULL,
	`actualizado_en` text NOT NULL,
	FOREIGN KEY (`charter_id`) REFERENCES `charter`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `medicion` (
	`id` text PRIMARY KEY NOT NULL,
	`indicador_id` text NOT NULL,
	`periodo` text NOT NULL,
	`valor` real NOT NULL,
	`nota` text DEFAULT '' NOT NULL,
	`creado_en` text NOT NULL,
	`actualizado_en` text NOT NULL,
	FOREIGN KEY (`indicador_id`) REFERENCES `indicador`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `medicion_indicador_idx` ON `medicion` (`indicador_id`);--> statement-breakpoint
CREATE TABLE `riesgo` (
	`id` text PRIMARY KEY NOT NULL,
	`charter_id` text NOT NULL,
	`riesgo` text NOT NULL,
	`causa` text DEFAULT '' NOT NULL,
	`mitigacion` text DEFAULT '' NOT NULL,
	`orden` integer DEFAULT 0 NOT NULL,
	`creado_en` text NOT NULL,
	`actualizado_en` text NOT NULL,
	FOREIGN KEY (`charter_id`) REFERENCES `charter`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `rubro` (
	`id` text PRIMARY KEY NOT NULL,
	`charter_id` text NOT NULL,
	`descripcion` text NOT NULL,
	`valor` integer DEFAULT 0 NOT NULL,
	`orden` integer DEFAULT 0 NOT NULL,
	`creado_en` text NOT NULL,
	`actualizado_en` text NOT NULL,
	FOREIGN KEY (`charter_id`) REFERENCES `charter`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `rubro_detalle` (
	`id` text PRIMARY KEY NOT NULL,
	`rubro_id` text NOT NULL,
	`concepto` text NOT NULL,
	`cantidad` real DEFAULT 1 NOT NULL,
	`valor_unitario` integer DEFAULT 0 NOT NULL,
	`orden` integer DEFAULT 0 NOT NULL,
	`creado_en` text NOT NULL,
	`actualizado_en` text NOT NULL,
	FOREIGN KEY (`rubro_id`) REFERENCES `rubro`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sesion` (
	`id` text PRIMARY KEY NOT NULL,
	`usuario_id` text NOT NULL,
	`expira_en` text NOT NULL,
	`ultimo_uso` text NOT NULL,
	`creado_en` text NOT NULL,
	`actualizado_en` text NOT NULL,
	FOREIGN KEY (`usuario_id`) REFERENCES `usuario`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `sesion_usuario_idx` ON `sesion` (`usuario_id`);--> statement-breakpoint
CREATE TABLE `usuario` (
	`id` text PRIMARY KEY NOT NULL,
	`correo` text NOT NULL,
	`nombre` text NOT NULL,
	`hash_clave` text NOT NULL,
	`es_admin` integer DEFAULT false NOT NULL,
	`activo` integer DEFAULT true NOT NULL,
	`debe_cambiar_clave` integer DEFAULT false NOT NULL,
	`creado_en` text NOT NULL,
	`actualizado_en` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `usuario_correo_unique` ON `usuario` (`correo`);