import { useEffect, useState } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";
import { Skeleton } from "~/components/ui/skeleton";
import { Label } from "~/components/ui/label";
import { RotateCcw, Rocket } from "lucide-react";

type Repo = {
    id: number;
    full_name: string;
    private: boolean;
    description: string;
    language: string;
};

type Phase = "idle" | "loading" | "connected" | "error";

type Props = {
    onRepoSelected?: (owner: string, repo: string) => void;
    onAnalysisComplete?: () => void;
};

const TOKEN_STORAGE_KEY = "vibeengine:auth_token";

const API_BASE_URL = (() => {
    const configured = import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "";
    if (configured) return configured;
    return import.meta.env.DEV ? "http://localhost:3001" : "";
})();

const apiUrl = (path: string) => `${API_BASE_URL}${path}`;

export default function ConnectGitHub({ onRepoSelected, onAnalysisComplete }: Props) {
    const [phase, setPhase] = useState<Phase>("loading");
    const [repos, setRepos] = useState<Repo[]>([]);
    const [selectedRepo, setSelectedRepo] = useState<string>("");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const connected = phase === "connected";
    const busy = phase === "loading";

    async function loadRepos() {
        if (typeof window === "undefined") return;

        const token = window.localStorage.getItem(TOKEN_STORAGE_KEY);
        if (!token) {
            setErrorMessage("You must be signed in with GitHub.");
            setPhase("error");
            setRepos([]);
            return;
        }

        try {
            setPhase("loading");
            setErrorMessage(null);

            const response = await fetch(apiUrl("/api/github/repos"), {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const payload = await response
                    .json()
                    .catch(() => ({ error: "Failed to load repositories" }));
                setErrorMessage(payload.error || "Failed to load repositories");
                setRepos([]);
                setPhase("error");
                return;
            }

            const data = (await response.json()) as Repo[];
            setRepos(data);
            setPhase("connected");
        } catch (err: any) {
            console.error("Error loading repos:", err);
            setErrorMessage(err?.message || "Failed to load repositories");
            setRepos([]);
            setPhase("error");
        }
    }

    useEffect(() => {
        void loadRepos();
    }, []);

    const handleAnalyze = async () => {
        if (!selectedRepo) return;

        const [owner, repo] = selectedRepo.split("/");
        if (!owner || !repo) return;

        // Get app auth token (same as /api/github/repos)
        const token = typeof window !== "undefined"
            ? window.localStorage.getItem(TOKEN_STORAGE_KEY)
            : null;

        if (!token) {
            setErrorMessage("You must be signed in with GitHub.");
            return;
        }

        try {
            setPhase("loading");

            const payload = {
                githubUser: owner,
                repoName: repo,
            };

            const response = await fetch(
                apiUrl("/api/gemini/create-feature-map"),
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(payload),
                }
            );

            if (!response.ok) {
                const errorPayload = await response
                    .json()
                    .catch(() => ({ error: "Failed to create feature map" }));
                console.error("create-feature-map error:", errorPayload);
                setErrorMessage(errorPayload.error || "Failed to create feature map");
                setPhase("error");
                return;
            }

            const data = await response.json();
            console.log("Feature map created:", data);

            if (data.success) {
                if (onAnalysisComplete) {
                    onAnalysisComplete();
                }

                if (onRepoSelected) {
                    onRepoSelected(owner, repo);
                }
            }

            setPhase("connected");
        } catch (err: any) {
            console.error("Error calling create-feature-map:", err);
            setErrorMessage(err?.message || "Failed to create feature map");
            setPhase("error");
        }
    };

    return (
        <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                    <CardTitle className="text-white">GitHub Integration</CardTitle>
                    <CardDescription className="text-gray-400">
                        Connect and select a repository to analyze.
                    </CardDescription>
                </div>
                <Badge
                    variant={connected ? "default" : "secondary"}
                    className={
                        connected
                            ? "bg-purple-600 text-white"
                            : "bg-gray-700 text-gray-300"
                    }
                >
                    {connected ? "Ready" : busy ? "Loading…" : "Not configured"}
                </Badge>
            </CardHeader>

            <CardContent className="space-y-5">
                {busy && repos.length === 0 ? (
                    <>
                        <p className="text-sm text-gray-400">
                            Loading your repositories...
                        </p>
                        <Skeleton className="h-9 w-full bg-gray-700" />
                    </>
                ) : repos.length === 0 ? (
                    <>
                        <p className="text-sm text-gray-400">
                            {errorMessage ||
                                "You don't have any repositories, or we couldn't load them."}
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={busy}
                            onClick={loadRepos}
                            className="border-purple-600 text-white bg-purple-600 hover:bg-purple-500 hover:text-white"
                        >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Retry
                        </Button>
                    </>
                ) : (
                    <>
                        <div className="grid gap-3 sm:grid-rows-[1fr_auto]">
                            <div className="grid gap-2">
                                <Label
                                    htmlFor="repo"
                                    className="text-gray-300"
                                >
                                    Repository
                                </Label>
                                {busy ? (
                                    <Skeleton className="h-9 w-full bg-gray-700" />
                                ) : (
                                    <Select
                                        value={selectedRepo}
                                        onValueChange={(value) => {
                                            setSelectedRepo(value);
                                            const [owner, repo] = value.split("/");
                                            if (owner && repo && onRepoSelected) {
                                                onRepoSelected(owner, repo);
                                            }
                                        }}
                                    >
                                        <SelectTrigger
                                            id="repo"
                                            className="w-full max-w-full sm:max-w-md bg-gray-900 border border-gray-600 text-white text-sm
             !h-12 px-4 py-3 rounded-md truncate flex items-center justify-between
             hover:border-purple-600 focus-visible:ring-2 focus-visible:ring-purple-500"
                                        >
                                            <SelectValue
                                                placeholder="Choose a repository"
                                                // SelectValue in shadcn usually ignores className, so this is optional
                                                className="truncate text-ellipsis overflow-hidden block text-sm"
                                            />
                                        </SelectTrigger>



                                        <SelectContent
                                            className="bg-gray-900 border border-gray-700 text-sm w-full sm:w-auto
               max-w-[min(90vw,34rem)] max-h-72 overflow-y-auto
               rounded-md shadow-lg py-2"
                                        >
                                            {repos.map((r) => (
                                                <SelectItem
                                                    key={r.id}
                                                    value={r.full_name}
                                                    className="text-white py-2 px-3 text-sm leading-tight focus:bg-gray-800 hover:bg-gray-800/70 focus:text-white rounded-sm"
                                                >
                                                    <div className="flex flex-col gap-0.5 min-w-0">
                                                        <div className="flex items-center gap-1 min-w-0">
                                                            <span className="truncate block max-w-full">{r.full_name}</span>
                                                            {r.private && (
                                                                <Badge
                                                                    variant="outline"
                                                                    className="text-[10px] border-gray-600 text-gray-300 px-1 py-0 shrink-0"
                                                                >
                                                                    Private
                                                                </Badge>
                                                            )}
                                                            {r.language && (
                                                                <Badge
                                                                    variant="secondary"
                                                                    className="text-[10px] bg-purple-600/20 text-purple-300 border-purple-600/50 px-1 py-0 shrink-0"
                                                                >
                                                                    {r.language}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        {r.description && (
                                                            <span className="text-[11px] text-gray-400 truncate block max-w-full">
                                                                {r.description}
                                                            </span>
                                                        )}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                            <div className="flex items-end gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={busy}
                                    onClick={loadRepos}
                                    className="border-purple-600 text-white bg-purple-600 hover:bg-purple-500 hover:text-white"
                                >
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Refresh
                                </Button>
                                <Button
                                    size="sm"
                                    disabled={!selectedRepo || busy}
                                    onClick={handleAnalyze}
                                    className="gap-2 bg-purple-600 hover:bg-purple-500 text-white"
                                >
                                    <Rocket className="h-4 w-4" />
                                    Analyze
                                </Button>
                            </div>
                        </div>

                        <Separator className="bg-gray-700" />
                        <p className="text-xs text-gray-400">
                            We&apos;ll analyze your repository to create a feature
                            map and set up webhooks to track changes automatically.
                        </p>
                    </>
                )}
            </CardContent>
        </Card>
    );
}