/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-floating-promises */
import { test } from "node:test";
import * as assert from "node:assert";
import { build } from "../helper";

test("GET /health returns ok", async (t) => {
  const app = await build(t);
  const res = await app.inject({ method: "GET", url: "/health" });
  assert.strictEqual(res.statusCode, 200);
  assert.deepStrictEqual(res.json(), { status: "ok" });
});

test("GET /version returns name and version", async (t) => {
  const app = await build(t);
  const res = await app.inject({ method: "GET", url: "/version" });
  assert.strictEqual(res.statusCode, 200);
  assert.deepStrictEqual(res.json(), {
    name: "MapsChatbot AI Backend",
    version: "1.0.0",
  });
});
