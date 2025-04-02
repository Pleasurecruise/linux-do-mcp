#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import fetch from "node-fetch";

// Response interfaces
interface LinuxDoTopicResponse {
  users: Array<{
    id: number;
    name: string;
  }>;
  topic_list: {
    topics: Array<{
      id: number;
      title: string;
      created_at: string;
      posters: Array<{
        user_id: number;
      }>;
    }>;
  };
}

interface LinuxDoCategoryResponse {
  category_list: {
    categories: Array<{
      id: number;
      name: string;
    }>;
  };
  topic_list: {
    topics: Array<{
      id: number;
      title: string;
      created_at: string;
      category_id: number;
      posters: Array<{
        user_id: number;
      }>;
    }>;
    users: Array<{
      id: number;
      name: string;
    }>;
  };
}

function getApiKey(): string {
  const apiKey = process.env.LINUX_DO_API_KEY;
  if (!apiKey) {
    console.error("LINUX_DO_API_KEY environment variable is not set");
    process.exit(1);
  }
  return apiKey;
}

const LINUX_DO_API_KEY = getApiKey();

// Tool definitions
const LATEST_TOPIC_TOOL: Tool = {
  name: "latest_topic",
  description: "获取Linux.do有新帖子的话题",
  inputSchema: {
    type: "object",
    properties: {
      page: {
        type: "number",
        description: "页码，默认为1"
      },
      per_page: {
        type: "number",
        description: "每页条数，默认为10"
      }
    }
  }
};

const TOP_TOPIC_TOOL: Tool = {
  name: "top_topic",
  description: "获取Linux.do过去一年一月一周一天中最活跃的话题",
  inputSchema: {
    type: "object",
    properties: {
      period: {
        type: "string",
        enum: ["daily", "weekly", "monthly", "quarterly", "yearly", "all"],
        description: "时间周期：每日/每周/每月/每年/全部"
      },
      page: {
        type: "number",
        description: "页码，默认为1"
      },
      per_page: {
        type: "number",
        description: "每页条数，默认为10"
      }
    },
    required: ["period"]
  }
};

const HOT_TOPIC_TOOL: Tool = {
  name: "hot_topic",
  description: "获取Linux.do最近热门话题",
  inputSchema: {
    type: "object",
    properties: {
      page: {
        type: "number",
        description: "页码，默认为1"
      },
      per_page: {
        type: "number",
        description: "每页条数，默认为10"
      }
    }
  }
};

const FETCH_AGAIN_TOOL: Tool = {
  name: "fetch_again",
  description: "重新获取指定的Linux.do话题列表",
  inputSchema: {
    type: "object",
    properties: {
      tool: {
        type: "string",
        enum: ["latest_topic", "newest_topic", "top_topic", "hot_topic"],
        description: "要重新调用的工具名称"
      },
      params: {
        type: "object",
        description: "工具的原始参数",
        properties: {
          page: { type: "number" },
          per_page: { type: "number" },
          period: {
            type: "string",
            enum: ["daily", "weekly", "monthly", "quarterly", "yearly", "all"],
          }
        }
      }
    },
    required: ["tool", "params"]
  }
};

const CATEGORY_TOPIC_TOOL: Tool = {
  name: "category_topic",
  description: "获取Linux.do特定分类下的话题",
  inputSchema: {
    type: "object",
    properties: {
      category: {
        type: "string",
        enum: ["Development", "Resources", "Documentation", "Flea Market",
          "Job Market", "Book Club", "Set Sail", "News Flash",
          "Web Archive", "Benefits", "Off-Topic", "Feedback"],
        description: "话题分类名称"
      },
      page: {
        type: "number",
        description: "页码，默认为1"
      },
      per_page: {
        type: "number",
        description: "每页条数，默认为10"
      }
    },
    required: ["category"]
  }
};

const CATEGORY_MAP = {
  "Feedback": 2,
  "Development": 4,
  "Flea Market": 10,
  "Off-Topic": 11,
  "Resources": 14,
  "Job Market": 27,
  "Book Club": 32,
  "News Flash": 34,
  "Benefits": 36,
  "Documentation": 42,
  "Set Sail": 46,
  "Web Archive": 92,
} as const;

const LINUX_DO_TOPIC_TOOLS = [
  LATEST_TOPIC_TOOL,
  TOP_TOPIC_TOOL,
  HOT_TOPIC_TOOL,
  FETCH_AGAIN_TOOL,
  CATEGORY_TOPIC_TOOL
] as const;

