import Navbar from '~/components/Navbar';
import { Button } from "~/components/ui/button";
import featureMap from "~/assets/feature_map.png";

const navigation = [
    { name: 'Services', href: '#' },
    { name: 'Features', href: '#' },
    { name: 'Marketplace', href: '#' },
    { name: 'Company', href: '#' },
];

const Home = () => {
    return (
        <div className="relative h-screen">
            <Navbar navigation={navigation} />

            <div className="relative isolate px-6 pt-24 lg:px-16 flex flex-col lg:flex-row items-center min-h-[80vh] max-w-7xl mx-auto">
                <div className="flex-1 text-left">
                    <h1 className="text-5xl font-semibold tracking-tight text-white sm:text-7xl leading-tight">
                        Decoding <span className="text-indigo-400">Vibecoding</span>
                    </h1>

                    <p className="mt-8 text-lg font-medium text-gray-300 sm:text-xl max-w-lg">
                        Understand and evolve any codebase in minutes with AI-powered feature mapping.
                        Get deep insight into your project architecture, feature interconnections, and
                        technical bottlenecks — instantly.
                    </p>

                    <div className="mt-10 flex gap-x-6">
                        <Button
                            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-6 py-3 rounded-md"
                            onClick={() => { }}
                        >
                            Get started
                        </Button>
                        <Button
                            variant="ghost"
                            className="text-sm font-semibold text-white hover:bg-white/10 hover:text-white"
                        >
                            Learn more →
                        </Button>
                    </div>
                </div>

                <div className="w-full flex-1 mt-16 lg:mt-0 flex justify-center lg:justify-end relative">
                    <div className="relative w-full max-w-lg">
                        <div className="absolute -inset-8 rounded-3xl bg-indigo-500/20 blur-3xl"></div>

                        <img
                            src={featureMap}
                            alt="Feature map visualization"
                            className="scale-135 relative z-10 w-full rounded-xl shadow-2xl border border-indigo-500/40 bg-gray-900/80"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;