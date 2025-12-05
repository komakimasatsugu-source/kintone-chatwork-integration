require('dotenv').config();
const express = require("express");
const https = require("https");
const querystring = require("querystring");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Chatwork API function
const sendToChatwork = async (message) => {
  return new Promise((resolve, reject) => {
    const data = querystring.stringify({
      body: message
    });

    const options = {
      hostname: 'api.chatwork.com',
      port: 443,
      path: `/v2/rooms/${process.env.CHATWORK_ROOM_ID}/messages`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(data),
        'X-ChatWorkToken': process.env.CHATWORK_API_TOKEN
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(responseData));
        } else {
          reject(new Error(`Chatwork API error: ${res.statusCode} ${responseData}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
};

// Format kintone data for Chatwork
const formatKintoneMessage = (kintoneData) => {
  let message = "【新しいお問い合わせが届きました】\n";
  message += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

  if (kintoneData.record) {
    const record = kintoneData.record;

    // Extract specific fields with Japanese labels
    const fieldMapping = {
      '会社名': record['会社名'] || record.company || record.companyName,
      '氏名': record['氏名'] || record.name || record.fullName,
      '携帯電話': record['携帯電話'] || record.phone || record.mobile,
      'メールアドレス': record['メールアドレス'] || record.email || record.mailAddress,
      'ドロップダウン': record['ドロップダウン'] || record.dropdown || record.position,
      'code1': record['code1'] || record.code,
  'お問い合わせ内容': record['文字列__お問い合わせ'] || record['お問い合わせ内容'] || record.inquiry || record.content
    };

    // Company and Contact Info
    message += "【お客様情報】\n";
    if (fieldMapping['会社名'] && fieldMapping['会社名'].value) {
      message += `会社名: ${fieldMapping['会社名'].value}\n`;
    }
    if (fieldMapping['氏名'] && fieldMapping['氏名'].value) {
      message += `氏名: ${fieldMapping['氏名'].value}\n`;
    }
    if (fieldMapping['ドロップダウン'] && fieldMapping['ドロップダウン'].value) {
      message += `役職: ${fieldMapping['ドロップダウン'].value}\n`;
    }
    message += "\n";

    // Contact Details
    message += "【連絡先】\n";
    if (fieldMapping['携帯電話'] && fieldMapping['携帯電話'].value) {
      message += `携帯電話: ${fieldMapping['携帯電話'].value}\n`;
    }
    if (fieldMapping['メールアドレス'] && fieldMapping['メールアドレス'].value) {
      message += `メール: ${fieldMapping['メールアドレス'].value}\n`;
    }
    message += "\n";

    // Code/Source
    if (fieldMapping['code1'] && fieldMapping['code1'].value) {
      message += "【参照コード】\n";
      message += `Code: ${fieldMapping['code1'].value}\n\n`;
    }

      // Inquiry Content (always display)
      message += "【お問い合わせ内容】\n";
      if (fieldMapping['お問い合わせ内容'] && fieldMapping['お問い合わせ内容'].value) {
        message += `${fieldMapping['お問い合わせ内容'].value}\n\n`;
      } else {
        message += "未記入\n\n";
      }

    // 日程希望（必ず表示）
    message += "【日程希望】\n";
    const formatDateTime = (isoString) => {
      if (!isoString) return '未入力';
      // 日本時間で表示
      const date = new Date(isoString);
      return date.toLocaleString('ja-JP', {
        timeZone: 'Asia/Tokyo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    };
    // kintoneのフィールドコード: datetime, datetime_1, datetime_1_1
    const datetime1 = record['datetime'] ? record['datetime'].value : '';
    const datetime2 = record['datetime_1'] ? record['datetime_1'].value : '';
    const datetime3 = record['datetime_1_1'] ? record['datetime_1_1'].value : '';
    message += `第1希望: ${formatDateTime(datetime1)}\n`;
    message += `第2希望: ${formatDateTime(datetime2)}\n`;
    message += `第3希望: ${formatDateTime(datetime3)}\n\n`;

    // Record Info
    const recordId = record.レコード番号 ? record.レコード番号.value :
                    record.$id ? record.$id.value : "不明";

    message += "【システム情報】\n";
    message += `レコードID: ${recordId}\n`;
    message += `受信日時: ${new Date().toLocaleString('ja-JP', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })}\n`;

  } else {
    message += `データ: ${JSON.stringify(kintoneData, null, 2)}`;
  }

  message += "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━";
  return message;
};

// Health check endpoint
app.get("/health", (req, res) => {
  console.log("Health check requested");
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    port: PORT,
    chatworkConfigured: !!(process.env.CHATWORK_API_TOKEN && process.env.CHATWORK_ROOM_ID)
  });
});

// Webhook endpoint
app.post("/webhook/kintone", async (req, res) => {
  try {
    console.log("Webhook received:", JSON.stringify(req.body, null, 2));

    // デバッグ: 日程関連フィールドを確認
    if (req.body.record) {
      const record = req.body.record;
      console.log("=== 日程フィールドデバッグ ===");
      console.log("全フィールドコード:", Object.keys(record));
      console.log("datetime:", JSON.stringify(record['datetime']));
      console.log("datetime_1:", JSON.stringify(record['datetime_1']));
      console.log("datetime_1_1:", JSON.stringify(record['datetime_1_1']));
      // 日程を含むフィールドを検索
      Object.keys(record).forEach(key => {
        if (key.toLowerCase().includes('date') || key.includes('日程')) {
          console.log(`${key}:`, JSON.stringify(record[key]));
        }
      });
    }

    // Create formatted message for Chatwork
    const message = formatKintoneMessage(req.body);

    // Send to Chatwork
    if (process.env.CHATWORK_API_TOKEN && process.env.CHATWORK_ROOM_ID) {
      try {
        const chatworkResult = await sendToChatwork(message);
        console.log("Chatwork message sent:", chatworkResult);

        res.json({
          status: "success",
          message: "Webhook processed and sent to Chatwork",
          timestamp: new Date().toISOString(),
          chatworkMessageId: chatworkResult.message_id
        });
      } catch (chatworkError) {
        console.error("Chatwork error:", chatworkError);
        res.json({
          status: "partial_success",
          message: "Webhook received but Chatwork sending failed",
          error: chatworkError.message,
          timestamp: new Date().toISOString()
        });
      }
    } else {
      console.log("Chatwork not configured - missing API token or room ID");
      res.json({
        status: "success",
        message: "Webhook received (Chatwork not configured)",
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error("Webhook processing error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Test Chatwork endpoint
app.post("/test/chatwork", async (req, res) => {
  try {
    const testMessage = "【テストモッセージ】\n\nkintone-Chatwork連携が正常に動作しています！";
    const result = await sendToChatwork(testMessage);
    res.json({
      status: "success",
      message: "Test message sent to Chatwork",
      chatworkResponse: result
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to send test message",
      error: error.message
    });
  }
});

// Test formatted message endpoint
app.post("/test/format", async (req, res) => {
  try {
    // Sample data based on your example
    const sampleData = {
      record: {
        "会社名": { value: "株式会社グッドラフ" },
        "氏名": { value: "小巻正継" },
        "携帯電話": { value: "08044234983" },
        "メールアドレス": { value: "mkomaki@goodlaugh.co.jp" },
        "ドロップダウン": { value: "代表者" },
        "code1": { value: "冷凍技術成功事例ハンドブックLP" },
        "お問い合わせ内容": { value: "" },
        "レコード番号": { value: "1" }
      }
    };

    const message = formatKintoneMessage(sampleData);
    const result = await sendToChatwork(message);

    res.json({
      status: "success",
      message: "Formatted test message sent to Chatwork",
      chatworkResponse: result,
      formattedMessage: message
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to send formatted test message",
      error: error.message
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Webhook URL: http://localhost:${PORT}/webhook/kintone`);
  console.log(`Test Chatwork: http://localhost:${PORT}/test/chatwork`);
  console.log(`Test Format: http://localhost:${PORT}/test/format`);
  console.log(`Chatwork configured: ${!!(process.env.CHATWORK_API_TOKEN && process.env.CHATWORK_ROOM_ID)}`);
});
