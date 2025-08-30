import {
	Affix,
	Box,
	Button,
	Card,
	Center,
	Divider,
	Flex,
	LoadingOverlay,
	Stack,
	Title,
} from "@mantine/core";
import { IconBrandGithubFilled } from "@tabler/icons-react";
import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { isAuthenticated, resolveToken } from "../api/auth";
import ContributionBackground from "../components/contribution_background";
import "../styles/login.css";

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

	const _3D = (
		<span
			style={{
				fontWeight: 900,
				color: "var(--mantine-color-pink-5)",
				textShadow: `
                  0px 1px 0px var(--mantine-color-pink-7), 
                  0px 2px 0px var(--mantine-color-pink-7), 
                  0px 3px 0px var(--mantine-color-pink-7)`,
			}}
		>
			3D
		</span>
	);

	return (
		<Box h="100%">
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
						<Stack gap={0}>
							<Title order={4}>{import.meta.env.PUBLIC_APP_NAME}</Title>
							<Title>Your Contribution</Title>
							<Title>Story in {_3D}</Title>
						</Stack>
					</Center>
					<Divider variant="dotted" orientation="vertical" />
					<Card radius={"xs"} miw={400}>
						<Stack miw={200}>
							<Center mb={5}>
								<Title order={4}>Login</Title>
							</Center>
							<Button
								component="a"
								href={`${import.meta.env.PUBLIC_WORKER_URL}?redirect=${encodeURIComponent(
									redirectUrl ?? window.location.href,
								)}`}
								fullWidth={true}
							>
								Login to Github
							</Button>
							<Button
								component="a"
								href={`${import.meta.env.PUBLIC_WORKER_ENTERPRISE_URL}?redirect=${encodeURIComponent(
									redirectUrl ?? window.location.href,
								)}`}
								fullWidth={true}
							>
								Login to Cloud Enterprise
							</Button>
						</Stack>
					</Card>
				</Flex>

				<Affix position={{ bottom: 15, right: 15 }}>
					<Button
						component="a"
						c="dimmed"
						size="compact-xs"
						variant="transparent"
						href="https://github.com/battlesquid/skyline"
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
