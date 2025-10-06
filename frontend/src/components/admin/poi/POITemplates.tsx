'use client'

import { Landmark, Utensils, Compass, Waves, Eye, Sparkles } from 'lucide-react'

export interface POITemplate {
  id: string
  name: string
  icon: typeof Landmark
  description: string
  defaultData: {
    name: string
    description: string
    caption: string
    altText: string
  }
}

export const POI_TEMPLATES: POITemplate[] = [
  {
    id: 'landmark',
    name: 'Landmark',
    icon: Landmark,
    description: 'Iconic buildings, monuments, or historical sites',
    defaultData: {
      name: 'Historic Landmark',
      description: 'A must-visit iconic location that defines the city\'s character and heritage.',
      caption: 'Experience {name} - a timeless symbol of {city}',
      altText: 'Historic landmark in city center'
    }
  },
  {
    id: 'restaurant',
    name: 'Restaurant',
    icon: Utensils,
    description: 'Dining experiences, cafes, or food spots',
    defaultData: {
      name: 'Local Restaurant',
      description: 'Authentic cuisine that captures the flavors and culture of the region.',
      caption: 'Taste the best of {city} at {name}',
      altText: 'Restaurant interior with local cuisine'
    }
  },
  {
    id: 'activity',
    name: 'Activity',
    icon: Compass,
    description: 'Tours, adventures, or experiences',
    defaultData: {
      name: 'Guided Tour',
      description: 'An exciting adventure that showcases the best of what the area has to offer.',
      caption: 'Discover {name} - your unforgettable {city} experience',
      altText: 'Adventure activity in scenic location'
    }
  },
  {
    id: 'beach',
    name: 'Beach',
    icon: Waves,
    description: 'Coastal spots, beaches, or waterfront',
    defaultData: {
      name: 'Pristine Beach',
      description: 'Crystal-clear waters and golden sands perfect for relaxation and water activities.',
      caption: 'Relax at {name} - paradise in {city}',
      altText: 'Tropical beach with clear blue water'
    }
  },
  {
    id: 'viewpoint',
    name: 'Viewpoint',
    icon: Eye,
    description: 'Scenic overlooks or panoramic spots',
    defaultData: {
      name: 'Scenic Viewpoint',
      description: 'Breathtaking panoramic views that offer the perfect photo opportunity.',
      caption: 'Capture stunning views from {name} in {city}',
      altText: 'Panoramic city view from elevated viewpoint'
    }
  },
  {
    id: 'custom',
    name: 'Custom',
    icon: Sparkles,
    description: 'Start from scratch with a blank POI',
    defaultData: {
      name: '',
      description: '',
      caption: '',
      altText: ''
    }
  }
]

interface POITemplatesProps {
  onSelectTemplate: (template: POITemplate) => void
  onCancel: () => void
}

export function POITemplates({ onSelectTemplate, onCancel }: POITemplatesProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white mb-2">Choose a Template</h3>
        <p className="text-white/60 text-sm">
          Select a template to quickly create a POI with pre-filled content, or start from scratch.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {POI_TEMPLATES.map((template) => {
          const Icon = template.icon

          return (
            <button
              key={template.id}
              onClick={() => onSelectTemplate(template)}
              className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg transition-all text-left group"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white/10 rounded-lg group-hover:bg-white/20 transition-colors">
                  <Icon className="w-5 h-5 text-white/70" />
                </div>

                <div className="flex-1">
                  <h4 className="text-white font-medium mb-1">{template.name}</h4>
                  <p className="text-white/60 text-sm">{template.description}</p>

                  {template.id !== 'custom' && (
                    <div className="mt-3 pt-3 border-t border-white/10 space-y-1">
                      <div className="text-xs text-white/40">Includes:</div>
                      <div className="flex flex-wrap gap-2">
                        <span className="text-xs px-2 py-1 bg-white/5 rounded text-white/60">
                          Name template
                        </span>
                        <span className="text-xs px-2 py-1 bg-white/5 rounded text-white/60">
                          Description
                        </span>
                        <span className="text-xs px-2 py-1 bg-white/5 rounded text-white/60">
                          SEO caption
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-white/70 hover:text-white transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
