const { supabase } = require("../utils/supabase");
const Settings = require("../models/Settings");
const fs = require("fs");
const path = require("path");


// Get all settings
exports.getAllSettings = async (req, res) => {
  try {
    const settings = await Settings.findAll();
    console.log('📋 Getting all settings...');
    
    // Nhóm theo category để dễ xử lý frontend
    const groupedSettings = settings.reduce((acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = [];
      }
      acc[setting.category].push(setting);
      return acc;
    }, {});

    res.json({ 
      success: true,
      settings: groupedSettings 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false,
      message: "Lỗi khi lấy danh sách cài đặt" 
    });
  }
};

// Get settings by category
exports.getSettingsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const settings = await Settings.findByCategory(category);
    
    res.json({ 
      success: true,
      settings 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false,
      message: "Lỗi khi lấy cài đặt theo category" 
    });
  }
};

// Update settings
exports.updateSettings = async (req, res) => {
  try {
    const { settings } = req.body;
    console.log('🔄 Updating settings:', req.body.settings);

    if (!settings || !Array.isArray(settings)) {
      return res.status(400).json({ 
        success: false,
        message: "Dữ liệu cài đặt không hợp lệ" 
      });
    }

    await Settings.bulkUpdate(settings);

    res.json({ 
      success: true,
      message: "Cập nhật cài đặt thành công" 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false,
      message: "Lỗi khi cập nhật cài đặt" 
    });
  }
};

// Backup database
exports.backupDatabase = async (req, res) => {
  try {
    const backupResult = await Settings.backupDatabase();

    res.json({
      success: true,
      message: "Backup database thành công",
      data: backupResult
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Lỗi khi backup database"
    });
  }
};

// Get database info
exports.getDatabaseInfo = async (req, res) => {
  try {
    const dbInfo = await Settings.getDatabaseInfo();

    res.json({
      success: true,
      data: dbInfo
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thông tin database"
    });
  }
};

// Optimize database
exports.optimizeDatabase = async (req, res) => {
  try {
    const result = await Settings.optimizeDatabase();
    
    res.json({
      success: true,
      message: "Optimize database thành công",
      data: result
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Lỗi khi optimize database"
    });
  }
};

// Reset settings to default
exports.resetSettings = async (req, res) => {
  try {
    await Settings.resetToDefault();
    
    res.json({
      success: true,
      message: "Reset cài đặt về mặc định thành công"
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Lỗi khi reset cài đặt"
    });
  }
};