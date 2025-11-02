/**
 * API Documentation Page
 * 
 * Interactive API documentation using Swagger UI.
 * Loads OpenAPI 3.1 specification from /specs/001-multi-tenant-ecommerce/contracts/openapi.yaml
 * 
 * **Features**:
 * - Interactive API explorer with try-it-out functionality
 * - Authentication support (Bearer token)
 * - Request/response examples
 * - Schema validation
 * 
 * **Access**: http://localhost:3000/api/docs
 */

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

/**
 * GET /api/docs
 * 
 * Serves HTML page with Swagger UI for interactive API documentation
 */
export async function GET() {
  try {
    // Load OpenAPI spec from file system
    const specPath = path.join(process.cwd(), 'specs', '001-multi-tenant-ecommerce', 'contracts', 'openapi.yaml');
    const specContent = fs.readFileSync(specPath, 'utf8');
    const spec = yaml.load(specContent);

    // Generate HTML with Swagger UI
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>StormCom API Documentation</title>
  <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
  <style>
    body {
      margin: 0;
      padding: 0;
    }
    
    .swagger-ui .topbar {
      background-color: #1f2937;
    }
    
    .swagger-ui .topbar .download-url-wrapper {
      display: none;
    }
    
    .custom-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 2rem;
      text-align: center;
    }
    
    .custom-header h1 {
      margin: 0 0 0.5rem 0;
      font-size: 2rem;
    }
    
    .custom-header p {
      margin: 0;
      opacity: 0.9;
    }
  </style>
</head>
<body>
  <div class="custom-header">
    <h1>🌩️ StormCom API Documentation</h1>
    <p>RESTful API for Multi-tenant E-commerce Platform</p>
  </div>
  
  <div id="swagger-ui"></div>

  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      const spec = ${JSON.stringify(spec)};
      
      const ui = SwaggerUIBundle({
        spec: spec,
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout",
        persistAuthorization: true,
        tryItOutEnabled: true,
        filter: true,
        displayRequestDuration: true,
        showExtensions: true,
        showCommonExtensions: true,
      });

      window.ui = ui;
    };
  </script>
</body>
</html>
    `;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('[api/docs] Failed to load OpenAPI spec:', error);
    
    return new NextResponse(
      `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>API Documentation Error</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background: #f3f4f6;
    }
    .error-box {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      max-width: 500px;
    }
    h1 {
      color: #dc2626;
      margin-top: 0;
    }
  </style>
</head>
<body>
  <div class="error-box">
    <h1>⚠️ API Documentation Error</h1>
    <p>Failed to load OpenAPI specification. Please ensure the spec file exists at:</p>
    <code>specs/001-multi-tenant-ecommerce/contracts/openapi.yaml</code>
    <p style="margin-top: 1rem; color: #6b7280;">
      ${error instanceof Error ? error.message : 'Unknown error'}
    </p>
  </div>
</body>
</html>
      `,
      {
        status: 500,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    );
  }
}
