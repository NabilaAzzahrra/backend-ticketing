const express = require("express");
const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");
const fs = require("fs");
const path = require("path");
const router = express.Router();
const uploadSignature = require("../middleware/uploadSignature");
const updateSignature = require("../middleware/updateSignature");
const { sequelize, Employee, Division, User } = require("../models");

// ================= CREATE =================
router.post("/", uploadSignature.single("signature"), async (req, res) => {
  try {
    const { nik, phone, division_id, position } = req.body;

    if (!nik || !division_id || !position) {
      return res.status(400).json({
        message: "NIK, Divisi, dan Jabatan wajib diisi",
      });
    }

    const signature = req.file ? req.file.filename : null;

    const employee = await Employee.create({
      nik,
      phone,
      division_id,
      position,
      signature, // 🔥 cuma nama file
    });

    res.status(201).json({
      message: "Employee berhasil dibuat",
      data: employee,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// ================= UPDATE SIGNATURE =================
router.post(
  "/:id/signature",
  updateSignature.single("signature"),
  async (req, res) => {
    try {
      const employeeId = req.params.id;

      // 1️⃣ Ambil data employee lama
      const employee = await Employee.findByPk(employeeId);
      if (!employee) {
        return res.status(404).json({ message: "Employee tidak ditemukan" });
      }

      // 2️⃣ Hapus file lama kalau ada
      if (employee.signature) {
        const fs = require("fs");
        const path = require("path");
        const oldPath = path.join(
          __dirname,
          "../public/signatures",
          employee.signature
        ); // sesuaikan folder multer
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      // 3️⃣ Simpan file baru
      const newSignature = req.file ? req.file.filename : null;
      employee.signature = newSignature;

      await employee.save();

      res.status(200).json({
        message: "Signature berhasil diupdate",
        data: employee,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// ================= GET ALL =================
router.get("/", async (req, res) => {
  try {
    const employees = await Employee.findAll({
      include: [
        {
          model: Division,
          as: "division",
          attributes: ["id", "division"],
        },
        {
          model: User,
          as: "users",
          attributes: ["id", "name", "email", "status"],
        },
      ],
      order: [["id", "DESC"]],
    });

    return res.json({
      message: "List Employee",
      data: employees,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/export/pdf", async (req, res) => {
  try {
    /* ===== API KEY CHECK ===== */
    const apiKey = req.headers["lp3i-api-key"];
    if (apiKey !== process.env.LP3I_API_KEY) {
      return res.status(401).json({ message: "API Key tidak valid" });
    }

    /* ===== FETCH DATA ===== */
    const employees = await Employee.findAll({
      include: [
        {
          model: Division,
          as: "division",
          attributes: ["division"],
        },
        {
          model: User,
          as: "users",
          attributes: ["name", "status"],
        },
      ],
      order: [["id", "ASC"]],
    });

    /* ===== PDF INIT ===== */
    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margin: 30,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "inline; filename=data-karyawan.pdf"
    );

    doc.pipe(res);

    /* ===============================
       TITLE
    =============================== */
    doc
      .font("Helvetica-Bold")
      .fontSize(16)
      .text("DATA KARYAWAN", { align: "center" });

    doc.moveDown(1.5);

    /* ===============================
       COLUMN CONFIG
    =============================== */
    const col = {
      no: { x: 30, w: 30 },
      nik: { x: 70, w: 90 },
      nama: { x: 170, w: 140 },
      phone: { x: 320, w: 110 },
      divisi: { x: 440, w: 120 },
      posisi: { x: 570, w: 100 },
      signature: { x: 680, w: 80 },
      status: { x: 770, w: 70 },
    };

    let y = doc.y;

    /* ===============================
       TABLE HEADER
    =============================== */
    doc.font("Helvetica-Bold").fontSize(10);
    doc.text("No", col.no.x, y);
    doc.text("NIK", col.nik.x, y);
    doc.text("Nama Karyawan", col.nama.x, y);
    doc.text("Phone", col.phone.x, y);
    doc.text("Divisi", col.divisi.x, y);
    doc.text("Posisi", col.posisi.x, y);
    doc.text("Signature", col.signature.x, y);
    doc.text("Status", col.status.x, y);

    y += 15;
    doc.moveTo(30, y).lineTo(820, y).stroke();
    y += 10;

    /* ===============================
       TABLE BODY
    =============================== */
    doc.font("Helvetica").fontSize(9);

    const baseRowHeight = 30;
    const rowGap = 8;

    for (let i = 0; i < employees.length; i++) {
      const emp = employees[i];

      /* ===== PAGE BREAK ===== */
      if (y > 500) {
        doc.addPage();
        y = 50;
      }

      /* ===== CALCULATE ROW HEIGHT ===== */
      const nameHeight = doc.heightOfString(
        emp.users?.[0]?.name || "-",
        { width: col.nama.w }
      );

      const divisiHeight = doc.heightOfString(
        emp.division?.division || "-",
        { width: col.divisi.w }
      );

      let rowHeight = Math.max(baseRowHeight, nameHeight, divisiHeight);

      /* ===== TEXT CELLS ===== */
      doc.text(i + 1, col.no.x, y, { width: col.no.w });
      doc.text(emp.nik || "-", col.nik.x, y, { width: col.nik.w });

      doc.text(emp.users?.[0]?.name || "-", col.nama.x, y, {
        width: col.nama.w,
      });

      doc.text(emp.phone || "-", col.phone.x, y, {
        width: col.phone.w,
      });

      doc.text(emp.division?.division || "-", col.divisi.x, y, {
        width: col.divisi.w,
      });

      doc.text(emp.position || "-", col.posisi.x, y, {
        width: col.posisi.w,
      });

      doc.text(emp.users?.[0]?.status || "-", col.status.x, y, {
        width: col.status.w,
      });

      /* ===== SIGNATURE IMAGE ===== */
      if (emp.signature) {
        const imgPath = path.join(
          __dirname,
          "../public/signatures",
          emp.signature
        );

        if (fs.existsSync(imgPath)) {
          doc.image(imgPath, col.signature.x, y, {
            fit: [60, 25],
            align: "center",
          });
        } else {
          doc.text("-", col.signature.x, y);
        }
      } else {
        doc.text("-", col.signature.x, y);
      }

      /* ===== ROW LINE ===== */
      y += rowHeight + rowGap;
      doc
        .moveTo(30, y - 4)
        .lineTo(820, y - 4)
        .strokeOpacity(0.2)
        .stroke();
    }

    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal export PDF" });
  }
});

router.get("/export/excel", async (req, res) => {
  try {
    /* ===== API KEY CHECK ===== */
    const apiKey = req.headers["lp3i-api-key"];
    if (apiKey !== process.env.LP3I_API_KEY) {
      return res.status(401).json({ message: "API Key tidak valid" });
    }

    /* ===== FETCH DATA ===== */
    const employees = await Employee.findAll({
      include: [
        {
          model: Division,
          as: "division",
          attributes: ["division"],
        },
        {
          model: User,
          as: "users",
          attributes: ["name", "status"],
        },
      ],
      order: [["id", "ASC"]],
    });

    /* ===== WORKBOOK ===== */
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Data Karyawan");

    /* ===== HEADER ===== */
    worksheet.columns = [
      { header: "No", key: "no", width: 5 },
      { header: "NIK", key: "nik", width: 20 },
      { header: "Nama Karyawan", key: "nama", width: 30 },
      { header: "Phone", key: "phone", width: 18 },
      { header: "Divisi", key: "divisi", width: 25 },
      { header: "Posisi", key: "posisi", width: 20 },
      { header: "Signature", key: "signature", width: 18 },
      { header: "Status", key: "status", width: 15 },
    ];

    worksheet.getRow(1).font = { bold: true };

    /* ===== DATA ROWS ===== */
    employees.forEach((emp, index) => {
      worksheet.addRow({
        no: index + 1,
        nik: emp.nik || "-",
        nama: emp.users?.[0]?.name || "-",
        phone: emp.phone || "-",
        divisi: emp.division?.division || "-",
        posisi: emp.position || "-",
        signature: "", // gambar diisi belakangan
        status: emp.users?.[0]?.status || "-",
      });
    });

    /* ===== SIGNATURE IMAGE ===== */
    employees.forEach((emp, index) => {
      if (!emp.signature) return;

      const imgPath = path.join(
        __dirname,
        "../public/signatures",
        emp.signature
      );

      if (!fs.existsSync(imgPath)) return;

      const imageId = workbook.addImage({
        filename: imgPath,
        extension: path.extname(imgPath).replace(".", ""),
      });

      const rowIndex = index + 2; // karena header di row 1

      worksheet.addImage(imageId, {
        tl: { col: 6, row: rowIndex - 1 },
        ext: { width: 80, height: 35 },
      });

      worksheet.getRow(rowIndex).height = 30;
    });

    /* ===== RESPONSE ===== */
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=data-karyawan.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal export Excel" });
  }
});

// ================= GET BY ID =================
// router.get("/:id", async (req, res) => {
//   try {
//     const { id } = req.params;

//     const employee = await Employee.findByPk(id);

//     if (!employee) {
//       return res.status(404).json({ message: "Employee tidak ditemukan" });
//     }

//     return res.json({
//       message: "Detail Employee",
//       data: employee,
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ message: "Server error" });
//   }
// });

router.get("/:nik", async (req, res) => {
  try {
    const { nik } = req.params;

    const employee = await Employee.findOne({
      where: { nik },
      include: [
        {
          model: Division,
          as: "division",
          attributes: ["id", "division"],
        },
        {
          model: User,
          as: "users",
          attributes: ["id", "name", "email"],
        },
      ],
    });

    if (!employee) {
      return res.status(404).json({
        message: "Employee tidak ditemukan",
      });
    }

    return res.json({
      message: "Detail Employee",
      data: employee,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server error",
    });
  }
});

router.get("/:division_id/division", async (req, res) => {
  try {
    const { division_id } = req.params;

    const employee = await Employee.findOne({
      where: { division_id },
      include: [
        {
          model: Division,
          as: "division",
          attributes: ["id", "division"],
        },
        {
          model: User,
          as: "users",
          attributes: ["id", "name", "email"],
        },
      ],
    });

    if (!employee) {
      return res.status(404).json({
        message: "Employee tidak ditemukan",
      });
    }

    return res.json({
      message: "Detail Employee",
      data: employee,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server error",
    });
  }
});


// ================= UPDATE =================
// router.patch("/:id", async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { nik, phone, division_id, position, signature } = req.body;

//     const employee = await Employee.findByPk(id);
//     if (!employee) {
//       return res.status(404).json({ message: "Employee tidak ditemukan" });
//     }

//     await employee.update({
//       nik,
//       phone,
//       division_id,
//       position,
//       signature,
//     });

//     return res.json({
//       message: "Employee berhasil diupdate",
//       data: employee,
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ message: "Server error" });
//   }
// });

const bcrypt = require("bcryptjs");

router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nik, phone, division_id, position, signature } = req.body;

    const employee = await Employee.findByPk(id);
    if (!employee) {
      return res.status(404).json({ message: "Employee tidak ditemukan" });
    }

    await employee.update({
      nik,
      phone,
      division_id,
      position,
      signature,
    });

    res.json({
      message: "Employee berhasil diupdate",
      data: employee,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.patch("/user/:nik", async (req, res) => {
  try {
    const { nik } = req.params;
    const { name, email, status, password } = req.body;

    const user = await User.findOne({
      where: { nik: String(nik) },
    });

    if (!user) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    const updateData = {
      name,
      email,
      status,
    };

    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    await user.update(updateData);

    res.json({
      message: "User berhasil diupdate",
      data: user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.patch("/user/:nik/status", async (req, res) => {
  try {
    const { nik } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Status wajib diisi" });
    }

    const user = await User.findOne({
      where: { nik: String(nik) },
    });

    if (!user) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    await user.update({ status });

    res.json({
      message: "Status user berhasil diperbarui",
      data: user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// ================= DELETE =================
// router.delete("/:id", async (req, res) => {
//   try {
//     const { id } = req.params;

//     const employee = await Employee.findByPk(id);
//     if (!employee) {
//       return res.status(404).json({ message: "Employee tidak ditemukan" });
//     }

//     await employee.destroy();

//     return res.json({
//       message: "Employee berhasil dihapus",
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ message: "Server error" });
//   }
// });

router.delete("/:id", async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;

    const employee = await Employee.findByPk(id, { transaction });
    if (!employee) {
      await transaction.rollback();
      return res.status(404).json({ message: "Employee tidak ditemukan" });
    }

    const nik = employee.nik;

    await User.destroy({
      where: { nik },
      transaction,
    });

    await employee.destroy({ transaction });

    await transaction.commit();

    return res.json({
      message: "Employee & User berhasil dihapus",
    });
  } catch (error) {
    await transaction.rollback();
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
