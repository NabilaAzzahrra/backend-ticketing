var express = require("express");
var router = express.Router();
const { User, Headofdivision, Division, Employee } = require("../models");

/* GET users listing. */
router.get("/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const user = await User.findOne({
      where: { email },
      include: [
        {
          model: Headofdivision,
          as: "headDivisions",
          attributes: ["nik_headof", "division_id"],
          include: [
            {
              model: Division,
              as: "division",
              attributes: ["id", "division"],
            },
          ],
        },
      ],
    });

    return res.json({
      message: "List user yang ber relasi dengan headof",
      data: user,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/:email/divisi", async (req, res) => {
  try {
    const { email } = req.params;
    const user = await User.findOne({
      where: { email },
      include: [
        {
          model: Employee,
          as: "employee",
          attributes: ["nik", "phone", "division_id", "position"],
          include: [
            {
              model: Division,
              as: "division",
              attributes: ["id", "division"],
            },
          ],
        },
      ],
    });

    return res.json({
      message: "List user yang ber relasi dengan headof",
      data: user,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
