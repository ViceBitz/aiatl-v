'use client';

import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Loader2, Github } from 'lucide-react';

import { Button } from '~/components/ui/button';

type NavItem = { name: string; href: string };

type AuthUser = {
    id: string;
    email: string;
};

type AuthResponse = {
    token: string;
    user: AuthUser;
};

type ErrorPayload = {
    error?: string;
};

const TOKEN_STORAGE_KEY = 'vibeengine:auth_token';
const USER_STORAGE_KEY = 'vibeengine:auth_user';

const API_BASE_URL = (() => {
    const configured = import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? '';
    if (configured) return configured;
    return import.meta.env.DEV ? 'http://localhost:3001' : '';
})();

const apiUrl = (path: string) => `${API_BASE_URL}${path}`;

async function fetchCurrentUser(token: string): Promise<AuthUser> {
    const response = await fetch(apiUrl('/api/auth/me'), {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const payload: ErrorPayload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Unable to load profile');
    }

    return response.json() as Promise<AuthUser>;
}

async function logoutRequest(token: string) {
    await fetch(apiUrl('/api/auth/logout'), {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    }).catch(() => {
        // ignore network errors on logout
    });
}

const clearStoredAuth = () => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    window.localStorage.removeItem(USER_STORAGE_KEY);
};

export default function Navbar({ navigation }: { navigation: NavItem[] }) {
    const navigate = useNavigate();
    const location = useLocation();

    const [checking, setChecking] = useState(true);
    const [user, setUser] = useState<AuthUser | null>(null);

    const onHomePage = location.pathname === '/';

    // Load user from localStorage / /me and also grab ?token= from OAuth redirect
    useEffect(() => {
        if (typeof window === 'undefined') return;

        // 1) Check URL for ?token= from GitHub callback and persist it
        const url = new URL(window.location.href);
        const tokenFromUrl = url.searchParams.get('token');
        if (tokenFromUrl) {
            window.localStorage.setItem(TOKEN_STORAGE_KEY, tokenFromUrl);
            // Clean the URL so token isn't left in the address bar
            url.searchParams.delete('token');
            window.history.replaceState({}, '', url.toString());
        }

        const token = window.localStorage.getItem(TOKEN_STORAGE_KEY);
        const cachedUser = window.localStorage.getItem(USER_STORAGE_KEY);

        if (!token) {
            if (cachedUser) {
                clearStoredAuth();
            }
            setChecking(false);
            return;
        }

        if (cachedUser) {
            try {
                setUser(JSON.parse(cachedUser));
            } catch {
                window.localStorage.removeItem(USER_STORAGE_KEY);
            }
        }

        let cancelled = false;

        fetchCurrentUser(token)
            .then((profile) => {
                if (cancelled) return;
                setUser(profile);
                window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile));
            })
            .catch(() => {
                if (cancelled) return;
                clearStoredAuth();
                setUser(null);
            })
            .finally(() => {
                if (!cancelled) {
                    setChecking(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, []);

    const handleGitHubSignIn = () => {
        // Kick off OAuth flow – backend redirects to GitHub and then back
        window.location.href = apiUrl('/api/auth/github/start');
    };

    const handleLogout = async () => {
        if (typeof window !== 'undefined') {
            const token = window.localStorage.getItem(TOKEN_STORAGE_KEY);
            if (token) {
                await logoutRequest(token);
            }
        }

        clearStoredAuth();
        setUser(null);
        navigate('/');
    };

    return (
        <header className="absolute inset-x-0 top-0 z-50">
            <nav aria-label="Global" className="flex items-center justify-between p-6 lg:px-8">
                <div className="flex lg:flex-1">
                    <img src="app/assets/full_logo.png" alt="VibeEngine" className="h-8 ml-2 mt-1" />
                </div>

                <div className="hidden lg:flex lg:gap-x-12">
                    {navigation.map((item) => (
                        <a key={item.name} href={item.href} className="text-sm/6 font-semibold text-white">
                            {item.name}
                        </a>
                    ))}
                </div>

                <div className="hidden lg:flex lg:flex-1 lg:justify-end">
                    {checking ? (
                        <span className="text-sm/6 font-semibold text-white/70 flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Checking session…
                        </span>
                    ) : user ? (
                        onHomePage ? (
                            // Logged in AND on home page → only show Dashboard button
                            <Button
                                className="text-sm font-semibold text-black bg-white hover:bg-white/80"
                                type="button"
                                onClick={() => navigate('/dashboard')}
                            >
                                Dashboard
                            </Button>
                        ) : (
                            // Logged in on other pages → show email + Sign Out
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-semibold text-white">{user.email}</span>
                                <Button
                                    variant="ghost"
                                    className="text-sm font-semibold text-white hover:bg-white/10 hover:text-white"
                                    onClick={handleLogout}
                                    type="button"
                                >
                                    Sign Out
                                </Button>
                            </div>
                        )
                    ) : (
                        // Not logged in → GitHub-only sign in
                        <Button
                            onClick={handleGitHubSignIn}
                            type="button"
                            className="flex items-center gap-2 bg-white text-black hover:bg-gray-100 text-sm font-semibold"
                        >
                            <Github className="h-4 w-4" />
                            Sign in with GitHub
                        </Button>
                    )}
                </div>
            </nav>
        </header>
    );
}