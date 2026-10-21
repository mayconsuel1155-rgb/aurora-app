import pathlib
import sys
import unittest
from datetime import datetime, timedelta, timezone
from unittest.mock import patch

from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from database import Base
import models
import schemas
import security
from routers.auth import forgot_password, reset_password


class PasswordRecoveryTests(unittest.TestCase):
    def setUp(self):
        engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        Base.metadata.create_all(engine)
        self.db = sessionmaker(bind=engine)()
        self.user = models.Usuario(
            nome="Maycon",
            email="mayconsuel1155@gmail.com",
            hash_senha=security.get_password_hash("SenhaAntiga123!"),
        )
        self.db.add(self.user)
        self.db.commit()
        self.db.refresh(self.user)

    def tearDown(self):
        self.db.close()

    @patch("routers.auth.send_password_reset_email")
    def test_existing_account_receives_single_use_reset_link(self, send_email):
        previous_access_token = security.create_access_token({
            "sub": str(self.user.id),
            "ver": self.user.auth_version or 0,
        })
        result = forgot_password(
            schemas.ForgotPasswordRequest(email=self.user.email),
            self.db,
        )

        self.assertEqual(result.message, schemas.PASSWORD_RESET_GENERIC_MESSAGE)
        send_email.assert_called_once()
        reset_url = send_email.call_args.args[1]
        raw_token = reset_url.split("token=", 1)[1]
        stored_token = self.db.query(models.PasswordResetToken).one()
        self.assertNotEqual(stored_token.token_hash, raw_token)

        reset_password(
            schemas.ResetPasswordRequest(token=raw_token, nova_senha="NovaSenha123!"),
            self.db,
        )

        self.db.refresh(self.user)
        self.assertTrue(security.verify_password("NovaSenha123!", self.user.hash_senha))
        self.assertEqual(self.user.auth_version, 1)
        with self.assertRaises(HTTPException) as old_session:
            security.get_current_user(previous_access_token, self.db)
        self.assertEqual(old_session.exception.status_code, 401)
        with self.assertRaises(HTTPException) as reused:
            reset_password(
                schemas.ResetPasswordRequest(token=raw_token, nova_senha="OutraSenha123!"),
                self.db,
            )
        self.assertEqual(reused.exception.status_code, 400)

    @patch("routers.auth.send_password_reset_email")
    def test_unknown_account_has_same_public_response(self, send_email):
        result = forgot_password(
            schemas.ForgotPasswordRequest(email="naoexiste@example.com"),
            self.db,
        )

        self.assertEqual(result.message, schemas.PASSWORD_RESET_GENERIC_MESSAGE)
        send_email.assert_not_called()
        self.assertEqual(self.db.query(models.PasswordResetToken).count(), 0)

    def test_expired_token_is_rejected(self):
        raw_token = "token-expirado-com-tamanho-suficiente"
        self.db.add(models.PasswordResetToken(
            usuario_id=self.user.id,
            token_hash=security.hash_password_reset_token(raw_token),
            expires_at=datetime.now(timezone.utc) - timedelta(seconds=1),
        ))
        self.db.commit()

        with self.assertRaises(HTTPException) as expired:
            reset_password(
                schemas.ResetPasswordRequest(token=raw_token, nova_senha="NovaSenha123!"),
                self.db,
            )

        self.assertEqual(expired.exception.status_code, 400)
        self.assertFalse(security.verify_password("NovaSenha123!", self.user.hash_senha))

    @patch("routers.auth.send_password_reset_email")
    def test_recent_request_does_not_send_another_email(self, send_email):
        request = schemas.ForgotPasswordRequest(email=self.user.email)

        forgot_password(request, self.db)
        forgot_password(request, self.db)

        send_email.assert_called_once()
        self.assertEqual(self.db.query(models.PasswordResetToken).count(), 1)


if __name__ == "__main__":
    unittest.main()
