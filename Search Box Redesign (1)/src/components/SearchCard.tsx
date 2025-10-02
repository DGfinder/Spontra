import { useState, useEffect } from "react";
import { Mountain, Leaf, Utensils, Music, Compass, MapPin, Loader2 } from "lucide-react";
import { ThemeChip } from "./ThemeChip";
import { SegmentedControl } from "./SegmentedControl";
import { InputField } from "./InputField";
import { DateField } from "./DateField";
import { TravelerPopover } from "./TravelerPopover";
import { FlightTimeSlider } from "./FlightTimeSlider";
import { cn } from "./ui/utils";

interface SearchCardProps {
  variant?: "compact" | "tall" | "mobile";
  onThemeChange?: (theme: string) => void;
}

export function SearchCard({ variant = "compact", onThemeChange }: SearchCardProps) {
  const [selectedTheme, setSelectedTheme] = useState("Adventure");
  const [tripType, setTripType] = useState("Return");
  const [fromLocation, setFromLocation] = useState("LHR - London Heathrow");
  const [toLocation, setToLocation] = useState("");
  const [dates, setDates] = useState("12–18 Nov");
  const [passengers, setPassengers] = useState(1);
  const [cabin, setCabin] = useState("Economy");
  const [minTime, setMinTime] = useState(1);
  const [maxTime, setMaxTime] = useState(6);
  const [directOnly, setDirectOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const themes = [
    { icon: <Mountain className="w-5 h-5" />, label: "Adventure" },
    { icon: <Leaf className="w-5 h-5" />, label: "Nature" },
    { icon: <Utensils className="w-5 h-5" />, label: "Indulge" },
    { icon: <Music className="w-5 h-5" />, label: "Vibe" },
    { icon: <Compass className="w-5 h-5" />, label: "Discover" }
  ];

  const themeColors = {
    Adventure: "#FFC83A",
    Nature: "#10B981", 
    Indulge: "#F59E0B",
    Vibe: "#EC4899",
    Discover: "#06B6D4"
  };

  const getThemeSubtitle = (theme: string) => {
    const subtitles = {
      Adventure: "Thrilling adventures await.",
      Nature: "Explore untouched wilderness.",  
      Indulge: "Luxury experiences curated for you.",
      Vibe: "Feel the rhythm of new cultures.",
      Discover: "Uncover hidden gems worldwide."
    };
    return subtitles[theme as keyof typeof subtitles] || "";
  };

  const handleThemeChange = (theme: string) => {
    setSelectedTheme(theme);
    onThemeChange?.(theme);
  };

  const handleSearch = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  const handleClearDates = () => {
    setDates("");
  };

  const isTall = variant === "tall";
  const isMobile = variant === "mobile";
  const cardWidth = isMobile ? "w-full max-w-sm mx-4" : "w-full max-w-[420px]";
  const spacing = isTall ? "space-y-4" : "space-y-3";
  const padding = isTall ? "p-6" : "p-5";

  const themeColor = themeColors[selectedTheme as keyof typeof themeColors];

  return (
    <div 
      className={cn(
        "border rounded-2xl shadow-2xl relative transition-all duration-300",
        cardWidth,
        spacing,
        padding
      )}
      style={{
        backgroundColor: 'rgba(11, 15, 18, 0.84)',
        borderColor: `${themeColor}33`,
        boxShadow: `0 24px 48px rgba(0, 0, 0, 0.3), 0 8px 16px rgba(0, 0, 0, 0.2), 0 0 0 1px ${themeColor}22`
      }}
    >
      {/* Header */}
      <div className="space-y-2">
        <h1 
          className="font-semibold text-[#F3F6F9]"
          style={{ fontSize: '26px' }}
        >
          What are you looking for?
        </h1>
        <p 
          className="text-[#C9CFD6] transition-all duration-300"
          style={{ fontSize: '14px' }}
        >
          {getThemeSubtitle(selectedTheme)}
        </p>
      </div>

      {/* Theme Selector */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label 
            className="block uppercase tracking-[2%] font-medium text-[#C9CFD6]"
            style={{ fontSize: '12px' }}
          >
            Theme
          </label>
          <div 
            className="px-2 py-1 rounded-full text-[#A7AFB7] border border-[#FFFFFF1F]"
            style={{ fontSize: '11px' }}
          >
            Changes background
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {themes.map((theme) => (
            <ThemeChip
              key={theme.label}
              icon={theme.icon}
              label={theme.label}
              selected={selectedTheme === theme.label}
              onClick={() => handleThemeChange(theme.label)}
            />
          ))}
        </div>
      </div>

      {/* Single Column Form */}
      <div className={spacing}>
        {/* Trip Type */}
        <div className="space-y-2">
          <label 
            className="block uppercase tracking-[2%] font-medium text-[#C9CFD6]"
            style={{ fontSize: '12px' }}
          >
            Trip Type
          </label>
          <SegmentedControl
            options={["Return", "One way"]}
            value={tripType}
            onChange={setTripType}
          />
        </div>

        {/* Route */}
        <div className="grid grid-cols-2 gap-3">
          <InputField
            label="From"
            value={fromLocation}
            placeholder="Departure city"
            onChange={setFromLocation}
            icon={<MapPin className="w-4 h-4" />}
            onIconClick={() => {}}
          />
          <InputField
            label="To"
            value={toLocation}
            placeholder="Anywhere"
            onChange={setToLocation}
          />
        </div>

        {/* Dates */}
        <DateField
          label="Departure / Return"
          value={dates}
          onChange={setDates}
          tripType={tripType}
          onClear={dates ? handleClearDates : undefined}
        />

        {/* Travelers */}
        <TravelerPopover
          passengers={passengers}
          cabin={cabin}
          onPassengersChange={setPassengers}
          onCabinChange={setCabin}
        />

        {/* Flight Time & Direct */}
        {!isMobile && (
          <FlightTimeSlider
            minTime={minTime}
            maxTime={maxTime}
            onTimeChange={(min, max) => {
              setMinTime(min);
              setMaxTime(max);
            }}
            directOnly={directOnly}
            onDirectOnlyChange={setDirectOnly}
          />
        )}

        {/* Mobile Advanced Filters */}
        {isMobile && (
          <details className="group">
            <summary 
              className="cursor-pointer text-[#C9CFD6] hover:text-[#F3F6F9] transition-colors list-none flex items-center justify-between py-2"
              style={{ fontSize: '14px' }}
            >
              <span>Advanced</span>
              <span className="group-open:rotate-180 transition-transform">▾</span>
            </summary>
            <div className="mt-3 space-y-3">
              <FlightTimeSlider
                minTime={minTime}
                maxTime={maxTime}
                onTimeChange={(min, max) => {
                  setMinTime(min);
                  setMaxTime(max);
                }}
                directOnly={directOnly}
                onDirectOnlyChange={setDirectOnly}
              />
            </div>
          </details>
        )}
      </div>

      {/* CTA Section */}
      <div className="space-y-2 pt-4 border-t border-[#FFFFFF14]">
        <button
          onClick={handleSearch}
          disabled={!fromLocation || isLoading}
          className={cn(
            "w-full hover:opacity-90 disabled:opacity-50",
            "text-[#1A1A1A] font-bold h-12 rounded-lg transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-offset-0",
            "disabled:cursor-not-allowed flex items-center justify-center gap-2"
          )}
          style={{ 
            fontSize: '16px',
            backgroundColor: themeColor,
            focusRingColor: `${themeColor}33`
          }}
        >
          {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
          Search flights  
        </button>
        <div className="text-center">
          <button 
            className="text-[#C9CFD6] hover:text-[#F3F6F9] underline transition-colors"
            style={{ fontSize: '14px' }}
          >
            Explore Map
          </button>
        </div>
      </div>
    </div>
  );
}