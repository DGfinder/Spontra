import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()

const reels = [
  // SYD short haul — AU/NZ
  { iata:'MEL', theme:'vibe',     title:'Melbourne Lanes',     caption:'Coffee culture, street art, and world-class food in every laneway',     img:'https://images.unsplash.com/photo-1514395462725-fb4566210144?w=800' },
  { iata:'MEL', theme:'indulge',  title:'Melbourne Eats',      caption:'The dining capital of Australia — no debate',                           img:'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=800' },
  { iata:'BNE', theme:'adventure',title:'Brisbane & Beyond',   caption:'Gateway to the Whitsundays, reef, and rainforest',                      img:'https://images.unsplash.com/photo-1566734904496-9309bb1798ae?w=800' },
  { iata:'CNS', theme:'nature',   title:'Cairns Wild',         caption:'Great Barrier Reef right on your doorstep',                             img:'https://images.unsplash.com/photo-1559825481-12a05cc00344?w=800' },
  { iata:'PER', theme:'discover', title:'Perth Hidden',        caption:'Whitest beaches in Australia, most isolated city on earth',              img:'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800' },
  { iata:'ZQN', theme:'adventure',title:'Queenstown Thrill',   caption:'Bungee, ski, jet boat — the adventure capital of the world',             img:'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800' },
  { iata:'CHC', theme:'nature',   title:'Christchurch & Alps', caption:'Southern Alps, whale watching, and the perfect road trip south',        img:'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800' },
  // SYD medium haul — Asia
  { iata:'DPS', theme:'vibe',     title:'Bali Nights',         caption:'Seminyak sunsets, beach clubs, and rooftop bars',                       img:'https://images.unsplash.com/photo-1592364395653-83e648b20cc2?w=800' },
  { iata:'SIN', theme:'indulge',  title:'Singapore Refined',   caption:'Hawker centres to Michelin stars — all within a taxi ride',             img:'https://images.unsplash.com/photo-1565967511849-76a60a516170?w=800' },
  { iata:'MNL', theme:'discover', title:'Manila Surprises',    caption:'History, food, and island-hopping just hours away',                     img:'https://images.unsplash.com/photo-1612178537253-bccd437b730e?w=800' },
  // LHR routes — European short haul
  { iata:'CDG', theme:'indulge',  title:'Paris Weekend',       caption:'Two hours and you are sipping wine in Montmartre',                      img:'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800' },
  { iata:'AMS', theme:'discover', title:'Amsterdam Canals',    caption:'Bikes, tulips, world-class museums and legendary nightlife',             img:'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800' },
  { iata:'DUB', theme:'vibe',     title:'Dublin Craic',        caption:'Guinness, live music, and the warmest welcome in Europe',               img:'https://images.unsplash.com/photo-1549918864-48ac978761a4?w=800' },
  { iata:'BRU', theme:'indulge',  title:'Brussels Bites',      caption:'Chocolate, waffles, and 400 types of beer — enough said',              img:'https://images.unsplash.com/photo-1608797178974-15b35a64ede9?w=800' },
  { iata:'MAN', theme:'vibe',     title:'Manchester Music',    caption:'Birthplace of Oasis, the Hacienda, and industrial cool',                img:'https://images.unsplash.com/photo-1595211877493-41a4e5f236b3?w=800' },
  // SIN routes — SE Asia
  { iata:'KUL', theme:'discover', title:'Kuala Lumpur',        caption:'Petronas Towers, Batu Caves, and the best curry laksa',                 img:'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800' },
  { iata:'BKK', theme:'indulge',  title:'Bangkok Street Food', caption:'The best food city on earth — fight me on this',                        img:'https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=800' },
  { iata:'SGN', theme:'discover', title:'Ho Chi Minh City',    caption:'Scooters, pho, and the best coffee you have ever had',                  img:'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800' },
  { iata:'HKT', theme:'nature',   title:'Phuket Beaches',      caption:'Emerald bays, limestone cliffs, and long-tail boats',                  img:'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=800' },
  { iata:'CGK', theme:'discover', title:'Jakarta Modern',      caption:'Megacity energy, incredible street food, and hidden art districts',      img:'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=800' },
  // Extra popular
  { iata:'HKG', theme:'vibe',     title:'Hong Kong Hustle',    caption:'Neon signs, night markets, and the best dim sum on earth',              img:'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=800' },
  { iata:'HKG', theme:'indulge',  title:'Hong Kong Eats',      caption:'The most Michelin stars per capita — for very good reason',             img:'https://images.unsplash.com/photo-1536599018102-9f803c140fc1?w=800' },
  { iata:'BKK', theme:'adventure',title:'Bangkok Temples',     caption:'Ancient wats, floating markets, and the chaos you will love',           img:'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800' },
  { iata:'FCO', theme:'discover', title:'Rome Eternal',        caption:'History at every corner — literally walk on 2000-year-old streets',     img:'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800' },
  { iata:'MAD', theme:'vibe',     title:'Madrid Nights',       caption:'Dinner at midnight, clubs until dawn — this is how Spain lives',        img:'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800' },
]

async function run() {
  console.log(`Seeding ${reels.length} additional reels...\n`)
  let created = 0
  for (const r of reels) {
    const existing: any[] = await p.$queryRaw`SELECT id FROM "Reel" WHERE iata = ${r.iata} AND "themeSlug" = ${r.theme} LIMIT 1`
    if (existing.length > 0) { process.stdout.write('.'); continue }
    const reel: any[] = await p.$queryRaw`INSERT INTO "Reel" (iata, "themeSlug", title, caption, language, "isActive", "sortOrder", "updatedAt") VALUES (${r.iata}, ${r.theme}, ${r.title}, ${r.caption}, 'en', true, 0, NOW()) RETURNING id`
    await p.$queryRaw`INSERT INTO "ReelMedia" ("reelId", kind, "sourceUrl", credit, "sortOrder", "isActive") VALUES (${reel[0].id}, 'image', ${r.img}, 'Unsplash', 1, true)`
    created++
    process.stdout.write('✓')
  }
  const total: any[] = await p.$queryRaw`SELECT COUNT(*)::int as n FROM "Reel"`
  console.log(`\n\n✅ ${created} new | Total reels: ${total[0].n}`)
}
run().catch(console.error).finally(() => p.$disconnect())
