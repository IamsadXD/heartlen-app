interface MetricsCardProps {
  title: string;
  value: number | string | { bpm?: number; sdnn?: number }; 
  unit?: string;
  confidence?: number; 
  bgColor?: string; 
  secondaryValue?: string; 
}

export default function MetricsCard({
  title,
  value,
  unit,
  confidence,
  bgColor = "bg-white", 
  secondaryValue,
}: MetricsCardProps) {
  const isDarkBg = bgColor !== "bg-white";
  const textColor = isDarkBg ? "text-white" : "text-gray-800";
  const subTextColor = isDarkBg ? "text-white opacity-80" : "text-gray-500";

  return (
    <div className={`${bgColor} p-4 rounded-lg shadow flex-1 min-w-[150px]`}>
      <h3 className={`font-bold ${textColor}`}>{title}</h3>
      <p className={`text-xl font-bold ${textColor}`}>
        {typeof value === 'number' && value > 0
          ? `${value} ${unit || ''}`
          : typeof value === 'object' && value !== null
          ? value.bpm !== undefined
            ? `${value.bpm} BPM` 
            : value.sdnn !== undefined
            ? isNaN(value.sdnn)
              ? '--' 
              : `${value.sdnn} ms` 
            : '--'
          : value.toString()}{' '}
        {/* Fallback for undefined or invalid values */}
      </p>
      {confidence !== undefined && (
        <p className={`text-sm ${subTextColor}`}>
          Confidence: {confidence}
        </p>
      )}
      {secondaryValue && (
        <p className={`${subTextColor}`}>{secondaryValue}</p>
      )}
    </div>
  );
}