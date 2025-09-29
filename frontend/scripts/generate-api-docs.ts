#!/usr/bin/env tsx

/**
 * API Documentation Generator
 * Generates HTML documentation from OpenAPI specs
 */

import fs from 'fs/promises'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

interface GenerateOptions {
  input: string
  output: string
  format: 'html' | 'markdown' | 'json'
  validate: boolean
  serve: boolean
  port?: number
}

const DEFAULT_OPTIONS: GenerateOptions = {
  input: 'docs/api/openapi.yaml',
  output: 'docs/api/generated',
  format: 'html',
  validate: true,
  serve: false,
  port: 8080
}

async function generateApiDocs(options: Partial<GenerateOptions> = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options }
  
  console.log('🚀 Generating API documentation...')
  console.log(`📖 Input: ${config.input}`)
  console.log(`📁 Output: ${config.output}`)
  console.log(`📄 Format: ${config.format}`)

  try {
    // Ensure output directory exists
    await fs.mkdir(config.output, { recursive: true })

    // Validate OpenAPI spec if requested
    if (config.validate) {
      console.log('🔍 Validating OpenAPI specification...')
      await validateOpenAPISpec(config.input)
    }

    // Generate documentation based on format
    switch (config.format) {
      case 'html':
        await generateHTML(config.input, config.output)
        break
      case 'markdown':
        await generateMarkdown(config.input, config.output)
        break
      case 'json':
        await generateJSON(config.input, config.output)
        break
    }

    console.log('✅ API documentation generated successfully!')
    
    if (config.serve) {
      await serveDocumentation(config.output, config.port || 8080)
    }

  } catch (error) {
    console.error('❌ Failed to generate API documentation:', error)
    process.exit(1)
  }
}

