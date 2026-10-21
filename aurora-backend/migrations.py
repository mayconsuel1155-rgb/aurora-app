from sqlalchemy import inspect, text

from database import engine


def run_lightweight_migrations() -> None:
    inspector = inspect(engine)
    tables = set(inspector.get_table_names())

    with engine.begin() as connection:
        if "produtos" in tables:
            product_columns = {column["name"] for column in inspector.get_columns("produtos")}
            if "unidade" not in product_columns:
                connection.execute(text("ALTER TABLE produtos ADD COLUMN unidade VARCHAR(16)"))
                connection.execute(text("UPDATE produtos SET unidade = 'un' WHERE unidade IS NULL"))

        if "notas_fiscais_importadas" in tables:
            receipt_columns = {
                column["name"] for column in inspector.get_columns("notas_fiscais_importadas")
            }
            additions = {
                "uf": "VARCHAR(2)",
                "emitente": "VARCHAR(200)",
                "valor_total": "FLOAT",
            }
            for column_name, column_type in additions.items():
                if column_name not in receipt_columns:
                    connection.execute(text(
                        f"ALTER TABLE notas_fiscais_importadas ADD COLUMN {column_name} {column_type}"
                    ))
