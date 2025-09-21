module.exports = (req, res) => {
  try {
    console.log("Webhook received:", req.body);
    
    // 基本的なe��答
    res.json({
      status: "success",
      message: "Webhook received successfully",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({
      status: "error", 
      message: "Internal server error"
    });
  }
};
