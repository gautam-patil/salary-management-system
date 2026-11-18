import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "./app.js";

function fakeWebBuild() {
  const dir = mkdtempSync(join(tmpdir(), "web-dist-"));
  writeFileSync(join(dir, "index.html"), "<html><body>ACME web app</body></html>");
  return dir;
}

describe("serving the built web app", () => {
  it("serves index.html at the root", async () => {
    const res = await request(createApp({ webDist: fakeWebBuild() })).get("/");

    expect(res.status).toBe(200);
    expect(res.text).toContain("ACME web app");
  });

  it("serves index.html for other pages too, so the app can use client-side routes", async () => {
    const res = await request(createApp({ webDist: fakeWebBuild() })).get("/insights");

    expect(res.status).toBe(200);
    expect(res.text).toContain("ACME web app");
  });

  it("still serves the API", async () => {
    const res = await request(createApp({ webDist: fakeWebBuild() })).get("/api/health");

    expect(res.body.status).toBe("ok");
  });

  it("returns a JSON 404 for an unknown API route, not the web page", async () => {
    const res = await request(createApp({ webDist: fakeWebBuild() })).get("/api/nope");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Not found" });
  });

  it("serves no pages when there is no web build", async () => {
    const res = await request(createApp({ webDist: join(tmpdir(), "does-not-exist") })).get("/");

    expect(res.status).toBe(404);
  });
});
