# Copyright 2026 Google LLC All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Test cases for property annotations and --allow-write configuration."""

import unittest
from unittest.mock import MagicMock, patch

from analytics_mcp.tools.admin import info
from google.analytics import admin_v1alpha
from google.api_core import exceptions as google_exceptions
from google.type import date_pb2


class TestCreatePropertyAnnotation(unittest.IsolatedAsyncioTestCase):
    """Test cases for create_property_annotation."""

    @patch("analytics_mcp.tools.admin.info.create_admin_alpha_api_client")
    async def test_create_single_date_annotation(self, mock_create_client):
        """Tests creating a single-date annotation."""
        mock_client = MagicMock()
        mock_create_client.return_value = mock_client
        mock_client.create_reporting_data_annotation.return_value = (
            admin_v1alpha.ReportingDataAnnotation(
                name="properties/12345/reportingDataAnnotations/999",
                title="GTM Container Published",
                description="Published version 42",
                color=admin_v1alpha.ReportingDataAnnotation.Color.BLUE,
                annotation_date=date_pb2.Date(year=2026, month=10, day=21),
            )
        )

        result = await info.create_property_annotation(
            property_id=12345,
            title="GTM Container Published",
            start_date="2026-10-21",
            color="blue",
            description="Published version 42",
        )

        self.assertEqual(
            result["name"],
            "properties/12345/reportingDataAnnotations/999",
        )
        self.assertEqual(result["title"], "GTM Container Published")
        self.assertEqual(result["color"], "BLUE")
        self.assertEqual(
            result["annotation_date"],
            {"year": 2026, "month": 10, "day": 21},
        )

        mock_client.create_reporting_data_annotation.assert_called_once()
        call_kwargs = (
            mock_client.create_reporting_data_annotation.call_args.kwargs
        )
        req = call_kwargs["request"]
        self.assertEqual(req.parent, "properties/12345")
        self.assertEqual(
            req.reporting_data_annotation.title, "GTM Container Published"
        )
        self.assertEqual(
            req.reporting_data_annotation.color,
            admin_v1alpha.ReportingDataAnnotation.Color.BLUE,
        )
        self.assertEqual(
            req.reporting_data_annotation.annotation_date,
            date_pb2.Date(year=2026, month=10, day=21),
        )

    @patch("analytics_mcp.tools.admin.info.create_admin_alpha_api_client")
    async def test_create_date_range_annotation(self, mock_create_client):
        """Tests creating a date-range annotation."""
        mock_client = MagicMock()
        mock_create_client.return_value = mock_client
        mock_client.create_reporting_data_annotation.return_value = (
            admin_v1alpha.ReportingDataAnnotation(
                name="properties/12345/reportingDataAnnotations/1000",
                title="Holiday Promo",
                color=admin_v1alpha.ReportingDataAnnotation.Color.GREEN,
                annotation_date_range=(
                    admin_v1alpha.ReportingDataAnnotation.DateRange(
                        start_date=date_pb2.Date(year=2026, month=10, day=20),
                        end_date=date_pb2.Date(year=2026, month=10, day=25),
                    )
                ),
            )
        )

        result = await info.create_property_annotation(
            property_id="properties/12345",
            title="Holiday Promo",
            start_date="2026-10-20",
            end_date="2026-10-25",
            color="GREEN",
        )

        self.assertEqual(result["title"], "Holiday Promo")
        self.assertEqual(result["color"], "GREEN")
        self.assertEqual(
            result["annotation_date_range"],
            {
                "start_date": {"year": 2026, "month": 10, "day": 20},
                "end_date": {"year": 2026, "month": 10, "day": 25},
            },
        )

    async def test_create_property_annotation_validation(self):
        """Tests validation errors for invalid inputs."""
        with self.assertRaisesRegex(ValueError, "title must be a non-empty"):
            await info.create_property_annotation(
                property_id=12345,
                title="   ",
                start_date="2026-10-21",
            )

        with self.assertRaisesRegex(
            ValueError, "title must be at most 60 characters"
        ):
            await info.create_property_annotation(
                property_id=12345,
                title="a" * 61,
                start_date="2026-10-21",
            )

        with self.assertRaisesRegex(
            ValueError, "description must be at most 150 characters"
        ):
            await info.create_property_annotation(
                property_id=12345,
                title="Release",
                start_date="2026-10-21",
                description="a" * 151,
            )

        with self.assertRaisesRegex(ValueError, "Invalid color"):
            await info.create_property_annotation(
                property_id=12345,
                title="Release",
                start_date="2026-10-21",
                color="ORANGE",
            )

        with self.assertRaisesRegex(ValueError, "Expected YYYY-MM-DD"):
            await info.create_property_annotation(
                property_id=12345,
                title="Release",
                start_date="10/21/2026",
            )

        with self.assertRaisesRegex(
            ValueError, "end_date .* must be greater than or equal"
        ):
            await info.create_property_annotation(
                property_id=12345,
                title="Release",
                start_date="2026-10-21",
                end_date="2026-10-20",
            )


if __name__ == "__main__":
    unittest.main()
