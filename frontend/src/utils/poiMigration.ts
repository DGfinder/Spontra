import { 
  PointOfInterest, 
  CreatePOIRequest, 
  ThemeType, 
  POICategory,
  DEFAULT_POI_CATEGORIES,
  POIPriceLevel
} from '@/types/pois'
import { AdminDestination } from '@/types/admin'

interface ActivityMapping {
  activity: string
  suggestedTheme: ThemeType
  suggestedCategoryId: string
  confidence: number
  keywords: string[]
}

interface MigrationResult {
  success: boolean
  migratedPOIs: number
  skippedActivities: number
  errors: string[]
  suggestions: ActivityMapping[]
  generatedPOIs: CreatePOIRequest[]
}

interface MigrationOptions {
  defaultCoordinates?: { lat: number; lng: number }
  includeUnknownActivities?: boolean
  autoAssignThemes?: boolean
  generateDescriptions?: boolean
  defaultPriceLevel?: POIPriceLevel
}

/**
 * Activity to theme/category mapping database
 */
const ACTIVITY_MAPPINGS: Record<string, ActivityMapping> = {
  // Vibe (Social & Entertainment)
  'nightlife': {
    activity: 'nightlife',
    suggestedTheme: 'vibe',
    suggestedCategoryId: 'nightlife',
    confidence: 0.95,
    keywords: ['bar', 'club', 'party', 'night', 'drink', 'cocktail']
  },
  'bars': {
    activity: 'bars',
    suggestedTheme: 'vibe',
    suggestedCategoryId: 'nightlife',
    confidence: 0.90,
    keywords: ['bar', 'pub', 'tavern', 'cocktail', 'beer', 'wine']
  },
  'clubs': {
    activity: 'clubs',
    suggestedTheme: 'vibe',
    suggestedCategoryId: 'nightlife',
    confidence: 0.90,
    keywords: ['club', 'disco', 'dance', 'party', 'music', 'dj']
  },
  'concerts': {
    activity: 'concerts',
    suggestedTheme: 'vibe',
    suggestedCategoryId: 'entertainment',
    confidence: 0.85,
    keywords: ['concert', 'music', 'live', 'performance', 'venue', 'artist']
  },
  'festivals': {
    activity: 'festivals',
    suggestedTheme: 'vibe',
    suggestedCategoryId: 'entertainment',
    confidence: 0.80,
    keywords: ['festival', 'event', 'celebration', 'music', 'cultural']
  },
  'cafes': {
    activity: 'cafes',
    suggestedTheme: 'vibe',
    suggestedCategoryId: 'social_spots',
    confidence: 0.75,
    keywords: ['cafe', 'coffee', 'social', 'meeting', 'work', 'wifi']
  },

  // Adventure (Active & Outdoor)
  'hiking': {
    activity: 'hiking',
    suggestedTheme: 'adventure',
    suggestedCategoryId: 'outdoor_activities',
    confidence: 0.95,
    keywords: ['hike', 'trail', 'mountain', 'outdoor', 'nature', 'walk']
  },
  'biking': {
    activity: 'biking',
    suggestedTheme: 'adventure',
    suggestedCategoryId: 'outdoor_activities',
    confidence: 0.90,
    keywords: ['bike', 'cycle', 'bicycle', 'trail', 'ride', 'tour']
  },
  'water sports': {
    activity: 'water sports',
    suggestedTheme: 'adventure',
    suggestedCategoryId: 'water_sports',
    confidence: 0.95,
    keywords: ['water', 'swim', 'surf', 'sail', 'dive', 'kayak', 'boat']
  },
  'swimming': {
    activity: 'swimming',
    suggestedTheme: 'adventure',
    suggestedCategoryId: 'water_sports',
    confidence: 0.85,
    keywords: ['swim', 'pool', 'water', 'beach', 'lake', 'river']
  },
  'surfing': {
    activity: 'surfing',
    suggestedTheme: 'adventure',
    suggestedCategoryId: 'water_sports',
    confidence: 0.90,
    keywords: ['surf', 'wave', 'board', 'ocean', 'beach', 'water']
  },
  'extreme sports': {
    activity: 'extreme sports',
    suggestedTheme: 'adventure',
    suggestedCategoryId: 'extreme_sports',
    confidence: 0.95,
    keywords: ['extreme', 'skydive', 'bungee', 'climb', 'adrenaline', 'thrill']
  },

  // Discover (Cultural & Creative)
  'museums': {
    activity: 'museums',
    suggestedTheme: 'discover',
    suggestedCategoryId: 'historical_sites',
    confidence: 0.95,
    keywords: ['museum', 'exhibit', 'art', 'history', 'culture', 'collection']
  },
  'historical sites': {
    activity: 'historical sites',
    suggestedTheme: 'discover',
    suggestedCategoryId: 'historical_sites',
    confidence: 0.95,
    keywords: ['historical', 'heritage', 'monument', 'ancient', 'cultural', 'landmark']
  },
  'architecture tours': {
    activity: 'architecture tours',
    suggestedTheme: 'discover',
    suggestedCategoryId: 'historical_sites',
    confidence: 0.85,
    keywords: ['architecture', 'building', 'tour', 'design', 'historic', 'structure']
  },
  'art galleries': {
    activity: 'art galleries',
    suggestedTheme: 'discover',
    suggestedCategoryId: 'art_galleries',
    confidence: 0.90,
    keywords: ['art', 'gallery', 'exhibition', 'artist', 'painting', 'sculpture']
  },
  'cultural experiences': {
    activity: 'cultural experiences',
    suggestedTheme: 'discover',
    suggestedCategoryId: 'cultural_experiences',
    confidence: 0.80,
    keywords: ['culture', 'tradition', 'local', 'experience', 'authentic', 'heritage']
  },
  'sightseeing': {
    activity: 'sightseeing',
    suggestedTheme: 'discover',
    suggestedCategoryId: 'historical_sites',
    confidence: 0.70,
    keywords: ['sightseeing', 'tour', 'attraction', 'landmark', 'visit', 'explore']
  },

  // Indulge (Luxury & Indulgent)
  'fine dining': {
    activity: 'fine dining',
    suggestedTheme: 'indulge',
    suggestedCategoryId: 'fine_dining',
    confidence: 0.95,
    keywords: ['restaurant', 'fine', 'dining', 'cuisine', 'chef', 'gourmet']
  },
  'restaurants': {
    activity: 'restaurants',
    suggestedTheme: 'indulge',
    suggestedCategoryId: 'fine_dining',
    confidence: 0.80,
    keywords: ['restaurant', 'food', 'dining', 'eat', 'cuisine', 'meal']
  },
  'food tours': {
    activity: 'food tours',
    suggestedTheme: 'indulge',
    suggestedCategoryId: 'fine_dining',
    confidence: 0.85,
    keywords: ['food', 'tour', 'taste', 'culinary', 'local', 'cuisine']
  },
  'luxury shopping': {
    activity: 'luxury shopping',
    suggestedTheme: 'indulge',
    suggestedCategoryId: 'luxury_shopping',
    confidence: 0.95,
    keywords: ['luxury', 'shopping', 'boutique', 'designer', 'fashion', 'high-end']
  },
  'shopping': {
    activity: 'shopping',
    suggestedTheme: 'indulge',
    suggestedCategoryId: 'luxury_shopping',
    confidence: 0.70,
    keywords: ['shop', 'store', 'market', 'buy', 'retail', 'mall']
  },
  'spa treatments': {
    activity: 'spa treatments',
    suggestedTheme: 'indulge',
    suggestedCategoryId: 'spa_wellness',
    confidence: 0.95,
    keywords: ['spa', 'massage', 'wellness', 'relaxation', 'beauty', 'treatment']
  },
  'cooking classes': {
    activity: 'cooking classes',
    suggestedTheme: 'indulge',
    suggestedCategoryId: 'fine_dining',
    confidence: 0.80,
    keywords: ['cooking', 'class', 'culinary', 'chef', 'learn', 'food']
  },

  // Nature (Nature & Relaxation)
  'parks': {
    activity: 'parks',
    suggestedTheme: 'nature',
    suggestedCategoryId: 'parks_gardens',
    confidence: 0.90,
    keywords: ['park', 'garden', 'green', 'nature', 'outdoor', 'trees']
  },
  'beaches': {
    activity: 'beaches',
    suggestedTheme: 'nature',
    suggestedCategoryId: 'beaches',
    confidence: 0.95,
    keywords: ['beach', 'sand', 'ocean', 'sea', 'coast', 'shore']
  },
  'beach activities': {
    activity: 'beach activities',
    suggestedTheme: 'nature',
    suggestedCategoryId: 'beaches',
    confidence: 0.85,
    keywords: ['beach', 'sand', 'ocean', 'activity', 'water', 'sun']
  },
  'gardens': {
    activity: 'gardens',
    suggestedTheme: 'nature',
    suggestedCategoryId: 'parks_gardens',
    confidence: 0.90,
    keywords: ['garden', 'botanical', 'flowers', 'plants', 'nature', 'peaceful']
  },
  'scenic viewpoints': {
    activity: 'scenic viewpoints',
    suggestedTheme: 'nature',
    suggestedCategoryId: 'scenic_viewpoints',
    confidence: 0.90,
    keywords: ['scenic', 'view', 'lookout', 'panorama', 'vista', 'overlook']
  },
  'relaxation': {
    activity: 'relaxation',
    suggestedTheme: 'nature',
    suggestedCategoryId: 'parks_gardens',
    confidence: 0.75,
    keywords: ['relax', 'peaceful', 'quiet', 'tranquil', 'calm', 'serene']
  }
}

