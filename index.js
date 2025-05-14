
// Backend do Zupi - Integrado ao WhatsApp e Firebase
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const admin = require('firebase-admin');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());

// Firebase Init com URL correta
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://zupi-app.firebaseio.com'
});
const db = admin.firestore();

// Webhook do WhatsApp
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

        // Resposta automática
        await sendWhatsAppMessage(from, `Recebido! Em breve seu pedido estará a caminho.`);

        // Salvar no Firestore
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

// Envio de mensagem com token e phone number ID corretos
async function sendWhatsAppMessage(to, message) {
  await axios.post(
    'https://graph.facebook.com/v19.0/105619019326589/messages',
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

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Zupi backend rodando na porta ${PORT}`);
});
