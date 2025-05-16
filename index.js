// index.js - Backend do Zupi

const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const admin = require('firebase-admin');
const app = express();
const PORT = process.env.PORT || 10000; // Usar porta 10000 para Render

// Middleware
app.use(bodyParser.json());

// Firebase - inicializa com chave do serviceAccountKey.json
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://zupi-app.firebaseio.com'
});
const db = admin.firestore();

// Webhook - validação GET para o Facebook/Meta
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === 'zupi_token') {
    console.log('Webhook verificado!');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Webhook - recebimento de mensagens POST
app.post('/webhook', async (req, res) => {
  const body = req.body;

  if (body.object) {
    for (const entry of body.entry) {
      const changes = entry.changes[0];
      const value = changes.value;
      const message = value.messages && value.messages[0];

      if (message) {
        const from = message.from;
        const text = message.text?.body;
        console.log(`📬 Mensagem recebida de ${from}: ${text}`);

        // Enviar resposta automática
        try {
          await sendWhatsAppMessage(from, 'Recebido! Em breve seu pedido estará a caminho.');
        } catch (err) {
          console.error('Erro ao enviar mensagem:', err.response?.data || err);
        }

        // Salvar no Firestore
        try {
          await db.collection('pedidos').add({
            telefone: from,
            mensagem: text,
            status: 'Recebido',
            criadoEm: new Date()
          });
        } catch (err) {
          console.error('Erro ao salvar no Firestore:', err);
        }
      }
    }
    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

// Envia mensagem de texto no WhatsApp
async function sendWhatsAppMessage(to, message) {
  await axios.post(
    'https://graph.facebook.com/v17.0/<YOUR_PHONE_NUMBER_ID>/messages', // Substitua pelo seu ID
    {
      messaging_product: 'whatsapp',
      to,
      text: { body: message }
    },
    {
      headers: {
        Authorization: 'Bearer <YOUR_ACCESS_TOKEN>', // Substitua pelo token de acesso
        'Content-Type': 'application/json'
      }
    }
  );
}

// Inicia servidor
app.listen(PORT, () => {
  console.log(`🚀 Zupi backend rodando na porta ${PORT}`);
});

