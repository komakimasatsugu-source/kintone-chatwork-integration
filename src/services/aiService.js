const axios = require('axios');

/**
 * OpenAI APIを使用してkintoneデータを整理する
 */
async function organizeDataWithAI(record) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.log('OpenAI APIキーが設定されていません。AIによる整理をスキップします。');
    return null;
  }

  try {
    const prompt = createPrompt(record);

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `あなたはkintoneのデータを整理する専門のアシスタントです。
指定された項目のみを抽出し、値が存在する項目のみを返してください。
値が空文字("")、null、undefined、または存在しない項目は一切出力しないでください。
問い合わせ内容は1文字も編集せず、元の内容をそのまま記載してください。
携帯電話と郵便番号は数字のみで記載してください。
勝手な追記、説明、コメントは一切追加しないでください。
指定された出力形式以外の内容は絶対に出力しないでください。`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.1
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    return response.data.choices[0].message.content;

  } catch (error) {
    console.error('AI整理エラー:', error.response?.data || error.message);
    return null;
  }
}

/**
 * AIに送信するプロンプトを作成
 */
function createPrompt(record) {
  const recordData = JSON.stringify(record, null, 2);

  return `以下のkintoneレコードデータから、記載がある項目のみを抽出してください。

【kintoneフィールドコードと対応する項目】
- "会社名" → 会社名
- "会社URL" → 会社URL
- "電話番号" → 電話番号
- "役職" → 役職
- "氏名" → 氏名
- "携帯電話" → 携帯電話（数字のみで出力）
- "メールアドレス" → メールアドレス
- "郵便番号" → 郵便番号（数字のみで出力）
- "日付" → 日付
- "住所" → 住所
- "申込みイベント" → 申込みイベント
- "流入媒体" → 流入媒体
- "日程【第1希望】" → 日程【第1希望】
- "日程【第2希望】" → 日程【第2希望】
- "日程【第3希望】" → 日程【第3希望】
- "課題感" → 課題感
- "備考" → 備考
- "業種" → 業種
- "輸出実績" → 輸出実績
- "輸出支援あればやってみたい" → 輸出支援あればやってみたい
- "竣工希望時期" → 竣工希望時期
- "土地の有無" → 土地の有無
- "予定地を確保されていますか" → 予定地を確保されていますか
- "建築計画の進捗状況" → 建築計画の進捗状況
- "会社名（カタカナ）" → 会社名（カタカナ）
- "氏名（カタカナ）" → 氏名（カタカナ）
- "弊社記入欄" → 弊社記入欄
- "お問い合わせ内容" → お問い合わせ内容（1文字も編集せずそのまま記載）

【kintoneレコードデータ】
${recordData}

【出力形式】
記載がある項目のみを以下の形式で出力してください：

■ 会社名: [値]
■ 会社URL: [値]
■ 電話番号: [値]
■ 役職: [値]
■ 氏名: [値]
■ 携帯電話: [数字のみ]
■ メールアドレス: [値]
■ 郵便番号: [数字のみ]
■ 日付: [値]
■ 住所: [値]
■ 申込みイベント: [値]
■ 流入媒体: [値]
■ 日程【第1希望】: [値]
■ 日程【第2希望】: [値]
■ 日程【第3希望】: [値]
■ 課題感: [値]
■ 備考: [値]
■ 業種: [値]
■ 輸出実績: [値]
■ 輸出支援あればやってみたい: [値]
■ 竣工希望時期: [値]
■ 土地の有無: [値]
■ 予定地を確保されていますか: [値]
■ 建築計画の進捗状況: [値]
■ 会社名（カタカナ）: [値]
■ 氏名（カタカナ）: [値]
■ 弊社記入欄: [値]
■ お問い合わせ内容: [元の内容をそのまま記載]

重要：値が空文字、null、undefinedまたは存在しない項目は絶対に出力しないでください。
例：もし"会社URL"が空文字の場合、"■ 会社URL:" の行自体を出力してはいけません。`;
}

/**
 * Claude APIを使用する場合の実装（オプション）
 */
async function organizeDataWithClaude(record) {
  const apiKey = process.env.CLAUDE_API_KEY;

  if (!apiKey) {
    console.log('Claude APIキーが設定されていません。');
    return null;
  }

  try {
    const prompt = createPrompt(record);

    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-3-haiku-20240307',
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      },
      {
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        timeout: 30000
      }
    );

    return response.data.content[0].text;

  } catch (error) {
    console.error('Claude整理エラー:', error.response?.data || error.message);
    return null;
  }
}

/**
 * 設定に応じてAIサービスを選択
 */
async function organizeData(record) {
  const aiProvider = process.env.AI_PROVIDER || 'openai';

  switch (aiProvider.toLowerCase()) {
    case 'claude':
      return await organizeDataWithClaude(record);
    case 'openai':
    default:
      return await organizeDataWithAI(record);
  }
}

module.exports = {
  organizeData,
  organizeDataWithAI,
  organizeDataWithClaude
};