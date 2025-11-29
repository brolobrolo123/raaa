import type { Metadata } from "next";
import { Space_Grotesk, Share_Tech_Mono } from "next/font/google";
import { SiteFooter } from "@/components/navigation/site-footer";
import { I18nProvider } from "@/lib/i18n/client";
import { getCurrentLocale, getDictionary } from "@/lib/i18n/server";
import "./globals.css";

const primaryFont = Space_Grotesk({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const techFont = Share_Tech_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Teoría Colectiva",
  description:
    "Foro colaborativo para historias alternativas, miradas críticas y teorías por validar.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getCurrentLocale();
  const dictionary = getDictionary(locale);
  return (
    <html lang={locale}>
      <body className={`${primaryFont.variable} ${techFont.variable} antialiased text-slate-50`}>
        <I18nProvider locale={locale} dictionary={dictionary}>
          <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
            <div
              className="absolute inset-0 animate-[pulseGlow_24s_ease-in-out_infinite] opacity-70"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 12% 18%, rgba(147,51,234,0.2), transparent 45%), radial-gradient(circle at 78% 12%, rgba(56,189,248,0.18), transparent 40%), radial-gradient(circle at 48% 70%, rgba(14,165,233,0.18), transparent 35%)",
              }}
            />
            <div className="absolute -left-32 top-16 h-96 w-96 rounded-full bg-linear-to-br from-fuchsia-500/30 via-indigo-500/20 to-sky-400/10 blur-[160px]" />
            <div className="absolute bottom-0 right-0 h-md w-md rounded-full bg-linear-to-tr from-cyan-500/15 via-blue-500/10 to-transparent blur-[200px]" />
          </div>
          <div className="relative z-10 min-h-screen px-0">
            {children}
            <SiteFooter />
          </div>
        </I18nProvider>
      </body>
    </html>
  );
}
