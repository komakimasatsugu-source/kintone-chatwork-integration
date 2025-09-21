/**
 * 設定の検証
 */
function validateConfig() {
  const requiredEnvVars = [
    'CHATWORK_API_TOKEN',
    'CHATWORK_ROOM_ID'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error('以下の環境変数が設定されていません:');
    missingVars.forEach(varName => {
      console.error(`- ${varName}`);
    });
    return false;
  }

  console.log('設定の検証が完了しました');
  return true;
}

/**
 * 設定情報を表示（機密情報は隠す）
 */
function showConfig() {
  console.log('現在の設定:');
  console.log(`- PORT: ${process.env.PORT || 3000}`);
  console.log(`- NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log(`- CHATWORK_API_TOKEN: ${process.env.CHATWORK_API_TOKEN ? '設定済み' : '未設定'}`);
  console.log(`- CHATWORK_ROOM_ID: ${process.env.CHATWORK_ROOM_ID || '未設定'}`);
  console.log(`- KINTONE_DOMAIN: ${process.env.KINTONE_DOMAIN || '未設定'}`);
  console.log(`- KINTONE_APP_ID: ${process.env.KINTONE_APP_ID || '未設定'}`);
}

module.exports = {
  validateConfig,
  showConfig
};