// adapted from https://github.com/wmhilton/mandelbrot-playground

import Opts from "./Opts";
import { HSVtoRGB } from "./utils/HSVtoRGB"
import { iter } from "./utils/iter"

let canvas: HTMLCanvasElement | undefined
let opts: Opts | undefined = undefined

let drawNeeded = false

onmessage = function(evt) {
  if (evt.data.canvas) {
    canvas = evt.data.canvas
  }
  if (evt.data.opts) {
    opts = evt.data.opts
    drawNeeded = true
  }
};

async function start() {
  while (true) {
    if (drawNeeded) {
      draw() // do not await this one!
      drawNeeded = false
    }
    await sleepMsec(100)
  }
}
start()

let drawCode = 0
async function draw() {
  if (!canvas) return
  if (!opts) return
  let ctxt = canvas.getContext("2d")
  if (!ctxt) return
  ctxt.fillStyle = 'green'
  ctxt.fillRect(0, 0, 50, 170)
  drawCode += 1
  const thisDrawCode = drawCode
  const imageData = ctxt.getImageData(0, 0, opts.width, opts.height)

  let initialDs = 8
  let ds = initialDs
  let iterationsFactor = 1
  while (true) {
    const updateRects = getUpdateRects(opts.width, opts.height, ds, iterationsFactor)
    for (let updateRect of updateRects) {
      if (drawCode !== thisDrawCode) {
        return
      }
      drawCanvas(
        opts,
        imageData.data,
        opts.N * iterationsFactor,
        ds,
        updateRect
      );
      ctxt.putImageData(imageData, 0, 0);
      if (ds !== initialDs) {
        await sleepMsec(0)
      }
    }
    /* eslint-disable-next-line no-restricted-globals */
    // self.postMessage({done: true})
    if (ds === 1) {
      iterationsFactor *= 2
      if (iterationsFactor > 8) {
        break
      }
    }
    else {
      ds /= 2
    }
    await sleepMsec(0)
  }

}

const drawCanvas = (
  opts: Opts,
  data: Uint8ClampedArray,
  N: number,
  ds: number,
  updateRect: {x: number, y: number, w: number, h: number}
) => {
  let n = 0;

  const gWIDTH = opts.bounds[1].r - opts.bounds[0].r;
  const gLEFT = opts.bounds[0].r;
  const scaleX = gWIDTH / (opts.width - 1);

  const gHEIGHT = opts.bounds[1].i - opts.bounds[0].i;
  const gTOP = opts.bounds[1].i;
  const scaleY = -gHEIGHT / (opts.height - 1);

  const dd: {[k: string]: number} = {}
  // let val;
  let color;
  for (let y = 0; y < opts.height; y++) {
    for (let x = 0; x < opts.width; x++) {
      if ((updateRect.x <= x) && (x < updateRect.x + updateRect.w) && (updateRect.y <= y) && (y < updateRect.y + updateRect.h)) {
        const x0 = Math.floor(x / ds) * ds
        const y0 = Math.floor(y / ds) * ds
        const kk = `${x0}-${y0}`
        let count
        if (dd[kk] === undefined) {
          count = Math.max(0, iter((x + ds/2) * scaleX + gLEFT, (y + ds/2) * scaleY + gTOP, N));
          dd[kk] = count
        }
        else {
          count = dd[kk]
        }
        color = count === N ? {r: 0, g: 0, b: 0} : HSVtoRGB(
          count / 100.0,
          0.9,
          1.0
        );
        data[n] = color.r;
        data[n + 1] = color.g;
        data[n + 2] = color.b;
        data[n + 3] = 255;
      }
      n += 4;
    }
  }
  return true;
};

function getUpdateRects(w: number, h: number, ds: number, iterationsFactor: number) {
  const ret: {x: number, y: number, w: number, h: number}[] = []
  const n = Math.floor(ds * 100 / Math.sqrt(iterationsFactor))
  for (let x = 0; x < w; x += n) {
    for (let y = 0; y < h; y += n) {
      ret.push({
        x, y, w: Math.min(n, w - x), h: Math.min(n, h - y)
      })
    }
  }
  return ret
}

function sleepMsec(msec: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, msec)
  })
}

export {}