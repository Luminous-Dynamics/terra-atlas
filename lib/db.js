// Database helper for Terra Atlas - Prisma replacement for NixOS
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Create connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://tstoltz@localhost:5434/terra_atlas?host=/srv/luminous-dynamics/terra-atlas-mvp/postgres-data',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection
pool.on('connect', () => {
  console.log('✅ Database connected');
});

pool.on('error', (err) => {
  console.error('❌ Database error:', err);
});

// Database helper functions
const db = {
  // Generic query function
  async query(text, params) {
    const client = await pool.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  },

  // User operations
  user: {
    async findByEmail(email) {
      const result = await db.query(
        'SELECT * FROM users WHERE email = $1 LIMIT 1',
        [email]
      );
      return result.rows[0];
    },

    async findByUsername(username) {
      const result = await db.query(
        'SELECT * FROM users WHERE username = $1 LIMIT 1',
        [username]
      );
      return result.rows[0];
    },

    async findById(id) {
      const result = await db.query(
        'SELECT * FROM users WHERE id = $1 LIMIT 1',
        [id]
      );
      return result.rows[0];
    },

    async create({ email, username, password, fullName }) {
      const passwordHash = await bcrypt.hash(password, 10);
      const result = await db.query(
        `INSERT INTO users (email, username, password_hash, full_name) 
         VALUES ($1, $2, $3, $4) 
         RETURNING id, email, username, full_name, reputation_score, trust_level, created_at`,
        [email, username, passwordHash, fullName]
      );
      return result.rows[0];
    },

    async updateLastLogin(id) {
      await db.query(
        'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
        [id]
      );
    },

    async updateReputation(userId) {
      const result = await db.query(
        'SELECT calculate_user_reputation($1::uuid) as reputation',
        [userId]
      );
      const reputation = result.rows[0].reputation;
      
      // Update user's reputation and trust level
      let trustLevel = 'novice';
      if (reputation > 2000) trustLevel = 'guardian';
      else if (reputation > 500) trustLevel = 'expert';
      else if (reputation > 100) trustLevel = 'contributor';
      
      await db.query(
        'UPDATE users SET reputation_score = $1, trust_level = $2 WHERE id = $3',
        [reputation, trustLevel, userId]
      );
      
      return { reputation, trustLevel };
    }
  },

  // Validation operations
  validation: {
    async create({ userId, dataPointId, validationType, comment, evidenceUrls, ipAddress, userAgent }) {
      // Check for existing validation
      const existing = await db.query(
        'SELECT * FROM validations WHERE user_id = $1 AND data_point_id = $2',
        [userId, dataPointId]
      );

      let result;
      if (existing.rows.length > 0) {
        // Update existing
        result = await db.query(
          `UPDATE validations SET 
           validation_type = $3, comment = $4, evidence_urls = $5, 
           ip_address = $6, user_agent = $7, updated_at = CURRENT_TIMESTAMP
           WHERE user_id = $1 AND data_point_id = $2
           RETURNING *`,
          [userId, dataPointId, validationType, comment, evidenceUrls, ipAddress, userAgent]
        );
      } else {
        // Create new
        result = await db.query(
          `INSERT INTO validations (user_id, data_point_id, validation_type, comment, evidence_urls, ip_address, user_agent)
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
          [userId, dataPointId, validationType, comment, evidenceUrls, ipAddress, userAgent]
        );
      }

      // Update data point trust score
      await db.query('SELECT update_data_point_trust_score($1::uuid)', [dataPointId]);
      
      return result.rows[0];
    },

    async findByDataPoint(dataPointId, limit = 100, offset = 0) {
      const result = await db.query(
        `SELECT v.*, u.username, u.avatar_url, u.trust_level, u.reputation_score
         FROM validations v
         JOIN users u ON v.user_id = u.id
         WHERE v.data_point_id = $1
         ORDER BY v.created_at DESC
         LIMIT $2 OFFSET $3`,
        [dataPointId, limit, offset]
      );
      return result.rows;
    },

    async delete(userId, dataPointId) {
      const result = await db.query(
        'DELETE FROM validations WHERE user_id = $1 AND data_point_id = $2 RETURNING *',
        [userId, dataPointId]
      );
      
      if (result.rows.length > 0) {
        // Update data point trust score
        await db.query('SELECT update_data_point_trust_score($1::uuid)', [dataPointId]);
      }
      
      return result.rows[0];
    }
  },

  // Session operations
  session: {
    async create({ userId, refreshTokenHash, ipAddress, userAgent, expiresIn = 30 }) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresIn);
      
      const result = await db.query(
        `INSERT INTO sessions (user_id, refresh_token_hash, ip_address, user_agent, expires_at)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [userId, refreshTokenHash, ipAddress, userAgent, expiresAt]
      );
      return result.rows[0];
    },

    async findByToken(refreshTokenHash) {
      const result = await db.query(
        'SELECT * FROM sessions WHERE refresh_token_hash = $1 AND is_active = true AND expires_at > NOW()',
        [refreshTokenHash]
      );
      return result.rows[0];
    },

    async revoke(id, reason) {
      await db.query(
        'UPDATE sessions SET is_active = false, revoked_at = CURRENT_TIMESTAMP, revoked_reason = $2 WHERE id = $1',
        [id, reason]
      );
    }
  },

  // API Key operations
  apiKey: {
    async create({ userId, keyHash, keyPrefix, name, description, scopes, rateLimit, expiresAt }) {
      const result = await db.query(
        `INSERT INTO user_api_keys (user_id, key_hash, key_prefix, name, description, scopes, rate_limit, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [userId, keyHash, keyPrefix, name, description, scopes, rateLimit, expiresAt]
      );
      return result.rows[0];
    },

    async findByUser(userId) {
      const result = await db.query(
        `SELECT id, name, description, key_prefix, scopes, rate_limit, is_active, 
                expires_at, last_used_at, created_at, requests_count
         FROM user_api_keys 
         WHERE user_id = $1 AND revoked_at IS NULL
         ORDER BY created_at DESC`,
        [userId]
      );
      return result.rows;
    },

    async findByHash(keyHash) {
      const result = await db.query(
        'SELECT * FROM user_api_keys WHERE key_hash = $1 AND is_active = true',
        [keyHash]
      );
      return result.rows[0];
    },

    async update(id, updates) {
      const fields = [];
      const values = [];
      let paramCount = 1;

      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined) {
          fields.push(`${key} = $${paramCount}`);
          values.push(value);
          paramCount++;
        }
      });

      values.push(id);
      const result = await db.query(
        `UPDATE user_api_keys SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
        values
      );
      return result.rows[0];
    },

    async revoke(id) {
      await db.query(
        'UPDATE user_api_keys SET is_active = false, revoked_at = CURRENT_TIMESTAMP WHERE id = $1',
        [id]
      );
    }
  },

  // Activity logging
  activity: {
    async log({ userId, apiKeyId, action, resourceType, resourceId, ipAddress, userAgent, requestMethod, requestPath, statusCode }) {
      await db.query(
        `INSERT INTO activity_log (user_id, api_key_id, action, resource_type, resource_id, 
                                   ip_address, user_agent, request_method, request_path, status_code)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [userId, apiKeyId, action, resourceType, resourceId, ipAddress, userAgent, requestMethod, requestPath, statusCode]
      );
    }
  },

  // Data point operations
  dataPoint: {
    async create(data) {
      const result = await db.query(
        `INSERT INTO data_points (latitude, longitude, data_type, source_id, source_name, 
                                  title, description, properties, severity, confidence, observed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
        [data.latitude, data.longitude, data.dataType, data.sourceId, data.sourceName,
         data.title, data.description, data.properties, data.severity, data.confidence, data.observedAt]
      );
      return result.rows[0];
    },

    async findById(id) {
      const result = await db.query(
        'SELECT * FROM data_points WHERE id = $1',
        [id]
      );
      return result.rows[0];
    },

    async findByArea(minLat, maxLat, minLng, maxLng, limit = 1000) {
      const result = await db.query(
        `SELECT * FROM data_points 
         WHERE latitude BETWEEN $1 AND $2 
         AND longitude BETWEEN $3 AND $4
         ORDER BY trust_score DESC
         LIMIT $5`,
        [minLat, maxLat, minLng, maxLng, limit]
      );
      return result.rows;
    }
  }
};

module.exports = db;