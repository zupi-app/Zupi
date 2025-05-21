// index.js - Backend do Zupi

const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const admin = require('firebase-admin');

const app = express();
const PORT = process.env.PORT || 10000; // Porta recomendada para Render

// Middleware
app.use(bodyParser.json());

// Inicializa Firebase com o arquivo serviceAccountKey.json
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://zupi-app.firebaseio.com'
});
const db = admin.firestore();

// Endpoint para verificação do webhook (GET)
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === 'zupi_token') {
    console.log('✅ Webhook verificado com sucesso!');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Endpoint para receber mensagens (POST)
app.post('/webhook', async (req, res) => {
  const body = req.body;

  if (body.object) {
    for (const entry of body.entry || []) {
      const changes = entry.changes[0];
      const value = changes.value;
      const message = value.messages && value.messages[0];

      if (message) {
        const from = message.from;
        const text = message.text?.body;

        console.log(`📬 Mensagem recebida de ${from}: ${text}`);

        // Tenta responder no WhatsApp
        try {
          await sendWhatsAppMessage(from, 'Recebido! Em breve seu pedido estará a caminho.');
        } catch (err) {
          console.error('❌ Erro ao enviar mensagem:', err.response?.data || err.message);
        }

        // Tenta salvar no Firestore
        try {
          await db.collection('pedidos').add({
            telefone: from,
            mensagem: text,
            status: 'Recebido',
            criadoEm: new Date()
          });
          console.log('📦 Pedido salvo no Firestore');
        } catch (err) {
          console.error('❌ Erro ao salvar no Firestore:', err.message);
        }
      }
    }

    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

// Envia mensagem de texto pelo WhatsApp Cloud API
async function sendWhatsAppMessage(to, message) {
  await axios.post(
    'https://graph.facebook.com/v17.0/653861894475229/messages', // Substitua se o ID mudar
    {
      messaging_product: 'whatsapp',
      to,
      text: { body: message }
    },
    {
      headers: {
        Authorization: 'Bearer EAAH1k8INDd0BO8nUi1ntlx5396PBC7KyofmjFDqBWSMddskDEVf4CzWOUItWGR2jJT2OuOdlIQu7OsITbSyw3ki5MNkGauHsjm5aKZCuZBfT5U782VrkN9XioeV9bxtLO3fpY6HyFK9Q0FZCGqAjXhoXXZAjaHwkuW3EeaicVLj1uuosY8pgfnVjENl0CC9gqXKTAkFHnIXXnAI8FY6H0TmWrcoZD',
        'Content-Type': 'application/json'
      }
    }
  );
}

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`🚀 Zupi backend rodando na porta ${PORT}`);
});

