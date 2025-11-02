const { supabase } = require('../utils/supabase');

class ShopItem {
  // Get all shop items
  static async findAll(filters = {}) {
    let query = supabase
      .from('shop_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters.category) {
      query = query.eq('category', filters.category);
    }

    if (filters.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    if (filters.is_popular !== undefined) {
      query = query.eq('is_popular', filters.is_popular);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  // Get item by ID
  static async findById(id) {
    const { data, error } = await supabase
      .from('shop_items')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  // Create item
  static async create(itemData) {
    const { data, error } = await supabase
      .from('shop_items')
      .insert([itemData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Update item
  static async update(id, itemData) {
    const { data, error } = await supabase
      .from('shop_items')
      .update(itemData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Delete item
  static async delete(id) {
    const { error } = await supabase
      .from('shop_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  // Get categories
  static async getCategories() {
    const { data, error } = await supabase
      .from('shop_items')
      .select('category')
      .not('category', 'is', null);

    if (error) throw error;
    
    const categories = [...new Set(data.map(item => item.category))];
    return categories;
  }
}

module.exports = ShopItem;