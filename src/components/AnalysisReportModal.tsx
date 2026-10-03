import React, { useState } from "react";
import { X, Copy, Check, Download, CheckCircle2, AlertTriangle, Code2 } from "lucide-react";
import { AnalysisResponse, BulletPointImprovement } from "../types/index.ts";

interface AnalysisReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysisResult: AnalysisResponse | null;
  onOpenCodeStudioForSkill?: (skill: string) => void;
}

export const AnalysisReportModal: React.FC<AnalysisReportModalProps> = ({
  isOpen,
  onClose,
  analysisResult,
  onOpenCodeStudioForSkill,
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen || !analysisResult?.success) {
    return null;
  }

  const report =
    analysisResult.suggestions?.analysis ??
    analysisResult.suggestions ??
    analysisResult;

  const keywordScore = analysisResult.atsScore ?? 0;
  const aiScore =
    typeof report === "object" && "ats_compatibility_score" in report
      ? report.ats_compatibility_score ?? keywordScore
      : keywordScore;

  const executiveSummary =
    (typeof report === "object" &&
      ("executive_summary" in report
        ? report.executive_summary
        : "summary" in report
        ? report.summary
        : "")) ||
    "ATS Analysis complete. Review the keyword coverage and bullet optimization suggestions below.";

  const matchedSkills: string[] =
    (typeof report === "object" &&
      "matched_skills" in report &&
      Array.isArray(report.matched_skills) &&
      report.matched_skills.length > 0
      ? report.matched_skills
      : analysisResult.matchedKeywords) || [];

  const missingSkills: string[] =
    (typeof report === "object" &&
      "missing_skills" in report &&
      Array.isArray(report.missing_skills) &&
      report.missing_skills.length > 0
      ? report.missing_skills
      : analysisResult.missingKeywords) || [];

  const optimizationTips: string[] =
    (typeof report === "object" &&
      "optimization_tips" in report &&
      Array.isArray(report.optimization_tips)
      ? report.optimization_tips
      : []) || [];

  const bulletImprovements: (BulletPointImprovement | string)[] =
    (typeof report === "object" &&
      "bullet_point_improvements" in report &&
      Array.isArray(report.bullet_point_improvements)
      ? report.bullet_point_improvements
      : []) || [];

  const sectionScores =
    typeof report === "object" && "section_scores" in report && report.section_scores
      ? report.section_scores
      : {
          keyword_alignment: keywordScore,
          impact_metrics: Math.min(95, keywordScore + 6),
          formatting_readability: 88,
          role_fit: aiScore,
        };

  const getStatus = (score: number) => {
    if (score >= 75) return { label: "Pass Ready", color: "text-emerald-700", bar: "bg-emerald-600" };
    if (score >= 50) return { label: "Needs Tailoring", color: "text-amber-700", bar: "bg-amber-600" };
    return { label: "High Filter Risk", color: "text-red-700", bar: "bg-red-600" };
  };

  const status = getStatus(keywordScore);

  const handleCopyBullet = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 1800);
  };

  const handleExport = () => {
    const lines = [
      `CODEFLOW ATS ANALYSIS REPORT`,
      `Resume File: ${analysisResult.savedResume?.fileName || "Resume.pdf"}`,
      `Target Role: ${analysisResult.savedResume?.jobTitle || "Job Analysis"}`,
      `Date: ${new Date().toLocaleString()}`,
      `----------------------------------------------------`,
      `ATS Keyword Score: ${keywordScore}%`,
      `AI Compatibility: ${aiScore}%`,
      `Status: ${status.label}`,
      ``,
      `EXECUTIVE SUMMARY:`,
      executiveSummary,
      ``,
      `MATCHED SKILLS (${matchedSkills.length}):`,
      matchedSkills.join(" · "),
      ``,
      `MISSING SKILLS (${missingSkills.length}):`,
      missingSkills.join(" · "),
      ``,
      `OPTIMIZATION TIPS:`,
      ...optimizationTips.map((tip, i) => `0${i + 1}. ${tip}`),
      ``,
      `BULLET POINT REWRITES:`,
      ...bulletImprovements.map((b, i) =>
        typeof b === "string"
          ? `0${i + 1}. ${b}`
          : `0${i + 1}.\n   Original: ${b.original}\n   Improved: ${b.improved}\n   Reason: ${b.reason || ""}`
      ),
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `CodeFlow_ATS_Report_${keywordScore}pct.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 flex items-start justify-between gap-4 bg-slate-50/80">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span>{analysisResult.savedResume?.fileName || "Resume.pdf"}</span>
              <span aria-hidden="true">·</span>
              <span>{analysisResult.savedResume?.jobTitle || "Job Analysis"}</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 font-display">
              ATS Compatibility &amp; Optimization Report
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-7 text-sm">
          {/* Score Header */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pb-6 border-b border-slate-200">
            <div className="md:col-span-5 pr-0 md:pr-6 md:border-r border-slate-200">
              <p className="text-xs text-slate-500 font-medium">ATS Keyword Match</p>
              <div className="mt-1 flex items-baseline gap-3">
                <span className="text-4xl font-bold font-mono text-slate-900 tabular-nums">
                  {keywordScore}%
                </span>
                <span className="text-xs font-mono text-slate-500 tabular-nums">
                  AI Fit: {aiScore}%
                </span>
              </div>
              <p className={`mt-1.5 text-xs font-semibold ${status.color}`}>
                {status.label}
              </p>
              <div className="mt-3 w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full ${status.bar}`} style={{ width: `${keywordScore}%` }} />
              </div>
              <p className="mt-2 text-xs text-slate-500 font-mono tabular-nums">
                {matchedSkills.length} matched · {missingSkills.length} missing keywords
              </p>
            </div>

            <div className="md:col-span-7 flex flex-col justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-900 mb-1">
                  Executive Diagnostic Summary
                </p>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {executiveSummary}
                </p>
              </div>

              {/* Subscores */}
              <div className="grid grid-cols-4 gap-2 pt-4 mt-4 border-t border-slate-100 text-center">
                <div>
                  <p className="text-[11px] text-slate-500">Keywords</p>
                  <p className="font-mono font-semibold text-slate-900 tabular-nums">
                    {sectionScores.keyword_alignment}%
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500">Impact</p>
                  <p className="font-mono font-semibold text-slate-900 tabular-nums">
                    {sectionScores.impact_metrics}%
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500">Formatting</p>
                  <p className="font-mono font-semibold text-slate-900 tabular-nums">
                    {sectionScores.formatting_readability}%
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500">Role Fit</p>
                  <p className="font-mono font-semibold text-slate-900 tabular-nums">
                    {sectionScores.role_fit}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Matched vs Missing Skills */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-slate-200">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Detected Matching Skills ({matchedSkills.length})
                </h3>
              </div>
              <div className="text-xs text-slate-800 leading-relaxed font-medium">
                {matchedSkills.length > 0 ? (
                  matchedSkills.map((s, i) => (
                    <React.Fragment key={i}>
                      <span>{s}</span>
                      {i < matchedSkills.length - 1 && <span className="mx-1.5 text-slate-300">·</span>}
                    </React.Fragment>
                  ))
                ) : (
                  <span className="text-slate-400">None detected</span>
                )}
              </div>
            </div>

            <div className="md:border-l border-slate-200 md:pl-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Missing Job Keywords ({missingSkills.length})
                </h3>
              </div>
              <div className="text-xs text-slate-800 leading-relaxed font-medium mb-3">
                {missingSkills.length > 0 ? (
                  missingSkills.map((s, i) => (
                    <React.Fragment key={i}>
                      <span className="underline decoration-amber-400 decoration-2 underline-offset-2">
                        {s}
                      </span>
                      {i < missingSkills.length - 1 && <span className="mx-1.5 text-slate-300">·</span>}
                    </React.Fragment>
                  ))
                ) : (
                  <span className="text-emerald-700">All key requirements matched!</span>
                )}
              </div>

              {/* Code Studio quick CTA for missing skills */}
              {missingSkills.length > 0 && onOpenCodeStudioForSkill && (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-2 text-xs">
                  <span className="text-slate-600">Need code proof for missing skills?</span>
                  <button
                    type="button"
                    onClick={() => {
                      onOpenCodeStudioForSkill(missingSkills[0]);
                      onClose();
                    }}
                    className="inline-flex items-center gap-1 text-slate-900 font-semibold hover:underline"
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    Code '{missingSkills[0]}'
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Optimization Tips */}
          {optimizationTips.length > 0 && (
            <div className="pb-6 border-b border-slate-200">
              <h3 className="text-xs font-semibold text-slate-900 mb-3">
                Actionable Optimization Tips
              </h3>
              <div className="space-y-2 text-xs text-slate-700">
                {optimizationTips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="font-mono text-slate-400 tabular-nums shrink-0">0{i + 1}.</span>
                    <p>{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bullet Point Rewrites */}
          {bulletImprovements.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-slate-900 mb-3">
                AI Bullet Point Rewrites (Before &amp; After)
              </h3>
              <div className="divide-y divide-slate-200 border-t border-b border-slate-200">
                {bulletImprovements.map((b, i) => {
                  if (typeof b === "string") {
                    return (
                      <div key={i} className="py-3 flex items-start justify-between gap-3 text-xs">
                        <p className="text-slate-800">{b}</p>
                        <button
                          type="button"
                          onClick={() => handleCopyBullet(b, i)}
                          className="px-2 py-1 border border-slate-200 rounded hover:bg-slate-50 text-slate-600 shrink-0"
                        >
                          {copiedIndex === i ? "Copied" : "Copy"}
                        </button>
                      </div>
                    );
                  }
                  return (
                    <div key={i} className="py-3 space-y-2 text-xs">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <span className="text-[11px] text-slate-400 block mb-0.5">Original Bullet:</span>
                          <p className="text-slate-500 line-through decoration-slate-300">{b.original}</p>
                        </div>
                        <div className="md:border-l border-slate-200 md:pl-3">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-[11px] font-semibold text-emerald-700">ATS Optimized:</span>
                            <button
                              type="button"
                              onClick={() => handleCopyBullet(b.improved, i)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded"
                            >
                              {copiedIndex === i ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                              {copiedIndex === i ? "Copied" : "Copy"}
                            </button>
                          </div>
                          <p className="text-slate-900 font-medium">{b.improved}</p>
                        </div>
                      </div>
                      {b.reason && (
                        <p className="text-[11px] text-slate-500">
                          <span className="font-semibold text-slate-600">Why it scores higher: </span>
                          {b.reason}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs">
          <span className="text-slate-500">
            Stored securely in your account's Saved Reports history.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
