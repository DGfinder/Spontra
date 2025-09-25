const fs = require('fs');
const path = require('path');

function parseCsvLine(line) {
  const cells = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      const next = line[i + 1];
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      cells.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells;
}

const root = process.cwd();
const sourcePath = path.join(root, 'temp', 'airports_prepared.csv');
if (!fs.existsSync(sourcePath)) {
  throw new Error('airports_prepared.csv missing; run data prep first');
}

const raw = fs.readFileSync(sourcePath, 'utf8').split(/\r?\n/).filter(Boolean);
if (raw.length === 0) {
  throw new Error('airports_prepared.csv empty');
}

const headers = parseCsvLine(raw[0]);
const indexOf = (name) => {
  const idx = headers.indexOf(name);
  if (idx === -1) throw new Error(`Missing column ${name}`);
  return idx;
};

const idxIata = indexOf('iata_code');
const idxName = indexOf('name');
const idxCity = indexOf('city');
const idxCountry = indexOf('country');
const idxCountryCode = indexOf('country_code');

const countryMap = new Map();

for (let i = 1; i < raw.length; i += 1) {
  const line = raw[i];
  if (!line.trim()) continue;
  const cells = parseCsvLine(line).map((cell) => cell.trim());
  const iata = cells[idxIata];
  const name = cells[idxName];
  const city = cells[idxCity];
  const country = cells[idxCountry];
  const countryCode = cells[idxCountryCode];

  if (!iata || !country || !city) continue;

  if (!countryMap.has(countryCode)) {
    countryMap.set(countryCode, {
      country,
      countryCode,
      cities: new Map(),
    });
  }

  const countryEntry = countryMap.get(countryCode);
  if (!countryEntry.cities.has(city)) {
    countryEntry.cities.set(city, {
      city,
      airports: [],
    });
  }

  const cityEntry = countryEntry.cities.get(city);
  if (!cityEntry.airports.some((airport) => airport.iata === iata)) {
    cityEntry.airports.push({ iata, name });
  }
}

const dataset = Array.from(countryMap.values()).map((country) => {
  const cities = Array.from(country.cities.values())
    .map((city) => ({
      city: city.city,
      airports: city.airports.sort((a, b) => a.iata.localeCompare(b.iata)),
    }))
    .sort((a, b) => a.city.localeCompare(b.city));

  return {
    country: country.country,
    countryCode: country.countryCode,
    cities,
  };
}).sort((a, b) => a.country.localeCompare(b.country));

const outputDir = path.join(root, 'frontend', 'src', 'data');
fs.mkdirSync(outputDir, { recursive: true });

const banner = `// Auto-generated from temp/airports_prepared.csv on ${new Date().toISOString()}\n`;
const typeDefs = `export interface AdminLocationAirport {\n  iata: string;\n  name: string;\n}\n\nexport interface AdminLocationCity {\n  city: string;\n  airports: AdminLocationAirport[];\n}\n\nexport interface AdminLocationCountry {\n  country: string;\n  countryCode: string;\n  cities: AdminLocationCity[];\n}\n`;
const dataExport = `export const ADMIN_LOCATION_DATA: AdminLocationCountry[] = ${JSON.stringify(dataset, null, 2)};\n`;
const helperExports = `\nexport const ADMIN_COUNTRIES = ADMIN_LOCATION_DATA.map((entry) => ({\n  country: entry.country,\n  countryCode: entry.countryCode,\n  totalCities: entry.cities.length,\n  totalAirports: entry.cities.reduce((sum, city) => sum + city.airports.length, 0),\n}));\n`;

const fileContents = `${banner}\n${typeDefs}\n${dataExport}${helperExports}`;

const outputPath = path.join(outputDir, 'adminLocations.ts');
fs.writeFileSync(outputPath, fileContents);

console.log(`Generated ${outputPath} with ${dataset.length} countries`);
