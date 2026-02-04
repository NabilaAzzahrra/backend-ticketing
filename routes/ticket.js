var express = require("express");
var router = express.Router();
const multer = require("multer");
const upload = multer();
const sendTelegramTicket = require("../utils/telegram");
//const upload = require("../middleware/upload");
const { sendWA, MessageMedia } = require("../utils/whatsapp");
const { Ticket, User, Employee } = require("../models");
const { where } = require("sequelize");

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});

// router.post("/", upload.single("photo"), async (req, res) => {
//   try {
//     const { user_id, staff_id, complaint } = req.body;

//     if (!user_id || !staff_id || !complaint) {
//       return res.status(400).json({
//         message: "Staff, dan Complaint wajib diisi",
//       });
//     }

//     // ✅ ambil dari multer
//     const photo = req.file ? req.file.filename : null;

//     const newTicket = await Ticket.create({
//       user_id,
//       staff_id,
//       complaint,
//       photo,
//       status: "Onboarding",
//     });

//     return res.status(201).json({
//       message: "Ticket berhasil dibuat",
//       data: newTicket,
//     });
//   } catch (error) {
//     console.error(error.message);
//     return res.status(500).json({ message: error.message });
//   }
// });

router.post("/", upload.single("photo"), async (req, res) => {
  try {
    const { user_id, staff_id, complaint } = req.body;

    if (!user_id || !staff_id || !complaint) {
      return res
        .status(400)
        .json({ message: "Staff dan Complaint wajib diisi" });
    }

    // 🔹 Convert photo ke base64 (DB)
    let photoBase64 = null;
    if (req.file) {
      photoBase64 = `data:${
        req.file.mimetype
      };base64,${req.file.buffer.toString("base64")}`;
    }

    // 🔹 Buat ticket baru
    const newTicket = await Ticket.create({
      user_id,
      staff_id,
      complaint,
      photo: photoBase64,
      status: "Onboarding",
    });

    // 🔹 Ambil data user & staff
    const ticketWithUser = await Ticket.findByPk(newTicket.id, {
      include: [
        { model: User, as: "user", attributes: ["id", "nik", "name"] },
        {
          model: User,
          as: "staff",
          attributes: ["id", "nik", "name"],
          include: [
            { model: Employee, as: "employee", attributes: ["id", "phone"] },
          ],
        },
      ],
    });

    // 🔹 FORMAT PESAN TELEGRAM
    const telegramMessage = `
<b>📩 TICKET BARU</b>

Task created from:
👤 <b>User:</b> ${ticketWithUser.user?.name || "-"}
🆔 <b>User ID:</b> ${ticketWithUser.user_id}
🏷 <b>NIK:</b> ${ticketWithUser.user?.nik || "-"}

Task created to:
🧑‍💼 <b>Staff:</b> ${ticketWithUser.staff?.name || "-"}
🆔 <b>Staff ID:</b> ${ticketWithUser.staff_id}
🏷 <b>NIK:</b> ${ticketWithUser.staff?.nik || "-"}

📝 <b>Complaint:</b>
${complaint}

⚠️ Perubahan status ticket wajib dilakukan melalui Sistem Ticketing sebelum proses pengerjaan.

📌 <b>Status:</b> Onboarding
🕒 <b>Waktu:</b> ${new Date().toLocaleString("id-ID")}
`;

    // 🔹 KIRIM KE TELEGRAM GROUP
    const sentTelegram = await sendTelegramTicket({
      text: telegramMessage,
      photo: req.file,
    });

    await newTicket.update({
      telegram_message_id: sentTelegram?.message_id || null,
    });

    // 🔹 KIRIM WA KE STAFF
    const staffEmployee = ticketWithUser.staff?.employee;
    if (staffEmployee?.phone) {
      const waMessage = `
Halo ${ticketWithUser.staff?.name || "Staff"},

📩 Anda mendapat task baru

🆔 Ticket ID: ${newTicket.id}
👤 Dari User: ${ticketWithUser.user?.name || "-"} (ID: ${
        ticketWithUser.user_id
      })
📝 Complaint: ${complaint}

📌 Status: Onboarding
🕒 Waktu: ${new Date().toLocaleString("id-ID")}
`;

      try {
        if (req.file) {
          // 🔹 Kirim WA dengan foto
          await sendWA(
            staffEmployee.phone,
            req.file.buffer, // ✅ buffer langsung
            waMessage,
          );
        } else {
          // 🔹 Kirim WA tanpa foto
          await sendWA(staffEmployee.phone, waMessage);
        }

        console.log("WA terkirim ke staff:", staffEmployee.phone);
      } catch (err) {
        console.warn(
          "Gagal kirim WA ke staff:",
          staffEmployee.phone,
          "-",
          err.message,
        );
      }
    }

    return res.status(201).json({
      message:
        "Ticket berhasil dibuat, Telegram & WA staff dikirim (foto included)",
      data: newTicket,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
});

router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, message } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Status wajib diisi" });
    }

    // Ambil ticket + user + employee
    const ticket = await Ticket.findByPk(id, {
      include: [
        {
          model: User,
          as: "user",
          include: [
            {
              model: Employee,
              as: "employee",
              attributes: ["id", "phone"],
            },
          ],
        },
        {
          model: User,
          as: "staff",
          include: [
            {
              model: Employee,
              as: "employee",
              attributes: ["id", "phone"],
            },
          ],
        },
      ],
    });

    if (!ticket)
      return res.status(404).json({ message: "Ticket tidak ditemukan" });

    // Update status & message
    await ticket.update({ status, message });

    const userEmployee = ticket.user?.employee;
    const staffName = ticket.staff?.name || "-";

    if (userEmployee?.phone) {
      try {
        const waMessage = `
Halo ${ticket.user?.name || "User"},

📢 *Update Status Ticket*

🆔 Ticket ID: ${ticket.id}
📌 Status: *${status}*

📝 Complaint:
${ticket.complaint || "-"}

👤 Staff Penanggung Jawab: ${staffName}

📌 Catatan tambahan dari penerima task:
${message || "-"}

📌 Silakan cek ticket ini di Sistem Ticketing sebelum mulai dikerjakan.
        `;

        // Kirim WA teks saja
        await sendWA(userEmployee.phone, waMessage);

        console.log("WA berhasil dikirim ke:", userEmployee.phone);
      } catch (err) {
        console.warn("Gagal kirim WA:", userEmployee.phone, "-", err.message);
      }
    }

    return res.status(200).json({
      message: "Status ticket diperbarui & WA terkirim (jika berhasil)",
      data: ticket,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
});

router.get("/:user_id/created", async (req, res) => {
  try {
    const { user_id } = req.params;

    const tickets = await Ticket.findAll({
      where: { user_id },
    });

    if (!tickets || tickets.length === 0) {
      return res.status(404).json({
        message: "Ticket tidak ditemukan",
      });
    }

    return res.status(200).json({
      message: "Berhasil mengambil ticket",
      data: tickets,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server error",
    });
  }
});

router.get("/:staff_id/assigned", async (req, res) => {
  try {
    const { staff_id } = req.params;

    const tickets = await Ticket.findAll({
      where: { staff_id },
      include: [
        {
          model: User,
          as: "user",
          include: [
            {
              model: Employee,
              as: "employee",
              attributes: ["id", "phone"],
            },
          ],
        },
        {
          model: User,
          as: "staff",
          include: [
            {
              model: Employee,
              as: "employee",
              attributes: ["id", "phone"],
            },
          ],
        },
      ],
    });

    if (!tickets || tickets.length === 0) {
      return res.status(404).json({
        message: "Ticket tidak ditemukan",
      });
    }

    // ✅ BERSIHKAN BASE64 DI SINI
    const cleanedTickets = tickets.map((ticket) => {
      const t = ticket.toJSON();

      if (t.photo) {
        t.photo = t.photo.replace(/\s/g, "");
      }

      return t;
    });

    return res.status(200).json({
      message: "Berhasil mengambil ticket",
      data: cleanedTickets,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server error",
    });
  }
});


module.exports = router;
