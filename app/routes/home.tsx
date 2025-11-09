import { useState } from "react";
import type { Route } from "./+types/home";
import HomeSection from "~/sections/Home";
import Info from "~/sections/Info";
import Stats from "~/sections/Stats";
import Footer from "~/components/Footer";
import Background from "~/components/Background";
import Splash from "~/components/Splash";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "VibeEngine Analyzer - Decoding Vibecoding" },
    { name: "description", content: "Understand and evolve any codebase in minutes with AI-powered feature mapping." },
  ];
}

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <div className="relative min-h-screen overflow-y-auto bg-gray-900 text-white antialiased">
      <Background />

      <main
        className={`relative z-10 transition-transform duration-700 ${
          showSplash ? "scale-105" : "scale-100"
        }`}
      >
        <section id="home">
          <HomeSection />
        </section>
        <section id="stats">
          <Stats />
        </section>
        <section id="info">
          <Info />
        </section>
      </main>

      <Footer />

      {showSplash && (
        <Splash
          onComplete={() => {
            setShowSplash(false);
          }}
        />
      )}
    </div>
  );
}
