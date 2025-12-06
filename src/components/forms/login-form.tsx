"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { loginSchema } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslations } from "@/lib/i18n/client";
import { FormMessage } from "./form-message";
import type { z } from "zod";

type LoginValues = z.infer<typeof loginSchema>;
type ServerMessage = {
  text: string;
  type: "error" | "success";
};

type LoginFormProps = {
  serverMessage?: ServerMessage;
};

export function LoginForm({ serverMessage }: LoginFormProps) {
  const router = useRouter();
  const t = useTranslations();
  const [message, setMessage] = useState<string | null>(serverMessage?.text ?? null);
  const [isError, setIsError] = useState(serverMessage?.type === "error");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { credential: "", password: "" },
  });

  useEffect(() => {
    setMessage(serverMessage?.text ?? null);
    setIsError(serverMessage?.type === "error");
  }, [serverMessage]);

  const onSubmit = async (values: LoginValues) => {
    setMessage(null);
    setIsError(false);
    const result = await signIn("credentials", {
      redirect: false,
      credential: values.credential,
      password: values.password,
    });

    if (result?.error) {
      setIsError(true);
      const fallback = result.error === "CredentialsSignin" ? t("auth.loginForm.genericError") : result.error;
      setMessage(fallback);
      return;
    }

    setMessage(t("auth.loginForm.success"));
    router.push("/hub");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <label className="text-sm text-slate-200">{t("auth.loginForm.credentialLabel")}</label>
        <Input placeholder={t("auth.loginForm.credentialPlaceholder")} autoComplete="username" {...register("credential")} />
        {errors.credential && (
          <p className="mt-1 text-xs text-rose-200">{errors.credential.message}</p>
        )}
      </div>
      <div>
        <label className="text-sm text-slate-200">{t("auth.loginForm.passwordLabel")}</label>
        <Input type="password" placeholder={t("auth.loginForm.passwordPlaceholder")} autoComplete="current-password" {...register("password")} />
        {errors.password && <p className="mt-1 text-xs text-rose-200">{errors.password.message}</p>}
      </div>
      <FormMessage type={isError ? "error" : "success"} message={message} />
      <Button type="submit" loading={isSubmitting} className="w-full">
        {t("auth.loginForm.submit")}
      </Button>
    </form>
  );
}
