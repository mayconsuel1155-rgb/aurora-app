import ipaddress
import html as html_module
import math
import re
import socket
import threading
import time
import unicodedata
from difflib import SequenceMatcher
from urllib.parse import parse_qs, unquote, urljoin, urlparse

import requests
from bs4 import BeautifulSoup


UF_BY_CODE = {
    "11": "RO", "12": "AC", "13": "AM", "14": "RR", "15": "PA", "16": "AP", "17": "TO",
    "21": "MA", "22": "PI", "23": "CE", "24": "RN", "25": "PB", "26": "PE", "27": "AL",
    "28": "SE", "29": "BA", "31": "MG", "32": "ES", "33": "RJ", "35": "SP", "41": "PR",
    "42": "SC", "43": "RS", "50": "MS", "51": "MT", "52": "GO", "53": "DF",
}
MAX_RESPONSE_BYTES = 2_000_000
REQUEST_TIMEOUT_SECONDS = 15
RATE_LIMIT_COOLDOWN_SECONDS = 300
ATTEMPT_WINDOW_SECONDS = 300
_portal_cooldowns: dict[str, float] = {}
_portal_attempts: dict[str, list[float]] = {}
_portal_cooldowns_lock = threading.Lock()


class NfceError(ValueError):
    pass


def _portal_name(hostname: str) -> str:
    return "SEFAZ SC" if hostname.endswith("sef.sc.gov.br") else hostname


class NfceRateLimitError(NfceError):
    def __init__(self, hostname: str, attempts: int, retry_after_seconds: int):
        self.portal = _portal_name(hostname)
        self.attempts = attempts
        self.retry_after_seconds = max(1, retry_after_seconds)
        super().__init__(_rate_limit_message(hostname))


def _rate_limit_message(hostname: str) -> str:
    portal = _portal_name(hostname)
    return (
        f"A {portal} bloqueou temporariamente novas consultas por excesso de acessos. "
        "Aguarde alguns minutos antes de tentar outra nota."
    )


def _register_portal_attempt(hostname: str, now: float) -> int:
    with _portal_cooldowns_lock:
        recent = [
            attempted_at
            for attempted_at in _portal_attempts.get(hostname, [])
            if now - attempted_at < ATTEMPT_WINDOW_SECONDS
        ]
        recent.append(now)
        _portal_attempts[hostname] = recent
        return len(recent)


def _retry_after_seconds(response) -> int:
    value = response.headers.get("Retry-After", "").strip()
    return int(value) if value.isdigit() and int(value) > 0 else RATE_LIMIT_COOLDOWN_SECONDS


def describe_request_error(error: requests.RequestException, hostname: str) -> str:
    if isinstance(error, requests.exceptions.SSLError):
        return f"O portal {hostname} apresentou um erro de certificado de segurança."
    if isinstance(error, requests.exceptions.ConnectTimeout):
        return f"O portal {hostname} demorou demais para aceitar a conexão."
    if isinstance(error, requests.exceptions.ReadTimeout):
        return f"O portal {hostname} demorou demais para enviar a nota."
    if isinstance(error, requests.exceptions.ConnectionError):
        details = str(error).lower()
        if "10013" in details or "permission" in details or "permiss" in details:
            return f"A conexão com {hostname} foi bloqueada pelo computador ou firewall."
        if "name resolution" in details or "getaddrinfo" in details:
            return f"Não foi possível localizar o endereço {hostname}."
        return f"Não foi possível estabelecer conexão com {hostname}."
    return f"O portal {hostname} não respondeu à consulta."


def normalize_unit(value: str | None) -> str:
    unit = re.sub(r"[^A-Za-z]", "", value or "").lower()
    aliases = {
        "unid": "un", "unidade": "un", "unidades": "un", "und": "un", "pc": "un", "pca": "un",
        "quilo": "kg", "kilo": "kg", "kilograma": "kg", "kilogramas": "kg",
        "grama": "g", "gramas": "g", "litro": "L", "litros": "L", "lt": "L",
        "mililitro": "ml", "mililitros": "ml", "pct": "pacote", "pcte": "pacote",
    }
    normalized = aliases.get(unit, unit)
    return normalized[:16] or "un"


def normalize_name(value: str) -> str:
    ascii_value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode()
    return re.sub(r"\s+", " ", re.sub(r"[^a-zA-Z0-9 ]", " ", ascii_value)).strip().lower()


