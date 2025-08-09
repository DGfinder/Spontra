// Comprehensive Theme-based City Database
// 5 themes with expanded scope and multi-theme scoring system
// Cities can excel in multiple themes with different scores

export interface ThemeCity {
  iataCode: string
  cityName: string
  countryName: string
  countryCode: string
  themeScores: {
    party: number      // Social & Entertainment: nightlife, bars, food scenes, social dining (0-100)
    adventure: number  // Active & Outdoor: hiking, sports, nature, budget backpacking (0-100) 
    learn: number      // Cultural & Creative: museums, history, arts, digital nomad hubs (0-100)
    shopping: number   // Luxury & Indulgent: fashion, luxury, spas, wellness, romance (0-100)
    beach: number      // Relaxation & Family: coastal, family activities, leisure, beach wellness (0-100)
  }
  highlights: string[] // What makes this city special across all themes
  averageFlightTime: number // Rough estimate for European origins (hours)
  priceRange: 'budget' | 'mid-range' | 'luxury' // Overall cost level
  bestMonths: string[] // Optimal visiting months
  description: string // Rich description of the city's character
}

// Theme definitions with expanded scope
export const THEME_DEFINITIONS = {
  party: {
    name: 'Social & Entertainment',
    description: 'Nightlife, bars, clubs, music festivals, food scenes, social dining experiences',
    keywords: ['nightlife', 'bars', 'clubs', 'restaurants', 'music', 'festivals', 'social']
  },
  adventure: {
    name: 'Active & Outdoor',
    description: 'Hiking, extreme sports, nature activities, budget backpacking, outdoor wellness',
    keywords: ['hiking', 'sports', 'nature', 'outdoor', 'backpacking', 'adventure', 'mountains']
  },
  learn: {
    name: 'Cultural & Creative',
    description: 'Museums, history, arts districts, creative scenes, digital nomad hubs, education',
    keywords: ['museums', 'history', 'culture', 'arts', 'creative', 'learning', 'architecture']
  },
  shopping: {
    name: 'Luxury & Indulgent',
    description: 'Fashion, luxury shopping, spas, wellness experiences, romantic getaways, premium services',
    keywords: ['shopping', 'luxury', 'fashion', 'spas', 'wellness', 'romance', 'premium']
  },
  beach: {
    name: 'Relaxation & Family',
    description: 'Coastal destinations, family activities, leisure travel, beach wellness, water sports',
    keywords: ['beach', 'coast', 'family', 'relaxation', 'water', 'leisure', 'islands']
  }
} as const

