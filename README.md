## Linux Do MCP Server

Where possible begin!

### API list

Topics with new posts: https://linux.do/latest.json

The most active topics in the past year, month, week, or day: https://linux.do/top.json

Recent hot topics: https://linux.do/hot.json

#### Needs Authorization (Help Wanted)

Topics created in recent days: https://linux.do/new.json

You are currently following or tracking topics with unread posts: https://linux.do/unread.json

New topics and topics you are currently following or tracking with unread posts: https://linux.do/unseen.json

Topic you posted: https://linux.do/posted.json

### How to install

⚠️ **Attention**:

Since it is temporarily unknown whether there is a user-authenticated API key, this space is reserved in advance. 

When configuring environment variables, fill in any value but do not omit it.

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

### Star History

[![Star History Chart](https://api.star-history.com/svg?repos=Pleasurecruise/linux-do-mcp&type=Date)](https://www.star-history.com/#Pleasurecruise/linux-do-mcp&Date)