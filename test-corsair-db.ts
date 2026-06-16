import { corsair } from "./src/server/corsair";
const tenant = corsair.withTenant("dev");
console.log("DB keys:", Object.keys(tenant.gmail.db));
console.log("Messages keys:", Object.keys(tenant.gmail.db.messages));
