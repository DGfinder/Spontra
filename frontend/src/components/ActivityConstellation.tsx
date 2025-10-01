'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Clock, DollarSign, Users, Calendar, Play, Video, Plus } from 'lucide-react'
import { ExplorationProgress } from './ExplorationProgress'
import { VideoModal } from './VideoModal'
import { YouTubeVideo } from '../services/youtubeService'
import { getThemeColor, getThemeHoverColor, type ThemeKey } from '@/lib/theme'
import { DestinationRecommendation } from '@/services/apiClient'

interface ActivityOption {
  id: string
  name: string
  description: string
  image: string
  duration: string
  priceRange: string
  difficulty: 'Easy' | 'Moderate' | 'Challenging'
  bestTime: string
  groupSize: string
  category: 'adventure' | 'culture' | 'food' | 'nightlife' | 'nature' | 'shopping'
  videos?: YouTubeVideo[]
  hasVideo?: boolean
}

interface ActivityConstellationProps {
  recommendation: DestinationRecommendation
  originAirport: string
  onBack: () => void
  onActivitySelect?: (activity: ActivityOption) => void
  onBookFlight?: (recommendation: DestinationRecommendation) => void
  themeKey?: ThemeKey
}

interface ActivityCircleProps {
  activity: ActivityOption
  position: { x: number; y: number }
  onClick?: () => void
  onVideoClick?: () => void
}

