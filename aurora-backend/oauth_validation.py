import re


GOOGLE_CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events"
GOOGLE_CLIENT_ID_PATTERN = re.compile(
    r"^[0-9]+-[a-zA-Z0-9_-]+\.apps\.googleusercontent\.com$"
)
PLACEHOLDER_VALUES = {
    "change-me",
    "client-id",
    "client-secret",
    "your-client-id",
    "your-client-secret",
}


def validate_google_oauth_credentials(client_id: str, client_secret: str) -> str | None:
    """Return the frontend status for an unusable OAuth configuration."""
    if not client_id or not client_secret:
        return "missing_credentials"

    if (
        client_id.lower() in PLACEHOLDER_VALUES
        or client_secret.lower() in PLACEHOLDER_VALUES
        or not GOOGLE_CLIENT_ID_PATTERN.fullmatch(client_id)
    ):
        return "invalid_credentials"

    return None


def has_google_calendar_scope(granted_scope: str | list[str] | None) -> bool:
    """Check whether Google granted permission to read and write calendar events."""
    if isinstance(granted_scope, str):
        scopes = granted_scope.split()
    else:
        scopes = granted_scope or []

    return GOOGLE_CALENDAR_SCOPE in scopes
