import unittest

from oauth_validation import has_google_calendar_scope, validate_google_oauth_credentials


class GoogleOAuthConfigTests(unittest.TestCase):
    def test_rejects_missing_credentials(self):
        self.assertEqual(
            validate_google_oauth_credentials("", ""),
            "missing_credentials",
        )

    def test_rejects_placeholder_credentials(self):
        self.assertEqual(
            validate_google_oauth_credentials("your-client-id", "your-client-secret"),
            "invalid_credentials",
        )

    def test_rejects_malformed_client_id(self):
        self.assertEqual(
            validate_google_oauth_credentials("not-a-google-client", "secret"),
            "invalid_credentials",
        )

    def test_accepts_google_web_client_credentials(self):
        self.assertIsNone(
            validate_google_oauth_credentials(
                "123456789-example.apps.googleusercontent.com",
                "example-client-secret",
            )
        )

    def test_accepts_required_calendar_scope(self):
        self.assertTrue(
            has_google_calendar_scope(
                "openid email https://www.googleapis.com/auth/calendar.events"
            )
        )

    def test_rejects_token_without_calendar_scope(self):
        self.assertFalse(has_google_calendar_scope("openid email profile"))


if __name__ == "__main__":
    unittest.main()
