import { Calendar, Check } from "lucide-react";
import { cn } from "./ui/utils";

interface DatePickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  flexibleDates: boolean;
  onFlexibleDatesChange: (flexible: boolean) => void;
}

export function DatePicker({
  label,
  value,
  onChange,
  flexibleDates,
  onFlexibleDatesChange
}: DatePickerProps) {
  return (
    <div className="space-y-2">
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
          placeholder="Select departure date"
          className={cn(
            "w-full bg-transparent border border-[#FFFFFF1F] rounded-lg px-4 py-3 pr-12",
            "text-[#F3F6F9] placeholder:text-[#A7AFB7] transition-all duration-200 min-h-[44px]",
            "focus:outline-none focus:ring-2 focus:ring-[#FFC83A]/20 focus:ring-offset-0",
            "focus:border-[#FFC83A] hover:border-[#FFFFFF30]"
          )}
          style={{ fontSize: '14px' }}
        />
        <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#C9CFD6]" />
      </div>
      
      <div className="flex items-center">
        <button
          onClick={() => onFlexibleDatesChange(!flexibleDates)}
          className={cn(
            "flex items-center gap-2 transition-colors py-1",
            "focus:outline-none focus:ring-2 focus:ring-[#FFC83A]/20 focus:ring-offset-0 rounded",
            flexibleDates ? "text-[#FFC83A]" : "text-[#C9CFD6] hover:text-[#F3F6F9]"
          )}
          style={{ fontSize: '14px' }}
        >
          <div className={cn(
            "w-4 h-4 border border-[#FFFFFF30] rounded flex items-center justify-center",
            flexibleDates && "bg-[#FFC83A] border-[#FFC83A]"
          )}>
            {flexibleDates && <Check className="w-3 h-3 text-[#1A1A1A]" />}
          </div>
          Flexible dates
        </button>
      </div>
    </div>
  );
}