"""Unauthenticated liveness route for Docker/Coolify health checks."""

from starlette.requests import Request
from starlette.responses import JSONResponse

from ads_mcp.coordinator import mcp


@mcp.custom_route("/health", methods=["GET"])
async def health(_: Request) -> JSONResponse:
    return JSONResponse({"status": "ok"})