/**
 * Enhanced activity matching using fuzzy matching and keywords
 */
function findBestActivityMapping(activity: string): ActivityMapping | null {
  const activityLower = activity.toLowerCase().trim()
  
  // Direct match
  if (ACTIVITY_MAPPINGS[activityLower]) {
    return ACTIVITY_MAPPINGS[activityLower]
  }

  // Fuzzy matching based on keywords
  let bestMatch: ActivityMapping | null = null
  let bestScore = 0

  Object.values(ACTIVITY_MAPPINGS).forEach(mapping => {
    let score = 0
    
    // Check if activity contains any keywords
    mapping.keywords.forEach(keyword => {
      if (activityLower.includes(keyword)) {
        score += 1
      }
    })

    // Check if any keyword is contained in activity
    if (mapping.keywords.some(keyword => activityLower.includes(keyword) || keyword.includes(activityLower))) {
      score += 0.5
    }

    // Bonus for exact substring match
    if (activityLower.includes(mapping.activity) || mapping.activity.includes(activityLower)) {
      score += 2
    }

    if (score > bestScore) {
      bestScore = score
      bestMatch = mapping
    }
  })

  return bestScore > 0.5 ? bestMatch : null
}

/**
 * Generate a description based on activity name and theme
 */
function generateDescription(activity: string, theme: ThemeType): string {
  const descriptions: Record<ThemeType, string[]> = {
    vibe: [
      `Experience the vibrant ${activity} scene that makes this destination come alive`,
      `Immerse yourself in the local ${activity} culture and social atmosphere`,
      `Enjoy the energetic ${activity} that defines this city's social landscape`
    ],
    adventure: [
      `Embark on thrilling ${activity} adventures in this exciting destination`,
      `Challenge yourself with ${activity} activities that will get your adrenaline pumping`,
      `Explore the great outdoors through ${activity} experiences`
    ],
    discover: [
      `Discover the rich history and culture through ${activity} in this fascinating destination`,
      `Explore the cultural heritage and significance of ${activity} in this historic location`,
      `Uncover the stories and traditions behind ${activity} that shaped this place`
    ],
    indulge: [
      `Treat yourself to luxurious ${activity} experiences in this premium destination`,
      `Indulge in the finest ${activity} offerings that this sophisticated location provides`,
      `Pamper yourself with exceptional ${activity} that epitomizes luxury and comfort`
    ],
    nature: [
      `Connect with nature through peaceful ${activity} in this beautiful natural setting`,
      `Enjoy the serene beauty of ${activity} surrounded by stunning natural landscapes`,
      `Find tranquility and rejuvenation through ${activity} in this pristine environment`
    ]
  }

  const themeDescriptions = descriptions[theme]
  return themeDescriptions[Math.floor(Math.random() * themeDescriptions.length)]
}

