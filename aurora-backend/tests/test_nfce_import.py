import pathlib
import sys
import unittest
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
from routers.notas_fiscais import find_nfce_by_access_key, import_nfce, preview_nfce
from services.nfce_service import NfceRateLimitError


ACCESS_KEY = "35260112345678000199650010000000011123456780"


class NfceImportTests(unittest.TestCase):
    def setUp(self):
        engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        Base.metadata.create_all(engine)
        self.db = sessionmaker(bind=engine)()
        self.user = models.Usuario(nome="Maycon", email="maycon@example.com", hash_senha="test")
        self.home = models.Casa(nome="Casa", dono=self.user)
        self.product = models.Produto(
            casa=self.home,
            nome="Arroz",
            categoria="Alimentos",
            quantidade=1,
            quantidade_minima=1,
            unidade="kg",
            preco=5,
        )
        self.db.add_all([self.user, self.home, self.product])
        self.db.commit()

    def tearDown(self):
        self.db.close()

    def test_updates_existing_and_creates_new_product_atomically(self):
        request = schemas.NfceImportRequest(
            chave_acesso=ACCESS_KEY,
            uf="SP",
            emitente="Mercado Aurora",
            valor_total=32.7,
            itens=[
                schemas.NfceImportItem(
                    indice=0,
                    nome="Arroz",
                    quantidade=2,
                    unidade="kg",
                    preco_unitario=6.5,
                    produto_id=self.product.id,
                    categoria="Alimentos",
                ),
                schemas.NfceImportItem(
                    indice=1,
                    nome="Leite",
                    quantidade=3,
                    unidade="UNID",
                    preco_unitario=4.9,
                    categoria="Alimentos",
                ),
            ],
            itens_nota=[
                schemas.NfceItemPreview(
                    indice=0,
                    nome="Arroz",
                    quantidade=2,
                    unidade="kg",
                    preco_unitario=6.5,
                    valor_total=13,
                    produto_id=self.product.id,
                ),
                schemas.NfceItemPreview(
                    indice=1,
                    nome="Leite",
                    quantidade=3,
                    unidade="UNID",
                    preco_unitario=4.9,
                    valor_total=14.7,
                ),
                schemas.NfceItemPreview(
                    indice=2,
                    nome="Chocolate",
                    quantidade=1,
                    unidade="UN",
                    preco_unitario=5,
                    valor_total=5,
                ),
            ],
        )

        result = import_nfce(request, self.db, self.user)

        self.assertEqual(result["atualizados"], 1)
        self.assertEqual(result["criados"], 1)
        self.db.refresh(self.product)
        self.assertEqual(self.product.quantidade, 3)
        self.assertEqual(self.product.preco, 6.5)
        milk = self.db.query(models.Produto).filter(models.Produto.nome == "Leite").one()
        self.assertEqual(milk.quantidade, 3)
        self.assertEqual(milk.unidade, "un")
        receipt = self.db.query(models.NotaFiscalImportada).one()
        self.assertEqual(receipt.emitente, "Mercado Aurora")
        self.assertEqual(receipt.uf, "SP")
        self.assertEqual(receipt.valor_total, 32.7)
        self.assertEqual(len(receipt.itens), 3)
        self.assertTrue(receipt.itens[0].importado_estoque)
        self.assertTrue(receipt.itens[1].importado_estoque)
        self.assertFalse(receipt.itens[2].importado_estoque)

        history = find_nfce_by_access_key(ACCESS_KEY, self.db, self.user)
        self.assertTrue(history["importada"])
        self.assertEqual(history["emitente"], "Mercado Aurora")
        self.assertEqual(len(history["itens"]), 3)

        with self.assertRaises(HTTPException) as raised:
            import_nfce(request, self.db, self.user)
        self.assertEqual(raised.exception.status_code, 409)
        self.db.refresh(self.product)
        self.assertEqual(self.product.quantidade, 3)

    def test_access_key_search_identifies_valid_new_nfce(self):
        result = find_nfce_by_access_key(ACCESS_KEY, self.db, self.user)

        self.assertFalse(result["importada"])
        self.assertEqual(result["uf"], "SP")
        self.assertFalse(result["consulta_automatica_disponivel"])
        self.assertIn("QR Code", result["mensagem"])

    def test_preview_returns_structured_rate_limit(self):
        request = schemas.NfcePreviewRequest(qr_code=f"https://sat.sef.sc.gov.br/nfce/consulta?p={ACCESS_KEY}|3|1")

        with patch(
            "routers.notas_fiscais.fetch_nfce_html",
            side_effect=NfceRateLimitError("sat.sef.sc.gov.br", attempts=3, retry_after_seconds=127),
        ):
            with self.assertRaises(HTTPException) as raised:
                preview_nfce(request, self.db, self.user)

        self.assertEqual(raised.exception.status_code, 429)
        self.assertEqual(raised.exception.detail["portal"], "SEFAZ SC")
        self.assertEqual(raised.exception.detail["attempts"], 3)
        self.assertEqual(raised.exception.detail["retry_after_seconds"], 127)

    def test_preview_returns_attempt_control_after_success(self):
        request = schemas.NfcePreviewRequest(qr_code=f"https://sat.sef.sc.gov.br/nfce/consulta?p={ACCESS_KEY}|3|1")
        parsed = {
            "chave_acesso": ACCESS_KEY,
            "uf": "SC",
            "emitente": "Mercado",
            "valor_total": 10,
            "itens": [{
                "indice": 0,
                "nome": "ARROZ",
                "quantidade": 1,
                "unidade": "un",
                "preco_unitario": 10,
                "valor_total": 10,
            }],
        }

        with patch(
            "routers.notas_fiscais.fetch_nfce_html",
            return_value=("<html></html>", request.qr_code, "SEFAZ SC", 2),
        ), patch("routers.notas_fiscais.parse_nfce_html", return_value=parsed):
            preview = preview_nfce(request, self.db, self.user)

        self.assertEqual(preview["consulta_portal"], "SEFAZ SC")
        self.assertEqual(preview["consulta_tentativas"], 2)
        self.assertEqual(preview["retry_after_seconds"], 0)


if __name__ == "__main__":
    unittest.main()
