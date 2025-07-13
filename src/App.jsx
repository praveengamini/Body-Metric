import React, { useState } from 'react';
import WebcamCapture from './components/WebCamCapture';
import detectA4SheetCorners from './utilities/detectA4SheetCorners ';
const App = () => {
  const [photo,setPhoto] = useState(null)
const handleMeasure = async () => {
  const cmPerPixel = await detectA4SheetCorners(photo);
  if (cmPerPixel) {
    console.log("Scale found:", cmPerPixel, "cm per pixel");
  } else {
    console.log("A4 sheet not detected.");
  }
};

  return (
    <div>
    <div className="p-4">
       <WebcamCapture photo={photo} setPhoto={setPhoto} />
    </div>
        <button onClick={handleMeasure} className='bg-yellow-300'>cm per pixel density</button>

      </div>
  );
};

export default App;
