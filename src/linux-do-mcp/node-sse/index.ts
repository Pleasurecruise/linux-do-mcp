import { FastMCP } from "fastmcp";
import { z } from "zod";
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

interface LinuxDoSearchResponse {
    posts: Array<{
        id: number;
        username: string;
        created_at: string;
        topic_id: number;
        like_count: number;
    }>;
    topics: Array<{
        id: number;
        fancy_title: string;
        created_at: string;
        category_id: number;
    }>;
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

// Config and constants
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

function getApiKey(): string {
    const apiKey = process.env.LINUX_DO_API_KEY;
    if (!apiKey) {
        console.error("LINUX_DO_API_KEY environment variable is not set");
        process.exit(1);
    }
    return apiKey;
}

function getUsername(): string {
    const username = process.env.LINUX_DO_USERNAME;
    if (!username) {
        console.error("LINUX_DO_USERNAME environment variable is not set");
        process.exit(1);
    }
    return username;
}

const LINUX_DO_API_KEY = getApiKey();
const LINUX_DO_USERNAME = getUsername();

// Helper function to format topic response
function formatTopicResponse(data: LinuxDoTopicResponse) {
    return JSON.stringify({
        topics: data.topic_list.topics.map(topic => ({
            title: topic.title,
            created_at: topic.created_at,
            url: `https://linux.do/t/${topic.id}`,
            poster: data.users.find(user =>
                user.id === topic.posters[0]?.user_id
            )?.username || '某位佬友'
        }))
    }, null, 2);
}

function formatSearchResponse(data: LinuxDoSearchResponse) {
    return JSON.stringify({
        topics: data.topics.map(topic => ({
            title: topic.fancy_title,
            created_at: topic.created_at,
            url: `https://linux.do/t/${topic.id}`,
        })),
        posts: data.posts.map(post => ({
            username: post.username,
            created_at: post.created_at,
            like_count: post.like_count,
            url: `https://linux.do/t/${post.topic_id}`
        }))
    }, null, 2);
}

function formatCategoryTopicResponse(data: LinuxDoCategoryResponse, categoryId: number) {
    const filteredTopics = data.topic_list.topics
        .filter(topic => topic.category_id === categoryId)
        .slice(0, 5);

    return JSON.stringify({
        category: data.category_list.categories.find(category => category.id === categoryId)?.name || '未知分类',
        topics: filteredTopics.map(topic => ({
            title: topic.title,
            created_at: topic.created_at,
            url: `https://linux.do/t/${topic.id}`,
            poster: data.users.find(user =>
                user.id === topic.posters[0]?.user_id
            )?.name || '某位佬友'
        }))
    }, null, 2);
}

function formatNotificationResponse(data: LinuxDoNotificationResponse) {
    return JSON.stringify({
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
    }, null, 2);
}

function formatBookmarkResponse(data: LinuxDoBookmarkResponse) {
    return JSON.stringify({
        bookmarks: data.bookmarks.map(bookmark => ({
            title: bookmark.topic_title,
            created_at: bookmark.created_at,
            url: bookmark.bookmarkable_url,
            username: bookmark.user?.username || '某位佬友'
        }))
    }, null, 2);
}

function formatPrivateMessageResponse(data: any) {
    return JSON.stringify({
        messages: data.topic_list.topics.map((topic: any) => ({
            title: topic.title,
            created_at: topic.created_at,
            url: `https://linux.do/t/${topic.id}`,
            last_poster: data.users.find((user: any) =>
                user.id === topic.posters[0]?.user_id
            )?.name || '某位佬友'
        }))
    }, null, 2);
}

// Common fetch function
async function fetchLinuxDoApi(endpoint: string, params: Record<string, any> = {}, requiresAuth: boolean = false): Promise<any> {
    const url = new URL(`https://linux.do/${endpoint}`);

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

// Initialize FastMCP server
const server = new FastMCP({
    name: "pleasure1234/linux-do-mcp",
    version: "1.0.8",
});

// Define API tools
server.addTool({
    name: "latest_topic",
    description: "获取Linux.do有新帖子的话题",
    parameters: z.object({
        page: z.number().optional().describe("页码，默认为1"),
        per_page: z.number().optional().describe("每页条数，默认为10"),
    }),
    execute: async (args) => {
        return await handleTopicEndpoint('latest', args);
    },
});

server.addTool({
    name: "top_topic",
    description: "获取Linux.do过去一年一月一周一天中最活跃的话题",
    parameters: z.object({
        period: z.enum(["daily", "weekly", "monthly", "quarterly", "yearly", "all"]).describe("时间周期：每日/每周/每月/每季度/每年/全部"),
        page: z.number().optional().describe("页码，默认为1"),
        per_page: z.number().optional().describe("每页条数，默认为10"),
    }),
    execute: async (args) => {
        return await handleTopicEndpoint('top', args);
    },
});

server.addTool({
    name: "hot_topic",
    description: "获取Linux.do最近热门话题",
    parameters: z.object({
        page: z.number().optional().describe("页码，默认为1"),
        per_page: z.number().optional().describe("每页条数，默认为10"),
    }),
    execute: async (args) => {
        return await handleTopicEndpoint('hot', args);
    },
});

server.addTool({
    name: "category_topic",
    description: "获取Linux.do特定分类下的话题",
    parameters: z.object({
        category: z.enum([
            "Development", "Resources", "Documentation", "Flea Market",
            "Job Market", "Book Club", "Set Sail", "News Flash",
            "Web Archive", "Benefits", "Off-Topic", "Feedback"
        ]).describe("话题分类名称"),
        page: z.number().optional().describe("页码，默认为1"),
        per_page: z.number().optional().describe("每页条数，默认为10"),
    }),
    execute: async (args) => {
        const categoryId = CATEGORY_MAP[args.category as keyof typeof CATEGORY_MAP];
        const data = await fetchLinuxDoApi('categories_and_latest', {
            page: args.page || 1,
            per_page: args.per_page || 50
        }) as LinuxDoCategoryResponse;

        return formatCategoryTopicResponse(data, categoryId);
    },
});

server.addTool({
    name: "new_topic",
    description: "获取Linux.do最近几天创建的话题",
    parameters: z.object({
        page: z.number().optional().describe("页码，默认为1"),
        per_page: z.number().optional().describe("每页条数，默认为10"),
    }),
    execute: async (args) => {
        return await handleTopicEndpoint('new', args, true);
    },
});

server.addTool({
    name: "unread_topic",
    description: "获取Linux.do您当前正在关注或追踪，具有未读帖子的话题",
    parameters: z.object({
        page: z.number().optional().describe("页码，默认为1"),
        per_page: z.number().optional().describe("每页条数，默认为10"),
    }),
    execute: async (args) => {
        return await handleTopicEndpoint('unread', args, true);
    },
});

server.addTool({
    name: "unseen_topic",
    description: "获取Linux.do新话题和您当前正在关注或追踪，具有未读帖子的话题",
    parameters: z.object({
        page: z.number().optional().describe("页码，默认为1"),
        per_page: z.number().optional().describe("每页条数，默认为10"),
    }),
    execute: async (args) => {
        return await handleTopicEndpoint('unseen', args, true);
    },
});

server.addTool({
    name: "post_topic",
    description: "获取Linux.do您发过帖子的话题",
    parameters: z.object({
        page: z.number().optional().describe("页码，默认为1"),
        per_page: z.number().optional().describe("每页条数，默认为10"),
    }),
    execute: async (args) => {
        return await handleTopicEndpoint('posted', args, true);
    },
});

server.addTool({
    name: "topic_search",
    description: "搜索Linux.do论坛上的话题",
    parameters: z.object({
        term: z.string().describe("搜索关键词"),
    }),
    execute: async (args) => {
        const apiParams = {
            term: args.term,
        };

        const data = await fetchLinuxDoApi('search/query.json', apiParams) as LinuxDoSearchResponse;
        return formatSearchResponse(data);
    },
});

server.addTool({
    name: "new_notification",
    description: "获取Linux.do您最近的未读通知",
    parameters: z.object({
        limit: z.number().optional().describe("获取的通知数量，默认为10"),
        read: z.boolean().optional().describe("是否已读，默认为false"),
        filter_by_types: z.array(z.string()).optional().describe("过滤通知类型，默认为所有类型"),
    }),
    execute: async (args) => {
        const apiParams: Record<string, any> = {
            limit: args.limit || 10,
            recent: "true",
            bump_last_seen_reviewable: "true"
        };

        if (args.filter_by_types && args.filter_by_types.length > 0) {
            const mappedTypes = args.filter_by_types
                .flatMap(type => NOTIFICATION_MAP[type as keyof typeof NOTIFICATION_MAP]?.split(",") || []);
            if (mappedTypes.length > 0) {
                apiParams.filter_by_types = mappedTypes.join(",");
                apiParams.silent = "true";
            }
        }

        const data = await fetchLinuxDoApi('notifications.json', apiParams, true) as LinuxDoNotificationResponse;
        return formatNotificationResponse(data);
    },
});

server.addTool({
    name: "my_bookmark",
    description: "获取Linux.do您收藏的帖子",
    parameters: z.object({}),
    execute: async () => {
        const data = await fetchLinuxDoApi(`u/${LINUX_DO_USERNAME}/user-menu-bookmarks.json`, {}, true) as LinuxDoBookmarkResponse;
        return formatBookmarkResponse(data);
    },
});

server.addTool({
    name: "my_private_message",
    description: "获取Linux.do您收到的私信",
    parameters: z.object({}),
    execute: async () => {
        const data = await fetchLinuxDoApi(`topics/private-messages/${LINUX_DO_USERNAME}.json`, {}, true);
        return formatPrivateMessageResponse(data);
    },
});

// Start the server with SSE transport
server.start({
    transportType: "sse",
    sse: {
        endpoint: "/sse",
        port: 8080,
    },
});

console.log("Linux Do MCP Server running on http://localhost:8080/sse");