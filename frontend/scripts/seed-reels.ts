#!/usr/bin/env tsx
/**
 * Seed starter reels for each theme.
 * Uses top destinations from the existing airports/destinations data
 * with curated Unsplash images. Run once to get the feed working.
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const reels = [
  // ADVENTURE
  { iata: 'BCN', theme: 'adventure', title: 'Barcelona Adventures', caption: 'From mountain hikes to coastal walks, Barcelona has it all', img: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800', credit: 'Unsplash' },
  { iata: 'LIS', theme: 'adventure', title: 'Lisbon Calling', caption: 'Surf, hike, and explore the vibrant streets', img: 'https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=800', credit: 'Unsplash' },
  { iata: 'DPS', theme: 'adventure', title: 'Bali Wild Side', caption: 'Temples, volcanoes, and rice terraces', img: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800', credit: 'Unsplash' },
  { iata: 'NRT', theme: 'adventure', title: 'Tokyo Explorer', caption: 'Ancient meets ultra-modern — every street a discovery', img: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800', credit: 'Unsplash' },
  { iata: 'AKL', theme: 'adventure', title: 'New Zealand Epic', caption: 'Lord of the Rings landscapes are real — go find them', img: 'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=800', credit: 'Unsplash' },

  // NATURE
  { iata: 'KEF', theme: 'nature', title: 'Iceland Raw', caption: 'Northern lights, geysers, and waterfalls on repeat', img: 'https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=800', credit: 'Unsplash' },
  { iata: 'DPS', theme: 'nature', title: 'Bali Jungles', caption: 'Emerald rice fields and sacred forests', img: 'https://images.unsplash.com/photo-1573790387438-4da905039392?w=800', credit: 'Unsplash' },
  { iata: 'CMB', theme: 'nature', title: 'Sri Lanka Wild', caption: 'Elephants, tea estates, and stunning coastline', img: 'https://images.unsplash.com/photo-1562602833-0f4ab2fc46e5?w=800', credit: 'Unsplash' },
  { iata: 'KUL', theme: 'nature', title: 'Borneo Rainforest', caption: 'The oldest rainforest on earth — orangutans included', img: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800', credit: 'Unsplash' },
  { iata: 'AKL', theme: 'nature', title: 'Fiordland', caption: 'Milford Sound and the untouched southwest', img: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800', credit: 'Unsplash' },

  // VIBE
  { iata: 'CDG', theme: 'vibe', title: 'Paris Nights', caption: 'The city that never really sleeps — just gets more beautiful', img: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800', credit: 'Unsplash' },
  { iata: 'BKK', theme: 'vibe', title: 'Bangkok Buzz', caption: 'Street food, rooftop bars, and chaotic magic', img: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800', credit: 'Unsplash' },
  { iata: 'IBZ', theme: 'vibe', title: 'Ibiza Energy', caption: 'The island that defines summer', img: 'https://images.unsplash.com/photo-1559521783-1d1599583485?w=800', credit: 'Unsplash' },
  { iata: 'SIN', theme: 'vibe', title: 'Singapore Style', caption: 'Marina Bay at night is something else entirely', img: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800', credit: 'Unsplash' },
  { iata: 'DXB', theme: 'vibe', title: 'Dubai After Dark', caption: 'Skyline, desert parties, and pure excess', img: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800', credit: 'Unsplash' },

  // INDULGE
  { iata: 'FCO', theme: 'indulge', title: 'Rome Indulgence', caption: 'Pasta, wine, and two thousand years of art', img: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800', credit: 'Unsplash' },
  { iata: 'CDG', theme: 'indulge', title: 'Paris Flavours', caption: 'Croissants, Champagne, and Michelin stars', img: 'https://images.unsplash.com/photo-1476362555312-ab9e108a0b7e?w=800', credit: 'Unsplash' },
  { iata: 'HKG', theme: 'indulge', title: 'Hong Kong Eats', caption: 'The most Michelin stars per capita — for good reason', img: 'https://images.unsplash.com/photo-1536599018102-9f803c140fc1?w=800', credit: 'Unsplash' },
  { iata: 'LHR', theme: 'indulge', title: 'London Luxury', caption: 'Afternoon tea, private clubs, and world-class dining', img: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800', credit: 'Unsplash' },
  { iata: 'NRT', theme: 'indulge', title: 'Tokyo Omakase', caption: 'The world\'s most precise cuisine in the world\'s most precise city', img: 'https://images.unsplash.com/photo-1540648639573-8c848de23f0a?w=800', credit: 'Unsplash' },

  // DISCOVER
  { iata: 'ATH', theme: 'discover', title: 'Athens Awakens', caption: 'Ancient ruins, modern tavernas, hidden neighbourhoods', img: 'https://images.unsplash.com/photo-1555993539-1732b0258235?w=800', credit: 'Unsplash' },
  { iata: 'IST', theme: 'discover', title: 'Istanbul Crossroads', caption: 'Two continents, one incredible city', img: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800', credit: 'Unsplash' },
  { iata: 'HAN', theme: 'discover', title: 'Hanoi Hidden', caption: 'Maze-like old quarter, street pho, and silk lanterns', img: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800', credit: 'Unsplash' },
  { iata: 'CMN', theme: 'discover', title: 'Marrakech Medina', caption: 'Souks, riads, and the Djemaa el-Fna at sunset', img: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=800', credit: 'Unsplash' },
  { iata: 'LIM', theme: 'discover', title: 'Cusco & Beyond', caption: 'Gateway to Machu Picchu and Inca civilisation', img: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800', credit: 'Unsplash' },
]

async function main() {
  console.log(`\n🎬 Seeding ${reels.length} reels...\n`)

  let created = 0
  for (const r of reels) {
    try {
      // Check if reel already exists
      const existing = await prisma.$queryRaw<any[]>`
        SELECT id FROM "Reel" WHERE iata = ${r.iata} AND "themeSlug" = ${r.theme} LIMIT 1
      `
      if (existing.length > 0) {
        process.stdout.write('.')
        continue
      }

      // Insert reel
      const [reel] = await prisma.$queryRaw<any[]>`
        INSERT INTO "Reel" (iata, "themeSlug", title, caption, language, "isActive", "sortOrder", "updatedAt")
        VALUES (${r.iata}, ${r.theme}, ${r.title}, ${r.caption}, 'en', true, 0, NOW())
        RETURNING id
      `

      // Insert media
      await prisma.$queryRaw`
        INSERT INTO "ReelMedia" ("reelId", kind, "sourceUrl", credit, "sortOrder", "isActive")
        VALUES (${reel.id}, 'image', ${r.img}, ${r.credit}, 1, true)
      `

      created++
      process.stdout.write('✓')
    } catch (e: any) {
      process.stdout.write('✗')
      console.error(`\n  Error on ${r.iata}/${r.theme}: ${e.message}`)
    }
  }

  console.log(`\n\n✅ Done — ${created} reels created, ${reels.length - created} already existed`)

  // Quick verify
  const count = await prisma.$queryRaw<any[]>`SELECT COUNT(*) as n FROM "Reel"`
  console.log(`📊 Total reels in DB: ${count[0].n}`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
