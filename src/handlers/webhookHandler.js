const { formatKintoneData } = require('../utils/dataFormatter');
const { postToChatwork } = require('../services/chatworkService');

/**
 * kintoneからのWebhookを処理する
 */
async function webhookHandler(req, res) {
  try {
    console.log('Webhook受信:', JSON.stringify(req.body, null, 2));

    // リクエストボディの基本チェック
    if (!req.body || !req.body.record) {
      console.error('無効なWebhookデータ: recordが見つかりません');
      return res.status(400).json({ error: 'Invalid webhook data' });
    }

    const { type, record, appId } = req.body;

    // イベントタイプの確認
    if (!['ADD_RECORD', 'UPDATE_RECORD'].includes(type)) {
      console.log(`スキップ: サポートされていないイベントタイプ ${type}`);
      return res.status(200).json({ message: 'Event type not supported' });
    }

    // データのフォーマット（AI整理を含む）
    const formattedMessage = await formatKintoneData(record, type, appId);

    // Chatworkに投稿
    await postToChatwork(formattedMessage);

    console.log('Chatworkへの投稿が完了しました');
    res.status(200).json({ message: 'Success' });

  } catch (error) {
    console.error('Webhook処理エラー:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = webhookHandler;