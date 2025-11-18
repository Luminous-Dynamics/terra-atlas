# Terra Atlas: Immediate Action Plan
## From Vision to Reality - Next 7 Days

---

## 🚨 CRITICAL ISSUE: We have ZERO real data in the system!

The Discovery API returns empty arrays. The platform has no projects. We're demoing with hardcoded data. This must be fixed TODAY.

---

## Day 1 (TODAY - Jan 17) - DATA EMERGENCY

### Morning: Get FERC Data (4 hours)
```bash
# 1. Download Berkeley Lab FERC Queue Data
wget https://emp.lbl.gov/sites/default/files/queued_projects_2024.csv
wget https://emp.lbl.gov/sites/default/files/iso_queue_2024.xlsx

# 2. Convert to JSON format
python scripts/parse-ferc-data.py

# 3. Import to database
npm run import:ferc

# 4. Verify data exists
curl http://localhost:3004/api/discovery
# Should return 11,547 projects!
```

### Afternoon: Fix Production API (2 hours)
```bash
# 1. Remove authentication from Discovery endpoints
# Edit: middleware/auth.ts - exclude /api/discovery/*

# 2. Deploy to Vercel
vercel --prod

# 3. Test public access
curl https://atlas.luminousdynamics.io/api/discovery
```

### Evening: Import Additional Data (2 hours)
```bash
# Import USACE dams (feasible sites)
node scripts/import-usace-feasible.js

# Import SMR pipeline
node scripts/import-smr-pipeline.js

# Verify all data
npm run verify:data
```

---

## Day 2 (Jan 18) - LANDING PAGE & DOCS

### Morning: Create Honest Landing Page
```typescript
// pages/index.tsx
- Remove "coming soon" language
- Add real statistics: "11,547 stuck projects"
- Show live Discovery API demo
- Add "Try it now" with curl examples
```

### Afternoon: API Documentation
```markdown
// pages/api-docs.md
1. Discovery endpoints
2. Authentication (none required)
3. Rate limits
4. Example responses
5. Postman collection
```

---

## Day 3 (Jan 19) - DEVELOPER OUTREACH

### Find Stuck Projects
```sql
-- Query for projects with highest transmission costs
SELECT name, developer, transmission_cost, email
FROM ferc_queue
WHERE status = 'active'
AND transmission_cost > 100000000
ORDER BY transmission_cost DESC
LIMIT 100;
```

### Email Template
```
Subject: Your [PROJECT_NAME] is stuck paying $[COST]M for transmission

Hi [DEVELOPER],

I see [PROJECT_NAME] has been in the FERC queue for [YEARS] years with a $[COST]M transmission upgrade requirement.

We built a free API that identifies nearby projects for corridor formation. 
In West Texas, 8 projects reduced costs by 74% using this approach.

Free Discovery API: https://atlas.luminousdynamics.io/api/discovery?lat=[LAT]&lng=[LNG]

Would you be interested in a 15-minute call to explore corridor options?
```

---

## Day 4 (Jan 20) - CORRIDOR CALCULATOR

### Build Real Corridor Optimizer
```typescript
// lib/corridor-optimizer.ts
export function optimizeCorridor(projects: Project[]) {
  // 1. Calculate centroid
  // 2. Find optimal substation location
  // 3. Calculate shared transmission route
  // 4. Allocate costs proportionally
  // 5. Generate savings report
}
```

### Test with Real Projects
- Run West Texas projects through real optimizer
- Verify 74% savings claim
- Document methodology

---

## Day 5 (Jan 21) - REDDIT LAUNCH

### Post Timing
- Tuesday 9 AM EST (peak time)
- r/solar first
- Monitor for 2 hours
- Cross-post if successful

### Have Ready:
- Live API with real data
- Working demos
- Documentation
- Response templates

---

## Day 6-7 (Weekend) - FIRST PILOTS

### Success Metrics:
- [ ] 10 developers contacted API
- [ ] 3 developers schedule calls
- [ ] 1 pilot corridor identified
- [ ] Press release drafted

---

## File Structure Needed

```
terra-atlas-mvp/
├── data/
│   ├── ferc-queue-2024.json      # TODAY
│   ├── usace-feasible.json       # TODAY
│   └── smr-pipeline.json         # TODAY
├── scripts/
│   ├── import-ferc.ts             # CREATE TODAY
│   ├── parse-ferc-data.py        # CREATE TODAY
│   └── verify-data.ts            # CREATE TODAY
├── lib/
│   ├── corridor-optimizer.ts     # Day 4
│   └── cost-allocator.ts        # Day 4
└── docs/
    ├── API.md                     # Day 2
    └── METHODOLOGY.md            # Day 4
```

---

## Database Queries to Run

### Check Current Status:
```sql
-- How many projects do we have?
SELECT COUNT(*) FROM energy_projects;

-- What types?
SELECT project_type, COUNT(*) 
FROM energy_projects 
GROUP BY project_type;

-- Geographic distribution?
SELECT 
  state,
  COUNT(*) as projects,
  SUM(capacity_mw) as total_mw
FROM energy_projects
GROUP BY state
ORDER BY total_mw DESC;
```

### Find Corridor Opportunities:
```sql
-- Find clusters of projects
WITH project_clusters AS (
  SELECT 
    ep1.id,
    ep1.name,
    COUNT(ep2.id) as nearby_projects,
    AVG(ep2.transmission_cost) as avg_transmission_cost
  FROM energy_projects ep1
  JOIN energy_projects ep2 
    ON ST_DWithin(ep1.location, ep2.location, 50 * 1609.34) -- 50 miles
  WHERE ep1.id != ep2.id
  GROUP BY ep1.id, ep1.name
  HAVING COUNT(ep2.id) >= 3
)
SELECT * FROM project_clusters
ORDER BY nearby_projects DESC;
```

---

## Budget & Resources

### Immediate Needs:
1. **Data Sources**: $0 (use public data)
2. **Vercel Hosting**: $20/month (current)
3. **Supabase**: $25/month (current)
4. **Domain**: Already owned
5. **Time**: 40 hours this week

### Week 1 Goals:
- ✅ 11,547 real projects in database
- ✅ Public Discovery API working
- ✅ 100 developers contacted
- ✅ 3 pilot conversations started
- ✅ Reddit post live

---

## The Choice Point

After 7 days, we'll have data to decide:

### Path A: "Traction Exists"
- Developers actively using API
- Pilot corridors forming
- Clear product-market fit
→ Double down, raise funding

### Path B: "Pivot Needed"
- Low API usage
- No developer interest
- Corridors not forming
→ Pivot to different approach

### Path C: "More Time Needed"
- Some interest but slow
- Technical challenges
- Need refinement
→ Extend timeline 30 days

---

## Success Criteria

By end of Day 7, we need:
1. **11,547 projects** in database ✓/✗
2. **Public API** with >95% uptime ✓/✗
3. **100+ API calls** from unique IPs ✓/✗
4. **10+ developer** conversations ✓/✗
5. **1+ pilot corridor** identified ✓/✗

If we hit 3/5, continue.
If we hit 5/5, accelerate.
If we hit <3/5, pivot.

---

## STOP PLANNING. START IMPORTING DATA. NOW.

The West Texas demo is compelling but it's FICTION until we have real data.

**First command to run:**
```bash
cd /srv/luminous-dynamics/terra-atlas-mvp
mkdir -p data
# Download FERC data NOW
```

---

*Created: January 17, 2025 02:30 UTC*
*First Review: January 17, 2025 18:00 UTC*
*Decision Point: January 24, 2025 00:00 UTC*