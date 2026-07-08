const express = require('express');
const cors = require('cors');
const os = require('os');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { getDb, saveDb } = require('./database.cjs');

let secretKey = null;

function getSecretKey(userDataPath) {
  if (secretKey) return secretKey;
  const keyPath = path.join(userDataPath, 'sync_secret.key');
  if (fs.existsSync(keyPath)) {
    secretKey = fs.readFileSync(keyPath, 'utf8');
  } else {
    secretKey = crypto.randomBytes(32).toString('hex');
    fs.writeFileSync(keyPath, secretKey);
  }
  return secretKey;
}

function encrypt(text, secret) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(secret, 'hex'), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text, secret) {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(secret, 'hex'), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

function startSyncServer(port = 14205) {
  const server = express();
  server.use(cors());
  server.use(express.json({ limit: '50mb' }));

  server.get('/api/status', (_req, res) => {
    res.json({
      status: 'online',
      device: os.hostname(),
      ip: getLocalIp(),
      port,
    });
  });

  server.get('/api/sync', (req, res) => {
    try {
      const db = getDb();
      const tables = ['reminders', 'events', 'transactions', 'budgets', 'notes', 'projects', 'shopping_list', 'courses', 'study_log'];
      const exportData = {};
      for (const t of tables) { 
        const result = db.exec(`SELECT * FROM ${t} WHERE deleted_at IS NULL OR deleted_at IS NOT NULL`);
        exportData[t] = result.length > 0 ? result[0] : null; 
      }
      
      const payloadString = JSON.stringify(exportData);
      const encrypted = encrypt(payloadString, secretKey);
      res.json({ payload: encrypted });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  server.post('/api/sync', (req, res) => {
    try {
      const { payload } = req.body;
      if (!payload) return res.status(400).json({ error: 'No payload' });
      
      const decryptedString = decrypt(payload, secretKey);
      const incomingData = JSON.parse(decryptedString);
      
      const db = getDb();
      let applied = 0;
      
      // Basic Last-Write-Wins Merge
      for (const table of Object.keys(incomingData)) {
        const tableData = incomingData[table];
        if (!tableData || !tableData.values) continue;
        
        const cols = tableData.columns;
        const idIdx = cols.indexOf('id');
        const updatedIdx = cols.indexOf('updated_at');
        
        for (const row of tableData.values) {
          const id = row[idIdx];
          const updated_at = row[updatedIdx];
          
          const existing = db.exec(`SELECT updated_at FROM ${table} WHERE id = ?`, [id]);
          let shouldInsertOrUpdate = false;
          
          if (existing.length === 0) {
            shouldInsertOrUpdate = true;
          } else if (existing[0].values.length > 0) {
            const localUpdated = existing[0].values[0][0];
            if (new Date(updated_at) > new Date(localUpdated)) {
              shouldInsertOrUpdate = true;
            }
          }
          
          if (shouldInsertOrUpdate) {
            db.exec(`DELETE FROM ${table} WHERE id = ?`, [id]);
            const placeholders = cols.map(() => '?').join(',');
            db.run(`INSERT INTO ${table} (${cols.join(',')}) VALUES (${placeholders})`, row);
            applied++;
          }
        }
      }
      saveDb();
      res.json({ message: 'Sync complete', applied });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`Sync server running on http://${getLocalIp()}:${port}`);
  });
}

module.exports = { startSyncServer, getLocalIp, getSecretKey };
