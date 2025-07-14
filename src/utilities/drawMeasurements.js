const drawMeasurements = (photo, measurementData) => {
  if (!photo || !measurementData || !measurementData.keypoints) {
    return Promise.resolve(null);
  }

  const { chest, waist, hip, keypoints } = measurementData;
  const { leftShoulder, rightShoulder, leftHip, rightHip, waistLeft, waistRight } = keypoints;

  const img = new Image();
  img.crossOrigin = 'Anonymous'; 
  img.src = photo;

  return new Promise((resolve) => {
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = window.devicePixelRatio || 1;
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.style.width = `${img.width}px`;
      canvas.style.height = `${img.height}px`;
      
      const ctx = canvas.getContext('2d');
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0, img.width, img.height);

      const measurementStyle = {
        lineWidth: 4,
        font: 'bold 18px "Helvetica Neue", Arial, sans-serif',
        textPadding: 15,
        textBackground: 'rgba(0, 0, 0, 0.7)',
        textBorderRadius: 4,
        shadowBlur: 10,
        shadowColor: 'rgba(0, 0, 0, 0.3)',
        colors: {
          chest: '#FF4757',
          waist: '#2ED573',
          hip: '#1E90FF'   
        }
      };

      const drawMeasurement = (start, end, measurement, label, color) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = measurementStyle.lineWidth;
        ctx.lineCap = 'round';
        ctx.shadowBlur = measurementStyle.shadowBlur;
        ctx.shadowColor = measurementStyle.shadowColor;
        
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();

        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;
        
        const text = `${label}: ${measurement}cm`;
        
        ctx.font = measurementStyle.font;
        const textWidth = ctx.measureText(text).width;
        const textHeight = parseInt(measurementStyle.font, 10);
        
        const bgPadding = measurementStyle.textPadding;
        const bgX = midX - textWidth / 2 - bgPadding;
        const bgY = midY - textHeight - bgPadding;
        const bgWidth = textWidth + bgPadding * 2;
        const bgHeight = textHeight + bgPadding * 2;
        
        ctx.fillStyle = measurementStyle.textBackground;
        ctx.shadowBlur = 0;
        roundRect(ctx, bgX, bgY, bgWidth, bgHeight, measurementStyle.textBorderRadius);
        ctx.fill();
        
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, midX, midY);
      };

      drawMeasurement(leftShoulder, rightShoulder, chest, 'Chest', measurementStyle.colors.chest);
      drawMeasurement(waistLeft, waistRight, waist, 'Waist', measurementStyle.colors.waist);
      drawMeasurement(leftHip, rightHip, hip, 'Hip', measurementStyle.colors.hip);

      const annotatedPhoto = canvas.toDataURL('image/jpeg', 0.92);
      resolve(annotatedPhoto);
    };

    img.onerror = () => {
      console.error("Failed to load image for annotation");
      resolve(null);
    };
  });
};

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export default drawMeasurements;