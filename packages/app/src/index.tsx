import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "urql";
import { client } from "./api/client";
import { shadcnCssVariableResolver } from "./theme/css_variable_resolver";
import { shadcnTheme } from "./theme/theme";
import "./theme/style.css";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { PostHogProvider } from "posthog-js/react";
import { routeTree } from "./routeTree.gen";

const router = createRouter({ routeTree });
declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

const rootEl = document.getElementById("root");
if (rootEl) {
	const root = ReactDOM.createRoot(rootEl);
	root.render(
		<React.StrictMode>
			<PostHogProvider
				apiKey={import.meta.env.PUBLIC_POSTHOG_KEY}
				options={{
					name: import.meta.env.PUBLIC_APP_NAME,
					api_host: import.meta.env.PUBLIC_POSTHOG_HOST,
					defaults: "2025-05-24",
				}}
			>
				<MantineProvider
					theme={shadcnTheme}
					cssVariablesResolver={shadcnCssVariableResolver}
					forceColorScheme="dark"
				>
					<Provider value={client}>
						<RouterProvider router={router} />
					</Provider>
				</MantineProvider>
			</PostHogProvider>
		</React.StrictMode>,
	);
}
