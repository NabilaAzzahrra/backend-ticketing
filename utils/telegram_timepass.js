import axios from "axios";
import FormData from "form-data";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN_2;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID_2;

if (!BOT_TOKEN || !CHAT_ID) {
  throw new Error("❌ Telegram ENV belum terbaca");
}

export const sendTelegramPhoto = async (base64Image, caption = "") => {
  const buffer = Buffer.from(
    base64Image.replace(/^data:image\/\w+;base64,/, ""),
    "base64"
  );

  const form = new FormData();
  form.append("chat_id", CHAT_ID);
  form.append("photo", buffer, { filename: "checkin.jpg" });
  if (caption) form.append("caption", caption);

  await axios.post(
    `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`,
    form,
    { headers: form.getHeaders() }
  );
};
