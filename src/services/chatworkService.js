const axios = require('axios');

/**
 * Chatworkにメッセージを投稿する
 */
async function postToChatwork(message) {
  const apiToken = process.env.CHATWORK_API_TOKEN;
  const roomId = process.env.CHATWORK_ROOM_ID;

  if (!apiToken || !roomId) {
    throw new Error('Chatwork API設定が不足しています。CHATWORK_API_TOKENとCHATWORK_ROOM_IDを設定してください。');
  }

  const url = `https://api.chatwork.com/v2/rooms/${roomId}/messages`;

  try {
    const response = await axios.post(
      url,
      new URLSearchParams({
        body: message
      }),
      {
        headers: {
          'X-ChatWorkToken': apiToken,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 10000 // 10秒でタイムアウト
      }
    );

    console.log('Chatwork投稿成功:', response.data);
    return response.data;

  } catch (error) {
    console.error('Chatwork投稿エラー:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });

    throw new Error(`Chatwork投稿に失敗しました: ${error.message}`);
  }
}

/**
 * Chatwork APIの接続テスト
 */
async function testChatworkConnection() {
  const apiToken = process.env.CHATWORK_API_TOKEN;

  if (!apiToken) {
    throw new Error('CHATWORK_API_TOKENが設定されていません');
  }

  try {
    const response = await axios.get('https://api.chatwork.com/v2/me', {
      headers: {
        'X-ChatWorkToken': apiToken
      },
      timeout: 5000
    });

    console.log('Chatwork接続テスト成功:', response.data);
    return true;

  } catch (error) {
    console.error('Chatwork接続テスト失敗:', error.message);
    return false;
  }
}

module.exports = {
  postToChatwork,
  testChatworkConnection
};