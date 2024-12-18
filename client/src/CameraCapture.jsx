import React, { useRef, useState, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as posedetection from '@tensorflow-models/pose-detection';
import { CircleX } from 'lucide-react';

const WebcamCapture = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [photo, setPhoto] = useState(null);
  const [file, setFile] = useState(null);
  const [detector, setDetector] = useState(null);

  useEffect(() => {
    const loadDetector = async () => {
      try {
        await tf.setBackend('webgl');  
        await tf.ready();  
        const model = await posedetection.createDetector(posedetection.SupportedModels.MoveNet);
        setDetector(model);
      } catch (error) {
        console.error("Error initializing TensorFlow or loading the model:", error);
      }
    };

    loadDetector();

    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((error) => console.error("Error accessing webcam:", error));
  }, []);

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (canvas && video) {
      const context = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

      const imageData = canvas.toDataURL('image/png');
      setPhoto(imageData);
      detectLandmarks(canvas);
    }
  };

  const handleFileChange = (event) => {
    if (event.target.files[0]) {
      const fileURL = URL.createObjectURL(event.target.files[0]);
      setFile(fileURL);
      const img = new Image();
      img.src = fileURL;
      img.onload = () => {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0);
        detectLandmarks(canvas);
      };
    }
  };
  const detectLandmarks = async (canvas) => {
    if (!detector) return;
  
    const context = canvas.getContext('2d');
    const poses = await detector.estimatePoses(canvas);
    if (poses.length > 0) {
      const keypoints = poses[0].keypoints;
      keypoints.forEach((point) => {
        context.beginPath();
        context.arc(point.x, point.y, 5, 0, 2 * Math.PI);
        context.fillStyle = 'red';
        context.fill();
      });
  
      const leftShoulder = keypoints.find(p => p.name === 'left_shoulder');
      const rightShoulder = keypoints.find(p => p.name === 'right_shoulder');
      const leftHip = keypoints.find(p => p.name === 'left_hip');
      const rightHip = keypoints.find(p => p.name === 'right_hip');
      const leftWrist = keypoints.find(p => p.name === 'left_wrist');
      const rightWrist = keypoints.find(p => p.name === 'right_wrist');
  
      if (leftShoulder && rightShoulder && leftHip && rightHip) {
        const shoulderDistancePx = calculateDistance(leftShoulder, rightShoulder);
        const waistDistancePx = calculateDistance(leftHip, rightHip);
  
        const chestWidthPx = shoulderDistancePx;
        const waistWidthPx = waistDistancePx;
  
        const chestWidthCm = convertToCm(chestWidthPx, 'chest');
        const waistWidthCm = convertToCm(waistWidthPx, 'waist');
        const lengthCm = calculateLength(keypoints);
  
        const size = determineSize(chestWidthCm, waistWidthCm, lengthCm);
  
        context.beginPath();
        if (leftShoulder && rightShoulder) {
          context.moveTo(leftShoulder.x, leftShoulder.y);
          context.lineTo(rightShoulder.x, rightShoulder.y);  
        }
        if (leftHip && rightHip) {
          context.moveTo(leftHip.x, leftHip.y);
          context.lineTo(rightHip.x, rightHip.y);  
        }
        context.strokeStyle = 'blue';
        context.lineWidth = 2;
        context.stroke();
  
        if (leftShoulder && leftHip) {
          context.beginPath();
          context.moveTo(leftShoulder.x, leftShoulder.y);
          context.lineTo(leftHip.x, leftHip.y); 
          context.stroke();
        }
  
        context.font = '16px Arial';
        context.fillStyle = 'blue';
        context.fillText(`Chest: ${chestWidthCm.toFixed(2)} cm`, (leftShoulder.x + rightShoulder.x) / 2, (leftShoulder.y + rightShoulder.y) / 2 - 20);
        context.fillText(`Waist: ${waistWidthCm.toFixed(2)} cm`, (leftHip.x + rightHip.x) / 2, (leftHip.y + rightHip.y) / 2 - 20);
        context.fillText(`Length: ${lengthCm.toFixed(2)} cm`, (leftShoulder.x + leftHip.x) / 2, (leftShoulder.y + leftHip.y) / 2 - 40);
        context.fillText(`Size: ${size}`, (leftShoulder.x + rightShoulder.x) / 2, (leftShoulder.y + rightShoulder.y) / 2 - 60);
      }
    }
  };
  
  const calculateDistance = (point1, point2) => {
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    return Math.sqrt(dx * dx + dy * dy);
  };
  
  const convertToCm = (pixels, type) => {
    const averageValues = {
      chest: 100,   
      waist: 90,    
      length: 120   
    };
  
    const scalingFactor = averageValues[type] / 100; 
    return pixels * scalingFactor;
  };
  
  const calculateLength = (keypoints) => {
    const leftShoulder = keypoints.find(p => p.name === 'left_shoulder');
    const rightShoulder = keypoints.find(p => p.name === 'right_shoulder');
    const leftHip = keypoints.find(p => p.name === 'left_hip');
    const rightHip = keypoints.find(p => p.name === 'right_hip');
  
    if (leftShoulder && rightShoulder && leftHip && rightHip) {
      const shoulderToWaistPx = calculateDistance(leftShoulder, leftHip);
      const shoulderToWaistCm = convertToCm(shoulderToWaistPx, 'length');
      return shoulderToWaistCm;
    }
    return 0;
  };
  
  const determineSize = (chest, waist, length) => {
    if (chest >= 86 && chest <= 91 && waist >= 71 && waist <= 76 && length >= 66 && length <= 69) return 'S';
    if (chest >= 96 && chest <= 101 && waist >= 81 && waist <= 86 && length >= 69 && length <= 72) return 'M';
    if (chest >= 106 && chest <= 111 && waist >= 91 && waist <= 96 && length >= 72 && length <= 75) return 'L';
    if (chest >= 116 && chest <= 121 && waist >= 101 && waist <= 106 && length >= 75 && length <= 78) return 'XL';
    if (chest >= 127 && chest <= 132 && waist >= 111 && waist <= 116 && length >= 78 && length <= 81) return '2XL';
    return 'Unknown Size';  
  };
  

  const removeImage = () => {
    setFile(null);
  };

  const removeCaptureImage = () => {
    setPhoto(null);
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="flex flex-col items-center space-y-4">
        <h2 className="text-lg font-semibold">Capture a Photo</h2>
        <div className="w-full flex flex-col items-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full max-w-xs rounded shadow"
          />
          <div className="flex space-x-4 mt-2">
            <button
              onClick={capturePhoto}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
              Capture Photo
            </button>
            <CircleX
              onClick={removeCaptureImage}
              className="text-red-500 hover:text-red-700 cursor-pointer"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center mt-6">
        <input
          type="file"
          className="border border-gray-300 p-2 rounded-lg cursor-pointer"
          onChange={handleFileChange}
        />
        <CircleX
          onClick={removeImage}
          className="ml-2 text-red-500 hover:text-red-700 cursor-pointer"
        />
      </div>

      <canvas
        ref={canvasRef}
        style={{
          display: photo || file ? 'block' : 'none',
        }}
        className="w-full max-w-xs mx-auto mt-4 rounded shadow"
      />

      {photo && (
        <div className="text-center mt-6">
          <h3 className="text-lg font-semibold">Your Photo</h3>
          <img
            src={photo}
            alt="Captured"
            style={{ display: 'none' }}
          />
        </div>
      )}
    </div>
  );
};

export default WebcamCapture;
