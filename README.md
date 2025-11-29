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
