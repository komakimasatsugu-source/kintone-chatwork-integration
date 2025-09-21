const moment = require('moment');
const { organizeData } = require('../services/aiService');

/**
 * kintoneのレコードデータをChatwork用にフォーマットする
 */
async function formatKintoneData(record, eventType, appId) {
  const eventTypeText = eventType === 'ADD_RECORD' ? '新規追加' : '更新';
  const timestamp = moment().format('YYYY/MM/DD HH:mm:ss');

  // レコード番号を取得
  const recordNumber = record['$id'] ? record['$id'].value : 'N/A';

  // AIによるデータ整理を試行
  const aiOrganizedData = await organizeData(record);

  // メッセージを構築
  let message = `[info][title]kintone レコード${eventTypeText}通知[/title]`;
  message += `アプリID: ${appId}\n`;
  message += `レコード番号: ${recordNumber}\n`;
  message += `更新時刻: ${timestamp}\n\n`;

  // AIで整理されたデータがある場合はそれを使用
  if (aiOrganizedData) {
    message += `【AIで整理されたデータ】\n`;
    message += `${aiOrganizedData}\n`;
  } else {
    // AIが利用できない場合は従来の方式を使用
    const mainFields = extractMainFields(record);
    if (mainFields.length > 0) {
      message += `【主要フィールド】\n`;
      mainFields.forEach(field => {
        message += `${field.label}: ${field.value}\n`;
      });
    }
  }

  message += '[/info]';

  return message;
}

/**
 * レコードから主要なフィールドを抽出する
 */
function extractMainFields(record) {
  const fields = [];
  const priorityFields = ['タイトル', 'title', '件名', 'subject', '名前', 'name', '状態', 'status'];

  // 優先フィールドから検索
  priorityFields.forEach(fieldName => {
    if (record[fieldName] && record[fieldName].value) {
      fields.push({
        label: fieldName,
        value: formatFieldValue(record[fieldName])
      });
    }
  });

  // 優先フィールドが見つからない場合、最初の5つのフィールドを取得
  if (fields.length === 0) {
    const allFields = Object.keys(record).filter(key => !key.startsWith('$'));
    allFields.slice(0, 5).forEach(fieldName => {
      if (record[fieldName] && record[fieldName].value !== undefined) {
        fields.push({
          label: fieldName,
          value: formatFieldValue(record[fieldName])
        });
      }
    });
  }

  return fields;
}

/**
 * フィールドの値をフォーマットする
 */
function formatFieldValue(field) {
  if (!field || field.value === undefined) {
    return '';
  }

  const value = field.value;

  // 配列の場合（チェックボックス、マルチ選択など）
  if (Array.isArray(value)) {
    return value.map(item => typeof item === 'object' ? item.value || item : item).join(', ');
  }

  // オブジェクトの場合（ユーザー、組織など）
  if (typeof value === 'object' && value !== null) {
    return value.name || value.value || JSON.stringify(value);
  }

  // 文字列や数値の場合
  return String(value);
}

module.exports = {
  formatKintoneData,
  extractMainFields,
  formatFieldValue
};