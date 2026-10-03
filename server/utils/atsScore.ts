import { extractKeywords, extractDomainKeywords } from "./keywordExtractor.ts";

export const calculateATSScore = (
  jdKeywords: string[],
  resumeKeywords: string[]
): number => {
  const uniqueJD = [...new Set(jdKeywords)];
  if (uniqueJD.length === 0) return 0;
  const resumeSet = new Set(resumeKeywords);
  const matches = uniqueJD.filter((k) => resumeSet.has(k));
  return Math.round((matches.length / uniqueJD.length) * 100);
};

export interface KeywordAnalysisBreakdown {
  atsScore: number;
  rawAtsScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  totalUniqueJdKeywords: number;
  matchedCount: number;
}

export const analyzeKeywordsDetailed = (
  jobDescription: string,
  resumeText: string
): KeywordAnalysisBreakdown => {
  const rawJdKeywords = extractKeywords(jobDescription);
  const rawResumeKeywords = extractKeywords(resumeText);
  const rawAtsScore = calculateATSScore(rawJdKeywords, rawResumeKeywords);

  const domainJd = extractDomainKeywords(jobDescription);
  const domainResume = new Set(extractDomainKeywords(resumeText));

  const matchedKeywords = domainJd.filter((k) => domainResume.has(k));
  const missingKeywords = domainJd.filter((k) => !domainResume.has(k));

  const domainScore =
    domainJd.length > 0
      ? Math.round((matchedKeywords.length / domainJd.length) * 100)
      : rawAtsScore;

  const atsScore = Math.min(100, Math.max(rawAtsScore, domainScore));

  return {
    atsScore,
    rawAtsScore,
    matchedKeywords,
    missingKeywords,
    totalUniqueJdKeywords: domainJd.length,
    matchedCount: matchedKeywords.length,
  };
};
