// backend/src/controllers/itemController.js
const Item = require('../models/Item');

class ItemController {
  // Get all items with pagination and filters
  async getAllItems(req, res) {
    try {
      const { page = 1, limit = 50, search, category, type, rarity } = req.query;
      
      const result = await Item.findAll({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        category,
        type,
        rarity
      });

      res.json({
        success: true,
        items: result.items,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Get items error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách vật phẩm',
        error: error.message
      });
    }
  }

  // Get item by ID
  async getItemById(req, res) {
    try {
      const { id } = req.params;
      const item = await Item.findById(id);

      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy vật phẩm'
        });
      }

      res.json({
        success: true,
        item
      });
    } catch (error) {
      console.error('Get item error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy thông tin vật phẩm',
        error: error.message
      });
    }
  }

  // Create new item
  async createItem(req, res) {
    try {
      const itemData = req.body;

      // Validate required fields
      const required = ['name', 'category_id', 'type_id'];
      for (const field of required) {
        if (!itemData[field]) {
          return res.status(400).json({
            success: false,
            message: `Thiếu trường bắt buộc: ${field}`
          });
        }
      }

      // Parse effect config if string
      if (itemData.effect_config && typeof itemData.effect_config === 'string') {
        try {
          itemData.effect_config = JSON.parse(itemData.effect_config);
        } catch (e) {
          return res.status(400).json({
            success: false,
            message: 'Định dạng effect config không hợp lệ'
          });
        }
      }

      // Set default values
      itemData.is_active = itemData.is_active !== false;
      itemData.is_consumable = itemData.is_consumable !== false;
      itemData.price_coins = itemData.price_coins || 0;
      itemData.price_gems = itemData.price_gems || 0;
      itemData.max_quantity = itemData.max_quantity || 1;
      itemData.sort_order = itemData.sort_order || 0;

      const item = await Item.create(itemData);

      res.status(201).json({
        success: true,
        message: 'Tạo vật phẩm thành công',
        item
      });
    } catch (error) {
      console.error('Create item error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tạo vật phẩm',
        error: error.message
      });
    }
  }

  // Update item
  async updateItem(req, res) {
    try {
      const { id } = req.params;
      const itemData = req.body;

      // Check if item exists
      const existingItem = await Item.findById(id);
      if (!existingItem) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy vật phẩm'
        });
      }

      // Parse effect config if string
      if (itemData.effect_config && typeof itemData.effect_config === 'string') {
        try {
          itemData.effect_config = JSON.parse(itemData.effect_config);
        } catch (e) {
          return res.status(400).json({
            success: false,
            message: 'Định dạng effect config không hợp lệ'
          });
        }
      }

      const item = await Item.update(id, itemData);

      res.json({
        success: true,
        message: 'Cập nhật vật phẩm thành công',
        item
      });
    } catch (error) {
      console.error('Update item error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật vật phẩm',
        error: error.message
      });
    }
  }

  // Delete item
  async deleteItem(req, res) {
    try {
      const { id } = req.params;
      
      // Check if item exists
      const existingItem = await Item.findById(id);
      if (!existingItem) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy vật phẩm'
        });
      }

      await Item.delete(id);

      res.json({
        success: true,
        message: 'Xóa vật phẩm thành công'
      });
    } catch (error) {
      console.error('Delete item error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi xóa vật phẩm',
        error: error.message
      });
    }
  }

  // Bulk delete items
  async bulkDeleteItems(req, res) {
    try {
      const { ids } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Danh sách ID không hợp lệ'
        });
      }

      await Item.bulkDelete(ids);

      res.json({
        success: true,
        message: `Đã xóa ${ids.length} vật phẩm thành công`
      });
    } catch (error) {
      console.error('Bulk delete items error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi xóa vật phẩm',
        error: error.message
      });
    }
  }

  // Get items statistics
  async getItemStats(req, res) {
    try {
      const stats = await Item.getStats();

      res.json({
        success: true,
        stats
      });
    } catch (error) {
      console.error('Get item stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy thống kê vật phẩm',
        error: error.message
      });
    }
  }

  // Get item configuration
  async getItemConfig(req, res) {
    try {
      const config = await Item.getConfig();

      res.json({
        success: true,
        config
      });
    } catch (error) {
      console.error('Get item config error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy cấu hình vật phẩm',
        error: error.message
      });
    }
  }

  // Get types by category
  async getTypesByCategory(req, res) {
    try {
      const { categoryId } = req.params;
      const types = await Item.getTypesByCategory(categoryId);

      res.json({
        success: true,
        types
      });
    } catch (error) {
      console.error('Get types by category error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách loại',
        error: error.message
      });
    }
  }
}

module.exports = new ItemController();