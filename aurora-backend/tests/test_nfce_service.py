import pathlib
import sys
import unittest

import requests

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from services.nfce_service import NfceError, NfceRateLimitError, describe_request_error, extract_access_key, normalize_unit, parse_nfce_html


ACCESS_KEY = "35260112345678000199650010000000011123456780"
QR_URL = f"https://www.nfce.fazenda.sp.gov.br/qrcode?p={ACCESS_KEY}|3|1"
SC_ACCESS_KEY = "42250978268125000194650100000147301457197630"
SC_QR_URL = f"https://sat.sef.sc.gov.br/nfce/consulta?p={SC_ACCESS_KEY}|3|1"


class NfceParserTests(unittest.TestCase):
    def test_parses_standard_sefaz_item_layout(self):
        html = """
        <html><body>
          <div id="u20">Mercado Aurora LTDA</div>
          <table id="tabResult">
            <tr id="Item1">
              <td>
                <span class="txtTit">BANANA PRATA KG</span>
                <span class="Rqtd"><strong>Qtde.:</strong> 1,250</span>
                <span class="RUN"><strong>UN:</strong> KG</span>
                <span class="RvlUnit"><strong>Vl. Unit.:</strong> 8,40</span>
              </td>
              <td><span class="valor">10,50</span></td>
            </tr>
          </table>
          <div id="totalNota"><span class="txtMax">10,50</span></div>
        </body></html>
        """

        preview = parse_nfce_html(html, QR_URL)

        self.assertEqual(preview["uf"], "SP")
        self.assertEqual(preview["emitente"], "Mercado Aurora LTDA")
        self.assertEqual(preview["valor_total"], 10.5)
        self.assertEqual(preview["itens"][0]["nome"], "BANANA PRATA KG")
        self.assertEqual(preview["itens"][0]["quantidade"], 1.25)
        self.assertEqual(preview["itens"][0]["unidade"], "kg")

    def test_parses_generic_table_layout(self):
        html = """
        <table>
          <tr><th>Descrição</th><th>Quantidade</th><th>Unidade</th><th>Valor unitário</th><th>Total</th></tr>
          <tr><td>LEITE INTEGRAL</td><td>2</td><td>UN</td><td>5,25</td><td>10,50</td></tr>
        </table>
        """

        preview = parse_nfce_html(html, QR_URL)

        self.assertEqual(len(preview["itens"]), 1)
        self.assertEqual(preview["itens"][0]["preco_unitario"], 5.25)

    def test_parses_sefaz_table_embedded_in_javascript(self):
        html = r'''
        <html><body>
          <div id="u20">Mercado do Cerrado</div>
          <script type="text/javascript">
            new DanfeNFCe("\n<table id=\"tabResult\">\n<tr id=\"Item + 1\">\n<td><span class=\"txtTit\">FEIJAO CARIOCA</span><span class=\"Rqtd\"><strong>Qtde.:</strong>2</span><span class=\"RUN\"><strong>UN:</strong>UN</span><span class=\"RvlUnit\"><strong>Vl. Unit.:</strong>7,50</span></td><td><span class=\"valor\">15,00</span></td></tr>\n</table>");
          </script>
        </body></html>
        '''

        preview = parse_nfce_html(html, QR_URL)

        self.assertEqual(preview["emitente"], "Mercado do Cerrado")
        self.assertEqual(len(preview["itens"]), 1)
        self.assertEqual(preview["itens"][0]["nome"], "FEIJAO CARIOCA")
        self.assertEqual(preview["itens"][0]["quantidade"], 2)
        self.assertEqual(preview["itens"][0]["preco_unitario"], 7.5)
        self.assertEqual(preview["valor_total"], 15)

    def test_parses_sc_table_with_combined_quantity_and_unit(self):
        html = """
        <table>
          <tr><th>Item</th><th>Código</th><th>Descrição</th><th>Qtde UN</th><th>Vl.Unit</th><th>Vl.Total</th></tr>
          <tr><td>1</td><td>405</td><td>MACA FUJI KG</td><td>3,1220 KG</td><td>12,50</td><td>39,03</td></tr>
        </table>
        """

        preview = parse_nfce_html(html, SC_QR_URL)

        self.assertEqual(preview["uf"], "SC")
        self.assertEqual(preview["itens"][0]["quantidade"], 3.122)
        self.assertEqual(preview["itens"][0]["unidade"], "kg")
        self.assertEqual(preview["itens"][0]["preco_unitario"], 12.5)

    def test_extracts_formatted_key_from_sefaz_page_for_opaque_qr_url(self):
        formatted_key = "4225 0978 2681 2500 0194 6501 0000 0147 3014 5719 7630"
        html = f"""
        <p>Chave de acesso: {formatted_key}</p>
        <table>
          <tr><th>Descrição</th><th>Quantidade</th><th>Unidade</th><th>Valor unitário</th><th>Total</th></tr>
          <tr><td>ARROZ</td><td>1</td><td>UN</td><td>10,00</td><td>10,00</td></tr>
        </table>
        """

        preview = parse_nfce_html(html, "https://sat.sef.sc.gov.br/nfce/consulta?token=opaco")

        self.assertEqual(preview["chave_acesso"], SC_ACCESS_KEY)
        self.assertEqual(preview["uf"], "SC")

    def test_extracts_key_from_final_url_after_sefaz_redirect(self):
        html = """
        <table>
          <tr><th>Descrição</th><th>Quantidade</th><th>Unidade</th><th>Valor unitário</th><th>Total</th></tr>
          <tr><td>CAFE</td><td>1</td><td>UN</td><td>18,00</td><td>18,00</td></tr>
        </table>
        """
        opaque_url = "https://sat.sef.sc.gov.br/nfce/consulta?token=opaco"
        final_url = f"https://sat.sef.sc.gov.br/nfce/resultado?chNFe={SC_ACCESS_KEY}"

        preview = parse_nfce_html(html, opaque_url, final_url)

        self.assertEqual(preview["chave_acesso"], SC_ACCESS_KEY)
        self.assertEqual(preview["uf"], "SC")

    def test_reports_document_model_when_qr_is_not_nfce(self):
        nfe_key = SC_ACCESS_KEY[:20] + "55" + SC_ACCESS_KEY[22:]

        with self.assertRaisesRegex(NfceError, "modelo 55"):
            extract_access_key(f"https://www.sefaz.sc.gov.br/consulta?chNFe={nfe_key}")

    def test_reports_sc_rate_limit_page_instead_of_unknown_format(self):
        html = """
        <html><body>
          <h1>Aplicativo temporariamente indisponível</h1>
          <p>O sistema detectou um número excessivo de requisições deste IP.
          Aguarde alguns minutos para acessar novamente este aplicativo.</p>
        </body></html>
        """

        with self.assertRaisesRegex(NfceRateLimitError, "excesso de acessos") as raised:
            parse_nfce_html(html, SC_QR_URL)

        self.assertEqual(raised.exception.portal, "SEFAZ SC")
        self.assertEqual(raised.exception.attempts, 1)
        self.assertEqual(raised.exception.retry_after_seconds, 300)

    def test_reports_captcha_instead_of_returning_empty_receipt(self):
        with self.assertRaisesRegex(NfceError, "CAPTCHA"):
            parse_nfce_html("<html><body>Resolva o CAPTCHA</body></html>", QR_URL)

    def test_rejects_non_nfce_key(self):
        invalid_model_key = ACCESS_KEY[:20] + "55" + ACCESS_KEY[22:]
        with self.assertRaises(NfceError):
            extract_access_key(f"https://www.sefaz.sp.gov.br/?p={invalid_model_key}")

    def test_normalizes_common_units(self):
        self.assertEqual(normalize_unit("UNID"), "un")
        self.assertEqual(normalize_unit("Litros"), "L")
        self.assertEqual(normalize_unit("KG"), "kg")

    def test_describes_blocked_connection_without_exposing_receipt_url(self):
        error = requests.exceptions.ConnectionError("[WinError 10013] acesso ao soquete proibido")

        message = describe_request_error(error, "sefaz.example.gov.br")

        self.assertIn("bloqueada", message)
        self.assertIn("sefaz.example.gov.br", message)

    def test_describes_read_timeout(self):
        message = describe_request_error(requests.exceptions.ReadTimeout(), "sefaz.example.gov.br")
        self.assertIn("enviar a nota", message)


if __name__ == "__main__":
    unittest.main()
