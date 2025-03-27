// components/SignalCombinationSelector.tsx
interface SignalCombinationSelectorProps {
  signalCombination: string;
  setSignalCombination: (value: string) => void;
  darkMode?: boolean; // Add darkMode prop with optional flag
}

export default function SignalCombinationSelector({
  signalCombination,
  setSignalCombination,
  darkMode = false, // Default to light mode if not provided
}: SignalCombinationSelectorProps) {
  const options = [
    { value: 'default', label: 'Default (2R - G - B)' },
    { value: 'redOnly', label: 'Red Only' },
    { value: 'greenOnly', label: 'Green Only' },
    { value: 'blueOnly', label: 'Blue Only' },
    { value: 'redMinusBlue', label: 'Red - Blue' },
    { value: 'custom', label: 'Custom (3R - G - B)' },
  ];

  return (
    <div className="mt-4">
      <label
        htmlFor="signal-combination"
        className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
      >
        Signal Combination
      </label>
      <select
        id="signal-combination"
        value={signalCombination}
        onChange={(e) => setSignalCombination(e.target.value)}
        className={`mt-1 block w-full pl-3 pr-10 py-2 text-base sm:text-sm rounded-md transition-colors 
          ${darkMode 
            ? 'bg-gray-700 border-gray-600 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500' 
            : 'bg-gray-100 border-gray-300 text-gray-800 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500'}`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}