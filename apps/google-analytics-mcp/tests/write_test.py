"""Tests for the GA4 write tools (mocked Admin API clients)."""

import unittest
from unittest.mock import MagicMock, patch

from google.analytics import admin_v1alpha, admin_v1beta

from analytics_mcp.tools.admin import write


class TestWriteTools(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.beta = MagicMock()
        self.alpha = MagicMock()
        for target, client in (
            ("analytics_mcp.tools.admin.write.create_admin_api_client", self.beta),
            (
                "analytics_mcp.tools.admin.write.create_admin_alpha_api_client",
                self.alpha,
            ),
        ):
            p = patch(target, return_value=client)
            p.start()
            self.addCleanup(p.stop)

    async def test_dry_run_is_default_and_calls_nothing(self):
        for coro in (
            write.create_key_event("12345", "purchase"),
            write.create_custom_dimension("12345", "plan", "Plan"),
            write.create_custom_metric("12345", "score", "Score"),
            write.create_audience("12345", {"display_name": "A"}),
            write.update_data_retention_settings(
                "12345", event_data_retention="FOURTEEN_MONTHS"
            ),
        ):
            out = await coro
            self.assertTrue(out["dry_run"])
            self.assertIn("Dry run", out["note"])
        self.assertEqual(self.beta.method_calls, [])
        self.assertEqual(self.alpha.method_calls, [])

    async def test_create_key_event_applies(self):
        self.beta.create_key_event.return_value = admin_v1beta.KeyEvent(
            name="properties/12345/keyEvents/1", event_name="purchase"
        )
        out = await write.create_key_event(
            "properties/12345", "purchase", "ONCE_PER_SESSION", dry_run=False
        )
        kwargs = self.beta.create_key_event.call_args.kwargs
        self.assertEqual(kwargs["parent"], "properties/12345")
        self.assertEqual(kwargs["key_event"].event_name, "purchase")
        self.assertEqual(
            kwargs["key_event"].counting_method,
            admin_v1beta.KeyEvent.CountingMethod.ONCE_PER_SESSION,
        )
        self.assertFalse(out["dry_run"])
        self.assertEqual(out["result"]["event_name"], "purchase")

    async def test_create_custom_dimension_and_metric(self):
        self.beta.create_custom_dimension.return_value = (
            admin_v1beta.CustomDimension(parameter_name="plan")
        )
        await write.create_custom_dimension(
            12345, "plan", "Plan", "user", dry_run=False
        )
        dim = self.beta.create_custom_dimension.call_args.kwargs[
            "custom_dimension"
        ]
        self.assertEqual(
            dim.scope, admin_v1beta.CustomDimension.DimensionScope.USER
        )
        self.beta.create_custom_metric.return_value = (
            admin_v1beta.CustomMetric(parameter_name="score")
        )
        await write.create_custom_metric(
            12345, "score", "Score", "seconds", dry_run=False
        )
        metric = self.beta.create_custom_metric.call_args.kwargs["custom_metric"]
        self.assertEqual(
            metric.measurement_unit,
            admin_v1beta.CustomMetric.MeasurementUnit.SECONDS,
        )

    async def test_create_audience_parses_json(self):
        self.alpha.create_audience.return_value = admin_v1alpha.Audience(
            display_name="Purchasers"
        )
        await write.create_audience(
            12345,
            {
                "display_name": "Purchasers",
                "description": "d",
                "membership_duration_days": 30,
                "filter_clauses": [
                    {
                        "clause_type": "INCLUDE",
                        "simple_filter": {
                            "scope": "AUDIENCE_FILTER_SCOPE_ACROSS_ALL_SESSIONS",
                            "filter_expression": {
                                "event_filter": {"event_name": "purchase"}
                            },
                        },
                    }
                ],
            },
            dry_run=False,
        )
        audience = self.alpha.create_audience.call_args.kwargs["audience"]
        self.assertEqual(audience.membership_duration_days, 30)
        self.assertEqual(len(audience.filter_clauses), 1)

    async def test_data_retention_mask(self):
        self.beta.update_data_retention_settings.return_value = (
            admin_v1beta.DataRetentionSettings(
                name="properties/12345/dataRetentionSettings"
            )
        )
        await write.update_data_retention_settings(
            12345, "TWO_MONTHS", True, dry_run=False
        )
        kwargs = self.beta.update_data_retention_settings.call_args.kwargs
        self.assertEqual(
            kwargs["data_retention_settings"].name,
            "properties/12345/dataRetentionSettings",
        )
        self.assertEqual(
            kwargs["update_mask"],
            {"paths": ["event_data_retention", "reset_user_data_on_new_activity"]},
        )

    async def test_invalid_input_rejected_before_any_call(self):
        bad = (
            write.create_key_event("1", "e", "SOMETIMES", dry_run=False),
            write.create_key_event("1", "  ", dry_run=False),
            write.create_custom_dimension("1", "p", "P", "UNSPECIFIED", dry_run=False),
            write.create_audience("1", {}, dry_run=False),
            write.create_audience("1", {"display_name": "A", "nope": 1}, dry_run=False),
            write.update_data_retention_settings("1", dry_run=False),
            write.update_data_retention_settings("1", "FOREVER", dry_run=False),
            write.create_key_event("abc", "e", dry_run=False),
        )
        for coro in bad:
            with self.assertRaises(ValueError):
                await coro
        self.assertEqual(self.beta.method_calls, [])
        self.assertEqual(self.alpha.method_calls, [])


if __name__ == "__main__":
    unittest.main()