function ActivityCircle({ activity, position, onClick, onVideoClick }: ActivityCircleProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [showMobileDetails, setShowMobileDetails] = useState(false)

  const handleTouch = (e: React.TouchEvent) => {
    e.preventDefault()
    setShowMobileDetails(!showMobileDetails)
  }

  const handleClick = (e: React.MouseEvent) => {
    if (window.innerWidth >= 768) {
      onClick?.()
    } else {
      setShowMobileDetails(!showMobileDetails)
    }
  }

  return (
    <div
      className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-500 hover:scale-110 animate-in fade-in zoom-in duration-700"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        animationDelay: `${Math.random() * 0.4}s`,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouch}
      onClick={handleClick}
    >
      {/* Activity Circle with Image - Touch-friendly size */}
      <div className="relative">
        <div className="w-32 h-32 sm:w-28 sm:h-28 rounded-full overflow-hidden border-3 border-yellow-400 hover:border-yellow-300 hover:shadow-lg hover:shadow-yellow-400/30 transition-all duration-300 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 backdrop-blur-sm">
          {/* Placeholder for activity image */}
          <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center relative overflow-hidden">
            {/* Activity Category Icon as Background */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-4xl opacity-30">
                {activity.category === 'adventure' ? '🏔️' : 
                 activity.category === 'culture' ? '🏛️' : 
                 activity.category === 'food' ? '🍽️' : 
                 activity.category === 'nightlife' ? '🌃' : 
                 activity.category === 'nature' ? '🌿' : 
                 activity.category === 'shopping' ? '🛍️' : ''}
              </div>
            </div>
            
            {/* Activity Name Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-2 text-center">
              <div className="font-semibold leading-tight">{activity.name}</div>
            </div>

            {/* Video Play Button Overlay */}
            {activity.hasVideo && (
              <div className="absolute inset-0 flex items-center justify-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onVideoClick?.()
                  }}
                  className="w-12 h-12 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-all duration-300 hover:scale-110"
                >
                  <Play size={16} fill="currentColor" />
                </button>
              </div>
            )}

            {/* Video Indicator Badge */}
            {activity.hasVideo && (
              <div className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                <Video size={12} className="text-white" />
              </div>
            )}
          </div>
        </div>

        {/* Activity Details - Desktop hover or Mobile touch */}
        {(isHovered || showMobileDetails) && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 w-72 sm:w-64 bg-black/95 backdrop-blur-sm text-white p-4 sm:p-3 rounded-lg text-sm sm:text-xs z-50 animate-in fade-in slide-in-from-bottom-2 duration-200 border border-white/20">
            {/* Mobile close button */}
            {showMobileDetails && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowMobileDetails(false)
                }}
                className="absolute top-2 right-2 sm:hidden w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-white/70 hover:text-white"
              >
                ×
              </button>
            )}
            <div className="font-semibold text-yellow-400 mb-2 text-sm">
              {activity.name}
            </div>
            
            <p className="text-white/90 mb-3 leading-relaxed text-xs">
              {activity.description}
            </p>

            <div className="grid grid-cols-2 gap-2 text-white/80">
              <div className="flex items-center space-x-1">
                <Clock size={12} />
                <span>{activity.duration}</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <DollarSign size={12} />
                <span className="text-green-400">{activity.priceRange}</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <Users size={12} />
                <span>{activity.groupSize}</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <Calendar size={12} />
                <span>{activity.bestTime}</span>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-white/20">
              <div className="flex justify-between items-center text-xs">
                <span className="text-white/70">Difficulty:</span>
                <span className={`font-medium ${
                  activity.difficulty === 'Easy' ? 'text-green-400' :
                  activity.difficulty === 'Moderate' ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {activity.difficulty}
                </span>
              </div>
              
              {activity.hasVideo && activity.videos && (
                <div className="flex justify-between items-center text-xs mt-2">
                  <span className="text-white/70">Videos:</span>
                  <span className="text-red-400 font-medium flex items-center space-x-1">
                    <Video size={10} />
                    <span>{activity.videos.length} available</span>
                  </span>
                </div>
              )}
              
              {/* Mobile action buttons */}
              <div className="mt-3 pt-2 border-t border-white/20 space-y-2">
                {/* Select Activity Button - Mobile only */}
                {showMobileDetails && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onClick?.()
                      setShowMobileDetails(false)
                    }}
                    className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 text-black font-semibold rounded px-3 py-2 text-sm transition-all duration-200 flex items-center justify-center space-x-1"
                  >
                    <span>Select This Activity</span>
                  </button>
                )}
                
              </div>
            </div>

            {/* Tooltip Arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/90"></div>
          </div>
        )}
      </div>
    </div>
  )
}

function CentralDestinationCircle({ recommendation }: { recommendation: DestinationRecommendation }) {
  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-in fade-in zoom-in duration-500">
      <div className="w-32 h-32 bg-gradient-to-br from-white/15 to-gray-300/10 border-2 border-white/60 rounded-full flex items-center justify-center backdrop-blur-sm shadow-lg">
        <div className="text-center">
          <div className="text-white/80 text-xs mb-1 font-medium">Explore</div>
          <div className="text-white font-bold text-lg leading-tight">
            {recommendation.destination.city_name}
          </div>
          <div className="text-yellow-300 text-sm mt-1 font-semibold">
            {recommendation.destination.country_name}
          </div>
        </div>
      </div>
    </div>
  )
}

export function ActivityConstellation({ recommendation, originAirport, onBack, onActivitySelect, onBookFlight, themeKey = 'adventure' }: ActivityConstellationProps) {
  const [activities, setActivities] = useState<ActivityOption[]>([])
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false)
  const [selectedActivityForVideo, setSelectedActivityForVideo] = useState<ActivityOption | null>(null)

  // Parse activities from destination.activities JSON based on current theme
  useEffect(() => {
    async function loadActivities() {
      try {
        const { db } = await import('@/server/db')

        // Fetch full destination with activities
        const destination = await db.destination.findUnique({
          where: {
            airportCode: recommendation.destination.airport_code
          }
        })

        if (!destination || !destination.activities) {
          setActivities([])
          return
        }

        // Parse activities JSON - expected format: { "adventure": [...], "culture": [...], etc }
        const activitiesData = destination.activities as any
        const themeActivities = activitiesData[themeKey] || []

        // Transform to ActivityOption format
        const parsedActivities: ActivityOption[] = themeActivities.map((poi: any) => ({
          id: poi.name || poi.id || Math.random().toString(),
          name: poi.name,
          description: poi.description || '',
          image: poi.imageUrl || poi.image || '',
          duration: poi.duration || '2-3 hours',
          priceRange: poi.priceRange || poi.price || '€20-40',
          difficulty: poi.difficulty || 'Easy',
          bestTime: poi.bestTime || 'Year-round',
          groupSize: poi.groupSize || '2-10 people',
          category: themeKey,
          videos: poi.youtubeId ? [{
            id: { videoId: poi.youtubeId },
            snippet: {
              title: poi.name,
              description: poi.description,
              thumbnails: {
                high: { url: poi.imageUrl || '' }
              }
            }
          }] : [],
          hasVideo: !!poi.youtubeId
        }))

        setActivities(parsedActivities)
      } catch (error) {
        console.error('Failed to load activities:', error)
        setActivities([])
      }
    }

    loadActivities()
  }, [recommendation.destination.airport_code, themeKey])

  const handleVideoClick = (activity: ActivityOption) => {
    setSelectedActivityForVideo(activity)
    setIsVideoModalOpen(true)
  }

  const handleCloseVideoModal = () => {
    setIsVideoModalOpen(false)
    setSelectedActivityForVideo(null)
  }

  const handleBookActivityFromVideo = () => {
    if (selectedActivityForVideo) {
      onActivitySelect?.(selectedActivityForVideo)
      handleCloseVideoModal()
    }
  }


  // Calculate positions for activities in constellation pattern
  const getConstellationPositions = (count: number) => {
    const positions = []
    const centerX = 50
    const centerY = 50
    
    if (count <= 5) {
      // Pentagon/circular arrangement for 5 or fewer activities
      const radius = 30
      
      for (let i = 0; i < count; i++) {
        const angle = (i * 2 * Math.PI) / count - Math.PI / 2 // Start at top
        positions.push({
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
        })
      }
    } else {
      // Two-ring constellation for more activities
      const innerRadius = 24
      const outerRadius = 38
      const innerCount = Math.min(5, Math.floor(count / 2))
      const outerCount = count - innerCount
      
      // Inner ring
      for (let i = 0; i < innerCount; i++) {
        const angle = (i * 2 * Math.PI) / innerCount - Math.PI / 2
        positions.push({
          x: centerX + innerRadius * Math.cos(angle),
          y: centerY + innerRadius * Math.sin(angle),
        })
      }
      
      // Outer ring
      for (let i = 0; i < outerCount; i++) {
        const angle = (i * 2 * Math.PI) / outerCount - Math.PI / 2 + Math.PI / outerCount
        positions.push({
          x: centerX + outerRadius * Math.cos(angle),
          y: centerY + outerRadius * Math.sin(angle),
        })
      }
    }
    
    return positions
  }

  const positions = getConstellationPositions(activities.length)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-96 h-96 rounded-full blur-3xl" style={{ background: getThemeColor(themeKey) }}></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full blur-3xl" style={{ background: getThemeHoverColor(themeKey) }}></div>
      </div>

      {/* Progress Indicator */}
      <ExplorationProgress 
        currentStep="activities"
        destination={recommendation.destination}
      />

      {/* Responsive Header */}
      <header className="relative z-10 p-4 sm:p-6 border-b border-white/10">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <button 
            onClick={onBack}
            className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors min-h-[44px] px-2"
          >
            <ArrowLeft size={20} />
            <span className="hidden sm:inline">Back to Cities</span>
            <span className="sm:hidden">Back</span>
          </button>
          
          <div className="text-center flex-1 mx-4">
            <h1 className="text-lg sm:text-2xl font-bold">EXPLORE ACTIVITIES</h1>
            <p className="text-white/60 text-xs sm:text-sm mt-1">
              Choose activities in {recommendation.destination.city_name}
            </p>
          </div>
          
          <div className="flex space-x-2 sm:space-x-3">
            
            <button 
              onClick={() => onBookFlight?.(recommendation)}
              className="text-black font-semibold px-4 sm:px-6 py-2 rounded-lg transition-all duration-300 min-h-[44px]"
              style={{ backgroundImage: `linear-gradient(90deg, ${getThemeColor(themeKey)}, ${getThemeHoverColor(themeKey)})` }}
            >
              <span className="hidden sm:inline">Book Flight</span>
              <span className="sm:hidden">Book</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Constellation Area */}
      <main className="relative z-10 flex-1 h-screen">
        <div className="relative w-full h-full">
          {/* Instructions */}
          <div className="absolute top-4 sm:top-8 left-1/2 transform -translate-x-1/2 z-10 px-4">
            <p className="text-white/60 text-xs sm:text-sm text-center tracking-wider">
              <span className="hidden sm:inline">Hover over activities to see details • Click to add to your itinerary</span>
              <span className="sm:hidden">Tap activities to see details and select them</span>
            </p>
          </div>

          {/* Central Destination Circle */}
          <CentralDestinationCircle recommendation={recommendation} />

          {/* Activity Circles */}
          {activities.map((activity, index) => (
            <ActivityCircle
              key={activity.id}
              activity={activity}
              position={positions[index]}
              onClick={() => onActivitySelect?.(activity)}
              onVideoClick={() => handleVideoClick(activity)}
            />
          ))}

          {/* Loading Indicator for Videos */}
          {isLoadingVideos && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 mt-20">
              <div className="bg-black/40 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm flex items-center space-x-2">
                <div className="animate-spin w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full"></div>
                <span>Loading activity videos...</span>
              </div>
            </div>
          )}

          {/* Flight Info Summary */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
            <div className="bg-black/40 backdrop-blur-sm text-white px-8 py-3 rounded-full text-sm tracking-wide font-medium border border-white/20">
              <span className="text-white/70">Flight from {originAirport}:</span>
              <span className="ml-2 text-yellow-400">
                {Math.round(recommendation.flight_route.total_duration_minutes / 60 * 10) / 10}h
              </span>
              <span className="ml-4 text-green-400">
                from {recommendation.estimated_flight_price || '€250'}
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Video Modal */}
      {selectedActivityForVideo && (
        <VideoModal
          isOpen={isVideoModalOpen}
          videos={selectedActivityForVideo.videos || []}
          activityName={selectedActivityForVideo.name}
          destinationName={`${recommendation.destination.city_name}, ${recommendation.destination.country_name}`}
          onClose={handleCloseVideoModal}
          onBookActivity={handleBookActivityFromVideo}
        />
      )}

    </div>
  )
}