import os
import json
import httpx
from asyncio import sleep
from typing import Dict, List, Optional, Any, Union, Literal
from mcp.server.fastmcp import FastMCP, Context

# Create MCP server instance
mcp = FastMCP("linux-do-mcp")
# Get API credentials from environment variables
username = os.getenv('LINUX_DO_USERNAME')
api_key = os.getenv('LINUX_DO_API_KEY')

# Maps for category and notification types
CATEGORY_MAP = {
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
}

NOTIFICATION_TYPE_MAP = {
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

NOTIFICATION_MAP = {
    "reply": "mentioned,group_mentioned,posted,quoted,replied",
    "like": "liked,liked_consolidated,reaction",
    "other": "edited,invited_to_private_message,invitee_accepted,moved_post,linked,granted_badge,invited_to_topic,custom,watching_first_post,topic_reminder,post_approved,code_review_commit_approved,membership_request_accepted,membership_request_consolidated,votes_released,event_reminder,event_invitation,chat_group_mention,assigned,question_answer_user_commented,watching_category_or_tag,new_features,admin_problems,linked_consolidated,following,following_created_topic,following_replied,circles_activity"
}

# Helper functions to format responses
def format_topic_response(data: Dict) -> Dict:
    """Format the topic list response"""
    try:
        topics = [{
            "title": topic["title"],
            "created_at": topic["created_at"],
            "url": f"https://linux.do/t/{topic['id']}",
            "poster": next((user["username"] for user in data["users"]
                           if user["id"] == topic["posters"][0]["user_id"]), "某位佬友")
        } for topic in data["topic_list"]["topics"]]

        return {
            "topics": topics
        }
    except Exception as e:
        return {"error": str(e)}

def format_search_response(data: Dict) -> Dict:
    """Format the search results response"""
    try:
        topics = [{
            "title": topic["fancy_title"],
            "created_at": topic["created_at"],
            "url": f"https://linux.do/t/{topic['id']}",
        } for topic in data["topics"]]
        posts = [{
            "username": post["username"],
            "created_at": post["created_at"],
            "like_count": post["like_count"],
            "url": f"https://linux.do/t/{post['topic_id']}"
        } for post in data["posts"]]

        return {
            "topics": topics,
            "posts": posts
        }
    except Exception as e:
        return {"error": str(e)}

def format_category_topic_response(data: Dict, category_id: int) -> Dict:
    """Format the category topics response"""
    try:
        filtered_topics = [
            topic for topic in data["topic_list"]["topics"]
            if topic.get("category_id") == category_id
        ][:5]

        category_name = next((category["name"] for category in data["category_list"]["categories"]
                             if category["id"] == category_id), "未知分类")

        topics = [{
            "title": topic["title"],
            "created_at": topic["created_at"],
            "url": f"https://linux.do/t/{topic['id']}",
            "poster": next((user["name"] for user in data["users"]
                           if user["id"] == topic["posters"][0]["user_id"]), "某位佬友")
        } for topic in filtered_topics]

        return {
            "category": category_name,
            "topics": topics
        }
    except Exception as e:
        return {"error": str(e)}

def format_notification_response(data: Dict) -> Dict:
    """Format the notifications response"""
    try:
        formatted_notifications = []

        for notification in data["notifications"]:
            notification_type = next(
                (key for key, value in NOTIFICATION_TYPE_MAP.items()
                 if value == notification["notification_type"]), "unknown"
            )

            username = notification["data"].get("display_username", "") or notification.get("acting_user_name", "")
            title = notification.get("fancy_title", "") or notification["data"].get("topic_title", "")
            message = notification["data"].get("message", "")

            # Handle specific notification types
            if "个回复" in username:
                message = username
                username = "系统通知"

            if (notification["notification_type"] == NOTIFICATION_TYPE_MAP["granted_badge"] and
                    notification["data"].get("badge_name")):
                message = f"获得了 \"{notification['data']['badge_name']}\" 徽章"

            formatted_notifications.append({
                "username": username,
                "title": title,
                "notification_type": notification_type,
                "message": message,
                "created_at": notification["created_at"],
                "read": notification["read"]
            })

        return {
            "notifications": formatted_notifications
        }
    except Exception as e:
        return {"error": str(e)}

def format_bookmark_response(data: Dict) -> Dict:
    """Format the bookmarks response"""
    try:
        bookmarks = [{
            "title": bookmark.get("fancy_title"),
            "created_at": bookmark["created_at"],
            "url": bookmark["bookmarkable_url"],
            "username": bookmark.get("user", {}).get("username", "某位佬友")
        } for bookmark in data["bookmarks"]]

        return {
            "bookmarks": bookmarks
        }
    except Exception as e:
        return {"error": str(e)}

def format_private_message_response(data: Dict) -> Dict:
    """Format the private messages response"""
    try:
        messages = [{
            "title": topic["title"],
            "created_at": topic["created_at"],
            "url": f"https://linux.do/t/{topic['id']}",
            "last_poster": next((user["name"] for user in data["users"]
                                if user["id"] == topic["posters"][0]["user_id"]), "某位佬友")
        } for topic in data["topic_list"]["topics"]]

        return {
            "messages": messages
        }
    except Exception as e:
        return {"error": str(e)}

# Error helper function
def create_error_response(error_message: str) -> Dict:
    """Creates a standardized error response"""
    return {
        "error": error_message
    }

# Validate authentication credentials
async def validate_auth() -> bool:
    """Validates the Linux.do API key and username"""
    try:
        url = f"https://linux.do/u/{username}.json"
        headers = {
            "User-Api-Key": api_key,
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Referer": "https://linux.do",
            "Content-Type": "application/json"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers)
            return response.status_code == 200
    except Exception as e:
        print(f"Error validating authentication: {str(e)}")
        return False

# API request helper function
async def fetch_linux_do_api(endpoint: str, params: Dict = None, requires_auth: bool = False) -> Dict:
    """Helper function to fetch data from Linux.do API"""
    try:
        if params is None:
            params = {}

        url = f"https://linux.do/{endpoint}"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Referer": "https://linux.do",
            "Content-Type": "application/json"
        }
        
        if requires_auth:
            # Validate authentication before proceeding with authenticated requests
            is_auth_valid = await validate_auth()
            if not is_auth_valid:
                raise Exception("Authentication failed: Invalid API key or username. Please check your LINUX_DO_API_KEY and LINUX_DO_USERNAME environment variables.")
            
            headers["User-Api-Key"] = api_key

        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params, headers=headers)
            response.raise_for_status()

            return response.json()
    except httpx.HTTPError as e:
        raise Exception(f"HTTP request failed: {str(e)}") from e
    except json.JSONDecodeError as e:
        raise Exception(f"Failed to decode JSON: {str(e)}") from e
    except Exception as e:
        raise Exception(f"API request failed: {str(e)}") from e

