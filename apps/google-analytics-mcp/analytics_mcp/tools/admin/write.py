"""Write tools: GA4 Admin API changes.

Clearcut addition (not in upstream). The Admin API has no ``validate_only``, so
every tool takes ``dry_run`` (default True): the exact request that would be
sent is returned and nothing is changed. Apply with ``dry_run=False`` only after
the user confirmed. The call runs with the signed-in user's token, so Google
rejects it unless that person's GA4 role allows the change (Marketer: key
events and audiences; Editor: custom dimensions/metrics and data retention).
Changes appear in GA4 > Admin > Property change history under that user.

Admin API versions: key events, custom dimensions/metrics and data retention
use v1beta; audiences use v1alpha (may change without notice).
User management is intentionally not exposed.
"""

import asyncio
from typing import Any, Dict

from google.analytics import admin_v1alpha, admin_v1beta
from google.protobuf import json_format

from analytics_mcp.tools.client import (
    create_admin_alpha_api_client,
    create_admin_api_client,
)
from analytics_mcp.tools.utils import construct_property_rn, proto_to_dict

_DRY_RUN_NOTE = (
    "Dry run: nothing was changed. Re-run with dry_run=False to apply."
)


def _enum(enum_cls: Any, value: str, field: str) -> Any:
    name = (value or "").strip().upper()
    member = enum_cls.__members__.get(name)
    if member is None or name.endswith("UNSPECIFIED"):
        valid = ", ".join(
            n for n in enum_cls.__members__ if not n.endswith("UNSPECIFIED")
        )
        raise ValueError(f"Invalid {field} '{value}'. Valid values: {valid}.")
    return member


def _require(value: str | None, field: str) -> str:
    if not value or not value.strip():
        raise ValueError(f"{field} must be a non-empty string.")
    return value.strip()


async def _apply(
    action: str, dry_run: bool, request_dict: Dict[str, Any], call: Any
) -> Dict[str, Any]:
    if dry_run:
        return {
            "dry_run": True,
            "action": action,
            "request": request_dict,
            "note": _DRY_RUN_NOTE,
        }
    result = await asyncio.to_thread(call)
    return {"dry_run": False, "action": action, "result": proto_to_dict(result)}


async def create_key_event(
    property_id: int | str,
    event_name: str,
    counting_method: str = "ONCE_PER_EVENT",
    dry_run: bool = True,
) -> Dict[str, Any]:
    """Marks an event as a key event (formerly "conversion") on a property.

    Needs the Marketer role or higher. ``dry_run`` defaults to True (preview);
    confirm with the user, then call again with ``dry_run=False``.

    Args:
        property_id: GA4 property id (a number, or 'properties/<number>').
        event_name: Name of the event to mark, e.g. 'purchase'.
        counting_method: 'ONCE_PER_EVENT' (default) or 'ONCE_PER_SESSION'.
        dry_run: Preview without changing anything (default True).
    """
    parent = construct_property_rn(property_id)
    key_event = admin_v1beta.KeyEvent(
        event_name=_require(event_name, "event_name"),
        counting_method=_enum(
            admin_v1beta.KeyEvent.CountingMethod,
            counting_method,
            "counting_method",
        ),
    )
    return await _apply(
        "create_key_event",
        dry_run,
        {"parent": parent, "key_event": proto_to_dict(key_event)},
        lambda: create_admin_api_client().create_key_event(
            parent=parent, key_event=key_event
        ),
    )


async def create_custom_dimension(
    property_id: int | str,
    parameter_name: str,
    display_name: str,
    scope: str = "EVENT",
    description: str = "",
    disallow_ads_personalization: bool = False,
    dry_run: bool = True,
) -> Dict[str, Any]:
    """Creates a custom dimension on a property.

    Needs the Editor role. Custom dimensions cannot be deleted afterwards (only
    archived in the GA4 UI), so check the preview carefully. ``dry_run``
    defaults to True; confirm with the user, then call with ``dry_run=False``.

    Args:
        property_id: GA4 property id (a number, or 'properties/<number>').
        parameter_name: Event/user/item parameter the dimension reads.
        display_name: Name shown in reports.
        scope: 'EVENT' (default), 'USER' or 'ITEM'.
        description: Optional description.
        disallow_ads_personalization: Exclude from ads personalization (USER scope).
        dry_run: Preview without changing anything (default True).
    """
    parent = construct_property_rn(property_id)
    dimension = admin_v1beta.CustomDimension(
        parameter_name=_require(parameter_name, "parameter_name"),
        display_name=_require(display_name, "display_name"),
        description=description or "",
        scope=_enum(
            admin_v1beta.CustomDimension.DimensionScope, scope, "scope"
        ),
        disallow_ads_personalization=disallow_ads_personalization,
    )
    return await _apply(
        "create_custom_dimension",
        dry_run,
        {"parent": parent, "custom_dimension": proto_to_dict(dimension)},
        lambda: create_admin_api_client().create_custom_dimension(
            parent=parent, custom_dimension=dimension
        ),
    )


