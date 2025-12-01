function validateEffectConfig(itemType, effectConfig) {
  const validators = {
    xp_boost: (config) => {
      if (!config.value || config.value < 1 || config.value > 5) {
        return { valid: false, message: 'XP boost value phải từ 1 đến 5' };
      }
      if (!config.duration || config.duration < 1) {
        return { valid: false, message: 'Duration phải lớn hơn 0' };
      }
      return { valid: true };
    },
    coin_boost: (config) => {
      if (!config.value || config.value < 1 || config.value > 5) {
        return { valid: false, message: 'Coin boost value phải từ 1 đến 5' };
      }
      if (!config.duration || config.duration < 1) {
        return { valid: false, message: 'Duration phải lớn hơn 0' };
      }
      return { valid: true };
    },
    streak_freeze: (config) => {
      if (!config.duration || config.duration < 1) {
        return { valid: false, message: 'Duration phải lớn hơn 0' };
      }
      return { valid: true };
    },
    streak_repair: (config) => {
      if (!config.max_days || config.max_days < 1 || config.max_days > 7) {
        return { valid: false, message: 'Max days phải từ 1 đến 7' };
      }
      return { valid: true };
    },
    avatar: (config) => {
      if (!config.unlock_type || !['permanent', 'timed'].includes(config.unlock_type)) {
        return { valid: false, message: 'Unlock type phải là permanent hoặc timed' };
      }
      if (config.unlock_type === 'timed' && (!config.duration || config.duration < 1)) {
        return { valid: false, message: 'Timed unlock cần có duration' };
      }
      return { valid: true };
    },
    theme: (config) => {
      if (!config.unlock_type || !['permanent', 'timed'].includes(config.unlock_type)) {
        return { valid: false, message: 'Unlock type phải là permanent hoặc timed' };
      }
      if (config.unlock_type === 'timed' && (!config.duration || config.duration < 1)) {
        return { valid: false, message: 'Timed unlock cần có duration' };
      }
      return { valid: true };
    }
  };

  const validator = validators[itemType];
  if (!validator) {
    return { valid: false, message: `Loại item ${itemType} không được hỗ trợ` };
  }

  return validator(effectConfig);
}

function calculateItemValue(item) {
  // Calculate item value based on rarity and effects
  let baseValue = 0;
  
  const rarityMultipliers = {
    common: 1,
    rare: 2,
    epic: 4,
    legendary: 8
  };

  const multiplier = rarityMultipliers[item.rarity] || 1;
  
  if (item.price_coins > 0) {
    baseValue = item.price_coins * multiplier;
  } else if (item.price_gems > 0) {
    baseValue = item.price_gems * 100 * multiplier; // 1 gem = 100 coins equivalent
  }

  return baseValue;
}

function isItemExpired(activation) {
  if (!activation.expires_at) return false;
  return new Date(activation.expires_at) < new Date();
}

module.exports = {
  validateEffectConfig,
  calculateItemValue,
  isItemExpired
};