CREATE KEYSPACE IF NOT EXISTS spontra_destinations WITH replication = {'class': 'SimpleStrategy', 'replication_factor': '1'};

CREATE TABLE IF NOT EXISTS spontra_destinations.destinations (
  id uuid,
  iata_code text,
  city_name text,
  country_name text,
  country_code text,
  theme_scores map<text, int>,
  highlights list<text>,
  description text,
  average_flight_time float,
  price_range text,
  best_months set<text>,
  image_url text,
  popularity_score float,
  timezone text,
  language set<text>,
  currency text,
  visa_required boolean,
  created_at timestamp,
  updated_at timestamp,
  PRIMARY KEY (iata_code)
);

