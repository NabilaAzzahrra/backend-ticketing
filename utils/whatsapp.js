const path = require("path");
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} = require("@whiskeysockets/baileys");

const qrcode = require("qrcode-terminal");

const authPath = path.join(process.cwd(), "baileys_auth");

let sock;
let isReady = false;
let qrCode = null;
let isInitializing = false;

/* ================= FORMAT NOMOR ================= */
const formatWA = (phone) => {
  let number = phone.replace(/\D/g, "");
  if (number.startsWith("0")) number = "62" + number.slice(1);
  if (!number.startsWith("62")) number = "62" + number;
  return `${number}@s.whatsapp.net`;
};

/* ================= INIT WA ================= */
const initWAClient = async () => {
  if (isInitializing) return;
  isInitializing = true;

  console.log("🚀 Initializing WhatsApp...");

  const { state, saveCreds } = await useMultiFileAuthState(authPath);
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, qr, lastDisconnect } = update;

    /* === QR ONLY IF NOT REGISTERED === */
    if (qr && !sock.authState.creds.registered) {
      qrCode = qr;
      qrcode.generate(qr, { small: true });
      console.log("📱 Scan QR WhatsApp (Web)");
    }

    /* === CONNECTED === */
    if (connection === "open") {
      isReady = true;
      qrCode = null;
      isInitializing = false;
      console.log("✅ WhatsApp SIAP digunakan");
    }

    /* === DISCONNECTED === */
    if (connection === "close") {
      isReady = false;
      isInitializing = false;

      const reason = lastDisconnect?.error?.output?.statusCode;
      console.log("❌ WA disconnected:", reason);

      // 🔥 NORMAL setelah pairing
      if (reason === 515) {
        console.log("♻️ Restarting after pairing (515)...");
        setTimeout(() => {
          initWAClient();
        }, 5000);
        return;
      }

      if (reason !== DisconnectReason.loggedOut) {
        console.log("🔁 Reconnecting...");
        setTimeout(() => {
          initWAClient();
        }, 3000);
      } else {
        console.log("🚫 Logged out. Delete folder baileys_auth untuk login ulang.");
      }
    }
  });
};

/* ================= SEND WA ================= */
const sendWA = async (phone, mediaOrMessage, message = null) => {
  if (!isReady) throw new Error("WhatsApp belum siap");

  const jid = formatWA(phone);

  if (Buffer.isBuffer(mediaOrMessage)) {
    await sock.sendMessage(jid, {
      image: mediaOrMessage,
      caption: message || "",
    });
  } else {
    await sock.sendMessage(jid, { text: mediaOrMessage });
  }
};

/* ================= EXPORT ================= */
module.exports = {
  initWAClient,
  sendWA,
  isReady: () => isReady,
  getQR: () => qrCode,
};
