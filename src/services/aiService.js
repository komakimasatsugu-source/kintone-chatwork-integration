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

★★★ 絶対条件 ★★★
1. code1フィールドの値は必ず「■ 流入媒体:」として出力してください
2. 申込みイベントと弊社記入欄も必ず表示してください

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
- "文字列__1行__1" → 電話番号
- "ドロップダウン" → 役職
- "氏名" → 氏名
- "携帯電話" → 携帯電話（数字のみで出力）
- "メールアドレス" → メールアドレス
- "郵便番号" → 郵便番号（数字のみで出力）
- "日付" → 日付
- "住所" → 住所
- "イベント" → 申込みイベント
- "code1" → 流入媒体
- "日程希望1" → 日程【第1希望】
- "日程希望2" → 日程【第2希望】
- "日程希望3" → 日程【第3希望】
- "課題感_0" → 課題感
- "備考" → 備考
- "業種" → 業種
- "会社名カタカナ" → 会社名（カタカナ）
- "氏名（カタカナ）" → 氏名（カタカナ）
- "弊社記入用" → 弊社記入欄
- "文字列__お問い合わせ" → お問い合わせ内容（1文字も編集せずそのまま記載）

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
■ 会社名（カタカナ）: [値]
■ 氏名（カタカナ）: [値]
■ 弊社記入欄: [値]
■ お問い合わせ内容: [元の内容をそのまま記載]

【重要な出力条件】
1. 値が空文字("")、null、undefined、空配列[]、または存在しない項目は絶対に出力しないでください（ただし申込みイベント、流入媒体、弊社記入欄は例外として必ず出力）
2. 携帯電話と電話番号が同じ値の場合は、携帯電話のみを出力してください
3. 日程【第1希望】、【第2希望】、【第3希望】が同じ値の場合は、第1希望のみを出力してください
4. 課題感、業種、会社名（カタカナ）、氏名（カタカナ）、お問い合わせ内容が空文字("")、null、undefined、または存在しない場合は行自体を絶対に出力しないでください
5. 弊社記入欄は値の有無に関わらず必ず出力してください（値がない場合は空欄で出力）
6. 申込みイベント、流入媒体は値の有無に関わらず必ず出力してください（値がない場合は空欄で出力）
7. 特に流入媒体は絶対に省略せず、必ず「■ 流入媒体:」の行を出力してください
8. 重要：code1フィールドに「冷凍技術成功事例ハンドブックLP」などの値がある場合、必ず「■ 流入媒体: 冷凍技術成功事例ハンドブックLP」として出力してください
9. 絶対条件：流入媒体の行は他のすべての条件より優先して必ず出力してください
10. kintoneのレコードデータそのものは絶対に出力しないでください
11. フィールドの値のみを出力し、フィールドの構造情報は出力しないでください
12. 出力形式以外の内容は一切出力しないでください
13. 「【AIで整理されたデータ】」というヘッダーは出力しないでください

例：携帯電話が"08044234983"で電話番号も"08044234983"の場合、携帯電話のみ出力
例：日程が全て"2025-09-21T06:34:00Z"の場合、第1希望のみ出力
例：課題感が空の場合、"■ 課題感:" の行自体を出力しない
例：お問い合わせ内容が空文字("")、null、またはundefinedの場合、"■ お問い合わせ内容:" の行自体を絶対に出力しない
例：流入媒体が空でも「■ 流入媒体:」の行は必ず出力する
例：code1フィールドが「冷凍技術成功事例ハンドブックLP」の場合、「■ 流入媒体: 冷凍技術成功事例ハンドブックLP」を必ず出力する
例：弊社記入欄が空でも「■ 弊社記入欄:」の行は必ず出力する（例：冷凍技術成功事例ハンドブックLP）`;
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