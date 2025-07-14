import * as tf from '@tensorflow/tfjs';
import * as posedetection from '@tensorflow-models/pose-detection';
import '@tensorflow/tfjs-backend-webgl';

const detectBodyMeasurements = async (photo, cmPerPixel) => {
  if (!photo || !cmPerPixel) return { chest: null, waist: null, hip: null, keypoints: null };

  const img = new Image();
  img.src = photo;

  return new Promise((resolve) => {
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, img.width, img.height);

      try {
        await tf.ready();
        
        const detector = await posedetection.createDetector(
          posedetection.SupportedModels.BlazePose, 
          {
            runtime: 'tfjs',
            modelType: 'full',
            enableSmoothing: true,
            enableSegmentation: false
          }
        );

        const poses = await detector.estimatePoses(canvas, {
          maxPoses: 1,
          flipHorizontal: false,
          scoreThreshold: 0.5
        });

        if (!poses.length || !poses[0].keypoints) {
          console.warn("No body detected.");
          return resolve({ chest: null, waist: null, hip: null, keypoints: null });
        }

        const keypoints = poses[0].keypoints;
        
        const getKeypointByName = (name, minScore = 0.3) => {
          const point = keypoints.find(kp => kp.name === name);
          return point && point.score >= minScore ? point : null;
        };

        const leftShoulder = getKeypointByName('left_shoulder') || keypoints[11];
        const rightShoulder = getKeypointByName('right_shoulder') || keypoints[12];
        const leftHip = getKeypointByName('left_hip') || keypoints[23];
        const rightHip = getKeypointByName('right_hip') || keypoints[24];

        if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) {
          const fallbackKeypoints = {
            leftShoulder: keypoints[5],
            rightShoulder: keypoints[6],
            leftHip: keypoints[11],
            rightHip: keypoints[12]
          };
          
          const validKeypoints = Object.values(fallbackKeypoints).filter(kp => 
            kp && kp.score && kp.score >= 0.3
          );
          
          if (validKeypoints.length < 4) {
            console.warn("Insufficient confident keypoints detected.");
            return resolve({ chest: null, waist: null, hip: null, keypoints: null });
          }
          
          const { leftShoulder: ls, rightShoulder: rs, leftHip: lh, rightHip: rh } = fallbackKeypoints;
          return calculateMeasurements(ls, rs, lh, rh, cmPerPixel, resolve);
        }

        return calculateMeasurements(leftShoulder, rightShoulder, leftHip, rightHip, cmPerPixel, resolve);

      } catch (error) {
        console.error("Error detecting body measurements:", error);
        resolve({ chest: null, waist: null, hip: null, keypoints: null });
      }
    };

    img.onerror = () => {
      console.error("Failed to load image.");
      resolve({ chest: null, waist: null, hip: null, keypoints: null });
    };
  });
};

const calculateMeasurements = (leftShoulder, rightShoulder, leftHip, rightHip, cmPerPixel, resolve) => {
  const getDist = (p1, p2) => {
    return Math.hypot(p1.x - p2.x, p1.y - p2.y);
  };

  const cmToInches = (cm) => (cm / 2.54).toFixed(2);

  const isValidKeypoint = (kp) => {
    return kp && 
           typeof kp.x === 'number' && 
           typeof kp.y === 'number' && 
           kp.x >= 0 && kp.y >= 0 &&
           !isNaN(kp.x) && !isNaN(kp.y);
  };

  if (!isValidKeypoint(leftShoulder) || !isValidKeypoint(rightShoulder) || 
      !isValidKeypoint(leftHip) || !isValidKeypoint(rightHip)) {
    console.warn("Invalid keypoint coordinates detected.");
    return resolve({ chest: null, waist: null, hip: null, keypoints: null });
  }

  const chestWidthPx = getDist(leftShoulder, rightShoulder);
  const hipWidthPx = getDist(leftHip, rightHip);

  if (chestWidthPx <= 0 || hipWidthPx <= 0) {
    console.warn("Invalid measurement distances calculated.");
    return resolve({ chest: null, waist: null, hip: null, keypoints: null });
  }


  const chestCircumferenceCm = (chestWidthPx * cmPerPixel * 2.2);
  const hipCircumferenceCm = (hipWidthPx * cmPerPixel * 2.2);

  const chest = cmToInches(chestCircumferenceCm);
  const hip = cmToInches(hipCircumferenceCm);

  const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2;
  const hipMidY = (leftHip.y + rightHip.y) / 2;
  
  const waistY = shoulderMidY + (hipMidY - shoulderMidY) * 0.6;
  
  const shoulderWidth = Math.abs(rightShoulder.x - leftShoulder.x);
  const hipWidth = Math.abs(rightHip.x - leftHip.x);
  const waistWidth = Math.min(shoulderWidth, hipWidth) * 0.8;
  
  const waistCircumferenceCm = (waistWidth * cmPerPixel * 2.2);
  const waist = cmToInches(waistCircumferenceCm);

  const waistCenterX = (leftShoulder.x + rightShoulder.x + leftHip.x + rightHip.x) / 4;
  const waistLeft = { x: waistCenterX - waistWidth / 2, y: waistY };
  const waistRight = { x: waistCenterX + waistWidth / 2, y: waistY };

  const measurementData = {
    chest,
    waist,
    hip,
    keypoints: {
      leftShoulder,
      rightShoulder,
      leftHip,
      rightHip,
      waistLeft,
      waistRight
    },
    confidence: {
      leftShoulder: leftShoulder.score,
      rightShoulder: rightShoulder.score,
      leftHip: leftHip.score,
      rightHip: rightHip.score
    },
    rawMeasurements: {
      chestWidthCm: (chestWidthPx * cmPerPixel).toFixed(2),
      chestCircumferenceCm: chestCircumferenceCm.toFixed(2),
      hipWidthCm: (hipWidthPx * cmPerPixel).toFixed(2),
      hipCircumferenceCm: hipCircumferenceCm.toFixed(2),
      waistCircumferenceCm: waistCircumferenceCm.toFixed(2)
    }
  };

  resolve(measurementData);
};

export default detectBodyMeasurements;