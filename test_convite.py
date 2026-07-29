import requests

# 1. Registrar usuário
res_reg = requests.post("http://localhost:8000/auth/register", json={
    "nome": "Tester",
    "email": "tester@convite.com",
    "senha": "password"
})
if res_reg.status_code != 200 and "já cadastrado" not in res_reg.text:
    print("Erro no registro:", res_reg.text)

# 2. Login
res_login = requests.post("http://localhost:8000/auth/login", json={
    "email": "tester@convite.com",
    "senha": "password"
})
if res_login.status_code != 200:
    print("Erro no login:", res_login.text)
    exit()

token = res_login.json()["access_token"]

# 3. Gerar convite
headers = {"Authorization": f"Bearer {token}"}
res_convite = requests.post("http://localhost:8000/casas/convite", headers=headers)
print("Status do Convite:", res_convite.status_code)
print("Resposta do Convite:", res_convite.text)
