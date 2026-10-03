import React, { useState } from "react";
import { Code2, Play, Copy, Check, Download, Sparkles, Terminal } from "lucide-react";
import { GeneratedCodeResponse } from "../types/index.ts";

interface CodeStudioProps {
  token: string;
  initialTopic?: string;
}

const POPULAR_TOPICS = [
  "Redis Cache Decorator for Express REST APIs",
  "JWT Authentication Middleware with Refresh Tokens",
  "Docker Multi-Stage Production Container for Node.js",
  "MongoDB Aggregation Pipeline for Candidate Ranking",
  "Next.js App Router Server Action with Validation",
  "PostgreSQL Connection Pool with Retry & Error Boundaries",
];

export const CodeStudio: React.FC<CodeStudioProps> = ({
  token,
  initialTopic = "",
}) => {
  const [topic, setTopic] = useState<string>(initialTopic || POPULAR_TOPICS[0]);
  const [language, setLanguage] = useState<string>("typescript");
  const [userContext, setUserContext] = useState<string>(
    "Build a production-grade module with strict error boundaries and clear comments."
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [codeResult, setCodeResult] = useState<GeneratedCodeResponse | null>(null);

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!topic.trim()) return;

    setErrorMsg("");
    setLoading(true);

    try {
      const res = await fetch("/resume/generate-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          topic: topic.trim(),
          language,
          userContext: userContext.trim(),
        }),
      });

      const data: GeneratedCodeResponse = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Code generation failed");
      }

      setCodeResult(data);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error generating code");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!codeResult?.code) return;
    navigator.clipboard.writeText(codeResult.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!codeResult?.code) return;
    const blob = new Blob([codeResult.code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = codeResult.filename || `CodeFlow_${topic.replace(/\s+/g, "_")}.ts`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-[1360px] mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
          <span>CodeFlow Studio</span>
          <span aria-hidden="true">/</span>
          <span className="text-slate-900 font-medium">Production Code Generator</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold font-display text-slate-900 tracking-tight">
          Transform Skill Insights into Production Code
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Generate complete, working, production-ready modules for any missing ATS skill or architecture topic using Gemini AI.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form: Topic & Configuration */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <h2 className="text-base font-bold font-display text-slate-900 flex items-center gap-2">
            <Terminal className="w-4 h-4" />
            Specification &amp; Topic
          </h2>

          {/* Quick preset chips */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-2">
              Popular Topics &amp; High-Frequency ATS Skills
            </label>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_TOPICS.map((pt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setTopic(pt)}
                  className={`text-[11px] px-2.5 py-1 rounded-md border text-left transition-colors ${
                    topic === pt
                      ? "bg-slate-900 text-white border-slate-900 font-semibold"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {pt}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Topic or Missing Skill
              </label>
              <input
                type="text"
                required
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Dockerfile for React Vite app or JWT auth middleware"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                >
                  <option value="typescript">TypeScript</option>
                  <option value="javascript">JavaScript (Node.js)</option>
                  <option value="python">Python</option>
                  <option value="go">Go</option>
                  <option value="sql">SQL / PostgreSQL</option>
                  <option value="dockerfile">Docker / Bash</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Architecture Style
                </label>
                <select className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900">
                  <option>Production Grade</option>
                  <option>Modular Service</option>
                  <option>Minimalist Utility</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Implementation Context / Requirements
              </label>
              <textarea
                rows={3}
                value={userContext}
                onChange={(e) => setUserContext(e.target.value)}
                placeholder="Specific requirements, packages to use, error handling policies..."
                className="w-full p-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:bg-white focus:border-slate-900 leading-relaxed"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4" />
              {loading ? "Generating Production Code..." : "Generate Functional Code"}
            </button>
          </form>

          {errorMsg && (
            <p className="text-xs text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
              {errorMsg}
            </p>
          )}
        </div>

        {/* Right Output: Code Editor & Preview */}
        <div className="lg:col-span-7 bg-slate-900 text-slate-100 rounded-xl overflow-hidden border border-slate-800 shadow-xl flex flex-col min-h-[520px]">
          {/* Editor Header */}
          <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              </div>
              <span className="text-xs font-mono text-slate-400 ml-2">
                {codeResult?.filename || `solution.${language === "python" ? "py" : "ts"}`}
              </span>
            </div>

            {codeResult && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </button>
              </div>
            )}
          </div>

          {/* Explanation Banner */}
          {codeResult?.explanation && (
            <div className="px-5 py-3 bg-slate-800/60 border-b border-slate-800 text-xs text-slate-300 leading-relaxed">
              <span className="font-semibold text-white">Architecture Rationale: </span>
              {codeResult.explanation}
            </div>
          )}

          {/* Code Body */}
          <div className="p-5 flex-1 overflow-x-auto font-mono text-xs leading-relaxed selection:bg-slate-700">
            {loading ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-500 space-y-3">
                <div className="w-7 h-7 border-2 border-slate-600 border-t-white rounded-full animate-spin" />
                <p>Generating production implementation for {topic}...</p>
              </div>
            ) : codeResult ? (
              <pre className="text-emerald-300 whitespace-pre">
                <code>{codeResult.code}</code>
              </pre>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-center px-6">
                <Code2 className="w-10 h-10 text-slate-600 mb-3" />
                <p className="text-sm font-semibold text-slate-400">
                  Ready to code your target skills
                </p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  Select a topic or enter a missing keyword from your ATS evaluation to generate working production-ready code.
                </p>
                <button
                  type="button"
                  onClick={() => handleGenerate()}
                  className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg inline-flex items-center gap-1.5 transition-colors"
                >
                  <Play className="w-3.5 h-3.5" />
                  Generate Sample Module
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
