import React, { useState, useMemo } from "react";
import { Search, Trash2, Eye, FileText, ArrowRight, Sparkles } from "lucide-react";
import { SavedResumeRecord, AnalysisResponse } from "../types/index.ts";
import { AnalysisReportModal } from "./AnalysisReportModal.tsx";

interface SavedReportsProps {
  token: string;
  savedResumes: SavedResumeRecord[];
  onRefresh: () => void;
  onGoToAnalyzer: () => void;
  onOpenCodeStudioForSkill?: (skill: string) => void;
}

export const SavedReports: React.FC<SavedReportsProps> = ({
  token,
  savedResumes,
  onRefresh,
  onGoToAnalyzer,
  onOpenCodeStudioForSkill,
}) => {
  const [search, setSearch] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<SavedResumeRecord | null>(null);
  const [showModal, setShowModal] = useState(false);

  const filtered = useMemo(() => {
    return savedResumes.filter((r) => {
      const q = search.toLowerCase();
      return (
        !q ||
        r.fileName.toLowerCase().includes(q) ||
        r.jobTitle.toLowerCase().includes(q)
      );
    });
  }, [savedResumes, search]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/resume/history/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        onRefresh();
      }
    } catch {
      // Ignore
    }
  };

  const handleOpenReport = (record: SavedResumeRecord) => {
    setSelectedRecord(record);
    setShowModal(true);
  };

  const activeAnalysisResult: AnalysisResponse | null = selectedRecord
    ? {
        success: true,
        atsScore: selectedRecord.atsScore,
        matchedKeywords: selectedRecord.matchedKeywords || [],
        missingKeywords: selectedRecord.missingKeywords || [],
        suggestions: selectedRecord.suggestions,
        savedResume: selectedRecord,
      }
    : null;

  return (
    <div className="max-w-[1360px] mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Workspace</span>
            <span aria-hidden="true">/</span>
            <span className="text-slate-900 font-medium">Saved Reports</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-slate-900 tracking-tight">
            Saved ATS Analysis Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Historical diagnostic scores and bullet rewrites saved from your resume evaluations.
          </p>
        </div>

        {savedResumes.length > 0 && (
          <button
            type="button"
            onClick={onGoToAnalyzer}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap self-start sm:self-auto"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Analyze New Resume
          </button>
        )}
      </div>

      {/* Fresh Zero-Data Empty State */}
      {savedResumes.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-xl mx-auto my-8 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-center mx-auto">
            <FileText className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold font-display text-slate-900">
            No Saved Resume Reports Yet
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
            Your workspace is fresh. When you upload a PDF resume and run an ATS analysis, your scores, matched keywords, and AI bullet rewrites will be safely stored here for easy review and comparison.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={onGoToAnalyzer}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap"
            >
              Analyze Your First Resume
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {/* Filter Bar */}
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by file or role..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-900"
              />
            </div>
            <p className="text-xs text-slate-500 font-mono tabular-nums">
              Showing {filtered.length} of {savedResumes.length} saved reports
            </p>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-500">
                  <th className="py-3 px-6">Resume File</th>
                  <th className="py-3 px-4">Target Role</th>
                  <th className="py-3 px-4 text-right">ATS Score</th>
                  <th className="py-3 px-4 text-right">AI Score</th>
                  <th className="py-3 px-4">Missing Keywords</th>
                  <th className="py-3 px-4 text-right">Analyzed On</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {filtered.map((item) => {
                  const aiScore =
                    item.suggestions?.ats_compatibility_score ?? item.atsScore;
                  const missingList =
                    item.suggestions?.missing_skills?.slice(0, 3) ||
                    item.missingKeywords?.slice(0, 3) ||
                    [];
                  const scoreColor =
                    item.atsScore >= 75
                      ? "text-emerald-700"
                      : item.atsScore >= 50
                      ? "text-amber-700"
                      : "text-red-700";

                  return (
                    <tr
                      key={item._id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-3.5 px-6 font-medium text-slate-900 whitespace-nowrap">
                        {item.fileName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap">
                        {item.jobTitle}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums whitespace-nowrap">
                        <span className={`font-bold ${scoreColor}`}>
                          {item.atsScore}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-700 whitespace-nowrap">
                        {aiScore}%
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                        {missingList.length > 0
                          ? missingList.join(" · ")
                          : "Fully matched"}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-500 whitespace-nowrap">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-6 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenReport(item)}
                            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md transition-colors whitespace-nowrap"
                          >
                            <Eye className="w-3 h-3" />
                            View Report
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item._id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-md transition-colors"
                            title="Delete report"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Report Modal */}
      <AnalysisReportModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        analysisResult={activeAnalysisResult}
        onOpenCodeStudioForSkill={onOpenCodeStudioForSkill}
      />
    </div>
  );
};
