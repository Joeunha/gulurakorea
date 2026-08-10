/**
 * 문자열 정리 유틸
 */
export const stripTags = (v) => String(v || "").replace(/<[^>]*>/g, " ").replace(/&[a-z#0-9]+;/gi, " ").replace(/\s+/g, " ").trim();
