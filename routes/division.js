const express = require("express");
const router = express.Router();
const { Division } = require("../models");

// ================= CREATE =================
router.post("/", async (req, res) => {
  try {
    const { division } = req.body;

    if (!division) {
      return res.status(400).json({ message: "Nama divisi wajib diisi" });
    }

    const newDivision = await Division.create({ division });

    return res.status(201).json({
      message: "Divisi berhasil dibuat",
      data: newDivision,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

// ================= GET ALL =================
router.get("/", async (req, res) => {
  try {
    const divisions = await Division.findAll({
      order: [["id", "DESC"]],
    });

    return res.json({
      message: "List divisi",
      data: divisions,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

// ================= GET BY ID =================
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const division = await Division.findByPk(id);

    if (!division) {
      return res.status(404).json({ message: "Divisi tidak ditemukan" });
    }

    return res.json({
      message: "Detail divisi",
      data: division,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

// ================= UPDATE =================
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { division } = req.body;

    const data = await Division.findByPk(id);
    if (!data) {
      return res.status(404).json({ message: "Divisi tidak ditemukan" });
    }

    await data.update({ division });

    return res.json({
      message: "Divisi berhasil diupdate",
      data,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

// ================= DELETE =================
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const data = await Division.findByPk(id);
    if (!data) {
      return res.status(404).json({ message: "Divisi tidak ditemukan" });
    }

    await data.destroy();

    return res.json({
      message: "Divisi berhasil dihapus",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
