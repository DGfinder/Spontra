-- Create POIVideo table for multiple videos per POI
CREATE TABLE poi_videos (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  poi_id TEXT NOT NULL,
  video_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_poi FOREIGN KEY (poi_id) REFERENCES theme_pois(id) ON DELETE CASCADE
);

CREATE INDEX idx_poi_videos_poi_id ON poi_videos(poi_id);

-- Migrate existing single videoUrl data to poi_videos table
-- This will copy any existing video URLs as the first video for each POI
INSERT INTO poi_videos (poi_id, video_url, display_order)
SELECT id, video_url, 0
FROM theme_pois
WHERE video_url IS NOT NULL AND video_url != '';

-- NOTE: Do NOT drop video_url column yet - keeping for backward compatibility
-- After confirming migration success, you can drop it with:
-- ALTER TABLE theme_pois DROP COLUMN video_url;
