import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("utils", () => {
  describe("cn", () => {
    it("should merge tailwind classes correctly", () => {
      const result = cn("text-red-500", "bg-blue-500", { "opacity-50": true });
      expect(result).toBe("text-red-500 bg-blue-500 opacity-50");
    });

    it("should resolve tailwind conflicts", () => {
      const result = cn("px-2 py-1", "p-4");
      expect(result).toBe("p-4");
    });
  });
});