/**
 * Estimate coordinates based on destination and activity type
 */
function estimateCoordinates(
  destinationCoords: { lat: number; lng: number },
  theme: ThemeType,
  activity: string
): { lat: number; lng: number } {
  // Add small random offset based on theme to spread POIs around the destination
  const offsets: Record<ThemeType, { latOffset: number; lngOffset: number }> = {
    vibe: { latOffset: 0.01, lngOffset: 0.02 }, // Downtown/city center
    adventure: { latOffset: 0.05, lngOffset: -0.03 }, // Slightly outside city
    discover: { latOffset: -0.02, lngOffset: 0.01 }, // Historic areas
    indulge: { latOffset: 0.02, lngOffset: 0.03 }, // Upscale districts
    nature: { latOffset: -0.08, lngOffset: -0.05 } // Outside the city
  }

  const offset = offsets[theme]
  return {
    lat: destinationCoords.lat + offset.latOffset + (Math.random() - 0.5) * 0.02,
    lng: destinationCoords.lng + offset.lngOffset + (Math.random() - 0.5) * 0.02
  }
}

/**
 * Convert destination activities to POI objects
 */
export function convertActivitiesToPOIs(
  destination: AdminDestination,
  options: MigrationOptions = {}
): MigrationResult {
  const {
    defaultCoordinates = destination.coordinates,
    includeUnknownActivities = false,
    autoAssignThemes = true,
    generateDescriptions = true,
    defaultPriceLevel = 'moderate'
  } = options

  const result: MigrationResult = {
    success: true,
    migratedPOIs: 0,
    skippedActivities: 0,
    errors: [],
    suggestions: [],
    generatedPOIs: []
  }

  if (!destination.supportedActivities || destination.supportedActivities.length === 0) {
    result.errors.push('No activities found to migrate')
    return result
  }

  destination.supportedActivities.forEach((activity, index) => {
    try {
      const mapping = findBestActivityMapping(activity)
      
      if (!mapping && !includeUnknownActivities) {
        result.skippedActivities++
        result.suggestions.push({
          activity,
          suggestedTheme: 'discover', // Default fallback
          suggestedCategoryId: 'cultural_experiences',
          confidence: 0.3,
          keywords: []
        })
        return
      }

      // Use mapping or create default
      const theme = mapping?.suggestedTheme || 'discover'
      const categoryId = mapping?.suggestedCategoryId || 'cultural_experiences'

      // Find category
      const category = Object.values(DEFAULT_POI_CATEGORIES)
        .flat()
        .find(cat => cat.id === categoryId)

      if (!category) {
        result.errors.push(`Category ${categoryId} not found for activity: ${activity}`)
        result.skippedActivities++
        return
      }

      // Generate POI
      const poi: CreatePOIRequest = {
        name: activity.charAt(0).toUpperCase() + activity.slice(1),
        description: generateDescriptions 
          ? generateDescription(activity, theme)
          : `Experience ${activity} in ${destination.cityName}`,
        shortDescription: `${activity} in ${destination.cityName}`,
        coordinates: estimateCoordinates(defaultCoordinates, theme, activity),
        theme,
        categoryId,
        tags: mapping?.keywords || [activity.toLowerCase()],
        priceLevel: defaultPriceLevel,
        isIndoor: ['museums', 'art galleries', 'shopping', 'restaurants', 'bars', 'clubs', 'spas'].some(indoor => 
          activity.toLowerCase().includes(indoor)
        ),
        isOutdoor: ['hiking', 'beaches', 'parks', 'biking', 'water sports', 'gardens', 'scenic'].some(outdoor => 
          activity.toLowerCase().includes(outdoor)
        ),
        status: 'draft' // Start as draft for review
      }

      result.generatedPOIs.push(poi)
      result.migratedPOIs++

      if (mapping) {
        result.suggestions.push(mapping)
      }

    } catch (error) {
      result.errors.push(`Failed to process activity "${activity}": ${error instanceof Error ? error.message : 'Unknown error'}`)
      result.skippedActivities++
    }
  })

  return result
}

