const ShopItem = require("../models/ShopItem");

// Get all shop items
exports.getAllItems = async (req, res) => {
  try {
    const { category, is_active, is_popular } = req.query;
    
    const filters = {};
    if (category) filters.category = category;
    if (is_active !== undefined) filters.is_active = is_active === "true";
    if (is_popular !== undefined) filters.is_popular = is_popular === "true";

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
      price,
      category,
      benefits,
      duration_minutes,
      is_popular,
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
      price,
      category,
      benefits,
      duration_minutes,
      is_popular: is_popular || false,
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