
// Estrutura inicial do backend do Zupi (Node.js + Express)
// Arquivo: index.js

const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const admin = require('firebase-admin');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());

// Firebase Init
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://<YOUR_FIREBASE_PROJECT>.firebaseio.com'
});
const db = admin.firestore();

// Webhook para receber mensagens do WhatsApp
app.post('/webhook', async (req, res) => {
  const body = req.body;
  if (body.object) {
    body.entry.forEach(async (entry) => {
      const changes = entry.changes[0];
      const value = changes.value;
      const message = value.messages && value.messages[0];

      if (message) {
        const from = message.from;
        const text = message.text.body;

        // Resposta simples de confirmação de pedido
        await sendWhatsAppMessage(from, `Recebido! Em breve seu pedido estará a caminho.`);

        // Salvar pedido no Firestore
        await db.collection('pedidos').add({
          telefone: from,
          mensagem: text,
          status: 'Recebido',
          criadoEm: new Date()
        });
      }
    });
    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

// Função para responder via WhatsApp Cloud API
async function sendWhatsAppMessage(to, message) {
  await axios.post(
    'https://graph.facebook.com/v19.0/<YOUR_PHONE_NUMBER_ID>/messages',
    {
      messaging_product: 'whatsapp',
      to,
      text: { body: message }
    },
    {
      headers: {
        'Authorization': `Bearer <YOUR_WHATSAPP_TOKEN>`,
        'Content-Type': 'application/json'
      }
    }
  );
}

// Inicializar servidor
app.listen(PORT, () => {
  console.log(`Zupi backend rodando na porta ${PORT}`);
});
