import { parseRawGoogleMessage } from "./src/server/lib/emailUtils";
const dummy = {
  id: "1",
  payload: {
    headers: [
      { name: "From", value: "test@example.com" },
      { name: "Subject", value: "Hello" },
    ],
  },
};
console.log(parseRawGoogleMessage(dummy));
