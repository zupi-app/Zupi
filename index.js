// Backend do Zupi - Integrado ao WhatsApp e Firebase
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const admin = require('firebase-admin');
const app = express();
const PORT = process.env.PORT || 3000; // Usa a porta do Render ou 3000

// Middleware
app.use(bodyParser.json());

// Firebase Init
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://zupi-app.firebaseio.com'
});
const db = admin.firestore();

// Validação do Webhook (GET)
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === 'zupi_token') {
      console.log('✅ Webhook verificado com sucesso!');
      res.status(200).send(challenge);
    } else {
      console.log('❌ Token de verificação inválido.');
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
});

// Recebe mensagens (POST)
app.post('/webhook', async (req, res) => {
  console.log('📩 Recebido POST no /webhook');
  const body = req.body;

  if (body.object) {
    try {
      body.entry.forEach(async (entry) => {
        const changes = entry.changes[0];
        const value = changes.value;
        const message = value.messages && value.messages[0];

        if (message) {
          const from = message.from;
          const text = message.text.body;

          console.log(`📬 Mensagem recebida de ${from}: "${text}"`);

          // Enviar resposta automática
          await sendWhatsAppMessage(from, `Recebido! Em breve seu pedido estará a caminho.`);

          // Salvar no Firestore
          const doc = await db.collection('pedidos').add({
            telefone: from,
            mensagem: text,
            status: 'Recebido',
            criadoEm: new Date()
          });

          console.log(`✅ Pedido salvo no Firebase com ID: ${doc.id}`);
        } else {
          console.log('⚠️ Nenhuma mensagem encontrada no payload.');
        }
      });

      res.sendStatus(200);
    } catch (error) {
      console.error('❌ Erro ao processar mensagem:', error);
      res.sendStatus(500);
    }
  } else {
    console.log('⚠️ POST inválido. body.object ausente.');
    res.sendStatus(404);
  }
});

// Envia mensagem via WhatsApp
async function sendWhatsAppMessage(to, message) {
  try {
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
    console.log(`✅ Mensagem enviada para ${to}`);
  } catch (err) {
    console.error(`❌ Erro ao enviar mensagem para ${to}:`, err.message);
  }
}

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`🚀 Zupi backend rodando na porta ${PORT}`);
});
