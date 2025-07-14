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
        // TensorFlow.js should already be initialized
        const detector = await posedetection.createDetector(posedetection.SupportedModels.MoveNet, {
          modelType: posedetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        });

        const poses = await detector.estimatePoses(canvas);

        if (!poses.length || !poses[0].keypoints) {
          console.warn("No body detected.");
          return resolve({ chest: null, waist: null, hip: null, keypoints: null });
        }

        const keypoints = poses[0].keypoints;

        const getDist = (p1, p2) => {
          return Math.hypot(p1.x - p2.x, p1.y - p2.y);
        };

        const leftShoulder = keypoints[5];
        const rightShoulder = keypoints[6];
        const leftHip = keypoints[11];
        const rightHip = keypoints[12];

        if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) {
          return resolve({ chest: null, waist: null, hip: null, keypoints: null });
        }

        const chestPx = getDist(leftShoulder, rightShoulder);
        const hipPx = getDist(leftHip, rightHip);

        const chest = (chestPx * cmPerPixel).toFixed(2);
        const hip = (hipPx * cmPerPixel).toFixed(2);

        // Approximate waist Y = midpoint of chest and hips
        const waistY = (leftShoulder.y + leftHip.y) / 2;
        const waistXLeft = (leftShoulder.x + leftHip.x) / 2;
        const waistXRight = (rightShoulder.x + rightHip.x) / 2;

        const waistPx = Math.abs(waistXRight - waistXLeft);
        const waist = (waistPx * cmPerPixel).toFixed(2);

        // Return measurements and keypoints for drawing
        const measurementData = {
          chest,
          waist,
          hip,
          keypoints: {
            leftShoulder,
            rightShoulder,
            leftHip,
            rightHip,
            waistLeft: { x: waistXLeft, y: waistY },
            waistRight: { x: waistXRight, y: waistY }
          }
        };

        resolve(measurementData);
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

export default detectBodyMeasurements;