"""Client initialization for the Google Analytics APIs.

Clearcut change: upstream builds every client from Application Default
Credentials (one shared identity). Here the clients use the *signed-in user's*
Google token whenever the request came through the OAuth proxy, so Google
applies that user's GA4 role (Viewer / Analyst / Marketer / Editor /
Administrator) on every call. ADC is only the local-development fallback.
"""

import contextlib
import subprocess
from importlib import metadata
from unittest.mock import patch

import google.auth
from google.analytics import (
    admin_v1alpha,
    admin_v1beta,
    data_v1alpha,
    data_v1beta,
)
from google.api_core.gapic_v1.client_info import ClientInfo
from google.oauth2.credentials import Credentials


def _get_package_version_with_fallback():
    try:
        return metadata.version("clearcut-analytics-mcp")
    except Exception:
        return "unknown"


_CLIENT_INFO = ClientInfo(
    user_agent=f"analytics-mcp/{_get_package_version_with_fallback()}"
)

_READ_ONLY_ANALYTICS_SCOPE = (
    "https://www.googleapis.com/auth/analytics.readonly"
)
_EDIT_ANALYTICS_SCOPE = "https://www.googleapis.com/auth/analytics.edit"


@contextlib.contextmanager
def prevent_stdio_inheritance():
    """Stops `gcloud` (spawned by google.auth.default) inheriting stdio."""
    original_popen = subprocess.Popen

    def safe_popen(*args, **kwargs):
        if kwargs.get("stdin") is None:
            kwargs["stdin"] = subprocess.DEVNULL
        return original_popen(*args, **kwargs)

    with patch("subprocess.Popen", new=safe_popen):
        yield


def _get_credentials():
    """The signed-in user's token if present, else ADC (local dev only)."""
    from fastmcp.server.dependencies import get_access_token

    token = get_access_token()
    if token and token.token:
        return Credentials(token=token.token)
    with prevent_stdio_inheritance():
        credentials, _ = google.auth.default(
            scopes=[_READ_ONLY_ANALYTICS_SCOPE, _EDIT_ANALYTICS_SCOPE]
        )
    return credentials


def create_admin_api_client() -> admin_v1beta.AnalyticsAdminServiceClient:
    """Returns the Google Analytics Admin API client."""
    return admin_v1beta.AnalyticsAdminServiceClient(
        client_info=_CLIENT_INFO, credentials=_get_credentials()
    )


def create_data_api_client() -> data_v1beta.BetaAnalyticsDataClient:
    """Returns the Google Analytics Data API client."""
    return data_v1beta.BetaAnalyticsDataClient(
        client_info=_CLIENT_INFO, credentials=_get_credentials()
    )


def create_admin_alpha_api_client() -> (
    admin_v1alpha.AnalyticsAdminServiceClient
):
    """Returns the Google Analytics Admin API (alpha) client."""
    return admin_v1alpha.AnalyticsAdminServiceClient(
        client_info=_CLIENT_INFO, credentials=_get_credentials()
    )


def create_data_api_alpha_client() -> data_v1alpha.AlphaAnalyticsDataClient:
    """Returns the Google Analytics Data API (Alpha) client."""
    return data_v1alpha.AlphaAnalyticsDataClient(
        client_info=_CLIENT_INFO, credentials=_get_credentials()
    )
