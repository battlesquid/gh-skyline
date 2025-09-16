import { Button, Stack } from "@mantine/core";

export function LoginInput() {
    const redirectUrl = window.sessionStorage.getItem("redirect");
    return (
        <Stack gap={6}>
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
    )
}