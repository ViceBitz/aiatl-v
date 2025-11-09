import { useState, useEffect, useCallback } from "react";
import ConnectGitHub from "~/components/ConnectGithub";
import FeatureMapVisualization from "~/components/FeatureMapVisualization";
import ChatInterface from "~/components/ChatInterface";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import UserMenu from "~/components/UserMenu";

const TOKEN_STORAGE_KEY = "vibeengine:auth_token";

const FEATURES_LIST: any[] = [];

type Feature = {
    featureName: string;
    userSummary: string;
    aiSummary: string;
    filenames: string[];
    neighbors: string[];
};

export default function Dashboard() {
    const [features, setFeatures] = useState<Feature[]>(FEATURES_LIST); // start with static sample as fallback
    const [selectedRepo, setSelectedRepo] = useState<{ owner: string; repo: string; repoId?: string } | null>(null);
    const [loading, setLoading] = useState(false);


    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatInput, setChatInput] = useState("");
    const [chatMessages, setChatMessages] = useState<
        { role: "user" | "assistant"; content: string }[]
    >([]);

    const API_BASE_URL = (() => {
        const configured = import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "";
        if (configured) return configured;
        return import.meta.env.DEV ? "http://localhost:3001" : "";
    })();

    const apiUrl = (path: string) => `${API_BASE_URL}${path}`;

    const loadFeatureMap = useCallback(async () => {
        try {
            setLoading(true);

            let token: string | null = null;
            if (typeof window !== "undefined") {
                token = window.localStorage.getItem(TOKEN_STORAGE_KEY);
            }

            if (!token) {
                console.warn("No auth token found; using default feature list");
                setLoading(false);
                return;
            }

            const res = await fetch(apiUrl("/api/feature-map"), {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!res.ok) {
                const errPayload = await res
                    .json()
                    .catch(() => ({ error: "Failed to load feature map" }));
                console.error("Error loading feature map:", errPayload);
                setLoading(false);
                return;
            }

            const data = await res.json() as { featureMap: unknown };

            let parsed: Feature[] = [];
            if (Array.isArray(data.featureMap)) {
                parsed = data.featureMap as Feature[];
            } else if (typeof data.featureMap === "string") {
                try {
                    parsed = JSON.parse(data.featureMap) as Feature[];
                } catch (err) {
                    console.error("Failed to JSON.parse featureMap from server:", err);
                }
            }

            if (parsed.length > 0) setFeatures(parsed);
        } catch (err) {
            console.error("Unexpected error loading feature map:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadFeatureMap();
    }, [loadFeatureMap]);

    const handleChatSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = chatInput.trim();
        if (!trimmed) return;

        // Need a repo to run feature generation
        if (!selectedRepo) {
            setChatMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: "Please select a GitHub repository before requesting a feature.",
                },
            ]);
            return;
        }

        // Need auth token (same one used for /api/github/repos)
        let token: string | null = null;
        if (typeof window !== "undefined") {
            token = window.localStorage.getItem(TOKEN_STORAGE_KEY);
        }

        if (!token) {
            setChatMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content:
                        "You must be signed in with GitHub to generate features. Please log in and try again.",
                },
            ]);
            return;
        }

        setIsChatOpen(true);

        const userMessage = { role: "user" as const, content: trimmed };
        setChatMessages((prev) => [...prev, userMessage]);
        setChatInput("");

        try {
            const payload = {
                githubUser: selectedRepo.owner,
                repoName: selectedRepo.repo,
                requestedFeature: trimmed,
            };

            console.log("Sending data with token:", token);
            console.log(payload);

            const res = await fetch(apiUrl("/api/gemini/generate-feature"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errorPayload = await res
                    .json()
                    .catch(() => ({ error: "Failed to generate feature" }));
                console.error("generate-feature error:", errorPayload);

                setChatMessages((prev) => [
                    ...prev,
                    {
                        role: "assistant",
                        content:
                            errorPayload.error ||
                            "The feature generation endpoint returned an error.",
                    },
                ]);
                return;
            }

            const data = await res.json();
            console.log("Gemini /generate-feature response:", data);

            const replyText = data?.["result"];

            const assistantMessage = { role: "assistant" as const, content: replyText };
            setChatMessages((prev) => [...prev, assistantMessage]);
        } catch (err) {
            console.error(err);
            setChatMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: "Oops, something went wrong talking to the feature generation endpoint.",
                },
            ]);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white pb-24">
            <header className="sticky top-0 z-20 border-b border-gray-800 bg-gray-900/80 backdrop-blur">
                <div className="mx-auto max-w-7xl px-5 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src="app/assets/full_logo.png" alt="VibeEngine" className="h-8 ml-2 mt-1" />
                        <span className="ml-3 hidden sm:inline text-xs rounded-full border border-purple-700 px-2 py-0.5 text-purple-400">
                            Dashboard
                        </span>
                    </div>

                    <UserMenu />
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-5 py-8 space-y-6">
                <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-1 bg-gray-800/50 border-gray-700 text-white">
                        <CardHeader>
                            <CardTitle className="text-white">Welcome</CardTitle>
                            <CardDescription className="text-gray-400">
                                Select a repository to analyze its features and make AI-powered modifications.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="text-sm text-gray-400 space-y-1">
                            <p>• Interactive feature map visualization</p>
                            <p>• AI-powered code analysis</p>
                            <p>• Natural language code modifications</p>
                            <p>• Automatic commit tracking</p>
                        </CardContent>
                    </Card>

                    <div className="lg:col-span-2">
                        <ConnectGitHub
                            onRepoSelected={(owner, repo) => {
                                setSelectedRepo({ owner, repo });
                            }}
                            onAnalysisComplete={loadFeatureMap}
                        />
                    </div>
                </section>

                <section>
                    {loading && features.length === 0 ? (
                        <Card className="h-[600px] bg-gray-800/50 border-gray-700">
                            <CardHeader>
                                <CardTitle className="text-white">Feature Map</CardTitle>
                                <CardDescription className="text-gray-400">
                                    Loading feature map...
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Skeleton className="h-12 w-full bg-gray-700" />
                                <Skeleton className="h-12 w-full bg-gray-700" />
                                <Skeleton className="h-12 w-full bg-gray-700" />
                            </CardContent>
                        </Card>
                    ) : (
                        <FeatureMapVisualization features={features} />
                    )}
                </section>

                {!selectedRepo && (
                    <Card className="bg-gray-800/50 border-gray-700">
                        <CardHeader>
                            <CardTitle className="text-white">Get Started</CardTitle>
                            <CardDescription className="text-gray-400">
                                Select a repository above to view its feature map and start making AI-powered modifications.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                )}
            </main>

            {/* Fixed Chat Interface at Bottom */}
            <div className="fixed bottom-0 left-0 right-0 z-30 bg-gray-900/95 backdrop-blur border-t border-gray-800">
                <div
                    className={`
      mx-auto max-w-7xl px-5
      transition-all duration-300 ease-out
      ${isChatOpen ? "py-4 h-80" : "py-3 h-24"}
    `}
                >
                    <div className="flex flex-col h-full">
                        {/* Expanded Header */}
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold">
                                </span>
                            </div>

                            {/* Collapsed Header (open button) */}
                            {!isChatOpen && (
                                <div className="flex flex-col items-center justify-center text-center cursor-pointer"
                                    onClick={() => setIsChatOpen(true)}>
                                    <span className="text-xs text-purple-300 inline-flex items-center justify-center font-medium hover:text-purple-200">
                                        Open Chat
                                    </span>
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={() => setIsChatOpen(false)}
                                className="text-gray-400 hover:text-gray-200 text-sm"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Chat messages area */}
                        {isChatOpen && (
                            <div className="flex-1 mb-3 overflow-y-auto rounded-md border border-gray-800 bg-gray-900/90 p-3 space-y-2 text-sm">
                                {chatMessages.length === 0 && (
                                    <p className="text-gray-500 text-xs">
                                        Ask something and Gemini will assist you.
                                    </p>
                                )}

                                {chatMessages.map((msg, idx) => (
                                    <div
                                        key={idx}
                                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"
                                            }`}
                                    >
                                        <div
                                            className={`max-w-[75%] rounded-lg px-3 py-2 text-xs ${msg.role === "user"
                                                ? "bg-purple-600 text-white"
                                                : "bg-gray-800 text-gray-100"
                                                }`}
                                        >
                                            {msg.content}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <form className="flex items-center gap-3" onSubmit={handleChatSubmit}>
                            <Input
                                type="text"
                                placeholder="Chat with Gemini..."
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                className="flex-1 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus-visible:ring-purple-500 focus-visible:border-purple-500"
                            />
                            <Button
                                type="submit"
                                disabled={!selectedRepo || !chatInput.trim()}
                                className="bg-purple-600 hover:bg-purple-500 text-white font-semibold px-6 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                Send
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
