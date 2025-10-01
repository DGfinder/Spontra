#!/bin/bash

# =============================================================================
# Spontra Neon Migration Script
# Migrates from multi-database architecture to unified Neon PostgreSQL
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
MIGRATION_DATA_DIR="$PROJECT_ROOT/migration_data"
BACKUP_DIR="$PROJECT_ROOT/migration_backup"

echo -e "${BLUE}=================================${NC}"
echo -e "${BLUE}🚀 SPONTRA NEON MIGRATION${NC}"
echo -e "${BLUE}=================================${NC}"

# =============================================================================
# PREREQUISITE CHECKS
# =============================================================================

check_prerequisites() {
    echo -e "\n${YELLOW}🔍 Checking prerequisites...${NC}"
    
    # Check required environment variables
    if [[ -z "$DATABASE_URL" ]]; then
        echo -e "${RED}❌ DATABASE_URL not set (Neon connection string)${NC}"
        echo -e "Set it with: export DATABASE_URL='postgresql://user:pass@host:5432/db'"
        exit 1
    fi
    
    # Check if Cassandra is accessible (optional)
    if [[ -n "$CASSANDRA_HOSTS" ]]; then
        echo -e "${GREEN}✅ Cassandra configuration found${NC}"
        
        # Test cassandra connection (if cqlsh is available)
        if command -v cqlsh &> /dev/null; then
            echo -e "${BLUE}🔗 Testing Cassandra connection...${NC}"
            if timeout 10 cqlsh -e "DESCRIBE KEYSPACES;" &> /dev/null; then
                echo -e "${GREEN}✅ Cassandra accessible${NC}"
            else
                echo -e "${YELLOW}⚠️  Cassandra not accessible, will skip data export${NC}"
            fi
        fi
    else
        echo -e "${YELLOW}⚠️  CASSANDRA_HOSTS not set, will skip Cassandra export${NC}"
    fi
    
    # Check Python dependencies
    if ! python3 -c "import psycopg2, json" 2>/dev/null; then
        echo -e "${RED}❌ Python dependencies missing${NC}"
        echo -e "Install with: pip install psycopg2-binary"
        exit 1
    fi
    
    # Check if Prisma is available
    if ! command -v npx &> /dev/null; then
        echo -e "${RED}❌ npx not found (needed for Prisma)${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Prerequisites check passed${NC}"
}

# =============================================================================
# BACKUP CURRENT CONFIGURATION
# =============================================================================

backup_configuration() {
    echo -e "\n${YELLOW}💾 Creating configuration backup...${NC}"
    
    mkdir -p "$BACKUP_DIR"
    
    # Backup environment files
    if [[ -f "$PROJECT_ROOT/.env" ]]; then
        cp "$PROJECT_ROOT/.env" "$BACKUP_DIR/.env.backup"
        echo -e "${GREEN}✅ Backed up .env${NC}"
    fi
    
    if [[ -f "$PROJECT_ROOT/.env.local" ]]; then
        cp "$PROJECT_ROOT/.env.local" "$BACKUP_DIR/.env.local.backup"
        echo -e "${GREEN}✅ Backed up .env.local${NC}"
    fi
    
    # Backup docker-compose
    if [[ -f "$PROJECT_ROOT/docker/docker-compose.dev.yml" ]]; then
        cp "$PROJECT_ROOT/docker/docker-compose.dev.yml" "$BACKUP_DIR/docker-compose.dev.yml.backup"
        echo -e "${GREEN}✅ Backed up docker-compose${NC}"
    fi
    
    echo -e "${GREEN}✅ Configuration backup completed${NC}"
}

# =============================================================================
# PRISMA SETUP
# =============================================================================

setup_prisma() {
    echo -e "\n${YELLOW}🔧 Setting up Prisma with Neon...${NC}"
    
    cd "$PROJECT_ROOT/frontend"
    
    # Generate Prisma client
    echo -e "${BLUE}📦 Generating Prisma client...${NC}"
    npx prisma generate
    
    # Create database (this will create tables)
    echo -e "${BLUE}🗄️  Setting up database schema...${NC}"
    npx prisma db push --skip-generate
    
    echo -e "${GREEN}✅ Prisma setup completed${NC}"
    cd "$PROJECT_ROOT"
}

