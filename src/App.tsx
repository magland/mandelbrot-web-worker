import React from 'react';
import Mandelbrot from './Mandelbrot';

function App() {
  return (
    <div className="App">
      <Mandelbrot
        width={800}
        height={600}
      />
      Click and drag to pan. Mouse wheel to zoom.
    </div>
  );
}

export default App;
