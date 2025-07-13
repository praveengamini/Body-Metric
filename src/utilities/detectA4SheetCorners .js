const detectA4SheetCorners = async (photo) => {
  if (!window.cv || !photo) return;

  return new Promise((resolve) => {
    const img = new Image();
    img.src = photo;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0, img.width, img.height);

      const src = cv.imread(canvas);
      const gray = new cv.Mat();
      const blurred = new cv.Mat();
      const edges = new cv.Mat();
      const contours = new cv.MatVector();
      const hierarchy = new cv.Mat();

      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
      cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
      cv.Canny(blurred, edges, 75, 200);

      cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

      let cmPerPixel = null;

      for (let i = 0; i < contours.size(); i++) {
        const cnt = contours.get(i);
        const approx = new cv.Mat();
        cv.approxPolyDP(cnt, approx, 0.02 * cv.arcLength(cnt, true), true);

        if (approx.rows === 4) {
          const points = [];
          for (let j = 0; j < 4; j++) {
            points.push({
              x: approx.data32S[j * 2],
              y: approx.data32S[j * 2 + 1]
            });
          }

          for (let j = 0; j < 4; j++) {
            const pt1 = points[j];
            const pt2 = points[(j + 1) % 4];
            cv.line(src, new cv.Point(pt1.x, pt1.y), new cv.Point(pt2.x, pt2.y), [255, 0, 0, 255], 2);
          }

          const topWidthPixels = Math.hypot(
            points[1].x - points[0].x,
            points[1].y - points[0].y
          );

          cmPerPixel = 21 / topWidthPixels; 

          console.log('A4 width in pixels:', topWidthPixels);
          console.log('cmPerPixel:', cmPerPixel);

          approx.delete();
          cnt.delete();
          break;
        }

        cnt.delete();
      }

      src.delete();
      gray.delete();
      blurred.delete();
      edges.delete();
      contours.delete();
      hierarchy.delete();

    if (!cmPerPixel) {
    console.warn("A4 not detected.");
    }

    resolve({
    cmPerPixel,
    annotatedPhoto: canvas.toDataURL('image/png') 
});
    };

    img.onerror = () => {
      console.error("Failed to load image.");
      resolve(null);
    };
  });
};

export default detectA4SheetCorners;
