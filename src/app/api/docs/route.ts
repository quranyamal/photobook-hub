import { openApiSpec } from "@/lib/openapi";
import { createRequestLogger, getRequestId, logResponse } from "@/lib/request-logger";

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  const log = createRequestLogger(requestId, { method: "GET", path: "/api/docs" });
  const start = Date.now();

  log.debug("Incoming request");

  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>PhotoBook Hub — API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
    <style>
      body { margin: 0; }
      .swagger-ui .topbar { background-color: #1a1a2e; }
      .swagger-ui .topbar .download-url-wrapper { display: none; }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      SwaggerUIBundle({
        spec: ${JSON.stringify(openApiSpec)},
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
        layout: 'BaseLayout',
      });
    </script>
  </body>
</html>`;

  const response = new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });

  logResponse(log, 200, start);
  return response;
}
