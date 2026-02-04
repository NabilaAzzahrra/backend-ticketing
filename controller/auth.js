const { User } = require('../models')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

// ================= REGISTER =================
exports.register = async (req, res) => {
  try {
    const { name, email, password, nik, role, status } = req.body

    if (!name || !email || !password || !nik || !status) {
      return res.status(400).json({ message: 'Field wajib diisi' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    await User.create({
      name,
      email,
      nik,
      role: role || 'user',
      password: hashedPassword,
      status
    })

    res.json({ message: 'Register berhasil' })
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Email sudah terdaftar' })
    }
    res.status(500).json({ message: 'Server error' })
  }
}

// ================= LOGIN =================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Email tidak terdaftar" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Password salah" });
    }

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      status:user.status
    };

    const accessToken = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRES }
    );

    const refreshToken = jwt.sign(
      payload,
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRES }
    );

    await user.update({ refresh_token: refreshToken });

    // ✅ KIRIM DATA USER KE FRONTEND
    return res.json({
      accessToken,
      refreshToken,
      user: {
        id:user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status:user.status
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};


// ================= REFRESH TOKEN =================
exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body

  if (!refreshToken) {
    return res.status(400).json({ message: 'Refresh token wajib' })
  }

  jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Refresh token tidak valid' })
    }

    const user = await User.findOne({
      where: {
        id: decoded.id,
        refresh_token: refreshToken
      }
    })

    if (!user) {
      return res.status(403).json({ message: 'Refresh token ditolak' })
    }

    const newAccessToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRES }
    )

    res.json({ accessToken: newAccessToken })
  })
}

// ================= LOGOUT =================
exports.logout = async (req, res) => {
  const { refreshToken } = req.body

  await User.update(
    { refresh_token: null },
    { where: { refresh_token: refreshToken } }
  )

  res.json({ message: 'Logout berhasil' })
}