def find_matching_product(item: dict, products: list) -> int | None:
    item_name = normalize_name(item["nome"])
    item_unit = normalize_unit(item.get("unidade"))
    best_id = None
    best_score = 0.0

    for product in products:
        if normalize_unit(product.unidade) != item_unit:
            continue
        score = SequenceMatcher(None, item_name, normalize_name(product.nome)).ratio()
        if score > best_score:
            best_id = product.id
            best_score = score

    return best_id if best_score >= 0.82 else None


def extract_access_key(*sources: str) -> str:
    candidates = []
    for source in sources:
        decoded_source = unquote(source or "")
        parsed = urlparse(decoded_source.strip())
        for name, values in parse_qs(parsed.query).items():
            if name.lower() in {"p", "chnfe", "chnfce", "chave", "chaveacesso"}:
                candidates.extend(values)
        candidates.append(decoded_source)

    other_models = []
    key_pattern = re.compile(r"(?<!\d)((?:\d[\s.\-]?){43}\d)(?!\d)")
    for candidate in candidates:
        for match in key_pattern.finditer(candidate):
            key = re.sub(r"\D", "", match.group(1))
            model = key[20:22]
            if model == "65":
                return key
            other_models.append(model)

    if other_models:
        raise NfceError(
            f"O QR Code corresponde a um documento fiscal modelo {other_models[0]}, "
            "não a uma NFC-e modelo 65."
        )
    raise NfceError("Não foi possível localizar a chave da NFC-e no link nem na página da SEFAZ.")


def validate_public_nfce_url(qr_code: str, require_access_key: bool = True) -> str:
    url = qr_code.strip()
    parsed = urlparse(url)
    hostname = (parsed.hostname or "").lower().rstrip(".")

    if parsed.scheme not in {"http", "https"} or not hostname:
        raise NfceError("O QR Code não contém um endereço válido.")
    if not (hostname.endswith(".gov.br") or hostname == "gov.br"):
        raise NfceError("O endereço do QR Code não pertence a um portal público brasileiro.")

    try:
        addresses = socket.getaddrinfo(hostname, parsed.port or 443, type=socket.SOCK_STREAM)
    except socket.gaierror as error:
        raise NfceError("Não foi possível localizar o portal da SEFAZ.") from error

    for address in addresses:
        ip = ipaddress.ip_address(address[4][0])
        if not ip.is_global:
            raise NfceError("O endereço informado não é um portal público válido.")

    if require_access_key:
        extract_access_key(url)
    return url


def fetch_nfce_html(qr_code: str) -> tuple[str, str, str, int]:
    current_url = validate_public_nfce_url(qr_code, require_access_key=False)
    initial_hostname = (urlparse(current_url).hostname or "portal da SEFAZ").lower()
    now = time.monotonic()
    attempts = _register_portal_attempt(initial_hostname, now)
    with _portal_cooldowns_lock:
        cooldown_until = _portal_cooldowns.get(initial_hostname, 0)
    if cooldown_until > now:
        raise NfceRateLimitError(initial_hostname, attempts, math.ceil(cooldown_until - now))
    headers = {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9",
        "Cache-Control": "no-cache",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140 Safari/537.36",
    }

    with requests.Session() as session:
        session.trust_env = False
        for _ in range(4):
            request_urls = [current_url]
            parsed_url = urlparse(current_url)
            if parsed_url.scheme == "http":
                request_urls.insert(0, parsed_url._replace(scheme="https").geturl())

            response = None
            last_error = None
            for request_url in request_urls:
                try:
                    response = session.get(
                        request_url,
                        headers=headers,
                        timeout=REQUEST_TIMEOUT_SECONDS,
                        allow_redirects=False,
                        stream=True,
                    )
                    current_url = request_url
                    break
                except requests.RequestException as error:
                    last_error = error

            if response is None:
                hostname = (urlparse(current_url).hostname or "portal da SEFAZ").lower()
                raise NfceError(describe_request_error(last_error, hostname)) from last_error

            if response.is_redirect or response.is_permanent_redirect:
                destination = response.headers.get("Location")
                if not destination:
                    raise NfceError("O portal da SEFAZ retornou um redirecionamento inválido.")
                current_url = validate_public_nfce_url(urljoin(current_url, destination), require_access_key=False)
                continue

            if response.status_code == 429:
                retry_after = _retry_after_seconds(response)
                with _portal_cooldowns_lock:
                    _portal_cooldowns[initial_hostname] = time.monotonic() + retry_after
                raise NfceRateLimitError(initial_hostname, attempts, retry_after)

            if response.status_code != 200:
                raise NfceError(f"O portal da SEFAZ respondeu com o código {response.status_code}.")

            chunks = []
            size = 0
            for chunk in response.iter_content(chunk_size=65_536):
                size += len(chunk)
                if size > MAX_RESPONSE_BYTES:
                    raise NfceError("A resposta do portal da SEFAZ ultrapassou o limite permitido.")
                chunks.append(chunk)
            response.encoding = response.encoding or response.apparent_encoding or "utf-8"
            body = b"".join(chunks).decode(response.encoding, errors="replace")
            hostname = (urlparse(current_url).hostname or initial_hostname).lower()
            if "numero excessivo de requisicoes" in normalize_name(body):
                retry_after = _retry_after_seconds(response)
                with _portal_cooldowns_lock:
                    _portal_cooldowns[initial_hostname] = time.monotonic() + retry_after
                raise NfceRateLimitError(hostname, attempts, retry_after)
            return body, current_url, _portal_name(initial_hostname), attempts

    raise NfceError("O portal da SEFAZ redirecionou a consulta muitas vezes.")


