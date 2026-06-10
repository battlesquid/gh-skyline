import { Card, Text } from "@mantine/core";
import { useRef } from "react";
import { useTowerStore } from "../stores/tower";

export function HoverCard() {
	const position = useTowerStore((state) => state.position);
	const target = useTowerStore((state) => state.target);
	const date =
		target !== null
			? new Date(target.date).toLocaleDateString(undefined, {
					dateStyle: "short",
				})
			: "";
	const contributions = target !== null ? target.contributionCount : 0;
	const card = useRef<HTMLDivElement | null>(null);
	let x = position.x;
	let y = position.y;
	if (card.current) {
		if (position.x >= window.innerWidth - card.current.offsetWidth) {
			x -= card.current.offsetWidth;
		}
		if (position.y >= window.innerHeight - card.current.offsetHeight) {
			y -= card.current.offsetHeight;
		}
	}
	return (
		<div
			ref={card}
			style={{
				opacity: target === null ? 0 : 1,
				position: "absolute",
				left: x,
				top: y,
			}}
		>
			<Card>
				<Text fw="bold">{date}</Text>
				<Text size="sm" c="dimmed">
					Contributions: {contributions}
				</Text>
			</Card>
		</div>
	);
}
