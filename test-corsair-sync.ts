import { corsair } from "./src/server/corsair";
const tenant = corsair.withTenant("dev");
console.log("gmail keys:", Object.keys(tenant.gmail));
console.log("gmail.db.messages keys:", Object.keys(tenant.gmail.db.messages));
