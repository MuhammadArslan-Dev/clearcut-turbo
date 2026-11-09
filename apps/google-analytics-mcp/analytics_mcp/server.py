"""Entry point for the Google Analytics MCP server (remote, Streamable HTTP)."""

import os

from analytics_mcp import health  # noqa: F401  (registers /health)
from analytics_mcp.coordinator import mcp


def run_server() -> None:
    port = int(os.environ.get("PORT", "8080"))
    if os.environ.get("GA_MCP_OAUTH_CLIENT_ID") and os.environ.get(
        "GA_MCP_OAUTH_CLIENT_SECRET"
    ):
        mcp.run(
            transport="streamable-http",
            port=port,
            host="0.0.0.0",
            uvicorn_config={"access_log": False},
        )
    else:
        # Local development with Application Default Credentials.
        mcp.run()


if __name__ == "__main__":
    run_server()
