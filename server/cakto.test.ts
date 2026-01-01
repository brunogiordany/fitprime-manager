import { describe, it, expect } from "vitest";

const CAKTO_API_URL = "https://api.cakto.com.br";

describe("Cakto API Integration", () => {
  it("should authenticate with Cakto API using client credentials", async () => {
    const clientId = process.env.CAKTO_CLIENT_ID;
    const clientSecret = process.env.CAKTO_CLIENT_SECRET;

    expect(clientId).toBeDefined();
    expect(clientSecret).toBeDefined();
    expect(clientId).not.toBe("");
    expect(clientSecret).not.toBe("");

    // Test OAuth2 token endpoint
    const response = await fetch(`${CAKTO_API_URL}/public_api/token/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId!,
        client_secret: clientSecret!,
      }),
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    
    expect(data).toHaveProperty("access_token");
    expect(data).toHaveProperty("token_type", "Bearer");
    expect(data).toHaveProperty("expires_in");
    expect(typeof data.access_token).toBe("string");
    expect(data.access_token.length).toBeGreaterThan(0);

    console.log("✅ Cakto authentication successful!");
    console.log(`Token expires in: ${data.expires_in} seconds`);
    console.log(`Scopes: ${data.scope || "not specified"}`);
  });
});
