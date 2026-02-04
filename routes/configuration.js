var express = require("express");
var router = express.Router();
const { Configuration, User } = require("../models");

/* GET home page. */
router.get("/", async (req, res) => {
  try {
    const configuration = await Configuration.findAll({
      include: [
        {
          model: User,
          as: "campusPrinciple",
          attributes: ["id", "name", "email"],
        },
        {
          model: User,
          as: "hrd",
          attributes: ["id", "name", "email"],
        },
      ],
      order: [["id", "DESC"]],
    });
    return res.json({
      message: "List Configuration",
      data: configuration,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { campus_principle_nik, hrd_nik, meal_allowance, transportation } =
      req.body;
    if (
      !campus_principle_nik ||
      !hrd_nik ||
      !meal_allowance ||
      !transportation
    ) {
      return res.status(400).json({ message: "Wajib diisi semua" });
    }

    const newConfiguration = await Configuration.create({
      campus_principle_nik,
      hrd_nik,
      meal_allowance,
      transportation,
    });

    return res.status(201).json({
      message: "Configuration berhasil dibuat",
      data: newConfiguration,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { campus_principle_nik, hrd_nik, meal_allowance, transportation } =
      req.body;

    const configuration = await Configuration.findByPk(id);
    if (!configuration) {
      return res.status(404).json({ message: "Configuration tidak ditemukan" });
    }

    await configuration.update({
      campus_principle_nik,
      hrd_nik,
      meal_allowance,
      transportation,
    });

    res.json({
      message: "Configuration berhasil diupdate",
      data: configuration,
    });
  } catch (error) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
