// Adapted from https://github.com/wmhilton/mandelbrot-playground

import { FunctionComponent, useEffect, useState } from "react";
import Opts, { Bounds } from "./Opts";
import { debounce } from "./utils/debounce";
import { pan } from "./utils/pan";
import { zoom } from "./utils/zoom";

type Props = {
	width: number
	height: number
}

const initialBounds: Bounds = [{"r":0.06293479950912537,"i":-0.7231095788998697},{"r":0.568352273969803,"i":-0.38616459565220895}]

const Mandelbrot: FunctionComponent<Props> = ({width, height}) => {
    const [canvasElement, setCanvasElement] = useState<HTMLCanvasElement | null>(null)

	const [bounds, setBounds] = useState<Bounds>(initialBounds)
	const [worker, setWorker] = useState<Worker | null>(null)

	useEffect(() => {
		if (!worker) return
		const opts: Opts = {
			width,
			height,
			bounds,
			N: 1024
		}
		worker.postMessage({opts})
	}, [bounds, worker, width, height])

    useEffect(() => {
        if (!canvasElement) return
        const worker = new Worker(new URL('./worker.ts', import.meta.url))
        const offscreenCanvas = canvasElement.transferControlToOffscreen();
        worker.postMessage({
            canvas: offscreenCanvas,
        }, [offscreenCanvas])

		setWorker(worker)

        return () => {
            worker.terminate()
        }
    }, [canvasElement, width, height])

	useEffect(() => {
        if (!canvasElement) return
        
        let prevMouseXY: [number, number] | null = null
        let isMouseDown: boolean = false

		let internalBounds: Bounds = initialBounds

        const onwheel = (event: WheelEvent) => {
            event.preventDefault();
            internalBounds = zoom(event.offsetX, event.offsetY, event.deltaY, {...internalBounds}, {WIDTH: width, HEIGHT: height})
			setBounds(internalBounds)
        }
        const onmousedown = (event: MouseEvent) => {
            isMouseDown = true;
        }
        const onmouseup = (event: MouseEvent) => {
            isMouseDown = false;
            prevMouseXY = null;
        }
        const onmousemove = (event: MouseEvent) => {
            event.preventDefault();
            if (isMouseDown) {
                if (prevMouseXY) {
                    internalBounds = pan(event.offsetX, event.offsetY, prevMouseXY[0], prevMouseXY[1], {...internalBounds}, {WIDTH: width, HEIGHT: height})
					setBounds(internalBounds)
                }
                prevMouseXY = [event.offsetX, event.offsetY];
            }
        }
        canvasElement.addEventListener("wheel", debounce(onwheel, 100, false, true));
        canvasElement.addEventListener("mousedown", onmousedown)
        canvasElement.addEventListener("mouseup", onmouseup)
        canvasElement.addEventListener("mousemove", debounce(onmousemove, 100, false, true))

		setBounds(internalBounds)

        return () => {
            canvasElement.removeEventListener("wheel", onwheel)
            canvasElement.removeEventListener("mousedown", onmousedown)
            canvasElement.removeEventListener("mouseup", onmouseup)
            canvasElement.removeEventListener("mousemove", onmousemove)
        }
    }, [canvasElement, width, height])

    return (
        <div>
            <canvas
                ref={elmt => {setCanvasElement(elmt)}}
                width={width}
                height={height}
            />
        </div>
    )
}

export default Mandelbrot