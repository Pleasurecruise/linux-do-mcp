# Linux Do MCP Server

中文 / [English](README.md)

![LINUX DO](img/logo.png)

Where possible begin!

## API List

| 功能描述                          | API路径                                                                 |
|-----------------------------------|------------------------------------------------------------------------|
| **不需要鉴权**                   |                                                                        |
| 有新帖子的话题                   | https://linux.do/latest.json                                           |
| 过去一年、一个月、一周或一天中最活跃的话题 | https://linux.do/top.json                                              |
| 最近热门话题                     | https://linux.do/hot.json                                              |
| **需要鉴权**                     |                                                                        |
| 最近几天创建的话题               | https://linux.do/new.json                                              |
| 具有未读帖子的话题（关注或追踪） | https://linux.do/unread.json                                           |
| 新话题和未读帖子（关注或追踪）   | https://linux.do/unseen.json                                           |
| 您发过帖子的话题                 | https://linux.do/posted.json                                           |
| 消息通知                         | https://linux.do/notifications.json                                    |
| 话题搜索                         | https://linux.do/search/query.json                                    |
| 书签                             | https://linux.do/u/${your-username}/user-menu-bookmarks                |
| 私信                             | https://linux.do/u/${your-username}/user-menu-private-messages         |

## 工具列表

1. 有新帖子的话题
2. 过去一年、一个月、一周或一天中最活跃的话题
3. 最近热门话题
4. 最近几天创建的话题
5. 具有未读帖子的话题（关注或追踪）
6. 新话题和未读帖子（关注或追踪）
7. 您发过帖子的话题
8. 消息通知
9. 话题搜索
10. 您的书签
11. 您的私信

## 话题列表

| 版块名称     | 描述                                                                 | Id |
|--------------|----------------------------------------------------------------------|------|
| 开发调优     | 此版块包含开发、测试、调试、部署、优化、安全等方面的内容             | 4    |
| 资源荟萃     | 包括软件分享、开源仓库、视频课程、书籍等分享                         | 14   |
| 文档共建     | 佬友化身翰林学士，一起来编书                                         | 42   |
| 跳蚤市场     | 交易相关的版块，包含实体和虚拟物品供求、拼车等等                     | 10   |
| 非我莫属     | 学成文武艺，货与帝王家。招聘/求职分类，只能发此类信息                | 27   |
| 读书成诗     | 跟着佬友们一起在论坛读完一本书是什么体验？                           | 32   |
| 扬帆起航     | 扬帆起航，目标是星辰大海！                                           | 46   |
| 前沿快讯     | 前沿快讯，不出门能知天下事。                                         | 34   |
| 网络记忆     | 网络是有记忆的，确信！                                               | 92   |
| 福利羊毛     | 正经人谁花那个钱啊～ 此版块供羊毛、抽奖等福利使用。                  | 36   |
| 搞七捻三     | 闲聊吹水的板块。不得讨论政治、色情等违规内容。                       | 11   |
| 运营反馈     | 有关此站点、其组织、运作方式以及如何改进的讨论。                     | 2    |

## 如何安装

用python运行[这个](src/get-pat.py)文件获得API_KEY

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

## 参考项目

- [Baidu Map Mcp](https://github.com/baidu-maps/mcp)

- [Discourse docs](https://docs.discourse.org)

- [PAT Generate Script](https://linux.do/t/topic/31549)

## 版权声明

- Logo 和社区内容 © [Linux DO 社区](https://linux.do)

- PAT 生成脚本 © [此作者](https://linux.do/t/topic/31549)

- 项目代码 © [Pleasurecruise](https://github.com/Pleasurecruise)

本项目基于 [MIT 许可证](LICENSE) 授权。

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=Pleasurecruise/linux-do-mcp&type=Date)](https://www.star-history.com/#Pleasurecruise/linux-do-mcp&Date)