async def create_custom_metric(
    property_id: int | str,
    parameter_name: str,
    display_name: str,
    measurement_unit: str = "STANDARD",
    description: str = "",
    dry_run: bool = True,
) -> Dict[str, Any]:
    """Creates a custom metric (event scope) on a property.

    Needs the Editor role. ``dry_run`` defaults to True; confirm with the user,
    then call with ``dry_run=False``.

    Args:
        property_id: GA4 property id (a number, or 'properties/<number>').
        parameter_name: Event parameter the metric reads.
        display_name: Name shown in reports.
        measurement_unit: STANDARD (default), CURRENCY, FEET, METERS,
          KILOMETERS, MILES, MILLISECONDS, SECONDS, MINUTES or HOURS.
        description: Optional description.
        dry_run: Preview without changing anything (default True).
    """
    parent = construct_property_rn(property_id)
    metric = admin_v1beta.CustomMetric(
        parameter_name=_require(parameter_name, "parameter_name"),
        display_name=_require(display_name, "display_name"),
        description=description or "",
        measurement_unit=_enum(
            admin_v1beta.CustomMetric.MeasurementUnit,
            measurement_unit,
            "measurement_unit",
        ),
        scope=admin_v1beta.CustomMetric.MetricScope.EVENT,
    )
    return await _apply(
        "create_custom_metric",
        dry_run,
        {"parent": parent, "custom_metric": proto_to_dict(metric)},
        lambda: create_admin_api_client().create_custom_metric(
            parent=parent, custom_metric=metric
        ),
    )


async def create_audience(
    property_id: int | str,
    audience: Dict[str, Any],
    dry_run: bool = True,
) -> Dict[str, Any]:
    """Creates an audience on a property (Admin API v1alpha, may change).

    Needs the Marketer role or higher. ``audience`` is a v1alpha ``Audience`` as
    JSON with proto field names: ``display_name``, ``description``,
    ``membership_duration_days`` (1-540) and ``filter_clauses`` (each clause
    ``clause_type`` INCLUDE/EXCLUDE plus ``simple_filter`` or
    ``sequence_filter``). Example:
        {"display_name": "Purchasers", "description": "Bought in last 30d",
         "membership_duration_days": 30,
         "filter_clauses": [{"clause_type": "INCLUDE", "simple_filter":
           {"scope": "AUDIENCE_FILTER_SCOPE_ACROSS_ALL_SESSIONS",
            "filter_expression": {"event_filter": {"event_name": "purchase"}}}}]}
    ``dry_run`` defaults to True; confirm with the user, then call with
    ``dry_run=False``.

    Args:
        property_id: GA4 property id (a number, or 'properties/<number>').
        audience: The Audience as JSON (see above).
        dry_run: Preview without changing anything (default True).
    """
    parent = construct_property_rn(property_id)
    if not isinstance(audience, dict) or not audience.get("display_name"):
        raise ValueError("audience must be an object with a display_name.")
    message = admin_v1alpha.Audience()
    try:
        json_format.ParseDict(audience, message._pb)
    except json_format.ParseError as ex:
        raise ValueError(f"Invalid audience: {ex}")
    return await _apply(
        "create_audience",
        dry_run,
        {"parent": parent, "audience": proto_to_dict(message)},
        lambda: create_admin_alpha_api_client().create_audience(
            parent=parent, audience=message
        ),
    )


async def update_data_retention_settings(
    property_id: int | str,
    event_data_retention: str | None = None,
    reset_user_data_on_new_activity: bool | None = None,
    dry_run: bool = True,
) -> Dict[str, Any]:
    """Changes the data retention settings of a property.

    Needs the Editor role. Give at least one of the two settings. ``dry_run``
    defaults to True; confirm with the user, then call with ``dry_run=False``.

    Args:
        property_id: GA4 property id (a number, or 'properties/<number>').
        event_data_retention: TWO_MONTHS, FOURTEEN_MONTHS, TWENTY_SIX_MONTHS,
          THIRTY_EIGHT_MONTHS or FIFTY_MONTHS (the last three are 360 only).
        reset_user_data_on_new_activity: Reset the retention period on new activity.
        dry_run: Preview without changing anything (default True).
    """
    if event_data_retention is None and reset_user_data_on_new_activity is None:
        raise ValueError(
            "Give event_data_retention and/or reset_user_data_on_new_activity."
        )
    name = f"{construct_property_rn(property_id)}/dataRetentionSettings"
    settings = admin_v1beta.DataRetentionSettings(name=name)
    mask = []
    if event_data_retention is not None:
        settings.event_data_retention = _enum(
            admin_v1beta.DataRetentionSettings.RetentionDuration,
            event_data_retention,
            "event_data_retention",
        )
        mask.append("event_data_retention")
    if reset_user_data_on_new_activity is not None:
        settings.reset_user_data_on_new_activity = (
            reset_user_data_on_new_activity
        )
        mask.append("reset_user_data_on_new_activity")
    return await _apply(
        "update_data_retention_settings",
        dry_run,
        {
            "data_retention_settings": proto_to_dict(settings),
            "update_mask": mask,
        },
        lambda: create_admin_api_client().update_data_retention_settings(
            data_retention_settings=settings,
            update_mask={"paths": mask},
        ),
    )
