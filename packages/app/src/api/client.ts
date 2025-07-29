import { authExchange } from "@urql/exchange-auth";
import { Client, cacheExchange, fetchExchange } from "urql";
import { getToken, isAuthenticated, logout } from "./auth";

export const client = new Client({
	url: "https://api.github.com/graphql",
	exchanges: [
		cacheExchange,
		authExchange(async (utils) => {
			const token = getToken();
			return {
				addAuthToOperation(operation) {
					if (!token) {
						return operation;
					}
					return utils.appendHeaders(operation, {
						Authorization: `Bearer ${token}`,
					});
				},
				didAuthError(error, _operation) {
					return getToken() === null || error.response?.status === 401;
				},
				async refreshAuth() {
					if (isAuthenticated()) {
						logout();
					}
				},
			};
		}),
		fetchExchange,
	],
});