def parse_decimal(value: str | None) -> float:
    cleaned = re.sub(r"[^0-9,.-]", "", value or "")
    if not cleaned:
        return 0.0
    if "," in cleaned:
        cleaned = cleaned.replace(".", "").replace(",", ".")
    elif cleaned.count(".") > 1:
        cleaned = cleaned.replace(".", "")
    try:
        return float(cleaned)
    except ValueError:
        return 0.0


def _text(element) -> str:
    return element.get_text(" ", strip=True) if element else ""


def _field_text(row, selectors: tuple[str, ...]) -> str:
    for selector in selectors:
        value = _text(row.select_one(selector))
        if value:
            return value
    return ""


def _strip_label(value: str, labels: str) -> str:
    return re.sub(rf"(?i).*?(?:{labels})\s*[:.]?\s*", "", value).strip()


def _parse_standard_rows(soup: BeautifulSoup) -> list[dict]:
    rows = soup.select('tr[id^="Item"], tr[id^="item"], .item[id], [data-item]')
    items = []
    for row in rows:
        name = _field_text(row, (".txtTit", ".descricao", ".produto", "[itemprop='name']"))
        quantity_text = _field_text(row, (".Rqtd", ".qtd", ".quantidade", "[itemprop='amount']"))
        unit_text = _field_text(row, (".RUN", ".unidade", ".un", "[itemprop='unitCode']"))
        unit_price_text = _field_text(row, (".RvlUnit", ".valor-unitario", ".vl-unit", "[itemprop='price']"))
        total_candidates = row.select(".valor, .valor-total, .total, [itemprop='price']")
        total_text = _text(total_candidates[-1]) if total_candidates else ""

        quantity = parse_decimal(_strip_label(quantity_text, r"qtd(?:e)?|quantidade"))
        unit = normalize_unit(_strip_label(unit_text, r"un(?:idade)?"))
        unit_price = parse_decimal(_strip_label(unit_price_text, r"vl\.?\s*unit(?:ário|ario)?|valor\s*unit(?:ário|ario)?"))
        total = parse_decimal(total_text)
        if not unit_price and quantity:
            unit_price = total / quantity
        if not total:
            total = quantity * unit_price

        if name and quantity > 0:
            items.append(_item(len(items), name, quantity, unit, unit_price, total))
    return items


def _parse_generic_tables(soup: BeautifulSoup) -> list[dict]:
    for table in soup.find_all("table"):
        rows = table.find_all("tr")
        if not rows:
            continue
        headers = [normalize_name(_text(cell)) for cell in rows[0].find_all(["th", "td"])]
        description_index = next((i for i, value in enumerate(headers) if "descricao" in value or "produto" in value), None)
        quantity_index = next((i for i, value in enumerate(headers) if "qtd" in value or "quantidade" in value), None)
        if description_index is None or quantity_index is None:
            continue
        unit_index = next((i for i, value in enumerate(headers) if value in {"un", "und", "unidade"}), None)
        price_index = next(
            (i for i, value in enumerate(headers) if "unit" in value and ("valor" in value or "vl" in value)),
            None,
        )
        total_index = next((i for i, value in enumerate(headers) if "total" in value), None)
        items = []
        for row in rows[1:]:
            cells = [_text(cell) for cell in row.find_all(["th", "td"])]
            if max(description_index, quantity_index) >= len(cells):
                continue
            name = cells[description_index]
            quantity_text = cells[quantity_index]
            quantity = parse_decimal(quantity_text)
            unit_text = cells[unit_index] if unit_index is not None and unit_index < len(cells) else ""
            if not unit_text:
                unit_match = re.search(r"\b([A-Za-z]{1,16})\b\s*$", quantity_text)
                unit_text = unit_match.group(1) if unit_match else "un"
            unit = normalize_unit(unit_text)
            unit_price = parse_decimal(cells[price_index] if price_index is not None and price_index < len(cells) else "")
            total = parse_decimal(cells[total_index] if total_index is not None and total_index < len(cells) else "")
            if not unit_price and quantity:
                unit_price = total / quantity
            if name and quantity > 0:
                items.append(_item(len(items), name, quantity, unit, unit_price, total or quantity * unit_price))
        if items:
            return items
    return []


