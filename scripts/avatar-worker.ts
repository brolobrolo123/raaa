import "dotenv/config";
import { runAvatarBattleCycle } from "@/lib/avatar/engine";

const POLLING_INTERVAL_MS = 10_000;

async function main() {
  console.log("Avatar battle worker iniciado.");
  while (true) {
    try {
      await runAvatarBattleCycle();
    } catch (error) {
      console.error("Error en ciclo de batallas automáticas:", error);
    }
    await new Promise((resolve) => setTimeout(resolve, POLLING_INTERVAL_MS));
  }
}

void main();
