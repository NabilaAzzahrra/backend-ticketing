module.exports = (req, res, next) => {
  const apiKey = req.headers["lp3i-api-key"];

  if (!apiKey) {
    return res.status(401).json({
      message: "API Key tidak ditemukan",
    });
  }

  if (apiKey !== process.env.LP3I_API_KEY) {
    return res.status(403).json({
      message: "API Key tidak valid",
    });
  }
  console.log("API KEY HEADER:", apiKey);
  console.log("API KEY ENV:", process.env.LP3I_API_KEY);
  next();
};
