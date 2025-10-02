import { cn } from "./ui/utils";

interface ThemeChipProps {
  icon: React.ReactNode;
  label: string;
  selected: boolean;
  onClick: () => void;
  themeColor?: string;
}

const themeColors = {
  Adventure: "#FFC83A",
  Nature: "#10B981", 
  Indulge: "#F59E0B",
  Vibe: "#EC4899",
  Discover: "#06B6D4"
};

export function ThemeChip({ icon, label, selected, onClick, themeColor }: ThemeChipProps) {
  const selectedColor = themeColors[label as keyof typeof themeColors] || "#FFC83A";
  
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-full border transition-all duration-300 h-[48px] flex-shrink-0",
        "hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-0",
        selected
          ? "text-[#1A1A1A] shadow-lg"
          : "bg-transparent text-[#E6E6E6] border-[#FFFFFF29] hover:border-[#FFFFFF40]"
      )}
      style={{ 
        fontSize: '15px',
        ...(selected ? {
          backgroundColor: selectedColor,
          borderColor: selectedColor,
          focusRingColor: `${selectedColor}33`
        } : {})
      }}
    >
      <span className="w-5 h-5">{icon}</span>
      <span className="font-medium whitespace-nowrap">{label}</span>
    </button>
  );
}