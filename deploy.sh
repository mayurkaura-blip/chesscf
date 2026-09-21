#!/bin/bash
# ═══════════════════════════════════════════════════
# ChessCF — Full Deployment Script
# chess.mayurdemo.xyz on Cloudflare
# ═══════════════════════════════════════════════════

set -e
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'

echo -e "${GREEN}♟ ChessCF — Cloudflare Deployment${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── STEP 0: Auth ─────────────────────────────────
echo -e "${YELLOW}[0] Checking wrangler auth...${NC}"
wrangler whoami || { echo -e "${RED}Run: wrangler login${NC}"; exit 1; }

# ── STEP 1: Create D1 database ───────────────────
echo -e "${YELLOW}[1] Creating D1 database...${NC}"
DB_ID=$(wrangler d1 create chesscf-db --json 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('uuid',''))" 2>/dev/null || echo "")
if [ -z "$DB_ID" ]; then
  echo "DB already exists or getting ID..."
  DB_ID=$(wrangler d1 list --json 2>/dev/null | python3 -c "import sys,json; dbs=json.load(sys.stdin); [print(d['uuid']) for d in dbs if d['name']=='chesscf-db']" 2>/dev/null || echo "PLACEHOLDER")
fi
echo "D1 ID: $DB_ID"
# Patch wrangler.toml
sed -i "s/REPLACE_AFTER_wrangler_d1_create/$DB_ID/g" wrangler.toml
echo -e "${GREEN}✓ D1 ready${NC}"

# ── STEP 2: Create KV namespace ──────────────────
echo -e "${YELLOW}[2] Creating KV namespace...${NC}"
KV_ID=$(wrangler kv namespace create CHESSCF_KV --json 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('id',''))" 2>/dev/null || echo "")
if [ -z "$KV_ID" ]; then
  KV_ID=$(wrangler kv namespace list --json 2>/dev/null | python3 -c "import sys,json; ns=json.load(sys.stdin); [print(n['id']) for n in ns if 'CHESSCF_KV' in n.get('title','')]" 2>/dev/null || echo "PLACEHOLDER")
fi
echo "KV ID: $KV_ID"
sed -i "s/REPLACE_AFTER_wrangler_kv_create/$KV_ID/g" wrangler.toml
echo -e "${GREEN}✓ KV ready${NC}"

# ── STEP 3: Create R2 bucket ─────────────────────
echo -e "${YELLOW}[3] Creating R2 bucket...${NC}"
wrangler r2 bucket create chesscf-assets 2>/dev/null || echo "Bucket may already exist"
echo -e "${GREEN}✓ R2 ready${NC}"

# ── STEP 4: Create Queue ─────────────────────────
echo -e "${YELLOW}[4] Creating Queues...${NC}"
wrangler queues create chesscf-analysis 2>/dev/null || echo "Queue may already exist"
echo -e "${GREEN}✓ Queue ready${NC}"

# ── STEP 5: Run D1 schema ────────────────────────
echo -e "${YELLOW}[5] Running D1 schema migrations...${NC}"
wrangler d1 execute chesscf-db --file=schema.sql --remote
echo -e "${GREEN}✓ Schema applied${NC}"

# ── STEP 6: Set secrets ──────────────────────────
echo -e "${YELLOW}[6] Setting secrets (you'll be prompted)...${NC}"
echo "Setting JWT_SECRET..."
wrangler secret put JWT_SECRET
echo "Setting GOOGLE_CLIENT_ID..."
wrangler secret put GOOGLE_CLIENT_ID
echo "Setting GOOGLE_CLIENT_SECRET..."
wrangler secret put GOOGLE_CLIENT_SECRET
echo "Setting FB_APP_ID..."
wrangler secret put FB_APP_ID
echo "Setting FB_APP_SECRET..."
wrangler secret put FB_APP_SECRET
echo "Setting CF_CALLS_APP_ID..."
wrangler secret put CF_CALLS_APP_ID
echo "Setting CF_CALLS_APP_SECRET..."
wrangler secret put CF_CALLS_APP_SECRET
echo -e "${GREEN}✓ Secrets set${NC}"

# ── STEP 7: Build frontend ───────────────────────
echo -e "${YELLOW}[7] Building frontend...${NC}"
npm run build
echo -e "${GREEN}✓ Build complete${NC}"

# ── STEP 8: Deploy Pages ─────────────────────────
echo -e "${YELLOW}[8] Deploying to Cloudflare Pages...${NC}"
wrangler pages deploy dist --project-name chesscf --branch main
echo -e "${GREEN}✓ Pages deployed${NC}"

# ── STEP 9: Custom domain ─────────────────────────
echo ""
echo -e "${YELLOW}[9] Manual step: Set up custom domain${NC}"
echo "  1. Go to: https://dash.cloudflare.com → Pages → chesscf → Custom Domains"
echo "  2. Add: chess.mayurdemo.xyz"
echo "  3. DNS record is auto-created if mayurdemo.xyz is on Cloudflare"

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}♟ ChessCF deployed! chess.mayurdemo.xyz${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
