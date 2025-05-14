
# Zupi Backend

Este é o backend inicial do aplicativo Zupi — pedidos de delivery via WhatsApp com Firebase.

## 🚀 Passos para Rodar

1. Instale as dependências:
```
npm install
```

2. Adicione seu `serviceAccountKey.json` (Firebase) na raiz do projeto.

3. Altere `index.js`:
   - Substitua `<YOUR_FIREBASE_PROJECT>` pelo ID do seu projeto Firebase.
   - Substitua `<YOUR_PHONE_NUMBER_ID>` e `<YOUR_WHATSAPP_TOKEN>` pelos dados da WhatsApp Cloud API.

4. Rode o servidor:
```
npm start
```

5. Use `ngrok` para expor o servidor:
```
npx ngrok http 3000
```

6. Configure seu webhook no Facebook Developer com a URL gerada.

---

🛸 Zupi - Seu pedido tem pressa!
