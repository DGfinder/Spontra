export interface AircraftInfo {
  code: string
  name: string
  manufacturer: string
  type: 'narrow-body' | 'wide-body' | 'regional'
  seatConfiguration: {
    economy: string
    premiumEconomy?: string
    business?: string
    first?: string
  }
  range: string
  wingspan: string
  length: string
  imageUrl?: string
  seatMapUrl?: string
  capacity: {
    typical: number
    maximum: number
  }
}

export const AIRCRAFT_DATA: Record<string, AircraftInfo> = {
  'A320': {
    code: 'A320',
    name: 'Airbus A320',
    manufacturer: 'Airbus',
    type: 'narrow-body',
    seatConfiguration: {
      economy: '3-3',
      business: '2-2'
    },
    range: '6,150 km',
    wingspan: '35.8 m',
    length: '37.6 m',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/A320_Air_France_F-GKXT.jpg/1200px-A320_Air_France_F-GKXT.jpg',
    capacity: {
      typical: 150,
      maximum: 180
    }
  },
  'A321': {
    code: 'A321',
    name: 'Airbus A321',
    manufacturer: 'Airbus',
    type: 'narrow-body',
    seatConfiguration: {
      economy: '3-3',
      business: '2-2'
    },
    range: '7,400 km',
    wingspan: '35.8 m',
    length: '44.5 m',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Lufthansa_Airbus_A321-200_D-AIDE.jpg/1200px-Lufthansa_Airbus_A321-200_D-AIDE.jpg',
    capacity: {
      typical: 185,
      maximum: 220
    }
  },
  'A330': {
    code: 'A330',
    name: 'Airbus A330',
    manufacturer: 'Airbus',
    type: 'wide-body',
    seatConfiguration: {
      economy: '2-4-2',
      premiumEconomy: '2-3-2',
      business: '2-2-2',
      first: '1-2-1'
    },
    range: '13,430 km',
    wingspan: '60.3 m',
    length: '63.7 m',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Air_France_Airbus_A330-203_F-GZCF.jpg/1200px-Air_France_Airbus_A330-203_F-GZCF.jpg',
    capacity: {
      typical: 250,
      maximum: 300
    }
  },
  'A350': {
    code: 'A350',
    name: 'Airbus A350',
    manufacturer: 'Airbus',
    type: 'wide-body',
    seatConfiguration: {
      economy: '3-3-3',
      premiumEconomy: '2-4-2',
      business: '1-2-1',
      first: '1-1-1'
    },
    range: '15,000 km',
    wingspan: '64.8 m',
    length: '66.8 m',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Qatar_Airways_Airbus_A350-941_A7-ALZ.jpg/1200px-Qatar_Airways_Airbus_A350-941_A7-ALZ.jpg',
    capacity: {
      typical: 280,
      maximum: 350
    }
  },
  'B737': {
    code: 'B737',
    name: 'Boeing 737',
    manufacturer: 'Boeing',
    type: 'narrow-body',
    seatConfiguration: {
      economy: '3-3',
      business: '2-2'
    },
    range: '6,570 km',
    wingspan: '35.8 m',
    length: '39.5 m',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Ryanair_Boeing_737-8AS_EI-ENP.jpg/1200px-Ryanair_Boeing_737-8AS_EI-ENP.jpg',
    capacity: {
      typical: 160,
      maximum: 189
    }
  },
  'B738': {
    code: 'B738',
    name: 'Boeing 737-800',
    manufacturer: 'Boeing',
    type: 'narrow-body',
    seatConfiguration: {
      economy: '3-3',
      business: '2-2'
    },
    range: '5,765 km',
    wingspan: '35.8 m',
    length: '39.5 m',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/KLM_Boeing_737-800_PH-BXG.jpg/1200px-KLM_Boeing_737-800_PH-BXG.jpg',
    capacity: {
      typical: 162,
      maximum: 189
    }
  },
  'B777': {
    code: 'B777',
    name: 'Boeing 777',
    manufacturer: 'Boeing',
    type: 'wide-body',
    seatConfiguration: {
      economy: '3-3-3',
      premiumEconomy: '2-4-2',
      business: '2-2-2',
      first: '1-2-1'
    },
    range: '17,370 km',
    wingspan: '64.8 m',
    length: '73.9 m',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Emirates_Boeing_777-300ER_A6-ECF.jpg/1200px-Emirates_Boeing_777-300ER_A6-ECF.jpg',
    capacity: {
      typical: 300,
      maximum: 396
    }
  },
  'B787': {
    code: 'B787',
    name: 'Boeing 787 Dreamliner',
    manufacturer: 'Boeing',
    type: 'wide-body',
    seatConfiguration: {
      economy: '3-3-3',
      premiumEconomy: '2-3-2',
      business: '1-2-1',
      first: '1-1-1'
    },
    range: '14,800 km',
    wingspan: '60.1 m',
    length: '62.8 m',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/British_Airways_Boeing_787-8_G-ZBJB.jpg/1200px-British_Airways_Boeing_787-8_G-ZBJB.jpg',
    capacity: {
      typical: 250,
      maximum: 330
    }
  },
  'E190': {
    code: 'E190',
    name: 'Embraer E190',
    manufacturer: 'Embraer',
    type: 'regional',
    seatConfiguration: {
      economy: '2-2'
    },
    range: '4,260 km',
    wingspan: '28.7 m',
    length: '36.2 m',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/KLM_Cityhopper_Embraer_ERJ-190STD_PH-EZK.jpg/1200px-KLM_Cityhopper_Embraer_ERJ-190STD_PH-EZK.jpg',
    capacity: {
      typical: 100,
      maximum: 114
    }
  },
  'ATR': {
    code: 'ATR',
    name: 'ATR 72',
    manufacturer: 'ATR',
    type: 'regional',
    seatConfiguration: {
      economy: '2-2'
    },
    range: '1,665 km',
    wingspan: '27.1 m',
    length: '27.2 m',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Air_France_HOP%21_ATR_72-500_F-GVZN.jpg/1200px-Air_France_HOP%21_ATR_72-500_F-GVZN.jpg',
    capacity: {
      typical: 68,
      maximum: 78
    }
  }
}

// Helper functions
export function getAircraftInfo(code: string): AircraftInfo | null {
  // Handle variations in aircraft codes
  const normalizedCode = code.toUpperCase().replace(/[-\s]/g, '')
  
  // Direct match
  if (AIRCRAFT_DATA[normalizedCode]) {
    return AIRCRAFT_DATA[normalizedCode]
  }
  
  // Try partial matches for common variants
  for (const aircraftCode in AIRCRAFT_DATA) {
    if (normalizedCode.startsWith(aircraftCode) || aircraftCode.startsWith(normalizedCode)) {
      return AIRCRAFT_DATA[aircraftCode]
    }
  }
  
  return null
}

export function getAircraftByType(type: 'narrow-body' | 'wide-body' | 'regional'): AircraftInfo[] {
  return Object.values(AIRCRAFT_DATA).filter(aircraft => aircraft.type === type)
}

export function getSeatConfiguration(aircraftCode: string, cabinClass: 'economy' | 'premiumEconomy' | 'business' | 'first'): string | null {
  const aircraft = getAircraftInfo(aircraftCode)
  if (!aircraft) return null
  
  return aircraft.seatConfiguration[cabinClass] || aircraft.seatConfiguration.economy
}

export function getAircraftCapacity(aircraftCode: string): { typical: number; maximum: number } {
  const aircraft = getAircraftInfo(aircraftCode)
  return aircraft?.capacity || { typical: 150, maximum: 180 }
}