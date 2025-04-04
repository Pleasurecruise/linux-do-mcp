# Linux Do MCP Server

[中文](README_zh.md) / English

![LINUX DO](img/logo.png)

Where possible begin!

## API List

| Description                      | API Endpoint                                                                 |
|----------------------------------|------------------------------------------------------------------------------|
| **Without Authentication**       |                                                                              |
| Topics with new posts            | https://linux.do/latest.json                                                 |
| Most active topics (past year/month/week/day) | https://linux.do/top.json                                             |
| Recently popular topics          | https://linux.do/hot.json                                                   |
| **With Authentication**          |                                                                              |
| Recently created topics          | https://linux.do/new.json                                                   |
| Topics with unread posts (tracked/followed) | https://linux.do/unread.json                                          |
| New topics and unread posts (tracked/followed) | https://linux.do/unseen.json                                          |
| Topics you posted in             | https://linux.do/posted.json                                                |
| Notifications                    | https://linux.do/notifications.json                                         |
| Topic Search                    | https://linux.do/search/query.json                                         |
| Bookmarks                        | https://linux.do/u/${your-username}/user-menu-bookmarks                     |
| Private messages                 | https://linux.do/u/${your-username}/user-menu-private-messages              |

### Tools List

1. Topics with new posts
2. Most active topics (past year/month/week/day)
3. Recently popular topics
4. Recently created topics
5. Topics with unread posts (tracked/followed)
6. New topics and unread posts (tracked/followed)
7. Topics you posted in
8. Notifications
9. Topic Search
10. Bookmarks
11. Private messages

## Category List

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

## How to install

use python run [this](src/get-pat.py) file to get your API_KEY

### Node

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

### Python

```python
{
  "mcpServers": {
    "linux-do": {
      "command": "uvx",
      "args": [
        "-y",
        "linux-do-mcp"
      ],
      "env": {
        "LINUX_DO_API_KEY": "your-api-key-here"
        "LINUX_DO_USERNAME": "your-username"
      }
    }
  }
}
```

## Reference

- [Baidu Map Mcp](https://github.com/baidu-maps/mcp)

- [Discourse docs](https://docs.discourse.org)

- [PAT Generate Script](https://linux.do/t/topic/31549)

## Copyright

- Logo and community content © [Linux DO Community](https://linux.do)

- PAT generation script © [this author](https://linux.do/t/topic/31549)

- Project code © [Pleasurecruise](https://github.com/Pleasurecruise)

This project is licensed under the [MIT License](LICENSE).

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=Pleasurecruise/linux-do-mcp&type=Date)](https://www.star-history.com/#Pleasurecruise/linux-do-mcp&Date)