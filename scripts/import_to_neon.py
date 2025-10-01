#!/usr/bin/env python3
"""
Neon PostgreSQL Data Import Script
Imports Cassandra exported data into Neon PostgreSQL using Prisma schema.
"""

import json
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional
import uuid

try:
    import psycopg2
    from psycopg2.extras import Json, execute_values
    from psycopg2.extensions import register_adapter, adapt, AsIs
except ImportError:
    print("❌ psycopg2 not installed. Run: pip install psycopg2-binary")
    sys.exit(1)


class NeonImporter:
    def __init__(self):
        self.conn = None
        self.cur = None
        self.data_dir = Path("migration_data")
        
        # Database connection
        self.database_url = os.getenv('DATABASE_URL')
        if not self.database_url:
            print("❌ DATABASE_URL environment variable not set")
            sys.exit(1)
    
    def connect(self):
        """Connect to Neon PostgreSQL"""
        try:
            self.conn = psycopg2.connect(self.database_url)
            self.cur = self.conn.cursor()
            
            # Test connection
            self.cur.execute("SELECT version();")
            version = self.cur.fetchone()[0]
            print(f"✅ Connected to PostgreSQL: {version}")
            return True
            
        except Exception as e:
            print(f"❌ Failed to connect to Neon: {e}")
            return False
    
    def close(self):
        """Close database connection"""
        if self.cur:
            self.cur.close()
        if self.conn:
            self.conn.close()
    
    def load_json_data(self, filename: str) -> List[Dict]:
        """Load data from JSON file"""
        file_path = self.data_dir / filename
        if not file_path.exists():
            print(f"⚠️  File not found: {file_path}")
            return []
        
        try:
            with open(file_path, 'r') as f:
                data = json.load(f)
            print(f"📤 Loaded {len(data)} records from {filename}")
            return data
        except Exception as e:
            print(f"❌ Failed to load {filename}: {e}")
            return []
    
    def clean_json_field(self, value: Any) -> Any:
        """Clean JSON field for PostgreSQL"""
        if value is None:
            return None
        elif isinstance(value, str):
            # Try to parse if it's a JSON string
            try:
                return json.loads(value)
            except:
                return value
        else:
            return value
    
    def prepare_flight_routes(self, data: List[Dict]) -> List[tuple]:
        """Prepare flight routes data for insertion"""
        prepared = []
        for row in data:
            prepared.append((\n                row.get('id', str(uuid.uuid4())),\n                row.get('origin_airport_code'),\n                row.get('destination_airport_code'),\n                row.get('estimated_duration_hours', 0),\n                row.get('estimated_duration_minutes', 0),\n                row.get('total_duration_minutes', 0),\n                row.get('created_at', datetime.now()),\n                row.get('updated_at', datetime.now())\n            ))\n        return prepared
    
    def prepare_destinations(self, data: List[Dict]) -> List[tuple]:
        """Prepare destinations data for insertion"""
        prepared = []
        for row in data:
            prepared.append((\n                row.get('id', str(uuid.uuid4())),\n                row.get('airport_code'),\n                row.get('city_name'),\n                row.get('country_name'),\n                row.get('country_code'),\n                row.get('description'),\n                row.get('image_url'),\n                Json(self.clean_json_field(row.get('activities', []))),\n                float(row.get('popularity_score', 0)),\n                Json(self.clean_json_field(row.get('climate_info'))),\n                Json(self.clean_json_field(row.get('best_time_to_visit'))),\n                Json(self.clean_json_field(row.get('budget_info'))),\n                row.get('timezone'),\n                Json(self.clean_json_field(row.get('language'))),\n                row.get('currency'),\n                row.get('visa_required', False),\n                row.get('created_at', datetime.now()),\n                row.get('updated_at', datetime.now())\n            ))\n        return prepared
    
    def prepare_explore_requests(self, data: List[Dict]) -> List[tuple]:
        """Prepare destination explore requests for insertion"""
        prepared = []
        for row in data:
            prepared.append((\n                row.get('id', str(uuid.uuid4())),\n                row.get('origin_airport_code'),\n                row.get('min_flight_duration_hours', 0),\n                row.get('max_flight_duration_hours', 24),\n                Json(self.clean_json_field(row.get('preferred_activities', []))),\n                row.get('budget_level', 'any'),\n                Json(self.clean_json_field(row.get('travel_dates'))),\n                row.get('max_results', 20),\n                row.get('include_visa_required', False),\n                row.get('created_at', datetime.now())\n            ))\n        return prepared
    
    def import_flight_routes(self):
        """Import flight routes data"""
        data = self.load_json_data('flight_routes.json')
        if not data:
            return False
        
        prepared_data = self.prepare_flight_routes(data)
        
        insert_query = \"\"\"\n        INSERT INTO flight_routes (\n            id, origin_airport_code, destination_airport_code,\n            estimated_duration_hours, estimated_duration_minutes,\n            total_duration_minutes, created_at, updated_at\n        ) VALUES %s\n        ON CONFLICT (id) DO UPDATE SET\n            updated_at = EXCLUDED.updated_at\n        \"\"\"\n        \n        try:\n            execute_values(\n                self.cur, insert_query, prepared_data,\n                template=None, page_size=1000\n            )\n            self.conn.commit()\n            print(f\"✅ Imported {len(prepared_data)} flight routes\")\n            return True\n        except Exception as e:\n            print(f\"❌ Failed to import flight routes: {e}\")\n            self.conn.rollback()\n            return False
    
    def import_destinations(self):
        """Import destinations data"""
        data = self.load_json_data('destinations.json')
        if not data:
            return False
        
        prepared_data = self.prepare_destinations(data)
        
        insert_query = \"\"\"\n        INSERT INTO destinations (\n            id, airport_code, city_name, country_name, country_code,\n            description, image_url, activities, popularity_score,\n            climate_info, best_time_to_visit, budget_info, timezone,\n            language, currency, visa_required, created_at, updated_at\n        ) VALUES %s\n        ON CONFLICT (airport_code) DO UPDATE SET\n            city_name = EXCLUDED.city_name,\n            country_name = EXCLUDED.country_name,\n            description = EXCLUDED.description,\n            activities = EXCLUDED.activities,\n            popularity_score = EXCLUDED.popularity_score,\n            updated_at = EXCLUDED.updated_at\n        \"\"\"\n        \n        try:\n            execute_values(\n                self.cur, insert_query, prepared_data,\n                template=None, page_size=1000\n            )\n            self.conn.commit()\n            print(f\"✅ Imported {len(prepared_data)} destinations\")\n            return True\n        except Exception as e:\n            print(f\"❌ Failed to import destinations: {e}\")\n            self.conn.rollback()\n            return False
    
    def import_explore_requests(self):
        """Import destination explore requests"""
        data = self.load_json_data('destination_explore_requests.json')
        if not data:
            return False
        
        prepared_data = self.prepare_explore_requests(data)
        
        insert_query = \"\"\"\n        INSERT INTO destination_explore_requests (\n            id, origin_airport_code, min_flight_duration_hours,\n            max_flight_duration_hours, preferred_activities, budget_level,\n            travel_dates, max_results, include_visa_required, created_at\n        ) VALUES %s\n        ON CONFLICT (id) DO NOTHING\n        \"\"\"\n        \n        try:\n            execute_values(\n                self.cur, insert_query, prepared_data,\n                template=None, page_size=1000\n            )\n            self.conn.commit()\n            print(f\"✅ Imported {len(prepared_data)} explore requests\")\n            return True\n        except Exception as e:\n            print(f\"❌ Failed to import explore requests: {e}\")\n            self.conn.rollback()\n            return False
    
    def import_ugc_data(self):
        \"\"\"Import User Generated Content data\"\"\"\n        ugc_tables = [\n            ('user_generated_content', self.import_user_content),\n            ('spontra_creators', self.import_creators),\n            ('content_moderation', self.import_moderation),\n            ('reward_transactions', self.import_rewards),\n            ('achievements', self.import_achievements),\n            ('user_achievements', self.import_user_achievements)\n        ]\n        \n        imported_count = 0\n        for table_name, import_func in ugc_tables:\n            try:\n                if import_func():\n                    imported_count += 1\n            except Exception as e:\n                print(f\"⚠️  Failed to import {table_name}: {e}\")\n        \n        return imported_count\n    \n    def import_user_content(self):\n        \"\"\"Import user generated content\"\"\"\n        data = self.load_json_data('user_generated_content.json')\n        if not data:\n            return False\n        \n        # This would need user IDs from the User table\n        # For now, we'll skip UGC import until users are migrated\n        print(\"⚠️  Skipping UGC import - requires user migration first\")\n        return False\n    \n    def import_creators(self):\n        \"\"\"Import creator data\"\"\"\n        # Similar to UGC - requires users first\n        print(\"⚠️  Skipping creators import - requires user migration first\")\n        return False\n    \n    def import_moderation(self):\n        print(\"⚠️  Skipping moderation import - requires content and users first\")\n        return False\n    \n    def import_rewards(self):\n        print(\"⚠️  Skipping rewards import - requires users first\")\n        return False\n    \n    def import_achievements(self):\n        \"\"\"Import achievements (can be done independently)\"\"\"\n        data = self.load_json_data('achievements.json')\n        if not data:\n            return False\n        \n        prepared_data = []\n        for row in data:\n            prepared_data.append((\n                row.get('achievement_id'),\n                row.get('name'),\n                row.get('description'),\n                row.get('icon_url'),\n                row.get('reward_points', 0),\n                row.get('reward_euro'),\n                Json(self.clean_json_field(row.get('criteria', {}))),\n                row.get('is_active', True),\n                row.get('created_at', datetime.now())\n            ))\n        \n        insert_query = \"\"\"\n        INSERT INTO achievements (\n            achievement_id, name, description, icon_url,\n            reward_points, reward_euro, criteria, is_active, created_at\n        ) VALUES %s\n        ON CONFLICT (achievement_id) DO UPDATE SET\n            name = EXCLUDED.name,\n            description = EXCLUDED.description\n        \"\"\"\n        \n        try:\n            execute_values(\n                self.cur, insert_query, prepared_data,\n                template=None, page_size=1000\n            )\n            self.conn.commit()\n            print(f\"✅ Imported {len(prepared_data)} achievements\")\n            return True\n        except Exception as e:\n            print(f\"❌ Failed to import achievements: {e}\")\n            self.conn.rollback()\n            return False\n    \n    def import_user_achievements(self):\n        print(\"⚠️  Skipping user achievements import - requires users first\")\n        return False\n    \n    def create_import_summary(self, imported_tables: List[str]):\n        \"\"\"Create import summary\"\"\"\n        summary = {\n            \"import_timestamp\": datetime.now().isoformat(),\n            \"target_database\": \"Neon PostgreSQL\",\n            \"imported_tables\": imported_tables,\n            \"notes\": [\n                \"Core flight and destination data imported\",\n                \"UGC data requires user migration first\",\n                \"Run data validation queries to verify integrity\"\n            ]\n        }\n        \n        summary_file = self.data_dir / \"import_summary.json\"\n        with open(summary_file, 'w') as f:\n            json.dump(summary, f, indent=2)\n        \n        print(f\"📋 Created import summary: {summary_file}\")\n    \n    def run_import(self):\n        \"\"\"Run the complete import process\"\"\"\n        print(\"🚀 Starting Neon PostgreSQL data import...\")\n        \n        if not self.connect():\n            return False\n        \n        try:\n            imported_tables = []\n            \n            # Import core data\n            print(\"\\n📊 Importing core flight data...\")\n            if self.import_flight_routes():\n                imported_tables.append(\"flight_routes\")\n            \n            if self.import_destinations():\n                imported_tables.append(\"destinations\")\n            \n            if self.import_explore_requests():\n                imported_tables.append(\"destination_explore_requests\")\n            \n            if self.import_achievements():\n                imported_tables.append(\"achievements\")\n            \n            # UGC data (will be skipped for now)\n            print(\"\\n👥 Importing UGC data...\")\n            ugc_count = self.import_ugc_data()\n            \n            # Create summary\n            self.create_import_summary(imported_tables)\n            \n            print(f\"\\n✅ Import completed!\")\n            print(f\"📊 Imported {len(imported_tables)} core tables\")\n            print(f\"⚠️  UGC tables skipped (requires user migration)\")\n            \n            print(\"\\n🔍 Next steps:\")\n            print(\"   1. Validate data integrity\")\n            print(\"   2. Update application to use Neon\")\n            print(\"   3. Migrate user data separately\")\n            print(\"   4. Import UGC data after users\")\n            \n            return True\n            \n        except Exception as e:\n            print(f\"❌ Import failed: {e}\")\n            return False\n        \n        finally:\n            self.close()


def main():\n    print(\"=\" * 60)\n    print(\"🗃️  NEON POSTGRESQL DATA IMPORT\")\n    print(\"=\" * 60)\n    \n    # Check prerequisites\n    if not os.getenv('DATABASE_URL'):\n        print(\"❌ DATABASE_URL environment variable not set\")\n        print(\"Set it with your Neon connection string:\")\n        print(\"   export DATABASE_URL='postgresql://user:pass@host:5432/db'\")\n        return False\n    \n    data_dir = Path(\"migration_data\")\n    if not data_dir.exists():\n        print(f\"❌ Migration data directory not found: {data_dir}\")\n        print(\"Run export_cassandra_data.py first to export data\")\n        return False\n    \n    importer = NeonImporter()\n    success = importer.run_import()\n    \n    if success:\n        print(\"\\n🎉 Data import completed successfully!\")\n        print(\"Neon PostgreSQL is ready for use.\")\n    else:\n        print(\"\\n💥 Import failed. Check logs above.\")\n        return False\n    \n    return True


if __name__ == \"__main__\":\n    if main():\n        sys.exit(0)\n    else:\n        sys.exit(1)