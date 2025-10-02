import { Calendar, X } from "lucide-react";
import { cn } from "./ui/utils";

interface DateFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  tripType: "Return" | "One way";
  onClear?: () => void;
}

export function DateField({ label, value, onChange, tripType, onClear }: DateFieldProps) {
  const getPlaceholder = () => {
    if (tripType === "One way") {
      return "Select departure date";
    }
    return value ? "Select dates" : "Select dates";
  };

  const getAriaLabel = () => {
    return tripType === "Return" ? "Dates, select range" : "Departure date, select single date";
  };

  return (
    <div className="space-y-1">
      <label 
        className="block uppercase tracking-[2%] font-medium text-[#C9CFD6]"
        style={{ fontSize: '12px' }}
      >
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={getPlaceholder()}
          aria-label={getAriaLabel()}
          className={cn(
            "w-full bg-transparent border border-[#FFFFFF1F] rounded-lg px-4 py-3 pr-20",
            "text-[#F3F6F9] placeholder:text-[#A7AFB7] transition-all duration-200 min-h-[44px]",
            "focus:outline-none focus:ring-2 focus:ring-[#FFC83A]/20 focus:ring-offset-0",
            "focus:border-[#FFC83A] hover:border-[#FFFFFF30]"
          )}
          style={{ fontSize: '14px' }}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
          {value && onClear && (
            <button
              onClick={onClear}
              className="text-[#C9CFD6] hover:text-[#F3F6F9] transition-colors p-1 min-h-[44px] flex items-center"
              aria-label="Clear dates"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <Calendar className="w-4 h-4 text-[#C9CFD6]" />
        </div>
      </div>
    </div>
  );
}