def _decode_javascript_markup(value: str) -> str:
    """Decodifica somente escapes de texto; nunca executa o JavaScript da SEFAZ."""
    decoded = html_module.unescape(value)
    decoded = re.sub(
        r"\\u([0-9a-fA-F]{4})",
        lambda match: chr(int(match.group(1), 16)),
        decoded,
    )
    decoded = re.sub(
        r"\\x([0-9a-fA-F]{2})",
        lambda match: chr(int(match.group(1), 16)),
        decoded,
    )
    replacements = {
        r"\r": " ",
        r"\n": " ",
        r"\t": " ",
        r"\/": "/",
        r'\"': '"',
        r"\'": "'",
    }
    for escaped, replacement in replacements.items():
        decoded = decoded.replace(escaped, replacement)
    return decoded


def _embedded_nfce_documents(soup: BeautifulSoup):
    for script in soup.find_all("script"):
        script_text = script.string or script.get_text(" ", strip=False)
        if not script_text:
            continue
        if not any(marker in script_text for marker in ("DanfeNFCe", "tabResult", "txtTit", r"\u003c", r"\x3c")):
            continue

        decoded = _decode_javascript_markup(script_text)
        table_match = re.search(r"<table\b.*?</table>", decoded, flags=re.IGNORECASE | re.DOTALL)
        if table_match:
            yield BeautifulSoup(table_match.group(0), "html.parser")


def _item(index: int, name: str, quantity: float, unit: str, unit_price: float, total: float) -> dict:
    return {
        "indice": index,
        "nome": re.sub(r"\s+", " ", name).strip()[:200],
        "quantidade": round(quantity, 4),
        "unidade": unit,
        "preco_unitario": round(unit_price, 4),
        "valor_total": round(total, 2),
    }


def parse_nfce_html(html: str, qr_code: str, final_url: str | None = None) -> dict:
    soup = BeautifulSoup(html, "html.parser")
    key = extract_access_key(qr_code, final_url or "", html, soup.get_text(" ", strip=True))
    content_soup = soup
    items = _parse_standard_rows(content_soup) or _parse_generic_tables(content_soup)
    if not items:
        for embedded_soup in _embedded_nfce_documents(soup):
            items = _parse_standard_rows(embedded_soup) or _parse_generic_tables(embedded_soup)
            if items:
                content_soup = embedded_soup
                break
    page_text = normalize_name(soup.get_text(" ", strip=True))

    if not items:
        if "numero excessivo de requisicoes" in page_text:
            hostname = (urlparse(qr_code).hostname or "portal da SEFAZ").lower()
            raise NfceRateLimitError(hostname, attempts=1, retry_after_seconds=RATE_LIMIT_COOLDOWN_SECONDS)
        if "captcha" in page_text or "nao sou um robo" in page_text:
            raise NfceError("Esta SEFAZ exige CAPTCHA e não liberou os itens automaticamente.")
        uf = UF_BY_CODE.get(key[:2], "desconhecida")
        raise NfceError(f"A nota foi encontrada, mas o formato da SEFAZ {uf} ainda não pôde ser interpretado.")

    issuer = _field_text(content_soup, ("#u20", ".txtTopo", ".emitente", "[itemprop='legalName']"))
    if not issuer and content_soup is not soup:
        issuer = _field_text(soup, ("#u20", ".txtTopo", ".emitente", "[itemprop='legalName']"))
    total_text = _field_text(content_soup, ("#totalNota .txtMax", ".totalNumb", ".valor-total-nota", "[itemprop='totalPaymentDue']"))
    if not total_text and content_soup is not soup:
        total_text = _field_text(soup, ("#totalNota .txtMax", ".totalNumb", ".valor-total-nota", "[itemprop='totalPaymentDue']"))
    total = parse_decimal(total_text) or round(sum(item["valor_total"] for item in items), 2)
    return {
        "chave_acesso": key,
        "uf": UF_BY_CODE.get(key[:2], "BR"),
        "emitente": issuer or None,
        "valor_total": total,
        "itens": items,
    }
