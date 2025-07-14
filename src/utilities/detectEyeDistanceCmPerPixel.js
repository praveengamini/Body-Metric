import * as blazeface from '@tensorflow-models/blazeface';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';

const detectEyeDistanceCmPerPixel = async (photo) => {
    await tf.setBackend('webgl');
     await tf.ready();
  if (!photo) return { cmPerPixel: null, transformedPhoto: null };

  return new Promise(async (resolve) => {
    const img = new Image();
    img.src = photo;

    img.onload = async () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0, img.width, img.height);

      const model = await blazeface.load();
      const predictions = await model.estimateFaces(canvas, false);

      if (predictions.length === 0) {
        console.warn("No face detected.");
        return resolve({ cmPerPixel: null, transformedPhoto: null });
      }

      const face = predictions[0];
      const leftEye = face.landmarks[0]; // [x, y]
      const rightEye = face.landmarks[1];

      const eyePixelDistance = Math.hypot(
        rightEye[0] - leftEye[0],
        rightEye[1] - leftEye[1]
      );

      // Draw eye-to-eye line
      ctx.strokeStyle = "red";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(leftEye[0], leftEye[1]);
      ctx.lineTo(rightEye[0], rightEye[1]);
      ctx.stroke();

      const cmPerPixel = 6.3 / eyePixelDistance; // 70mm = 7cm
      const transformedPhoto = canvas.toDataURL("image/png");

      resolve({ cmPerPixel, transformedPhoto });
    };

    img.onerror = () => {
      console.error("Failed to load photo.");
      resolve({ cmPerPixel: null, transformedPhoto: null });
    };
  });
};

export default detectEyeDistanceCmPerPixel;
