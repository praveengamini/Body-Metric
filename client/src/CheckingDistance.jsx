import React, { useRef, useState, useEffect } from 'react';
import * as blazeface from '@tensorflow-models/blazeface';
import * as tf from '@tensorflow/tfjs';

const CheckingDistance = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null); 
  const overlayCanvasRef = useRef(null); 
  const [distanceMessage, setDistanceMessage] = useState('');
  const [borderColor, setBorderColor] = useState('green');
  const [model, setModel] = useState(null);
  const [estimatedDistance, setEstimatedDistance] = useState(null);
  const [measurements, setMeasurements] = useState(null);
  const [snapshot, setSnapshot] = useState(null); 

  const knownFaceWidth = 14; 
  const focalLength = 500; 

  useEffect(() => {
    const loadCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing webcam:', error);
      }
    };

    const loadModel = async () => {
      try {
        await tf.setBackend('webgl');
        console.log("TensorFlow backend set");
        await tf.ready();
        const loadedModel = await blazeface.load();
        setModel(loadedModel);
        console.log("Model loaded successfully!");
      } catch (error) {
        console.error("Error loading model:", error);
      }
    };

    loadCamera();
    loadModel();
  }, []);

  useEffect(() => {
    const detectFaceDistance = async () => {
      if (model && videoRef.current) {
        const video = videoRef.current;
        const predictionLoop = async () => {
          if (video.readyState === 4) {
            const predictions = await model.estimateFaces(video, false);
            console.log("Predictions:", predictions);

            if (predictions.length > 0) {
              const face = predictions[0];
              const faceWidth = face.bottomRight[0] - face.topLeft[0];
              console.log("Face Width:", faceWidth);

              const distance = calculateDistance(faceWidth);
              setEstimatedDistance(distance.toFixed(2)); 

              if (distance >= 80 && distance <= 85) {
                setBorderColor('green'); 
                setDistanceMessage("Ideal distance");
                captureSnapshot(video);  
              } else {
                setBorderColor('red'); 
                setDistanceMessage("Adjust your distance");
              }
            } else {
              setDistanceMessage("No face detected");
              setBorderColor('gray');
              setEstimatedDistance(null);
            }
          }
          requestAnimationFrame(predictionLoop);
        };
        predictionLoop();
      }
    };

    detectFaceDistance();
  }, [model]);

  const calculateDistance = (faceWidth) => {
    return (knownFaceWidth * focalLength) / faceWidth;
  };

  const captureSnapshot = (video) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageUrl = canvas.toDataURL();
    setSnapshot(imageUrl);  

    estimateBodyMeasurements(canvas);
  };

  const estimateBodyMeasurements = async (canvas) => {
    const bodyMeasurements = {
      shoulderLength: '40 cm',
      chestSize: '95 cm',
      waistSize: '80 cm',
      bodyLength: '170 cm',
    };

    setMeasurements(bodyMeasurements); 
    drawMeasurementsOnOverlay(canvas); 
  };

 const drawMeasurementsOnOverlay = (canvas) => {
  const overlayCanvas = overlayCanvasRef.current;
  const ctx = overlayCanvas.getContext('2d');

  overlayCanvas.width = canvas.width;
  overlayCanvas.height = canvas.height;

  ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height); 
  ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height);


  const shoulderStart = { x: 150, y: 150 };
  const shoulderEnd = { x: 350, y: 150 };
  const chestStart = { x: 150, y: 200 };
  const chestEnd = { x: 350, y: 200 };
  const waistStart = { x: 150, y: 250 };
  const waistEnd = { x: 350, y: 250 };
  const bodyLengthStart = { x: 150, y: 300 };
  const bodyLengthEnd = { x: 150, y: 500 };

  ctx.beginPath();
  ctx.moveTo(shoulderStart.x, shoulderStart.y);
  ctx.lineTo(shoulderEnd.x, shoulderEnd.y);
  ctx.strokeStyle = 'red';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = 'red';
  ctx.font = '20px Arial';
  ctx.fillText(`Shoulder Length: ${measurements.shoulderLength}`, (shoulderStart.x + shoulderEnd.x) / 2, shoulderStart.y - 10);

  ctx.beginPath();
  ctx.moveTo(chestStart.x, chestStart.y);
  ctx.lineTo(chestEnd.x, chestEnd.y);
  ctx.strokeStyle = 'green';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = 'green';
  ctx.font = '20px Arial';
  ctx.fillText(`Chest Size: ${measurements.chestSize}`, (chestStart.x + chestEnd.x) / 2, chestStart.y - 10);

  ctx.beginPath();
  ctx.moveTo(waistStart.x, waistStart.y);
  ctx.lineTo(waistEnd.x, waistEnd.y);
  ctx.strokeStyle = 'blue';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = 'blue';
  ctx.font = '20px Arial';
  ctx.fillText(`Waist Size: ${measurements.waistSize}`, (waistStart.x + waistEnd.x) / 2, waistStart.y - 10);

  ctx.beginPath();
  ctx.moveTo(bodyLengthStart.x, bodyLengthStart.y);
  ctx.lineTo(bodyLengthEnd.x, bodyLengthEnd.y);
  ctx.strokeStyle = 'purple';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = 'purple';
  ctx.font = '20px Arial';
  ctx.fillText(`Body Length: ${measurements.bodyLength}`, bodyLengthStart.x - 50, (bodyLengthStart.y + bodyLengthEnd.y) / 2);
};


  return (
    <div>
      <h2>Distance Detection</h2>

      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{
          width: '100%',
          maxWidth: '400px',
          border: `5px solid ${borderColor}`,
          borderRadius: '8px',
        }}
      />

      <h1 style={{ fontSize: '48px', color: 'blue', textAlign: 'center' }}>
        {distanceMessage}
      </h1>

      {estimatedDistance !== null && (
        <h2 style={{ fontSize: '36px', color: 'purple', textAlign: 'center' }}>
          Estimated Distance: {estimatedDistance} cm
        </h2>
      )}

      {measurements && (
        <div>
          <h3>Body Measurements</h3>
          <p>Shoulder Length: {measurements.shoulderLength}</p>
          <p>Chest Size: {measurements.chestSize}</p>
          <p>Waist Size: {measurements.waistSize}</p>
          <p>Body Length: {measurements.bodyLength}</p>
        </div>
      )}

      {snapshot && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '20px' }}>
          <div style={{ marginRight: '20px' }}>
            <h3>Captured Measurement Photo</h3>``
            <img src={snapshot} alt="Captured Snapshot" style={{ maxWidth: '400px', maxHeight: '400px', borderRadius: '8px' }} />
          </div>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <canvas ref={overlayCanvasRef} style={{ display: 'block', marginTop: '20px', borderRadius: '8px' }} /> 
    </div>
  );
};

export default CheckingDistance;