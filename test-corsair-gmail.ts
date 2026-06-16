import { corsair } from "./src/server/corsair";
const tenant = corsair.withTenant("dev");
console.log("gmail keys:", Object.keys(tenant.gmail));