/**
 * Batch migrate multiple destinations
 */
export function batchMigrateDestinations(
  destinations: AdminDestination[],
  options: MigrationOptions = {}
): Record<string, MigrationResult> {
  const results: Record<string, MigrationResult> = {}

  destinations.forEach(destination => {
    try {
      results[destination.iataCode] = convertActivitiesToPOIs(destination, options)
    } catch (error) {
      results[destination.iataCode] = {
        success: false,
        migratedPOIs: 0,
        skippedActivities: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        suggestions: [],
        generatedPOIs: []
      }
    }
  })

  return results
}

/**
 * Validate POI data before creation
 */
export function validatePOIData(poi: CreatePOIRequest): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!poi.name || poi.name.trim().length < 2) {
    errors.push('POI name must be at least 2 characters long')
  }

  if (!poi.description || poi.description.trim().length < 10) {
    errors.push('POI description must be at least 10 characters long')
  }

  if (!poi.coordinates || typeof poi.coordinates.lat !== 'number' || typeof poi.coordinates.lng !== 'number') {
    errors.push('Valid coordinates (lat, lng) are required')
  }

  if (!poi.theme || !['vibe', 'adventure', 'discover', 'indulge', 'nature'].includes(poi.theme)) {
    errors.push('Valid theme is required')
  }

  if (!poi.categoryId || !Object.values(DEFAULT_POI_CATEGORIES).flat().some(cat => cat.id === poi.categoryId)) {
    errors.push('Valid category ID is required')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Generate migration report
 */
export function generateMigrationReport(results: Record<string, MigrationResult>): string {
  const totalDestinations = Object.keys(results).length
  const successfulMigrations = Object.values(results).filter(r => r.success).length
  const totalPOIs = Object.values(results).reduce((sum, r) => sum + r.migratedPOIs, 0)
  const totalSkipped = Object.values(results).reduce((sum, r) => sum + r.skippedActivities, 0)
  const totalErrors = Object.values(results).reduce((sum, r) => sum + r.errors.length, 0)

  let report = `# POI Migration Report\n\n`
  report += `## Summary\n`
  report += `- **Total Destinations**: ${totalDestinations}\n`
  report += `- **Successful Migrations**: ${successfulMigrations}\n`
  report += `- **Total POIs Created**: ${totalPOIs}\n`
  report += `- **Activities Skipped**: ${totalSkipped}\n`
  report += `- **Total Errors**: ${totalErrors}\n\n`

  report += `## Destination Details\n\n`
  
  Object.entries(results).forEach(([iataCode, result]) => {
    report += `### ${iataCode}\n`
    report += `- **Status**: ${result.success ? '✅ Success' : '❌ Failed'}\n`
    report += `- **POIs Created**: ${result.migratedPOIs}\n`
    report += `- **Activities Skipped**: ${result.skippedActivities}\n`
    
    if (result.errors.length > 0) {
      report += `- **Errors**:\n`
      result.errors.forEach(error => {
        report += `  - ${error}\n`
      })
    }
    
    report += `\n`
  })

  // Theme distribution
  const themeDistribution: Record<ThemeType, number> = {
    vibe: 0,
    adventure: 0,
    discover: 0,
    indulge: 0,
    nature: 0
  }

  Object.values(results).forEach(result => {
    result.generatedPOIs.forEach(poi => {
      themeDistribution[poi.theme]++
    })
  })

  report += `## Theme Distribution\n\n`
  Object.entries(themeDistribution).forEach(([theme, count]) => {
    report += `- **${theme.charAt(0).toUpperCase() + theme.slice(1)}**: ${count} POIs\n`
  })

  return report
}

/**
 * Export migration results to CSV
 */
export function exportMigrationToCSV(results: Record<string, MigrationResult>): string {
  const headers = [
    'Destination',
    'Original Activity',
    'POI Name',
    'Theme',
    'Category',
    'Description',
    'Latitude',
    'Longitude',
    'Price Level',
    'Status'
  ]

  const rows: string[][] = [headers]

  Object.entries(results).forEach(([iataCode, result]) => {
    result.generatedPOIs.forEach(poi => {
      rows.push([
        iataCode,
        poi.name, // Using name as activity since we converted it
        poi.name,
        poi.theme,
        poi.categoryId,
        `"${poi.description.replace(/"/g, '""')}"`,
        poi.coordinates.lat.toString(),
        poi.coordinates.lng.toString(),
        poi.priceLevel,
        poi.status
      ])
    })
  })

  return rows.map(row => row.join(',')).join('\n')
}

// Export utility functions
export {
  findBestActivityMapping,
  generateDescription,
  estimateCoordinates,
  ACTIVITY_MAPPINGS
}