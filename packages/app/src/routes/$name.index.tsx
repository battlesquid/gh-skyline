import { createFileRoute, redirect } from "@tanstack/react-router";
import { fetchProfile, isAuthenticated } from "@/api/auth";

export const Route = createFileRoute("/$name/")({
	beforeLoad: async ({ params, location }) => {
		await fetchProfile();
		if (!isAuthenticated()) {
			throw redirect({
				to: "/login",
				reloadDocument: true,
				search: {
					redirect: location.href,
				},
			});
		}
		throw redirect({
			to: "/$name/$years",
			params: {
				name: params.name,
				years: `${new Date().getFullYear()}`,
			},
			replace: true,
		});
	},
});