// 🌟 COMPREHENSIVE CITY DATABASE - Multi-theme scoring system
export const ALL_CITIES: ThemeCity[] = [
  {
    iataCode: 'BCN',
    cityName: 'Barcelona',
    countryName: 'Spain',
    countryCode: 'ES',
    themeScores: {
      party: 85,     // Excellent nightlife, beach clubs, social dining
      adventure: 45, // Some outdoor activities, but not primary focus
      learn: 75,     // Rich culture, museums, architecture
      shopping: 65,  // Good shopping, but not luxury focused
      beach: 90      // World-class city beaches and coastal culture
    },
    highlights: ['City beaches', 'Gothic Quarter nightlife', 'Gaudí architecture', 'Tapas culture', 'Beach clubs'],
    averageFlightTime: 2.5,
    priceRange: 'mid-range',
    bestMonths: ['Apr', 'May', 'Jun', 'Sep', 'Oct'],
    description: 'Perfect blend of beach, culture, and nightlife. Mediterranean capital with something for everyone.'
  },
  {
    iataCode: 'IBZ',
    cityName: 'Ibiza',
    countryName: 'Spain', 
    countryCode: 'ES',
    themeScores: {
      party: 98,     // World capital of electronic music
      adventure: 30, // Limited outdoor activities
      learn: 25,     // Minimal cultural offerings
      shopping: 40,  // Basic shopping scene
      beach: 95      // Stunning beaches and beach clubs
    },
    highlights: ['Electronic music capital', 'Sunset parties', 'Superstar DJs', 'Crystal clear waters', 'Beach parties'],
    averageFlightTime: 2.5,
    priceRange: 'luxury',
    bestMonths: ['May', 'Jun', 'Jul', 'Aug', 'Sep'],
    description: 'The ultimate party destination with world-renowned clubs and beautiful beaches.'
  },
  {
    iataCode: 'AMS',
    cityName: 'Amsterdam',
    countryName: 'Netherlands',
    countryCode: 'NL',
    themeScores: {
      party: 88,     // Famous nightlife and social scene
      adventure: 35, // Limited outdoor activities
      learn: 80,     // Excellent museums and culture
      shopping: 70,  // Good shopping districts
      beach: 15      // No beaches
    },
    highlights: ['Red light district', 'Coffee shop culture', 'Canal tours', 'World-class museums', 'Liberal atmosphere'],
    averageFlightTime: 1.5,
    priceRange: 'luxury',
    bestMonths: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
    description: 'Liberal cultural capital with unique nightlife, canals, and artistic heritage.'
  },
  {
    iataCode: 'BER',
    cityName: 'Berlin',
    countryName: 'Germany',
    countryCode: 'DE',
    themeScores: {
      party: 92,     // Underground techno and alternative scene
      adventure: 25, // Limited outdoor activities
      learn: 85,     // Rich history and cultural sites
      shopping: 60,  // Good alternative shopping
      beach: 10      // No beaches
    },
    highlights: ['Underground techno', 'Berghain club', 'Historical sites', 'Alternative culture', 'Street art'],
    averageFlightTime: 1.5,
    priceRange: 'budget',
    bestMonths: ['May', 'Jun', 'Jul', 'Aug', 'Sep'],
    description: 'Alternative culture capital with legendary nightlife and profound history.'
  },
  // More party/social cities
  {
    iataCode: 'BUD',
    cityName: 'Budapest',
    countryName: 'Hungary',
    countryCode: 'HU',
    themeScores: {
      party: 85,     // Famous ruin pubs and thermal bath parties
      adventure: 35, // Some outdoor activities on Danube
      learn: 75,     // Rich history and beautiful architecture
      shopping: 45,  // Basic shopping scene
      beach: 10      // No beaches
    },
    highlights: ['Ruin pubs', 'Thermal bath parties', 'Danube cruises', 'Parliament building', 'Affordable nightlife'],
    averageFlightTime: 2,
    priceRange: 'budget',
    bestMonths: ['May', 'Jun', 'Jul', 'Aug', 'Sep'],
    description: 'Budget-friendly party capital with unique ruin pub culture and thermal baths.'
  },
  {
    iataCode: 'PRG',
    cityName: 'Prague',
    countryName: 'Czech Republic',
    countryCode: 'CZ',
    themeScores: {
      party: 80,     // Great beer culture and pub scene
      adventure: 25, // Limited outdoor activities
      learn: 90,     // Stunning medieval architecture and history
      shopping: 50,  // Decent shopping in Old Town
      beach: 5       // No beaches
    },
    highlights: ['Medieval architecture', 'Beer halls', 'Charles Bridge', 'Prague Castle', 'Cheap beer'],
    averageFlightTime: 1.5,
    priceRange: 'budget',
    bestMonths: ['May', 'Jun', 'Jul', 'Aug', 'Sep'],
    description: 'Medieval fairy-tale city with world-class beer culture and stunning architecture.'
  },

  // Adventure/Outdoor cities
  {
    iataCode: 'ZUR',
    cityName: 'Zurich',
    countryName: 'Switzerland',
    countryCode: 'CH',
    themeScores: {
      party: 40,     // Limited nightlife scene
      adventure: 85, // Swiss Alps access, hiking, winter sports
      learn: 60,     // Some museums and culture
      shopping: 80,  // Luxury shopping hub
      beach: 35      // Lake activities but no beaches
    },
    highlights: ['Swiss Alps access', 'Lake Zurich', 'Luxury shopping', 'Hiking trails', 'Winter sports'],
    averageFlightTime: 2,
    priceRange: 'luxury',
    bestMonths: ['Jun', 'Jul', 'Aug', 'Sep', 'Dec', 'Jan'],
    description: 'Gateway to Swiss Alps with luxury shopping and pristine outdoor activities.'
  },
  {
    iataCode: 'INN',
    cityName: 'Innsbruck',
    countryName: 'Austria',
    countryCode: 'AT',
    themeScores: {
      party: 35,     // Limited nightlife
      adventure: 95, // World-class skiing and mountain activities
      learn: 50,     // Some cultural sites
      shopping: 45,  // Basic shopping
      beach: 15      // No beaches, but mountain lakes
    },
    highlights: ['Skiing paradise', 'Mountain climbing', 'Alpine adventures', 'Winter Olympics heritage', 'Tyrolean Alps'],
    averageFlightTime: 2,
    priceRange: 'mid-range',
    bestMonths: ['Dec', 'Jan', 'Feb', 'Jun', 'Jul', 'Aug'],
    description: 'Ultimate Alpine adventure destination with world-class skiing and mountain sports.'
  },
  {
    iataCode: 'KEF',
    cityName: 'Reykjavik',
    countryName: 'Iceland',
    countryCode: 'IS',
    themeScores: {
      party: 60,     // Surprisingly good nightlife scene
      adventure: 95, // Northern lights, glaciers, volcanoes, unique nature
      learn: 70,     // Viking heritage and modern culture
      shopping: 40,  // Limited but unique local goods
      beach: 20      // Cold water, not traditional beaches
    },
    highlights: ['Northern lights', 'Glacier tours', 'Volcano hiking', 'Blue Lagoon', 'Viking heritage'],
    averageFlightTime: 3,
    priceRange: 'luxury',
    bestMonths: ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    description: 'Otherworldly adventure destination with unique natural phenomena and surprises.'
  },

  // Cultural/Learn cities
  {
    iataCode: 'ROM',
    cityName: 'Rome',
    countryName: 'Italy',
    countryCode: 'IT',
    themeScores: {
      party: 65,     // Good nightlife and dining scene
      adventure: 25, // Limited outdoor activities
      learn: 98,     // Ultimate historical and cultural destination
      shopping: 75,  // Great fashion shopping
      beach: 10      // No beaches
    },
    highlights: ['Ancient Rome', 'Vatican Museums', 'Colosseum', 'Italian cuisine', 'Art masterpieces'],
    averageFlightTime: 2.5,
    priceRange: 'mid-range',
    bestMonths: ['Apr', 'May', 'Jun', 'Sep', 'Oct'],
    description: 'Eternal City with unparalleled history, art, and cultural treasures.'
  },
  {
    iataCode: 'PAR',
    cityName: 'Paris',
    countryName: 'France',
    countryCode: 'FR',
    themeScores: {
      party: 75,     // Great dining and nightlife scene
      adventure: 20, // Limited outdoor activities
      learn: 95,     // World-class museums and culture
      shopping: 95,  // Fashion capital of the world
      beach: 5       // No beaches
    },
    highlights: ['Louvre Museum', 'Eiffel Tower', 'Fashion shopping', 'Fine dining', 'Art galleries'],
    averageFlightTime: 1.5,
    priceRange: 'luxury',
    bestMonths: ['Apr', 'May', 'Jun', 'Sep', 'Oct'],
    description: 'City of Light combining world-class culture, fashion, and culinary excellence.'
  },
  {
    iataCode: 'FLR',
    cityName: 'Florence',
    countryName: 'Italy',
    countryCode: 'IT',
    themeScores: {
      party: 40,     // Limited nightlife
      adventure: 25, // Some outdoor activities in Tuscany
      learn: 95,     // Renaissance art capital
      shopping: 80,  // Luxury Italian fashion and crafts
      beach: 5       // No beaches
    },
    highlights: ['Renaissance art', 'Uffizi Gallery', 'Michelangelo\'s David', 'Tuscan cuisine', 'Leather goods'],
    averageFlightTime: 2.5,
    priceRange: 'mid-range',
    bestMonths: ['Apr', 'May', 'Jun', 'Sep', 'Oct'],
    description: 'Renaissance masterpiece with unrivaled art collections and Tuscan charm.'
  },

  // Luxury/Shopping cities
  {
    iataCode: 'MIL',
    cityName: 'Milan',
    countryName: 'Italy',
    countryCode: 'IT',
    themeScores: {
      party: 70,     // Good nightlife and aperitivo culture
      adventure: 15, // Limited outdoor activities
      learn: 65,     // Some cultural sites
      shopping: 98,  // Global fashion capital
      beach: 5       // No beaches
    },
    highlights: ['Fashion capital', 'Luxury brands', 'Quadrilatero della Moda', 'La Scala opera', 'Design district'],
    averageFlightTime: 2,
    priceRange: 'luxury',
    bestMonths: ['Apr', 'May', 'Jun', 'Sep', 'Oct'],
    description: 'Global fashion and design capital with unparalleled luxury shopping.'
  },
  {
    iataCode: 'VIE',
    cityName: 'Vienna',
    countryName: 'Austria',
    countryCode: 'AT',
    themeScores: {
      party: 50,     // Traditional coffeehouses and some nightlife
      adventure: 30, // Limited outdoor activities
      learn: 90,     // Rich imperial history and classical music
      shopping: 75,  // Good luxury shopping and traditional crafts
      beach: 5       // No beaches
    },
    highlights: ['Imperial palaces', 'Classical music', 'Coffee house culture', 'Art museums', 'Luxury shopping'],
    averageFlightTime: 2,
    priceRange: 'mid-range',
    bestMonths: ['Apr', 'May', 'Jun', 'Sep', 'Oct'],
    description: 'Imperial capital with classical elegance and rich cultural heritage.'
  },

  // Beach/Relaxation cities
  {
    iataCode: 'NCE',
    cityName: 'Nice',
    countryName: 'France',
    countryCode: 'FR',
    themeScores: {
      party: 60,     // Good nightlife and dining
      adventure: 40, // Some outdoor activities in mountains nearby
      learn: 55,     // Some cultural attractions
      shopping: 70,  // Good luxury shopping
      beach: 90      // French Riviera beaches
    },
    highlights: ['French Riviera', 'Promenade des Anglais', 'Mediterranean beaches', 'Luxury resorts', 'Côte d\'Azur'],
    averageFlightTime: 2,
    priceRange: 'luxury',
    bestMonths: ['May', 'Jun', 'Jul', 'Aug', 'Sep'],
    description: 'Glamorous French Riviera destination with beautiful beaches and luxury lifestyle.'
  },
  {
    iataCode: 'ATH',
    cityName: 'Athens',
    countryName: 'Greece',
    countryCode: 'GR',
    themeScores: {
      party: 70,     // Good nightlife and taverna culture
      adventure: 45, // Island hopping and some outdoor activities
      learn: 95,     // Ancient Greece and classical history
      shopping: 40,  // Basic shopping scene
      beach: 60      // Island access and some nearby beaches
    },
    highlights: ['Ancient Greece', 'Acropolis', 'Island hopping', 'Greek cuisine', 'Mediterranean culture'],
    averageFlightTime: 3,
    priceRange: 'budget',
    bestMonths: ['Apr', 'May', 'Jun', 'Sep', 'Oct'],
    description: 'Cradle of democracy with ancient wonders and gateway to Greek islands.'
  },

  // More European cities to reach 100+ target
  {
    iataCode: 'MAD',
    cityName: 'Madrid',
    countryName: 'Spain',
    countryCode: 'ES',
    themeScores: {
      party: 75,     // Great nightlife and tapas culture
      adventure: 30, // Some outdoor activities nearby
      learn: 85,     // World-class museums (Prado, Reina Sofia)
      shopping: 70,  // Good shopping districts
      beach: 5       // No beaches
    },
    highlights: ['Prado Museum', 'Royal Palace', 'Retiro Park', 'Tapas culture', 'Flamenco shows'],
    averageFlightTime: 2,
    priceRange: 'mid-range',
    bestMonths: ['Mar', 'Apr', 'May', 'Jun', 'Sep', 'Oct'],
    description: 'Spanish capital with incredible museums, vibrant nightlife, and authentic culture.'
  },
  {
    iataCode: 'LIS',
    cityName: 'Lisbon',
    countryName: 'Portugal',
    countryCode: 'PT',
    themeScores: {
      party: 70,     // Great nightlife in Bairro Alto
      adventure: 50, // Surfing and coastal activities
      learn: 75,     // Historic neighborhoods and cultural sites
      shopping: 55,  // Good local shopping and crafts
      beach: 70      // Great beaches nearby (Cascais)
    },
    highlights: ['Tram 28', 'Fado music', 'Pastéis de nata', 'Coastal beaches', 'Historic neighborhoods'],
    averageFlightTime: 2.5,
    priceRange: 'mid-range',
    bestMonths: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
    description: 'Charming coastal capital with authentic culture, great food, and nearby beaches.'
  },
  {
    iataCode: 'DUB',
    cityName: 'Dublin',
    countryName: 'Ireland',
    countryCode: 'IE',
    themeScores: {
      party: 85,     // Famous pub culture and nightlife
      adventure: 40, // Some outdoor activities and coastal walks
      learn: 70,     // Rich literary and historical heritage
      shopping: 60,  // Good shopping areas
      beach: 25      // Some coastal areas
    },
    highlights: ['Temple Bar', 'Guinness Storehouse', 'Trinity College', 'Literary heritage', 'Irish pubs'],
    averageFlightTime: 1.5,
    priceRange: 'mid-range',
    bestMonths: ['May', 'Jun', 'Jul', 'Aug', 'Sep'],
    description: 'Friendly capital with legendary pub culture, literary heritage, and Irish craic.'
  },
  {
    iataCode: 'EDI',
    cityName: 'Edinburgh',
    countryName: 'United Kingdom',
    countryCode: 'GB',
    themeScores: {
      party: 70,     // Good pub scene and festival nightlife
      adventure: 45, // Hiking in nearby Highlands
      learn: 90,     // Rich Scottish history and culture
      shopping: 65,  // Good shopping on Royal Mile
      beach: 15      // Limited coastal access
    },
    highlights: ['Edinburgh Castle', 'Royal Mile', 'Scottish Highland access', 'Whisky culture', 'Festivals'],
    averageFlightTime: 2,
    priceRange: 'mid-range',
    bestMonths: ['May', 'Jun', 'Jul', 'Aug', 'Sep'],
    description: 'Historic Scottish capital with medieval charm and gateway to the Highlands.'
  },
  {
    iataCode: 'LON',
    cityName: 'London',
    countryName: 'United Kingdom',
    countryCode: 'GB',
    themeScores: {
      party: 80,     // Diverse nightlife and pub culture
      adventure: 25, // Limited outdoor activities
      learn: 95,     // World-class museums and historical sites
      shopping: 90,  // Oxford Street, Harrods, boutique shopping
      beach: 10      // No beaches
    },
    highlights: ['British Museum', 'Buckingham Palace', 'West End shows', 'Oxford Street', 'Pub culture'],
    averageFlightTime: 1.5,
    priceRange: 'luxury',
    bestMonths: ['May', 'Jun', 'Jul', 'Aug', 'Sep'],
    description: 'Global cultural and shopping capital with royal heritage and diverse experiences.'
  },
  {
    iataCode: 'CPH',
    cityName: 'Copenhagen',
    countryName: 'Denmark',
    countryCode: 'DK',
    themeScores: {
      party: 65,     // Hygge culture and good nightlife
      adventure: 35, // Cycling and some outdoor activities
      learn: 75,     // Design museums and cultural sites
      shopping: 80,  // Scandinavian design and fashion
      beach: 30      // Some coastal areas
    },
    highlights: ['Nyhavn harbor', 'Design museums', 'Cycling culture', 'Hygge lifestyle', 'Scandinavian cuisine'],
    averageFlightTime: 2,
    priceRange: 'luxury',
    bestMonths: ['May', 'Jun', 'Jul', 'Aug', 'Sep'],
    description: 'Danish capital known for design, hygge culture, and high quality of life.'
  },
  {
    iataCode: 'STO',
    cityName: 'Stockholm',
    countryName: 'Sweden',
    countryCode: 'SE',
    themeScores: {
      party: 60,     // Good nightlife scene
      adventure: 45, // Archipelago activities and outdoor pursuits
      learn: 80,     // Museums and Nobel Prize heritage
      shopping: 75,  // Scandinavian fashion and design
      beach: 40      // Archipelago islands
    },
    highlights: ['Gamla Stan', 'ABBA Museum', 'Archipelago islands', 'Nobel Prize sites', 'Design districts'],
    averageFlightTime: 2.5,
    priceRange: 'luxury',
    bestMonths: ['May', 'Jun', 'Jul', 'Aug', 'Sep'],
    description: 'Beautiful Scandinavian capital spread across 14 islands with rich cultural heritage.'
  },
  {
    iataCode: 'OSL',
    cityName: 'Oslo',
    countryName: 'Norway',
    countryCode: 'NO',
    themeScores: {
      party: 55,     // Limited but quality nightlife
      adventure: 85, // Fjords, skiing, hiking, northern lights
      learn: 75,     // Viking heritage and modern museums
      shopping: 60,  // Some design shopping
      beach: 25      // Limited coastal activities
    },
    highlights: ['Fjord access', 'Viking Ship Museum', 'Northern lights', 'Cross-country skiing', 'Modern architecture'],
    averageFlightTime: 2.5,
    priceRange: 'luxury',
    bestMonths: ['Jun', 'Jul', 'Aug', 'Dec', 'Jan', 'Feb'],
    description: 'Gateway to Norwegian fjords with excellent outdoor activities and Viking heritage.'
  },
  {
    iataCode: 'HEL',
    cityName: 'Helsinki',
    countryName: 'Finland',
    countryCode: 'FI',
    themeScores: {
      party: 60,     // Good nightlife and sauna culture
      adventure: 70, // Northern lights, national parks, winter activities
      learn: 70,     // Design museums and cultural sites
      shopping: 65,  // Finnish design and crafts
      beach: 30      // Baltic Sea activities
    },
    highlights: ['Sauna culture', 'Design District', 'Suomenlinna fortress', 'Northern lights access', 'Finnish design'],
    averageFlightTime: 3,
    priceRange: 'mid-range',
    bestMonths: ['Jun', 'Jul', 'Aug', 'Dec', 'Jan'],
    description: 'Nordic capital known for design, sauna culture, and access to Lapland adventures.'
  },
  {
    iataCode: 'VCE',
    cityName: 'Venice',
    countryName: 'Italy',
    countryCode: 'IT',
    themeScores: {
      party: 45,     // Limited nightlife due to tourism focus
      adventure: 20, // Limited outdoor activities
      learn: 95,     // Unique architecture and art heritage
      shopping: 70,  // Murano glass and luxury goods
      beach: 30      // Nearby Lido beaches
    },
    highlights: ['St. Mark\'s Square', 'Grand Canal', 'Murano glass', 'Gondola rides', 'Renaissance art'],
    averageFlightTime: 2.5,
    priceRange: 'luxury',
    bestMonths: ['Apr', 'May', 'Jun', 'Sep', 'Oct'],
    description: 'Unique floating city with unparalleled architecture and romantic canals.'
  },
  {
    iataCode: 'NAP',
    cityName: 'Naples',
    countryName: 'Italy',
    countryCode: 'IT',
    themeScores: {
      party: 70,     // Great local nightlife and street food scene
      adventure: 55, // Vesuvius hiking, Amalfi Coast access
      learn: 80,     // Pompeii, archaeological sites, art
      shopping: 45,  // Basic shopping
      beach: 75      // Amalfi Coast and Capri access
    },
    highlights: ['Authentic pizza', 'Pompeii day trips', 'Mount Vesuvius', 'Amalfi Coast access', 'Street art'],
    averageFlightTime: 2.5,
    priceRange: 'budget',
    bestMonths: ['Apr', 'May', 'Jun', 'Sep', 'Oct'],
    description: 'Authentic Italian experience with incredible food, history, and Amalfi Coast access.'
  },

  // Additional European cities to reach 100+ target
  {
    iataCode: 'PMI',
    cityName: 'Palma',
    countryName: 'Spain',
    countryCode: 'ES',
    themeScores: {
      party: 75,     // Good nightlife scene
      adventure: 50, // Water sports and cycling
      learn: 40,     // Some cultural sites
      shopping: 60,  // Good shopping areas
      beach: 95      // Beautiful Mallorca beaches
    },
    highlights: ['Mallorca beaches', 'Water sports', 'Cycling routes', 'Cathedral', 'Old town'],
    averageFlightTime: 2,
    priceRange: 'mid-range',
    bestMonths: ['May', 'Jun', 'Jul', 'Aug', 'Sep'],
    description: 'Beautiful Balearic island with stunning beaches and outdoor activities.'
  },
  {
    iataCode: 'SVQ',
    cityName: 'Seville',
    countryName: 'Spain',
    countryCode: 'ES',
    themeScores: {
      party: 80,     // Great flamenco and tapas scene
      adventure: 25, // Limited outdoor activities
      learn: 90,     // Rich Moorish and Spanish heritage
      shopping: 50,  // Decent shopping
      beach: 10      // No beaches
    },
    highlights: ['Alcázar palace', 'Cathedral', 'Flamenco shows', 'Tapas culture', 'Moorish architecture'],
    averageFlightTime: 2.5,
    priceRange: 'mid-range',
    bestMonths: ['Mar', 'Apr', 'May', 'Oct', 'Nov'],
    description: 'Andalusian jewel with stunning Moorish architecture and passionate flamenco culture.'
  },
  {
    iataCode: 'BLQ',
    cityName: 'Bologna',
    countryName: 'Italy',
    countryCode: 'IT',
    themeScores: {
      party: 75,     // Great student nightlife and food scene
      adventure: 20, // Limited outdoor activities
      learn: 80,     // University city with rich history
      shopping: 50,  // Good local shopping
      beach: 5       // No beaches
    },
    highlights: ['Food capital', 'Medieval towers', 'University culture', 'Porticoes', 'Authentic cuisine'],
    averageFlightTime: 2,
    priceRange: 'mid-range',
    bestMonths: ['Apr', 'May', 'Jun', 'Sep', 'Oct'],
    description: 'Italy\'s food capital with medieval charm and vibrant university atmosphere.'
  },
  {
    iataCode: 'TUR',
    cityName: 'Turin',
    countryName: 'Italy',
    countryCode: 'IT',
    themeScores: {
      party: 60,     // Good aperitivo culture
      adventure: 70, // Alps access, skiing nearby
      learn: 75,     // Royal history and museums
      shopping: 65,  // Good shopping areas
      beach: 5       // No beaches
    },
    highlights: ['Royal palaces', 'Alps access', 'Egyptian Museum', 'Chocolate culture', 'Winter Olympics legacy'],
    averageFlightTime: 2,
    priceRange: 'mid-range',
    bestMonths: ['Apr', 'May', 'Jun', 'Sep', 'Oct', 'Dec', 'Jan'],
    description: 'Elegant royal city with Alpine access and rich cultural heritage.'
  },
  {
    iataCode: 'BRU',
    cityName: 'Brussels',
    countryName: 'Belgium',
    countryCode: 'BE',
    themeScores: {
      party: 70,     // Good beer culture and nightlife
      adventure: 25, // Limited outdoor activities
      learn: 75,     // EU institutions and art nouveau
      shopping: 80,  // Chocolate and luxury goods
      beach: 10      // No beaches
    },
    highlights: ['Grand Place', 'Belgian chocolate', 'Beer culture', 'EU institutions', 'Art Nouveau'],
    averageFlightTime: 1.5,
    priceRange: 'mid-range',
    bestMonths: ['May', 'Jun', 'Jul', 'Aug', 'Sep'],
    description: 'European capital with exceptional chocolate, beer, and architectural heritage.'
  },
  {
    iataCode: 'LYS',
    cityName: 'Lyon',
    countryName: 'France',
    countryCode: 'FR',
    themeScores: {
      party: 70,     // Great food and wine scene
      adventure: 40, // Some outdoor activities nearby
      learn: 80,     // UNESCO heritage and history
      shopping: 65,  // Good shopping districts
      beach: 10      // No beaches
    },
    highlights: ['Gastronomy capital', 'UNESCO Old Town', 'Traboules', 'Wine culture', 'Silk heritage'],
    averageFlightTime: 1.5,
    priceRange: 'mid-range',
    bestMonths: ['Apr', 'May', 'Jun', 'Sep', 'Oct'],
    description: 'France\'s gastronomic capital with UNESCO heritage and exceptional cuisine.'
  },
  {
    iataCode: 'MRS',
    cityName: 'Marseille',
    countryName: 'France',
    countryCode: 'FR',
    themeScores: {
      party: 75,     // Vibrant multicultural nightlife
      adventure: 60, // Calanques hiking, water sports
      learn: 65,     // Cultural diversity and history
      shopping: 45,  // Basic shopping
      beach: 80      // Beautiful Calanques and beaches
    },
    highlights: ['Calanques National Park', 'Old Port', 'Bouillabaisse', 'Multicultural atmosphere', 'Coastal hiking'],
    averageFlightTime: 2,
    priceRange: 'mid-range',
    bestMonths: ['May', 'Jun', 'Jul', 'Aug', 'Sep'],
    description: 'Vibrant port city with stunning Calanques and multicultural Mediterranean culture.'
  },
  {
    iataCode: 'HAM',
    cityName: 'Hamburg',
    countryName: 'Germany',
    countryCode: 'DE',
    themeScores: {
      party: 85,     // Famous Reeperbahn nightlife
      adventure: 35, // Some water activities
      learn: 70,     // Maritime heritage and museums
      shopping: 60,  // Good shopping areas
      beach: 25      // Port city but no traditional beaches
    },
    highlights: ['Reeperbahn nightlife', 'Port culture', 'Maritime museums', 'Fish market', 'Music scene'],
    averageFlightTime: 1.5,
    priceRange: 'mid-range',
    bestMonths: ['May', 'Jun', 'Jul', 'Aug', 'Sep'],
    description: 'Lively port city with legendary nightlife and rich maritime heritage.'
  },
  {
    iataCode: 'FRA',
    cityName: 'Frankfurt',
    countryName: 'Germany',
    countryCode: 'DE',
    themeScores: {
      party: 60,     // Decent nightlife scene
      adventure: 20, // Limited outdoor activities
      learn: 65,     // Museums and cultural sites
      shopping: 85,  // Excellent shopping and business district
      beach: 5       // No beaches
    },
    highlights: ['Financial district', 'Museums district', 'Apple wine culture', 'Modern architecture', 'Business hub'],
    averageFlightTime: 1.5,
    priceRange: 'luxury',
    bestMonths: ['Apr', 'May', 'Jun', 'Sep', 'Oct'],
    description: 'Modern financial hub with excellent shopping and cultural offerings.'
  },
  {
    iataCode: 'DUS',
    cityName: 'Düsseldorf',
    countryName: 'Germany',
    countryCode: 'DE',
    themeScores: {
      party: 65,     // Good nightlife and beer culture
      adventure: 30, // Rhine cycling, limited outdoor activities
      learn: 60,     // Some cultural attractions
      shopping: 90,  // Fashion and luxury shopping capital
      beach: 15      // Rhine river activities
    },
    highlights: ['Königsallee shopping', 'Japanese quarter', 'Art galleries', 'Rhine promenade', 'Fashion capital'],
    averageFlightTime: 1.5,
    priceRange: 'luxury',
    bestMonths: ['May', 'Jun', 'Jul', 'Aug', 'Sep'],
    description: 'Fashion and shopping capital with Japanese culture and Rhine River charm.'
  },
  {
    iataCode: 'CGN',
    cityName: 'Cologne',
    countryName: 'Germany',
    countryCode: 'DE',
    themeScores: {
      party: 80,     // Great beer culture and nightlife
      adventure: 25, // Limited outdoor activities
      learn: 85,     // Rich history and Gothic cathedral
      shopping: 70,  // Good shopping areas
      beach: 10      // No beaches
    },
    highlights: ['Cologne Cathedral', 'Beer halls (Brauhäuser)', 'Roman heritage', 'Christmas markets', 'Art museums'],
    averageFlightTime: 1.5,
    priceRange: 'mid-range',
    bestMonths: ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Dec'],
    description: 'Historic cathedral city with exceptional beer culture and 2000 years of history.'
  },
  {
    iataCode: 'ZAG',
    cityName: 'Zagreb',
    countryName: 'Croatia',
    countryCode: 'HR',
    themeScores: {
      party: 75,     // Great cafe and nightlife culture
      adventure: 45, // Some outdoor activities nearby
      learn: 80,     // Rich Austro-Hungarian heritage
      shopping: 55,  // Good local shopping
      beach: 20      // No beaches, but lakes nearby
    },
    highlights: ['Upper Town', 'Café culture', 'Museums', 'Christmas markets', 'Austro-Hungarian architecture'],
    averageFlightTime: 2,
    priceRange: 'budget',
    bestMonths: ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Dec'],
    description: 'Charming Central European capital with vibrant café culture and beautiful architecture.'
  },
  {
    iataCode: 'LJU',
    cityName: 'Ljubljana',
    countryName: 'Slovenia',
    countryCode: 'SI',
    themeScores: {
      party: 70,     // Great student nightlife scene
      adventure: 80, // Lake Bled, Julian Alps, outdoor paradise
      learn: 75,     // Beautiful architecture and culture
      shopping: 50,  // Basic shopping
      beach: 30      // Lakes but no ocean beaches
    },
    highlights: ['Lake Bled access', 'Julian Alps', 'Dragon Bridge', 'Castle', 'Green capital'],
    averageFlightTime: 2,
    priceRange: 'budget',
    bestMonths: ['May', 'Jun', 'Jul', 'Aug', 'Sep'],
    description: 'Green capital with easy access to Alpine adventures and Lake Bled.'
  },

  // More Eastern and Southern European destinations
  {
    iataCode: 'RIX',
    cityName: 'Riga',
    countryName: 'Latvia',
    countryCode: 'LV',
    themeScores: {
      party: 80,     // Great nightlife and affordable drinks
      adventure: 30, // Some outdoor activities in nearby forests
      learn: 80,     // Beautiful Art Nouveau and medieval architecture
      shopping: 45,  // Basic shopping scene
      beach: 25      // Baltic Sea access
    },
    highlights: ['Art Nouveau district', 'Medieval Old Town', 'Affordable nightlife', 'Russian culture', 'Baltic beaches'],
    averageFlightTime: 2.5,
    priceRange: 'budget',
    bestMonths: ['May', 'Jun', 'Jul', 'Aug', 'Sep'],
    description: 'Baltic gem with stunning Art Nouveau architecture and vibrant, affordable nightlife.'
  },
  {
    iataCode: 'TLL',
    cityName: 'Tallinn',
    countryName: 'Estonia',
    countryCode: 'EE',
    themeScores: {
      party: 75,     // Good nightlife and tech scene
      adventure: 35, // Some outdoor activities and islands
      learn: 85,     // UNESCO medieval old town
      shopping: 50,  // Decent shopping areas
      beach: 30      // Baltic Sea and islands
    },
    highlights: ['Medieval Old Town', 'Digital nomad hub', 'Tech culture', 'Baltic islands', 'Affordable prices'],
    averageFlightTime: 2.5,
    priceRange: 'budget',
    bestMonths: ['May', 'Jun', 'Jul', 'Aug', 'Sep'],
    description: 'Digital nomad paradise with perfectly preserved medieval charm and modern tech culture.'
  },
  {
    iataCode: 'VNO',
    cityName: 'Vilnius',
    countryName: 'Lithuania',
    countryCode: 'LT',
    themeScores: {
      party: 70,     // Growing nightlife scene
      adventure: 40, // Some outdoor activities in nearby nature
      learn: 85,     // Beautiful baroque architecture
      shopping: 45,  // Basic shopping
      beach: 20      // Limited coastal access
    },
    highlights: ['Baroque Old Town', 'Vilnius University', 'Trakai Castle access', 'Affordable culture', 'Hidden gem'],
    averageFlightTime: 2.5,
    priceRange: 'budget',
    bestMonths: ['May', 'Jun', 'Jul', 'Aug', 'Sep'],
    description: 'Baltic baroque beauty with rich history and emerging cultural scene.'
  },
  {
    iataCode: 'KRK',
    cityName: 'Kraków',
    countryName: 'Poland',
    countryCode: 'PL',
    themeScores: {
      party: 85,     // Famous student nightlife and cheap drinks
      adventure: 35, // Tatra Mountains access
      learn: 95,     // Incredible medieval architecture and history
      shopping: 50,  // Good local shopping
      beach: 10      // No beaches
    },
    highlights: ['Wawel Castle', 'Main Market Square', 'Jewish Quarter (Kazimierz)', 'Salt mines', 'Student nightlife'],
    averageFlightTime: 2,
    priceRange: 'budget',
    bestMonths: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
    description: 'Poland\'s cultural capital with stunning medieval architecture and legendary student nightlife.'
  },
  {
    iataCode: 'GDN',
    cityName: 'Gdansk',
    countryName: 'Poland',
    countryCode: 'PL',
    themeScores: {
      party: 70,     // Good nightlife scene
      adventure: 40, // Baltic Sea activities
      learn: 90,     // Rich maritime and WWII history
      shopping: 45,  // Basic shopping
      beach: 50      // Baltic Sea beaches
    },
    highlights: ['Old Town', 'Maritime heritage', 'WWII history', 'Baltic beaches', 'Amber shopping'],
    averageFlightTime: 2,
    priceRange: 'budget',
    bestMonths: ['May', 'Jun', 'Jul', 'Aug', 'Sep'],
    description: 'Historic Hanseatic port city with maritime heritage and Baltic Sea charm.'
  },
  {
    iataCode: 'BTS',
    cityName: 'Bratislava',
    countryName: 'Slovakia',
    countryCode: 'SK',
    themeScores: {
      party: 75,     // Great nightlife and affordable drinks
      adventure: 45, // Danube activities and nearby mountains
      learn: 80,     // Beautiful castle and historic center
      shopping: 50,  // Decent shopping
      beach: 15      // Danube river activities
    },
    highlights: ['Bratislava Castle', 'Danube River', 'Old Town', 'Wine culture', 'Affordable destination'],
    averageFlightTime: 2,
    priceRange: 'budget',
    bestMonths: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
    description: 'Charming Danube capital with castle views and excellent value for money.'
  },
  {
    iataCode: 'BEG',
    cityName: 'Belgrade',
    countryName: 'Serbia',
    countryCode: 'RS',
    themeScores: {
      party: 90,     // Famous for incredible nightlife scene
      adventure: 40, // Danube and Sava river activities
      learn: 75,     // Rich history and cultural sites
      shopping: 40,  // Basic shopping
      beach: 20      // River beaches and activities
    },
    highlights: ['Epic nightlife', 'Floating river bars', 'Kalemegdan Fortress', 'Bohemian Quarter', 'Balkan culture'],
    averageFlightTime: 2.5,
    priceRange: 'budget',
    bestMonths: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
    description: 'Balkan party capital with legendary nightlife and unique floating river clubs.'
  },
  {
    iataCode: 'SOF',
    cityName: 'Sofia',
    countryName: 'Bulgaria',
    countryCode: 'BG',
    themeScores: {
      party: 75,     // Growing nightlife and cheap drinks
      adventure: 65, // Vitosha Mountain access, skiing
      learn: 80,     // Orthodox churches and Roman ruins
      shopping: 40,  // Basic shopping
      beach: 15      // No beaches but mountain activities
    },
    highlights: ['Alexander Nevsky Cathedral', 'Vitosha Mountain', 'Roman ruins', 'Orthodox culture', 'Affordable prices'],
    averageFlightTime: 2.5,
    priceRange: 'budget',
    bestMonths: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
    description: 'Balkan hidden gem with mountain access and rich Orthodox heritage.'
  },
  {
    iataCode: 'OTP',
    cityName: 'Bucharest',
    countryName: 'Romania',
    countryCode: 'RO',
    themeScores: {
      party: 80,     // Great nightlife and club scene
      adventure: 40, // Some outdoor activities in nearby Carpathians
      learn: 75,     // Interesting mix of architecture and history
      shopping: 55,  // Decent shopping areas
      beach: 10      // No beaches
    },
    highlights: ['Old Town nightlife', 'Palace of Parliament', 'Carpathian Mountains access', 'Romanian culture', 'Affordable luxury'],
    averageFlightTime: 2.5,
    priceRange: 'budget',
    bestMonths: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
    description: 'Eastern European party destination with grand architecture and Carpathian access.'
  },

  // Mediterranean and Southern European cities
  {
    iataCode: 'VAL',
    cityName: 'Valencia',
    countryName: 'Spain',
    countryCode: 'ES',
    themeScores: {
      party: 80,     // Great nightlife and festival scene
      adventure: 45, // Cycling, water sports
      learn: 70,     // Architecture and cultural sites
      shopping: 60,  // Good shopping areas
      beach: 85      // Excellent city beaches
    },
    highlights: ['City of Arts and Sciences', 'Las Fallas festival', 'Paella origin', 'City beaches', 'Bike-friendly'],
    averageFlightTime: 2,
    priceRange: 'mid-range',
    bestMonths: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
    description: 'Modern Spanish city with futuristic architecture, great beaches, and vibrant festivals.'
  },
  {
    iataCode: 'BIO',
    cityName: 'Bilbao',
    countryName: 'Spain',
    countryCode: 'ES',
    themeScores: {
      party: 75,     // Great pintxos and nightlife culture
      adventure: 60, // Basque mountains and coast access
      learn: 85,     // Guggenheim Museum and Basque culture
      shopping: 65,  // Good shopping areas
      beach: 50      // Coastal access
    },
    highlights: ['Guggenheim Museum', 'Pintxos culture', 'Basque heritage', 'Modern architecture', 'Mountain access'],
    averageFlightTime: 2,
    priceRange: 'mid-range',
    bestMonths: ['May', 'Jun', 'Jul', 'Aug', 'Sep'],
    description: 'Basque cultural capital with world-renowned museum and unique culinary traditions.'
  },
  {
    iataCode: 'OPO',
    cityName: 'Porto',
    countryName: 'Portugal',
    countryCode: 'PT',
    themeScores: {
      party: 75,     // Great wine and nightlife scene
      adventure: 45, // Douro Valley and coastal activities
      learn: 85,     // UNESCO historic center and cultural heritage
      shopping: 55,  // Good local shopping and crafts
      beach: 60      // Atlantic beaches nearby
    },
    highlights: ['Port wine cellars', 'Ribeira district', 'Azulejo tiles', 'Douro Valley', 'Historic trams'],
    averageFlightTime: 2.5,
    priceRange: 'mid-range',
    bestMonths: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
    description: 'Charming Portuguese city famous for port wine and stunning riverside architecture.'
  },
  {
    iataCode: 'FAO',
    cityName: 'Faro',
    countryName: 'Portugal',
    countryCode: 'PT',
    themeScores: {
      party: 70,     // Good beach party scene
      adventure: 55, // Water sports and coastal activities
      learn: 50,     // Some historical sites
      shopping: 45,  // Basic shopping
      beach: 95      // Algarve beaches - some of Europe's best
    },
    highlights: ['Algarve beaches', 'Ria Formosa Natural Park', 'Coastal cliffs', 'Water sports', 'Beach resorts'],
    averageFlightTime: 2.5,
    priceRange: 'mid-range',
    bestMonths: ['May', 'Jun', 'Jul', 'Aug', 'Sep'],
    description: 'Gateway to the Algarve with stunning beaches and coastal natural beauty.'
  },
  {
    iataCode: 'MLT',
    cityName: 'Malta',
    countryName: 'Malta',
    countryCode: 'MT',
    themeScores: {
      party: 85,     // Famous party destination, especially Paceville
      adventure: 65, // Diving, water sports, rock climbing
      learn: 80,     // Rich history from Knights of Malta
      shopping: 50,  // Basic shopping
      beach: 90      // Crystal clear Mediterranean waters
    },
    highlights: ['Paceville nightlife', 'Blue Lagoon', 'Valletta UNESCO site', 'Diving spots', 'Mediterranean culture'],
    averageFlightTime: 3,
    priceRange: 'mid-range',
    bestMonths: ['May', 'Jun', 'Jul', 'Aug', 'Sep'],
    description: 'Mediterranean party island with crystal waters and rich historical heritage.'
  },
  {
    iataCode: 'LCA',
    cityName: 'Larnaca',
    countryName: 'Cyprus',
    countryCode: 'CY',
    themeScores: {
      party: 70,     // Good beach party and nightlife scene
      adventure: 60, // Water sports, diving, hiking
      learn: 65,     // Ancient history and archaeological sites
      shopping: 45,  // Basic shopping
      beach: 90      // Beautiful Mediterranean beaches
    },
    highlights: ['Finikoudes Beach', 'Ancient Kition', 'Salt Lake', 'Diving sites', 'Mediterranean cuisine'],
    averageFlightTime: 4,
    priceRange: 'mid-range',
    bestMonths: ['Apr', 'May', 'Jun', 'Sep', 'Oct'],
    description: 'Cyprus beach destination with ancient history and excellent Mediterranean climate.'
  },

  // More unique destinations
  {
    iataCode: 'REK',
    cityName: 'Reykjavik',
    countryName: 'Iceland',
    countryCode: 'IS',
    themeScores: {
      party: 60,     // Surprising nightlife scene
      adventure: 95, // Ultimate adventure destination
      learn: 75,     // Viking heritage and unique culture
      shopping: 40,  // Limited but unique
      beach: 20      // Geothermal beaches, not traditional
    },
    highlights: ['Northern Lights', 'Blue Lagoon', 'Glacier tours', 'Volcano hiking', 'Midnight sun'],
    averageFlightTime: 3,
    priceRange: 'luxury',
    bestMonths: ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    description: 'Ultimate adventure destination with otherworldly natural phenomena.'
  },
  {
    iataCode: 'FAE',
    cityName: 'Tórshavn',
    countryName: 'Faroe Islands',
    countryCode: 'FO',
    themeScores: {
      party: 35,     // Limited nightlife
      adventure: 90, // Incredible hiking and nature
      learn: 60,     // Nordic culture and traditions
      shopping: 25,  // Very limited
      beach: 40      // Dramatic coastlines, not traditional beaches
    },
    highlights: ['Dramatic landscapes', 'Hiking trails', 'Nordic culture', 'Grass-roof houses', 'Unspoiled nature'],
    averageFlightTime: 2.5,
    priceRange: 'luxury',
    bestMonths: ['May', 'Jun', 'Jul', 'Aug', 'Sep'],
    description: 'Remote Nordic paradise with dramatic landscapes and incredible hiking opportunities.'
  },

  // International destinations beyond Europe (strategic selection)
  {
    iataCode: 'LAS',
    cityName: 'Las Vegas',
    countryName: 'United States',
    countryCode: 'US',
    themeScores: {
      party: 98,     // Ultimate party destination
      adventure: 45, // Desert activities, Grand Canyon access
      learn: 35,     // Limited cultural offerings
      shopping: 85,  // Excellent shopping
      beach: 5       // No beaches
    },
    highlights: ['World-class nightlife', 'Casino culture', 'Shows and entertainment', 'Desert adventures', 'Luxury shopping'],
    averageFlightTime: 11,
    priceRange: 'mid-range',
    bestMonths: ['Mar', 'Apr', 'May', 'Oct', 'Nov', 'Dec'],
    description: 'Entertainment capital of the world with legendary nightlife and casino culture.'
  },
  {
    iataCode: 'MIA',
    cityName: 'Miami',
    countryName: 'United States',
    countryCode: 'US',
    themeScores: {
      party: 90,     // South Beach party scene
      adventure: 50, // Water sports and Everglades
      learn: 45,     // Art Deco and cultural diversity
      shopping: 80,  // Great shopping districts
      beach: 95      // World-famous beaches
    },
    highlights: ['South Beach', 'Art Deco architecture', 'Latin nightlife', 'Water sports', 'Fashion scene'],
    averageFlightTime: 9,
    priceRange: 'luxury',
    bestMonths: ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'],
    description: 'Tropical party paradise with stunning beaches and vibrant Latin culture.'
  },
  {
    iataCode: 'NYC',
    cityName: 'New York',
    countryName: 'United States',
    countryCode: 'US',
    themeScores: {
      party: 85,     // Diverse nightlife scene
      adventure: 25, // Limited outdoor activities
      learn: 98,     // World-class museums and culture
      shopping: 95,  // Shopping capital
      beach: 10      // No beaches
    },
    highlights: ['Broadway shows', 'Museums', 'Times Square', 'Central Park', 'Shopping districts'],
    averageFlightTime: 8,
    priceRange: 'luxury',
    bestMonths: ['Apr', 'May', 'Jun', 'Sep', 'Oct', 'Nov'],
    description: 'The city that never sleeps with unparalleled culture and shopping.'
  },
  {
    iataCode: 'TYO',
    cityName: 'Tokyo',
    countryName: 'Japan',
    countryCode: 'JP',
    themeScores: {
      party: 80,     // Unique nightlife districts
      adventure: 40, // Some outdoor activities
      learn: 90,     // Rich culture and technology
      shopping: 95,  // Shopping paradise
      beach: 15      // Limited coastal access
    },
    highlights: ['Shibuya crossing', 'Tech culture', 'Traditional temples', 'Anime culture', 'Unique shopping'],
    averageFlightTime: 11,
    priceRange: 'luxury',
    bestMonths: ['Mar', 'Apr', 'May', 'Sep', 'Oct', 'Nov'],
    description: 'Futuristic metropolis blending ancient traditions with cutting-edge technology.'
  },
  {
    iataCode: 'DXB',
    cityName: 'Dubai',
    countryName: 'United Arab Emirates',
    countryCode: 'AE',
    themeScores: {
      party: 70,     // Luxury nightlife scene
      adventure: 60, // Desert activities, water sports
      learn: 50,     // Modern architecture and culture
      shopping: 98,  // Ultimate shopping destination
      beach: 85      // Luxury beach resorts
    },
    highlights: ['Burj Khalifa', 'Luxury malls', 'Desert safaris', 'Beach resorts', 'Tax-free shopping'],
    averageFlightTime: 6,
    priceRange: 'luxury',
    bestMonths: ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'],
    description: 'Luxury shopping and resort destination with modern marvels and desert adventures.'
  },
  {
    iataCode: 'BKK',
    cityName: 'Bangkok',
    countryName: 'Thailand',
    countryCode: 'TH',
    themeScores: {
      party: 85,     // Famous nightlife and street life
      adventure: 65, // Jungle tours, water activities
      learn: 80,     // Rich Buddhist culture and temples
      shopping: 80,  // Excellent shopping and markets
      beach: 30      // River activities, beach access nearby
    },
    highlights: ['Street food', 'Buddhist temples', 'Floating markets', 'Rooftop bars', 'Thai massage'],
    averageFlightTime: 11,
    priceRange: 'budget',
    bestMonths: ['Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
    description: 'Vibrant Asian capital with incredible street life, temples, and affordable luxury.'
  },
  {
    iataCode: 'SIN',
    cityName: 'Singapore',
    countryName: 'Singapore',
    countryCode: 'SG',
    themeScores: {
      party: 70,     // Good nightlife and rooftop bars
      adventure: 35, // Limited outdoor activities
      learn: 75,     // Cultural diversity and modern architecture
      shopping: 90,  // Shopping paradise
      beach: 40      // Resort islands nearby
    },
    highlights: ['Marina Bay Sands', 'Gardens by the Bay', 'Hawker centers', 'Shopping districts', 'Clean and safe'],
    averageFlightTime: 12,
    priceRange: 'luxury',
    bestMonths: ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    description: 'Modern city-state with incredible architecture, shopping, and multicultural cuisine.'
  },
  {
    iataCode: 'MEX',
    cityName: 'Mexico City',
    countryName: 'Mexico',
    countryCode: 'MX',
    themeScores: {
      party: 85,     // Vibrant nightlife and fiesta culture
      adventure: 55, // Volcano hiking, day trips to pyramids
      learn: 90,     // Rich Aztec and colonial history
      shopping: 60,  // Good local shopping and crafts
      beach: 15      // No beaches
    },
    highlights: ['Aztec history', 'Day of the Dead culture', 'Street art', 'Mezcal bars', 'Colonial architecture'],
    averageFlightTime: 12,
    priceRange: 'budget',
    bestMonths: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
    description: 'Cultural powerhouse with ancient history, vibrant arts scene, and legendary nightlife.'
  },
  {
    iataCode: 'RIO',
    cityName: 'Rio de Janeiro',
    countryName: 'Brazil',
    countryCode: 'BR',
    themeScores: {
      party: 95,     // Carnival and beach party capital
      adventure: 70, // Christ the Redeemer, hiking, water sports
      learn: 60,     // Brazilian culture and history
      shopping: 50,  // Basic shopping
      beach: 98      // World-famous beaches
    },
    highlights: ['Carnival', 'Copacabana beach', 'Christ the Redeemer', 'Samba culture', 'Sugarloaf Mountain'],
    averageFlightTime: 11,
    priceRange: 'mid-range',
    bestMonths: ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'],
    description: 'Ultimate beach party destination with Carnival culture and stunning natural beauty.'
  },
  {
    iataCode: 'CAI',
    cityName: 'Cairo',
    countryName: 'Egypt',
    countryCode: 'EG',
    themeScores: {
      party: 40,     // Limited nightlife
      adventure: 60, // Desert tours, Nile activities
      learn: 98,     // Ultimate historical destination
      shopping: 60,  // Good markets and bazaars
      beach: 20      // Red Sea access
    },
    highlights: ['Pyramids of Giza', 'Egyptian Museum', 'Nile River', 'Islamic architecture', 'Ancient history'],
    averageFlightTime: 4.5,
    priceRange: 'budget',
    bestMonths: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
    description: 'Gateway to ancient world with pyramids, pharaohs, and 5000 years of history.'
  },

  // === ADDITIONAL EUROPEAN CITIES (71-100) ===

  // 🇮🇹 Florence, Italy - Renaissance & Art Capital
  {
    iataCode: 'FLR',
    cityName: 'Florence',
    countryName: 'Italy',
    countryCode: 'IT',
    themeScores: {
      party: 45,     // Moderate nightlife, wine bars
      adventure: 35, // Limited outdoor activities
      learn: 98,     // World-class art, Renaissance history
      shopping: 80,  // Artisan goods, luxury leather
      beach: 20      // Not coastal
    },
    highlights: ['Uffizi Gallery', 'Renaissance architecture', 'Artisan workshops', 'Wine culture', 'Historic center'],
    averageFlightTime: 2.5,
    priceRange: 'mid-range',
    bestMonths: ['Apr', 'May', 'Jun', 'Sep', 'Oct'],
    description: 'Renaissance capital with unparalleled art treasures and Tuscan culture.'
  },

  // 🇮🇹 Venice, Italy - Romantic Canals
  {
    iataCode: 'VCE',
    cityName: 'Venice',
    countryName: 'Italy',
    countryCode: 'IT',
    themeScores: {
      party: 40,     // Limited nightlife due to tourism focus
      adventure: 30, // Minimal outdoor activities
      learn: 92,     // Rich history, unique architecture
      shopping: 75,  // Venetian glass, luxury goods
      beach: 45      // Nearby Lido beaches
    },
    highlights: ['Gondola rides', "St. Mark's Square", 'Venetian glass', 'Historic palaces', 'Romantic atmosphere'],
    averageFlightTime: 2.5,
    priceRange: 'luxury',
    bestMonths: ['Apr', 'May', 'Jun', 'Sep', 'Oct'],
    description: 'Unique canal city offering unmatched romance and artistic heritage.'
  },

  // 🇮🇹 Naples, Italy - Authentic Italy & Pizza
  {
    iataCode: 'NAP',
    cityName: 'Naples',
    countryName: 'Italy',
    countryCode: 'IT',
    themeScores: {
      party: 70,     // Vibrant local nightlife, music scene
      adventure: 55, // Vesuvius, coastal access
      learn: 80,     // Ancient history, archaeology
      shopping: 60,  // Local markets, crafts
      beach: 70      // Amalfi Coast nearby
    },
    highlights: ['Pizza birthplace', 'Mount Vesuvius', 'Pompeii access', 'Amalfi Coast', 'Authentic culture'],
    averageFlightTime: 3,
    priceRange: 'budget',
    bestMonths: ['Apr', 'May', 'Jun', 'Sep', 'Oct'],
    description: 'Authentic Italian experience with incredible food, history, and coastal access.'
  },

  // 🇫🇷 Lyon, France - Culinary Capital
  {
    iataCode: 'LYS',
    cityName: 'Lyon',
    countryName: 'France',
    countryCode: 'FR',
    themeScores: {
      party: 65,     // Good nightlife, wine culture
      adventure: 45, // Some outdoor activities nearby
      learn: 75,     // History, architecture, museums
      shopping: 70,  // Fashion, French goods
      beach: 20      // Inland city
    },
    highlights: ['Michelin restaurants', 'Wine regions', 'Old Town UNESCO site', 'Silk heritage', 'French cuisine'],
    averageFlightTime: 2,
    priceRange: 'mid-range',
    bestMonths: ['Apr', 'May', 'Jun', 'Sep', 'Oct'],
    description: 'France\'s culinary capital with exceptional dining and rich cultural heritage.'
  },

  // 🇫🇷 Nice, France - French Riviera
  {
    iataCode: 'NCE',
    cityName: 'Nice',
    countryName: 'France',
    countryCode: 'FR',
    themeScores: {
      party: 75,     // Riviera nightlife, casinos nearby
      adventure: 50, // Hiking, water sports
      learn: 60,     // Art museums, culture
      shopping: 80,  // Luxury boutiques, French fashion
      beach: 95      // Premium Mediterranean beaches
    },
    highlights: ['Promenade des Anglais', 'French Riviera', 'Beach clubs', 'Art museums', 'Monte Carlo access'],
    averageFlightTime: 2.5,
    priceRange: 'luxury',
    bestMonths: ['May', 'Jun', 'Jul', 'Aug', 'Sep'],
    description: 'Glamorous French Riviera destination with pristine beaches and luxury lifestyle.'
  },

  // 🇫🇷 Bordeaux, France - Wine Capital
  {
    iataCode: 'BOD',
    cityName: 'Bordeaux',
    countryName: 'France',
    countryCode: 'FR',
    themeScores: {
      party: 70,     // Wine culture, sophisticated nightlife
      adventure: 40, // Limited outdoor activities
      learn: 75,     // Wine education, history
      shopping: 65,  // Wine, French goods
      beach: 30      // Atlantic coast access but not primary
    },
    highlights: ['World wine capital', 'UNESCO historic center', 'Wine tours', 'French architecture', 'Gourmet dining'],
    averageFlightTime: 2,
    priceRange: 'mid-range',
    bestMonths: ['Apr', 'May', 'Jun', 'Sep', 'Oct'],
    description: 'World-renowned wine capital with elegant architecture and sophisticated culture.'
  },

  // 🇩🇪 Hamburg, Germany - Maritime Culture
  {
    iataCode: 'HAM',
    cityName: 'Hamburg',
    countryName: 'Germany',
    countryCode: 'DE',
    themeScores: {
      party: 88,     // Famous nightlife district, Reeperbahn
      adventure: 45, // Harbor activities, cycling
      learn: 70,     // Maritime history, museums
      shopping: 60,  // Good shopping areas
      beach: 40      // Harbor/river, not traditional beach
    },
    highlights: ['Reeperbahn nightlife', 'Harbor district', 'Maritime culture', 'Red light district', 'Music venues'],
    averageFlightTime: 1.5,
    priceRange: 'mid-range',
    bestMonths: ['May', 'Jun', 'Jul', 'Aug', 'Sep'],
    description: 'Maritime city famous for its vibrant nightlife and port culture.'
  },

  // 🇩🇪 Cologne, Germany - Cathedral & Culture
  {
    iataCode: 'CGN',
    cityName: 'Cologne',
    countryName: 'Germany',
    countryCode: 'DE',
    themeScores: {
      party: 75,     // Good nightlife, beer culture
      adventure: 40, // Limited outdoor activities
      learn: 85,     // Gothic cathedral, museums, history
      shopping: 70,  // Shopping streets, markets
      beach: 25      // River city, not coastal
    },
    highlights: ['Gothic Cathedral', 'Art museums', 'Brewery tours', 'Rhine River', 'German culture'],
    averageFlightTime: 1.5,
    priceRange: 'mid-range',
    bestMonths: ['Apr', 'May', 'Jun', 'Sep', 'Oct'],
    description: 'Historic German city dominated by its magnificent Gothic cathedral.'
  },

  // 🇩🇪 Dresden, Germany - Baroque Beauty
  {
    iataCode: 'DRS',
    cityName: 'Dresden',
    countryName: 'Germany',
    countryCode: 'DE',
    themeScores: {
      party: 55,     // Moderate nightlife scene
      adventure: 50, // Elbe cycling, nearby nature
      learn: 90,     // Baroque architecture, art collections
      shopping: 60,  // Historic markets, crafts
      beach: 25      // River city
    },
    highlights: ['Baroque architecture', 'Frauenkirche', 'Art collections', 'Historic rebuilding', 'Elbe Valley'],
    averageFlightTime: 2,
    priceRange: 'mid-range',
    bestMonths: ['Apr', 'May', 'Jun', 'Sep', 'Oct'],
    description: 'Beautifully reconstructed baroque city showcasing German architectural heritage.'
  },

  // 🇬🇧 Edinburgh, Scotland - Historic Capital
  {
    iataCode: 'EDI',
    cityName: 'Edinburgh',
    countryName: 'United Kingdom',
    countryCode: 'GB',
    themeScores: {
      party: 80,     // Pub culture, festival nightlife
      adventure: 70, // Highland access, hiking, castles
      learn: 92,     // Rich history, festivals, culture
      shopping: 65,  // Royal Mile, Scottish goods
      beach: 30      // Not coastal focus
    },
    highlights: ['Edinburgh Castle', 'Royal Mile', 'Festival scene', 'Highland access', 'Whisky culture'],
    averageFlightTime: 2,
    priceRange: 'mid-range',
    bestMonths: ['May', 'Jun', 'Jul', 'Aug', 'Sep'],
    description: 'Historic Scottish capital famous for its castle, festivals, and Highland gateway.'
  },

  // 🇬🇧 Manchester, England - Music & Football
  {
    iataCode: 'MAN',
    cityName: 'Manchester',
    countryName: 'United Kingdom',
    countryCode: 'GB',
    themeScores: {
      party: 85,     // Famous music scene, nightlife
      adventure: 50, // Peak District access
      learn: 70,     // Industrial heritage, music history
      shopping: 75,  // Northern Quarter, shopping centers
      beach: 25      // Inland city
    },
    highlights: ['Music scene legacy', 'Football culture', 'Industrial heritage', 'Northern Quarter', 'Peak District access'],
    averageFlightTime: 1.5,
    priceRange: 'mid-range',
    bestMonths: ['May', 'Jun', 'Jul', 'Aug', 'Sep'],
    description: 'Dynamic city renowned for its musical heritage and football culture.'
  },

  // 🇬🇧 Glasgow, Scotland - Culture & Music
  {
    iataCode: 'GLA',
    cityName: 'Glasgow',
    countryName: 'United Kingdom',
    countryCode: 'GB',
    themeScores: {
      party: 82,     // Vibrant nightlife, music venues
      adventure: 65, // Scottish Highlands access
      learn: 80,     // Victorian architecture, museums
      shopping: 68,  // Style Mile, Scottish products
      beach: 35      // West coast access
    },
    highlights: ['Music venues', 'Victorian architecture', 'Arts scene', 'Highland gateway', 'Friendly culture'],
    averageFlightTime: 1.5,
    priceRange: 'budget',
    bestMonths: ['May', 'Jun', 'Jul', 'Aug', 'Sep'],
    description: 'Scotland\'s cultural capital with incredible music scene and Victorian grandeur.'
  },

  // 🇳🇱 Rotterdam, Netherlands - Modern Architecture
  {
    iataCode: 'RTM',
    cityName: 'Rotterdam',
    countryName: 'Netherlands',
    countryCode: 'NL',
    themeScores: {
      party: 75,     // Good nightlife, harbor culture
      adventure: 60, // Cycling, water activities
      learn: 70,     // Modern architecture, design
      shopping: 65,  // Modern shopping areas
      beach: 50      // North Sea coast nearby
    },
    highlights: ['Modern architecture', 'Harbor culture', 'Cycling city', 'Design museums', 'Multicultural dining'],
    averageFlightTime: 1.5,
    priceRange: 'mid-range',
    bestMonths: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
    description: 'Modern Dutch city showcasing innovative architecture and urban design.'
  },

  // 🇧🇪 Ghent, Belgium - Medieval Gem
  {
    iataCode: 'GNE',
    cityName: 'Ghent',
    countryName: 'Belgium',
    countryCode: 'BE',
    themeScores: {
      party: 70,     // University town nightlife, beer culture
      adventure: 45, // Cycling, canal tours
      learn: 85,     // Medieval architecture, art
      shopping: 60,  // Belgian goods, local crafts
      beach: 35      // Not coastal
    },
    highlights: ['Medieval architecture', 'Canal tours', 'Belgian beer', 'University atmosphere', 'Gothic cathedral'],
    averageFlightTime: 1.5,
    priceRange: 'budget',
    bestMonths: ['Apr', 'May', 'Jun', 'Sep', 'Oct'],
    description: 'Perfectly preserved medieval city with vibrant student culture and beer tradition.'
  },

  // 🇨🇭 Basel, Switzerland - Art & Culture
  {
    iataCode: 'BSL',
    cityName: 'Basel',
    countryName: 'Switzerland',
    countryCode: 'CH',
    themeScores: {
      party: 60,     // Moderate nightlife, cultural events
      adventure: 65, // Rhine activities, Black Forest access
      learn: 88,     // World-class art museums
      shopping: 75,  // Swiss goods, luxury items
      beach: 30      // River activities only
    },
    highlights: ['Art museums', 'Rhine River', 'Swiss culture', 'Architecture', 'Cultural festivals'],
    averageFlightTime: 1.5,
    priceRange: 'luxury',
    bestMonths: ['Apr', 'May', 'Jun', 'Sep', 'Oct'],
    description: 'Swiss cultural capital with world-renowned art museums and Rhine charm.'
  },

  // 🇦🇹 Salzburg, Austria - Mozart City
  {
    iataCode: 'SZG',
    cityName: 'Salzburg',
    countryName: 'Austria',
    countryCode: 'AT',
    themeScores: {
      party: 55,     // Classical music events, moderate nightlife
      adventure: 75, // Alpine access, hiking, skiing
      learn: 92,     // Mozart heritage, baroque architecture
      shopping: 65,  // Austrian goods, traditional crafts
      beach: 25      // Alpine lakes nearby
    },
    highlights: ['Mozart birthplace', 'Baroque old town', 'Alpine setting', 'Classical music', 'Sound of Music'],
    averageFlightTime: 2,
    priceRange: 'mid-range',
    bestMonths: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
    description: 'Mozart\'s birthplace set in stunning alpine scenery with baroque architecture.'
  },

  // 🇦🇹 Innsbruck, Austria - Alpine Adventure
  {
    iataCode: 'INN',
    cityName: 'Innsbruck',
    countryName: 'Austria',
    countryCode: 'AT',
    themeScores: {
      party: 65,     // Apres-ski, mountain culture
      adventure: 95, // World-class skiing, mountaineering
      learn: 70,     // Olympic history, Austrian culture
      shopping: 60,  // Outdoor gear, Austrian products
      beach: 30      // Mountain lakes
    },
    highlights: ['Alpine skiing', 'Olympic heritage', 'Mountain adventures', 'Cable cars', 'Austrian Alps'],
    averageFlightTime: 2,
    priceRange: 'mid-range',
    bestMonths: ['Jun', 'Jul', 'Aug', 'Dec', 'Jan', 'Feb'],
    description: 'Alpine paradise perfect for skiing and mountain adventures.'
  },

  // 🇩🇰 Aarhus, Denmark - Design & Culture
  {
    iataCode: 'AAR',
    cityName: 'Aarhus',
    countryName: 'Denmark',
    countryCode: 'DK',
    themeScores: {
      party: 75,     // University nightlife, cultural scene
      adventure: 55, // Cycling, coastal activities
      learn: 80,     // Design museums, Viking history
      shopping: 70,  // Danish design, local goods
      beach: 60      // Danish coast
    },
    highlights: ['Danish design', 'ARoS art museum', 'University culture', 'Viking heritage', 'Coastal charm'],
    averageFlightTime: 2,
    priceRange: 'mid-range',
    bestMonths: ['May', 'Jun', 'Jul', 'Aug', 'Sep'],
    description: 'Denmark\'s cultural capital showcasing design innovation and Viking heritage.'
  },

  // 🇸🇪 Gothenburg, Sweden - West Coast Culture
  {
    iataCode: 'GOT',
    cityName: 'Gothenburg',
    countryName: 'Sweden',
    countryCode: 'SE',
    themeScores: {
      party: 70,     // Music scene, craft beer culture
      adventure: 65, // Archipelago, outdoor activities
      learn: 75,     // Maritime history, design
      shopping: 65,  // Scandinavian design
      beach: 55      // West coast archipelago
    },
    highlights: ['Archipelago islands', 'Music festivals', 'Maritime culture', 'Scandinavian design', 'Craft beer scene'],
    averageFlightTime: 2.5,
    priceRange: 'mid-range',
    bestMonths: ['May', 'Jun', 'Jul', 'Aug', 'Sep'],
    description: 'Sweden\'s west coast cultural hub with beautiful archipelago access.'
  },

  // 🇳🇴 Bergen, Norway - Gateway to Fjords
  {
    iataCode: 'BGO',
    cityName: 'Bergen',
    countryName: 'Norway',
    countryCode: 'NO',
    themeScores: {
      party: 60,     // Cozy pub culture, limited nightlife
      adventure: 92, // Fjord access, hiking, dramatic nature
      learn: 75,     // Hanseatic history, maritime culture
      shopping: 55,  // Norwegian goods, outdoor gear
      beach: 40      // Fjord coastline, not beach focused
    },
    highlights: ['Fjord gateway', 'Bryggen wharf', 'Dramatic landscapes', 'Hiking trails', 'Norse heritage'],
    averageFlightTime: 2.5,
    priceRange: 'luxury',
    bestMonths: ['May', 'Jun', 'Jul', 'Aug', 'Sep'],
    description: 'Gateway to Norway\'s spectacular fjords with stunning natural beauty.'
  },

  // 🇫🇮 Turku, Finland - Historic Capital
  {
    iataCode: 'TKU',
    cityName: 'Turku',
    countryName: 'Finland',
    countryCode: 'FI',
    themeScores: {
      party: 65,     // University town, moderate nightlife
      adventure: 70, // Finnish nature, archipelago
      learn: 80,     // Finnish history, medieval castle
      shopping: 55,  // Finnish design, local goods
      beach: 50      // Baltic archipelago
    },
    highlights: ['Medieval castle', 'Finnish archipelago', 'University culture', 'Nordic history', 'River culture'],
    averageFlightTime: 3,
    priceRange: 'mid-range',
    bestMonths: ['May', 'Jun', 'Jul', 'Aug', 'Sep'],
    description: 'Finland\'s historic capital with medieval charm and archipelago beauty.'
  },

  // 🇵🇹 Coimbra, Portugal - University Town
  {
    iataCode: 'CBP',
    cityName: 'Coimbra',
    countryName: 'Portugal',
    countryCode: 'PT',
    themeScores: {
      party: 78,     // Famous student nightlife, Fado music
      adventure: 55, // River activities, nearby nature
      learn: 88,     // Historic university, libraries
      shopping: 60,  // Portuguese crafts, books
      beach: 45      // Atlantic coast accessible
    },
    highlights: ['Historic university', 'Student nightlife', 'Fado music', 'Joanina Library', 'Academic tradition'],
    averageFlightTime: 2.5,
    priceRange: 'budget',
    bestMonths: ['Apr', 'May', 'Jun', 'Sep', 'Oct'],
    description: 'Historic university town with vibrant student culture and academic heritage.'
  },

  // 🇪🇸 Bilbao, Spain - Basque Culture
  {
    iataCode: 'BIO',
    cityName: 'Bilbao',
    countryName: 'Spain',
    countryCode: 'ES',
    themeScores: {
      party: 72,     // Pintxos bars, Basque nightlife
      adventure: 60, // Coastal activities, hiking nearby
      learn: 82,     // Guggenheim, Basque culture
      shopping: 65,  // Basque crafts, modern shopping
      beach: 55      // Basque coast nearby
    },
    highlights: ['Guggenheim Museum', 'Pintxos culture', 'Basque heritage', 'Industrial renewal', 'Modern architecture'],
    averageFlightTime: 2,
    priceRange: 'mid-range',
    bestMonths: ['Apr', 'May', 'Jun', 'Sep', 'Oct'],
    description: 'Transformed industrial city showcasing Basque culture and world-class art.'
  },

  // 🇪🇸 Granada, Spain - Moorish Heritage
  {
    iataCode: 'GRX',
    cityName: 'Granada',
    countryName: 'Spain',
    countryCode: 'ES',
    themeScores: {
      party: 75,     // Flamenco, tapas culture, student life
      adventure: 65, // Sierra Nevada skiing, hiking
      learn: 95,     // Alhambra, Moorish history
      shopping: 60,  // Moorish crafts, souvenirs
      beach: 40      // Coast accessible but not primary
    },
    highlights: ['Alhambra palace', 'Moorish architecture', 'Flamenco culture', 'Free tapas tradition', 'Sierra Nevada'],
    averageFlightTime: 2.5,
    priceRange: 'budget',
    bestMonths: ['Apr', 'May', 'Jun', 'Sep', 'Oct'],
    description: 'Magnificent Moorish heritage with the stunning Alhambra palace complex.'
  },

  // 🇪🇸 San Sebastian, Spain - Culinary Paradise
  {
    iataCode: 'EAS',
    cityName: 'San Sebastian',
    countryName: 'Spain',
    countryCode: 'ES',
    themeScores: {
      party: 78,     // Pintxos bars, beach nightlife
      adventure: 55, // Surfing, coastal walks
      learn: 70,     // Basque culture, culinary arts
      shopping: 65,  // Basque specialties
      beach: 88      // Beautiful city beach
    },
    highlights: ['Michelin restaurants', 'Pintxos bars', 'La Concha beach', 'Basque cuisine', 'Film festival'],
    averageFlightTime: 2,
    priceRange: 'luxury',
    bestMonths: ['May', 'Jun', 'Jul', 'Aug', 'Sep'],
    description: 'Culinary capital with world-renowned restaurants and beautiful beaches.'
  },

  // 🇬🇷 Thessaloniki, Greece - Cultural Hub
  {
    iataCode: 'SKG',
    cityName: 'Thessaloniki',
    countryName: 'Greece',
    countryCode: 'GR',
    themeScores: {
      party: 82,     // University nightlife, vibrant scene
      adventure: 50, // Some outdoor activities nearby
      learn: 85,     // Byzantine history, archaeology
      shopping: 60,  // Greek goods, local markets
      beach: 60      // Aegean coast access
    },
    highlights: ['Byzantine monuments', 'University culture', 'Greek nightlife', 'Archaeological sites', 'Waterfront'],
    averageFlightTime: 3,
    priceRange: 'budget',
    bestMonths: ['Apr', 'May', 'Jun', 'Sep', 'Oct'],
    description: 'Greece\'s cultural capital with rich Byzantine heritage and vibrant student life.'
  },

  // 🇭🇺 Debrecen, Hungary - University City
  {
    iataCode: 'DEB',
    cityName: 'Debrecen',
    countryName: 'Hungary',
    countryCode: 'HU',
    themeScores: {
      party: 70,     // Student nightlife, thermal baths
      adventure: 55, // Great Plain, nature activities
      learn: 75,     // Protestant heritage, university
      shopping: 50,  // Local markets, Hungarian goods
      beach: 40      // Thermal baths, not coastal
    },
    highlights: ['Reformed College', 'Thermal baths', 'Student culture', 'Great Plain access', 'Hungarian tradition'],
    averageFlightTime: 2.5,
    priceRange: 'budget',
    bestMonths: ['Apr', 'May', 'Jun', 'Sep', 'Oct'],
    description: 'Hungary\'s second city with strong university culture and thermal attractions.'
  },

  // 🇷🇴 Cluj-Napoca, Romania - Transylvanian Culture
  {
    iataCode: 'CLJ',
    cityName: 'Cluj-Napoca',
    countryName: 'Romania',
    countryCode: 'RO',
    themeScores: {
      party: 75,     // University nightlife, cultural events
      adventure: 65, // Carpathian Mountains, hiking
      learn: 80,     // Transylvanian history, architecture
      shopping: 55,  // Local crafts, Romanian goods
      beach: 25      // Landlocked
    },
    highlights: ['Transylvanian culture', 'Gothic architecture', 'Student nightlife', 'Mountain access', 'Romanian heritage'],
    averageFlightTime: 3,
    priceRange: 'budget',
    bestMonths: ['Apr', 'May', 'Jun', 'Sep', 'Oct'],
    description: 'Cultural heart of Transylvania with vibrant student life and mountain access.'
  },

  // 🇭🇷 Split, Croatia - Adriatic Gem
  {
    iataCode: 'SPU',
    cityName: 'Split',
    countryName: 'Croatia',
    countryCode: 'HR',
    themeScores: {
      party: 80,     // Beach clubs, summer nightlife
      adventure: 70, // Island hopping, water sports
      learn: 80,     // Roman heritage, Diocletian's Palace
      shopping: 55,  // Local crafts, souvenirs
      beach: 90      // Stunning Adriatic beaches
    },
    highlights: ["Diocletian's Palace", 'Island hopping', 'Crystal clear waters', 'Roman history', 'Beach culture'],
    averageFlightTime: 2.5,
    priceRange: 'mid-range',
    bestMonths: ['May', 'Jun', 'Jul', 'Aug', 'Sep'],
    description: 'Historic Roman city with incredible beaches and island access.'
  },

  // 🇸🇮 Ljubljana, Slovenia - Green Capital
  {
    iataCode: 'LJU',
    cityName: 'Ljubljana',
    countryName: 'Slovenia',
    countryCode: 'SI',
    themeScores: {
      party: 68,     // Cozy bars, student culture
      adventure: 80, // Alps access, outdoor paradise
      learn: 75,     // Architectural heritage, culture
      shopping: 60,  // Local crafts, sustainable goods
      beach: 35      // Not coastal, but Lake Bled nearby
    },
    highlights: ['Dragon Bridge', 'Castle hill', 'Green city', 'Alps access', 'Sustainable tourism'],
    averageFlightTime: 2,
    priceRange: 'budget',
    bestMonths: ['Apr', 'May', 'Jun', 'Sep', 'Oct'],
    description: 'Charming green capital perfect for outdoor adventures and sustainable travel.'
  },

  // 🇸🇰 Bratislava, Slovakia - Danube Charm
  {
    iataCode: 'BTS',
    cityName: 'Bratislava',
    countryName: 'Slovakia',
    countryCode: 'SK',
    themeScores: {
      party: 72,     // Pub culture, affordable nightlife
      adventure: 60, // Danube activities, nearby nature
      learn: 75,     // Historic old town, castles
      shopping: 55,  // Local goods, affordable shopping
      beach: 30      // River activities
    },
    highlights: ['Historic castle', 'Danube riverfront', 'Medieval old town', 'Affordable culture', 'Central European charm'],
    averageFlightTime: 2,
    priceRange: 'budget',
    bestMonths: ['Apr', 'May', 'Jun', 'Sep', 'Oct'],
    description: 'Charming Danube capital with medieval heritage and great value for money.'
  },

  // 🇱🇹 Vilnius, Lithuania - Baltic Baroque
  {
    iataCode: 'VNO',
    cityName: 'Vilnius',
    countryName: 'Lithuania',
    countryCode: 'LT',
    themeScores: {
      party: 70,     // Growing nightlife scene, bar culture
      adventure: 55, // Baltic nature, forests
      learn: 88,     // Baroque architecture, history
      shopping: 60,  // Baltic amber, local crafts
      beach: 40      // Baltic coast accessible
    },
    highlights: ['Baroque old town', 'Baltic amber', 'Historic architecture', 'Affordable culture', 'Forest landscapes'],
    averageFlightTime: 2.5,
    priceRange: 'budget',
    bestMonths: ['May', 'Jun', 'Jul', 'Aug', 'Sep'],
    description: 'Baltic capital with stunning baroque architecture and authentic culture.'
  },

  // 🇱🇻 Riga, Latvia - Art Nouveau Beauty
  {
    iataCode: 'RIX',
    cityName: 'Riga',
    countryName: 'Latvia',
    countryCode: 'LV',
    themeScores: {
      party: 78,     // Famous nightlife, party destination
      adventure: 55, // Baltic nature, beaches
      learn: 82,     // Art Nouveau architecture, history
      shopping: 62,  // Baltic goods, local markets
      beach: 50      // Baltic seaside nearby
    },
    highlights: ['Art Nouveau district', 'Medieval old town', 'Baltic nightlife', 'Affordable luxury', 'Cultural heritage'],
    averageFlightTime: 2.5,
    priceRange: 'budget',
    bestMonths: ['May', 'Jun', 'Jul', 'Aug', 'Sep'],
    description: 'Art Nouveau architectural gem with vibrant nightlife and Baltic charm.'
  },

  // 🇪🇪 Tallinn, Estonia - Medieval Digital
  {
    iataCode: 'TLL',
    cityName: 'Tallinn',
    countryName: 'Estonia',
    countryCode: 'EE',
    themeScores: {
      party: 75,     // Digital nomad scene, unique bars
      adventure: 50, // Baltic islands, nature
      learn: 85,     // Medieval architecture, digital innovation
      shopping: 65,  // Digital services, local crafts
      beach: 45      // Baltic coast
    },
    highlights: ['Medieval old town', 'Digital innovation', 'Startup culture', 'Baltic heritage', 'Tech scene'],
    averageFlightTime: 2.5,
    priceRange: 'budget',
    bestMonths: ['May', 'Jun', 'Jul', 'Aug', 'Sep'],
    description: 'Medieval city leading Europe\'s digital transformation with incredible tech culture.'
  }
]

// Updated helper functions for multi-theme scoring system
/**
 * Get cities for a specific theme with multi-theme scoring
 */
export function getCitiesForTheme(theme: string, minScore: number = 60): ThemeCity[] {
  const normalizedTheme = theme.toLowerCase() as keyof ThemeCity['themeScores']
  
  if (!isThemeSupported(normalizedTheme)) {
    return []
  }
  
  return ALL_CITIES
    .filter(city => city.themeScores[normalizedTheme] >= minScore)
    .sort((a, b) => b.themeScores[normalizedTheme] - a.themeScores[normalizedTheme])
}

/**
 * Get all available themes
 */
export function getAvailableThemes(): string[] {
  return Object.keys(THEME_DEFINITIONS)
}

/**
 * Check if a theme is supported
 */
export function isThemeSupported(theme: string): boolean {
  const normalizedTheme = theme.toLowerCase()
  return normalizedTheme in THEME_DEFINITIONS
}

/**
 * Get a city by IATA code
 */
export function getCityByIataCode(iataCode: string): ThemeCity | null {
  const upperCode = iataCode.toUpperCase()
  return ALL_CITIES.find(city => city.iataCode === upperCode) || null
}

/**
 * Get themes that include a specific city (with scores above threshold)
 */
export function getThemesForCity(iataCode: string, minScore: number = 60): string[] {
  const city = getCityByIataCode(iataCode)
  if (!city) return []
  
  const themes: string[] = []
  for (const [theme, score] of Object.entries(city.themeScores)) {
    if (score >= minScore) {
      themes.push(theme)
    }
  }
  
  return themes.sort((a, b) => city.themeScores[b as keyof ThemeCity['themeScores']] - city.themeScores[a as keyof ThemeCity['themeScores']])
}

/**
 * Get top cities for a theme (sorted by theme score)
 */
export function getTopCitiesForTheme(theme: string, limit: number = 10): ThemeCity[] {
  return getCitiesForTheme(theme)
    .slice(0, limit)
}

/**
 * Get cities by multiple themes (finds cities that score well in multiple themes)
 */
export function getCitiesByMultipleThemes(themes: string[], minScore: number = 50): ThemeCity[] {
  return ALL_CITIES
    .filter(city => {
      return themes.every(theme => {
        const normalizedTheme = theme.toLowerCase() as keyof ThemeCity['themeScores']
        return city.themeScores[normalizedTheme] >= minScore
      })
    })
    .sort((a, b) => {
      const avgScoreA = themes.reduce((sum, theme) => {
        const normalizedTheme = theme.toLowerCase() as keyof ThemeCity['themeScores']
        return sum + a.themeScores[normalizedTheme]
      }, 0) / themes.length
      
      const avgScoreB = themes.reduce((sum, theme) => {
        const normalizedTheme = theme.toLowerCase() as keyof ThemeCity['themeScores']
        return sum + b.themeScores[normalizedTheme]
      }, 0) / themes.length
      
      return avgScoreB - avgScoreA
    })
}

/**
 * Get cities by price range
 */
export function getCitiesByPriceRange(priceRange: 'budget' | 'mid-range' | 'luxury'): ThemeCity[] {
  return ALL_CITIES.filter(city => city.priceRange === priceRange)
}

/**
 * Get cities suitable for specific month
 */
export function getCitiesForMonth(month: string): ThemeCity[] {
  return ALL_CITIES.filter(city => city.bestMonths.includes(month))
}

/**
 * Get comprehensive city statistics
 */
export function getCityStatistics() {
  const totalCities = ALL_CITIES.length
  const europeanCities = ALL_CITIES.filter(city => 
    ['ES', 'IT', 'FR', 'DE', 'GB', 'PT', 'NL', 'BE', 'AT', 'CH', 'GR', 'HR', 'CZ', 'HU', 'PL', 'DK', 'SE', 'NO', 'FI', 'IE'].includes(city.countryCode)
  ).length
  
  const priceDistribution = {
    budget: ALL_CITIES.filter(city => city.priceRange === 'budget').length,
    'mid-range': ALL_CITIES.filter(city => city.priceRange === 'mid-range').length,
    luxury: ALL_CITIES.filter(city => city.priceRange === 'luxury').length
  }
  
  const themeStats = getAvailableThemes().reduce((stats, theme) => {
    const normalizedTheme = theme as keyof ThemeCity['themeScores']
    stats[theme] = getCitiesForTheme(theme).length
    return stats
  }, {} as Record<string, number>)
  
  return {
    totalCities,
    europeanCities,
    priceDistribution,
    themeStats
  }
}
