"""Tests for the assembled server: tools, per-user credentials, HTTP auth."""

import asyncio
import importlib
import os
import unittest
from unittest.mock import MagicMock, patch

from starlette.testclient import TestClient

from analytics_mcp.tools import client

_OAUTH_ENV = {
    "GA_MCP_OAUTH_CLIENT_ID": "id",
    "GA_MCP_OAUTH_CLIENT_SECRET": "secret",
    "GA_MCP_BASE_URL": "https://mcp-ga.example.com",
    "GA_MCP_STORAGE_TYPE": "memory",
    "GA_MCP_STORAGE_DISABLE_ENCRYPTION": "true",
    "ALLOWED_EMAILS": "team@example.com",
}


class TestCredentials(unittest.TestCase):
    def test_signed_in_user_token_is_used(self):
        token = MagicMock(token="user-access-token")
        with patch(
            "fastmcp.server.dependencies.get_access_token", return_value=token
        ), patch("google.auth.default") as adc:
            creds = client._get_credentials()
        self.assertEqual(creds.token, "user-access-token")
        adc.assert_not_called()

    def test_adc_fallback_without_token(self):
        with patch(
            "fastmcp.server.dependencies.get_access_token", return_value=None
        ), patch("google.auth.default", return_value=("adc", "p")) as adc:
            self.assertEqual(client._get_credentials(), "adc")
        scopes = adc.call_args.kwargs["scopes"]
        self.assertNotIn(
            "https://www.googleapis.com/auth/analytics.manage.users", scopes
        )


class TestServer(unittest.TestCase):
    def setUp(self):
        patcher = patch.dict(os.environ, _OAUTH_ENV)
        patcher.start()
        self.addCleanup(patcher.stop)
        import analytics_mcp.coordinator as coordinator

        self.addCleanup(lambda: importlib.reload(coordinator))
        self.coordinator = importlib.reload(coordinator)

    def test_tools_are_mounted_with_correct_annotations(self):
        tools = {
            t.name: t
            for t in asyncio.run(
                self.coordinator.mcp.local_provider.list_tools()
            )
        }
        reads = {
            "get_account_summaries",
            "get_property_details",
            "run_report",
            "run_realtime_report",
            "run_funnel_report",
            "run_conversions_report",
        }
        writes = {
            "create_property_annotation",
            "create_key_event",
            "create_custom_dimension",
            "create_custom_metric",
            "create_audience",
            "update_data_retention_settings",
        }
        self.assertTrue(reads | writes <= set(tools))
        for name in reads:
            self.assertTrue(tools[name].annotations.readOnlyHint, name)
        for name in writes:
            self.assertFalse(tools[name].annotations.readOnlyHint, name)

    def test_manage_users_scope_never_requested(self):
        self.assertFalse(
            any("manage.users" in s for s in self.coordinator.REQUIRED_SCOPES)
        )
        self.assertIn(
            "https://www.googleapis.com/auth/analytics.edit",
            self.coordinator.REQUIRED_SCOPES,
        )

    def test_http_unauthenticated_401_and_health_open(self):
        import analytics_mcp.health  # noqa: F401  (registers /health)

        with TestClient(self.coordinator.mcp.http_app()) as http:
            resp = http.post(
                "/mcp",
                json={"jsonrpc": "2.0", "id": 1, "method": "tools/list"},
                headers={"Accept": "application/json, text/event-stream"},
            )
            self.assertEqual(resp.status_code, 401)
            self.assertEqual(http.get("/health").json(), {"status": "ok"})


if __name__ == "__main__":
    unittest.main()
