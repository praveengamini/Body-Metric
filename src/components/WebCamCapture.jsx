import React, { useRef, useState, useEffect } from 'react';
import * as blazeface from '@tensorflow-models/blazeface';
import * as tf from '@tensorflow/tfjs';
import { Hands } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';

const WebcamCapture = ({ photo, setPhoto }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [canCapture, setCanCapture] = useState(false);
  const [warning, setWarning] = useState("Detecting...");
  const [distanceOK, setDistanceOK] = useState(false);
const [gestureDetected, setGestureDetected] = useState("");

const isThumbsUp = (landmarks) => {
  if (!landmarks || landmarks.length < 21) return false;

  // Hand landmark indices (MediaPipe hand landmarks)
  const wrist = landmarks[0];         // Wrist
  const thumbTip = landmarks[4];      // Thumb tip
  const thumbIP = landmarks[3];       // Thumb interphalangeal joint
  const thumbMCP = landmarks[2];      // Thumb metacarpophalangeal joint
  
  const indexTip = landmarks[8];      // Index finger tip
  const indexPIP = landmarks[6];      // Index finger PIP joint
  const indexMCP = landmarks[5];      // Index finger MCP joint
  
  const middleTip = landmarks[12];    // Middle finger tip
  const middlePIP = landmarks[10];    // Middle finger PIP joint
  const middleMCP = landmarks[9];     // Middle finger MCP joint
  
  const ringTip = landmarks[16];      // Ring finger tip
  const ringMCP = landmarks[13];    
  
  const pinkyTip = landmarks[20];     
  const pinkyMCP = landmarks[17];     

  // Calculate distances for better analysis
  const distance = (p1, p2) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));

  // 1. CRITICAL: Thumb must be significantly extended upward from its base
  const thumbLength = distance(thumbTip, thumbMCP);
  const thumbExtensionUp = thumbTip.y < thumbMCP.y - 0.08; // Strong upward extension
  
  // 2. CRITICAL: Thumb must be well separated from other fingers
  const thumbToIndexDistance = distance(thumbTip, indexTip);
  const thumbToMiddleDistance = distance(thumbTip, middleTip);
  const thumbToRingDistance = distance(thumbTip, ringTip);
  const thumbToPinkyDistance = distance(thumbTip, pinkyTip);
  
  const thumbSeparated = thumbToIndexDistance > 0.12 && 
                        thumbToMiddleDistance > 0.12 && 
                        thumbToRingDistance > 0.12 && 
                        thumbToPinkyDistance > 0.12;

  // 3. Check if other fingers are actually folded (not just positioned)
  const indexFolded = indexTip.y > indexPIP.y && distance(indexTip, indexMCP) < 0.08;
  const middleFolded = middleTip.y > middlePIP.y && distance(middleTip, middleMCP) < 0.08;
  const ringFolded = distance(ringTip, ringMCP) < 0.08;
  const pinkyFolded = distance(pinkyTip, pinkyMCP) < 0.08;

  // 4. CRITICAL: Thumb should be clearly the highest point
  const thumbHighest = thumbTip.y < indexTip.y - 0.08 && 
                      thumbTip.y < middleTip.y - 0.08 && 
                      thumbTip.y < ringTip.y - 0.08 && 
                      thumbTip.y < pinkyTip.y - 0.08;

  // 5. Thumb should be significantly above the wrist level
  const thumbAboveWrist = thumbTip.y < wrist.y - 0.1;

  // 6. CRITICAL: Check thumb is not tucked into palm (fist detection)
  const knuckleCenter = {
    x: (indexMCP.x + middleMCP.x + ringMCP.x + pinkyMCP.x) / 4,
    y: (indexMCP.y + middleMCP.y + ringMCP.y + pinkyMCP.y) / 4
  };
  const thumbNotTucked = distance(thumbTip, knuckleCenter) > 0.15;

  // 7. Ensure thumb is pointing upward, not sideways
  const thumbVertical = Math.abs(thumbTip.x - thumbMCP.x) < 0.06;

  // 8. ANTI-FIST: In a fist, fingers are tightly clustered. Check for clustering
  const fingerTips = [indexTip, middleTip, ringTip, pinkyTip];
  const avgFingerX = fingerTips.reduce((sum, tip) => sum + tip.x, 0) / 4;
  const avgFingerY = fingerTips.reduce((sum, tip) => sum + tip.y, 0) / 4;
  const fingersClustered = fingerTips.every(tip => 
    distance(tip, {x: avgFingerX, y: avgFingerY}) < 0.05
  );

  // If fingers are tightly clustered, it's likely a fist
  const notAFist = !fingersClustered;

  const isThumbsUpGesture = thumbExtensionUp && 
                           thumbSeparated && 
                           thumbHighest && 
                           thumbAboveWrist &&
                           thumbNotTucked &&
                           thumbVertical &&
                           notAFist &&
                           indexFolded && 
                           middleFolded && 
                           ringFolded && 
                           pinkyFolded;

  if (isThumbsUpGesture) {
    console.log("👍 Thumbs-up gesture detected");
    setGestureDetected("👍 Thumbs-up detected!");
  } else {
    setGestureDetected("");
  }

  return isThumbsUpGesture;
};

  const detectFaceDistance = async () => {
    const model = await blazeface.load();
    const video = videoRef.current;

    const interval = setInterval(async () => {
      if (video.readyState === 4 && video.videoWidth > 0) {
        const predictions = await model.estimateFaces(video, false);
        if (predictions.length > 0) {
          const face = predictions[0];
          const [x1] = face.topLeft;
          const [x2] = face.bottomRight;
          const faceWidth = x2 - x1;
          const estimatedDistance = 200 / faceWidth;

          if (estimatedDistance >= 1.5) {
            setDistanceOK(true);
            setWarning("✅ Good distance. Show thumbs-up to capture.");
          } else {
            setDistanceOK(false);
            setWarning("❌ Move back at least 1.5 meters.");
          }
        } else {
          setDistanceOK(false);
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

      videoRef.current.onloadedmetadata = () => {
        detectFaceDistance(); // Start face detection

        const hands = new Hands({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.7,
          minTrackingConfidence: 0.7,
        });

        hands.onResults((results) => {
          if (
            results.multiHandLandmarks &&
            results.multiHandLandmarks.length > 0
          ) {
            const landmarks = results.multiHandLandmarks[0];

            if (isThumbsUp(landmarks) && distanceOK && canCapture) {
              capturePhoto();
              setCanCapture(false);
              setWarning("📸 Thumbs-up detected! Photo captured.");

              // Allow another capture after 3 seconds
              setTimeout(() => setCanCapture(true), 3000);
            }
          }
        });

        const camera = new Camera(videoRef.current, {
          onFrame: async () => {
            await hands.send({ image: videoRef.current });
          },
          width: 640,
          height: 480,
        });

        camera.start();
        setCanCapture(true);
      };
    } catch (err) {
      console.error('Error accessing webcam:', err);
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject;
    if (stream && stream.getTracks) {
      stream.getTracks().forEach((track) => track.stop());
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

      <div className="flex gap-4 items-center">
        <button onClick={startCamera} className="px-4 py-2 bg-blue-600 text-white rounded">
          Start Camera
        </button>
        <p>{warning}</p>
        <button onClick={capturePhoto} disabled={!distanceOK} className="px-4 py-2 bg-green-600 text-white rounded">
          Manual Capture
        </button>
        <button onClick={stopCamera} className="px-4 py-2 bg-red-700 text-white rounded">
          Stop Camera
        </button>
      </div>

      {photo && (
        <div className="mt-4">
          <p className="text-lg font-medium">Captured Image:</p>
          <img src={photo} alt="Captured" className="border mt-2 w-[320px]" />
        </div>
      )}
    <p className="text-yellow-600">{gestureDetected}</p>
    </div>

  );
};

export default WebcamCapture;