const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  console.log("Health check requested");
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Webhook endpoint
app.post("/webhook/kintone", (req, res) => {
  console.log("Webhook received:", req.body);
  res.json({
    status: "success",
    message: "Webhook received successfully",
    timestamp: new Date().toISOString()
  });
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
});
