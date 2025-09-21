const validateConfig = () => {
  // Railway環境では一時的に設定チェックをスキップ
  console.log("Configuration validation skipped for Railway deployment");
  return true;
};

module.exports = {
  validateConfig
};
