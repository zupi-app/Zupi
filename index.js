const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const admin = require('firebase-admin');
const app = express();
const PORT = 3000;

app.use(bodyParser.json());

// Firebase Init
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://zupi-app.firebaseio.com'
});
const db = admin.firestore();

// Rota de teste para UptimeRobot
app.get('/', (req, res) => {
  res.status(200).send('Zupi backend está online!');
});

// Webhook de verificação
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === 'zupi_token') {
      console.log('Webhook verificado!');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
});

// Webhook de mensagens
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

        await sendWhatsAppMessage(from, `Recebido! Em breve seu pedido estará a caminho.`);

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

// Enviar mensagem pelo WhatsApp API
async function sendWhatsAppMessage(to, message) {
  await axios.post(
    'https://graph.facebook.com/v19.0/653861894475229/messages',
    {
      messaging_product: 'whatsapp',
      to,
      text: { body: message }
    },
    {
      headers: {
        Authorization: 'Bearer 551489941343709|QHDu04u6Fcjml25HebZonStvu6w',
        'Content-Type': 'application/json'
      }
    }
  );
}

app.listen(PORT, () => {
  console.log(`Zupi backend rodando na porta ${PORT}`);
});
