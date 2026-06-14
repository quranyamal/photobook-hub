import { GET } from "@/app/api/docs/route";

const makeRequest = () =>
  new Request("http://localhost/api/docs", { method: "GET" });

describe("GET /api/docs", () => {
  it("returns 200", async () => {
    const res = await GET(makeRequest());

    expect(res.status).toBe(200);
  });

  it("returns Content-Type text/html", async () => {
    const res = await GET(makeRequest());

    expect(res.headers.get("Content-Type")).toContain("text/html");
  });

  it("renders Swagger UI bundle", async () => {
    const res = await GET(makeRequest());
    const html = await res.text();

    expect(html).toContain("SwaggerUIBundle");
    expect(html).toContain("swagger-ui-dist");
  });

  it("embeds the PhotoBook Hub OpenAPI spec", async () => {
    const res = await GET(makeRequest());
    const html = await res.text();

    expect(html).toContain("PhotoBook Hub API");
    expect(html).toContain("/auth/register");
    expect(html).toContain("openapi");
  });
});
