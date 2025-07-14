import React, { useState, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import WebcamCapture from './components/WebcamCapture.jsx';
import detectEyeDistanceCmPerPixel from './utilities/detectEyeDistanceCmPerPixel.js';
import detectBodyMeasurements from './utilities/detectBodyMeasurements.js';
import drawMeasurements from './utilities/drawMeasurements.js';

const App = () => {
  const [photo, setPhoto] = useState(null);
  const [eyeScalePhoto, setEyeScalePhoto] = useState(null);
  const [chestLength, setChestLength] = useState(null);
  const [waistLength, setWaistLength] = useState(null);
  const [hipLength, setHipLength] = useState(null);
  const [density, setDensity] = useState(null);
  const [measurementPhoto, setMeasurementPhoto] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [tfReady, setTfReady] = useState(false);

  useEffect(() => {
    const initializeTensorFlow = async () => {
      try {
        await tf.setBackend('webgl');
        await tf.ready();
        console.log("TensorFlow.js initialized with backend:", tf.getBackend());
        setTfReady(true);
      } catch (error) {
        console.error("Error initializing TensorFlow.js:", error);
      }
    };
    
    initializeTensorFlow();
  }, []);

  const handleDetectEyeDistance = async () => {
    const { cmPerPixel, transformedPhoto } = await detectEyeDistanceCmPerPixel(photo);
    if (cmPerPixel) {
      setDensity(cmPerPixel.toFixed(4));
      setEyeScalePhoto(transformedPhoto);
    } else {
      console.log("Could not detect eyes.");
    }
  };

  const handleDetectBodyMeasurements = async () => {
    if (!photo || !density || !tfReady) return;

    setIsProcessing(true);
    
    try {
      const measurementData = await detectBodyMeasurements(photo, parseFloat(density));
      
      if (measurementData.chest && measurementData.waist && measurementData.hip) {
        setChestLength(measurementData.chest);
        setWaistLength(measurementData.waist);
        setHipLength(measurementData.hip);
        const annotatedPhoto = await drawMeasurements(photo, measurementData);
        setMeasurementPhoto(annotatedPhoto);
      } else {
        console.log("Could not detect body measurements.");
      }
    } catch (error) {
      console.error("Error processing body measurements:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6">Body Metric</h1>

        <WebcamCapture photo={photo} setPhoto={setPhoto} />

        <div className="flex flex-wrap gap-4 justify-center mt-6">
          <button
            onClick={handleDetectEyeDistance}
            className="px-6 py-2 bg-yellow-400 hover:bg-yellow-300 text-black font-semibold rounded shadow transition"
          >
            Detect cm per pixel (eyes)
          </button>

          <button
            onClick={handleDetectBodyMeasurements}
            disabled={!photo || !density || isProcessing || !tfReady}
            className={`px-6 py-2 font-semibold rounded shadow transition ${
              isProcessing || !tfReady || !density
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {isProcessing ? 'Processing...' : !tfReady ? 'Initializing...' : 'Detect Body Measurements'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
          {eyeScalePhoto && (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-2">Detected Eye Line</h2>
              <img src={eyeScalePhoto} alt="Eye Measurement" className="w-full rounded border" />
            </div>
          )}

          {measurementPhoto && (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-2">Body Measurements</h2>
              <img src={measurementPhoto} alt="Body Measurements" className="w-full rounded border mb-3" />
              <div className="text-sm">
                <p><strong>Chest:</strong> {chestLength} cm / {(chestLength / 2.54).toFixed(1)} inch</p>
                <p><strong>Waist:</strong> {waistLength} cm / {(waistLength / 2.54).toFixed(1)} inch</p>
                <p><strong>Hip:</strong> {hipLength} cm / {(hipLength / 2.54).toFixed(1)} inch</p>
                <p><strong>Scale:</strong> {density} cm/pixel</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