// Helper function to format topic response
function formatTopicResponse(data: LinuxDoTopicResponse) {
  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        topics: data.topic_list.topics.map(topic => ({
          title: topic.title,
          created_at: topic.created_at,
          url: `https://linux.do/t/${topic.id}`,
          poster: data.users.find(user =>
            user.id === topic.posters[0]?.user_id
          )?.name || '某位佬友'
        }))
      }, null, 2)
    }],
    isError: false
  };
}

function formatCategoryTopicResponse(data: LinuxDoCategoryResponse, categoryId: number) {
  const filteredTopics = data.topic_list.topics
    .filter(topic => topic.category_id === categoryId)
    .slice(0, 5);

  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        category: data.category_list.categories.find(category => category.id === categoryId)?.name || '未知分类',
        topics: filteredTopics.map(topic => ({
          title: topic.title,
          created_at: topic.created_at,
          url: `https://linux.do/t/${topic.id}`,
          poster: data.topic_list.users?.find(user =>
            user.id === topic.posters[0]?.user_id
          )?.name || '某位佬友'
        }))
      }, null, 2)
    }],
    isError: false
  };
}

// API handlers
async function handleLatest(params: { page?: number; per_page?: number }) {
  const url = new URL("https://linux.do/latest.json");
  url.searchParams.append("page", (params.page || 1).toString());
  url.searchParams.append("per_page", (params.per_page || 10).toString());

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Error fetching latest topics: ${response.statusText}`);
  }

  const data = await response.json() as LinuxDoTopicResponse;
  return formatTopicResponse(data);
}

async function handleTop(params: { period: string; page?: number; per_page?: number }) {
  const url = new URL(`https://linux.do/top/${params.period}.json`);
  url.searchParams.append("page", (params.page || 1).toString());
  url.searchParams.append("per_page", (params.per_page || 10).toString());

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Error fetching top topics: ${response.statusText}`);
  }

  const data = await response.json() as LinuxDoTopicResponse;
  return formatTopicResponse(data);
}

async function handleHot(params: { page?: number; per_page?: number }) {
  const url = new URL("https://linux.do/hot.json");
  url.searchParams.append("page", (params.page || 1).toString());
  url.searchParams.append("per_page", (params.per_page || 10).toString());

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Error fetching hot topics: ${response.statusText}`);
  }

  const data = await response.json() as LinuxDoTopicResponse;
  return formatTopicResponse(data);
}

async function handleFetch(params: { tool: string; params: any }) {
  switch (params.tool) {
    case "latest_topic":
      return handleLatest(params.params);
    case "top_topic":
      return handleTop(params.params);
    case "hot_topic":
      return handleHot(params.params);
    default:
      throw new Error(`Unknown tool: ${params.tool}`);
  }
}

async function handleCategory(params: { category: keyof typeof CATEGORY_MAP; page?: number; per_page?: number }) {
  const categoryId = CATEGORY_MAP[params.category];
  const url = new URL("https://linux.do/categories_and_latest");
  url.searchParams.append("page", (params.page || 1).toString());
  url.searchParams.append("per_page", (params.per_page || 50).toString());

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Error fetching category topics: ${response.statusText}`);
  }

  const data = await response.json() as LinuxDoCategoryResponse;
  return formatCategoryTopicResponse(data, categoryId);
}

// Server setup
const server = new Server(
  {
    name: "pleasure1234/linux-do-mcp",
    version: "1.0.5",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// Set up request handlers
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: LINUX_DO_TOPIC_TOOLS,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    switch (request.params.name) {
      case "latest_topic": {
        const { page, per_page } = request.params.arguments as {
          page?: number;
          per_page?: number;
        };
        return await handleLatest({ page, per_page });
      }

      case "top_topic": {
        const { period, page, per_page } = request.params.arguments as {
          period: string;
          page?: number;
          per_page?: number;
        };
        return await handleTop({ period, page, per_page });
      }

      case "hot_topic": {
        const { page, per_page } = request.params.arguments as {
          page?: number;
          per_page?: number;
        };
        return await handleHot({ page, per_page });
      }

      case "fetch_again": {
        const { tool, params } = request.params.arguments as {
          tool: string;
          params: any;
        };
        return await handleFetch({ tool, params });
      }

      case "category_topic": {
        const { category, page, per_page } = request.params.arguments as {
          category: keyof typeof CATEGORY_MAP;
          page?: number;
          per_page?: number;
        };
        return await handleCategory({ category, page, per_page });
      }

      default:
        return {
          content: [{
            type: "text",
            text: `Unknown tool: ${request.params.name}`
          }],
          isError: true
        };
    }
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `Error: ${error instanceof Error ? error.message : String(error)}`
      }],
      isError: true
    };
  }
});

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Linux Do MCP Server running on stdio");
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});