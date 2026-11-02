FROM python:3.11-slim

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app
COPY . .
RUN uv pip install --system .

# Behind Coolify's proxy; the server listens on 8080 (Streamable HTTP at /mcp).
EXPOSE 8080
CMD ["analytics-mcp"]
