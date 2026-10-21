from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas
import security
from services.nfce_service import UF_BY_CODE, NfceError, NfceRateLimitError, extract_access_key, fetch_nfce_html, find_matching_product, normalize_unit, parse_nfce_html


router = APIRouter(prefix="/notas-fiscais", tags=["notas-fiscais"])


@router.get("/chaves/{chave_acesso}", response_model=schemas.NfceAccessKeyResponse)
def find_nfce_by_access_key(
    chave_acesso: str,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(security.get_current_user),
):
    casa = security.get_user_casa(current_user)
    try:
        key = extract_access_key(chave_acesso)
    except NfceError as error:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(error)) from error

    uf = UF_BY_CODE.get(key[:2], "BR")
    imported = db.query(models.NotaFiscalImportada).filter(
        models.NotaFiscalImportada.casa_id == casa.id,
        models.NotaFiscalImportada.chave_acesso == key,
    ).first()
    if not imported:
        return {
            "chave_acesso": key,
            "uf": uf,
            "importada": False,
            "consulta_automatica_disponivel": False,
            "mensagem": (
                f"Chave válida de NFC-e {uf}, ainda não importada. "
                "A consulta estadual por chave pode exigir CAPTCHA; use o QR Code para importar os itens automaticamente."
            ),
            "itens": [],
        }

    return {
        "chave_acesso": imported.chave_acesso,
        "uf": imported.uf or uf,
        "importada": True,
        "emitente": imported.emitente,
        "valor_total": imported.valor_total,
        "importada_em": imported.timestamp,
        "consulta_automatica_disponivel": False,
        "mensagem": "Esta nota já foi importada. O estoque não será alterado novamente.",
        "itens": [
            {
                "indice": item.indice,
                "nome": item.nome,
                "quantidade": item.quantidade,
                "unidade": item.unidade,
                "preco_unitario": item.preco_unitario,
                "valor_total": item.valor_total,
                "importado_estoque": item.importado_estoque,
            }
            for item in imported.itens
        ],
    }


@router.post("/previews", response_model=schemas.NfcePreviewResponse)
def preview_nfce(
    request: schemas.NfcePreviewRequest,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(security.get_current_user),
):
    casa = security.get_user_casa(current_user)
    try:
        html, final_url, portal, attempts = fetch_nfce_html(request.qr_code)
        preview = parse_nfce_html(html, request.qr_code, final_url)
        preview["consulta_portal"] = portal
        preview["consulta_tentativas"] = attempts
        preview["retry_after_seconds"] = 0
    except NfceRateLimitError as error:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "message": str(error),
                "portal": error.portal,
                "attempts": error.attempts,
                "retry_after_seconds": error.retry_after_seconds,
            },
            headers={"Retry-After": str(error.retry_after_seconds)},
        ) from error
    except NfceError as error:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(error)) from error

    products = db.query(models.Produto).filter(models.Produto.casa_id == casa.id).all()
    for item in preview["itens"]:
        item["produto_id"] = find_matching_product(item, products)
    return preview


@router.post("/imports", response_model=schemas.NfceImportResponse, status_code=status.HTTP_201_CREATED)
def import_nfce(
    request: schemas.NfceImportRequest,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(security.get_current_user),
):
    casa = security.get_user_casa(current_user)
    already_imported = db.query(models.NotaFiscalImportada).filter(
        models.NotaFiscalImportada.casa_id == casa.id,
        models.NotaFiscalImportada.chave_acesso == request.chave_acesso,
    ).first()
    if already_imported:
        raise HTTPException(status_code=409, detail="Esta nota fiscal já foi importada para a casa.")

    updated = 0
    created = 0
    changed_products = []

    try:
        for item in request.itens:
            product = None
            if item.produto_id is not None:
                product = db.query(models.Produto).filter(
                    models.Produto.id == item.produto_id,
                    models.Produto.casa_id == casa.id,
                ).first()
                if not product:
                    raise HTTPException(status_code=422, detail=f"Produto {item.produto_id} não pertence a esta casa.")

            if product:
                product.quantidade = (product.quantidade or 0) + item.quantidade
                product.preco = item.preco_unitario
                product.unidade = normalize_unit(item.unidade)
                db.query(models.ListaCompras).filter(
                    models.ListaCompras.produto_id == product.id,
                    models.ListaCompras.status == "Pendente",
                ).update({"status": "Comprado"})
                updated += 1
            else:
                product = models.Produto(
                    casa_id=casa.id,
                    nome=item.nome.strip(),
                    categoria=item.categoria.strip(),
                    quantidade=item.quantidade,
                    quantidade_minima=0,
                    unidade=normalize_unit(item.unidade),
                    preco=item.preco_unitario,
                )
                db.add(product)
                created += 1
            changed_products.append(product)

        receipt = models.NotaFiscalImportada(
            casa_id=casa.id,
            chave_acesso=request.chave_acesso,
            uf=request.uf.upper(),
            emitente=request.emitente.strip() if request.emitente else None,
            valor_total=request.valor_total,
        )
        db.add(receipt)
        db.flush()
        imported_indices = {item.indice for item in request.itens}
        for item in request.itens_nota:
            db.add(models.NotaFiscalItemImportado(
                nota_fiscal_id=receipt.id,
                indice=item.indice,
                nome=item.nome.strip(),
                quantidade=item.quantidade,
                unidade=normalize_unit(item.unidade),
                preco_unitario=item.preco_unitario,
                valor_total=item.valor_total,
                importado_estoque=item.indice in imported_indices,
            ))
        db.commit()
        for product in changed_products:
            db.refresh(product)
    except HTTPException:
        db.rollback()
        raise
    except Exception as error:
        db.rollback()
        raise HTTPException(status_code=500, detail="Não foi possível importar os itens da nota.") from error

    return {"atualizados": updated, "criados": created, "produtos": changed_products}
