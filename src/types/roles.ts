export type Role = "USER" | "MODERATOR" | "ADMIN" | "OWNER";

export const ROLE_LABELS: Record<Role, string> = {
  USER: "Usuario",
  MODERATOR: "Moderador",
  ADMIN: "Administrador",
  OWNER: "Dueño",
};
