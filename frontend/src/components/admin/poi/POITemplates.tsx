'use client'

import { Sparkles } from 'lucide-react'
import { getTemplatesForTheme, type POITemplate } from '@/lib/constants/poi-templates'

// Re-export POITemplate type for compatibility
export type { POITemplate }

interface POITemplatesProps {
  theme: string
  onSelectTemplate: (template: POITemplate) => void
  onCancel: () => void
}

export function POITemplates({ theme, onSelectTemplate, onCancel }: POITemplatesProps) {
  // Get theme-specific templates
  const themeTemplates = getTemplatesForTheme(theme)

  // Add custom template at the end
  const customTemplate: POITemplate = {
    id: 'custom',
    theme,
    category: 'Custom',
    icon: Sparkles,
    description: 'Start from scratch with a blank POI',
    defaultData: {
      name: '',
      description: '',
      caption: '',
      altText: ''
    }
  }

  const allTemplates = [...themeTemplates, customTemplate]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white mb-2">Choose a Template</h3>
        <p className="text-white/60 text-sm">
          Select a template to quickly create a POI for this theme, or start from scratch.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {allTemplates.map((template) => {
          const Icon = template.icon

          return (
            <button
              key={template.id}
              onClick={() => onSelectTemplate(template)}
              className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg transition-all text-left group"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white/10 rounded-lg group-hover:bg-white/20 transition-colors shrink-0">
                  <Icon className="w-5 h-5 text-white/70" />
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-medium mb-1 truncate">{template.category}</h4>
                  <p className="text-white/60 text-xs line-clamp-2">{template.description}</p>

                  {template.id !== 'custom' && (
                    <div className="mt-2 pt-2 border-t border-white/10">
                      <div className="flex flex-wrap gap-1">
                        <span className="text-[10px] px-1.5 py-0.5 bg-white/5 rounded text-white/50">
                          Pre-filled
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-white/5 rounded text-white/50">
                          SEO ready
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
