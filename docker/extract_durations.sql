\copy (
  SELECT 
    a.iata_code,
    COALESCE(a.city, '') AS city,
    COALESCE(a.country, '') AS country,
    COALESCE(a.country_code, '') AS country_code,
    AVG(fd.duration_minutes)::int AS avg_minutes
  FROM flight_durations fd
  JOIN airports a ON a.iata_code = fd.destination_airport
  WHERE fd.origin_airport = 'LHR'
  GROUP BY a.iata_code, a.city, a.country, a.country_code
  ORDER BY avg_minutes ASC
  LIMIT 1000
) TO STDOUT WITH CSV