async function validateOpenAPISpec(inputPath: string): Promise<void> {
  try {
    // Check if spec file exists
    await fs.access(inputPath)
    
    // Basic YAML/JSON parsing validation
    const content = await fs.readFile(inputPath, 'utf-8')
    
    if (inputPath.endsWith('.yaml') || inputPath.endsWith('.yml')) {
      // For a production setup, you would use a proper YAML parser
      // For now, we'll do basic validation
      if (!content.includes('openapi:') || !content.includes('info:')) {
        throw new Error('Invalid OpenAPI specification: missing required fields')
      }
    } else if (inputPath.endsWith('.json')) {
      JSON.parse(content)
    }
    
    console.log('✅ OpenAPI specification is valid')
  } catch (error) {
    throw new Error(`OpenAPI validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

async function generateHTML(inputPath: string, outputPath: string): Promise<void> {
  console.log('📝 Generating HTML documentation...')
  
  // Create a simple HTML template with Swagger UI
  const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Spontra API Documentation</title>
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css" />
    <link rel="icon" type="image/png" href="https://unpkg.com/swagger-ui-dist@5.9.0/favicon-32x32.png" sizes="32x32" />
    <link rel="icon" type="image/png" href="https://unpkg.com/swagger-ui-dist@5.9.0/favicon-16x16.png" sizes="16x16" />
    <style>
        html {
            box-sizing: border-box;
            overflow: -moz-scrollbars-vertical;
            overflow-y: scroll;
        }
        *, *:before, *:after {
            box-sizing: inherit;
        }
        body {
            margin:0;
            background: #fafafa;
        }
        .swagger-ui .info .title {
            color: #2563eb;
        }
        .swagger-ui .scheme-container {
            background: #fff;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        }
    </style>
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-standalone-preset.js"></script>
    <script>
        window.onload = function() {
            const ui = SwaggerUIBundle({
                url: './openapi.yaml',
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
                tryItOutEnabled: true,
                requestInterceptor: (request) => {
                    // Add API key if available
                    if (localStorage.getItem('api_key')) {
                        request.headers['x-api-key'] = localStorage.getItem('api_key');
                    }
                    return request;
                },
                onComplete: () => {
                    // Add custom functionality after load
                    console.log('Spontra API Documentation loaded');
                }
            });

            // Add API key input functionality
            const topbar = document.querySelector('.topbar');
            if (topbar) {
                const apiKeyInput = document.createElement('div');
                apiKeyInput.innerHTML = \`
                    <div style="padding: 10px; background: #f7f7f7; border-bottom: 1px solid #ddd;">
                        <label for="api-key-input" style="margin-right: 10px; font-weight: bold;">API Key:</label>
                        <input type="password" id="api-key-input" placeholder="Enter your API key" 
                               style="padding: 5px; border: 1px solid #ccc; border-radius: 3px; width: 300px;"
                               value="\${localStorage.getItem('api_key') || ''}"
                               onchange="localStorage.setItem('api_key', this.value)">
                        <button onclick="location.reload()" 
                                style="margin-left: 10px; padding: 5px 10px; background: #2563eb; color: white; border: none; border-radius: 3px; cursor: pointer;">
                            Apply
                        </button>
                    </div>
                \`;
                topbar.parentNode.insertBefore(apiKeyInput, topbar.nextSibling);
            }
        };
    </script>
</body>
</html>`

  // Write HTML file
  await fs.writeFile(path.join(outputPath, 'index.html'), htmlTemplate.trim())
  
  // Copy OpenAPI spec to output directory
  const specContent = await fs.readFile(inputPath, 'utf-8')
  await fs.writeFile(path.join(outputPath, 'openapi.yaml'), specContent)
  
  // Create a simple README
  const readmeContent = `# Spontra API Documentation

This directory contains the generated API documentation for the Spontra platform.

## Files

- \`index.html\` - Interactive Swagger UI documentation
- \`openapi.yaml\` - OpenAPI specification file
- \`README.md\` - This file

## Usage

### Local Development
1. Open \`index.html\` in your browser
2. Enter your API key in the top bar if testing authenticated endpoints
3. Use the "Try it out" feature to test endpoints

### Production
This documentation is automatically deployed and available at:
- Production: https://docs.spontra.com/api
- Staging: https://staging-docs.spontra.com/api

## Authentication

Most endpoints require authentication:
- **Public endpoints**: No authentication required
- **Admin endpoints**: Require \`x-api-key\` header or admin session cookie
- **Rate limiting**: All endpoints are rate-limited

## Testing

Use the interactive documentation to test endpoints:
1. Set your API key using the input at the top
2. Navigate to any endpoint
3. Click "Try it out"
4. Fill in required parameters
5. Execute the request

## Support

For API support, contact: api@spontra.com

Generated on: ${new Date().toISOString()}
`

  await fs.writeFile(path.join(outputPath, 'README.md'), readmeContent)
  
  console.log('✅ HTML documentation generated')
}

async function generateMarkdown(inputPath: string, outputPath: string): Promise<void> {
  console.log('📝 Generating Markdown documentation...')
  
  // Read and parse OpenAPI spec
  const specContent = await fs.readFile(inputPath, 'utf-8')
  
  // For a production setup, you would use a proper OpenAPI parser
  // For now, we'll create a simple markdown template
  const markdownContent = `# Spontra API Documentation

${specContent.split('\n').slice(0, 20).join('\n')}

*Full OpenAPI specification available in \`openapi.yaml\`*

## Quick Start

1. Get your API key from the admin panel
2. Include the API key in requests: \`x-api-key: YOUR_KEY\`
3. Make requests to \`https://api.spontra.com\`

## Rate Limiting

All endpoints are rate-limited:
- Public endpoints: 100 requests/hour per IP
- Admin endpoints: 1000 requests/hour per API key

## Support

For questions or issues, contact: api@spontra.com

Generated on: ${new Date().toISOString()}
`

  await fs.writeFile(path.join(outputPath, 'api-docs.md'), markdownContent)
  
  console.log('✅ Markdown documentation generated')
}

async function generateJSON(inputPath: string, outputPath: string): Promise<void> {
  console.log('📝 Generating JSON documentation...')
  
  const specContent = await fs.readFile(inputPath, 'utf-8')
  
  // Convert YAML to JSON if needed
  if (inputPath.endsWith('.yaml') || inputPath.endsWith('.yml')) {
    // For production, use a proper YAML parser like js-yaml
    // For now, just copy the YAML content
    await fs.writeFile(path.join(outputPath, 'openapi.yaml'), specContent)
  } else {
    // Validate and prettify JSON
    const jsonSpec = JSON.parse(specContent)
    await fs.writeFile(
      path.join(outputPath, 'openapi.json'), 
      JSON.stringify(jsonSpec, null, 2)
    )
  }
  
  console.log('✅ JSON documentation generated')
}

async function serveDocumentation(outputPath: string, port: number): Promise<void> {
  console.log(`🌐 Starting documentation server on port ${port}...`)
  
  // Simple static file server
  const serverScript = `
const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  let filePath = path.join('${outputPath}', req.url === '/' ? 'index.html' : req.url);
  
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('File not found');
      } else {
        res.writeHead(500);
        res.end('Server error');
      }
    } else {
      const ext = path.extname(filePath);
      const contentTypes = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'text/javascript',
        '.yaml': 'text/yaml',
        '.yml': 'text/yaml',
        '.json': 'application/json'
      };
      
      res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'text/plain' });
      res.end(content);
    }
  });
});

server.listen(${port}, () => {
  console.log('📖 Documentation available at: http://localhost:${port}');
  console.log('🛑 Press Ctrl+C to stop the server');
});
`

  // Write and execute the server script
  const serverPath = path.join(outputPath, 'server.js')
  await fs.writeFile(serverPath, serverScript)
  
  const { spawn } = require('child_process')
  const serverProcess = spawn('node', [serverPath], { stdio: 'inherit' })
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down documentation server...')
    serverProcess.kill()
    process.exit(0)
  })
}

