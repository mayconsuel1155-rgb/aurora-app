import unittest

from fastapi import HTTPException

from routers.connect import handle_google_auth_error


class FakeResponse:
    status_code = 403

    @staticmethod
    def json():
        return {
            "error": {
                "code": 403,
                "message": "Request had insufficient authentication scopes.",
                "status": "PERMISSION_DENIED",
                "errors": [{"reason": "insufficientPermissions"}],
            }
        }


class FakeDb:
    def __init__(self):
        self.deleted = []
        self.commits = 0

    def delete(self, value):
        self.deleted.append(value)

    def commit(self):
        self.commits += 1


class GoogleAuthErrorTests(unittest.TestCase):
    def test_insufficient_scope_removes_unusable_connection(self):
        db = FakeDb()
        connection = object()

        with self.assertRaises(HTTPException) as raised:
            handle_google_auth_error(FakeResponse(), db, connection)

        self.assertEqual(raised.exception.status_code, 403)
        self.assertIn("Reconecte", raised.exception.detail)
        self.assertEqual(db.deleted, [connection])
        self.assertEqual(db.commits, 1)


if __name__ == "__main__":
    unittest.main()