# Generic topic handler
async def handle_topic_endpoint(endpoint: str, params: Dict = None, requires_auth: bool = False) -> Dict:
    """Generic handler for topic-related endpoints"""
    try:
        if params is None:
            params = {}

        period = params.get("period", "")
        api_path = f"{endpoint}/{period}.json" if period else f"{endpoint}.json"

        api_params = {
            "page": params.get("page", 1),
            "per_page": params.get("per_page", 10)
        }

        data = await fetch_linux_do_api(api_path, api_params, requires_auth)
        return format_topic_response(data)
    except Exception as e:
        return create_error_response(str(e))

# Tool implementations
@mcp.tool()
async def latest_topic(
    page: int = 1,
    per_page: int = 10
) -> Dict:
    """
    Name:
        获取Linux.do有新帖子的话题

    Description:
        获取Linux.do论坛中新帖子的话题列表

    Args:
        page: 页码，默认为1
        per_page: 每页条数，默认为10
    """
    return await handle_topic_endpoint("latest", {"page": page, "per_page": per_page})

@mcp.tool()
async def top_topic(
    period: Optional[Literal["daily", "weekly", "monthly", "quarterly", "yearly", "all"]] = None,
    page: int = 1,
    per_page: int = 10
) -> Dict:
    """
    Name:
        获取Linux.do过去一年一月一周一天中最活跃的话题

    Description:
        获取Linux.do论坛中在指定时间周期内最活跃的话题列表

    Args:
        period: 时间周期：每日/每周/每月/每季度/每年/全部，可选
        page: 页码，默认为1
        per_page: 每页条数，默认为10
    """
    return await handle_topic_endpoint("top", {"period": period, "page": page, "per_page": per_page})

@mcp.tool()
async def hot_topic(
    page: int = 1,
    per_page: int = 10
) -> Dict:
    """
    Name:
        获取Linux.do最近热门话题

    Description:
        获取Linux.do论坛中最近的热门话题列表

    Args:
        page: 页码，默认为1
        per_page: 每页条数，默认为10
    """
    return await handle_topic_endpoint("hot", {"page": page, "per_page": per_page})

@mcp.tool()
async def category_topic(
    category: Optional[Literal["Development", "Resources", "Documentation", "Flea Market",
                     "Job Market", "Book Club", "Set Sail", "News Flash",
                     "Web Archive", "Benefits", "Off-Topic", "Feedback"]] = None,
    page: int = 1,
    per_page: int = 10
) -> Dict:
    """
    Name:
        获取Linux.do特定分类下的话题

    Description:
        获取Linux.do论坛中特定分类下的话题列表。如果未指定分类，则返回所有分类的话题。

    Args:
        category: 话题分类名称，可选
        page: 页码，默认为1
        per_page: 每页条数，默认为10
    """
    try:
        category_id = CATEGORY_MAP.get(category) if category else None

        api_params = {
            "page": page,
            "per_page": 50  # Request more to ensure we have enough after filtering
        }

        data = await fetch_linux_do_api("categories_and_latest", api_params)

        if category_id:
            return format_category_topic_response(data, category_id)
        else:
            # If no category is specified, return all topics
            return format_topic_response(data)
    except Exception as e:
        return create_error_response(str(e))

