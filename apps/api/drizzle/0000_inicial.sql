CREATE TABLE "actividad" (
	"id" text PRIMARY KEY NOT NULL,
	"charter_id" text NOT NULL,
	"padre_id" text,
	"orden" integer NOT NULL,
	"nombre" text NOT NULL,
	"entregable" text,
	"peso" double precision,
	"inicio" text,
	"fin" text,
	"creado_en" text NOT NULL,
	"actualizado_en" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "actividad_responsable" (
	"actividad_id" text NOT NULL,
	"nombre" text NOT NULL,
	"orden" integer NOT NULL,
	"creado_en" text NOT NULL,
	"actualizado_en" text NOT NULL,
	CONSTRAINT "actividad_responsable_actividad_id_orden_pk" PRIMARY KEY("actividad_id","orden")
);
--> statement-breakpoint
CREATE TABLE "area" (
	"id" text PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"activa" boolean DEFAULT true NOT NULL,
	"orden" integer DEFAULT 0 NOT NULL,
	"creado_en" text NOT NULL,
	"actualizado_en" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "avance" (
	"corte_id" text NOT NULL,
	"actividad_id" text NOT NULL,
	"item" text NOT NULL,
	"nombre" text NOT NULL,
	"pct_real" double precision DEFAULT 0 NOT NULL,
	"peso" double precision,
	"inicio" text,
	"fin" text,
	"creado_en" text NOT NULL,
	"actualizado_en" text NOT NULL,
	CONSTRAINT "avance_corte_id_actividad_id_pk" PRIMARY KEY("corte_id","actividad_id")
);
--> statement-breakpoint
CREATE TABLE "categoria" (
	"id" text PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"color" text NOT NULL,
	"color_fondo" text NOT NULL,
	"activa" boolean DEFAULT true NOT NULL,
	"orden" integer DEFAULT 0 NOT NULL,
	"creado_en" text NOT NULL,
	"actualizado_en" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "charter" (
	"id" text PRIMARY KEY NOT NULL,
	"propietario_id" text NOT NULL,
	"nombre" text NOT NULL,
	"codigo" text,
	"categoria_id" text,
	"area_id" text,
	"responsable" text DEFAULT '' NOT NULL,
	"patrocinador" text DEFAULT '' NOT NULL,
	"revision" text DEFAULT '' NOT NULL,
	"razon_de_ser" text DEFAULT '' NOT NULL,
	"objetivo_general" text DEFAULT '' NOT NULL,
	"estado" text DEFAULT 'activo' NOT NULL,
	"umbral_atencion" double precision DEFAULT 10 NOT NULL,
	"umbral_riesgo" double precision DEFAULT 25 NOT NULL,
	"umbral_atraso" double precision DEFAULT 50 NOT NULL,
	"reglas" text DEFAULT '{"sumaPesos":"aviso","sinPeso":"fuera","reparto":"calendario","proyeccion":"desviacion","diasGracia":0}' NOT NULL,
	"cronograma_version" integer DEFAULT 0 NOT NULL,
	"creado_en" text NOT NULL,
	"actualizado_en" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "corte" (
	"id" text PRIMARY KEY NOT NULL,
	"charter_id" text NOT NULL,
	"fecha" text NOT NULL,
	"nota" text DEFAULT '' NOT NULL,
	"pv_proyecto" double precision DEFAULT 0 NOT NULL,
	"ev_proyecto" double precision DEFAULT 0 NOT NULL,
	"desv_proyecto" double precision DEFAULT 0 NOT NULL,
	"creado_en" text NOT NULL,
	"actualizado_en" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "indicador" (
	"id" text PRIMARY KEY NOT NULL,
	"charter_id" text NOT NULL,
	"nombre" text NOT NULL,
	"formula" text DEFAULT '' NOT NULL,
	"meta_operador" text DEFAULT '>=' NOT NULL,
	"meta_valor" double precision DEFAULT 0 NOT NULL,
	"meta_unidad" text DEFAULT '' NOT NULL,
	"observaciones" text DEFAULT '' NOT NULL,
	"orden" integer DEFAULT 0 NOT NULL,
	"creado_en" text NOT NULL,
	"actualizado_en" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "item_lista" (
	"id" text PRIMARY KEY NOT NULL,
	"charter_id" text NOT NULL,
	"tipo" text NOT NULL,
	"texto" text NOT NULL,
	"orden" integer DEFAULT 0 NOT NULL,
	"creado_en" text NOT NULL,
	"actualizado_en" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medicion" (
	"id" text PRIMARY KEY NOT NULL,
	"indicador_id" text NOT NULL,
	"periodo" text NOT NULL,
	"valor" double precision NOT NULL,
	"nota" text DEFAULT '' NOT NULL,
	"creado_en" text NOT NULL,
	"actualizado_en" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "parametros" (
	"id" integer PRIMARY KEY NOT NULL,
	"reglas" text NOT NULL,
	"actualizado_por" text,
	"actualizado_en" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "riesgo" (
	"id" text PRIMARY KEY NOT NULL,
	"charter_id" text NOT NULL,
	"riesgo" text NOT NULL,
	"causa" text DEFAULT '' NOT NULL,
	"mitigacion" text DEFAULT '' NOT NULL,
	"orden" integer DEFAULT 0 NOT NULL,
	"creado_en" text NOT NULL,
	"actualizado_en" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rubro" (
	"id" text PRIMARY KEY NOT NULL,
	"charter_id" text NOT NULL,
	"descripcion" text NOT NULL,
	"valor" bigint DEFAULT 0 NOT NULL,
	"orden" integer DEFAULT 0 NOT NULL,
	"creado_en" text NOT NULL,
	"actualizado_en" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rubro_detalle" (
	"id" text PRIMARY KEY NOT NULL,
	"rubro_id" text NOT NULL,
	"concepto" text NOT NULL,
	"cantidad" double precision DEFAULT 1 NOT NULL,
	"valor_unitario" bigint DEFAULT 0 NOT NULL,
	"orden" integer DEFAULT 0 NOT NULL,
	"creado_en" text NOT NULL,
	"actualizado_en" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sesion" (
	"id" text PRIMARY KEY NOT NULL,
	"usuario_id" text NOT NULL,
	"expira_en" text NOT NULL,
	"ultimo_uso" text NOT NULL,
	"creado_en" text NOT NULL,
	"actualizado_en" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usuario" (
	"id" text PRIMARY KEY NOT NULL,
	"correo" text NOT NULL,
	"nombre" text NOT NULL,
	"hash_clave" text NOT NULL,
	"es_admin" boolean DEFAULT false NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"debe_cambiar_clave" boolean DEFAULT false NOT NULL,
	"creado_en" text NOT NULL,
	"actualizado_en" text NOT NULL,
	CONSTRAINT "usuario_correo_unique" UNIQUE("correo")
);
--> statement-breakpoint
ALTER TABLE "actividad" ADD CONSTRAINT "actividad_charter_id_charter_id_fk" FOREIGN KEY ("charter_id") REFERENCES "public"."charter"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "actividad" ADD CONSTRAINT "actividad_padre_id_actividad_id_fk" FOREIGN KEY ("padre_id") REFERENCES "public"."actividad"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "actividad_responsable" ADD CONSTRAINT "actividad_responsable_actividad_id_actividad_id_fk" FOREIGN KEY ("actividad_id") REFERENCES "public"."actividad"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "avance" ADD CONSTRAINT "avance_corte_id_corte_id_fk" FOREIGN KEY ("corte_id") REFERENCES "public"."corte"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "charter" ADD CONSTRAINT "charter_propietario_id_usuario_id_fk" FOREIGN KEY ("propietario_id") REFERENCES "public"."usuario"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "charter" ADD CONSTRAINT "charter_categoria_id_categoria_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."categoria"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "charter" ADD CONSTRAINT "charter_area_id_area_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."area"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corte" ADD CONSTRAINT "corte_charter_id_charter_id_fk" FOREIGN KEY ("charter_id") REFERENCES "public"."charter"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "indicador" ADD CONSTRAINT "indicador_charter_id_charter_id_fk" FOREIGN KEY ("charter_id") REFERENCES "public"."charter"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_lista" ADD CONSTRAINT "item_lista_charter_id_charter_id_fk" FOREIGN KEY ("charter_id") REFERENCES "public"."charter"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medicion" ADD CONSTRAINT "medicion_indicador_id_indicador_id_fk" FOREIGN KEY ("indicador_id") REFERENCES "public"."indicador"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parametros" ADD CONSTRAINT "parametros_actualizado_por_usuario_id_fk" FOREIGN KEY ("actualizado_por") REFERENCES "public"."usuario"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "riesgo" ADD CONSTRAINT "riesgo_charter_id_charter_id_fk" FOREIGN KEY ("charter_id") REFERENCES "public"."charter"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rubro" ADD CONSTRAINT "rubro_charter_id_charter_id_fk" FOREIGN KEY ("charter_id") REFERENCES "public"."charter"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rubro_detalle" ADD CONSTRAINT "rubro_detalle_rubro_id_rubro_id_fk" FOREIGN KEY ("rubro_id") REFERENCES "public"."rubro"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sesion" ADD CONSTRAINT "sesion_usuario_id_usuario_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuario"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "actividad_charter_idx" ON "actividad" USING btree ("charter_id");--> statement-breakpoint
CREATE INDEX "actividad_padre_idx" ON "actividad" USING btree ("padre_id");--> statement-breakpoint
CREATE INDEX "charter_propietario_idx" ON "charter" USING btree ("propietario_id");--> statement-breakpoint
CREATE UNIQUE INDEX "corte_charter_fecha_unq" ON "corte" USING btree ("charter_id","fecha");--> statement-breakpoint
CREATE INDEX "medicion_indicador_idx" ON "medicion" USING btree ("indicador_id");--> statement-breakpoint
CREATE INDEX "sesion_usuario_idx" ON "sesion" USING btree ("usuario_id");