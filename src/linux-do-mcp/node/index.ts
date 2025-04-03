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
  };
  users: Array<{
    id: number;
    name: string;
  }>;
}

interface LinuxDoNotificationResponse {
  notifications: Array<{
    id: number;
    notification_type: number;
    read: boolean;
    created_at: string;
    fancy_title: string;
    acting_user_name: string;
    data: {
      topic_title?: string;
      message?: string;
      display_username?: string;
      badge_name?: string;
    };
  }>;
}

interface LinuxDoBookmarkResponse {
  bookmarks: Array<{
    id: number;
    topic_title?: string;
    fancy_title?: string;
    created_at: string;
    bookmarkable_url: string;
    user: {
      id: number;
      username: string;
    };
  }>;
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

function getUsername(): string {
  const username = process.env.LINUX_DO_USERNAME;
  if (!username) {
    console.error("LINUX_DO_USERNAME environment variable is not set");
    process.exit(1);
  }
  return username;
}

const LINUX_DO_USERNAME = getUsername();

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

const NEW_TOPIC_TOOL: Tool = {
  name: "new_topic",
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

const UNREAD_TOPIC_TOOL: Tool = {
  name: "unread_topic",
  description: "获取Linux.do您当前正在关注或追踪，具有未读帖子的话题",
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

const UNSEEN_TOPIC_TOOL: Tool = {
  name: "unseen_topic",
  description: "获取Linux.do新话题和您当前正在关注或追踪，具有未读帖子的话题",
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

const POST_TOPIC_TOOL: Tool = {
  name: "post_topic",
  description: "获取Linux.do您发过帖子的话题",
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

const NEW_NOTIFICATION_TOOL: Tool = {
  name: "new_notification",
  description: "获取Linux.do您最近的未读通知",
  inputSchema: {
    type: "object",
    properties: {
      limit: {
        type: "number",
        description: "获取的通知数量，默认为30"
      },
      read: {
        type: "boolean",
        description: "是否已读，默认为false"
      },
      filter_by_types: {
        type: "array",
        items: {
          type: "string",
          enum: [
          ]
        },
        description: "过滤通知类型，默认为所有类型"
      },

    }
  }
};

const MY_BOOKMARK_TOOL: Tool = {
  name: "my_bookmark",
  description: "获取Linux.do您收藏的帖子",
  inputSchema: {
    type: "object",
    properties: {}
  }
};

const MY_PRIVATE_MESSAGE_TOOL: Tool = {
  name: "my_private_message",
  description: "获取Linux.do您收到的私信",
  inputSchema: {
    type: "object",
    properties: {}
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

const NOTIFICATION_TYPE_MAP = {
  "mentioned": 1,
  "replied": 2,
  "quoted": 3,
  "edited": 4,
  "liked": 5,
  "private_message": 6,
  "invited_to_private_message": 7,
  "invitee_accepted": 8,
  "posted": 9,
  "moved_post": 10,
  "linked": 11,
  "granted_badge": 12,
  "invited_to_topic": 13,
  "custom": 14,
  "group_mentioned": 15,
  "group_message_summary": 16,
  "watching_first_post": 17,
  "topic_reminder": 18,
  "liked_consolidated": 19,
  "post_approved": 20,
  "code_review_commit_approved": 21,
  "membership_request_accepted": 22,
  "membership_request_consolidated": 23,
  "bookmark_reminder": 24,
  "reaction": 25,
  "votes_released": 26,
  "event_reminder": 27,
  "event_invitation": 28,
  "chat_mention": 29,
  "chat_message": 30,
  "chat_invitation": 31,
  "chat_group_mention": 32,
  "chat_quoted": 33,
  "assigned": 34,
  "question_answer_user_commented": 35,
  "watching_category_or_tag": 36,
  "new_features": 37,
  "admin_problems": 38,
  "linked_consolidated": 39,
  "chat_watched_thread": 40,
  "following": 800,
  "following_created_topic": 801,
  "following_replied": 802,
  "circles_activity": 900,
}

const NOTIFICATION_MAP = {
  "reply": "mentioned,group_mentioned,posted,quoted,replied",
  "like": "liked,liked_consolidated,reaction",
  "other": "edited,invited_to_private_message,invitee_accepted,moved_post,linked,granted_badge,invited_to_topic,custom,watching_first_post,topic_reminder,post_approved,code_review_commit_approved,membership_request_accepted,membership_request_consolidated,votes_released,event_reminder,event_invitation,chat_group_mention,assigned,question_answer_user_commented,watching_category_or_tag,new_features,admin_problems,linked_consolidated,following,following_created_topic,following_replied,circles_activity"
}

const LINUX_DO_TOPIC_TOOLS = [
  LATEST_TOPIC_TOOL,
  TOP_TOPIC_TOOL,
  HOT_TOPIC_TOOL,
  FETCH_AGAIN_TOOL,
  CATEGORY_TOPIC_TOOL,
  NEW_TOPIC_TOOL,
  UNREAD_TOPIC_TOOL,
  UNSEEN_TOPIC_TOOL,
  POST_TOPIC_TOOL,
] as const;

const LINUX_DO_PERSONAL_TOOLS = [
  NEW_NOTIFICATION_TOOL,
  MY_BOOKMARK_TOOL,
  MY_PRIVATE_MESSAGE_TOOL,
]

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
          )?.username || '某位佬友'
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
          poster: data.users.find(user =>
            user.id === topic.posters[0]?.user_id
          )?.name || '某位佬友'
        }))
      }, null, 2)
    }],
    isError: false
  };
}

