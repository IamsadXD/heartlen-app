// hooks/useMongoDB.ts
import { useState } from "react";
import { RecordData } from "../types";

interface HistoricalData {
  avgHeartRate: number;
  avgHRV: number;
}

export default function useMongoDB(subjectId?: string) {
  const [isUploading, setIsUploading] = useState(false);
  const [historicalData, setHistoricalData] = useState<HistoricalData>({
    avgHeartRate: 0,
    avgHRV: 0,
  });

  // POST: Save data to MongoDB
  const pushDataToMongo = async (recordData: RecordData) => {
    if (isUploading) return; // Prevent overlapping calls
    setIsUploading(true);
    try {
      const payload = { ...recordData, subjectId };
      const response = await fetch("/api/handle-record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (result.success) {
        console.log("✅ Data saved:", result.data);
      } else {
        console.error("❌ Error:", result.error);
      }
    } catch (error) {
      console.error("🚨 Network error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  // GET: Fetch historical averages
  const fetchHistoricalData = async (specificSubjectId?: string) => {
    try {
      // Use the provided specificSubjectId if available, otherwise fall back to the hook's subjectId
      const idToUse = specificSubjectId || subjectId;

      if (!idToUse) {
        console.error(
          "❌ Error: Missing subjectId for fetching historical data"
        );
        return;
      }

      const response = await fetch(`/api/handle-record?subjectId=${idToUse}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const result = await response.json();
      if (result.success) {
        setHistoricalData({
          avgHeartRate: result.avgHeartRate || 0,
          avgHRV: result.avgHRV || 0,
        });
        return result; // Return result for additional processing if needed
      } else {
        console.error("❌ Error:", result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error("🚨 Network error:", error);
      return { success: false, error };
    }
  };

  return {
    isUploading,
    pushDataToMongo,
    fetchHistoricalData,
    historicalData,
  };
}
