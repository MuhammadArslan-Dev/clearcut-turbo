"""Tests for the team allowlist."""

import asyncio
import os
import unittest
from unittest.mock import AsyncMock, MagicMock, patch

from fastmcp.exceptions import AuthorizationError

from analytics_mcp.allowlist import TeamOnlyMiddleware, is_allowed, parse_allowlist


class TestAllowlist(unittest.TestCase):
    def test_parse(self):
        emails, domains = parse_allowlist(" A@x.com, @Corp.in  b@y.com ")
        self.assertEqual(emails, {"a@x.com", "b@y.com"})
        self.assertEqual(domains, {"corp.in"})

    def test_is_allowed(self):
        e, d = parse_allowlist("a@x.com @corp.in")
        self.assertTrue(is_allowed("A@x.com", True, e, d))
        self.assertTrue(is_allowed("z@corp.in", True, e, d))
        self.assertFalse(is_allowed("z@evil.com", True, e, d))
        self.assertFalse(is_allowed("z@corp.in.evil.com", True, e, d))
        self.assertFalse(is_allowed("z@corp.in", False, e, d))  # unverified
        self.assertFalse(is_allowed("z@corp.in", None, e, d))
        self.assertFalse(is_allowed(None, True, e, d))

    def _run(self, claims):
        mw = TeamOnlyMiddleware({"a@x.com"}, set())
        nxt = AsyncMock(return_value="ok")
        token = MagicMock(claims=claims) if claims is not None else None
        with patch("analytics_mcp.allowlist.get_access_token", return_value=token):
            return asyncio.run(mw.on_message(MagicMock(), nxt)), nxt

    def test_middleware_allows_team(self):
        out, nxt = self._run({"email": "a@x.com", "email_verified": True})
        self.assertEqual(out, "ok")
        nxt.assert_awaited_once()

    def test_middleware_blocks_outsider_and_anonymous(self):
        for claims in ({"email": "b@x.com", "email_verified": True}, None):
            with self.assertRaises(AuthorizationError):
                self._run(claims)


class TestCoordinatorFailsClosed(unittest.TestCase):
    def test_oauth_without_allowlist_refuses_to_start(self):
        import importlib

        import analytics_mcp.coordinator as coordinator

        env = {
            "GA_MCP_OAUTH_CLIENT_ID": "id",
            "GA_MCP_OAUTH_CLIENT_SECRET": "secret",
            "GA_MCP_STORAGE_TYPE": "memory",
            "GA_MCP_STORAGE_DISABLE_ENCRYPTION": "true",
        }
        try:
            with patch.dict(os.environ, env, clear=False):
                os.environ.pop("ALLOWED_EMAILS", None)
                with self.assertRaises(RuntimeError):
                    importlib.reload(coordinator)
                os.environ["ALLOWED_EMAILS"] = "a@x.com"
                importlib.reload(coordinator)  # starts fine with allowlist
        finally:
            for k in env:
                os.environ.pop(k, None)
            os.environ.pop("ALLOWED_EMAILS", None)
            importlib.reload(coordinator)


if __name__ == "__main__":
    unittest.main()
