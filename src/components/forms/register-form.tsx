"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import type { z } from "zod";
import { registerSchema } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormMessage } from "./form-message";

const displaySchema = registerSchema.extend({ confirmPassword: registerSchema.shape.password });
type RegisterValues = z.infer<typeof displaySchema>;

export function RegisterForm() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    control,
  } = useForm<RegisterValues>({
    resolver: zodResolver(displaySchema),
    defaultValues: { username: "", email: "", password: "", confirmPassword: "" },
  });

  const passwordValue = useWatch({ control, name: "password" });
  const confirmPasswordValue = useWatch({ control, name: "confirmPassword" });

  const onSubmit = async (values: RegisterValues) => {
    if (values.password !== values.confirmPassword) {
      setIsError(true);
      setMessage("Las contraseñas no coinciden.");
      return;
    }

    setMessage(null);
    setIsError(false);

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: values.username.toLowerCase(),
        email: values.email.toLowerCase(),
        password: values.password,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setIsError(true);
      setMessage(data?.error ?? "No se pudo crear la cuenta.");
      return;
    }

    await signIn("credentials", {
      redirect: false,
      credential: values.email.toLowerCase(),
      password: values.password,
    });

    setMessage("Cuenta creada. Redirigiendo...");
    router.push("/hub");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid gap-3">
        <label className="text-sm text-slate-200">Nombre de usuario</label>
        <Input placeholder="tu-usuario" autoComplete="username" {...register("username")} />
        {errors.username && <p className="text-xs text-rose-200">{errors.username.message}</p>}
      </div>
      <div className="grid gap-3">
        <label className="text-sm text-slate-200">Correo electrónico</label>
        <Input type="email" placeholder="tu@email.com" autoComplete="email" {...register("email")} />
        {errors.email && <p className="text-xs text-rose-200">{errors.email.message}</p>}
      </div>
      <div className="grid gap-3">
        <label className="text-sm text-slate-200">Contraseña</label>
        <Input type="password" placeholder="••••••••" autoComplete="new-password" {...register("password")} />
        {errors.password && <p className="text-xs text-rose-200">{errors.password.message}</p>}
      </div>
      <div className="grid gap-3">
        <label className="text-sm text-slate-200">Confirmar contraseña</label>
        <Input type="password" placeholder="••••••••" autoComplete="new-password" {...register("confirmPassword")} />
        {passwordValue !== confirmPasswordValue && Boolean(confirmPasswordValue) && (
          <p className="text-xs text-rose-200">Las contraseñas deben coincidir.</p>
        )}
      </div>
      <FormMessage type={isError ? "error" : "success"} message={message} />
      <Button type="submit" loading={isSubmitting} className="w-full">
        Crear cuenta y entrar
      </Button>
    </form>
  );
}
