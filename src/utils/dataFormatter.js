const moment = require('moment');

/**
 * kintoneのレコードデータをChatwork用にフォーマットする
 */
async function formatKintoneData(record, eventType, appId) {
  const eventTypeText = eventType === 'ADD_RECORD' ? '新規追加' : '更新';
  const timestamp = moment().format('YYYY/MM/DD HH:mm:ss');

  // レコード番号を取得
  const recordNumber = record['$id'] ? record['$id'].value : 'N/A';

  // AIを使わずに直接フィールドマッピングで表示
  const organizedData = organizeFieldsDirectly(record);

  // メッセージを構築
  let message = `[info][title]kintone レコード${eventTypeText}通知[/title]`;
  message += `レコード番号: ${recordNumber}\n`;
  message += `更新時刻: ${timestamp}\n\n`;

  // 整理されたデータを追加
  message += organizedData;

  message += '[/info]';

  return message;
}

/**
 * AIを使わずに直接フィールドマッピングで整理する
 */
function organizeFieldsDirectly(record) {
  const fieldMapping = {
    '会社名': '■ 会社名',
    '会社URL': '■ 会社URL',
    '文字列__1行__1': '■ 電話番号',
    'ドロップダウン': '■ 役職',
    '氏名': '■ 氏名',
    '携帯電話': '■ 携帯電話',
    'メールアドレス': '■ メールアドレス',
    '郵便番号': '■ 郵便番号',
    '日付': '■ 日付',
    '住所': '■ 住所',
    'イベント': '■ 申込みイベント',
    'code1': '■ 流入媒体',
    '日程希望1': '■ 日程【第1希望】',
    '日程希望2': '■ 日程【第2希望】',
    '日程希望3': '■ 日程【第3希望】',
    '課題感_0': '■ 課題感',
    '備考': '■ 備考',
    '業種': '■ 業種',
    '会社名カタカナ': '■ 会社名（カタカナ）',
    '氏名（カタカナ）': '■ 氏名（カタカナ）',
    'code': '■ 弊社記入欄',
    '文字列__お問い合わせ': '■ お問い合わせ内容'
  };

  const output = [];
  const mandatoryFields = ['code1', 'イベント', 'code']; // 必須表示フィールド

  // 必須フィールドを最初に処理（順序を保証）
  const processedFields = new Set();

  // 流入媒体（code1）を最初に処理
  if (record['code1']) {
    const value = formatFieldValue(record['code1']);
    if (value) {
      output.push(`■ 流入媒体: ${value}`);
    } else {
      output.push(`■ 流入媒体:`);
    }
    processedFields.add('code1');
  } else {
    output.push(`■ 流入媒体:`);
    processedFields.add('code1');
  }

  // 申込みイベントを処理
  if (record['イベント']) {
    const value = formatFieldValue(record['イベント']);
    if (value) {
      output.push(`■ 申込みイベント: ${value}`);
    } else {
      output.push(`■ 申込みイベント:`);
    }
    processedFields.add('イベント');
  } else {
    output.push(`■ 申込みイベント:`);
    processedFields.add('イベント');
  }

  // 弊社記入欄（code）を処理
  if (record['code']) {
    const value = formatFieldValue(record['code']);
    if (value) {
      output.push(`■ 弊社記入欄: ${value}`);
    } else {
      output.push(`■ 弊社記入欄:`);
    }
    processedFields.add('code');
  } else {
    output.push(`■ 弊社記入欄:`);
    processedFields.add('code');
  }

  // 残りのフィールドを処理
  for (const [fieldCode, label] of Object.entries(fieldMapping)) {
    if (processedFields.has(fieldCode)) {
      continue; // 既に処理済み
    }

    const field = record[fieldCode];

    if (field && field.value !== undefined && field.value !== null && field.value !== '') {
      let value = formatFieldValue(field);

      // 携帯電話と郵便番号は数字のみ
      if ((fieldCode === '携帯電話' || fieldCode === '郵便番号') && value) {
        value = value.replace(/[^0-9]/g, '');
      }

      // 日程の重複チェック
      if (fieldCode.startsWith('日程希望')) {
        const date1 = record['日程希望1']?.value;
        const date2 = record['日程希望2']?.value;
        const date3 = record['日程希望3']?.value;

        if (date1 === date2 && date2 === date3 && fieldCode !== '日程希望1') {
          continue; // 第1希望以外は表示しない
        }
      }

      // 携帯電話と電話番号の重複チェック
      if (fieldCode === '文字列__1行__1') {
        const phone = record['携帯電話']?.value;
        const tel = record['文字列__1行__1']?.value;
        if (phone && tel && phone === tel) {
          continue; // 電話番号は表示しない（携帯電話を優先）
        }
      }

      if (value) {
        output.push(`${label}: ${value}`);
      }
    }
  }

  return output.join('\n') + '\n';
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