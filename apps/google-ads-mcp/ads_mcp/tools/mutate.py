"""Write tools: Google Ads API mutate operations.

Clearcut addition (not in upstream). Every tool:
  * defaults to ``validate_only=True`` -- Google validates the request and
    returns what would happen without changing anything. Pass
    ``validate_only=False`` only after the user confirmed the preview.
  * uses the API's partial-failure handling, so one bad operation is reported
    instead of silently failing the whole batch.
  * calls the official ``GoogleAdsService.Mutate`` with the signed-in user's
    own OAuth token, so Google enforces that user's access level. Changes show
    up in Google Ads > Change history under that user.

Only resources the team edits are exposed (see ``ALLOWED_OPERATIONS``); account
settings and user access are deliberately not reachable from here.
"""

from typing import Any, Dict, List, Literal

from fastmcp import FastMCP
from fastmcp.exceptions import ToolError
from fastmcp.tools import Tool
from google.ads.googleads.errors import GoogleAdsException
from google.api_core import protobuf_helpers
from google.protobuf import json_format
from mcp.types import ToolAnnotations

import ads_mcp.utils as utils

mutate_mcp = FastMCP("mutate")

# MutateOperation oneof names the generic tool accepts.
ALLOWED_OPERATIONS = frozenset(
    {
        "campaign_operation",
        "campaign_budget_operation",
        "campaign_criterion_operation",
        "ad_group_operation",
        "ad_group_ad_operation",
        "ad_group_criterion_operation",
        "ad_group_bid_modifier_operation",
        "campaign_bid_modifier_operation",
        "asset_operation",
        "user_list_operation",
        "audience_operation",
    }
)

MAX_OPERATIONS = 100

_DESTRUCTIVE = ToolAnnotations(readOnlyHint=False, destructiveHint=True)


def _failure_messages(ex: GoogleAdsException) -> str:
    errors = [
        f"Google Ads API Error: {error.message}" for error in ex.failure.errors
    ]
    return f"Request ID: {ex.request_id}\n" + "\n".join(errors)


def _partial_failure(response: Any) -> Dict[str, Any] | None:
    """Returns the partial-failure status as a dict, or None when all passed."""
    status = response.partial_failure_error
    if not status or (not status.code and not status.message):
        return None
    out: Dict[str, Any] = {"code": status.code, "message": status.message}
    try:
        failure_type = utils.get_googleads_type("GoogleAdsFailure")
        errors = []
        for detail in status.details:
            if detail.type_url.endswith("GoogleAdsFailure"):
                failure = type(failure_type).deserialize(detail.value)
                errors.extend(
                    {
                        "message": e.message,
                        "operation_index": [
                            el.index
                            for el in e.location.field_path_elements
                            if el.field_name == "mutate_operations"
                        ],
                    }
                    for e in failure.errors
                )
        if errors:
            out["errors"] = errors
    except Exception:  # details are best effort; the message is enough
        utils.logger.exception("Could not decode partial failure details")
    return out


def _run_mutate(
    customer_id: str | int,
    operations: List[Any],
    validate_only: bool,
    login_customer_id: str | int | None,
) -> Dict[str, Any]:
    customer_id = utils.clean_customer_id(customer_id)
    ga_service = utils.get_googleads_service(
        "GoogleAdsService", login_customer_id=login_customer_id
    )
    request = utils.get_googleads_type("MutateGoogleAdsRequest")
    request.customer_id = customer_id
    request.mutate_operations.extend(operations)
    request.partial_failure = True
    request.validate_only = validate_only
    utils.logger.info(
        f"ads_mcp.mutate customer={customer_id} ops={len(operations)} "
        f"validate_only={validate_only}"
    )

    try:
        response = ga_service.mutate(request=request)
    except GoogleAdsException as ex:
        raise ToolError(_failure_messages(ex))

    partial = _partial_failure(response)
    results = [
        json_format.MessageToDict(r._pb if hasattr(r, "_pb") else r)
        for r in response.mutate_operation_responses
    ]
    return {
        "validate_only": validate_only,
        "applied": not validate_only and partial is None,
        "partial_failure": partial,
        "results": results,
        "note": (
            "Preview only: nothing was changed. Re-run with "
            "validate_only=False to apply."
            if validate_only
            else "Applied. See Google Ads > Change history."
        ),
    }


def _fill_update_masks(operation: Any) -> None:
    """Sets update_mask from the fields given in ``update`` when omitted."""
    pb = operation._pb
    name = pb.WhichOneof("operation")
    if not name:
        raise ToolError("Each operation must set exactly one *_operation key.")
    sub = getattr(pb, name)
    if sub.HasField("update") and not sub.update_mask.paths:
        sub.update_mask.CopyFrom(protobuf_helpers.field_mask(None, sub.update))


