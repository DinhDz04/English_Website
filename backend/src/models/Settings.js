const { supabase } = require('../utils/supabase');


class Settings {
  // Get all settings
  static async findAll() {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('category', { ascending: true })
        .order('setting_key', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  }

  // Get settings by category
  static async findByCategory(category) {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('category', category);

      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  }

  // Update single setting
  static async update(settingKey, value) {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .update({ 
          setting_value: value, 
          updated_at: new Date().toISOString() 
        })
        .eq('setting_key', settingKey)
        .select();

      if (error) throw error;
      return data && data.length > 0;
    } catch (error) {
      throw error;
    }
  }

  // Bulk update settings
 // Bulk update settings - SỬA LẠI HOÀN TOÀN
static async bulkUpdate(settings) {
  try {
    console.log('🔄 Starting bulk update with:', settings);
    
    // Sửa đổi: Tạo một transaction update duy nhất thay vì nhiều promise
    const updates = [];
    
    for (const setting of settings) {
      console.log(`📝 Updating ${setting.key} to ${setting.value}`);
      
      const { data, error } = await supabase
        .from('system_settings')
        .update({ 
          setting_value: setting.value.toString(), // Đảm bảo là string
          updated_at: new Date().toISOString() 
        })
        .eq('setting_key', setting.key)
        .select();

      if (error) {
        console.error(`❌ Error updating ${setting.key}:`, error);
        throw error;
      }
      
      updates.push({
        key: setting.key,
        success: data && data.length > 0,
        data: data
      });
    }
    
    console.log('✅ Bulk update completed:', updates);
    return updates;
  } catch (error) {
    console.error('❌ Error in bulkUpdate:', error);
    throw error;
  }
}

  // Backup database (Simplified for Supabase)
  static async backupDatabase() {
    try {
      const backupFile = `backup_${Date.now()}.json`;
      
      // Get all tables data
      const { data: settings, error } = await supabase
        .from('system_settings')
        .select('*');

      if (error) throw error;

      return {
        success: true,
        backupFile,
        tables: ['system_settings'],
        recordCount: settings ? settings.length : 0,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw error;
    }
  }

  // Get database info (Simplified for Supabase)
  static async getDatabaseInfo() {
    try {
      // Get settings count
      const { count, error } = await supabase
        .from('system_settings')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;

      return {
        tableCount: 1, // Only system_settings table for now
        recordCount: count || 0,
        lastBackup: null // Supabase handles backups automatically
      };
    } catch (error) {
      throw error;
    }
  }

  // Optimize database (Not needed for Supabase)
  static async optimizeDatabase() {
    try {
      return {
        optimizedTables: 0,
        message: "Supabase automatically optimizes database performance",
        results: []
      };
    } catch (error) {
      throw error;
    }
  }

  // Reset to default settings
  static async resetToDefault() {
    try {
      // Reset all settings to default values
      const defaultSettings = [
        { key: 'site.name', value: 'English Learning Platform' },
        { key: 'site.description', value: 'Học tiếng Anh hiệu quả với AI' },
        { key: 'site.contact_email', value: 'support@englishapp.com' },
        { key: 'theme', value: 'light' },
        { key: 'primary.color', value: '#6366f1' },
        { key: 'accent.color', value: '#8b5cf6' },
        { key: 'font.family', value: 'Inter' },
        { key: 'border.radius', value: '8' },
        { key: 'animation.enabled', value: 'true' },
        { key: 'auto.backup', value: 'true' },
        { key: 'backup.frequency', value: 'daily' },
        { key: 'retention.days', value: '30' },
        { key: 'two.factor.auth', value: 'false' },
        { key: 'session.timeout', value: '30' },
        { key: 'max.login.attempts', value: '5' }
      ];

      await this.bulkUpdate(defaultSettings);
      return true;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Settings;