const { supabase } = require('../utils/supabase');

class ShopItem {
  // Get all shop items với join category
  static async findAll(filters = {}) {
    let query = supabase
      .from('shop_items')
      .select(`
        *,
        shop_categories:category_id (
          id,
          name,
          description,
          icon,
          color
        )
      `)
      .order('created_at', { ascending: false });

    if (filters.category_id) {
      query = query.eq('category_id', filters.category_id);
    }

    if (filters.category) {
      query = query.eq('category', filters.category);
    }

    if (filters.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    if (filters.is_popular !== undefined) {
      query = query.eq('is_popular', filters.is_popular);
    }

    if (filters.effect_type) {
      query = query.eq('effect_type', filters.effect_type);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  // Get item by ID với category
  static async findById(id) {
    const { data, error } = await supabase
      .from('shop_items')
      .select(`
        *,
        shop_categories:category_id (
          id,
          name,
          description,
          icon,
          color
        )
      `)
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
      .select(`
        *,
        shop_categories:category_id (
          id,
          name,
          description,
          icon,
          color
        )
      `)
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
      .select(`
        *,
        shop_categories:category_id (
          id,
          name,
          description,
          icon,
          color
        )
      `)
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

  // Get categories từ bảng shop_categories
  static async getCategories() {
    const { data, error } = await supabase
      .from('shop_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data;
  }

  // Tạo category mới
  static async createCategory(categoryData) {
    const { data, error } = await supabase
      .from('shop_categories')
      .insert([categoryData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Cập nhật category
  static async updateCategory(id, categoryData) {
    const { data, error } = await supabase
      .from('shop_categories')
      .update(categoryData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Xóa category
  static async deleteCategory(id) {
    const { error } = await supabase
      .from('shop_categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }
  static async getItemEffects() {
  const { data, error } = await supabase
    .from('item_effects')
    .select('*')
    .order('name');

  if (error) throw error;
  return data;
}

// Lấy items có thể kích hoạt ngay
static async getInstantUseItems() {
  const { data, error } = await supabase
    .from('shop_items')
    .select('*')
    .eq('instant_use', true)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}
// Thêm vào class ShopItem
static async updatePaymentInfo(id, paymentData) {
  const { data, error } = await supabase
    .from('shop_items')
    .update(paymentData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Lấy items theo payment type
static async findByPaymentType(paymentType) {
  const { data, error } = await supabase
    .from('shop_items')
    .select('*')
    .eq('payment_type', paymentType)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}
}

module.exports = ShopItem;