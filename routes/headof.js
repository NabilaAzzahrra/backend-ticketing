const express = require("express");
const router = express.Router();
const { Headofdivision, Division, User } = require("../models");

// ================= CREATE =================
router.post("/", async (req, res) => {
  try {
    const { nik_headof, division_id } = req.body;

    if (!nik_headof || !division_id) {
      return res.status(400).json({
        message: "NIK, Divisi, dan Jabatan wajib diisi",
      });
    }

    const newHeadofdivision = await Headofdivision.create({
      nik_headof,
      division_id,
    });

    return res.status(201).json({
      message: "Headofdivision berhasil dibuat",
      data: newHeadofdivision,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/", async (req, res) => {
  try {
    const Headofdivisions = await Headofdivision.findAll({
      include: [
        {
          model: Division,
          as: "division",
          attributes: ["id", "division"],
        },
        {
          model: User,
          as: "user",
          attributes: ["nik", "name", "email"],
        },
      ],
      order: [["id", "DESC"]],
    });

    return res.json({
      message: "List Headofdivision",
      data: Headofdivisions,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const headof = await Headofdivision.findByPk(id);
    if (!headof) {
      return res
        .status(404)
        .json({ message: "Headofdivision tidak ditemukan" });
    }

    await headof.destroy();

    return res.json({
      message: "Headofdivision berhasil dihapus",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nik_headof, division_id } = req.body;

    const headof = await Headofdivision.findByPk(id);
    if (!headof) {
      return res
        .status(404)
        .json({ message: "Headofdivision tidak ditemukan" });
    }

    await headof.update({
      nik_headof,
      division_id,
    });

    return res.json({
      message: "Headofdivision berhasil diupdate",
      data: headof,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/:nik_headof", async (req, res) => {
  try {
    const { nik_headof } = req.params;

    const headof = await Headofdivision.findOne({
      where: { nik_headof },
      include: [
        {
          model: Division,
          as: "division",
          attributes: ["id", "division"],
        },
      ],
    });

    if (!headof) {
      return res.status(404).json({
        message: "Headofdivision tidak ditemukan",
      });
    }

    return res.json({
      message: "Detail Headofdivision",
      data: headof,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server error",
    });
  }
});

module.exports = router;
