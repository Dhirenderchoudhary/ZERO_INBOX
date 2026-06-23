import { describe, expect, it } from "vitest";
import { isCorsairAuthMissingError } from "@/server/lib/corsair-errors";

describe("isCorsairAuthMissingError", () => {
  it("detects missing Gmail credential errors", () => {
    expect(
      isCorsairAuthMissingError(
        new Error(
          "[auth-missing:gmail:refresh_token]: Gmail refresh token is missing",
        ),
      ),
    ).toBe(true);
  });

  it("ignores unrelated errors", () => {
    expect(isCorsairAuthMissingError(new Error("database failed"))).toBe(false);
  });
});