// CLI handling
async function main() {
  const args = process.argv.slice(2)
  const options: Partial<GenerateOptions> = {}
  
  for (let i = 0; i < args.length; i += 2) {
    const flag = args[i]
    const value = args[i + 1]
    
    switch (flag) {
      case '--input':
      case '-i':
        options.input = value
        break
      case '--output':
      case '-o':
        options.output = value
        break
      case '--format':
      case '-f':
        options.format = value as 'html' | 'markdown' | 'json'
        break
      case '--serve':
      case '-s':
        options.serve = true
        i-- // No value for this flag
        break
      case '--port':
      case '-p':
        options.port = parseInt(value)
        break
      case '--no-validate':
        options.validate = false
        i-- // No value for this flag
        break
      case '--help':
      case '-h':
        console.log(`
Usage: generate-api-docs [options]

Options:
  -i, --input <path>     Input OpenAPI spec file (default: docs/api/openapi.yaml)
  -o, --output <path>    Output directory (default: docs/api/generated)
  -f, --format <format>  Output format: html, markdown, json (default: html)
  -s, --serve            Start local server after generation
  -p, --port <number>    Port for local server (default: 8080)
  --no-validate          Skip OpenAPI spec validation
  -h, --help             Show this help message

Examples:
  generate-api-docs                                    # Generate HTML docs
  generate-api-docs -f markdown                        # Generate Markdown docs
  generate-api-docs -s -p 3001                        # Generate and serve on port 3001
  generate-api-docs -i custom-spec.yaml -o ./dist     # Custom input/output
`)
        process.exit(0)
      default:
        console.error(`Unknown option: ${flag}`)
        process.exit(1)
    }
  }
  
  await generateApiDocs(options)
}

// Export for programmatic use
export { generateApiDocs }
export type { GenerateOptions }

// Run CLI if called directly
if (require.main === module) {
  main().catch(console.error)
}

