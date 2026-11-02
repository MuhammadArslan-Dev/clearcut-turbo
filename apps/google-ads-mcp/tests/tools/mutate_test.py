"""Tests for the write tools (mocked Google Ads service)."""

import unittest
from unittest.mock import MagicMock, patch

from fastmcp.exceptions import ToolError

import ads_mcp.utils as real_utils
from ads_mcp.tools import mutate


def _fake_response(partial=None):
    resp = MagicMock()
    resp.mutate_operation_responses = []
    status = MagicMock()
    status.code = 0 if partial is None else 3
    status.message = "" if partial is None else partial
    status.details = []
    resp.partial_failure_error = status
    return resp


class TestMutate(unittest.TestCase):
    def setUp(self):
        self.service = MagicMock()
        self.service.mutate.return_value = _fake_response()
        p = patch(
            "ads_mcp.utils.get_googleads_service", return_value=self.service
        )
        p.start()
        self.addCleanup(p.stop)
        # Real proto types, no credentials needed.
        from google.ads.googleads.client import GoogleAdsClient

        client = GoogleAdsClient(
            credentials=MagicMock(), developer_token="x", use_proto_plus=True
        )
        t = patch(
            "ads_mcp.utils.get_googleads_type", side_effect=client.get_type
        )
        t.start()
        self.addCleanup(t.stop)

    def _request(self):
        return self.service.mutate.call_args.kwargs["request"]

    def test_defaults_to_validate_only_with_partial_failure(self):
        out = mutate.set_campaign_status("123-456-7890", "111", "PAUSED")
        req = self._request()
        self.assertTrue(req.validate_only)
        self.assertTrue(req.partial_failure)
        self.assertEqual(req.customer_id, "1234567890")
        self.assertFalse(out["applied"])
        self.assertIn("Preview only", out["note"])

    def test_status_update_builds_mask_and_resource_name(self):
        mutate.set_campaign_status("1234567890", "111", "PAUSED", False)
        op = self._request().mutate_operations[0]
        upd = op.campaign_operation
        self.assertEqual(
            upd.update.resource_name, "customers/1234567890/campaigns/111"
        )
        self.assertEqual(upd.update.status.name, "PAUSED")
        self.assertIn("status", upd.update_mask.paths)
        self.assertFalse(self._request().validate_only)

    def test_budget_update_micros(self):
        mutate.update_campaign_budget("1234567890", "55", 500_000_000)
        op = self._request().mutate_operations[0].campaign_budget_operation
        self.assertEqual(op.update.amount_micros, 500_000_000)
        self.assertEqual(
            op.update.resource_name, "customers/1234567890/campaignBudgets/55"
        )

    def test_invalid_inputs_rejected_before_api_call(self):
        with self.assertRaises(ToolError):
            mutate.set_campaign_status("1", "2", "REMOVED")
        with self.assertRaises(ToolError):
            mutate.update_campaign_budget("1", "2", 0)
        with self.assertRaises(ToolError):
            mutate.mutate("1", [])
        with self.assertRaises(ToolError):
            mutate.mutate("1", [{"campaign_operation": {}}] * 101)
        self.service.mutate.assert_not_called()

    def test_disallowed_resource_rejected(self):
        for key in ("customer_operation", "customer_user_access_operation"):
            with self.assertRaises(ToolError):
                mutate.mutate("1", [{key: {"update": {}}}])
        self.service.mutate.assert_not_called()

    def test_unknown_field_rejected(self):
        with self.assertRaises(ToolError):
            mutate.mutate(
                "1", [{"campaign_operation": {"update": {"nope": 1}}}]
            )

    def test_partial_failure_reported_not_applied(self):
        self.service.mutate.return_value = _fake_response("bad op")
        out = mutate.set_campaign_status("1", "2", "PAUSED", False)
        self.assertFalse(out["applied"])
        self.assertEqual(out["partial_failure"]["message"], "bad op")

    def test_tools_are_registered(self):
        names = {
            t.name for t in mutate.mutate_mcp.local_provider._components.values()
        }
        self.assertTrue(
            {"mutate", "set_campaign_status", "update_campaign_budget"}
            <= names
        )


if __name__ == "__main__":
    unittest.main()
