## Teoría · Archivo vivo de debates

El proyecto combina una aplicación web (Next.js 14 + Prisma + Tailwind) y una app móvil experimental construida en Flutter para Android/iOS. Ambas superficies comparten el mismo lenguaje visual: secciones temáticas, filtros de “Más votados / Recientes” y tarjetas neon.

## Requisitos

- Node.js 18+
- pnpm / npm (usamos `npm` en los ejemplos)
- Base de datos SQLite (por defecto) o PostgreSQL si actualizas `DATABASE_URL`
- Flutter 3.24+ con SDK Android configurado (para la app móvil)

## Web (Next.js)

1. Instala dependencias
	```bash
	npm install
	```
2. Ejecuta migraciones y seed inicial (ajusta `.env` si usas otra base)
	```bash
	npx prisma migrate dev --name init
	npx prisma db seed
	```
3. Arranca el servidor
	```bash
	npm run dev
	```
4. Abre `http://localhost:3000` para navegar por el landing público o inicia sesión para ver el hub protegido.

### Re-generar bloqueos de diseños duplicados

Si migraste datos antiguos (antes del guardado de `pixelColorClaim`) ejecuta el script de backfill para regenerar los bloqueos de patrones y capas monocromas en todos los slots:

```bash
npx ts-node -r tsconfig-paths/register scripts/backfill-pixel-claims.ts
```

El script recorre cada usuario, reconstruye las firmas de color y repuebla la tabla `PixelColorClaim`. Cualquier conflicto existente se reporta en consola para que decidas qué diseño conservar.

## Iconos compartidos

- `public/hud-icons/` almacena los botones del HUD. El nuevo botón de Clubs debe guardarse como `public/hud-icons/clubs.png` (exportado a 96×96 px PNG con fondo transparente). Si necesitas otro botón solo agrega el archivo con el nombre que uses en `HUD_IMAGE_PATHS` dentro de `src/components/navigation/hub-action-hud.tsx` y reinicia el server para que Next.js lo sirva.
- Las secciones usan archivos en `public/section-icons/`. Cada definición en `src/lib/sections.ts` referencia su ícono mediante la propiedad `iconImage`. Para añadir uno nuevo:
	1. Exporta el PNG a 96×96 px (o cuadrado) y guárdalo como `public/section-icons/<slug>.png`.
	2. Actualiza la entrada correspondiente en `sections.ts` cambiando `iconImage` al nombre del archivo recién creado.
	3. Si agregas una sección nueva, incluye la misma propiedad `iconImage` con la ruta del PNG.
- Los clubs mantienen sus insignias en `public/club-icons/`. Cada club definido en `src/lib/clubs.ts` apunta a su SVG mediante la propiedad `icon`. Si creas un club nuevo, guarda su ícono como SVG/PNG cuadrado en esa carpeta y referencia la ruta iniciando con `/club-icons/<archivo>.svg`.

## Fórmula de puntos del foro

- Cada publicación otorga **3 puntos** y cada voto recibido otorga **1 punto**. Esta lógica vive en `src/lib/avatar/power.ts` (`PROFILE_ARTICLE_POINTS`, `PROFILE_VOTE_POINTS`) y alimenta cualquier funcionalidad que dependa de `getProfilePointValue`, incluido el gasto de puntos para el avatar.
- Ajusta esos dos valores y vuelve a ejecutar las migraciones/seed si necesitas recalcular puntuaciones históricas.

## App móvil (Flutter)

El código vive en `mobile/flutter_app`. Usa datos mockeados pero respeta las mismas secciones y filtros del sitio para que puedas iterar el UI antes de conectar APIs.

1. Entra al nuevo directorio
	```bash
	cd mobile/flutter_app
	```
2. Descarga dependencias
	```bash
	flutter pub get
	```
3. Lanza en un emulador o dispositivo Android
	```bash
	flutter run -d android
	```

### Qué incluye la app Flutter

- Pantalla “Elige una sección” con tarjetas a ancho completo que muestran nombre, tagline y preview de artículos.
- Detalle de sección con filtros “Más votados / Recientes” y lista de artículos estilizada.
- Theming oscuro basado en Space Grotesk + gradientes inspirados en la versión web.
- Repositorio mock (`SectionRepository`) para reemplazar fácilmente por llamadas HTTP (`SectionRepository.fetchSections`).

## Próximos pasos sugeridos

- Conectar la app móvil al backend Next.js exponiendo endpoints públicos (por ejemplo `/api/sections` y `/api/articles`).
- Sincronizar autenticación (NextAuth) mediante OAuth/token exchanges antes de exponer escritura.
- Añadir pruebas (Vitest para web, Flutter test para móvil) sobre los nuevos flujos críticos.
