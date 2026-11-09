"""Team-only access for the remote (OAuth) deployment.

Google OAuth lets any Google account sign in to our OAuth client, so we reject
every request whose verified Google email is not on the team allowlist. Google
Ads access levels (Read only / Standard / Admin) are still enforced by Google
on each API call; this only decides who may reach the server at all.

ALLOWED_EMAILS is a comma/space separated list of exact emails
(``a@example.com``) and/or whole domains (``@example.com``).
"""

import os
from typing import Any, Iterable

from fastmcp.exceptions import AuthorizationError
from fastmcp.server.dependencies import get_access_token
from fastmcp.server.middleware import Middleware, MiddlewareContext

ALLOWED_EMAILS_ENV = "ALLOWED_EMAILS"


def parse_allowlist(raw: str | None) -> tuple[frozenset[str], frozenset[str]]:
    """Splits the raw env value into (exact emails, domains), lower-cased."""
    emails: set[str] = set()
    domains: set[str] = set()
    for entry in (raw or "").replace(",", " ").split():
        entry = entry.strip().lower()
        if entry.startswith("@"):
            domains.add(entry[1:])
        elif entry:
            emails.add(entry)
    return frozenset(emails), frozenset(domains)


def is_allowed(
    email: str | None,
    email_verified: Any,
    emails: Iterable[str],
    domains: Iterable[str],
) -> bool:
    """True when the verified email is allowlisted. Unknown/unverified fails."""
    if not email or email_verified is not True:
        return False
    email = email.lower()
    return email in set(emails) or email.rsplit("@", 1)[-1] in set(domains)


class TeamOnlyMiddleware(Middleware):
    """Rejects any message from a signed-in user who is not on the allowlist."""

    def __init__(self, emails: Iterable[str], domains: Iterable[str]):
        self._emails = frozenset(emails)
        self._domains = frozenset(domains)

    async def on_message(
        self, context: MiddlewareContext[Any], call_next: Any
    ) -> Any:
        token = get_access_token()
        claims = (token.claims if token else None) or {}
        if not is_allowed(
            claims.get("email"),
            claims.get("email_verified"),
            self._emails,
            self._domains,
        ):
            raise AuthorizationError(
                "This Google account is not allowed to use this server."
            )
        return await call_next(context)
