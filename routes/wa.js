const express = require("express");
const router = express.Router();
const apiKey = require("../middleware/apiKey");
const { getQR, isReady } = require("../utils/whatsapp");

router.get("/qr", (req, res) => {
  if (isReady()) {
    return res.json({
      connected: true,
      message: "WhatsApp sudah terhubung",
    });
  }

  const qr = getQR();

  if (!qr) {
    return res.json({
      connected: false,
      message: "Menunggu QR...",
    });
  }

  res.json({
    connected: false,
    qr,
  });
});

module.exports = router;
