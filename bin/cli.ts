#!/usr/bin/env node
// Rollback: rm -f bin/cli.ts

import * as fs from "node:fs";
import * as path from "node:path";
import * as readline from "node:readline";
import { plan } from "../app/lib/agents/planner";
import { search } from "../app/lib/search";
import { synthesize } from "../app/lib/agents/synthesizer";
import { report } from "../app/lib/agents/reporter";
import type { SearchBundle, Synthesis } from "../app/lib/types";

// ─── Zero-dependency .env loader ─────────────────────────────────────────────
function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    if (typeof (process as unknown as { loadEnvFile?: (path?: string) => void }).loadEnvFile === "function") {
      (process as unknown as { loadEnvFile: (path: string) => void }).loadEnvFile(envPath);
    } else {
      const content = fs.readFileSync(envPath, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx !== -1) {
          const k = trimmed.slice(0, eqIdx).trim();
          const v = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
          if (!process.env[k]) process.env[k] = v;
        }
      }
    }
  }
}

loadEnv();

// ─── ANSI Terminal Styles ────────────────────────────────────────────────────
const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  magenta: "\x1b[35m",
  blue: "\x1b[34m",
  red: "\x1b[31m",
  gray: "\x1b[90m",
};

async function promptQuery(): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${c.cyan}${c.bold}Enter research topic: ${c.reset}`, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function saveReport(query: string, reportContent: string, citationsCount: number): string {
  const dir = path.resolve(process.cwd(), "reports");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const slug = query
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 40)
    .replace(/^-|-$/g, "");
  const filename = `report-${slug || "research"}-${Date.now()}.md`;
  const fullPath = path.join(dir, filename);

  const header = `---
title: "${query.replace(/"/g, '\\"')}"
date: "${new Date().toISOString()}"
citations: ${citationsCount}
model: "${process.env.NVIDIA_MODEL ?? "nvidia/nemotron-3.5-bolt-e4b"}"
---

`;

  fs.writeFileSync(fullPath, header + reportContent, "utf-8");
  return fullPath;
}

export async function runResearch(query: string) {
  if (!query) {
    console.error(`${c.red}Error: Query cannot be empty.${c.reset}`);
    process.exit(1);
  }

  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    console.error(`${c.red}Error: NVIDIA_API_KEY is not set in .env${c.reset}`);
    process.exit(1);
  }

  console.log(`\n${c.magenta}${c.bold}======================================================${c.reset}`);
  console.log(`${c.magenta}${c.bold}   RESEARCH AGENT — Terminal Edition                  ${c.reset}`);
  console.log(`${c.gray}   Model: ${process.env.NVIDIA_MODEL ?? "nvidia/nemotron-3.5-bolt-e4b"} (Thinking Mode)${c.reset}`);
  console.log(`${c.magenta}${c.bold}======================================================${c.reset}\n`);
  console.log(`${c.cyan}${c.bold}Topic:${c.reset} ${query}\n`);

  // 1. Planner
  console.log(`${c.yellow}${c.bold}[1/4] 🧠 Planner Agent:${c.reset} Decomposing query into sub-questions...`);
  const subQueries = await plan(query);
  console.log(`${c.green}✓ Generated ${subQueries.length} sub-questions:${c.reset}`);
  for (const [idx, sq] of subQueries.entries()) {
    console.log(`  ${c.dim}${idx + 1}.${c.reset} ${sq.query}`);
    console.log(`     ${c.gray}Rationale: ${sq.rationale}${c.reset}`);
  }
  console.log();

  // 2 & 3. Search & Synthesize
  const syntheses: Synthesis[] = [];
  for (const [idx, sq] of subQueries.entries()) {
    console.log(`${c.yellow}${c.bold}[2/4] 🔍 Searcher Agent (${idx + 1}/${subQueries.length}):${c.reset} ${sq.query}`);
    const results = await search(sq.query, 3);
    console.log(`  ${c.green}✓ Found ${results.length} sources:${c.reset}`);
    for (const r of results) {
      console.log(`    ${c.dim}•${c.reset} ${r.title} ${c.gray}(${new URL(r.url).hostname})${c.reset}`);
    }

    console.log(`${c.yellow}${c.bold}[3/4] 📝 Synthesizer Agent (${idx + 1}/${subQueries.length}):${c.reset} Synthesizing evidence...`);
    const bundle: SearchBundle = { queryId: sq.id, query: sq.query, results };

    const synthesis = await synthesize(bundle, () => {});
    syntheses.push(synthesis);
    console.log(`  ${c.green}✓ Synthesized with ${synthesis.citations.length} citation(s).${c.reset}\n`);
  }

  // 4. Reporter
  console.log(`${c.yellow}${c.bold}[4/4] 📊 Reporter Agent:${c.reset} Compiling comprehensive research report...\n`);
  console.log(`${c.dim}──────────────────────────────────────────────────────${c.reset}`);

  let fullReport = "";
  await report(query, syntheses, (chunk) => {
    process.stdout.write(chunk);
    fullReport += chunk;
  });

  console.log(`\n${c.dim}──────────────────────────────────────────────────────${c.reset}\n`);

  const totalCitations = syntheses.flatMap((s) => s.citations).length;
  const savedPath = saveReport(query, fullReport, totalCitations);
  console.log(`${c.green}${c.bold}✓ Research Complete!${c.reset}`);
  console.log(`${c.cyan}📁 Report saved to:${c.reset} ${savedPath}\n`);
}

async function main() {
  const args = process.argv.slice(2).filter((a) => !a.startsWith("-"));
  let query = args.join(" ").trim();
  if (!query) {
    query = await promptQuery();
  }
  await runResearch(query);
}

if (process.env.NODE_ENV !== "test") {
  main().catch((err) => {
    console.error(`\n${c.red}ERR: ${err instanceof Error ? err.message : String(err)}${c.reset}`);
    process.exit(1);
  });
}
