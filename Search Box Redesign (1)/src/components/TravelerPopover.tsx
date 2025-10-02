import { useState } from "react";
import { Users, ChevronDown } from "lucide-react";
import { cn } from "./ui/utils";

interface TravelerPopoverProps {
  passengers: number;
  cabin: string;
  onPassengersChange: (passengers: number) => void;
  onCabinChange: (cabin: string) => void;
}

export function TravelerPopover({
  passengers,
  cabin,
  onPassengersChange,
  onCabinChange
}: TravelerPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const cabinOptions = ["Economy", "Premium", "Business", "First"];

  return (
    <div className="space-y-1">
      <label 
        className="block uppercase tracking-[2%] font-medium text-[#C9CFD6]"
        style={{ fontSize: '12px' }}
      >
        Travelers
      </label>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-full bg-transparent border border-[#FFFFFF1F] rounded-lg px-4 py-3",
            "text-[#F3F6F9] transition-all duration-200 min-h-[44px] flex items-center justify-between",
            "focus:outline-none focus:ring-2 focus:ring-[#FFC83A]/20 focus:ring-offset-0",
            "focus:border-[#FFC83A] hover:border-[#FFFFFF30]"
          )}
          style={{ fontSize: '14px' }}
        >
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#C9CFD6]" />
            <span>{passengers} passenger{passengers !== 1 ? 's' : ''} • {cabin}</span>
          </div>
          <ChevronDown className={cn("w-4 h-4 text-[#C9CFD6] transition-transform", isOpen && "rotate-180")} />
        </button>
        
        {isOpen && (
          <div className="mt-1 space-y-3 bg-[#0B0F12]/95 border border-[#FFFFFF1F] rounded-lg p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[#F3F6F9]" style={{ fontSize: '14px' }}>Passengers</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onPassengersChange(Math.max(1, passengers - 1))}
                  className="w-8 h-8 bg-[#FFFFFF1F] rounded-full flex items-center justify-center text-[#F3F6F9] hover:bg-[#FFFFFF2F] transition-colors"
                  style={{ fontSize: '14px' }}
                >
                  -
                </button>
                <span className="text-[#F3F6F9] w-8 text-center" style={{ fontSize: '14px' }}>{passengers}</span>
                <button
                  onClick={() => onPassengersChange(passengers + 1)}
                  className="w-8 h-8 bg-[#FFFFFF1F] rounded-full flex items-center justify-center text-[#F3F6F9] hover:bg-[#FFFFFF2F] transition-colors"
                  style={{ fontSize: '14px' }}
                >
                  +
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <span className="text-[#F3F6F9]" style={{ fontSize: '14px' }}>Cabin Class</span>
              <div className="grid grid-cols-2 gap-2">
                {cabinOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      onCabinChange(option);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "px-3 py-2 rounded-md transition-colors min-h-[44px]",
                      cabin === option
                        ? "bg-[#FFC83A] text-[#1A1A1A]"
                        : "bg-[#FFFFFF1F] text-[#F3F6F9] hover:bg-[#FFFFFF2F]"
                    )}
                    style={{ fontSize: '14px' }}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}