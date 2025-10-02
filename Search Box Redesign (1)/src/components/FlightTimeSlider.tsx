import { cn } from "./ui/utils";

interface FlightTimeSliderProps {
  minTime: number;
  maxTime: number;
  onTimeChange: (min: number, max: number) => void;
  directOnly: boolean;
  onDirectOnlyChange: (direct: boolean) => void;
}

export function FlightTimeSlider({
  minTime,
  maxTime,
  onTimeChange,
  directOnly,
  onDirectOnlyChange
}: FlightTimeSliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label 
          className="uppercase tracking-[2%] font-medium text-[#C9CFD6]"
          style={{ fontSize: '12px' }}
        >
          Flight Time + Direct
        </label>
        <div className="flex items-center gap-4">
          <span className="text-[#F3F6F9]" style={{ fontSize: '14px' }}>{minTime}h–{maxTime}h</span>
          <button
            onClick={() => onDirectOnlyChange(!directOnly)}
            className={cn(
              "flex items-center gap-2 transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-[#FFC83A]/20 focus:ring-offset-0 rounded py-1",
              directOnly ? "text-[#FFC83A]" : "text-[#C9CFD6] hover:text-[#F3F6F9]"
            )}
            style={{ fontSize: '14px' }}
          >
            <div className={cn(
              "w-4 h-4 border border-[#FFFFFF30] rounded flex items-center justify-center",
              directOnly && "bg-[#FFC83A] border-[#FFC83A]"
            )}>
              {directOnly && <div className="w-2 h-2 bg-[#1A1A1A] rounded" />}
            </div>
            Only direct
          </button>
        </div>
      </div>
      
      <div className="relative">
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="1"
            max="12"
            value={minTime}
            onChange={(e) => onTimeChange(Number(e.target.value), maxTime)}
            className="flex-1 h-2 bg-[#FFFFFF1F] rounded-lg appearance-none cursor-pointer slider"
          />
          <input
            type="range"
            min="1"
            max="12"
            value={maxTime}
            onChange={(e) => onTimeChange(minTime, Number(e.target.value))}
            className="flex-1 h-2 bg-[#FFFFFF1F] rounded-lg appearance-none cursor-pointer slider"
          />
        </div>
        <div className="flex justify-between text-[#A7AFB7] mt-1" style={{ fontSize: '12px' }}>
          <span>1h</span>
          <span>12h</span>
        </div>
      </div>
      
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #FFC83A;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
        }
        
        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #FFC83A;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </div>
  );
}