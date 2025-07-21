'use client'

import { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight, ExternalLink, Calendar, Eye } from 'lucide-react'
import { YouTubeVideo } from '../services/youtubeService'

interface VideoModalProps {
  isOpen: boolean
  videos: YouTubeVideo[]
  activityName: string
  destinationName: string
  onClose: () => void
  onBookActivity?: () => void
}

export function VideoModal({ 
  isOpen, 
  videos, 
  activityName, 
  destinationName,
  onClose, 
  onBookActivity 
}: VideoModalProps) {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const currentVideo = videos[currentVideoIndex]

  useEffect(() => {
    if (isOpen) {
      setCurrentVideoIndex(0)
      setIsLoading(true)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const nextVideo = () => {
    setCurrentVideoIndex((prev) => (prev + 1) % videos.length)
    setIsLoading(true)
  }

  const prevVideo = () => {
    setCurrentVideoIndex((prev) => (prev - 1 + videos.length) % videos.length)
    setIsLoading(true)
  }

  const handleVideoLoad = () => {
    setIsLoading(false)
  }

  const getVideoEmbedUrl = (videoId: string) => {
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&cc_load_policy=1`
  }

  const getVideoWatchUrl = (videoId: string) => {
    return `https://www.youtube.com/watch?v=${videoId}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (!isOpen || !currentVideo) return null

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* Constellation Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-96 h-96 bg-yellow-400 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-orange-500 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-white/10 rounded-full"></div>
      </div>

      {/* Modal Content */}
      <div className="relative w-full max-w-5xl bg-black/60 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">
              {activityName} in {destinationName}
            </h2>
            <p className="text-white/60 text-sm">
              {videos.length} video{videos.length !== 1 ? 's' : ''} found
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {videos.length > 1 && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={prevVideo}
                  className="p-2 text-white/60 hover:text-white transition-colors"
                  disabled={videos.length <= 1}
                >
                  <ChevronLeft size={20} />
                </button>
                
                <span className="text-white/80 text-sm">
                  {currentVideoIndex + 1} / {videos.length}
                </span>
                
                <button
                  onClick={nextVideo}
                  className="p-2 text-white/60 hover:text-white transition-colors"
                  disabled={videos.length <= 1}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
            
            <button
              onClick={onClose}
              className="p-2 text-white/60 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Video Content */}
        <div className="grid lg:grid-cols-3 gap-6 p-6">
          {/* Video Player */}
          <div className="lg:col-span-2">
            <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                  <div className="animate-spin w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full"></div>
                </div>
              )}
              
              <iframe
                src={getVideoEmbedUrl(currentVideo.id)}
                title={currentVideo.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                onLoad={handleVideoLoad}
              />
            </div>
          </div>

          {/* Video Info & Actions */}
          <div className="space-y-6">
            {/* Current Video Details */}
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
              <h3 className="text-white font-semibold mb-2 leading-tight">
                {currentVideo.title}
              </h3>
              
              <div className="flex items-center space-x-4 text-white/60 text-sm mb-3">
                <div className="flex items-center space-x-1">
                  <Calendar size={14} />
                  <span>{formatDate(currentVideo.publishedAt)}</span>
                </div>
              </div>
              
              <p className="text-white/80 text-sm leading-relaxed mb-4">
                {currentVideo.description.slice(0, 150)}
                {currentVideo.description.length > 150 && '...'}
              </p>
              
              <div className="flex items-center justify-between">
                <span className="text-white/60 text-xs">
                  by {currentVideo.channelTitle}
                </span>
                
                <a
                  href={getVideoWatchUrl(currentVideo.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 text-yellow-400 hover:text-yellow-300 text-xs transition-colors"
                >
                  <ExternalLink size={12} />
                  <span>Watch on YouTube</span>
                </a>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={onBookActivity}
                className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-semibold py-3 px-4 rounded-lg hover:from-yellow-300 hover:to-orange-400 transition-all duration-300"
              >
                Book This Activity
              </button>
              
              <button
                onClick={onClose}
                className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-300"
              >
                Back to Activities
              </button>
            </div>

            {/* Video Thumbnails (if multiple videos) */}
            {videos.length > 1 && (
              <div className="space-y-3">
                <h4 className="text-white font-medium text-sm">More Videos</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {videos.map((video, index) => (
                    <button
                      key={video.id}
                      onClick={() => {
                        setCurrentVideoIndex(index)
                        setIsLoading(true)
                      }}
                      className={`w-full flex items-center space-x-3 p-2 rounded-lg transition-all duration-200 ${
                        index === currentVideoIndex
                          ? 'bg-yellow-400/20 border border-yellow-400/50'
                          : 'bg-white/5 hover:bg-white/10 border border-transparent'
                      }`}
                    >
                      <img
                        src={video.thumbnail.url}
                        alt={video.title}
                        className="w-16 h-9 object-cover rounded flex-shrink-0"
                      />
                      <div className="text-left flex-1 min-w-0">
                        <p className="text-white text-xs font-medium truncate">
                          {video.title}
                        </p>
                        <p className="text-white/60 text-xs truncate">
                          {video.channelTitle}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}