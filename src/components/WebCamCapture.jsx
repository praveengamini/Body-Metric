import React, { useRef } from 'react';
import * as blazeface from '@tensorflow-models/blazeface';
import * as tf from '@tensorflow/tfjs';
import { useState,useEffect} from 'react';
const WebcamCapture = ({ photo, setPhoto }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
const [canCapture, setCanCapture] = useState(false);
const [warning, setWarning] = useState("Detecting...");
useEffect(() => {
  return () => {}; 
}, []);

const detectFaceDistance = async () => {
  const model = await blazeface.load();
  const video = videoRef.current;

  const interval = setInterval(async () => {
    if (video.readyState === 4 && video.videoWidth > 0) {
      const predictions = await model.estimateFaces(video, false);

      if (predictions.length > 0) {
        const face = predictions[0];
        const [x1, y1] = face.topLeft;
        const [x2, y2] = face.bottomRight;
        const faceWidth = x2 - x1;

        const estimatedDistance = 200 / faceWidth;

        if (estimatedDistance >= 1.5) {
          setCanCapture(true);
          setWarning("✅ You are at a good distance.");
        } else {
          setCanCapture(false);
          setWarning("❌ Move back at least 1.5 meters.");
        }
      } else {
        setCanCapture(false);
        setWarning("❌ No face detected.");
      }
    }
  }, 500);

  return () => clearInterval(interval);
};
 const startCamera = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoRef.current.srcObject = stream;

    // Wait for video to be ready before face detection starts
    videoRef.current.onloadedmetadata = () => {
      detectFaceDistance(); // Start checking face distance
    };
  } catch (err) {
    console.error('Error accessing webcam:', err);
  }
};

const stopCamera = () => {
  const stream = videoRef.current?.srcObject;
  if (stream && stream.getTracks) {
    stream.getTracks().forEach(track => track.stop());
    videoRef.current.srcObject = null;
    console.log('Camera stopped');
  }
};


  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL('image/png');
    setPhoto(imageData);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <video ref={videoRef} autoPlay playsInline className="border w-[640px] h-[480px]" />
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div className="flex gap-4">
        <button onClick={startCamera} className="px-4 py-2 bg-blue-600 text-white rounded">
          Start Camera
        </button>
      <p>{warning}</p>
<button disabled={!canCapture} onClick={capturePhoto}>Capture</button>
      </div>
       <button onClick={stopCamera} className="px-4 py-2 bg-red-700 text-white rounded">
          Stop Camera
        </button>

      {photo && (
        <div className="mt-4">
          <p className="text-lg font-medium">Captured Image:</p>
          <img src={photo} alt="Captured" className="border mt-2 w-[320px]" />
        </div>
      )}
    </div>
  );
};

export default WebcamCapture;