# =============================================================================
# DATA EXPORT FROM CASSANDRA
# =============================================================================

export_cassandra_data() {
    echo -e "\n${YELLOW}📤 Exporting data from Cassandra...${NC}"
    
    if [[ -z "$CASSANDRA_HOSTS" ]]; then
        echo -e "${YELLOW}⚠️  CASSANDRA_HOSTS not set, skipping Cassandra export${NC}"
        return 0
    fi
    
    cd "$PROJECT_ROOT"
    
    # Run Cassandra export script
    if python3 scripts/export_cassandra_data.py; then
        echo -e "${GREEN}✅ Cassandra data exported successfully${NC}"
    else
        echo -e "${YELLOW}⚠️  Cassandra export failed, continuing without data migration${NC}"
        return 0
    fi
}

# =============================================================================
# DATA IMPORT TO NEON
# =============================================================================

import_to_neon() {
    echo -e "\n${YELLOW}📥 Importing data to Neon PostgreSQL...${NC}"
    
    if [[ ! -d "$MIGRATION_DATA_DIR" ]]; then
        echo -e "${YELLOW}⚠️  No migration data found, skipping import${NC}"
        return 0
    fi
    
    cd "$PROJECT_ROOT"
    
    # Run Neon import script
    if python3 scripts/import_to_neon.py; then
        echo -e "${GREEN}✅ Data imported to Neon successfully${NC}"
    else
        echo -e "${RED}❌ Data import failed${NC}"
        return 1
    fi
}

# =============================================================================
# UPDATE APPLICATION CONFIGURATION
# =============================================================================

update_application_config() {
    echo -e "\n${YELLOW}⚙️  Updating application configuration...${NC}"
    
    # Update .env.example files
    echo -e "${BLUE}📝 Updating .env.example files...${NC}"
    
    # Frontend .env.example
    if [[ -f "$PROJECT_ROOT/frontend/.env.example" ]]; then
        # Comment out old database URLs and add unified one
        sed -i.bak 's/^SEARCH_DATABASE_URL=/#SEARCH_DATABASE_URL=/' "$PROJECT_ROOT/frontend/.env.example" 2>/dev/null || true
        sed -i.bak 's/^USER_SERVICE_DB_URL=/#USER_SERVICE_DB_URL=/' "$PROJECT_ROOT/frontend/.env.example" 2>/dev/null || true
        
        # Add DATABASE_URL if not present
        if ! grep -q "^DATABASE_URL=" "$PROJECT_ROOT/frontend/.env.example"; then
            echo "DATABASE_URL=postgresql://user:password@localhost:5432/spontra" >> "$PROJECT_ROOT/frontend/.env.example"
        fi
        
        echo -e "${GREEN}✅ Updated frontend/.env.example${NC}"
    fi
    
    # Root .env.example
    if [[ -f "$PROJECT_ROOT/.env.example" ]]; then
        # Comment out multiple database URLs
        sed -i.bak 's/^USER_SERVICE_DB_URL=/#USER_SERVICE_DB_URL=/' "$PROJECT_ROOT/.env.example" 2>/dev/null || true
        sed -i.bak 's/^SEARCH_SERVICE_DB_URL=/#SEARCH_SERVICE_DB_URL=/' "$PROJECT_ROOT/.env.example" 2>/dev/null || true
        
        # Update DATABASE_URL to be the primary
        if grep -q "^DATABASE_URL=" "$PROJECT_ROOT/.env.example"; then
            sed -i.bak 's/^DATABASE_URL=.*/DATABASE_URL=postgresql:\/\/user:password@localhost:5432\/spontra/' "$PROJECT_ROOT/.env.example"
        else
            echo "DATABASE_URL=postgresql://user:password@localhost:5432/spontra" >> "$PROJECT_ROOT/.env.example"
        fi
        
        echo -e "${GREEN}✅ Updated root .env.example${NC}"
    fi
    
    echo -e "${GREEN}✅ Application configuration updated${NC}"
}

# =============================================================================
# UPDATE PACKAGE.JSON FOR PRISMA
# =============================================================================

