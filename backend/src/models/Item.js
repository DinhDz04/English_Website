// backend/src/models/Item.js
const { supabase } = require('../utils/supabase');

class Item {
  // Get all items with pagination and filters
  static async findAll(options = {}) {
    const { page = 1, limit = 50, search = '', category, type, rarity } = options;

    let query = supabase
      .from('items')
      .select(`
        *,
        item_categories:category_id(name, code),
        item_types:type_id(name, code)
      `, { count: 'exact' });

    if (search) {
      query = query.or(`items.name.ilike.%${search}%,items.description.ilike.%${search}%`);
    }

    if (category) {
      query = query.eq('category_id', category);
    }

    if (type) {
      query = query.eq('type_id', type);
    }

    if (rarity) {
      query = query.eq('rarity', rarity);
    }

    const { data, error, count } = await query
      .range((page - 1) * limit, page * limit - 1)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      items: data,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  // Get item by ID
  static async findById(id) {
    const { data, error } = await supabase
      .from('items')
      .select(`
        *,
        item_categories:category_id(*),
        item_types:type_id(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  // Create item
  static async create(itemData) {
    const { data, error } = await supabase
      .from('items')
      .insert([itemData])
      .select(`
        *,
        item_categories:category_id(*),
        item_types:type_id(*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  // Update item
  static async update(id, itemData) {
    const { data, error } = await supabase
      .from('items')
      .update(itemData)
      .eq('id', id)
      .select(`
        *,
        item_categories:category_id(*),
        item_types:type_id(*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  // Delete item
  static async delete(id) {
    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  // Bulk delete items
  static async bulkDelete(ids) {
    const { error } = await supabase
      .from('items')
      .delete()
      .in('id', ids);

    if (error) throw error;
    return true;
  }

  // Get item statistics
  static async getStats() {
    const { data, error } = await supabase
      .from('items')
      .select('type, rarity, is_active');

    if (error) throw error;

    const stats = {
      by_type: {},
      by_rarity: {},
      by_status: { active: 0, inactive: 0 },
      total: data.length
    };

    data.forEach(item => {
      // Count by type
      stats.by_type[item.type] = (stats.by_type[item.type] || 0) + 1;
      
      // Count by rarity
      stats.by_rarity[item.rarity] = (stats.by_rarity[item.rarity] || 0) + 1;
      
      // Count by status
      if (item.is_active) {
        stats.by_status.active++;
      } else {
        stats.by_status.inactive++;
      }
    });

    return stats;
  }

  // Get item configuration (categories, types, templates)
  static async getConfig() {
    // Get categories
    const { data: categories, error: categoriesError } = await supabase
      .from('item_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (categoriesError) throw categoriesError;

    // Get types
    const { data: types, error: typesError } = await supabase
      .from('item_types')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (typesError) throw typesError;

    // Effect templates
    const effectTemplates = {
      boosts: [
        {
          code: 'xp_boost',
          name: 'Tăng kinh nghiệm',
          fields: [
            { name: 'value', type: 'number', label: 'Hệ số tăng', required: true, min: 1, max: 5, step: 0.1 },
            { name: 'duration', type: 'duration', label: 'Thời gian hiệu lực', required: true }
          ]
        },
        {
          code: 'coin_boost', 
          name: 'Tăng vàng',
          fields: [
            { name: 'value', type: 'number', label: 'Hệ số tăng', required: true, min: 1, max: 5, step: 0.1 },
            { name: 'duration', type: 'duration', label: 'Thời gian hiệu lực', required: true }
          ]
        }
      ],
      protections: [
        {
          code: 'streak_freeze',
          name: 'Bảo vệ chuỗi',
          fields: [
            { name: 'duration', type: 'duration', label: 'Thời gian bảo vệ', required: true }
          ]
        },
        {
          code: 'streak_repair',
          name: 'Phục hồi chuỗi',
          fields: [
            { name: 'max_days', type: 'number', label: 'Số ngày phục hồi tối đa', required: true }
          ]
        }
      ],
      cosmetics: [
        {
          code: 'avatar',
          name: 'Avatar',
          fields: [
            { name: 'unlock_type', type: 'select', label: 'Loại mở khóa', options: ['permanent', 'timed'], required: true }
          ]
        },
        {
          code: 'theme',
          name: 'Giao diện',
          fields: [
            { name: 'unlock_type', type: 'select', label: 'Loại mở khóa', options: ['permanent', 'timed'], required: true }
          ]
        }
      ],
      utilities: [
        {
          code: 'name_change',
          name: 'Đổi tên',
          fields: [
            { name: 'max_uses', type: 'number', label: 'Số lần sử dụng tối đa', required: true, min: 1 }
          ]
        }
      ]
    };

    return {
      categories: categories || [],
      types: types || [],
      effectTemplates
    };
  }

  // Get types by category
  static async getTypesByCategory(categoryId) {
    const { data, error } = await supabase
      .from('item_types')
      .select('*')
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data || [];
  }
}

module.exports = Item;