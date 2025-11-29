interface FormMessageProps {
  type: "error" | "success";
  message: string | null;
}

export function FormMessage({ type, message }: FormMessageProps) {
  if (!message) return null;
  const palette =
    type === "success"
      ? "bg-emerald-500/15 text-emerald-200 border-emerald-500/40"
      : "bg-rose-500/10 text-rose-100 border-rose-400/50";
  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm font-medium ${palette}`}>
      {message}
    </div>
  );
}
