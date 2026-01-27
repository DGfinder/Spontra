import { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Reel, Destination, ThemeSlug } from '../../types';
import { THEMES } from '../../store/appStore';

const { width, height } = Dimensions.get('window');
const CARD_HEIGHT = height - 180; // Leave room for header and CTA

interface ContentCardProps {
  reel: Reel;
  destination: Destination;
  isActive: boolean;
  onPress: () => void;
  onFlyPress: () => void;
}

export function ContentCard({ reel, destination, isActive, onPress, onFlyPress }: ContentCardProps) {
  const media = reel.media[0];
  const isVideo = media?.kind === 'video';
  const [isPaused, setIsPaused] = useState(!isActive);

  // Video player for video content
  const player = useVideoPlayer(isVideo ? media.sourceUrl : null, (player) => {
    player.loop = true;
    player.muted = false;
  });

  useEffect(() => {
    if (isVideo && player) {
      if (isActive) {
        player.play();
      } else {
        player.pause();
      }
    }
  }, [isActive, isVideo, player]);

  const handlePress = () => {
    if (isVideo && player) {
      if (isPaused) {
        player.play();
      } else {
        player.pause();
      }
      setIsPaused(!isPaused);
    }
    onPress();
  };

  const theme = THEMES.find(t => t.id === reel.themeSlug);

  const formatFlightTime = (minutes?: number) => {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m flight`;
    if (mins === 0) return `${hours}h flight`;
    return `${hours}h ${mins}m flight`;
  };

  return (
    <Pressable style={styles.container} onPress={handlePress}>
      {/* Media Content */}
      <View style={styles.mediaContainer}>
        {isVideo && player ? (
          <VideoView
            player={player}
            style={styles.video}
            contentFit="cover"
            nativeControls={false}
          />
        ) : (
          <Image
            source={{ uri: media?.sourceUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        )}

        {/* Gradient Overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.9)']}
          style={styles.gradient}
          locations={[0, 0.5, 1]}
        />

        {/* Paused Indicator */}
        {isVideo && isPaused && isActive && (
          <View style={styles.pausedOverlay}>
            <View style={styles.playButton}>
              <Text style={styles.playIcon}>▶</Text>
            </View>
          </View>
        )}
      </View>

      {/* Content Info */}
      <Animated.View 
        entering={FadeIn.delay(200)}
        style={styles.infoContainer}
      >
        {/* Theme Badge */}
        {theme && (
          <LinearGradient
            colors={theme.gradient}
            style={styles.themeBadge}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.themeBadgeText}>
              {theme.emoji} {theme.name}
            </Text>
          </LinearGradient>
        )}

        {/* Destination */}
        <Text style={styles.cityName}>{destination.cityName}</Text>
        <Text style={styles.countryName}>{destination.countryName}</Text>

        {/* Flight Info */}
        {destination.flightDurationMinutes && (
          <View style={styles.flightInfo}>
            <Text style={styles.flightTime}>
              ✈️ {formatFlightTime(destination.flightDurationMinutes)}
            </Text>
            {destination.estimatedPrice && (
              <Text style={styles.price}>
                from {destination.currency || '€'}{destination.estimatedPrice}
              </Text>
            )}
          </View>
        )}

        {/* Attribution */}
        {media?.credit && (
          <Text style={styles.attribution}>📹 {media.credit}</Text>
        )}

        {/* Caption */}
        {reel.caption && (
          <Text style={styles.caption} numberOfLines={2}>
            {reel.caption}
          </Text>
        )}
      </Animated.View>

      {/* Fly There CTA */}
      <TouchableOpacity 
        style={styles.flyButton}
        onPress={onFlyPress}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#f97316', '#dc2626']}
          style={styles.flyButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={styles.flyButtonText}>✈️ Fly there</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width,
    height: CARD_HEIGHT,
    backgroundColor: '#0f172a',
  },
  mediaContainer: {
    flex: 1,
    position: 'relative',
  },
  video: {
    flex: 1,
  },
  image: {
    flex: 1,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '60%',
  },
  pausedOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  playButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    fontSize: 28,
    color: '#fff',
    marginLeft: 4,
  },
  infoContainer: {
    position: 'absolute',
    bottom: 90,
    left: 20,
    right: 20,
  },
  themeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  themeBadgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  cityName: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  countryName: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  flightInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 16,
  },
  flightTime: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '500',
  },
  price: {
    fontSize: 15,
    color: '#4ade80',
    fontWeight: '600',
  },
  attribution: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 12,
  },
  caption: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
    lineHeight: 20,
  },
  flyButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  flyButtonGradient: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  flyButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
});
