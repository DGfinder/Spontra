import { cn } from "./ui/utils";

interface ChipGroupProps {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}

export function ChipGroup({ label, options, value, onChange }: ChipGroupProps) {
  return (
    <div className="space-y-2">
      <label 
        className="block uppercase tracking-[2%] font-medium text-[#C9CFD6]"
        style={{ fontSize: '12px' }}
      >
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={cn(
              "px-3 py-2 rounded-full border transition-all duration-200 min-h-[44px]",
              "focus:outline-none focus:ring-2 focus:ring-[#FFC83A]/20 focus:ring-offset-0",
              value === option
                ? "bg-[#FFC83A] text-[#1A1A1A] border-[#FFC83A]"
                : "bg-transparent text-[#E6E6E6] border-[#FFFFFF29] hover:border-[#FFFFFF40]"
            )}
            style={{ fontSize: '14px' }}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}