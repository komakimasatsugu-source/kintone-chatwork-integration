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

    // Create message for Chatwork
    const kintoneData = req.body;
    let message = "📋 Kintone更新通知\n\n";

    if (kintoneData.record) {
      const record = kintoneData.record;
      const recordId = record.レコード番号 ? record.レコード番号.value : "不明";
      message += `レコードID: ${recordId}\n`;
      message += `更新日時: ${new Date().toLocaleString('ja-JP')}\n\n`;

      // Add other fields
      Object.keys(record).forEach(key => {
        if (!key.startsWith('$') && record[key] && record[key].value) {
          message += `${key}: ${record[key].value}\n`;
        }
      });
    } else {
      message += `データ: ${JSON.stringify(kintoneData, null, 2)}`;
    }

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
    const testMessage = "🧪 テストメッセージ\n\nkintone-Chatwork連携が正常に動作しています！";
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
  console.log(`Chatwork configured: ${!!(process.env.CHATWORK_API_TOKEN && process.env.CHATWORK_ROOM_ID)}`);
});