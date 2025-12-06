import { z } from "zod";
import { SECTION_SLUGS, type SectionSlug } from "./sections";

const COVER_IMAGE_PATH = /^\/uploads\/covers\/[a-z0-9._-]+$/i;

export const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "El usuario necesita al menos 3 caracteres.")
    .regex(/^[a-z0-9-]+$/i, "Solo letras, números y guiones."),
  email: z.string().trim().email("Correo inválido."),
  password: z
    .string()
    .min(8, "La contraseña debe tener 8 caracteres como mínimo."),
});

export const loginSchema = z.object({
  credential: z
    .string()
    .trim()
    .min(3, "Introduce tu correo o nombre de usuario."),
  password: z.string().min(1, "La contraseña es requerida."),
});

export const sectionSlugSchema = z.enum(
  SECTION_SLUGS as [SectionSlug, ...SectionSlug[]],
);

export const articleSchema = z.object({
  title: z
    .string()
    .min(3, "Escribe al menos 3 caracteres.")
    .max(12, "Máximo 12 caracteres."),
  summary: z
    .string()
    .min(10, "Escribe al menos 10 caracteres.")
    .max(30, "Máximo 30 caracteres."),
  content: z.string().min(100, "Comparte al menos 100 caracteres."),
  section: sectionSlugSchema,
  coverColor: z
    .string()
    .regex(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)
    .optional(),
  coverImage: z
    .string()
    .regex(COVER_IMAGE_PATH)
    .optional()
    .nullable(),
});

export const voteSchema = z.object({
  direction: z.enum(["up", "down"]).default("up"),
});

export const commentSchema = z.object({
  articleId: z.string().cuid(),
  body: z.string().min(3).max(2000),
  parentId: z.string().cuid().optional(),
});
