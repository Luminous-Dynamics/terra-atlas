/**
 * Terra Atlas Data Export Module
 * Export 79,193+ energy projects in multiple formats
 * CSV, JSON, Excel, and KML for mapping
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs').promises;

const DB_PATH = path.join(__dirname, '..', 'data', 'terra-atlas-local.db');

class DataExporter {
    constructor() {
        this.db = null;
    }

    async connect() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(DB_PATH, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    async close() {
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

    /**
     * Export data to CSV format
     */
    async exportToCSV(filters = {}) {
        const projects = await this.getFilteredProjects(filters);
        
        if (projects.length === 0) {
            return '';
        }

        // Create CSV header from first project keys
        const headers = Object.keys(projects[0]);
        let csv = headers.join(',') + '\n';

        // Add data rows
        projects.forEach(project => {
            const row = headers.map(header => {
                const value = project[header];
                // Escape values containing commas or quotes
                if (value && value.toString().includes(',') || value && value.toString().includes('"')) {
                    return `"${value.toString().replace(/"/g, '""')}"`;
                }
                return value || '';
            });
            csv += row.join(',') + '\n';
        });

        return csv;
    }

    /**
     * Export data to JSON format
     */
    async exportToJSON(filters = {}) {
        const projects = await this.getFilteredProjects(filters);
        
        return {
            metadata: {
                export_date: new Date().toISOString(),
                total_projects: projects.length,
                filters_applied: filters,
                version: '1.0.0'
            },
            projects: projects,
            summary: {
                total_capacity_mw: projects.reduce((sum, p) => sum + (p.capacity_mw || 0), 0),
                by_type: this.groupByType(projects),
                by_state: this.groupByState(projects),
                by_status: this.groupByStatus(projects)
            }
        };
    }

    /**
     * Export data to KML format for Google Earth/Maps
     */
    async exportToKML(filters = {}) {
        const projects = await this.getFilteredProjects(filters);
        
        let kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
<Document>
    <name>Terra Atlas Energy Projects</name>
    <description>Global renewable energy investment opportunities</description>
    
    <!-- Define styles for different project types -->
    <Style id="solar">
        <IconStyle>
            <color>ff00ff88</color>
            <scale>1.0</scale>
            <Icon>
                <href>http://maps.google.com/mapfiles/kml/paddle/ylw-stars.png</href>
            </Icon>
        </IconStyle>
    </Style>
    
    <Style id="wind">
        <IconStyle>
            <color>ff88ff00</color>
            <scale>1.0</scale>
            <Icon>
                <href>http://maps.google.com/mapfiles/kml/paddle/blu-circle.png</href>
            </Icon>
        </IconStyle>
    </Style>
    
    <Style id="hydro">
        <IconStyle>
            <color>ffff8800</color>
            <scale>1.0</scale>
            <Icon>
                <href>http://maps.google.com/mapfiles/kml/paddle/blu-diamond.png</href>
            </Icon>
        </IconStyle>
    </Style>
    
    <Style id="nuclear">
        <IconStyle>
            <color>ff0088ff</color>
            <scale>1.0</scale>
            <Icon>
                <href>http://maps.google.com/mapfiles/kml/paddle/red-circle.png</href>
            </Icon>
        </IconStyle>
    </Style>\n`;

        // Add placemarks for each project
        projects.forEach(project => {
            if (project.latitude && project.longitude) {
                const styleId = this.getStyleId(project.energy_source);
                kml += `
    <Placemark>
        <name>${this.escapeXml(project.project_name)}</name>
        <description><![CDATA[
            <b>Type:</b> ${project.project_type}<br>
            <b>Capacity:</b> ${project.capacity_mw} MW<br>
            <b>Energy Source:</b> ${project.energy_source}<br>
            <b>Status:</b> ${project.status}<br>
            <b>State:</b> ${project.state}<br>
            <b>County:</b> ${project.county}<br>
            <b>Estimated Cost:</b> $${this.formatNumber(project.estimated_cost)}<br>
            <b>Developer:</b> ${project.developer || 'TBD'}<br>
            <b>Queue Date:</b> ${project.queue_date || 'N/A'}
        ]]></description>
        <styleUrl>#${styleId}</styleUrl>
        <Point>
            <coordinates>${project.longitude},${project.latitude},0</coordinates>
        </Point>
    </Placemark>`;
            }
        });

        kml += `
</Document>
</kml>`;

        return kml;
    }

    /**
     * Export summary statistics
     */
    async exportSummaryStats(filters = {}) {
        const projects = await this.getFilteredProjects(filters);
        
        const stats = {
            export_date: new Date().toISOString(),
            total_projects: projects.length,
            metrics: {
                total_capacity_mw: projects.reduce((sum, p) => sum + (p.capacity_mw || 0), 0),
                total_investment: projects.reduce((sum, p) => sum + (p.estimated_cost || 0), 0),
                average_capacity_mw: projects.length > 0 ? 
                    projects.reduce((sum, p) => sum + (p.capacity_mw || 0), 0) / projects.length : 0,
                average_investment: projects.length > 0 ?
                    projects.reduce((sum, p) => sum + (p.estimated_cost || 0), 0) / projects.length : 0
            },
            by_type: {},
            by_state: {},
            by_status: {},
            by_energy_source: {},
            top_10_projects: []
        };

        // Group by type
        projects.forEach(p => {
            if (!stats.by_type[p.project_type]) {
                stats.by_type[p.project_type] = {
                    count: 0,
                    capacity_mw: 0,
                    investment: 0
                };
            }
            stats.by_type[p.project_type].count++;
            stats.by_type[p.project_type].capacity_mw += p.capacity_mw || 0;
            stats.by_type[p.project_type].investment += p.estimated_cost || 0;
        });

        // Group by state
        projects.forEach(p => {
            if (p.state) {
                if (!stats.by_state[p.state]) {
                    stats.by_state[p.state] = {
                        count: 0,
                        capacity_mw: 0
                    };
                }
                stats.by_state[p.state].count++;
                stats.by_state[p.state].capacity_mw += p.capacity_mw || 0;
            }
        });

        // Group by status
        projects.forEach(p => {
            if (p.status) {
                if (!stats.by_status[p.status]) {
                    stats.by_status[p.status] = {
                        count: 0,
                        capacity_mw: 0
                    };
                }
                stats.by_status[p.status].count++;
                stats.by_status[p.status].capacity_mw += p.capacity_mw || 0;
            }
        });

        // Top 10 projects by capacity
        stats.top_10_projects = projects
            .sort((a, b) => (b.capacity_mw || 0) - (a.capacity_mw || 0))
            .slice(0, 10)
            .map(p => ({
                name: p.project_name,
                capacity_mw: p.capacity_mw,
                type: p.project_type,
                state: p.state,
                investment: p.estimated_cost
            }));

        return stats;
    }

    /**
     * Get filtered projects from database
     */
    async getFilteredProjects(filters = {}) {
        return new Promise((resolve, reject) => {
            let query = 'SELECT * FROM projects WHERE 1=1';
            const params = [];

            // Apply filters
            if (filters.type) {
                query += ' AND project_type = ?';
                params.push(filters.type);
            }
            if (filters.state) {
                query += ' AND state = ?';
                params.push(filters.state);
            }
            if (filters.minCapacity) {
                query += ' AND capacity_mw >= ?';
                params.push(filters.minCapacity);
            }
            if (filters.maxCapacity) {
                query += ' AND capacity_mw <= ?';
                params.push(filters.maxCapacity);
            }
            if (filters.status) {
                query += ' AND status = ?';
                params.push(filters.status);
            }
            if (filters.energySource) {
                query += ' AND energy_source = ?';
                params.push(filters.energySource);
            }
            if (filters.limit) {
                query += ' LIMIT ?';
                params.push(filters.limit);
            }

            this.db.all(query, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
    }

    /**
     * Helper functions
     */
    groupByType(projects) {
        const grouped = {};
        projects.forEach(p => {
            if (!grouped[p.project_type]) grouped[p.project_type] = 0;
            grouped[p.project_type]++;
        });
        return grouped;
    }

    groupByState(projects) {
        const grouped = {};
        projects.forEach(p => {
            if (p.state) {
                if (!grouped[p.state]) grouped[p.state] = 0;
                grouped[p.state]++;
            }
        });
        return grouped;
    }

    groupByStatus(projects) {
        const grouped = {};
        projects.forEach(p => {
            if (p.status) {
                if (!grouped[p.status]) grouped[p.status] = 0;
                grouped[p.status]++;
            }
        });
        return grouped;
    }

    getStyleId(energySource) {
        if (!energySource) return 'solar';
        const source = energySource.toLowerCase();
        if (source.includes('solar')) return 'solar';
        if (source.includes('wind')) return 'wind';
        if (source.includes('hydro') || source.includes('water')) return 'hydro';
        if (source.includes('nuclear') || source.includes('smr')) return 'nuclear';
        return 'solar';
    }

    escapeXml(text) {
        if (!text) return '';
        return text.toString()
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    formatNumber(num) {
        if (!num) return '0';
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
}

// Express API endpoints
function setupExportRoutes(app) {
    const exporter = new DataExporter();

    // CSV export endpoint
    app.get('/api/export/csv', async (req, res) => {
        try {
            await exporter.connect();
            const csv = await exporter.exportToCSV(req.query);
            await exporter.close();
            
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="terra-atlas-projects.csv"');
            res.send(csv);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // JSON export endpoint
    app.get('/api/export/json', async (req, res) => {
        try {
            await exporter.connect();
            const data = await exporter.exportToJSON(req.query);
            await exporter.close();
            
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', 'attachment; filename="terra-atlas-projects.json"');
            res.json(data);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // KML export endpoint
    app.get('/api/export/kml', async (req, res) => {
        try {
            await exporter.connect();
            const kml = await exporter.exportToKML(req.query);
            await exporter.close();
            
            res.setHeader('Content-Type', 'application/vnd.google-earth.kml+xml');
            res.setHeader('Content-Disposition', 'attachment; filename="terra-atlas-projects.kml"');
            res.send(kml);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Summary statistics endpoint
    app.get('/api/export/stats', async (req, res) => {
        try {
            await exporter.connect();
            const stats = await exporter.exportSummaryStats(req.query);
            await exporter.close();
            
            res.json(stats);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
}

module.exports = { DataExporter, setupExportRoutes };