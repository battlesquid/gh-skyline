import {
	Affix,
	Box,
	Button,
	Center,
	Flex,
	LoadingOverlay,
	Stack,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { IconBrandGithubFilled } from "@tabler/icons-react";
import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import {
	animate,
	createScope,
	createTimeline,
	type Scope,
	stagger,
} from "animejs";
import { useEffect, useRef } from "react";
import { isAuthenticated, resolveToken } from "../api/auth";
import ContributionBackground from "../components/contribution_background";
import "../styles/login.css";
import "../styles/page.css";

const REDIRECT_STORAGE_KEY = "skyline.redirectAfterLogin";

type LoginSearchParams = {
	code?: string;
	redirect?: string;
};

export const Route = createFileRoute("/login")({
	component: Login,
	beforeLoad: ({ search }) => {
		if (isAuthenticated()) {
			throw redirect({
				to: search.redirect ?? "/",
				reloadDocument: true,
				replace: true,
			});
		}
	},
	validateSearch: (search: Record<string, unknown>): LoginSearchParams => {
		return {
			code: (search.code as string) ?? undefined,
			redirect: (search.redirect as string) ?? undefined,
		};
	},
});

function Login() {
	const router = useRouter();
	const { code, redirect: redirectUrl } = Route.useSearch();
	const loading = useRef<boolean | null>(null);

	// Prefer CSS for layout; JS flag helps toggle simplified title on small screens
	const isMobile = useMediaQuery("(max-width: 640px)");

	// Persist redirect across OAuth flow
	useEffect(() => {
		if (redirectUrl) {
			sessionStorage.setItem(REDIRECT_STORAGE_KEY, redirectUrl);
		}
	}, [redirectUrl]);

	useEffect(() => {
		const handleRedirect = async (code: string) => {
			await resolveToken(code);
			const storedRedirect = sessionStorage.getItem(REDIRECT_STORAGE_KEY);
			if (storedRedirect) {
				sessionStorage.removeItem(REDIRECT_STORAGE_KEY);
				window.location.replace(storedRedirect);
				return;
			}
			if (redirectUrl && typeof redirectUrl === "string") {
				window.location.replace(redirectUrl);
				return;
			}
			await router.navigate({ to: "/", replace: true });
		};
		if (code !== undefined && !loading.current) {
			loading.current = true;
			handleRedirect(code);
		}
	}, []);

	const root = useRef(null);
	const scope = useRef<Scope | null>(null);

	useEffect(() => {
		if (loading.current) {
			return;
		}
		scope.current = createScope({ root }).add(() => {
			const slideinfade = animate(".logo", {
				ease: "outExpo",
				opacity: 1,
				gap: "1rem",
				duration: 500,
				delay: 1000,
			});

			if (isMobile) {
				// Mobile: only fade in the caption/buttons
				createTimeline()
					.sync(slideinfade)
					.add(".caption-item", { opacity: 1, delay: stagger(100) });
			} else {
				// Desktop: run stacked text animations
				createTimeline()
					.sync(slideinfade)
					.add(".slide-up", {
						ease: "cubicBezier(.28,1,0,1)",
						y: stagger("-1.5rem"),
						delay: stagger(10),
						marginTop: "4.5rem",
					});

				createTimeline()
					.sync(slideinfade)
					.add(".slide-down", {
						ease: "cubicBezier(.28,1,0,1)",
						y: stagger("1.5rem"),
						delay: stagger(10, { reversed: true }),
						marginBottom: "4.5rem",
					})
					.add(".caption-item", { opacity: 1, delay: stagger(100) });
			}
		});
		return () => scope.current?.revert();
	}, [isMobile]);

	const _3D = (
		<span
			style={{
				color: "var(--mantine-color-pink-5)",
			}}
		>
			3D
		</span>
	);

	return (
		<Box ref={root} h="100%">
			<ContributionBackground />
			<LoadingOverlay
				visible={loading.current ?? false}
				zIndex={1000}
				overlayProps={{ radius: "sm" }}
				loaderProps={{ type: "bars" }}
			/>
			<Center h="100%">
				<Flex gap={20}>
					<Center>
						<Stack gap={30}>
							{/* On mobile, render a simplified title; on larger screens use the animated stacked logo. */}
							{isMobile ? (
								<div className="logo">
									<div
										className="mona-sans-wide title"
										style={{ textAlign: "center" }}
									>
										GITHUB SKYLINE
									</div>
								</div>
							) : (
								<div className="logo">
									<div className="stack mona-sans-wide title">
										<span className="slide-up neon-blue">GITHUB</span>
										<span className="slide-up neon-blue">GITHUB</span>
										<span className="slide-up neon-blue">GITHUB</span>
										<span className="slide-up pink-text">GITHUB</span>
									</div>
									<div className="stack mona-sans-wide title">
										<span className="slide-down neon-pink">SKYLINE</span>
										<span className="slide-down neon-pink">SKYLINE</span>
										<span className="slide-down neon-pink">SKYLINE</span>
										<span className="slide-down pink-text">SKYLINE</span>
									</div>
								</div>
							)}
							<Stack className="caption">
								<div className="caption-item mona-sans-wide">
									YOUR CONTRIBUTION STORY IN {_3D}
								</div>
								<Button
									className="caption-item"
									component="a"
									href={`${import.meta.env.PUBLIC_WORKER_URL}?redirect=${encodeURIComponent(
										redirectUrl ?? window.location.href,
									)}`}
									fullWidth={true}
								>
									Login to Github
								</Button>
								<Button
									className="caption-item"
									component="a"
									href={`${import.meta.env.PUBLIC_WORKER_ENTERPRISE_URL}?redirect=${encodeURIComponent(
										redirectUrl ?? window.location.href,
									)}`}
									fullWidth={true}
								>
									Login to Cloud Enterprise
								</Button>
							</Stack>
						</Stack>
					</Center>
				</Flex>

				<Affix position={{ bottom: 15, right: 15 }}>
					<Button
						component="a"
						c="dimmed"
						size="compact-xs"
						variant="transparent"
						href="https://github.com/battlesquid/gh-skyline"
						target="_blank"
						leftSection={<IconBrandGithubFilled size={18} />}
					>
						View on Github
					</Button>
				</Affix>
			</Center>
		</Box>
	);
}
