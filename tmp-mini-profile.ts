import "dotenv/config";
import { getMiniProfilePayload } from "./src/lib/badge-service";

async function main() {
  const payload = await getMiniProfilePayload("test");
  console.log(JSON.stringify(payload, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
