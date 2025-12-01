const { supabase } = require('../utils/supabase');

// Middleware to validate item ownership
async function validateItemOwnership(req, res, next) {
  try {
    const userId = req.user.id;
    const { inventoryId } = req.params;

    const { data: inventory, error } = await supabase
      .from('user_inventory')
      .select('id, user_id')
      .eq('id', inventoryId)
      .eq('user_id', userId)
      .single();

    if (error || !inventory) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy vật phẩm trong kho của bạn'
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xác thực quyền sở hữu'
    });
  }
}

// Middleware to check premium status
async function checkPremiumStatus(req, res, next) {
  try {
    const userId = req.user.id;

    const { data: premium } = await supabase
      .from('user_premium')
      .select('id, plan_id, expires_at')
      .eq('user_id', userId)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .single();

    req.user.premium = premium ? {
      active: true,
      plan_id: premium.plan_id,
      expires_at: premium.expires_at
    } : {
      active: false
    };

    next();
  } catch (error) {
    req.user.premium = { active: false };
    next();
  }
}

module.exports = {
  validateItemOwnership,
  checkPremiumStatus
};