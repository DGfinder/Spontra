import { useState } from "react";
import { ImageWithFallback } from "./components/figma/ImageWithFallback";
import { SearchCard } from "./components/SearchCard";
import { cn } from "./components/ui/utils";

export default function App() {
  const [currentVariant, setCurrentVariant] = useState<
    "compact" | "tall" | "mobile"
  >("compact");
  const [selectedTheme, setSelectedTheme] =
    useState("Adventure");

  const themeOverlays = {
    Adventure:
      "from-amber-900/40 via-orange-900/30 to-black/60",
    Nature: "from-emerald-900/40 via-teal-900/30 to-black/60",
    Indulge: "from-yellow-900/40 via-amber-900/30 to-black/60",
    Vibe: "from-pink-900/40 via-purple-900/30 to-black/60",
    Discover: "from-cyan-900/40 via-blue-900/30 to-black/60",
  };

  const themeContent = {
    Adventure: {
      title: "Thrilling Adventures Await",
      description:
        "From mountain treks to hidden canyons, uncover destinations packed with adrenaline and breathtaking views. Find trips that match your sense of adventure.",
    },
    Nature: {
      title: "Pristine Wilderness Calls",
      description:
        "Discover untouched landscapes, national parks, and eco-lodges where nature takes center stage. Perfect for those seeking tranquility.",
    },
    Indulge: {
      title: "Luxury Beyond Compare",
      description:
        "Five-star resorts, Michelin dining, and exclusive experiences await. Treat yourself to the finest destinations and accommodations.",
    },
    Vibe: {
      title: "Cultural Rhythms Beckon",
      description:
        "Feel the pulse of local music, festivals, and nightlife. Immerse yourself in destinations where culture and energy collide.",
    },
    Discover: {
      title: "Hidden Gems Unveiled",
      description:
        "Explore lesser-known destinations and off-the-beaten-path wonders. For travelers who seek the unique and extraordinary.",
    },
  };

  const handleThemeChange = (theme: string) => {
    setSelectedTheme(theme);
  };

  const currentOverlay =
    themeOverlays[selectedTheme as keyof typeof themeOverlays];
  const currentContent =
    themeContent[selectedTheme as keyof typeof themeContent];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Hero Background */}
      <div className="absolute inset-0 z-0">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1729875603718-afcae8014095?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3VudGFpbiUyMGFkdmVudHVyZSUyMGxhbmRzY2FwZSUyMGdvbGRlbiUyMGhvdXJ8ZW58MXx8fHwxNzU4ODUwNjc2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt="Mountain adventure landscape at golden hour"
          className="w-full h-full object-cover"
        />
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-br transition-all duration-300",
            currentOverlay,
          )}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 flex justify-between items-center p-6">
        <div className="flex items-center space-x-2">
          <h1 className="text-white text-xl font-bold tracking-wider">
            SPONTRA
          </h1>
          <span className="text-white/60">|</span>
          <span className="text-white/80">EXPLORE</span>
        </div>
        <button className="text-white/80 hover:text-white transition-colors text-sm">
          Sign In
        </button>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex items-start justify-start p-6 pt-8">
        <SearchCard
          variant={currentVariant}
          onThemeChange={handleThemeChange}
        />
      </main>

      {/* Variant Switcher (for demo purposes) */}
      <div className="fixed bottom-6 right-6 z-20 bg-black/60 backdrop-blur-sm rounded-lg p-3 space-y-2">
        <p className="text-white text-xs font-medium">
          Layout Variants:
        </p>
        <div className="flex flex-col gap-1">
          {(["compact", "tall", "mobile"] as const).map(
            (variant) => (
              <button
                key={variant}
                onClick={() => setCurrentVariant(variant)}
                className={cn(
                  "px-3 py-1 text-xs rounded transition-colors capitalize",
                  currentVariant === variant
                    ? "bg-yellow-400 text-gray-900"
                    : "bg-white/20 text-white hover:bg-white/30",
                )}
              >
                {variant}
              </button>
            ),
          )}
        </div>
      </div>

      {/* Dynamic Inspirational Card */}
      <div className="fixed top-1/2 right-6 transform -translate-y-1/2 z-10 hidden lg:block">
        <div className="bg-black/60 backdrop-blur-sm rounded-lg p-4 max-w-xs border border-white/20">
          <div className="flex items-start gap-3">
            <div
              className="w-2 h-2 rounded-full mt-2 flex-shrink-0 transition-colors duration-300"
              style={{
                backgroundColor:
                  selectedTheme === "Adventure"
                    ? "#FFC83A"
                    : selectedTheme === "Nature"
                      ? "#10B981"
                      : selectedTheme === "Indulge"
                        ? "#F59E0B"
                        : selectedTheme === "Vibe"
                          ? "#EC4899"
                          : "#06B6D4",
              }}
            />
            <div>
              <h3 className="text-white font-medium text-sm mb-2 transition-all duration-300">
                {currentContent.title}
              </h3>
              <p className="text-white/70 text-xs leading-relaxed transition-all duration-300">
                {currentContent.description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}