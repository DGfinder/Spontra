import { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FlatList } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useAppStore, THEMES } from '../store/appStore';
import { ContentCard } from '../components/feed/ContentCard';
import { api } from '../services/api';
import { ContentItem, Reel, Destination } from '../types';

const { width, height } = Dimensions.get('window');
const CARD_HEIGHT = height - 180;

// Mock data for development - replace with API calls
const MOCK_CONTENT: ContentItem[] = [
  {
    id: '1',
    theme: 'adventure',
    destination: {
      iata: 'BCN',
      cityName: 'Barcelona',
      countryName: 'Spain',
      countryCode: 'ES',
      flightDurationMinutes: 145,
      estimatedPrice: 89,
      currency: '€',
    },
    reel: {
      id: 'r1',
      iata: 'BCN',
      themeSlug: 'adventure',
      title: 'Barcelona Adventures',
      caption: 'From mountain hikes to coastal walks, Barcelona has it all',
      language: 'en',
      isActive: true,
      sortOrder: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      media: [{
        id: 'm1',
        reelId: 'r1',
        kind: 'image',
        sourceUrl: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800',
        sortOrder: 1,
        isActive: true,
        credit: '@travelphotographer',
      }],
    },
  },
  {
    id: '2',
    theme: 'adventure',
    destination: {
      iata: 'LIS',
      cityName: 'Lisbon',
      countryName: 'Portugal',
      countryCode: 'PT',
      flightDurationMinutes: 165,
      estimatedPrice: 75,
      currency: '€',
    },
    reel: {
      id: 'r2',
      iata: 'LIS',
      themeSlug: 'adventure',
      title: 'Lisbon Vibes',
      caption: 'Surf, hike, and explore the vibrant streets',
      language: 'en',
      isActive: true,
      sortOrder: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      media: [{
        id: 'm2',
        reelId: 'r2',
        kind: 'image',
        sourceUrl: 'https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=800',
        sortOrder: 1,
        isActive: true,
        credit: '@lisbonexplorer',
      }],
    },
  },
  {
    id: '3',
    theme: 'adventure',
    destination: {
      iata: 'ATH',
      cityName: 'Athens',
      countryName: 'Greece',
      countryCode: 'GR',
      flightDurationMinutes: 195,
      estimatedPrice: 95,
      currency: '€',
    },
    reel: {
      id: 'r3',
      iata: 'ATH',
      themeSlug: 'adventure',
      title: 'Athens Awaits',
      caption: 'Ancient ruins meet modern adventures',
      language: 'en',
      isActive: true,
      sortOrder: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      media: [{
        id: 'm3',
        reelId: 'r3',
        kind: 'image',
        sourceUrl: 'https://images.unsplash.com/photo-1555993539-1732b0258235?w=800',
        sortOrder: 1,
        isActive: true,
        credit: '@greecetravel',
      }],
    },
  },
];

export default function FeedScreen() {
  const router = useRouter();
  const {
    originAirport,
    maxFlightMinutes,
    selectedTheme,
    feedContent,
    currentIndex,
    isLoading,
    setFeedContent,
    setCurrentIndex,
    setIsLoading,
    setSelectedDestination,
  } = useAppStore();

  const listRef = useRef<FlatList<ContentItem>>(null);
  const [viewableIndex, setViewableIndex] = useState(0);

  const theme = THEMES.find(t => t.id === selectedTheme);

  useEffect(() => {
    loadContent();
  }, [selectedTheme, originAirport, maxFlightMinutes]);

  const loadContent = async () => {
    if (!selectedTheme || !originAirport) return;

    setIsLoading(true);
    try {
      // Try to fetch from real API
      const data = await api.getFeedContent({
        origin: originAirport,
        theme: selectedTheme,
        maxFlightMinutes,
        limit: 20,
      });
      
      if (data && data.length > 0) {
        setFeedContent(data);
      } else {
        // Fallback to mock data if no curated content yet
        console.log('No curated content found, using mock data');
        const mockFiltered = MOCK_CONTENT.filter(item => item.theme === selectedTheme);
        setFeedContent(mockFiltered.length > 0 ? mockFiltered : MOCK_CONTENT);
      }
    } catch (error) {
      console.error('Failed to load feed content:', error);
      // Use mock data as fallback
      const mockFiltered = MOCK_CONTENT.filter(item => item.theme === selectedTheme);
      setFeedContent(mockFiltered.length > 0 ? mockFiltered : MOCK_CONTENT);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const index = viewableItems[0].index;
      setViewableIndex(index);
      setCurrentIndex(index);
    }
  }, []);

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  const handleCardPress = (item: ContentItem) => {
    // Could expand for more details
    console.log('Card pressed:', item.destination.cityName);
  };

  const handleFlyPress = (item: ContentItem) => {
    setSelectedDestination(item.destination);
    router.push(`/destination/${item.destination.iata}`);
  };

  const renderItem = useCallback(({ item, index }: { item: ContentItem; index: number }) => (
    <ContentCard
      reel={item.reel}
      destination={item.destination}
      isActive={index === viewableIndex}
      onPress={() => handleCardPress(item)}
      onFlyPress={() => handleFlyPress(item)}
    />
  ), [viewableIndex]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={styles.loadingText}>Finding your perfect destinations...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <SafeAreaView edges={['top']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        
        <Animated.View entering={FadeIn} style={styles.headerCenter}>
          <Text style={styles.headerEmoji}>{theme?.emoji}</Text>
          <Text style={styles.headerTitle}>{theme?.name}</Text>
        </Animated.View>

        <View style={styles.headerRight}>
          <Text style={styles.counterText}>
            {viewableIndex + 1}/{feedContent.length}
          </Text>
        </View>
      </SafeAreaView>

      {/* Content Feed */}
      <FlatList
        ref={listRef}
        data={feedContent}
        renderItem={renderItem}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={CARD_HEIGHT}
        decelerationRate="fast"
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        keyExtractor={(item) => item.id}
        getItemLayout={(_, index) => ({
          length: CARD_HEIGHT,
          offset: CARD_HEIGHT * index,
          index,
        })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backButton: {
    padding: 8,
  },
  backText: {
    color: '#fff',
    fontSize: 16,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerEmoji: {
    fontSize: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  headerRight: {
    padding: 8,
  },
  counterText: {
    color: '#94a3b8',
    fontSize: 14,
  },
});
