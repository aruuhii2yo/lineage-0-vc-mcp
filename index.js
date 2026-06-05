#!/usr/bin/env node\nconst { Server } = require('@modelcontextprotocol/sdk/server/index.js');\nconst { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');\nconst { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');\n\nconst server = new Server(\n  {\n    name: 'lineage-0-vc-mcp',\n    version: '1.0.0',\n  },\n  {\n    capabilities: {\n      tools: {},\n    },\n  }\n);\n\nserver.setRequestHandler(ListToolsRequestSchema, async () => {\n  return {\n    tools: [\n      
      {
        name: "lineage0_generate_media",
        description: "Generates premium 4K AI Video or Images using Amazon Nova Reel 1.1 and Nova Canvas.",
        inputSchema: {
          type: "object",
          properties: {
            media_type: { type: "string", enum: ["video", "image"] },
            prompt: { type: "string" }
          },
          required: ["media_type", "prompt"],
        },
      },
      {
        name: "lineage0_check_status",
        description: "Check the rendering status of a generated 4K video using its Job ID.",
        inputSchema: {
          type: "object",
          properties: { job_id: { type: "string" } },
          required: ["job_id"],
        },
      }
    \n    ],\n  };\n});\n\nserver.setRequestHandler(CallToolRequestSchema, async (request) => {\n  const { name, arguments: args } = request.params;\n  \n  try {\n    switch (name) {\n      
      case "lineage0_generate_media": {
        const receiptId = process.env.RECEIPT_ID || "TEAK";
        const response = await fetch("https://4fqtt1biea.execute-api.us-east-1.amazonaws.com", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: args.media_type, prompt: args.prompt, receiptId }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Generation failed.");
        if (args.media_type === 'image') return { content: [{ type: "text", text: "[LINEAGE.0 VC] Image synthesized: " + (data.resultUrl || data.imageUrl) }] };
        return { content: [{ type: "text", text: "[LINEAGE.0 VC] Video rendering. Job ID: " + data.jobId }] };
      }
      case "lineage0_check_status": {
        const response = await fetch("https://4fqtt1biea.execute-api.us-east-1.amazonaws.com/status/" + encodeURIComponent(args.job_id));
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Status check failed.");
        if (data.status === 'processing') return { content: [{ type: "text", text: "[LINEAGE.0 VC] Still rendering..." }] };
        return { content: [{ type: "text", text: "[LINEAGE.0 VC] Render complete! Video URL: " + data.resultUrl }] };
      }
    \n      default:\n        throw new Error('Unknown tool: ' + name);\n    }\n  } catch (err) {\n    return { content: [{ type: 'text', text: '[ERROR] ' + err.message }], isError: true };\n  }\n});\n\nasync function startServer() {\n  const transport = new StdioServerTransport();\n  await server.connect(transport);\n}\n\nstartServer().catch(err => {\n  console.error(err);\n  process.exit(1);\n});\n