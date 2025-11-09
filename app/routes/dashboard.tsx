import type { Route } from "./+types/dashboard";
import Dashboard from "~/sections/Dashboard";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Dashboard - VibeEngine" },
    { name: "description", content: "Analyze your repository features and make AI-powered code modifications." },
  ];
}

export default function DashboardRoute() {
  return <Dashboard />;
}
