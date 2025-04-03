## Linux Do MCP Server

[中文](README_zh.md) / English

Where possible begin!

### API list

#### No authentication is required

If you do not have or cannot generate a PAT (Personal Access Token), you can only use the following features:

Topics with new posts: https://linux.do/latest.json

The most active topics in the past year, month, week, or day: https://linux.do/top.json

Recent hot topics: https://linux.do/hot.json

#### Authorization is required

Please click [here](https://linux.do/t/topic/31549) to learn how to generate your PAT.

Topics created in recent days: https://linux.do/new.json

You are currently following or tracking topics with unread posts: https://linux.do/unread.json

New topics and topics you are currently following or tracking with unread posts: https://linux.do/unseen.json

Topic you posted: https://linux.do/posted.json

Your Notification：https://linux.do/notifications.json

Your Bookmark：https://linux.do/u/${your-username}/user-menu-bookmarks

Your Private Message：https://linux.do/u/${your-username}/user-menu-private-messages

### Category List

| Category Name | Description                                                                 | Id |
|---------------|-----------------------------------------------------------------------------|-------|
| Development   | Includes content on development, testing, debugging, deployment, optimization, security, etc. | 4     |
| Resources     | Shares software, open-source repositories, video courses, books, etc.      | 14    |
| Documentation | Friends become academicians, let's compile books together                  | 42    |
| Flea Market   | Trading-related section, including physical/virtual goods supply/demand, carpooling, etc. | 10    |
| Job Market    | "Master skills to serve the emperor." Dedicated to job postings/hunting only. | 27    |
| Book Club     | What's it like to finish a book with forum friends?                        | 32    |
| Set Sail      | Set sail with the stars as our destination!                                | 46    |
| News Flash    | Stay informed about the world without leaving home.                        | 34    |
| Web Archive   | The internet never forgets - this is certain!                              | 92    |
| Benefits      | "Who pays full price these days?" For sharing deals/giveaways.             | 36    |
| Off-Topic     | Casual chat section. No politics/NSFW content allowed.                     | 11    |
| Feedback      | Discussions about this site, its organization, operations, and improvements. | 2     |

### How to install

#### Node

```json
{
  "mcpServers": {
    "linux-do": {
      "command": "npx",
      "args": [
        "-y",
        "@pleasure1234/linux-do-mcp"
      ],
      "env": {
        "LINUX_DO_API_KEY": "your-api-key-here"
        "LINUX_DO_USERNAME": "your-username"
      }
    }
  }
}
```

#### Python

```python
To be continued
```

### Reference

- [Baidu Map Mcp](https://github.com/baidu-maps/mcp)

- [PAT Generate Script](https://linux.do/t/topic/31549)

### Star History

[![Star History Chart](https://api.star-history.com/svg?repos=Pleasurecruise/linux-do-mcp&type=Date)](https://www.star-history.com/#Pleasurecruise/linux-do-mcp&Date)