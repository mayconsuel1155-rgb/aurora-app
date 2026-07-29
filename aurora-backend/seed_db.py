from database import SessionLocal, Base, engine
import models

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # Verifica se já existe a Casa 1
    casa = db.query(models.Casa).filter(models.Casa.id == 1).first()
    if not casa:
        print("Criando Usuário e Casa...")
        user = models.Usuario(nome="Usuário Teste", email="teste@aurora.com", hash_senha="123")
        db.add(user)
        db.commit()
        db.refresh(user)
        
        casa = models.Casa(id=1, nome="Minha Casa", usuario_id=user.id)
        db.add(casa)
        db.commit()
        db.refresh(casa)
        print(f"Casa '{casa.nome}' criada com ID {casa.id}")
        
        print("Criando Ambientes iniciais...")
        ambientes = [
            models.Ambiente(casa_id=casa.id, nome="Geladeira", icone="🧊"),
            models.Ambiente(casa_id=casa.id, nome="Despensa", icone="📦"),
            models.Ambiente(casa_id=casa.id, nome="Lavanderia", icone="🧺"),
            models.Ambiente(casa_id=casa.id, nome="Banheiro", icone="🧼"),
        ]
        db.add_all(ambientes)
        db.commit()
    
    # Verifica se há produtos, se não, cria alguns
    produtos = db.query(models.Produto).filter(models.Produto.casa_id == 1).all()
    if not produtos:
        print("Criando produtos iniciais...")
        amb_db = db.query(models.Ambiente).filter(models.Ambiente.casa_id == 1).all()
        amb_map = {amb.nome: amb.id for amb in amb_db}
        
        produtos_iniciais = [
            models.Produto(casa_id=1, nome="Café Especial", categoria="Alimentos", quantidade=0.5, quantidade_minima=1, ambiente_id=amb_map.get("Despensa")),
            models.Produto(casa_id=1, nome="Leite", categoria="Alimentos", quantidade=3, quantidade_minima=2, ambiente_id=amb_map.get("Geladeira")),
            models.Produto(casa_id=1, nome="Sabão em Pó", categoria="Limpeza", quantidade=0, quantidade_minima=1, ambiente_id=amb_map.get("Lavanderia")),
            models.Produto(casa_id=1, nome="Papel Higiênico", categoria="Higiene", quantidade=12, quantidade_minima=4, ambiente_id=amb_map.get("Banheiro")),
            models.Produto(casa_id=1, nome="Azeite", categoria="Alimentos", quantidade=1, quantidade_minima=1, ambiente_id=amb_map.get("Despensa")),
        ]
        db.add_all(produtos_iniciais)
        db.commit()
        print("Produtos criados com sucesso!")
        
        # Cria também listas de compras para os itens com quantidade <= minima
        for p in produtos_iniciais:
            if p.quantidade <= p.quantidade_minima:
                lista = models.ListaCompras(casa_id=1, produto_id=p.id, status="Pendente")
                db.add(lista)
        db.commit()
        print("Listas de compras geradas!")
    else:
        print("Banco já possui produtos.")
        
    db.close()

if __name__ == "__main__":
    seed()
