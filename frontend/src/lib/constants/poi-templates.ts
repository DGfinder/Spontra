import {
  Waves,
  Mountain,
  Trees,
  Landmark,
  Binoculars,
  TentTree,
  Music,
  PartyPopper,
  Wine,
  Building2,
  MapPin,
  Palette,
  BookOpen,
  Utensils,
  Camera,
  Globe2,
  Scroll,
  Zap,
  Bike,
  Rocket,
  Sailboat,
  Wind,
  Plane,
  ShoppingBag,
  UtensilsCrossed,
  Sparkles,
  Droplets,
  Flower2,
  Heart
} from 'lucide-react'

export interface POITemplate {
  id: string
  theme: string
  category: string
  icon: typeof Waves
  description: string
  defaultData: {
    name: string
    description: string
    caption: string
    altText: string
  }
}

export const THEME_POI_TEMPLATES: POITemplate[] = [
  // ============================================================================
  // NATURE THEME 🌿
  // ============================================================================
  {
    id: 'nature-beach',
    theme: 'nature',
    category: 'Beach',
    icon: Waves,
    description: 'Beaches, coastlines, and seaside spots',
    defaultData: {
      name: 'Beach',
      description: 'A pristine beach with crystal-clear waters and soft sand, perfect for swimming, sunbathing, and water activities.',
      caption: 'Discover paradise at {name} - one of {city}\'s most beautiful beaches with turquoise waters and golden sands.',
      altText: 'Beautiful beach with clear blue water and sandy shore'
    }
  },
  {
    id: 'nature-waterfall',
    theme: 'nature',
    category: 'Waterfall',
    icon: Droplets,
    description: 'Waterfalls and cascades',
    defaultData: {
      name: 'Waterfall',
      description: 'A stunning waterfall surrounded by lush vegetation, offering spectacular views and refreshing mist.',
      caption: 'Experience the power and beauty of {name} - a breathtaking waterfall in {city}.',
      altText: 'Majestic waterfall cascading into pool surrounded by greenery'
    }
  },
  {
    id: 'nature-lake',
    theme: 'nature',
    category: 'Lake',
    icon: Waves,
    description: 'Lakes, ponds, and freshwater bodies',
    defaultData: {
      name: 'Lake',
      description: 'A serene lake with crystal-clear waters, ideal for kayaking, swimming, and peaceful moments in nature.',
      caption: 'Find tranquility at {name} - a pristine lake in the heart of {city}.',
      altText: 'Calm lake with clear water reflecting surrounding mountains'
    }
  },
  {
    id: 'nature-national-park',
    theme: 'nature',
    category: 'National Park',
    icon: Trees,
    description: 'National parks and protected areas',
    defaultData: {
      name: 'National Park',
      description: 'A protected wilderness area featuring diverse ecosystems, wildlife, and spectacular natural beauty.',
      caption: 'Explore {name} - {city}\'s premier national park with pristine trails and incredible biodiversity.',
      altText: 'National park landscape with diverse flora and fauna'
    }
  },
  {
    id: 'nature-hiking-trail',
    theme: 'nature',
    category: 'Hiking Trail',
    icon: TentTree,
    description: 'Hiking paths and trekking routes',
    defaultData: {
      name: 'Hiking Trail',
      description: 'A scenic hiking trail offering stunning views, diverse terrain, and connection with nature.',
      caption: 'Adventure awaits on {name} - one of {city}\'s most spectacular hiking experiences.',
      altText: 'Scenic hiking trail winding through natural landscape'
    }
  },
  {
    id: 'nature-viewpoint',
    theme: 'nature',
    category: 'Scenic Viewpoint',
    icon: Binoculars,
    description: 'Panoramic viewpoints and overlooks',
    defaultData: {
      name: 'Viewpoint',
      description: 'A breathtaking viewpoint offering panoramic vistas of the surrounding natural landscape.',
      caption: 'Capture unforgettable views from {name} - the perfect photo spot in {city}.',
      altText: 'Panoramic viewpoint overlooking mountains and valleys'
    }
  },
  {
    id: 'nature-mountain',
    theme: 'nature',
    category: 'Mountain',
    icon: Mountain,
    description: 'Mountains and peaks',
    defaultData: {
      name: 'Mountain',
      description: 'A majestic mountain offering challenging climbs, stunning views, and unforgettable natural beauty.',
      caption: 'Conquer {name} - an iconic peak dominating the {city} skyline.',
      altText: 'Majestic mountain peak rising above the landscape'
    }
  },
  {
    id: 'nature-forest',
    theme: 'nature',
    category: 'Forest',
    icon: Trees,
    description: 'Forests and woodlands',
    defaultData: {
      name: 'Forest',
      description: 'An ancient forest with towering trees, diverse wildlife, and peaceful walking trails.',
      caption: 'Immerse yourself in {name} - a pristine forest sanctuary near {city}.',
      altText: 'Dense forest with tall trees and dappled sunlight'
    }
  },

  // ============================================================================
  // VIBE THEME ✨
  // ============================================================================
  {
    id: 'vibe-nightclub',
    theme: 'vibe',
    category: 'Nightclub',
    icon: Music,
    description: 'Nightclubs and dance venues',
    defaultData: {
      name: 'Nightclub',
      description: 'A vibrant nightclub featuring world-class DJs, cutting-edge sound systems, and electrifying atmosphere.',
      caption: 'Dance the night away at {name} - {city}\'s hottest nightlife destination.',
      altText: 'Energetic nightclub with DJ booth and dancing crowd'
    }
  },
  {
    id: 'vibe-bar',
    theme: 'vibe',
    category: 'Bar & Lounge',
    icon: Wine,
    description: 'Bars, lounges, and cocktail venues',
    defaultData: {
      name: 'Bar',
      description: 'A stylish bar serving creative cocktails, local brews, and offering a sophisticated atmosphere.',
      caption: 'Sip and socialize at {name} - {city}\'s favorite cocktail destination.',
      altText: 'Modern bar interior with cocktails and ambient lighting'
    }
  },
  {
    id: 'vibe-music-venue',
    theme: 'vibe',
    category: 'Live Music Venue',
    icon: Music,
    description: 'Live music venues and concert halls',
    defaultData: {
      name: 'Music Venue',
      description: 'An intimate venue showcasing local and international artists across multiple genres.',
      caption: 'Experience live music at {name} - where {city}\'s music scene comes alive.',
      altText: 'Live music venue with band performing on stage'
    }
  },
  {
    id: 'vibe-festival',
    theme: 'vibe',
    category: 'Festival Ground',
    icon: PartyPopper,
    description: 'Festival venues and event spaces',
    defaultData: {
      name: 'Festival Ground',
      description: 'A dynamic festival venue hosting cultural celebrations, music festivals, and community events.',
      caption: 'Join the celebration at {name} - {city}\'s premier festival destination.',
      altText: 'Festival grounds with stages and colorful decorations'
    }
  },
  {
    id: 'vibe-rooftop',
    theme: 'vibe',
    category: 'Rooftop Bar',
    icon: Building2,
    description: 'Rooftop bars and sky lounges',
    defaultData: {
      name: 'Rooftop Bar',
      description: 'An elevated rooftop venue with stunning city views, craft cocktails, and sunset vibes.',
      caption: 'Elevate your evening at {name} - spectacular views and cocktails high above {city}.',
      altText: 'Rooftop bar with city skyline views at sunset'
    }
  },
  {
    id: 'vibe-beach-club',
    theme: 'vibe',
    category: 'Beach Club',
    icon: Waves,
    description: 'Beach clubs and seaside venues',
    defaultData: {
      name: 'Beach Club',
      description: 'A sophisticated beach club combining sun, sand, cocktails, and music by the water.',
      caption: 'Lounge in paradise at {name} - {city}\'s ultimate beach club experience.',
      altText: 'Beach club with loungers, umbrellas, and ocean views'
    }
  },
  {
    id: 'vibe-street-market',
    theme: 'vibe',
    category: 'Night Market',
    icon: MapPin,
    description: 'Night markets and street food venues',
    defaultData: {
      name: 'Night Market',
      description: 'A bustling night market featuring street food, local crafts, and vibrant atmosphere.',
      caption: 'Immerse yourself in {name} - {city}\'s most authentic night market experience.',
      altText: 'Colorful night market with food stalls and lanterns'
    }
  },

  // ============================================================================
  // DISCOVER THEME 🎨
  // ============================================================================
  {
    id: 'discover-museum',
    theme: 'discover',
    category: 'Museum',
    icon: Landmark,
    description: 'Museums and cultural institutions',
    defaultData: {
      name: 'Museum',
      description: 'A world-class museum showcasing art, history, and culture through carefully curated exhibitions.',
      caption: 'Explore {name} - discover {city}\'s rich history and cultural heritage.',
      altText: 'Museum interior with exhibits and visitors'
    }
  },
  {
    id: 'discover-art-gallery',
    theme: 'discover',
    category: 'Art Gallery',
    icon: Palette,
    description: 'Art galleries and exhibition spaces',
    defaultData: {
      name: 'Art Gallery',
      description: 'A contemporary art gallery featuring works by local and international artists.',
      caption: 'Discover artistic brilliance at {name} - {city}\'s leading contemporary art space.',
      altText: 'Art gallery with paintings and sculptures on display'
    }
  },
  {
    id: 'discover-historic-site',
    theme: 'discover',
    category: 'Historic Site',
    icon: Scroll,
    description: 'Historical landmarks and heritage sites',
    defaultData: {
      name: 'Historic Site',
      description: 'An important historical site that tells the story of the region\'s past and cultural evolution.',
      caption: 'Step back in time at {name} - a {city} landmark steeped in history.',
      altText: 'Historic site with preserved architecture and monuments'
    }
  },
  {
    id: 'discover-market',
    theme: 'discover',
    category: 'Local Market',
    icon: ShoppingBag,
    description: 'Traditional markets and bazaars',
    defaultData: {
      name: 'Local Market',
      description: 'An authentic local market offering fresh produce, traditional crafts, and cultural experiences.',
      caption: 'Experience local life at {name} - {city}\'s vibrant traditional market.',
      altText: 'Bustling local market with vendors and colorful produce'
    }
  },
  {
    id: 'discover-architecture',
    theme: 'discover',
    category: 'Architecture',
    icon: Building2,
    description: 'Architectural landmarks and buildings',
    defaultData: {
      name: 'Architectural Landmark',
      description: 'An iconic building showcasing exceptional design and architectural significance.',
      caption: 'Marvel at {name} - an architectural masterpiece defining {city}\'s skyline.',
      altText: 'Distinctive architecture with unique design elements'
    }
  },
  {
    id: 'discover-cuisine',
    theme: 'discover',
    category: 'Local Cuisine',
    icon: Utensils,
    description: 'Authentic local dining experiences',
    defaultData: {
      name: 'Traditional Restaurant',
      description: 'An authentic restaurant serving traditional dishes that represent the region\'s culinary heritage.',
      caption: 'Taste authentic {city} at {name} - where tradition meets flavor.',
      altText: 'Traditional cuisine served in authentic restaurant setting'
    }
  },
  {
    id: 'discover-cultural-center',
    theme: 'discover',
    category: 'Cultural Center',
    icon: Globe2,
    description: 'Cultural centers and performance venues',
    defaultData: {
      name: 'Cultural Center',
      description: 'A vibrant cultural hub hosting performances, workshops, and community events.',
      caption: 'Experience culture at {name} - the heart of {city}\'s artistic community.',
      altText: 'Cultural center with performance space and exhibitions'
    }
  },
  {
    id: 'discover-observatory',
    theme: 'discover',
    category: 'Observatory',
    icon: Camera,
    description: 'Observatories and planetariums',
    defaultData: {
      name: 'Observatory',
      description: 'A state-of-the-art observatory offering stunning views of the cosmos and educational programs.',
      caption: 'Reach for the stars at {name} - {city}\'s window to the universe.',
      altText: 'Observatory dome under starry night sky'
    }
  },

  // ============================================================================
  // ADVENTURE THEME 🏔️
  // ============================================================================
  {
    id: 'adventure-theme-park',
    theme: 'adventure',
    category: 'Theme Park',
    icon: PartyPopper,
    description: 'Theme parks and amusement venues',
    defaultData: {
      name: 'Theme Park',
      description: 'An exciting theme park featuring thrilling rides, entertainment, and fun for all ages.',
      caption: 'Unleash excitement at {name} - {city}\'s ultimate theme park adventure.',
      altText: 'Theme park with roller coasters and attractions'
    }
  },
  {
    id: 'adventure-rafting',
    theme: 'adventure',
    category: 'Whitewater Rafting',
    icon: Waves,
    description: 'Rafting and water adventure sports',
    defaultData: {
      name: 'Rafting Experience',
      description: 'An adrenaline-pumping rafting adventure through rapids and scenic waterways.',
      caption: 'Conquer the rapids with {name} - {city}\'s most thrilling water adventure.',
      altText: 'Rafting team navigating whitewater rapids'
    }
  },
  {
    id: 'adventure-bungee',
    theme: 'adventure',
    category: 'Bungee Jumping',
    icon: Zap,
    description: 'Bungee jumping sites',
    defaultData: {
      name: 'Bungee Jump',
      description: 'A heart-pounding bungee jumping experience from spectacular heights.',
      caption: 'Take the leap at {name} - {city}\'s ultimate adrenaline rush.',
      altText: 'Bungee jumping platform with scenic backdrop'
    }
  },
  {
    id: 'adventure-zipline',
    theme: 'adventure',
    category: 'Zip-lining',
    icon: Wind,
    description: 'Zip-lining and canopy tours',
    defaultData: {
      name: 'Zip-line Adventure',
      description: 'Soar through the air on an exhilarating zip-line course with breathtaking views.',
      caption: 'Fly like never before at {name} - zip-lining thrills in {city}.',
      altText: 'Person zip-lining through forest canopy'
    }
  },
  {
    id: 'adventure-biking',
    theme: 'adventure',
    category: 'Mountain Biking',
    icon: Bike,
    description: 'Mountain biking trails and tours',
    defaultData: {
      name: 'Mountain Bike Trail',
      description: 'Challenging mountain bike trails through diverse terrain and stunning landscapes.',
      caption: 'Ride the trails at {name} - {city}\'s premier mountain biking destination.',
      altText: 'Mountain biker on rugged trail with scenic views'
    }
  },
  {
    id: 'adventure-skydiving',
    theme: 'adventure',
    category: 'Skydiving',
    icon: Plane,
    description: 'Skydiving and parachuting',
    defaultData: {
      name: 'Skydiving Center',
      description: 'Experience the ultimate freefall with tandem skydiving over spectacular scenery.',
      caption: 'Touch the sky at {name} - unforgettable skydiving over {city}.',
      altText: 'Skydivers in freefall with landscape below'
    }
  },
  {
    id: 'adventure-climbing',
    theme: 'adventure',
    category: 'Rock Climbing',
    icon: Mountain,
    description: 'Rock climbing and bouldering',
    defaultData: {
      name: 'Climbing Area',
      description: 'World-class rock climbing with routes for all skill levels and stunning views.',
      caption: 'Scale new heights at {name} - {city}\'s best climbing destination.',
      altText: 'Rock climber ascending cliff face'
    }
  },
  {
    id: 'adventure-diving',
    theme: 'adventure',
    category: 'Scuba Diving',
    icon: Waves,
    description: 'Scuba diving and snorkeling',
    defaultData: {
      name: 'Dive Site',
      description: 'Explore underwater wonders with crystal-clear visibility and diverse marine life.',
      caption: 'Dive into adventure at {name} - {city}\'s premier underwater experience.',
      altText: 'Scuba diver exploring vibrant coral reef'
    }
  },
  {
    id: 'adventure-surfing',
    theme: 'adventure',
    category: 'Surfing',
    icon: Sailboat,
    description: 'Surfing spots and surf schools',
    defaultData: {
      name: 'Surf Break',
      description: 'Legendary surf break with consistent waves perfect for all skill levels.',
      caption: 'Catch the perfect wave at {name} - {city}\'s iconic surf spot.',
      altText: 'Surfer riding ocean wave'
    }
  },

  // ============================================================================
  // INDULGE THEME 💎
  // ============================================================================
  {
    id: 'indulge-shopping',
    theme: 'indulge',
    category: 'Shopping District',
    icon: ShoppingBag,
    description: 'Luxury shopping and boutiques',
    defaultData: {
      name: 'Shopping District',
      description: 'An upscale shopping area featuring designer boutiques, luxury brands, and exclusive stores.',
      caption: 'Shop in style at {name} - {city}\'s premier luxury shopping destination.',
      altText: 'Luxury shopping street with high-end boutiques'
    }
  },
  {
    id: 'indulge-fine-dining',
    theme: 'indulge',
    category: 'Fine Dining',
    icon: UtensilsCrossed,
    description: 'Michelin-starred and upscale restaurants',
    defaultData: {
      name: 'Fine Dining Restaurant',
      description: 'An exceptional fine dining experience featuring innovative cuisine and impeccable service.',
      caption: 'Savor culinary excellence at {name} - {city}\'s finest dining experience.',
      altText: 'Elegant fine dining restaurant with gourmet presentation'
    }
  },
  {
    id: 'indulge-spa',
    theme: 'indulge',
    category: 'Luxury Spa',
    icon: Sparkles,
    description: 'Spas and wellness centers',
    defaultData: {
      name: 'Luxury Spa',
      description: 'A world-class spa offering rejuvenating treatments, massages, and holistic wellness.',
      caption: 'Indulge in relaxation at {name} - {city}\'s premier spa sanctuary.',
      altText: 'Tranquil spa interior with treatment rooms'
    }
  },
  {
    id: 'indulge-hot-springs',
    theme: 'indulge',
    category: 'Hot Springs',
    icon: Droplets,
    description: 'Hot springs and thermal baths',
    defaultData: {
      name: 'Hot Springs',
      description: 'Natural hot springs offering therapeutic mineral waters and serene relaxation.',
      caption: 'Soak in bliss at {name} - {city}\'s renowned thermal retreat.',
      altText: 'Natural hot springs with steam rising from mineral water'
    }
  },
  {
    id: 'indulge-hotel',
    theme: 'indulge',
    category: 'Luxury Hotel',
    icon: Building2,
    description: 'Five-star hotels and resorts',
    defaultData: {
      name: 'Luxury Hotel',
      description: 'An iconic luxury hotel offering world-class accommodations, service, and amenities.',
      caption: 'Experience luxury at {name} - {city}\'s most prestigious hotel.',
      altText: 'Elegant luxury hotel exterior and entrance'
    }
  },
  {
    id: 'indulge-wine',
    theme: 'indulge',
    category: 'Wine Tasting',
    icon: Wine,
    description: 'Wineries and wine bars',
    defaultData: {
      name: 'Winery',
      description: 'An exquisite winery offering tastings of premium wines in a beautiful setting.',
      caption: 'Taste perfection at {name} - discover {city}\'s finest wines.',
      altText: 'Vineyard with wine tasting room overlooking rows of vines'
    }
  },
  {
    id: 'indulge-rooftop-pool',
    theme: 'indulge',
    category: 'Rooftop Pool',
    icon: Waves,
    description: 'Rooftop pools and infinity pools',
    defaultData: {
      name: 'Rooftop Pool',
      description: 'A stunning rooftop pool with panoramic city views and luxurious poolside service.',
      caption: 'Swim above the city at {name} - {city}\'s most spectacular rooftop pool.',
      altText: 'Infinity pool on rooftop with city skyline views'
    }
  },
  {
    id: 'indulge-wellness',
    theme: 'indulge',
    category: 'Wellness Retreat',
    icon: Flower2,
    description: 'Wellness retreats and yoga centers',
    defaultData: {
      name: 'Wellness Retreat',
      description: 'A holistic wellness retreat offering yoga, meditation, and transformative experiences.',
      caption: 'Find your center at {name} - {city}\'s premier wellness sanctuary.',
      altText: 'Peaceful wellness retreat with meditation and yoga spaces'
    }
  },
  {
    id: 'indulge-boutique',
    theme: 'indulge',
    category: 'Designer Boutique',
    icon: Heart,
    description: 'Designer boutiques and concept stores',
    defaultData: {
      name: 'Designer Boutique',
      description: 'An exclusive boutique featuring curated collections from international designers.',
      caption: 'Discover unique pieces at {name} - {city}\'s most coveted designer destination.',
      altText: 'Elegant designer boutique interior with luxury fashion'
    }
  }
]

// Helper function to get templates for a specific theme
export function getTemplatesForTheme(theme: string): POITemplate[] {
  return THEME_POI_TEMPLATES.filter(template => template.theme === theme)
}

// Helper function to get all unique categories for a theme
export function getCategoriesForTheme(theme: string): string[] {
  const templates = getTemplatesForTheme(theme)
  return templates.map(t => t.category)
}
