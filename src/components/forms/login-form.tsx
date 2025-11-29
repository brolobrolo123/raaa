"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { loginSchema } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormMessage } from "./form-message";
import type { z } from "zod";

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { credential: "", password: "" },
  });

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
      setMessage("Revisa tus datos e inténtalo nuevamente.");
      return;
    }

    setMessage("Bienvenido de nuevo. Redirigiendo...");
    router.push("/hub");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <label className="text-sm text-slate-200">Usuario o correo</label>
        <Input placeholder="tu-usuario" autoComplete="username" {...register("credential")} />
        {errors.credential && (
          <p className="mt-1 text-xs text-rose-200">{errors.credential.message}</p>
        )}
      </div>
      <div>
        <label className="text-sm text-slate-200">Contraseña</label>
        <Input type="password" placeholder="••••••••" autoComplete="current-password" {...register("password")} />
        {errors.password && <p className="mt-1 text-xs text-rose-200">{errors.password.message}</p>}
      </div>
      <FormMessage type={isError ? "error" : "success"} message={message} />
      <Button type="submit" loading={isSubmitting} className="w-full">
        Entrar al foro
      </Button>
    </form>
  );
}
