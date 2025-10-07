export interface ContinentConfig {
  name: string
  countries: string[]
  emoji: string
  color: string
}

export const CONTINENTS: ContinentConfig[] = [
  {
    name: 'Africa',
    emoji: '🌍',
    color: '#f59e0b',
    countries: [
      'Algeria', 'Angola', 'Benin', 'Botswana', 'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cameroon',
      'Central African Republic', 'Chad', 'Comoros', 'Congo', 'Democratic Republic of the Congo',
      'Djibouti', 'Egypt', 'Equatorial Guinea', 'Eritrea', 'Eswatini', 'Ethiopia', 'Gabon', 'Gambia',
      'Ghana', 'Guinea', 'Guinea-Bissau', 'Ivory Coast', 'Kenya', 'Lesotho', 'Liberia', 'Libya',
      'Madagascar', 'Malawi', 'Mali', 'Mauritania', 'Mauritius', 'Morocco', 'Mozambique', 'Namibia',
      'Niger', 'Nigeria', 'Rwanda', 'Sao Tome and Principe', 'Senegal', 'Seychelles', 'Sierra Leone',
      'Somalia', 'South Africa', 'South Sudan', 'Sudan', 'Tanzania', 'Togo', 'Tunisia', 'Uganda',
      'Zambia', 'Zimbabwe'
    ]
  },
  {
    name: 'Asia',
    emoji: '🌏',
    color: '#ef4444',
    countries: [
      'Afghanistan', 'Armenia', 'Azerbaijan', 'Bahrain', 'Bangladesh', 'Bhutan', 'Brunei', 'Cambodia',
      'China', 'Georgia', 'Hong Kong', 'India', 'Indonesia', 'Iran', 'Iraq', 'Israel', 'Japan',
      'Jordan', 'Kazakhstan', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Lebanon', 'Macau', 'Malaysia',
      'Maldives', 'Mongolia', 'Myanmar', 'Nepal', 'North Korea', 'Oman', 'Pakistan', 'Palestine',
      'Philippines', 'Qatar', 'Saudi Arabia', 'Singapore', 'South Korea', 'Sri Lanka', 'Syria',
      'Taiwan', 'Tajikistan', 'Thailand', 'Timor-Leste', 'Turkey', 'Turkmenistan', 'United Arab Emirates',
      'Uzbekistan', 'Vietnam', 'Yemen'
    ]
  },
  {
    name: 'Europe',
    emoji: '🇪🇺',
    color: '#3b82f6',
    countries: [
      'Albania', 'Andorra', 'Austria', 'Belarus', 'Belgium', 'Bosnia and Herzegovina', 'Bulgaria',
      'Croatia', 'Cyprus', 'Czech Republic', 'Czechia', 'Denmark', 'Estonia', 'Finland', 'France',
      'Germany', 'Greece', 'Hungary', 'Iceland', 'Ireland', 'Italy', 'Kosovo', 'Latvia', 'Liechtenstein',
      'Lithuania', 'Luxembourg', 'Malta', 'Moldova', 'Monaco', 'Montenegro', 'Netherlands', 'North Macedonia',
      'Norway', 'Poland', 'Portugal', 'Romania', 'Russia', 'San Marino', 'Serbia', 'Slovakia', 'Slovenia',
      'Spain', 'Sweden', 'Switzerland', 'Ukraine', 'United Kingdom', 'Vatican City'
    ]
  },
  {
    name: 'North America',
    emoji: '🌎',
    color: '#10b981',
    countries: [
      'Antigua and Barbuda', 'Bahamas', 'Barbados', 'Belize', 'Canada', 'Costa Rica', 'Cuba',
      'Dominica', 'Dominican Republic', 'El Salvador', 'Grenada', 'Guatemala', 'Haiti', 'Honduras',
      'Jamaica', 'Mexico', 'Nicaragua', 'Panama', 'Saint Kitts and Nevis', 'Saint Lucia',
      'Saint Vincent and the Grenadines', 'Trinidad and Tobago', 'United States', 'USA'
    ]
  },
  {
    name: 'South America',
    emoji: '🌎',
    color: '#8b5cf6',
    countries: [
      'Argentina', 'Bolivia', 'Brazil', 'Chile', 'Colombia', 'Ecuador', 'Guyana', 'Paraguay',
      'Peru', 'Suriname', 'Uruguay', 'Venezuela'
    ]
  },
  {
    name: 'Oceania',
    emoji: '🏝️',
    color: '#06b6d4',
    countries: [
      'Australia', 'Fiji', 'Kiribati', 'Marshall Islands', 'Micronesia', 'Nauru', 'New Zealand',
      'Palau', 'Papua New Guinea', 'Samoa', 'Solomon Islands', 'Tonga', 'Tuvalu', 'Vanuatu'
    ]
  },
  {
    name: 'Antarctica',
    emoji: '❄️',
    color: '#64748b',
    countries: ['Antarctica']
  }
]

// Helper function to get continent for a country
export function getContinentForCountry(countryName: string): ContinentConfig | null {
  for (const continent of CONTINENTS) {
    if (continent.countries.includes(countryName)) {
      return continent
    }
  }
  return null
}

// Helper to get continent name or "Other" if not found
export function getContinentName(countryName: string): string {
  const continent = getContinentForCountry(countryName)
  return continent?.name || 'Other'
}
