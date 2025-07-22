import { useSearchHistory, useSearchActions, useFormData } from '@/store/searchStore'

export function SearchHistory() {
  const searchHistory = useSearchHistory()
  const { updateFormData, clearHistory, removeFromHistory } = useSearchActions()
  const currentFormData = useFormData()

  const handleReplaySearch = (historyItem: any) => {
    updateFormData(historyItem.formData)
  }

  if (searchHistory.length === 0) {
    return (
      <div className="text-white/60 text-sm text-center py-4">
        No recent searches
      </div>
    )
  }

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-medium">Recent Searches</h3>
        <button
          onClick={clearHistory}
          className="text-white/60 hover:text-white text-xs"
        >
          Clear All
        </button>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {searchHistory.slice(0, 10).map((search) => (
          <div
            key={search.id}
            className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors cursor-pointer"
            onClick={() => handleReplaySearch(search)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-white text-sm font-medium">
                  {search.formData.departureAirport} → Anywhere
                </div>
                <div className="text-white/60 text-xs">
                  {search.formData.selectedTheme} • max {search.formData.maxFlightTime}h • {search.resultCount} results
                </div>
                <div className="text-white/40 text-xs">
                  {new Date(search.timestamp).toLocaleDateString()}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  removeFromHistory(search.id)
                }}
                className="text-white/40 hover:text-red-400 ml-2"
                aria-label="Remove from history"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}