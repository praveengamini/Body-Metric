import React, { useState, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import WebcamCapture from './components/WebcamCapture';
import detectEyeDistanceCmPerPixel from './utilities/detectEyeDistanceCmPerPixel';
import detectBodyMeasurements from './utilities/detectBodyMeasurements';
import drawMeasurements from './utilities/drawMeasurements';

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
        // Force webgl backend
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
      console.log("Eye-based scale:", cmPerPixel.toFixed(4), "cm/pixel");
      setDensity(cmPerPixel.toFixed(4));
      setEyeScalePhoto(transformedPhoto);
    } else {
      console.log("Could not detect eyes.");
    }
  };

  const handleDetectBodyMeasurements = async () => {
    if (!photo || !density) {
      console.log("Please detect eye distance first.");
      return;
    }

    if (!tfReady) {
      console.log("TensorFlow.js not ready yet.");
      return;
    }

    setIsProcessing(true);
    
    try {
      const measurementData = await detectBodyMeasurements(photo, parseFloat(density));
      
      if (measurementData.chest && measurementData.waist && measurementData.hip) {
        setChestLength(measurementData.chest);
        setWaistLength(measurementData.waist);
        setHipLength(measurementData.hip);
        
        // Draw measurement lines
        const annotatedPhoto = await drawMeasurements(photo, measurementData);
        setMeasurementPhoto(annotatedPhoto);
        
        console.log("Measurements:", measurementData);
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
    <div className="p-4">
      <WebcamCapture photo={photo} setPhoto={setPhoto} />

      <button onClick={handleDetectEyeDistance} className="mt-4 px-4 py-2 bg-yellow-400 text-black rounded">
        Detect cm per pixel (using eyes)
      </button>

      <button 
        onClick={handleDetectBodyMeasurements} 
        disabled={!photo || !density || isProcessing || !tfReady}
        className="mt-4 ml-4 px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
      >
        {isProcessing ? 'Processing...' : !tfReady ? 'Initializing...' : 'Detect Body Measurements'}
      </button>

      {eyeScalePhoto && (
        <div className="mt-6">
          <p className="text-lg font-medium">Detected Eye Line:</p>
          <img src={eyeScalePhoto} alt="Eye Measurement" className="w-[320px] mt-2 border" />
        </div>
      )}

      {measurementPhoto && (
        <div className="mt-6">
          <p className="text-lg font-medium">Body Measurements:</p>
          <img src={measurementPhoto} alt="Body Measurements" className="w-[320px] mt-2 border" />
          <div className="mt-4 text-sm">
            <p>Chest: {chestLength} cm</p>
            <p>Waist: {waistLength} cm</p>
            <p>Hip: {hipLength} cm</p>
            <p>Scale: {density} cm/pixel</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;