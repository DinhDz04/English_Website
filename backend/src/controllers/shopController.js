const ShopItem = require("../models/ShopItem");
const { supabase } = require("../utils/supabase");

// Get all shop items
exports.getAllItems = async (req, res) => {
  try {
    const { category_id, category, is_active, is_popular, effect_type } = req.query;
    
    const filters = {};
    if (category_id) filters.category_id = category_id;
    if (category) filters.category = category;
    if (is_active !== undefined) filters.is_active = is_active === "true";
    if (is_popular !== undefined) filters.is_popular = is_popular === "true";
    if (effect_type) filters.effect_type = effect_type;

    const items = await ShopItem.findAll(filters);
    res.json({ items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi lấy danh sách items" });
  }
};

// Get item by ID
exports.getItemById = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await ShopItem.findById(id);
    res.json({ item });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi lấy thông tin item" });
  }
};

// Create new item
exports.createItem = async (req, res) => {
  try {
    const {
      name,
      description,
      icon,
      image_url,
      price,
      category_id,
      category,
      benefits,
      duration_minutes,
      max_quantity,
      is_consumable,
      effect_type,
      effect_value,
      effect_duration,
      is_popular,
      is_active
    } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({
        message: "Tên và giá không được để trống",
      });
    }

    const itemData = {
      name,
      description,
      icon,
      image_url,
      price,
      category_id: category_id || null,
      category: category || null,
      benefits,
      duration_minutes: duration_minutes || 0,
      max_quantity: max_quantity || 1,
      is_consumable: is_consumable !== false,
      effect_type: effect_type || 'boost',
      effect_value: effect_value || 0,
      effect_duration: effect_duration || 0,
      is_popular: is_popular || false,
      is_active: is_active !== false
    };

    const item = await ShopItem.create(itemData);
    res.status(201).json({ item, message: "Tạo item thành công" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi tạo item" });
  }
};

// Update item
exports.updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await ShopItem.update(id, req.body);
    res.json({ item, message: "Cập nhật item thành công" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi cập nhật item" });
  }
};

// Delete item
exports.deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    await ShopItem.delete(id);
    res.json({ message: "Xóa item thành công" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi xóa item" });
  }
};

// Get all categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await ShopItem.getCategories();
    res.json({ categories });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi lấy danh sách categories" });
  }
};

// Create category
exports.createCategory = async (req, res) => {
  try {
    const { name, description, icon, color, sort_order, is_active } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "Tên category không được để trống",
      });
    }

    const categoryData = {
      name,
      description,
      icon,
      color,
      sort_order: sort_order || 0,
      is_active: is_active !== false
    };

    const category = await ShopItem.createCategory(categoryData);
    res.status(201).json({ category, message: "Tạo category thành công" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi tạo category" });
  }
};

// Update category
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await ShopItem.updateCategory(id, req.body);
    res.json({ category, message: "Cập nhật category thành công" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi cập nhật category" });
  }
};

// Delete category
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await ShopItem.deleteCategory(id);
    res.json({ message: "Xóa category thành công" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi xóa category" });
  }
};
// Thêm vào shopController.js
exports.getItemEffects = async (req, res) => {
  try {
    const effects = await ShopItem.getItemEffects();
    res.json({ effects });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi lấy danh sách effects" });
  }
};

exports.getInstantUseItems = async (req, res) => {
  try {
    const items = await ShopItem.getInstantUseItems();
    res.json({ items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi lấy instant items" });
  }
};
// Thêm vào shopController.js

// Cập nhật thông tin thanh toán cho item
exports.updatePaymentInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_type, real_money_price, currency, product_code } = req.body;

    const paymentData = {};
    if (payment_type) paymentData.payment_type = payment_type;
    if (real_money_price !== undefined) paymentData.real_money_price = real_money_price;
    if (currency) paymentData.currency = currency;
    if (product_code) paymentData.product_code = product_code;

    const item = await ShopItem.updatePaymentInfo(id, paymentData);
    res.json({ item, message: "Cập nhật thông tin thanh toán thành công" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi cập nhật thông tin thanh toán" });
  }
};

// Lấy items theo payment type
exports.getItemsByPaymentType = async (req, res) => {
  try {
    const { payment_type } = req.query;
    
    if (!payment_type) {
      return res.status(400).json({ message: "Payment type là bắt buộc" });
    }

    const items = await ShopItem.findByPaymentType(payment_type);
    res.json({ items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi lấy danh sách items" });
  }
};

// Thống kê thanh toán
exports.getPaymentStats = async (req, res) => {
  try {
    // Lấy thống kê items theo payment type
    const { data: paymentStats, error } = await supabase
      .from('shop_items')
      .select('payment_type, is_active')
      .eq('is_active', true);

    if (error) throw error;

    const stats = {
      coins: paymentStats.filter(item => item.payment_type === 'coins').length,
      premium: paymentStats.filter(item => item.payment_type === 'premium').length,
      both: paymentStats.filter(item => item.payment_type === 'both').length,
      total: paymentStats.length
    };

    res.json({ stats });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi lấy thống kê thanh toán" });
  }
};