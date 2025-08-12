#!/usr/bin/env node

/**
 * Export Theme Cities JSON Script
 * 
 * This script extracts the ALL_CITIES array from the TypeScript theme cities file
 * and exports it as JSON for migration to Cassandra database.
 * 
 * Usage: node export_theme_cities_json.js <input_ts_file> <output_json_file>
 */

const fs = require('fs');
const path = require('path');

// Parse command line arguments
if (process.argv.length < 4) {
  console.error('Usage: node export_theme_cities_json.js <input_ts_file> <output_json_file>');
  console.error('Example: node export_theme_cities_json.js ../frontend/src/data/themeCities.ts theme_cities.json');
  process.exit(1);
}

const inputFile = process.argv[2];
const outputFile = process.argv[3];

console.log('🚀 Exporting Theme Cities to JSON');
console.log(`📂 Input: ${inputFile}`);
console.log(`📄 Output: ${outputFile}`);

try {
  // Read the TypeScript file
  const tsContent = fs.readFileSync(inputFile, 'utf8');
  
  // Extract the ALL_CITIES array using regex
  // This regex finds the array definition and captures everything until the closing bracket
  const allCitiesMatch = tsContent.match(/export const ALL_CITIES: ThemeCity\[\] = \[([\s\S]*?)\]/);
  
  if (!allCitiesMatch) {
    throw new Error('Could not find ALL_CITIES array in the TypeScript file');
  }
  
  const citiesArrayContent = allCitiesMatch[1];
  
  // Clean up the content to make it valid JSON
  let jsonContent = citiesArrayContent
    // Remove TypeScript comments
    .replace(/\/\/.*$/gm, '')
    // Remove trailing commas before closing braces/brackets
    .replace(/,(\s*[}\]])/g, '$1')
    // Fix single quotes to double quotes (basic approach)
    .replace(/'/g, '"')
    // Remove type annotations and other TypeScript-specific syntax
    .replace(/:\s*\d+,?\s*\/\/[^,\n]*(?=,|\n|$)/g, (match) => {
      // Keep the number but remove the comment
      return match.split('//')[0].trim();
    });
  
  // Wrap in array brackets
  jsonContent = '[' + jsonContent + ']';
  
  // Parse to validate JSON and clean up formatting
  let cities;
  try {
    cities = JSON.parse(jsonContent);
  } catch (parseError) {
    console.error('❌ Failed to parse extracted content as JSON. Attempting manual cleanup...');
    
    // More aggressive cleanup for complex TypeScript syntax
    jsonContent = jsonContent
      // Handle multi-line strings and arrays
      .replace(/\n\s+/g, ' ')
      // Clean up spacing around colons and commas
      .replace(/\s*:\s*/g, ':')
      .replace(/,\s*(?=})/g, '')
      // Fix array formatting
      .replace(/\[\s+/g, '[')
      .replace(/\s+\]/g, ']')
      // Fix object formatting
      .replace(/{\s+/g, '{')
      .replace(/\s+}/g, '}');
    
    try {
      cities = JSON.parse(jsonContent);
    } catch (secondParseError) {
      console.error('❌ JSON parsing failed even after cleanup. Manual intervention required.');
      console.error('Parse error:', secondParseError.message);
      
      // Write the problematic content to a debug file
      const debugFile = outputFile.replace('.json', '_debug.txt');
      fs.writeFileSync(debugFile, jsonContent);
      console.log(`🐛 Debug content written to: ${debugFile}`);
      
      process.exit(1);
    }
  }
  
  console.log(`✅ Successfully parsed ${cities.length} cities from TypeScript`);
  
  // Validate the structure
  const sampleCity = cities[0];
  const requiredFields = ['iataCode', 'cityName', 'countryName', 'countryCode', 'themeScores'];
  
  for (const field of requiredFields) {
    if (!sampleCity.hasOwnProperty(field)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
  
  console.log('✅ City structure validation passed');
  
  // Verify theme scores
  const themes = Object.keys(sampleCity.themeScores || {});
  console.log(`📊 Detected themes: ${themes.join(', ')}`);
  
  if (themes.length !== 5) {
    console.warn(`⚠️  Expected 5 themes, found ${themes.length}`);
  }
  
  // Create the final JSON structure
  const exportData = {
    metadata: {
      exportDate: new Date().toISOString(),
      totalCities: cities.length,
      themes: themes,
      version: '2.0.1'
    },
    ALL_CITIES: cities
  };
  
  // Write the JSON file with nice formatting
  fs.writeFileSync(outputFile, JSON.stringify(exportData, null, 2));
  
  console.log('🎉 Export completed successfully!');
  console.log(`📈 Exported ${cities.length} cities with ${themes.length} themes each`);
  console.log(`💾 File size: ${(fs.statSync(outputFile).size / 1024).toFixed(1)} KB`);
  
  // Display summary statistics
  const countryCounts = {};
  const priceRangeCounts = {};
  
  cities.forEach(city => {
    countryCounts[city.countryCode] = (countryCounts[city.countryCode] || 0) + 1;
    priceRangeCounts[city.priceRange] = (priceRangeCounts[city.priceRange] || 0) + 1;
  });
  
  console.log('\n📊 Export Summary:');
  console.log(`Countries: ${Object.keys(countryCounts).length}`);
  console.log(`Price ranges: ${Object.keys(priceRangeCounts).join(', ')}`);
  console.log('Top countries by city count:');
  
  Object.entries(countryCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .forEach(([country, count]) => {
      console.log(`  ${country}: ${count} cities`);
    });
  
} catch (error) {
  console.error('❌ Export failed:', error.message);
  process.exit(1);
}