def mutate(
    customer_id: str | int,
    operations: List[Dict[str, Any]],
    validate_only: bool = True,
    login_customer_id: str | int | None = None,
) -> Dict[str, Any]:
    """Applies Google Ads mutate operations (create / update / remove).

    Each item of ``operations`` is a Google Ads API ``MutateOperation`` in JSON
    (proto field names), with exactly one ``<resource>_operation`` key holding
    ``create``, ``update`` or ``remove``. For ``update`` the ``update_mask`` is
    derived from the fields you give if you leave it out.

    Allowed resources: campaign, campaign_budget, campaign_criterion, ad_group,
    ad_group_ad, ad_group_criterion, ad_group_bid_modifier,
    campaign_bid_modifier, asset, user_list, audience.

    Safety: ``validate_only`` defaults to True (preview, nothing changes).
    Show the user the preview, get their confirmation, and only then call again
    with ``validate_only=False``. What a user may change is decided by their
    own Google Ads access level (Read only users are rejected by Google).

    Example (pause a campaign):
        [{"campaign_operation": {"update": {"resource_name":
          "customers/1234567890/campaigns/111", "status": "PAUSED"}}}]

    Args:
        customer_id: The customer id (digits, hyphens are stripped).
        operations: List of MutateOperation objects (max 100).
        validate_only: Preview without changing anything (default True).
        login_customer_id: Optional manager id for the login-customer-id header.
    """
    if not operations:
        raise ToolError("operations must contain at least one operation.")
    if len(operations) > MAX_OPERATIONS:
        raise ToolError(f"At most {MAX_OPERATIONS} operations per call.")

    built = []
    for index, op in enumerate(operations):
        if not isinstance(op, dict) or len(op) != 1:
            raise ToolError(
                f"Operation {index}: give exactly one '<resource>_operation' key."
            )
        (key,) = op
        if key not in ALLOWED_OPERATIONS:
            raise ToolError(
                f"Operation {index}: '{key}' is not allowed. "
                f"Allowed: {', '.join(sorted(ALLOWED_OPERATIONS))}."
            )
        mutate_operation = utils.get_googleads_type("MutateOperation")
        try:
            json_format.ParseDict(op, mutate_operation._pb)
        except json_format.ParseError as ex:
            raise ToolError(f"Operation {index}: {ex}")
        _fill_update_masks(mutate_operation)
        built.append(mutate_operation)

    return _run_mutate(customer_id, built, validate_only, login_customer_id)


def set_campaign_status(
    customer_id: str | int,
    campaign_id: str | int,
    status: Literal["ENABLED", "PAUSED"],
    validate_only: bool = True,
    login_customer_id: str | int | None = None,
) -> Dict[str, Any]:
    """Pauses or enables one campaign.

    ``validate_only`` defaults to True (preview). Confirm with the user, then
    call again with ``validate_only=False`` to apply.

    Args:
        customer_id: The customer id.
        campaign_id: The campaign id.
        status: ENABLED or PAUSED.
        validate_only: Preview without changing anything (default True).
        login_customer_id: Optional manager id for the login-customer-id header.
    """
    if status not in ("ENABLED", "PAUSED"):
        raise ToolError("status must be ENABLED or PAUSED.")
    cid = utils.clean_customer_id(customer_id)
    return mutate(
        cid,
        [
            {
                "campaign_operation": {
                    "update": {
                        "resource_name": f"customers/{cid}/campaigns/"
                        f"{utils.clean_customer_id(campaign_id)}",
                        "status": status,
                    }
                }
            }
        ],
        validate_only=validate_only,
        login_customer_id=login_customer_id,
    )


def update_campaign_budget(
    customer_id: str | int,
    budget_id: str | int,
    amount_micros: int,
    validate_only: bool = True,
    login_customer_id: str | int | None = None,
) -> Dict[str, Any]:
    """Changes the daily amount of a campaign budget.

    ``amount_micros`` is in micros of the account currency (1 unit =
    1,000,000), e.g. 500 INR per day = 500000000. ``validate_only`` defaults to
    True (preview); confirm with the user before applying.

    Args:
        customer_id: The customer id.
        budget_id: The campaign budget id (campaign.campaign_budget).
        amount_micros: New daily amount in micros, must be > 0.
        validate_only: Preview without changing anything (default True).
        login_customer_id: Optional manager id for the login-customer-id header.
    """
    if int(amount_micros) <= 0:
        raise ToolError("amount_micros must be greater than 0.")
    cid = utils.clean_customer_id(customer_id)
    return mutate(
        cid,
        [
            {
                "campaign_budget_operation": {
                    "update": {
                        "resource_name": f"customers/{cid}/campaignBudgets/"
                        f"{utils.clean_customer_id(budget_id)}",
                        "amount_micros": str(int(amount_micros)),
                    }
                }
            }
        ],
        validate_only=validate_only,
        login_customer_id=login_customer_id,
    )


# Docstrings are the tool descriptions; register explicitly (no decorators) to
# match search.py and keep the functions directly callable in tests.
for _fn in (mutate, set_campaign_status, update_campaign_budget):
    mutate_mcp.add_tool(Tool.from_function(_fn, annotations=_DESTRUCTIVE))
