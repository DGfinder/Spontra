-- Create search analytics table for tracking airport search patterns

CREATE TABLE IF NOT EXISTS search_analytics (
  id SERIAL PRIMARY KEY,
  query VARCHAR(255) UNIQUE NOT NULL,
  search_count INTEGER DEFAULT 1,
  result_count INTEGER DEFAULT 0,
  search_date TIMESTAMP DEFAULT NOW(),
  last_searched TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_search_analytics_query ON search_analytics(query);
CREATE INDEX IF NOT EXISTS idx_search_analytics_count ON search_analytics(search_count DESC);
CREATE INDEX IF NOT EXISTS idx_search_analytics_date ON search_analytics(last_searched DESC);

-- Create a view for popular searches
CREATE OR REPLACE VIEW popular_searches AS
SELECT 
  query,
  search_count,
  result_count,
  last_searched,
  CASE 
    WHEN last_searched > NOW() - INTERVAL '7 days' THEN 'recent'
    WHEN last_searched > NOW() - INTERVAL '30 days' THEN 'monthly'
    ELSE 'older'
  END as recency_category
FROM search_analytics
WHERE search_count > 1 AND result_count > 0
ORDER BY 
  CASE 
    WHEN last_searched > NOW() - INTERVAL '7 days' THEN search_count * 3
    WHEN last_searched > NOW() - INTERVAL '30 days' THEN search_count * 2
    ELSE search_count
  END DESC;

-- Comment
COMMENT ON TABLE search_analytics IS 'Tracks airport search queries for analytics and improving suggestions';
COMMENT ON COLUMN search_analytics.query IS 'The search query (normalized to lowercase)';
COMMENT ON COLUMN search_analytics.search_count IS 'Number of times this query has been searched';
COMMENT ON COLUMN search_analytics.result_count IS 'Number of results returned for this query';
COMMENT ON COLUMN search_analytics.last_searched IS 'Last time this query was searched';