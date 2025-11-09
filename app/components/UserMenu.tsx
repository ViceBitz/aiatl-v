import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { buttonVariants } from "~/components/ui/button";
import { LogOut, ChevronDown } from "lucide-react";
import { cn } from "~/lib/utils";

// --- Auth types / helpers ---

type AuthUser = {
    id: string;
    email: string;
};

type ErrorPayload = {
    error?: string;
};

const TOKEN_STORAGE_KEY = "vibeengine:auth_token";
const USER_STORAGE_KEY = "vibeengine:auth_user";

const API_BASE_URL = (() => {
    const configured = import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "";
    if (configured) return configured;
    return import.meta.env.DEV ? "http://localhost:3001" : "";
})();

const apiUrl = (path: string) => `${API_BASE_URL}${path}`;

// 👉 matches backend: GET /api/auth/me
async function fetchCurrentUser(token: string): Promise<AuthUser> {
    const url = apiUrl("/api/auth/me");
    console.log("Calling", url, "with token:", token);

    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    const text = await response.text();
    console.log("Raw /api/auth/me status:", response.status);
    console.log("Raw /api/auth/me body:", text);

    let data: any;
    try {
        data = text ? JSON.parse(text) : {};
    } catch {
        data = {};
    }

    if (!response.ok) {
        const payload: ErrorPayload = data || {};
        throw new Error(payload.error || "Unable to load profile");
    }

    return data as AuthUser;
}

// 👉 matches backend: POST /api/auth/logout
async function logoutRequest(token: string) {
    const url = apiUrl("/api/auth/logout");
    console.log("Calling", url, "with token:", token);

    await fetch(url, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    }).catch((err) => {
        console.error("Logout request failed:", err);
    });
}

const clearStoredAuth = () => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    window.localStorage.removeItem(USER_STORAGE_KEY);
};

// --- Component ---

export default function UserMenu() {
    const [user, setUser] = useState<AuthUser | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (typeof window === "undefined") return;

        // 1️⃣ Grab ?token= from the URL (e.g. /dashboard?token=JWT)
        const url = new URL(window.location.href);
        const tokenFromUrl = url.searchParams.get("token");

        if (tokenFromUrl) {
            console.log("Found token in URL, saving to localStorage");
            window.localStorage.setItem(TOKEN_STORAGE_KEY, tokenFromUrl);
            // Clean up the URL
            url.searchParams.delete("token");
            window.history.replaceState({}, "", url.toString());
        }

        // 2️⃣ Now load token from localStorage
        const token = window.localStorage.getItem(TOKEN_STORAGE_KEY);
        const cachedUser = window.localStorage.getItem(USER_STORAGE_KEY);

        if (!token) {
            console.log("No auth token; skipping /api/auth/me");
            setUser(null);
            return;
        }

        if (cachedUser) {
            try {
                const parsed = JSON.parse(cachedUser) as AuthUser;
                console.log("Using cached user:", parsed);
                setUser(parsed);
            } catch {
                window.localStorage.removeItem(USER_STORAGE_KEY);
            }
        }

        let cancelled = false;

        console.log("Fetching current user with token:", token);

        fetchCurrentUser(token)
            .then((profile) => {
                console.log("Profile from /api/auth/me:", profile);
                if (cancelled) return;
                setUser(profile);
                window.localStorage.setItem(
                    USER_STORAGE_KEY,
                    JSON.stringify(profile)
                );
            })
            .catch((err) => {
                console.error("fetchCurrentUser failed:", err);
                if (cancelled) return;
                clearStoredAuth();
                setUser(null);
                navigate("/");
            });

        return () => {
            cancelled = true;
        };
    }, [navigate]);

    async function handleSignOut() {
        try {
            const token = window.localStorage.getItem(TOKEN_STORAGE_KEY);
            if (token) {
                await logoutRequest(token);
            }
        } finally {
            clearStoredAuth();
            setUser(null);
            navigate("/");
        }
    }

    const email = user?.email ?? "";
    const initials = email ? email[0]!.toUpperCase() : "U";

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className={cn(
                        buttonVariants({ variant: "outline", size: "default" }),
                        "gap-2 border-gray-700 bg-gray-900 text-white " +
                        "hover:bg-gray-800 hover:text-white " +
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                    )}
                >
                    <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs bg-gray-800 text-gray-200">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:block text-sm text-gray-100">
                        {email || "User"}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-70" />
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="end"
                className={cn(
                    "w-64 border border-gray-700 bg-gray-900 text-gray-100 shadow-lg",
                    "mt-2"
                )}
            >
                <DropdownMenuLabel className="space-y-1">
                    <div className="text-xs text-gray-400">Signed in as</div>
                    <div className="truncate text-sm text-gray-100">
                        {email || "—"}
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-700" />
                <DropdownMenuItem
                    onClick={handleSignOut}
                    className={cn(
                        "text-red-400 focus:text-red-400",
                        "focus:bg-gray-800"
                    )}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}