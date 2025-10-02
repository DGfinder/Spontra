import { cn } from "./ui/utils";

interface InputFieldProps {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  icon?: React.ReactNode;
  onIconClick?: () => void;
  disabled?: boolean;
}

export function InputField({
  label,
  value,
  placeholder,
  onChange,
  icon,
  onIconClick,
  disabled = false
}: InputFieldProps) {
  return (
    <div className="space-y-1">
      <label 
        className="block uppercase tracking-[2%] font-medium text-[#C9CFD6]"
        style={{ fontSize: '12px' }}
      >
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#C9CFD6]">
            {icon}
          </div>
        )}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "w-full bg-transparent border border-[#FFFFFF1F] rounded-lg py-3 transition-all duration-200 min-h-[44px]",
            "text-[#F3F6F9] placeholder:text-[#A7AFB7]",
            "focus:outline-none focus:ring-2 focus:ring-[#FFC83A]/20 focus:ring-offset-0",
            "focus:border-[#FFC83A] hover:border-[#FFFFFF30]",
            icon ? "pl-10 pr-4" : "px-4",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          style={{ fontSize: '14px' }}
        />
        {onIconClick && (
          <button
            onClick={onIconClick}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#C9CFD6] hover:text-[#F3F6F9] transition-colors p-1 min-h-[44px] flex items-center"
          >
            <span className="w-4 h-4">📍</span>
          </button>
        )}
      </div>
    </div>
  );
}