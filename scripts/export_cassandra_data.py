#!/usr/bin/env python3
"""
Cassandra Data Export Script for Neon Migration
Exports all Cassandra data to JSON files for import into Neon PostgreSQL.
"""

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional
import uuid

try:
    from cassandra.cluster import Cluster
    from cassandra.auth import PlainTextAuthProvider
    from cassandra.policies import DCAwareRoundRobinPolicy
except ImportError:
    print("❌ cassandra-driver not installed. Run: pip install cassandra-driver")
    sys.exit(1)


class CassandraExporter:
    def __init__(self):
        self.cluster = None
        self.session = None
        self.export_dir = Path("migration_data")
        self.export_dir.mkdir(exist_ok=True)
        
        # Cassandra connection settings
        self.hosts = os.getenv('CASSANDRA_HOSTS', 'localhost:9042').split(',')
        self.keyspace = os.getenv('CASSANDRA_KEYSPACE', 'spontra')
        self.username = os.getenv('CASSANDRA_USERNAME', '')
        self.password = os.getenv('CASSANDRA_PASSWORD', '')
        
    def connect(self):
        """Connect to Cassandra cluster"""
        try:
            auth_provider = None
            if self.username and self.password:
                auth_provider = PlainTextAuthProvider(
                    username=self.username, 
                    password=self.password
                )
            
            self.cluster = Cluster(
                contact_points=[host.strip() for host in self.hosts],
                auth_provider=auth_provider,
                load_balancing_policy=DCAwareRoundRobinPolicy(local_dc='datacenter1')
            )
            
            self.session = self.cluster.connect(self.keyspace)
            print(f"✅ Connected to Cassandra keyspace: {self.keyspace}")
            return True
            
        except Exception as e:
            print(f"❌ Failed to connect to Cassandra: {e}")
            return False
    
    def close(self):
        """Close Cassandra connection"""
        if self.cluster:
            self.cluster.shutdown()
    
    def serialize_value(self, value: Any) -> Any:
        """Convert Cassandra types to JSON-serializable types"""
        if value is None:
            return None
        elif isinstance(value, uuid.UUID):
            return str(value)
        elif isinstance(value, datetime):
            return value.isoformat()
        elif isinstance(value, (list, set)):
            return [self.serialize_value(item) for item in value]
        elif isinstance(value, dict):
            return {str(k): self.serialize_value(v) for k, v in value.items()}
        else:
            return value
    
    def export_table(self, table_name: str, query: Optional[str] = None) -> List[Dict]:
        """Export a Cassandra table to JSON"""
        if not query:
            query = f"SELECT * FROM {table_name}"
        
        try:
            print(f"📤 Exporting {table_name}...")
            rows = self.session.execute(query)
            
            data = []
            for row in rows:
                row_dict = {}
                for column, value in zip(row._fields, row):
                    row_dict[column] = self.serialize_value(value)
                data.append(row_dict)
            
            # Save to JSON file
            output_file = self.export_dir / f"{table_name}.json"
            with open(output_file, 'w') as f:
                json.dump(data, f, indent=2, default=str)
            
            print(f"✅ Exported {len(data)} records from {table_name} to {output_file}")
            return data
            
        except Exception as e:
            print(f"❌ Failed to export {table_name}: {e}")
            return []
    
    def export_flight_routes(self):
        """Export flight routes data"""
        query = """
        SELECT id, origin_airport_code, destination_airport_code,
               estimated_duration_hours, estimated_duration_minutes,
               total_duration_minutes, created_at, updated_at
        FROM flight_routes
        """
        return self.export_table("flight_routes", query)
    
    def export_destinations(self):
        """Export destinations data"""
        query = """
        SELECT id, airport_code, city_name, country_name, country_code,
               description, image_url, activities, popularity_score,
               climate_info, best_time_to_visit, budget_info, timezone,
               language, currency, visa_required, created_at, updated_at
        FROM destinations
        """
        return self.export_table("destinations", query)
    
    def export_destination_explore_requests(self):
        """Export destination explore requests"""
        query = """
        SELECT id, origin_airport_code, min_flight_duration_hours,
               max_flight_duration_hours, preferred_activities, budget_level,
               travel_dates, max_results, include_visa_required, created_at
        FROM destination_explore_requests
        """
        return self.export_table("destination_explore_requests", query)
    
    def export_flight_inventory(self):
        """Export flight inventory data (if exists)"""
        try:
            query = """
            SELECT id, flight_offer_id, origin_code, destination_code,
                   departure_date, carrier_code, flight_number, price,
                   currency, available_seats, booking_class, aircraft_type,
                   departure_time, arrival_time, duration_minutes,
                   stops, layover_airports, created_at, updated_at
            FROM flight_inventory
            """
            return self.export_table("flight_inventory", query)
        except:
            print("⚠️  flight_inventory table not found, skipping...")
            return []
    
    def export_price_history(self):
        """Export price history data (if exists)"""
        try:
            query = """
            SELECT id, route, flight_offer_id, carrier_code, price,
                   currency, departure_date, search_date, passengers,
                   cabin_class, advance_booking_days, created_at
            FROM price_history
            """
            return self.export_table("price_history", query)
        except:
            print("⚠️  price_history table not found, skipping...")
            return []
    
    def export_ugc_tables(self):
        """Export User Generated Content tables"""
        ugc_tables = [
            "user_generated_content",
            "spontra_creators", 
            "content_moderation",
            "reward_transactions",
            "creator_analytics",
            "content_by_activity",
            "creator_leaderboard",
            "content_bookings",
            "content_views",
            "achievements",
            "user_achievements"
        ]
        
        exported_tables = []
        for table in ugc_tables:
            try:
                data = self.export_table(table)
                if data:
                    exported_tables.append(table)
            except Exception as e:
                print(f"⚠️  Table {table} not found or error: {e}")
        
        return exported_tables
    
    def export_theme_destinations(self):
        """Export theme-based destinations (if exists)"""
        try:
            query = """
            SELECT origin_airport_code, theme, destination_airport_code,
                   city_name, country_name, activities, popularity_score,
                   travel_time_hours, created_at
            FROM theme_destinations
            """
            return self.export_table("theme_destinations", query)
        except:
            print("⚠️  theme_destinations table not found, skipping...")
            return []
    
    def create_export_manifest(self, exported_tables: List[str]):
        """Create a manifest file with export metadata"""
        manifest = {
            "export_timestamp": datetime.now(timezone.utc).isoformat(),
            "source_keyspace": self.keyspace,
            "exported_tables": exported_tables,
            "export_directory": str(self.export_dir),
            "migration_notes": {
                "target_database": "Neon PostgreSQL",
                "prisma_schema": "schema.prisma",
                "data_transformations": [
                    "UUID fields converted to strings",
                    "JSON fields preserved as-is",
                    "Timestamp fields converted to ISO format",
                    "Collections converted to arrays"
                ]
            }
        }
        
        manifest_file = self.export_dir / "export_manifest.json"
        with open(manifest_file, 'w') as f:
            json.dump(manifest, f, indent=2)
        
        print(f"📋 Created export manifest: {manifest_file}")
    
    def run_export(self):
        """Run the complete export process"""
        print("🚀 Starting Cassandra data export for Neon migration...")
        print(f"📁 Export directory: {self.export_dir.absolute()}")
        
        if not self.connect():
            return False
        
        try:
            exported_tables = []
            
            # Export core flight and destination data
            print("\n📊 Exporting core flight data...")
            if self.export_flight_routes():
                exported_tables.append("flight_routes")
            
            if self.export_destinations():
                exported_tables.append("destinations")
            
            if self.export_destination_explore_requests():
                exported_tables.append("destination_explore_requests")
            
            # Export operational data
            print("\n🛫 Exporting operational data...")
            if self.export_flight_inventory():
                exported_tables.append("flight_inventory")
            
            if self.export_price_history():
                exported_tables.append("price_history")
            
            if self.export_theme_destinations():
                exported_tables.append("theme_destinations")
            
            # Export UGC data
            print("\n👥 Exporting user-generated content...")
            ugc_tables = self.export_ugc_tables()
            exported_tables.extend(ugc_tables)
            
            # Create manifest
            self.create_export_manifest(exported_tables)
            
            print(f"\n✅ Export completed successfully!")
            print(f"📊 Exported {len(exported_tables)} tables:")
            for table in exported_tables:
                print(f"   - {table}")
            
            print(f"\n📁 All files saved to: {self.export_dir.absolute()}")
            print("\n🔄 Next steps:")
            print("   1. Review exported JSON files")
            print("   2. Run import script with Neon DATABASE_URL")
            print("   3. Validate data integrity")
            
            return True
            
        except Exception as e:
            print(f"❌ Export failed: {e}")
            return False
        
        finally:
            self.close()


def main():
    print("=" * 60)
    print("🗃️  CASSANDRA TO NEON MIGRATION - DATA EXPORT")
    print("=" * 60)
    
    # Check environment
    required_env = ['CASSANDRA_HOSTS', 'CASSANDRA_KEYSPACE']
    missing_env = [var for var in required_env if not os.getenv(var)]
    
    if missing_env:
        print("⚠️  Missing environment variables:")
        for var in missing_env:
            print(f"   - {var}")
        print("\nSet them with:")
        print("   export CASSANDRA_HOSTS=localhost:9042")
        print("   export CASSANDRA_KEYSPACE=spontra")
        print("   export CASSANDRA_USERNAME=user  # if auth required")
        print("   export CASSANDRA_PASSWORD=pass  # if auth required")
        return False
    
    exporter = CassandraExporter()
    success = exporter.run_export()
    
    if success:
        print("\n🎉 Data export completed successfully!")
        print("Ready for Neon PostgreSQL import.")
    else:
        print("\n💥 Export failed. Check logs above.")
        return False
    
    return True


if __name__ == "__main__":
    if main():
        sys.exit(0)
    else:
        sys.exit(1)