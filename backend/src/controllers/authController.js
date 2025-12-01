const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { supabase } = require("../utils/supabase");
const { OAuth2Client } = require("google-auth-library");
const Quest = require('../models/Quest'); // DI CHUYỂN LÊN TRÊN

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

    // Validate input
    if (!full_name || !email || !password) {
      return res.status(400).json({ message: "Vui lòng điền đầy đủ thông tin" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Mật khẩu phải có ít nhất 6 ký tự" });
    }

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
          role: "user", // Mặc định là user
          points: 0,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // 🎯 KHỞI TẠO QUEST CHO USER MỚI
    try {
      await Quest.initializeDailyQuests(data.id);
      console.log(`Đã khởi tạo daily quests cho user: ${data.id}`);
    } catch (questError) {
      console.error('Lỗi khi khởi tạo quests:', questError);
      // KHÔNG throw error ở đây để không ảnh hưởng đến đăng ký
    }

    const token = generateToken(data);
    
    // Không trả về password
    const { password: _, ...userWithoutPassword } = data;
    
    res.json({ 
      token, 
      user: userWithoutPassword,
      message: "Đăng ký thành công!"
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Đăng ký thất bại" });
  }
};

// 🔐 Đăng nhập bằng email + password
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Vui lòng nhập email và mật khẩu" });
    }

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !user) {
      return res.status(400).json({ message: "Email không tồn tại!" });
    }

    // Kiểm tra password
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(400).json({ message: "Sai mật khẩu!" });
    }

    const token = generateToken(user);
    
    // Không trả về password
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({ 
      token, 
      user: userWithoutPassword,
      message: user.role === "admin" ? "Chào mừng Admin!" : "Đăng nhập thành công!"
    });
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
            points: 0,
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;
      user = newUser;

      // 🎯 KHỞI TẠO QUEST CHO USER MỚI (GOOGLE)
      try {
        await Quest.initializeDailyQuests(user.id);
        console.log(`Đã khởi tạo daily quests cho Google user: ${user.id}`);
      } catch (questError) {
        console.error('Lỗi khi khởi tạo quests Google user:', questError);
      }
    }

    const jwtToken = generateToken(user);
    
    // Không trả về password
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({ 
      token: jwtToken, 
      user: userWithoutPassword,
      message: "Đăng nhập Google thành công!"
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: "Đăng nhập Google thất bại" });
  }
};

// 📊 Lấy thông tin user hiện tại (Protected route)
exports.getMe = async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("id, full_name, email, role, points, avatar_url, created_at")
      .eq("id", req.user.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
};