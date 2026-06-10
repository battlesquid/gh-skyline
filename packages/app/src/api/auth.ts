import { client } from "@/api/client";
import { UserQuery } from "@/api/query";

const TOKEN_KEY = "token";

export interface UserProfile {
	name: string | null;
	avatarUrl?: string;
	login: string;
}

export const fetchProfile = async (): Promise<UserProfile | null> => {
	const result = await client.query(UserQuery, {}).toPromise();
	if (!result.data) {
		return null;
	}
	return {
		name: result.data.viewer.name,
		avatarUrl: result.data.viewer.avatarUrl as string,
		login: result.data.viewer.login,
	};
};

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const setToken = (token: string) => {
	console.trace("Setting Token");
	localStorage.setItem(TOKEN_KEY, token);
};

export const deleteToken = () => {
	console.trace("Deleting Token");
	localStorage.removeItem(TOKEN_KEY);
};

export const isAuthenticated = () => localStorage.getItem(TOKEN_KEY) !== null;

export const resolveToken = async (code: string): Promise<string | null> => {
	const token = getToken();
	if (token !== null) {
		return token;
	}

	const response = await fetch(import.meta.env.PUBLIC_WORKER_URL, {
		method: "POST",
		mode: "cors",
		headers: {
			"content-type": "application/json",
		},
		body: JSON.stringify({ code }),
	});

	const result = await response.json();

	if (result.error) {
		return null;
	}

	setToken(result.token);

	return result.token;
};

export const logout = () => {
	deleteToken();
};
