var express = require("express");
var router = express.Router();
const { Op, fn, col, literal } = require("sequelize");
const { Ticket, User } = require("../models");
const authMiddleware = require("../middleware/auth");

router.get("/tickets/count/monthly", authMiddleware, async (req, res) => {
  try {
    const now = new Date();

    // Awal bulan ini
    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
      0,
      0,
      0,
    );

    // Awal bulan depan
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      1,
      0,
      0,
      0,
    );

    const totalTicket = await Ticket.count({
      where: {
        createdAt: {
          [Op.gte]: startOfMonth,
          [Op.lt]: endOfMonth,
        },
      },
    });

    return res.json({
      message: "Total ticket bulan ini",
      month: now.toLocaleString("id-ID", { month: "long", year: "numeric" }),
      total: totalTicket,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

router.get("/tickets/count/monthly/:id", authMiddleware, async (req, res) => {
  try {
    const now = new Date();

    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
      0,
      0,
      0
    );

    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      1,
      0,
      0,
      0
    );

    const totalTicket = await Ticket.count({
      where: {
        staff_id: req.params.id, // ✅ ambil id yang bener
        createdAt: {
          [Op.gte]: startOfMonth,
          [Op.lt]: endOfMonth,
        },
      },
    });

    return res.json({
      message: "Total ticket bulan ini",
      month: now.toLocaleString("id-ID", { month: "long", year: "numeric" }),
      total: totalTicket,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});


router.get("/tickets/count/my-monthly", async (req, res) => {
  try {
    // ⛔ JANGAN SENTUH req.user SAMA SEKALI
    const userId = req.query.user_id;

    if (!userId) {
      return res.status(400).json({
        message: "user_id wajib diisi",
      });
    }

    // tanggal awal & akhir bulan ini
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date();
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);
    endOfMonth.setHours(23, 59, 59, 999);

    const count = await Ticket.count({
      where: {
        user_id: userId,
        createdAt: {
          [Op.between]: [startOfMonth, endOfMonth],
        },
      },
    });

    return res.json({
      message: "Total ticket bulan ini",
      user_id: userId,
      total: count,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

router.get("/tickets/count/staff-monthly", async (req, res) => {
  try {
    // ⛔ JANGAN SENTUH req.user SAMA SEKALI
    const staffId = req.query.staff_id;

    if (!staffId) {
      return res.status(400).json({
        message: "user_id wajib diisi",
      });
    }

    // tanggal awal & akhir bulan ini
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date();
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);
    endOfMonth.setHours(23, 59, 59, 999);

    const count = await Ticket.count({
      where: {
        staff_id: staffId,
        createdAt: {
          [Op.between]: [startOfMonth, endOfMonth],
        },
      },
    });

    return res.json({
      message: "Total ticket bulan ini",
      staff_id: staffId,
      total: count,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

router.get("/tickets/count/monthly/group-user/created", async (req, res) => {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date();
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);
    endOfMonth.setHours(23, 59, 59, 999);

    const data = await Ticket.findAll({
      attributes: ["user_id", [fn("COUNT", col("Ticket.id")), "total_ticket"]],
      where: {
        createdAt: {
          [Op.between]: [startOfMonth, endOfMonth],
        },
      },
      group: ["user_id", "user.id"],
      include: [
        {
          model: User,
          as: "user", // 🔥 INI KUNCI UTAMA
          attributes: ["id", "name", "email"],
        },
      ],
    });

    return res.json({
      message: "Jumlah ticket per user bulan ini",
      data,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

router.get("/tickets/count/monthly/group-user/assigned", async (req, res) => {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date();
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);
    endOfMonth.setHours(23, 59, 59, 999);

    const data = await Ticket.findAll({
      attributes: ["staff_id", [fn("COUNT", col("Ticket.id")), "total_ticket"]],
      where: {
        createdAt: {
          [Op.between]: [startOfMonth, endOfMonth],
        },
      },
      group: ["staff_id", "user.id"],
      include: [
        {
          model: User,
          as: "user", // 🔥 INI KUNCI UTAMA
          attributes: ["id", "name", "email"],
        },
      ],
    });

    return res.json({
      message: "Jumlah ticket per user bulan ini",
      data,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

router.get(
  "/tickets/count/monthly/compare-created-assigned",
  async (req, res) => {
    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const endOfMonth = new Date();
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);
      endOfMonth.setDate(0);
      endOfMonth.setHours(23, 59, 59, 999);

      // ================= CREATED =================
      const createdData = await Ticket.findAll({
        attributes: [
          "user_id",
          [fn("COUNT", col("Ticket.id")), "created_count"],
        ],
        where: {
          createdAt: { [Op.between]: [startOfMonth, endOfMonth] },
        },
        group: ["user_id", "user.id"],
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "name"],
          },
        ],
        raw: true,
      });

      // ================= ASSIGNED =================
      const assignedData = await Ticket.findAll({
        attributes: [
          "staff_id",
          [fn("COUNT", col("Ticket.id")), "assigned_count"],
        ],
        where: {
          createdAt: { [Op.between]: [startOfMonth, endOfMonth] },
        },
        group: ["staff_id"],
        raw: true,
      });

      // ================= MERGE =================
      const assignedMap = {};
      assignedData.forEach((item) => {
        assignedMap[item.staff_id] = parseInt(item.assigned_count);
      });

      const result = createdData.map((item) => {
        const created = parseInt(item.created_count);
        const assigned = assignedMap[item.user_id] || 0;

        let status = "BALANCE";
        if (created > assigned) status = "CREATED_MORE";
        if (created < assigned) status = "ASSIGNED_MORE";

        return {
          user_id: item.user_id,
          name: item["user.name"],
          created,
          assigned,
          status,
        };
      });

      return res.json({
        message: "Perbandingan ticket dibuat vs ditangani bulan ini",
        data: result,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "Server error",
        error: error.message,
      });
    }
  },
);

// CHART ADMIN //
router.get("/charts/tickets-by-status", async (req, res) => {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date();
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);
    endOfMonth.setHours(23, 59, 59, 999);

    const data = await Ticket.findAll({
      attributes: ["status", [fn("COUNT", col("id")), "total"]],
      where: {
        createdAt: {
          [Op.between]: [startOfMonth, endOfMonth],
        },
      },
      group: ["status"],
      order: [["status", "ASC"]],
    });

    return res.json({
      message: "Chart bar ticket per status (bulan ini)",
      data,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

router.get("/charts/tickets-daily", async (req, res) => {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date();
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);
    endOfMonth.setHours(23, 59, 59, 999);

    const data = await Ticket.findAll({
      attributes: [
        [fn("DATE", col("createdAt")), "date"],
        [fn("COUNT", col("id")), "total"],
      ],
      where: {
        createdAt: {
          [Op.between]: [startOfMonth, endOfMonth],
        },
      },
      group: [literal("DATE(createdAt)")],
      order: [[literal("DATE(createdAt)"), "ASC"]],
    });

    return res.json({
      message: "Chart line ticket per hari (bulan ini)",
      data,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});
//=============//

// CHART USER //
// YANG DI BUAT
router.get("/charts/my-tickets-by-status", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date();
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);
    endOfMonth.setHours(23, 59, 59, 999);

    const data = await Ticket.findAll({
      attributes: ["status", [fn("COUNT", col("id")), "total"]],
      where: {
        user_id: userId, // 🔥 YANG LOGIN
        createdAt: {
          [Op.between]: [startOfMonth, endOfMonth],
        },
      },
      group: ["status"],
      order: [["status", "ASC"]],
    });

    return res.json({
      message: "Chart bar ticket yang saya buat (bulan ini)",
      data,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

// YANG DITANGANI
router.get(
  "/charts/my-assigned-tickets-by-status",
  authMiddleware,
  async (req, res) => {
    try {
      const userId = req.user.id;

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const endOfMonth = new Date();
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);
      endOfMonth.setDate(0);
      endOfMonth.setHours(23, 59, 59, 999);

      const data = await Ticket.findAll({
        attributes: ["status", [fn("COUNT", col("id")), "total"]],
        where: {
          staff_id: userId, // 🔥 SEBAGAI STAFF
          createdAt: {
            [Op.between]: [startOfMonth, endOfMonth],
          },
        },
        group: ["status"],
        order: [["status", "ASC"]],
      });

      return res.json({
        message: "Chart bar ticket yang saya tangani (bulan ini)",
        data,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "Server error",
        error: error.message,
      });
    }
  },
);

// ========== //

// LIHAT STATUS DIA AMAN ATAU ENGGA
router.get(
  "/tickets/count/monthly/my-compare-created-assigned",
  authMiddleware,
  async (req, res) => {
    try {
      const userId = req.user.id; // 🔥 LOGIN USER

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const endOfMonth = new Date();
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);
      endOfMonth.setDate(0);
      endOfMonth.setHours(23, 59, 59, 999);

      // ================= CREATED BY ME =================
      const created = await Ticket.count({
        where: {
          user_id: userId,
          createdAt: {
            [Op.between]: [startOfMonth, endOfMonth],
          },
        },
      });

      // ================= ASSIGNED TO ME =================
      const assigned = await Ticket.count({
        where: {
          staff_id: userId,
          createdAt: {
            [Op.between]: [startOfMonth, endOfMonth],
          },
        },
      });

      // ================= COMPARE =================
      let status = "BALANCE";
      if (created > assigned) status = "CREATED_MORE";
      if (created < assigned) status = "ASSIGNED_MORE";

      return res.json({
        message: "Perbandingan ticket saya bulan ini",
        data: {
          user_id: userId,
          created,
          assigned,
          status,
        },
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "Server error",
        error: error.message,
      });
    }
  },
);

module.exports = router;
