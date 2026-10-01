import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Preserve the project's custom directives inside AGENTS.md.
  agentRules: false,
};

export default nextConfig;
