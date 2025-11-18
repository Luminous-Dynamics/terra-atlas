/**
 * Terra Atlas Local Database API
 * High-performance API for 79,193+ energy projects
 * Zero-cost local development with production-ready performance
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'terra-atlas-local.db');

class TerraAtlasAPI {
  constructor() {
    this.db = null;
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      } else {
        resolve();
      }
    });
  }

  // Get projects with intelligent filtering and pagination
  async getProjects({
    type = null,
    state = null,
    minCapacity = null,
    maxCapacity = null,
    status = null,
    energySource = null,
    search = null,
    sortBy = 'capacity_mw',
    sortOrder = 'DESC',
    limit = 100,
    offset = 0,
    bounds = null // { north, south, east, west } for map viewport
  } = {}) {
    let query = 'SELECT * FROM projects WHERE 1=1';
    const params = [];

    // Build dynamic query
    if (type) {
      query += ' AND project_type = ?';
      params.push(type);
    }
    
    if (state) {
      query += ' AND state = ?';
      params.push(state);
    }
    
    if (minCapacity !== null) {
      query += ' AND capacity_mw >= ?';
      params.push(minCapacity);
    }
    
    if (maxCapacity !== null) {
      query += ' AND capacity_mw <= ?';
      params.push(maxCapacity);
    }
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    if (energySource) {
      query += ' AND energy_source = ?';
      params.push(energySource);
    }
    
    if (bounds) {
      query += ' AND latitude BETWEEN ? AND ? AND longitude BETWEEN ? AND ?';
      params.push(bounds.south, bounds.north, bounds.west, bounds.east);
    }
    
    if (search) {
      query += ' AND (project_name LIKE ? OR developer LIKE ? OR county LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    // Add sorting
    const allowedSortColumns = ['capacity_mw', 'total_cost', 'overall_viability_score', 'year_completed', 'project_name'];
    if (allowedSortColumns.includes(sortBy)) {
      query += ` ORDER BY ${sortBy} ${sortOrder === 'ASC' ? 'ASC' : 'DESC'}`;
    }

    // Add pagination
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    return new Promise((resolve, reject) => {
      this.db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Get aggregated statistics
  async getStatistics(groupBy = 'state') {
    const validGroupings = ['state', 'project_type', 'energy_source', 'status'];
    
    if (!validGroupings.includes(groupBy)) {
      groupBy = 'state';
    }

    const query = `
      SELECT 
        ${groupBy} as category,
        COUNT(*) as project_count,
        SUM(capacity_mw) as total_capacity_mw,
        AVG(capacity_mw) as avg_capacity_mw,
        SUM(total_cost) as total_investment,
        SUM(jobs_created) as total_jobs,
        AVG(overall_viability_score) as avg_viability_score,
        MIN(latitude) as min_lat,
        MAX(latitude) as max_lat,
        MIN(longitude) as min_lng,
        MAX(longitude) as max_lng
      FROM projects
      WHERE ${groupBy} IS NOT NULL
      GROUP BY ${groupBy}
      ORDER BY total_capacity_mw DESC
    `;

    return new Promise((resolve, reject) => {
      this.db.all(query, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Get projects near a specific location
  async getNearbyProjects(lat, lng, radiusMiles = 50, limit = 100) {
    // Simple distance calculation (approximate)
    // 1 degree latitude = ~69 miles
    // 1 degree longitude = ~69 miles * cos(latitude)
    const latRadius = radiusMiles / 69;
    const lngRadius = radiusMiles / (69 * Math.cos(lat * Math.PI / 180));

    const query = `
      SELECT *,
        (
          3959 * acos(
            cos(radians(?)) * cos(radians(latitude)) * 
            cos(radians(longitude) - radians(?)) + 
            sin(radians(?)) * sin(radians(latitude))
          )
        ) AS distance_miles
      FROM projects
      WHERE latitude BETWEEN ? AND ?
        AND longitude BETWEEN ? AND ?
      ORDER BY distance_miles
      LIMIT ?
    `;

    const params = [
      lat, lng, lat,
      lat - latRadius, lat + latRadius,
      lng - lngRadius, lng + lngRadius,
      limit
    ];

    return new Promise((resolve, reject) => {
      this.db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Get top opportunities based on viability scoring
  async getTopOpportunities(limit = 100) {
    const query = `
      SELECT *
      FROM projects
      WHERE overall_viability_score IS NOT NULL
        AND status IN ('Retrofit Opportunity', 'In Development', 'In Licensing', 'Active')
      ORDER BY overall_viability_score DESC, capacity_mw DESC
      LIMIT ?
    `;

    return new Promise((resolve, reject) => {
      this.db.all(query, [limit], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Full-text search
  async searchProjects(searchTerm, limit = 100) {
    const query = `
      SELECT p.*
      FROM projects p
      JOIN projects_search ps ON p.rowid = ps.rowid
      WHERE projects_search MATCH ?
      ORDER BY rank
      LIMIT ?
    `;

    return new Promise((resolve, reject) => {
      this.db.all(query, [searchTerm, limit], (err, rows) => {
        if (err) {
          // Fallback to LIKE search if FTS5 isn't available
          const fallbackQuery = `
            SELECT *
            FROM projects
            WHERE project_name LIKE ? 
               OR developer LIKE ?
               OR state LIKE ?
               OR county LIKE ?
               OR energy_source LIKE ?
            LIMIT ?
          `;
          const searchPattern = `%${searchTerm}%`;
          this.db.all(fallbackQuery, 
            [searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, limit],
            (err2, rows2) => {
              if (err2) reject(err2);
              else resolve(rows2);
            }
          );
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Get investment opportunities by state
  async getInvestmentOpportunities(state = null) {
    let query = `
      SELECT 
        state,
        COUNT(*) as opportunity_count,
        SUM(capacity_mw) as total_capacity_mw,
        SUM(total_cost) as total_investment_needed,
        AVG(payback_period_years) as avg_payback_years,
        AVG(levelized_cost_per_mwh) as avg_lcoe,
        SUM(annual_revenue_potential) as total_annual_revenue,
        SUM(jobs_created) as total_jobs_potential,
        AVG(overall_viability_score) as avg_viability
      FROM projects
      WHERE total_cost IS NOT NULL
        AND overall_viability_score > 50
    `;

    const params = [];
    if (state) {
      query += ' AND state = ?';
      params.push(state);
    }

    query += ' GROUP BY state ORDER BY total_investment_needed DESC';

    return new Promise((resolve, reject) => {
      this.db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Get project by ID
  async getProject(id) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM projects WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  // Get summary dashboard data
  async getDashboardSummary() {
    const query = `
      SELECT 
        (SELECT COUNT(*) FROM projects) as total_projects,
        (SELECT COUNT(DISTINCT state) FROM projects WHERE state IS NOT NULL) as states_covered,
        (SELECT SUM(capacity_mw) FROM projects) as total_capacity_mw,
        (SELECT SUM(capacity_mw) FROM projects WHERE project_type = 'ferc') as ferc_capacity_mw,
        (SELECT SUM(capacity_mw) FROM projects WHERE project_type = 'usace') as hydro_capacity_mw,
        (SELECT SUM(capacity_mw) FROM projects WHERE project_type = 'smr') as nuclear_capacity_mw,
        (SELECT SUM(total_cost) FROM projects WHERE total_cost IS NOT NULL) as total_investment,
        (SELECT SUM(jobs_created) FROM projects WHERE jobs_created IS NOT NULL) as total_jobs,
        (SELECT SUM(carbon_avoided_tons_per_year) FROM projects WHERE carbon_avoided_tons_per_year IS NOT NULL) as total_carbon_avoided,
        (SELECT COUNT(*) FROM projects WHERE operational = 1) as operational_count,
        (SELECT COUNT(*) FROM projects WHERE status LIKE '%Development%' OR status LIKE '%Licensing%') as in_development_count,
        (SELECT AVG(overall_viability_score) FROM projects WHERE overall_viability_score IS NOT NULL) as avg_viability
    `;

    return new Promise((resolve, reject) => {
      this.db.get(query, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }
}

// Express.js route handlers if using as middleware
function createAPIRoutes(app) {
  const api = new TerraAtlasAPI();
  
  // Connect to database on startup
  api.connect().then(() => {
    console.log('Connected to Terra Atlas database');
  });

  // GET /api/projects
  app.get('/api/projects', async (req, res) => {
    try {
      const projects = await api.getProjects(req.query);
      res.json({ success: true, data: projects });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // GET /api/projects/:id
  app.get('/api/projects/:id', async (req, res) => {
    try {
      const project = await api.getProject(req.params.id);
      if (project) {
        res.json({ success: true, data: project });
      } else {
        res.status(404).json({ success: false, error: 'Project not found' });
      }
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // GET /api/statistics
  app.get('/api/statistics', async (req, res) => {
    try {
      const stats = await api.getStatistics(req.query.groupBy);
      res.json({ success: true, data: stats });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // GET /api/nearby
  app.get('/api/nearby', async (req, res) => {
    try {
      const { lat, lng, radius, limit } = req.query;
      const projects = await api.getNearbyProjects(
        parseFloat(lat),
        parseFloat(lng),
        parseInt(radius) || 50,
        parseInt(limit) || 100
      );
      res.json({ success: true, data: projects });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // GET /api/opportunities
  app.get('/api/opportunities', async (req, res) => {
    try {
      const opportunities = await api.getTopOpportunities(parseInt(req.query.limit) || 100);
      res.json({ success: true, data: opportunities });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // GET /api/search
  app.get('/api/search', async (req, res) => {
    try {
      const results = await api.searchProjects(req.query.q, parseInt(req.query.limit) || 100);
      res.json({ success: true, data: results });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // GET /api/dashboard
  app.get('/api/dashboard', async (req, res) => {
    try {
      const summary = await api.getDashboardSummary();
      res.json({ success: true, data: summary });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // GET /api/investments
  app.get('/api/investments', async (req, res) => {
    try {
      const investments = await api.getInvestmentOpportunities(req.query.state);
      res.json({ success: true, data: investments });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    api.close().then(() => {
      console.log('Database connection closed');
      process.exit(0);
    });
  });

  return api;
}

module.exports = {
  TerraAtlasAPI,
  createAPIRoutes
};