function formatNotificationResponse(data: LinuxDoNotificationResponse) {
  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        notifications: data.notifications.map(notification => {
          // Get the string key for the notification type
          const notificationType = Object.keys(NOTIFICATION_TYPE_MAP).find(
            key => NOTIFICATION_TYPE_MAP[key as keyof typeof NOTIFICATION_TYPE_MAP] === notification.notification_type
          ) || 'unknown';

          let username = notification.data.display_username || notification.acting_user_name;
          const title = notification.fancy_title || notification.data.topic_title || '';
          let message = notification.data.message || '';
          
          // Handle specific notification types
          if (username.includes('个回复')) {
            message = username;
            username = '系统通知';
          }

          if (notification.notification_type === NOTIFICATION_TYPE_MAP.granted_badge && notification.data.badge_name) {
            message = `获得了 "${notification.data.badge_name}" 徽章`;
          }
        
          return {
            username,
            title,
            notification_type: notificationType,
            message,
            created_at: notification.created_at,
            read: notification.read
          };
        })
      }, null, 2)
    }],
    isError: false
  };
}

function formatBookmarkResponse(data: LinuxDoBookmarkResponse) {
  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        bookmarks: data.bookmarks.map(bookmark => ({
          title: bookmark.topic_title,
          created_at: bookmark.created_at,
          url: bookmark.bookmarkable_url,
          username: bookmark.user?.username || '某位佬友'
        }))
      }, null, 2)
    }],
    isError: false
  };
}

function formatPrivateMessageResponse(data: any) {
  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        messages: data.topic_list.topics.map((topic: any) => ({
          title: topic.title,
          created_at: topic.created_at,
          url: `https://linux.do/t/${topic.id}`,
          last_poster: data.users.find((user: any) =>
            user.id === topic.posters[0]?.user_id
          )?.name || '某位佬友'
        }))
      }, null, 2)
    }],
    isError: false
  };
}

// Common fetch function to reduce duplication
async function fetchLinuxDoApi(endpoint: string, params: Record<string, any> = {}, requiresAuth: boolean = false): Promise<any> {
  const url = new URL(`https://linux.do/${endpoint}`);
  
  // Add common parameters
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.append(key, value.toString());
    }
  });
  
  const options: {
    headers?: Record<string, string>;
  } = {};
  if (requiresAuth) {
    options.headers = {
      "User-Api-Key": LINUX_DO_API_KEY,
    };
  }
  
  const response = await fetch(url.toString(), options);
  if (!response.ok) {
    throw new Error(`Error fetching from ${endpoint}: ${response.statusText}`);
  }
  
  return await response.json();
}

// Generic topic handler for most topic-related endpoints
async function handleTopicEndpoint(endpoint: string, params: { page?: number; per_page?: number; period?: string } = {}, requiresAuth: boolean = false) {
  const apiPath = params.period ? `${endpoint}/${params.period}.json` : `${endpoint}.json`;
  const apiParams = {
    page: params.page || 1,
    per_page: params.per_page || 10
  };
  
  const data = await fetchLinuxDoApi(apiPath, apiParams, requiresAuth) as LinuxDoTopicResponse;
  return formatTopicResponse(data);
}

