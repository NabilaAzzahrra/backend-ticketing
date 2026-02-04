const axios = require("axios");
const FormData = require("form-data");

const sendTelegramTicket = async ({ text, photo }) => {
  const token = process.env.TELEGRAM_BOT_TOKEN_1;
  const chatId = process.env.TELEGRAM_CHAT_ID_1;

  if (!token || !chatId) return;

  try {
    // 🟢 KIRIM FOTO + CAPTION
    if (photo) {
      const form = new FormData();
      form.append("chat_id", chatId);
      form.append("caption", text);
      form.append("parse_mode", "HTML");
      form.append("photo", photo.buffer, {
        filename: photo.originalname,
        contentType: photo.mimetype,
      });

      await axios.post(
        `https://api.telegram.org/bot${token}/sendPhoto`,
        form,
        { headers: form.getHeaders() }
      );
    } 
    // 🔵 KIRIM TEXT SAJA
    else {
      await axios.post(
        `https://api.telegram.org/bot${token}/sendMessage`,
        {
          chat_id: chatId,
          text,
          parse_mode: "HTML",
        }
      );
    }
  } catch (error) {
    console.error(
      "Telegram error:",
      error.response?.data || error.message
    );
  }
};

module.exports = sendTelegramTicket;
