const express = require('express');
const dotenv = require('dotenv');
const webhookHandler = require('./handlers/webhookHandler');
const { validateConfig } = require('./utils/config');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ミドルウェア
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ログ出力ミドルウェア
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ヘルスチェック
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// kintoneからのWebhook受信エンドポイント
app.post('/webhook/kintone', webhookHandler);

// エラーハンドリング
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// 404ハンドリング
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// サーバー起動前の設定チェック
if (!validateConfig()) {
  console.error('設定が不正です。.envファイルを確認してください。');
  process.exit(1);
}

app.listen(PORT, () => {
  console.log(`サーバーがポート ${PORT} で起動しました`);
  console.log(`Webhook URL: http://localhost:${PORT}/webhook/kintone`);
});