const express = require("express");
const router = express.Router();
const { Ticket, User, Employee, Division } = require("../models");
const { Op } = require("sequelize");
const ExcelJS = require("exceljs");

const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

console.log("OPENAI_API_KEY:", process.env.OPENAI_API_KEY ? "ADA" : "KOSONG");

const generateSummary = async (tickets) => {
  const simplified = tickets.map((t) => ({
    tanggal: t.createdAt.toISOString().split("T")[0],
    complaint: t.complaint,
    status: t.status,
    hasil: t.message || "-",
  }));

  const prompt = `
Buatkan kesimpulan pekerjaan harian dalam bentuk poin singkat dan formal berdasarkan data berikut:
${JSON.stringify(simplified, null, 2)}
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
  });

  return completion.choices[0].message.content;
};

// ==========================
// Route JSON biasa
// GET /api/report/tickets
// ==========================
router.get("/tickets", async (req, res) => {
  try {
    const { from, to, status, user_id, staff_id } = req.query;
    const where = {};

    // ✅ FILTER TANGGAL (FULL DAY)
    if (from && to) {
      where.createdAt = {
        [Op.between]: [
          new Date(from + " 00:00:00"),
          new Date(to + " 23:59:59"),
        ],
      };
    } else if (from) {
      where.createdAt = {
        [Op.gte]: new Date(from + " 00:00:00"),
      };
    } else if (to) {
      where.createdAt = {
        [Op.lte]: new Date(to + " 23:59:59"),
      };
    }

    // ✅ FILTER LAIN (AMAN & TERPISAH)
    if (status) where.status = status;
    if (user_id) where.user_id = user_id;
    if (staff_id) where.staff_id = staff_id;

    const tickets = await Ticket.findAll({
      where,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email"],
        },
        {
          model: User,
          as: "staff",
          attributes: ["id", "name", "email"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.json({
      message: "Report tickets",
      count: tickets.length,
      data: tickets,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

// ==========================
// Route Export Excel
// GET /api/report/tickets/export
// ==========================
router.get("/tickets/export", async (req, res) => {
  try {
    const { from, to, status, user_id, staff_id } = req.query;

    const where = {};
    if (from && to)
      where.createdAt = { [Op.between]: [new Date(from), new Date(to)] };
    else if (from) where.createdAt = { [Op.gte]: new Date(from) };
    else if (to) where.createdAt = { [Op.lte]: new Date(to) };

    if (status) where.status = status;
    if (user_id) where.user_id = user_id;
    if (staff_id) where.staff_id = staff_id;

    const tickets = await Ticket.findAll({
      where,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email"],
          include: [
            {
              model: Employee,
              as: "employee",
              attributes: ["id", "nik", "phone", "position"],
              include: [
                {
                  model: Division,
                  as: "division",
                  attributes: ["id", "division"],
                },
              ],
            },
          ],
        },
        {
          model: User,
          as: "staff",
          attributes: ["id", "name", "email"],
          include: [
            {
              model: Employee,
              as: "employee",
              attributes: ["id", "nik", "phone", "position"],
              include: [
                {
                  model: Division,
                  as: "division",
                  attributes: ["id", "division"],
                },
              ],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    // ==== Buat Excel ====
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Tickets Report");

    sheet.columns = [
      { header: "Assign To", key: "user_assign", width: 10 },
      { header: "Complaint", key: "complaint", width: 10 },
      { header: "Tanggal", key: "createdAt", width: 25 },
      { header: "Status", key: "status", width: 25 },
      { header: "Created By", key: "user_name", width: 15 },
      { header: "Hasil", key: "message", width: 15 },
    ];

    tickets.forEach((ticket) => {
      sheet.addRow({
        user_assign: ticket.staff?.name || "-",
        complaint: ticket.complaint,
        createdAt: ticket.createdAt,
        status: ticket.status,
        user_name: ticket.user?.name || "-",
        message: ticket.message || "-",
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=report_tickets.xlsx",
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
});

// ==========================
// Route Export Kesimpulan Excel
// GET /api/report/tickets/export-summary
// ==========================
router.get("/tickets/export-summary", async (req, res) => {
  try {
    const { from, to, status, user_id, staff_id } = req.query;

    const where = {};
    if (from && to)
      where.createdAt = { [Op.between]: [new Date(from), new Date(to)] };
    else if (from) where.createdAt = { [Op.gte]: new Date(from) };
    else if (to) where.createdAt = { [Op.lte]: new Date(to) };

    if (status) where.status = status;
    if (user_id) where.user_id = user_id;
    if (staff_id) where.staff_id = staff_id;

    const tickets = await Ticket.findAll({
      where,
      order: [["createdAt", "ASC"]],
    });

    if (!tickets.length) {
      return res.status(404).json({ message: "Data kosong" });
    }

    // 🔥 GENERATE KESIMPULAN (ChatGPT)
    const summaryText = await generateSummary(tickets);

    // 🔥 BUAT EXCEL
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Kesimpulan");

    sheet.columns = [
      { header: "No", key: "no", width: 5 },
      { header: "Kesimpulan", key: "summary", width: 120 },
    ];

    summaryText
      .split("\n")
      .filter((line) => line.trim())
      .forEach((line, index) => {
        sheet.addRow({
          no: index + 1,
          summary: line.replace(/^[-•]\s*/, ""),
        });
      });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=kesimpulan_tickets.xlsx",
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Gagal export kesimpulan",
      error: error.message,
    });
  }
});


module.exports = router;
