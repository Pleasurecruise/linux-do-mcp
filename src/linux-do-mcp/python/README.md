## How to run locally?

I use the command `uv init linux-do-mcp` under the root path `src/linux-do-mcp/python`

If you want to run this MCP Server locally, you can follow the step bellow:

cd to `src/linux-do-mcp/python`, and install the dependency

```
uv venv
.venv\Scripts\activate
uv add "mcp[cli]" httpx
pip install .
```

run the following command to test in dev env

```
mcp dev src/linux_do_mcp/main.py
```

run the following command to pack the package

```
uv run -- hatchling build
uv run -- twine upload dist/*
```