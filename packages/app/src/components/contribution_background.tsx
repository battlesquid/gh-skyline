import { lighten } from "@mantine/core";
import type React from "react";
import { useEffect, useRef } from "react";
import "../styles/contribution_background.css";

type CanvasStrokeStyle = string | CanvasGradient | CanvasPattern;

interface GridOffset {
	x: number;
	y: number;
}

interface ContributionBackgroundProps {
	direction?: "diagonal" | "up" | "right" | "down" | "left";
	speed?: number;
	borderColor?: CanvasStrokeStyle;
	squareSize?: number;
	gapSize?: number;
	hoverFillColor?: CanvasStrokeStyle;
	randomColors?: boolean;
	colorPeriodX?: number;
	colorPeriodY?: number;
}

// TODO: make this theme aware
const getRandomColor = (seed: number) => {
	// const h = Math.abs(Math.sin(seed) * 256) % 256;
	// const s = Math.abs(Math.sin(seed + 1) * 100) % 100;
	const l = Math.abs(Math.sin(seed + 2) * 8) % 8;
	return `hsl(224,50%,${Math.floor(l)}%)`;
};

const mod = (n: number, m: number) => ((n % m) + m) % m; // true math modulo

const ContributionBackground: React.FC<ContributionBackgroundProps> = ({
	direction = "right",
	speed = 0.5,
	borderColor = "#121212",
	squareSize = 50,
	hoverFillColor = "#222",
	gapSize = 6,
	randomColors = true,
	colorPeriodX = 32,
	colorPeriodY = 32,
}) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const requestRef = useRef<number | null>(null);
	const numSquaresX = useRef<number>(0);
	const numSquaresY = useRef<number>(0);
	const gridOffset = useRef<GridOffset>({ x: 0, y: 0 });
	const hoveredSquareRef = useRef<GridOffset | null>(null);
	const lastTimestamp = useRef<number>(performance.now());

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		const resizeCanvas = () => {
			canvas.width = canvas.offsetWidth;
			canvas.height = canvas.offsetHeight;
			const totalCellSize = squareSize + gapSize;
			numSquaresX.current = Math.ceil(canvas.width / totalCellSize) + 2;
			numSquaresY.current = Math.ceil(canvas.height / totalCellSize) + 2;
		};

		window.addEventListener("resize", resizeCanvas);
		resizeCanvas();

		const drawGrid = () => {
			if (!ctx) return;
			ctx.translate(0.5, 0.5);
			ctx.clearRect(0, 0, canvas.width, canvas.height);

			const totalCellSize = squareSize + gapSize;
			const offsetX = gridOffset.current.x;
			const offsetY = gridOffset.current.y;

			const startX =
				-((offsetX % totalCellSize) + totalCellSize) % totalCellSize;
			const startY =
				-((offsetY % totalCellSize) + totalCellSize) % totalCellSize;

			const nx = Math.ceil((canvas.width - startX) / totalCellSize);
			const ny = Math.ceil((canvas.height - startY) / totalCellSize);

			for (let ix = 0; ix < nx; ix++) {
				for (let iy = 0; iy < ny; iy++) {
					const squareX = startX + ix * totalCellSize;
					const squareY = startY + iy * totalCellSize;

					const gridX = Math.floor((squareX + offsetX) / totalCellSize);
					const gridY = Math.floor((squareY + offsetY) / totalCellSize);

					const colorSeedX = mod(gridX, colorPeriodX);
					const colorSeedY = mod(gridY, colorPeriodY);

					let fillColor: CanvasStrokeStyle | undefined;

					if (
						hoveredSquareRef.current &&
						ix === hoveredSquareRef.current.x &&
						iy === hoveredSquareRef.current.y
					) {
						fillColor = hoverFillColor;
					} else if (randomColors) {
						const seed = (colorSeedX * 73856099) ^ (colorSeedY * 19349663);
						fillColor = getRandomColor(seed);
					}

					if (fillColor) {
						ctx.fillStyle = fillColor;
						ctx.beginPath();
						ctx.roundRect(squareX, squareY, squareSize, squareSize, 4);
						ctx.fill();
					}

					const borderStroke = lighten(fillColor as string, 0.06);
					ctx.strokeStyle = borderStroke;
					ctx.beginPath();
					ctx.roundRect(squareX, squareY, squareSize, squareSize, 4);
					ctx.stroke();
				}
			}

			const gradient = ctx.createRadialGradient(
				canvas.width / 2,
				canvas.height / 2,
				0,
				canvas.width / 2,
				canvas.height / 2,
				Math.sqrt(canvas.width ** 2 + canvas.height ** 2) / 2,
			);
			gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
			gradient.addColorStop(1, "#060010");

			ctx.fillStyle = gradient;
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			ctx.translate(-0.5, -0.5);
		};

		const updateAnimation = (timestamp: number) => {
			const dt = Math.max((timestamp - lastTimestamp.current) / 16.666, 0.5);
			lastTimestamp.current = timestamp;

			const totalCellSize = squareSize + gapSize;
			const patternPeriodX = colorPeriodX * totalCellSize;
			const patternPeriodY = colorPeriodY * totalCellSize;

			const effectiveSpeed = Math.max(speed, 0.1) * dt;

			switch (direction) {
				case "right":
					gridOffset.current.x = mod(
						gridOffset.current.x + effectiveSpeed,
						patternPeriodX,
					);
					break;
				case "left":
					gridOffset.current.x = mod(
						gridOffset.current.x - effectiveSpeed,
						patternPeriodX,
					);
					break;
				case "up":
					gridOffset.current.y = mod(
						gridOffset.current.y - effectiveSpeed,
						patternPeriodY,
					);
					break;
				case "down":
					gridOffset.current.y = mod(
						gridOffset.current.y + effectiveSpeed,
						patternPeriodY,
					);
					break;
				case "diagonal":
					gridOffset.current.x = mod(
						gridOffset.current.x + effectiveSpeed,
						patternPeriodX,
					);
					gridOffset.current.y = mod(
						gridOffset.current.y + effectiveSpeed,
						patternPeriodY,
					);
					break;
				default:
					break;
			}

			drawGrid();
			requestRef.current = requestAnimationFrame(updateAnimation);
		};

		lastTimestamp.current = performance.now();
		requestRef.current = requestAnimationFrame(updateAnimation);

		return () => {
			window.removeEventListener("resize", resizeCanvas);
			if (requestRef.current) cancelAnimationFrame(requestRef.current);
		};
	}, [
		direction,
		speed,
		borderColor,
		hoverFillColor,
		squareSize,
		gapSize,
		randomColors,
		colorPeriodX,
		colorPeriodY,
	]);

	return <canvas ref={canvasRef} className="squares-canvas"></canvas>;
};

export default ContributionBackground;
