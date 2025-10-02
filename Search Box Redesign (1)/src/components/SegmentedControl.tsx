import { cn } from "./ui/utils";

interface SegmentedControlProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
}

export function SegmentedControl({ options, value, onChange }: SegmentedControlProps) {
  return (
    <div className="flex border border-[#FFFFFF1F] rounded-lg p-1">
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onChange(option)}
          className={cn(
            "flex-1 px-4 py-2 rounded-md transition-all duration-200 min-h-[44px]",
            "focus:outline-none focus:ring-2 focus:ring-[#FFC83A]/20 focus:ring-offset-0",
            value === option
              ? "bg-[#22272B] text-[#F3F6F9]"
              : "text-[#C9CFD6] hover:bg-[#FFFFFF0A]"
          )}
          style={{ fontSize: '14px' }}
        >
          {option}
        </button>
      ))}
    </div>
  );
}