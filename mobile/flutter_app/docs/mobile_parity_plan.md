# Mobile Parity Plan

## 1. Feature Inventory
- **Landing / Hero**: Neon hero banner, CTA buttons, stats, categories carousel.
- **Authentication**: Login, register, password reset entry points.
- **Sections**: Existing list & detail (already built) plus filters (más votados / recientes) and quick actions.
- **Notifications & Profile**: Entry points for alerts, bookmarks, user settings.
- **Create Theory**: Button + flow to publish desde la app.

## 2. Navigation Stack
1. Splash / Intro (optional branding)
2. Onboarding / Hero (mirroring web landing)
3. Auth flow (login/register)
4. Main Shell with bottom nav or rail:
   - Home (hero + featured content)
   - Secciones
   - Notificaciones
   - Perfil / Ajustes
5. Modal routes for crear teoría, filtros avanzados, etc.

We can start with `GoRouter` for declarative navigation.

## 3. Data & State
- Keep mock repositories but define interfaces for:
  - AuthService (login/register/refresh)
  - SectionService (list, detail, filter)
  - NotificationService
- Later swap implementations to HTTP clients hitting Next.js API (`/api/auth`, `/api/sections`, etc.).
- Use `Riverpod` or `Provider` for lightweight state until requirements grow.

## 4. UI Components to Build
- App-wide neon theme extensions (buttons, chips, gradients).
- Reusable CTA button with icon + glow.
- Stat cards and community activity pills.
- Auth form fields with validation + loading states.

## 5. Implementation Milestones
1. **Routing + Shell**: Set up GoRouter, splash, placeholder screens.
2. **Auth Screens**: Login/Register UI, wired to mock AuthService.
3. **Home/Landing**: Hero, CTA buttons, featured stats, quick entry to sections.
4. **Sections Enhancements**: Filters, actions, improved detail layout.
5. **Notifications/Profile**: Basic placeholders, ready for future data.
6. **Real API Integration**: Replace mocks, add secure storage for tokens.

## 6. Next Actions
- Install GoRouter + state management dependency if needed.
- Create folder structure: `features/auth`, `features/home`, `features/shell`.
- Implement Step 1 (routing) + Step 2 (auth UI) next.
