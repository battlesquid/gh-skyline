import { suspend } from "suspend-react";
import { fetchProfile, UserProfile } from "../api/auth";

let CACHED_USER: UserProfile | null = null;

const loader = async () => {
    try {
        CACHED_USER ??= await fetchProfile()
    } catch (e) {
        CACHED_USER = null;
    }
    return CACHED_USER;
};

export function useProfile() {
    return suspend(loader, []);
}