import { LoadingOverlay } from "@mantine/core";
import { useContributionQueryStore } from "@/stores/query";

function Loading() {
    const loading = useContributionQueryStore((state) => state.loading);
    return (
        <LoadingOverlay
            visible={loading}
            zIndex={1000}
            overlayProps={{ radius: "sm", blur: 2 }}
        />
    )
}

export default Loading;