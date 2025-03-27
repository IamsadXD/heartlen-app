"use client";
import { useState, useEffect, useRef } from "react";
import { useSession, signIn } from "next-auth/react";
import CameraFeed from "./components/CameraFeed";
// import MetricsCard from "./components/MetricsCard";
import SignalCombinationSelector from "./components/SignalCombinationSelector";
import ChartComponent from "./components/ChartComponent";
import usePPGProcessing from "./hooks/usePPGProcessing";
import useSignalQuality from "./hooks/useSignalQuality";
import useMongoDB from "./hooks/useMongoDB";
import { RecordData } from "./types";

export default function Home() {
  const { data: session, status } = useSession();
  const [isRecording, setIsRecording] = useState(false);
  const [signalCombination, setSignalCombination] = useState("default");
  const [lastAccess, setLastAccess] = useState<Date | null>(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [currentSubject, setCurrentSubject] = useState("");
  const [confirmedSubject, setConfirmedSubject] = useState("");
  const [darkMode, setDarkMode] = useState(true); // Default to dark mode

  // Extract userId and email from the session
  const userId = session?.user?.userId || "unknown";
  const userEmail = session?.user?.email || "unknown";

  // MongoDB hook
  const { isUploading, pushDataToMongo, fetchHistoricalData, historicalData } =
    useMongoDB(confirmedSubject);

  // Auto-confirm user when logged in
  useEffect(() => {
    if (session && userId !== "unknown") {
      setCurrentSubject(userId);
      setConfirmedSubject(userId);
      fetchHistoricalData(userId);
      fetchLastAccess();
    }
  }, [session, userId]);

  // Fetch historical data and last access when the user is confirmed
  useEffect(() => {
    if (userId !== "unknown" && confirmedSubject) {
      fetchHistoricalData(confirmedSubject);
      fetchLastAccess();
    }
  }, [userId, confirmedSubject]);

  // Confirm user function
  const confirmUser = async () => {
    if (currentSubject.trim()) {
      setConfirmedSubject(currentSubject.trim());

      try {
        // Fetch user data from MongoDB using the current subject ID
        await fetchHistoricalData(currentSubject.trim());

        // Also fetch the last access date for this subject
        const response = await fetch(
          `/api/last-access?subjectId=${currentSubject.trim()}`
        );
        const data = await response.json();
        if (data.success) {
          setLastAccess(new Date(data.lastAccess));
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    } else {
      alert("Please enter a valid Subject ID.");
    }
  };

  // Fetch last access date
  const fetchLastAccess = async () => {
    try {
      const response = await fetch(`/api/last-access?subjectId=${userId}`);
      const data = await response.json();
      if (data.success) {
        setLastAccess(new Date(data.lastAccess));
      }
    } catch (error) {
      console.error("Error fetching last access:", error);
    }
  };

  // PPG processing hook
  const {
    ppgData,
    valleys,
    heartRate,
    hrv,
    processFrame,
    startCamera,
    stopCamera,
  } = usePPGProcessing(isRecording, signalCombination, videoRef, canvasRef);

  // Signal quality hook
  const { signalQuality, qualityConfidence } = useSignalQuality(ppgData);

  // Record data for MongoDB
  const recordData: RecordData = {
    subjectId: confirmedSubject || "unknown",
    heartRate: {
      bpm: isNaN(heartRate.bpm) ? 0 : heartRate.bpm,
      confidence: hrv.confidence || 0,
    },
    hrv: {
      sdnn: isNaN(hrv.sdnn) ? 0 : hrv.sdnn,
      confidence: hrv.confidence || 0,
    },
    ppgData: ppgData,
    timestamp: new Date(),
  };

  // Validation before saving to MongoDB
  const handleSaveData = () => {
    if (!confirmedSubject || confirmedSubject === "unknown") {
      alert("Please confirm a user before saving data.");
      return;
    }
    pushDataToMongo(recordData);
  };

  // Start or stop recording
  useEffect(() => {
    if (isRecording) {
      startCamera();
    } else {
      stopCamera();
    }
  }, [isRecording]);

  // Process frames continuously while recording
  useEffect(() => {
    let animationFrame: number;

    const processFrameLoop = () => {
      if (isRecording) {
        processFrame();
        animationFrame = requestAnimationFrame(processFrameLoop);
      }
    };

    if (isRecording) {
      processFrameLoop();
    }

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [isRecording]);

  // Toggle dark mode function
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (!session) {
    return (
      <div
        className={
          darkMode ? "bg-gray-900 text-white p-4" : "bg-white text-gray-800 p-4"
        }
      >
        <h1>Please sign in to continue</h1>
        <button
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className={`p-2 rounded-lg ${
            darkMode ? "bg-blue-600 text-white" : "bg-blue-500 text-white"
          }`}
        >
          Sign In with Google
        </button>
      </div>
    );
  }

  return (
    <div
      className={`p-4 min-h-screen transition-colors duration-300 ${
        darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-800"
      }`}
    >
      {/* Header Section */}
      <header className="mb-4 flex flex-col sm:flex-row justify-between items-center gap-2">
        <div>
          <p
            className={`text-sm ${
              darkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            Signed in as: {userEmail}
          </p>
        </div>

        <div className="text-center">
          <h1 className="text-3xl font-bold">Heart Lens</h1>
        </div>

        <button
          onClick={toggleDarkMode}
          className={`p-2 rounded-full ${
            darkMode ? "bg-yellow-400 text-gray-900" : "bg-gray-800 text-white"
          }`}
          aria-label="Toggle dark mode"
        >
          {darkMode ? "☀️" : "🌙"}
        </button>
      </header>
      {/* Display Last Access */}
      {lastAccess && (
        <div
          className={`mb-4 text-sm ${
            darkMode ? "text-gray-400" : "text-gray-500"
          }`}
        >
          Last data refresh for {userId}: {lastAccess.toLocaleString()}
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex space-x-4 mb-4">
        {/* Start/Stop Recording Button */}
        <button
          onClick={() => setIsRecording(!isRecording)}
          className={`p-3 rounded-lg text-sm transition-all duration-300 ${
            isRecording
              ? "bg-red-500 hover:bg-red-600 text-white"
              : "bg-cyan-500 hover:bg-cyan-600 text-white"
          }`}
        >
          {isRecording ? "⏹ STOP RECORDING" : "⏺ START RECORDING"}
        </button>

        {/* Save Data to MongoDB Button */}
        <button
          onClick={() => pushDataToMongo(recordData)}
          className="p-3 rounded-lg text-sm bg-blue-500 hover:bg-blue-600 text-white transition-all duration-300"
          disabled={isUploading || ppgData.length === 0}
        >
          {isUploading ? "Uploading..." : "Save Data to MongoDB"}
        </button>
      </div>

      {/* Main Grid: Camera Feed and Metrics Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Column: Camera Feed */}
        <div
          className={`rounded-lg p-4 ${
            darkMode ? "bg-gray-800" : "bg-white shadow"
          }`}
        >
          <h2
            className={`text-lg font-bold mb-2 ${
              darkMode ? "text-white" : "text-gray-800"
            }`}
          >
            Camera Feed
          </h2>
          <CameraFeed videoRef={videoRef} canvasRef={canvasRef} />
          <div className="mt-4">
            <SignalCombinationSelector
              signalCombination={signalCombination}
              setSignalCombination={setSignalCombination}
              darkMode={darkMode}
            />
          </div>
        </div>

        {/* Right Column: Chart and Metrics */}
        <div className="grid grid-cols-1 gap-4">
          {/* User Panel */}
          <div
            className={`rounded-lg p-4 ${
              darkMode ? "bg-gray-800" : "bg-white shadow"
            }`}
          >
            <h2
              className={`text-lg font-bold mb-2 ${
                darkMode ? "text-white" : "text-gray-800"
              }`}
            >
              User Panel
            </h2>
            <div className="flex flex-col space-y-2">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={currentSubject}
                  onChange={(e) => setCurrentSubject(e.target.value)}
                  placeholder="Enter Subject ID"
                  className={`w-full p-2 rounded-md border ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300 text-gray-800"
                  }`}
                />
                <button
                  onClick={confirmUser}
                  className="bg-blue-500 text-white px-4 py-2 rounded-md whitespace-nowrap"
                >
                  Confirm User
                </button>
              </div>

              {/* User information display - only shows after historical data fetch */}
              {confirmedSubject && (
                <div
                  className={`p-3 rounded-lg ${
                    darkMode
                      ? "bg-gray-700 text-white"
                      : "bg-gray-200 text-gray-800"
                  }`}
                >
                  {isUploading ? (
                    <p>Loading user data...</p>
                  ) : (
                    <>
                      <p>
                        <strong>Subject ID:</strong> {confirmedSubject}
                      </p>
                      {lastAccess && (
                        <p>
                          <strong>Last Access:</strong>{" "}
                          {lastAccess.toLocaleString()}
                        </p>
                      )}
                      {historicalData.avgHeartRate >= 0 && (
                        <p>
                          <strong>Avg Heart Rate:</strong>{" "}
                          {historicalData.avgHeartRate} BPM
                        </p>
                      )}
                      {historicalData.avgHRV >= 0 && (
                        <p>
                          <strong>Avg HRV:</strong> {historicalData.avgHRV} ms
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Chart Component */}
          <div
            className={`rounded-lg p-4 ${
              darkMode ? "bg-gray-800" : "bg-white shadow"
            }`}
          >
            <h2
              className={`text-lg font-bold mb-2 ${
                darkMode ? "text-white" : "text-gray-800"
              }`}
            >
              PPG Signal Chart
            </h2>
            <ChartComponent ppgData={ppgData} valleys={valleys} />
          </div>

          {/* Metrics Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-cyan-500 rounded-lg p-4 text-white">
              <h3 className="font-bold">Heart Rate</h3>
              <p className="text-xl font-bold">{heartRate.bpm} BPM</p>
              <p className="text-sm">Confidence: {heartRate.confidence}</p>
            </div>

            <div className="bg-green-500 rounded-lg p-4 text-white">
              <h3 className="font-bold">HRV</h3>
              <p className="text-xl font-bold">{hrv.sdnn} ms</p>
              <p className="text-sm">Confidence: {hrv.confidence}</p>
            </div>

            <div className="bg-purple-500 rounded-lg p-4 text-white">
              <h3 className="font-bold">Signal Quality</h3>
              <p className="text-xl font-bold">{signalQuality}</p>
              <p className="text-sm">Confidence: {qualityConfidence}</p>
            </div>

            <div className="bg-blue-500 rounded-lg p-4 text-white">
              <h3 className="font-bold">Historical Data</h3>
              <p>Avg HR: {historicalData.avgHeartRate} BPM</p>
              <p>Avg HRV: {historicalData.avgHRV} ms</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
