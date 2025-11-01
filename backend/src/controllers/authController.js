const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { supabase } = require("../utils/supabase");
const { OAuth2Client } = require("google-auth-library");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ✅ Tạo JWT
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// 🧩 Đăng ký tài khoản (email + password)
exports.register = async (req, res) => {
  try {
    const { full_name, email, password } = req.body;

    // Kiểm tra tồn tại
    const { data: existing } = await supabase
      .from("users")
      .select("email")
      .eq("email", email)
      .single();

    if (existing) return res.status(400).json({ message: "Email đã tồn tại!" });

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          full_name,
          email,
          password: hashed,
          role: "user",
          points: 0,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    const token = generateToken(data);
    res.json({ token, user: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Đăng ký thất bại" });
  }
};

// 🔐 Đăng nhập bằng email + password
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !user) return res.status(400).json({ message: "Sai email!" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: "Sai mật khẩu!" });

    const token = generateToken(user);
    res.json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Đăng nhập thất bại" });
  }
};

// 🔑 Đăng nhập / đăng ký bằng Google
exports.googleLogin = async (req, res) => {
  try {
    const { token } = req.body;

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    const { data: existingUser } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    let user = existingUser;

    if (!user) {
      const { data: newUser, error: insertError } = await supabase
        .from("users")
        .insert([
          {
            full_name: name,
            email,
            avatar_url: picture,
            role: "user",
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;
      user = newUser;
    }

    const jwtToken = generateToken(user);
    res.json({ token: jwtToken, user });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: "Google login failed" });
  }
};
