import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useAppStore } from '../../store/appStore';
import { api } from '../../services/api';
import { FlightOffer } from '../../types';

export default function DestinationScreen() {
  const router = useRouter();
  const { iata } = useLocalSearchParams<{ iata: string }>();
  const { originAirport, selectedDestination } = useAppStore();

  const [flights, setFlights] = useState<FlightOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // Default to next weekend
    const today = new Date();
    const daysUntilFriday = (5 - today.getDay() + 7) % 7 || 7;
    const nextFriday = new Date(today);
    nextFriday.setDate(today.getDate() + daysUntilFriday);
    return nextFriday.toISOString().split('T')[0];
  });

  useEffect(() => {
    if (originAirport && iata) {
      searchFlights();
    }
  }, [originAirport, iata, selectedDate]);

  const searchFlights = async () => {
    if (!originAirport || !iata) return;

    setIsLoading(true);
    try {
      const results = await api.searchFlights({
        origin: originAirport,
        destination: iata,
        departureDate: selectedDate,
        passengers: 1,
        travelClass: 'ECONOMY',
      });
      setFlights(results);
    } catch (error) {
      console.error('Flight search failed:', error);
      // Mock flights for development
      setFlights([
        {
          id: '1',
          origin: originAirport,
          destination: iata,
          departureDate: selectedDate,
          price: 89,
          currency: 'EUR',
          departureTime: '06:30',
          arrivalTime: '09:45',
          duration: 'PT2H15M',
          stops: 0,
          carrierCode: 'FR',
          flightNumber: '1234',
          aircraftType: 'A320',
        },
        {
          id: '2',
          origin: originAirport,
          destination: iata,
          departureDate: selectedDate,
          price: 125,
          currency: 'EUR',
          departureTime: '14:20',
          arrivalTime: '17:35',
          duration: 'PT2H15M',
          stops: 0,
          carrierCode: 'BA',
          flightNumber: '5678',
          aircraftType: 'A321',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookFlight = async (flight: FlightOffer) => {
    try {
      const { url } = await api.getBookingUrl({
        origin: originAirport!,
        destination: iata,
        departureDate: selectedDate,
        passengers: 1,
        cabinClass: 'ECONOMY',
        carrierCode: flight.carrierCode,
      });
      
      await Linking.openURL(url);
    } catch (error) {
      console.error('Failed to get booking URL:', error);
      // Fallback to Google Flights
      const googleUrl = `https://www.google.com/travel/flights?q=flights+from+${originAirport}+to+${iata}+on+${selectedDate}`;
      await Linking.openURL(googleUrl);
    }
  };

  const formatDuration = (iso: string) => {
    const match = iso.match(/PT(\d+)H(\d+)?M?/);
    if (match) {
      const hours = match[1];
      const minutes = match[2] || '0';
      return `${hours}h ${minutes}m`;
    }
    return iso;
  };

  const getQuickDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i + 1);
      dates.push({
        date: date.toISOString().split('T')[0],
        label: i === 0 ? 'Tomorrow' : date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
      });
    }
    return dates;
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {selectedDestination?.cityName || iata}
        </Text>
        <View style={{ width: 44 }} />
      </SafeAreaView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Destination Info */}
        <Animated.View entering={FadeIn} style={styles.destinationInfo}>
          <Text style={styles.cityName}>{selectedDestination?.cityName || iata}</Text>
          <Text style={styles.countryName}>{selectedDestination?.countryName}</Text>
          {selectedDestination?.flightDurationMinutes && (
            <Text style={styles.flightDuration}>
              ✈️ ~{Math.round(selectedDestination.flightDurationMinutes / 60)}h flight from {originAirport}
            </Text>
          )}
        </Animated.View>

        {/* Date Selector */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.dateSection}>
          <Text style={styles.sectionTitle}>When do you want to go?</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.datesContainer}
          >
            {getQuickDates().map((item) => (
              <TouchableOpacity
                key={item.date}
                style={[
                  styles.dateButton,
                  selectedDate === item.date && styles.dateButtonActive,
                ]}
                onPress={() => setSelectedDate(item.date)}
              >
                <Text style={[
                  styles.dateText,
                  selectedDate === item.date && styles.dateTextActive,
                ]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Flights */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.flightsSection}>
          <Text style={styles.sectionTitle}>Available flights</Text>
          
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#f97316" />
              <Text style={styles.loadingText}>Searching flights...</Text>
            </View>
          ) : flights.length > 0 ? (
            <View style={styles.flightsList}>
              {flights.map((flight, index) => (
                <Animated.View
                  key={flight.id}
                  entering={FadeInDown.delay(300 + index * 100)}
                >
                  <TouchableOpacity
                    style={styles.flightCard}
                    onPress={() => handleBookFlight(flight)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.flightMain}>
                      <View style={styles.flightTimes}>
                        <Text style={styles.flightTime}>{flight.departureTime}</Text>
                        <View style={styles.flightLine}>
                          <View style={styles.dot} />
                          <View style={styles.line} />
                          <Text style={styles.flightDurationText}>
                            {formatDuration(flight.duration)}
                          </Text>
                          <View style={styles.line} />
                          <View style={styles.dot} />
                        </View>
                        <Text style={styles.flightTime}>{flight.arrivalTime}</Text>
                      </View>
                      
                      <View style={styles.flightDetails}>
                        <Text style={styles.carrierCode}>
                          {flight.carrierCode} {flight.flightNumber}
                        </Text>
                        <Text style={styles.stopsText}>
                          {flight.stops === 0 ? 'Direct' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.flightPrice}>
                      <Text style={styles.priceText}>
                        €{flight.price}
                      </Text>
                      <Text style={styles.bookText}>Book →</Text>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          ) : (
            <View style={styles.noFlights}>
              <Text style={styles.noFlightsText}>No flights found for this date</Text>
              <Text style={styles.noFlightsSubtext}>Try a different date</Text>
            </View>
          )}
        </Animated.View>

        {/* Compare Prices CTA */}
        <Animated.View entering={FadeInDown.delay(500)} style={styles.compareSection}>
          <TouchableOpacity
            style={styles.compareButton}
            onPress={() => {
              const url = `https://www.google.com/travel/flights?q=flights+from+${originAirport}+to+${iata}`;
              Linking.openURL(url);
            }}
          >
            <Text style={styles.compareText}>🔍 Compare all prices on Google Flights</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    color: '#fff',
    fontSize: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  destinationInfo: {
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  cityName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
  },
  countryName: {
    fontSize: 18,
    color: '#94a3b8',
    marginTop: 4,
  },
  flightDuration: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
  },
  dateSection: {
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 12,
  },
  datesContainer: {
    gap: 8,
  },
  dateButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#1e293b',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  dateButtonActive: {
    backgroundColor: '#f97316',
    borderColor: '#f97316',
  },
  dateText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '500',
  },
  dateTextActive: {
    color: '#fff',
  },
  flightsSection: {
    paddingVertical: 20,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 10,
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  flightsList: {
    gap: 12,
  },
  flightCard: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  flightMain: {
    flex: 1,
  },
  flightTimes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flightTime: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  flightLine: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#64748b',
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#334155',
  },
  flightDurationText: {
    fontSize: 11,
    color: '#64748b',
    marginHorizontal: 6,
  },
  flightDetails: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  carrierCode: {
    fontSize: 13,
    color: '#94a3b8',
  },
  stopsText: {
    fontSize: 13,
    color: '#4ade80',
  },
  flightPrice: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
  },
  bookText: {
    fontSize: 13,
    color: '#f97316',
    marginTop: 4,
  },
  noFlights: {
    padding: 30,
    alignItems: 'center',
  },
  noFlightsText: {
    color: '#94a3b8',
    fontSize: 16,
  },
  noFlightsSubtext: {
    color: '#64748b',
    fontSize: 14,
    marginTop: 4,
  },
  compareSection: {
    paddingVertical: 20,
    paddingBottom: 40,
  },
  compareButton: {
    backgroundColor: '#1e293b',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  compareText: {
    color: '#94a3b8',
    fontSize: 15,
  },
});
