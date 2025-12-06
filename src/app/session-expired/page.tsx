import Link from "next/link";

export default function SessionExpiredPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-6 px-6 text-center text-white">
      <h1 className="text-3xl font-semibold">Sesión finalizada</h1>
      <p className="text-base text-white/80">
        Tu sesión anterior fue cerrada porque detectamos un token antiguo o demasiado grande. Vuelve a iniciar sesión para
        continuar usando la plataforma.
      </p>
      <Link
        href="/"
        className="rounded-full bg-white/10 px-6 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
      >
        Ir al inicio de sesión
      </Link>
    </main>
  );
}
