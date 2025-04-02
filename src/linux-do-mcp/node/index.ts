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
      username: string;
      name: string;
      avatar_template: string;
      flair_name?: string;
      flair_url?: string;
      flair_bg_color?: string;
      flair_color?: string;
      flair_group_id?: number;
      admin?: boolean;
      moderator?: boolean;
      trust_level?: number;
      animated_avatar?: string | null;
    }>;
    primary_groups: Array<{
      id: number;
      name: string;
    }>;
    flair_groups: Array<{
      id: number;
      name: string;
      flair_url: string | null;
      flair_bg_color: string;
      flair_color: string;
    }>;
    topic_list: {
      can_create_topic: boolean;
      more_topics_url: string;
      for_period: string;
      per_page: number;
      top_tags: string[];
      topics: Array<{
        id: number;
        title: string;
        fancy_title: string;
        slug: string;
        posts_count: number;
        reply_count: number;
        highest_post_number: number;
        image_url: string | null;
        created_at: string;
        last_posted_at: string;
        bumped: boolean;
        bumped_at: string;
        archetype: string;
        unseen: boolean;
        pinned: boolean;
        unpinned: boolean | null;
        visible: boolean;
        closed: boolean;
        archived: boolean;
        bookmarked: boolean | null;
        liked: boolean | null;
        thumbnails: any | null;
        tags: string[];
        tags_descriptions: Record<string, string>;
        views: number;
        like_count: number;
        has_summary: boolean;
        last_poster_username: string;
        category_id: number;
        pinned_globally: boolean;
        featured_link?: string;
        featured_link_root_domain?: string;
        has_accepted_answer: boolean;
        can_have_answer: boolean;
        can_vote: boolean;
        posters: Array<{
          extras: string | null;
          description: string;
          user_id: number;
          primary_group_id: number | null;
          flair_group_id: number | null;
        }>;
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

const NEWEST_TOPIC_TOOL: Tool = {
    name: "newest_topic",
    description: "获取Linux.do最近几天创建的话题",
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

const LINUX_DO_TOPIC_TOOLS = [
    LATEST_TOPIC_TOOL,
    NEWEST_TOPIC_TOOL,
    TOP_TOPIC_TOOL,
    HOT_TOPIC_TOOL,
    FETCH_AGAIN_TOOL
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
  
async function handleNewest(params: { page?: number; per_page?: number }) {
    const url = new URL("https://linux.do/new.json");
    url.searchParams.append("page", (params.page || 1).toString());
    url.searchParams.append("per_page", (params.per_page || 10).toString());
  
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Error fetching newest topics: ${response.statusText}`);
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
      case "newest_topic":
        return handleNewest(params.params);
      case "top_topic":
        return handleTop(params.params);
      case "hot_topic":
        return handleHot(params.params);
      default:
        throw new Error(`Unknown tool: ${params.tool}`);
    }
  }

// Server setup
const server = new Server(
  {
    name: "pleasure1234/linux-do-mcp",
    version: "1.0.0",
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
  
        case "newest_topic": {
          const { page, per_page } = request.params.arguments as {
            page?: number;
            per_page?: number;
          };
          return await handleNewest({ page, per_page });
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