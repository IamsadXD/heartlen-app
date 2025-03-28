// hooks/useSignalQuality.ts
import { useState, useEffect, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';

interface SignalQualityResults {
  signalQuality: string;
  qualityConfidence: number;
}
export default function useSignalQuality(
  ppgData: number[]
): SignalQualityResults {
  const modelRef = useRef<tf.LayersModel | null>(null);
  const [signalQuality, setSignalQuality] = useState<string>('--');
  const [qualityConfidence, setQualityConfidence] = useState<number>(0);

  // Load TensorFlow.js model
  useEffect(() => {
    const loadModel = async () => {
      try {
        const loadedModel = await tf.loadLayersModel('/tfjs_model/model.json');
        modelRef.current = loadedModel;
        console.log('PPG quality assessment model loaded successfully');
      } catch (error) {
        console.error('Error loading model:', error);
        setSignalQuality('error'); 
      }
    };
    
    loadModel();
  }, []);


  useEffect(() => {
    if (ppgData.length >= 100) {
      assessSignalQuality(ppgData);
    }
  }, [ppgData]);

  const assessSignalQuality = async (signal: number[]) => {
    if (!modelRef.current || signal.length < 100) return;

    try {
      const features = calculateFeatures(signal);
      const inputTensor = tf.tensor2d([features]);
      const prediction = (await modelRef.current.predict(
        inputTensor
      )) as tf.Tensor;
      const probabilities = await prediction.data();

      const classIndex = probabilities.indexOf(Math.max(...probabilities));
      const classes = ['bad', 'acceptable', 'excellent'];
      const predictedClass = classes[classIndex];
      const confidence = probabilities[classIndex] * 100;

      setSignalQuality(predictedClass);
      setQualityConfidence(confidence);

      inputTensor.dispose();
      prediction.dispose();
    } catch (error) {
      console.error('Error assessing signal quality:', error);
    }
  };

  const calculateFeatures = (signal: number[]): number[] => {
    if (!signal.length) return new Array(11).fill(0);
  
    // Calculate mean
    const mean = signal.reduce((sum, val) => sum + val, 0) / signal.length;
  
    // Calculate standard deviation
    const squaredDiffs = signal.map((val) => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / signal.length;
    const std = Math.sqrt(variance);
  
    // Calculate median
    const sortedSignal = [...signal].sort((a, b) => a - b);
    const median = signal.length % 2 === 0 
      ? (sortedSignal[signal.length / 2 - 1] + sortedSignal[signal.length / 2]) / 2
      : sortedSignal[Math.floor(signal.length / 2)];
  
    // Calculate skewness
    const cubedDiffs = signal.map((val) => Math.pow(val - mean, 3));
    const skewness = cubedDiffs.reduce((sum, val) => sum + val, 0) / 
      signal.length / (Math.pow(std, 3) || 1e-7);
  
    // Calculate kurtosis
    const fourthPowerDiffs = signal.map((val) => Math.pow(val - mean, 4));
    const kurtosis = fourthPowerDiffs.reduce((sum, val) => sum + val, 0) / 
      signal.length / (Math.pow(std, 4) || 1e-7);
  
    // Calculate signal range and peak-to-peak
    const max = Math.max(...signal);
    const min = Math.min(...signal);
    const signalRange = max - min;
    const peakToPeak = signalRange;
  
    // Calculate zero crossings
    let zeroCrossings = 0;
    for (let i = 1; i < signal.length; i++) {
      if ((signal[i] >= 0 && signal[i - 1] < 0) || 
          (signal[i] < 0 && signal[i - 1] >= 0)) {
        zeroCrossings++;
      }
    }
  
    // Calculate mean crossings
    let meanCrossings = 0;
    for (let i = 1; i < signal.length; i++) {
      if ((signal[i] >= mean && signal[i - 1] < mean) || 
          (signal[i] < mean && signal[i - 1] >= mean)) {
        meanCrossings++;
      }
    }
  
    // Calculate RMS
    const squaredSum = signal.reduce((sum, val) => sum + val * val, 0);
    const rms = Math.sqrt(squaredSum / signal.length);
    
    // Calculate peak count
    let peakCount = 0;
    if (signal.length > 2) {
      for (let i = 1; i < signal.length - 1; i++) {
        if (signal[i] > signal[i - 1] && signal[i] > signal[i + 1]) {
          peakCount++;
        }
      }
    }
  
    return [
      mean,
      std,
      median,
      skewness,
      kurtosis,
      signalRange,
      zeroCrossings,
      meanCrossings,
      rms,
      peakToPeak,
      peakCount,
    ];
  };

  return { signalQuality, qualityConfidence };
}