// API handlers using the generic function
async function handleLatest(params: { page?: number; per_page?: number }) {
  return handleTopicEndpoint('latest', params);
}

async function handleTop(params: { period: string; page?: number; per_page?: number }) {
  return handleTopicEndpoint('top', params);
}

async function handleHot(params: { page?: number; per_page?: number }) {
  return handleTopicEndpoint('hot', params);
}

async function handleNew(params: { page?: number; per_page?: number }) {
  return handleTopicEndpoint('new', params, true);
}

async function handleUnread(params: { page?: number; per_page?: number }) {
  return handleTopicEndpoint('unread', params, true);
}

async function handleUnseen(params: { page?: number; per_page?: number }) {
  return handleTopicEndpoint('unseen', params, true);
}

async function handlePost(params: { page?: number; per_page?: number }) {
  return handleTopicEndpoint('posted', params, true);
}

// Non-standard handlers that need custom implementation
async function handleCategory(params: { category: keyof typeof CATEGORY_MAP; page?: number; per_page?: number }) {
  const categoryId = CATEGORY_MAP[params.category];
  const data = await fetchLinuxDoApi('categories_and_latest', {
    page: params.page || 1,
    per_page: params.per_page || 50
  }) as LinuxDoCategoryResponse;
  
  return formatCategoryTopicResponse(data, categoryId);
}

async function handleNotification(params: { limit?: number; read?: boolean; filter_by_types?: string[] }) {
  const apiParams: Record<string, any> = {
    limit: params.limit || 10,
    recent: "true",
    bump_last_seen_reviewable: "true"
  };
  
  if (params.filter_by_types) {
    const mappedTypes = params.filter_by_types
      .flatMap(type => NOTIFICATION_MAP[type as keyof typeof NOTIFICATION_MAP]?.split(",") || []);
    if (mappedTypes.length > 0) {
      apiParams.filter_by_types = mappedTypes.join(",");
      apiParams.silent = "true";
    }
  }
  
  const data = await fetchLinuxDoApi('notifications.json', apiParams, true) as LinuxDoNotificationResponse;
  return formatNotificationResponse(data);
}

async function handleBookmark() {
  const data = await fetchLinuxDoApi(`u/${LINUX_DO_USERNAME}/user-menu-bookmarks.json`, {}, true) as LinuxDoBookmarkResponse;
  return formatBookmarkResponse(data);
}

async function handlePrivateMessage() {
  const data = await fetchLinuxDoApi(`topics/private-messages/${LINUX_DO_USERNAME}.json`, {}, true);
  return formatPrivateMessageResponse(data);
}

// Add the missing fetch tool handler that uses the generic version
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

// Server setup
const server = new Server(
  {
    name: "pleasure1234/linux-do-mcp",
    version: "1.0.7",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// Set up request handlers
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [...LINUX_DO_TOPIC_TOOLS, ...LINUX_DO_PERSONAL_TOOLS],
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

      case "new_topic": {
        const { page, per_page } = request.params.arguments as {
          page?: number;
          per_page?: number;
        };
        return await handleNew({ page, per_page });
      }
      
      case "unread_topic": {
        const { page, per_page } = request.params.arguments as {
          page?: number;
          per_page?: number;
        };
        return await handleUnread({ page, per_page });
      }
      
      case "unseen_topic": {
        const { page, per_page } = request.params.arguments as {
          page?: number;
          per_page?: number;
        };
        return await handleUnseen({ page, per_page });
      }
      
      case "post_topic": {
        const { page, per_page } = request.params.arguments as {
          page?: number;
          per_page?: number;
        };
        return await handlePost({ page, per_page });
      }
      
      case "new_notification": {
        const { limit, read, filter_by_types } = request.params.arguments as {
          limit?: number;
          read?: boolean;
          filter_by_types?: string[];
        };
        return await handleNotification({ limit, read, filter_by_types });
      }
      
      case "my_bookmark": {
        return await handleBookmark();
      }
      
      case "my_private_message": {
        return await handlePrivateMessage();
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