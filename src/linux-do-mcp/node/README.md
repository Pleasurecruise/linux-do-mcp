## How to run locally?

If you want to run this MCP Server locally, you can follow the step bellow:

```
npm install
```

cd to `src/linux-do-mcp/node`, and run the following command to test in dev env

```
npx @modelcontextprotocol/inspector node dist/index.js
```

run the following command to pack the package

```
npm run build
npm login // need to log in on https://registry.npmjs.org/
npm publish --access public
```