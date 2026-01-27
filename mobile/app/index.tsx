import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  TextInput,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useAppStore, THEMES } from '../store/appStore';
import { ThemeSlug } from '../types';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const {
    originAirport,
    maxFlightMinutes,
    selectedTheme,
    setOriginAirport,
    setMaxFlightMinutes,
    setSelectedTheme,
  } = useAppStore();

  const [airportSearch, setAirportSearch] = useState(originAirport || '');

  const handleThemeSelect = (theme: ThemeSlug) => {
    setSelectedTheme(theme);
  };

  const handleExplore = () => {
    if (!selectedTheme) return;
    router.push('/feed');
  };

  const formatFlightTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  return (
    <LinearGradient
      colors={['#0f172a', '#1e293b', '#0f172a']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View entering={FadeIn.delay(100)} style={styles.header}>
            <Text style={styles.logo}>Spontra</Text>
            <Text style={styles.tagline}>Travel spontaneously</Text>
          </Animated.View>

          {/* Origin Airport */}
          <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
            <Text style={styles.sectionTitle}>Flying from</Text>
            <TextInput
              style={styles.airportInput}
              placeholder="Enter your airport (e.g. LHR, CDG, SIN)"
              placeholderTextColor="#64748b"
              value={airportSearch}
              onChangeText={(text) => {
                setAirportSearch(text.toUpperCase());
                if (text.length === 3) {
                  setOriginAirport(text.toUpperCase());
                }
              }}
              autoCapitalize="characters"
              maxLength={3}
            />
          </Animated.View>

          {/* Flight Time */}
          <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
            <Text style={styles.sectionTitle}>Max flight time</Text>
            <View style={styles.flightTimeContainer}>
              {[60, 120, 180, 240, 300].map((minutes) => (
                <TouchableOpacity
                  key={minutes}
                  style={[
                    styles.flightTimeButton,
                    maxFlightMinutes === minutes && styles.flightTimeButtonActive,
                  ]}
                  onPress={() => setMaxFlightMinutes(minutes)}
                >
                  <Text
                    style={[
                      styles.flightTimeText,
                      maxFlightMinutes === minutes && styles.flightTimeTextActive,
                    ]}
                  >
                    {formatFlightTime(minutes)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          {/* Theme Selection */}
          <Animated.View entering={FadeInDown.delay(400)} style={styles.section}>
            <Text style={styles.sectionTitle}>What are you looking for?</Text>
            <View style={styles.themesContainer}>
              {THEMES.map((theme, index) => (
                <Animated.View
                  key={theme.id}
                  entering={FadeInDown.delay(500 + index * 100)}
                >
                  <TouchableOpacity
                    onPress={() => handleThemeSelect(theme.id)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={
                        selectedTheme === theme.id
                          ? theme.gradient
                          : ['#1e293b', '#334155']
                      }
                      style={[
                        styles.themeCard,
                        selectedTheme === theme.id && styles.themeCardSelected,
                      ]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text style={styles.themeEmoji}>{theme.emoji}</Text>
                      <Text style={styles.themeName}>{theme.name}</Text>
                      <Text style={styles.themeDescription}>{theme.description}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          </Animated.View>

          {/* Explore Button */}
          <Animated.View entering={FadeInDown.delay(1000)} style={styles.exploreContainer}>
            <TouchableOpacity
              onPress={handleExplore}
              disabled={!selectedTheme || !originAirport}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={
                  selectedTheme && originAirport
                    ? ['#f97316', '#dc2626']
                    : ['#475569', '#334155']
                }
                style={styles.exploreButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.exploreText}>
                  {selectedTheme ? `Explore ${THEMES.find(t => t.id === selectedTheme)?.name}` : 'Select a vibe'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  logo: {
    fontSize: 42,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 16,
    color: '#94a3b8',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 12,
  },
  airportInput: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#334155',
    textAlign: 'center',
    letterSpacing: 4,
    fontWeight: '600',
  },
  flightTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  flightTimeButton: {
    backgroundColor: '#1e293b',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    minWidth: (width - 60) / 5 - 8,
    alignItems: 'center',
  },
  flightTimeButtonActive: {
    backgroundColor: '#f97316',
    borderColor: '#f97316',
  },
  flightTimeText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  flightTimeTextActive: {
    color: '#fff',
  },
  themesContainer: {
    gap: 12,
  },
  themeCard: {
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themeCardSelected: {
    borderColor: '#fff',
  },
  themeEmoji: {
    fontSize: 32,
    marginRight: 14,
  },
  themeName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
  },
  themeDescription: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    position: 'absolute',
    bottom: 8,
    left: 62,
  },
  exploreContainer: {
    marginTop: 20,
  },
  exploreButton: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  exploreText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
});