@mcp.tool()
async def new_topic(
    page: int = 1,
    per_page: int = 10
) -> Dict:
    """
    Name:
        获取Linux.do最近几天创建的话题

    Description:
        获取Linux.do论坛中最近几天新创建的话题列表

    Args:
        page: 页码，默认为1
        per_page: 每页条数，默认为10
    """
    return await handle_topic_endpoint("new", {"page": page, "per_page": per_page}, True)

@mcp.tool()
async def unread_topic(
    page: int = 1,
    per_page: int = 10
) -> Dict:
    """
    Name:
        获取Linux.do您当前正在关注或追踪，具有未读帖子的话题

    Description:
        获取Linux.do论坛中您当前正在关注或追踪，具有未读帖子的话题列表

    Args:
        page: 页码，默认为1
        per_page: 每页条数，默认为10
    """
    return await handle_topic_endpoint("unread", {"page": page, "per_page": per_page}, True)

@mcp.tool()
async def unseen_topic(
    page: int = 1,
    per_page: int = 10
) -> Dict:
    """
    Name:
        获取Linux.do新话题和您当前正在关注或追踪，具有未读帖子的话题

    Description:
        获取Linux.do论坛中新话题和您当前正在关注或追踪，具有未读帖子的话题列表

    Args:
        page: 页码，默认为1
        per_page: 每页条数，默认为10
    """
    return await handle_topic_endpoint("unseen", {"page": page, "per_page": per_page}, True)

@mcp.tool()
async def post_topic(
    page: int = 1,
    per_page: int = 10
) -> Dict:
    """
    Name:
        获取Linux.do您发过帖子的话题

    Description:
        获取Linux.do论坛中您发过帖子的话题列表

    Args:
        page: 页码，默认为1
        per_page: 每页条数，默认为10
    """
    return await handle_topic_endpoint("posted", {"page": page, "per_page": per_page}, True)

@mcp.tool()
async def topic_search(
    term: str
) -> Dict:
    """
    Name:
        搜索Linux.do论坛上的话题

    Description:
        在Linux.do论坛上搜索与关键词相关的话题

    Args:
        term: 搜索关键词
    """
    try:
        if not term:
            return create_error_response("Search term is required")

        api_params = {"term": term}
        data = await fetch_linux_do_api("search/query.json", api_params)
        return format_search_response(data)
    except Exception as e:
        return create_error_response(str(e))

@mcp.tool()
async def new_notification(
    limit: int = 10,
    read: bool = False,
    filter_by_types: List[Literal["reply", "like", "other"]] = None
) -> Dict:
    """
    Name:
        获取Linux.do您最近的未读通知

    Description:
        获取Linux.do论坛中您最近的未读通知列表

    Args:
        limit: 获取的通知数量，默认为10
        read: 是否已读，默认为false
        filter_by_types: 过滤通知类型，默认为所有类型
    """
    try:
        api_params = {
            "limit": limit,
            "recent": "true",
            "bump_last_seen_reviewable": "true"
        }

        if filter_by_types:
            mapped_types = []
            for filter_type in filter_by_types:
                if filter_type in NOTIFICATION_MAP:
                    mapped_types.extend(NOTIFICATION_MAP[filter_type].split(","))

            if mapped_types:
                api_params["filter_by_types"] = ",".join(mapped_types)
                api_params["silent"] = "true"

        data = await fetch_linux_do_api("notifications.json", api_params, True)
        return format_notification_response(data)
    except Exception as e:
        return create_error_response(str(e))

@mcp.tool()
async def my_bookmark(
    ctx: Context
) -> Dict:
    """
    Name:
        获取Linux.do您收藏的帖子

    Description:
        获取Linux.do论坛中您收藏的帖子列表
    """
    try:
        data = await fetch_linux_do_api(f"u/{username}/user-menu-bookmarks.json", {}, True)
        return format_bookmark_response(data)
    except Exception as e:
        return create_error_response(str(e))

@mcp.tool()
async def my_private_message(
    ctx: Context
) -> Dict:
    """
    Name:
        获取Linux.do您收到的私信

    Description:
        获取Linux.do论坛中您收到的私信列表
    """
    try:
        data = await fetch_linux_do_api(f"topics/private-messages/{username}.json", {}, True)
        return format_private_message_response(data)
    except Exception as e:
        return create_error_response(str(e))

if __name__ == "__main__":
    mcp.run()