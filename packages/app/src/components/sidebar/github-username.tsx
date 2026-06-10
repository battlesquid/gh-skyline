import {
	Avatar,
	Combobox,
	ComboboxDropdown,
	ComboboxOption,
	ComboboxTarget,
	Group,
	Input,
	InputWrapper,
	ScrollArea,
	Text,
	useCombobox,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { IconLoader, IconSearch } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { client } from "../../api/client";
import { SearchUsersQuery } from "../../api/query";

export type GitHubUser = {
	login: string;
	avatarUrl: string;
};

async function fetchGitHubUsers(query: string): Promise<GitHubUser[]> {
	if (query.trim().length === 0) return [];

	const result = await client.query(SearchUsersQuery, { query }).toPromise();
	if (result.error) {
		console.error("Error fetching GitHub users:", result.error);
		return [];
	}
	if (!result.data) {
		console.warn("No data returned from GitHub users query.");
		return [];
	}
	const nodes = result.data.search.nodes ?? [];
	return nodes.filter(
		(node): node is GitHubUser => !!node && node.__typename === "User",
	);
}

interface GitHubUsernameInputProps
	extends Omit<
		React.ComponentPropsWithoutRef<typeof Input>,
		"value" | "defaultValue" | "onChange"
	> {
	debounceMs?: number;
	placeholder?: string;
	value?: string;
	defaultValue?: string;
	onChange?: (login: string) => void;
	label?: string;
	description?: string;
	error?: string;
	required?: boolean;
}

export function GitHubUsernameInput({
	debounceMs = 500,
	placeholder,
	value,
	defaultValue,
	onChange,
	label,
	description,
	error,
	required,
	...inputProps
}: GitHubUsernameInputProps) {
	const isControlled = value !== undefined;
	const [internalValue, setInternalValue] = useState(defaultValue || "");
	const inputValue = isControlled ? (value ?? "") : internalValue;
	const [debouncedValue] = useDebouncedValue(inputValue, debounceMs);
	const [users, setUsers] = useState<GitHubUser[]>([]);
	const [loading, setLoading] = useState(false);
	const combobox = useCombobox({
		onDropdownClose: () => combobox.resetSelectedOption(),
	});
	const didMount = useRef(false);

	useEffect(() => {
		if (isControlled && didMount.current) {
			setInternalValue(value ?? "");
		}
		didMount.current = true;
	}, [value, isControlled]);

	useEffect(() => {
		let ignore = false;
		if (debouncedValue.trim().length === 0) {
			setUsers([]);
			return;
		}
		setLoading(true);
		fetchGitHubUsers(debouncedValue)
			.then((res) => {
				if (!ignore) setUsers(res);
			})
			.finally(() => {
				if (!ignore) setLoading(false);
			});
		return () => {
			ignore = true;
		};
	}, [debouncedValue]);

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const val = e.currentTarget.value;
		if (!isControlled) setInternalValue(val);
		onChange?.(val);
		combobox.openDropdown();
	};

	const handleOptionSubmit = (login: string) => {
		if (!isControlled) setInternalValue(login);
		onChange?.(login);
		combobox.closeDropdown();
	};

	return (
		<InputWrapper
			label={label}
			description={description}
			error={error}
			required={required}
		>
			<Combobox store={combobox} onOptionSubmit={handleOptionSubmit}>
				<ComboboxTarget>
					<Input
						value={inputValue}
						onChange={handleInputChange}
						placeholder={placeholder ?? "GitHub Username"}
						onFocus={() => combobox.openDropdown()}
						autoComplete="off"
						rightSection={
							loading ? (
								<IconLoader size={16} className="animate-spin" />
							) : (
								<IconSearch size={16} />
							)
						}
						{...inputProps}
					/>
				</ComboboxTarget>
				<ComboboxDropdown component={ScrollArea}>
					{loading ? (
						<ComboboxOption disabled value="loading">
							Loading...
						</ComboboxOption>
					) : users.length > 0 ? (
						users.map((user) => (
							<ComboboxOption key={user.login} value={user.login}>
								<Group gap="xs" align="center">
									<Avatar
										size="sm"
										src={user.avatarUrl}
										alt={`${user.login}'s avatar`}
									/>
									<Text size="sm">{user.login}</Text>
								</Group>
							</ComboboxOption>
						))
					) : (
						<ComboboxOption disabled value="no-results">
							No results
						</ComboboxOption>
					)}
				</ComboboxDropdown>
			</Combobox>
		</InputWrapper>
	);
}
