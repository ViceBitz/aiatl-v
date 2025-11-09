import { ArrowPathIcon, CloudArrowUpIcon, FingerPrintIcon, LockClosedIcon } from '@heroicons/react/24/outline'
import featureInfo from "~/assets/feature_info.png";
import githubIntegration from "~/assets/github_integration.png";

const features = [
    {
        name: 'GitHub-native onboarding',
        description:
            'Connect a repo with OAuth and we automatically crawl the codebase, build a structured feature map, and keep it in sync with every push—no local setup, no terminal.',
        icon: CloudArrowUpIcon,
    },
    {
        name: 'Explainable feature graph',
        description:
            'We turn files and folders into an interactive feature map with readable summaries, dependencies, and associated files so vibecoders can see how everything fits together.',
        icon: ArrowPathIcon,
    },
    {
        name: 'Natural language code editing',
        description:
            'Ask for changes in a Gemini-powered chat (“add a settings page”, “refactor auth flow”) and the agent gathers context, edits code, and opens commits directly in GitHub.',
        icon: FingerPrintIcon,
    },
    {
        name: 'Secure, auditable workflow',
        description:
            'GitHub OAuth, scoped tokens, and Step Functions keep every AI action logged, allowing users to trace exactly which files were read, changed, and committed.',
        icon: LockClosedIcon,
    },
]

export default function Info() {
    return (
        <section className="py-24 sm:py-32">
            <div className="mx-auto max-w-7xl px-6 lg:px-12 flex flex-col lg:flex-row items-start gap-16">
                {/* LEFT — Text and features */}
                <div className="flex-1 text-left">
                    <h2 className="text-base font-semibold text-indigo-400">
                        Agentic workflow for vibecoding
                    </h2>
                    <p className="mt-2 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                        Understand and evolve any codebase in minutes
                    </p>
                    <p className="mt-6 text-lg text-gray-300 max-w-2xl">
                        This app turns a GitHub repository into an interactive feature map
                        created by an AI agent. Non-programmers can explore how the system
                        works, ask questions about the codebase, and trigger auditable code
                        changes without touching an IDE or learning git. We use a full
                        end-to-end agentic workflow: GitHub OAuth, AWS Amplify, Step
                        Functions, and Gemini all working together.
                    </p>

                    <dl className="mt-12 grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2">
                        {features.map((feature) => (
                            <div key={feature.name} className="relative pl-14">
                                <dt className="text-base font-semibold text-white">
                                    <div className="absolute top-0 left-0 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500">
                                        <feature.icon
                                            aria-hidden="true"
                                            className="h-6 w-6 text-white"
                                        />
                                    </div>
                                    {feature.name}
                                </dt>
                                <dd className="mt-2 text-base text-gray-400">
                                    {feature.description}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </div>

                {/* RIGHT — Stacked images */}
                <div className="flex-1 relative flex justify-center items-center">
                    {/* Background glow */}
                    <div className="absolute -inset-8 rounded-3xl bg-indigo-500/10 blur-3xl" />

                    {/* Image 1 */}
                    <div className="relative w-[85%] max-w-md">
                        <img
                            src={featureInfo}
                            alt="Feature Info"
                            className="w-full rounded-xl border border-indigo-500/40 shadow-2xl bg-gray-900/80"
                        />
                    </div>

                    {/* Image 2 (slightly overlapping) */}
                    <div className="absolute w-[80%] max-w-md translate-x-20 translate-y-75">
                        <img
                            src={githubIntegration}
                            alt="GitHub Integration"
                            className="w-full rounded-xl border border-indigo-500/40 shadow-2xl bg-gray-900/80 opacity-95"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}