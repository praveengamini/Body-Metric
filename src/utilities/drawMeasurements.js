const drawMeasurements = (photo, measurementData) => {
  if (!photo || !measurementData || !measurementData.keypoints) {
    return null;
  }

  const { chest, waist, hip, keypoints } = measurementData;
  const { leftShoulder, rightShoulder, leftHip, rightHip, waistLeft, waistRight } = keypoints;

  const img = new Image();
  img.src = photo;

  return new Promise((resolve) => {
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, img.width, img.height);

      // Set line styles
      ctx.lineWidth = 3;
      ctx.font = '16px Arial';

      // Draw chest line (Red)
      ctx.strokeStyle = '#FF0000';
      ctx.fillStyle = '#FF0000';
      ctx.beginPath();
      ctx.moveTo(leftShoulder.x, leftShoulder.y);
      ctx.lineTo(rightShoulder.x, rightShoulder.y);
      ctx.stroke();
      ctx.fillText(`Chest: ${chest}cm`, 
        (leftShoulder.x + rightShoulder.x) / 2, 
        leftShoulder.y - 10);

      // Draw waist line (Green)
      ctx.strokeStyle = '#00FF00';
      ctx.fillStyle = '#00FF00';
      ctx.beginPath();
      ctx.moveTo(waistLeft.x, waistLeft.y);
      ctx.lineTo(waistRight.x, waistRight.y);
      ctx.stroke();
      ctx.fillText(`Waist: ${waist}cm`, 
        (waistLeft.x + waistRight.x) / 2, 
        waistLeft.y - 10);

      // Draw hip line (Blue)
      ctx.strokeStyle = '#0000FF';
      ctx.fillStyle = '#0000FF';
      ctx.beginPath();
      ctx.moveTo(leftHip.x, leftHip.y);
      ctx.lineTo(rightHip.x, rightHip.y);
      ctx.stroke();
      ctx.fillText(`Hip: ${hip}cm`, 
        (leftHip.x + rightHip.x) / 2, 
        leftHip.y + 25);

      // Convert canvas to image
      const annotatedPhoto = canvas.toDataURL();
      resolve(annotatedPhoto);
    };

    img.onerror = () => {
      console.error("Failed to load image for drawing.");
      resolve(null);
    };
  });
};

export default drawMeasurements;