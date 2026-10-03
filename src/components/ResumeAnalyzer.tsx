import React, { useState, useMemo, useRef } from "react";
import { Upload, FileText, Sparkles, CheckCircle2, AlertCircle, Eye } from "lucide-react";
import { AnalysisResponse, JOB_PRESETS } from "../types/index.ts";
import { AnalysisReportModal } from "./AnalysisReportModal.tsx";

interface ResumeAnalyzerProps {
  token: string;
  onAnalysisSaved: () => void;
  onOpenCodeStudioForSkill?: (skill: string) => void;
}

const STOP_WORDS_SET = new Set([
  "the", "and", "for", "are", "you", "will", "with", "that", "this", "from",
  "have", "has", "had", "not", "but", "what", "all", "were", "when", "your",
  "can", "our", "work", "join", "team", "any", "good", "nice", "related",
  "field", "strong", "abilities", "understanding", "familiarity", "exposure",
  "knowledge", "experience", "proficiency", "requirements", "responsibilities",
  "across", "build", "building", "maintaining", "maintain", "develop",
  "using", "modern", "entry", "level", "motivated", "looking"
]);

function getClientKeywords(txt: string): string[] {
  const matches = txt.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
  return [...new Set(matches.filter((w) => !STOP_WORDS_SET.has(w)))];
}

