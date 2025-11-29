import { SignJWT, jwtVerify } from "jose";

const secret = process.env.MOBILE_JWT_SECRET ?? process.env.NEXTAUTH_SECRET;
const encoder = new TextEncoder();

function getSecretKey() {
  if (!secret) {
    throw new Error("Missing MOBILE_JWT_SECRET or NEXTAUTH_SECRET for mobile auth");
  }
  return encoder.encode(secret);
}

export async function signMobileToken(payload: { userId: string }) {
  return new SignJWT({ sub: payload.userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecretKey());
}

export async function verifyMobileToken(token: string) {
  const result = await jwtVerify(token, getSecretKey());
  const userId = result.payload.sub;
  if (!userId || typeof userId !== "string") {
    throw new Error("Invalid token payload");
  }
  return { userId };
}

export async function extractUserIdFromRequest(request: Request) {
  const header = request.headers.get("authorization");
  if (!header || !header.startsWith("Bearer ")) {
    return null;
  }
  const token = header.slice(7).trim();
  if (!token) {
    return null;
  }
  try {
    const { userId } = await verifyMobileToken(token);
    return userId;
  } catch (error) {
    console.error("Failed to verify mobile token", error);
    return null;
  }
}