update_package_json() {
    echo -e "\n${YELLOW}📦 Updating package.json for Prisma deployment...${NC}"
    
    cd "$PROJECT_ROOT/frontend"
    
    # Check if build script needs updating
    if [[ -f "package.json" ]]; then
        # Use node to update package.json safely
        node -e "
        const fs = require('fs');
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        
        // Update scripts for Prisma
        if (!pkg.scripts.build.includes('prisma generate')) {
            pkg.scripts.build = 'prisma generate && ' + pkg.scripts.build;
        }
        
        if (!pkg.scripts.postinstall) {
            pkg.scripts.postinstall = 'prisma generate';
        }
        
        fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
        console.log('✅ Updated package.json scripts');
        "
    fi
    
    cd "$PROJECT_ROOT"
}

# =============================================================================
# VALIDATION
# =============================================================================

validate_migration() {
    echo -e "\n${YELLOW}🔍 Validating migration...${NC}"
    
    # Test database connection
    echo -e "${BLUE}🔗 Testing Neon connection...${NC}"
    if python3 -c "
import psycopg2
import os
conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cur = conn.cursor()
cur.execute('SELECT COUNT(*) FROM flight_routes;')
count = cur.fetchone()[0]
print(f'✅ Flight routes: {count} records')
cur.close()
conn.close()
    " 2>/dev/null; then
        echo -e "${GREEN}✅ Database connection successful${NC}"
    else
        echo -e "${RED}❌ Database connection failed${NC}"
        return 1
    fi
    
    # Test Prisma client
    echo -e "${BLUE}🔧 Testing Prisma client...${NC}"
    cd "$PROJECT_ROOT/frontend"
    if npx prisma validate; then
        echo -e "${GREEN}✅ Prisma schema valid${NC}"
    else
        echo -e "${RED}❌ Prisma validation failed${NC}"
        return 1
    fi
    
    cd "$PROJECT_ROOT"
}

# =============================================================================
# CLEANUP (OPTIONAL)
# =============================================================================

cleanup_old_infrastructure() {
    echo -e "\n${YELLOW}🧹 Cleaning up old infrastructure (optional)...${NC}"
    
    read -p "Remove Cassandra from docker-compose? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if [[ -f "$PROJECT_ROOT/docker/docker-compose.dev.yml" ]]; then
            # Comment out Cassandra service (safer than removing)
            sed -i.bak '/# Cassandra/,/cassandra_data:/s/^/#/' "$PROJECT_ROOT/docker/docker-compose.dev.yml" 2>/dev/null || true
            echo -e "${GREEN}✅ Commented out Cassandra in docker-compose${NC}"
        fi
    fi
    
    read -p "Remove migration data directory? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if [[ -d "$MIGRATION_DATA_DIR" ]]; then
            rm -rf "$MIGRATION_DATA_DIR"
            echo -e "${GREEN}✅ Removed migration data directory${NC}"
        fi
    fi
}

# =============================================================================
# MAIN EXECUTION
# =============================================================================

main() {
    echo -e "This script will migrate Spontra from multi-database to unified Neon PostgreSQL."
    echo -e "Make sure you have:"
    echo -e "  - Neon database created and DATABASE_URL set"
    echo -e "  - Cassandra running (if you want to migrate data)"
    echo -e "  - Created a backup of your project"
    echo
    
    read -p "Continue with migration? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Migration cancelled${NC}"
        exit 0
    fi
    
    # Run migration steps
    check_prerequisites
    backup_configuration
    setup_prisma
    export_cassandra_data
    import_to_neon
    update_application_config
    update_package_json
    validate_migration
    
    echo -e "\n${GREEN}🎉 MIGRATION COMPLETED SUCCESSFULLY!${NC}"
    echo -e "\n${BLUE}Next steps:${NC}"
    echo -e "1. Update your .env file with the Neon DATABASE_URL"
    echo -e "2. Test your application locally"
    echo -e "3. Update Vercel environment variables"
    echo -e "4. Deploy to production"
    echo -e "5. Monitor application performance"
    
    echo -e "\n${BLUE}Vercel Environment Variables:${NC}"
    echo -e "DATABASE_URL=${DATABASE_URL}"
    echo -e "DIRECT_URL=${DATABASE_URL}"
    
    # Offer cleanup
    cleanup_old_infrastructure
    
    echo -e "\n${GREEN}Migration completed! 🚀${NC}"
}

# Run the migration
main "$@"