export const ResumeAnalyzer: React.FC<ResumeAnalyzerProps> = ({
  token,
  onAnalysisSaved,
  onOpenCodeStudioForSkill,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [extractedText, setExtractedText] = useState<string>("");
  const [selectedPreset, setSelectedPreset] = useState<string>("fullstack-dev");
  const [jobTitle, setJobTitle] = useState<string>(JOB_PRESETS[0].title);
  const [jobDescription, setJobDescription] = useState<string>(JOB_PRESETS[0].description);

  const [loading, setLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [uploadSuccess, setUploadSuccess] = useState<string>("");

  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);

  // Live client-side keyword telemetry
  const liveStats = useMemo(() => {
    const jdKeywords = getClientKeywords(jobDescription);
    const resKeywords = new Set(getClientKeywords(extractedText));
    const matched = jdKeywords.filter((k) => resKeywords.has(k));
    const missing = jdKeywords.filter((k) => !resKeywords.has(k));
    const score = jdKeywords.length > 0 ? Math.round((matched.length / jdKeywords.length) * 100) : 0;
    return {
      score,
      matchedCount: matched.length,
      totalCount: jdKeywords.length,
      matchedPreview: matched.slice(0, 10),
      missingPreview: missing.slice(0, 8),
    };
  }, [jobDescription, extractedText]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
      setErrorMsg("Please upload a PDF document (.pdf).");
      return;
    }

    setSelectedFile(file);
    setFileName(file.name);
    setErrorMsg("");
    setUploadSuccess("");
    setLoading(true);
    setLoadingStep("Parsing PDF buffer via Mozilla pdfjs-dist...");

    try {
      const formData = new FormData();
      formData.append("resume", file);

      const res = await fetch("/resume/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to extract text from PDF");
      }

      setExtractedText(data.text);
      setUploadSuccess(`Extracted ${data.characters.toLocaleString()} characters from ${file.name}`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error reading PDF file");
    } finally {
      setLoading(false);
      setLoadingStep("");
    }
  };

  const handlePresetSelect = (presetId: string) => {
    setSelectedPreset(presetId);
    const p = JOB_PRESETS.find((x) => x.id === presetId);
    if (p) {
      setJobTitle(p.title);
      setJobDescription(p.description);
    }
  };

  const handleAnalyze = async () => {
    if (!extractedText.trim()) {
      setErrorMsg("Please upload a PDF resume or enter your resume text first.");
      return;
    }
    if (!jobDescription.trim()) {
      setErrorMsg("Please provide a target job description to match against.");
      return;
    }

    setErrorMsg("");
    setLoading(true);
    setLoadingStep("Step 1/2: Extracting keywords & running ATS compatibility scoring...");

    try {
      const res = await fetch("/resume/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          resumeText: extractedText.trim(),
          jobDescription: jobDescription.trim(),
          fileName: fileName || "Resume_Upload.pdf",
          jobTitle: jobTitle.trim(),
        }),
      });

      const data: AnalysisResponse = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      setAnalysisResult(data);
      setShowModal(true);
      onAnalysisSaved();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Analysis request failed");
    } finally {
      setLoading(false);
      setLoadingStep("");
    }
  };

  return (
    <div className="max-w-[1360px] mx-auto px-6 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>ATS Diagnostic Engine</span>
            <span aria-hidden="true">/</span>
            <span className="text-slate-900 font-medium">PDF Parser &amp; Keyword Matcher</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-slate-900 tracking-tight">
            ATS Resume Analyzer &amp; Job Description Matcher
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Upload your PDF resume to extract raw text, calculate real-time keyword coverage, and get AI bullet-point rewrites.
          </p>
        </div>

        {analysisResult?.success && (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors whitespace-nowrap self-start sm:self-auto"
          >
            <Eye className="w-3.5 h-3.5" />
            View Last Report ({analysisResult.atsScore}%)
          </button>
        )}
      </div>

      {/* Alerts */}
      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-xs sm:text-sm text-red-800">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {uploadSuccess && !errorMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{uploadSuccess}</span>
          </div>
          <span className="font-mono text-emerald-700">Ready for ATS Scoring</span>
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: PDF Upload & Extracted Text (6 cols) */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold font-display text-slate-900">
              01. PDF Resume Upload
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Multer binary upload parsed into clean text via Mozilla pdfjs-dist
            </p>
          </div>

          {/* Upload Dropzone */}
          <div className="border-2 border-dashed border-slate-300 hover:border-slate-400 bg-slate-50/60 rounded-xl p-5 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {fileName || "Select or Drag PDF Resume"}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedFile
                      ? `${(selectedFile.size / 1024).toFixed(1)} KB · PDF Document`
                      : "Supports standard PDF files up to 10MB"}
                  </p>
                </div>
              </div>

              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="pdf-file-upload-input"
                />
                <label
                  htmlFor="pdf-file-upload-input"
                  className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors whitespace-nowrap"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Choose PDF
                </label>
              </div>
            </div>
          </div>

          {/* Extracted Text Area */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Extracted Resume Content (Editable)
              </label>
              <span className="text-xs font-mono text-slate-500 tabular-nums">
                {extractedText.length.toLocaleString()} characters
              </span>
            </div>
            <textarea
              rows={12}
              value={extractedText}
              onChange={(e) => setExtractedText(e.target.value)}
              placeholder="Upload your PDF above to automatically extract readable text, or paste your resume content here directly..."
              className="w-full p-3.5 text-xs font-mono text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-900 leading-relaxed"
            />
          </div>
        </div>

        {/* RIGHT COLUMN: Target Job Description & Scoring (6 cols) */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold font-display text-slate-900">
              02. Target Job Description &amp; Requirements
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose a role benchmark or paste the exact job posting
            </p>
          </div>

          {/* Presets */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Role Presets
            </label>
            <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-lg">
              {JOB_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handlePresetSelect(p.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    selectedPreset === p.id
                      ? "bg-white text-slate-900 shadow-xs font-semibold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {p.title.split(" (")[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Title & Description Fields */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Role Title
              </label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Junior Full Stack Developer"
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Job Description Text
                </label>
                <span className="text-xs font-mono text-slate-500 tabular-nums">
                  {liveStats.totalCount} target keywords
                </span>
              </div>
              <textarea
                rows={7}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the target job description requirements and qualifications here..."
                className="w-full p-3.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-900 leading-relaxed"
              />
            </div>
          </div>

          {/* Live Overlap Strip */}
          <div className="pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-900">
                  Pre-Flight Keyword Match Telemetry
                </p>
                <p className="text-[11px] text-slate-500">
                  (Matched Words / Unique JD Words) × 100
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                  {liveStats.score}%
                </span>
                <p className="text-[11px] text-slate-500 font-mono tabular-nums">
                  {liveStats.matchedCount} / {liveStats.totalCount} terms
                </p>
              </div>
            </div>

            {liveStats.missingPreview.length > 0 && (
              <p className="text-xs text-slate-600 mt-2">
                <span className="font-semibold text-amber-700">Missing keywords to add: </span>
                {liveStats.missingPreview.join(" · ")}
              </p>
            )}
          </div>

          {/* Analyze Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full py-3 px-5 inline-flex items-center justify-center gap-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4" />
              {loading ? loadingStep || "Analyzing Resume..." : "Run ATS & Gemini AI Analysis"}
            </button>
          </div>
        </div>
      </div>

      {/* Analysis Modal */}
      <AnalysisReportModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        analysisResult={analysisResult}
        onOpenCodeStudioForSkill={onOpenCodeStudioForSkill}
      />
    </div>
  );
};
