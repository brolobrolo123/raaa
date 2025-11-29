import { describe, expect, it } from "vitest";
import { registerSchema } from "@/lib/validators";

describe("registerSchema", () => {
  it("validates a proper payload", () => {
    const result = registerSchema.safeParse({
      username: "usuario123",
      email: "correo@example.com",
      password: "password123",
    });

    expect(result.success).toBe(true);
  });

  it("rejects weak usernames", () => {
    const result = registerSchema.safeParse({
      username: "@",
      email: "correo@example.com",
      password: "password123",
    });

    expect(result.success).toBe(false);
  });
});
