export const HASHTAG_REGEX = /(^|\s)#([a-zA-Z0-9_]+)/g;
export const MENTION_REGEX = /(^|\s)@([a-z0-9_]{3,20})/g;
export const URL_REGEX = /https?:\/\/\S+/g;

export type VisibleCharComputation = {
  totalChars: number;
  urlCount: number;
  urlOriginalLength: number;
  hashtagsTotalLength: number;
  mentionsTotalLength: number;
  visibleCount: number;
};

export function computeVisibleCharCount(text: string): VisibleCharComputation {
  const totalChars = [...text].length;

  const urls = text.match(URL_REGEX) ?? [];
  const urlOriginalLength = urls.reduce((acc, u) => acc + [...u].length, 0);
  const urlCount = urls.length;

  const hashtagsMatches = [...text.matchAll(HASHTAG_REGEX)];
  const hashtagsTotalLength = hashtagsMatches.reduce((acc, m) => acc + m[0].trim().length, 0);

  const mentionMatches = [...text.matchAll(MENTION_REGEX)];
  const mentionsTotalLength = mentionMatches.reduce((acc, m) => acc + m[0].trim().length, 0);

  const urlAdjustment = Math.max(0, urlOriginalLength - 23 * urlCount);
  const visibleCount = totalChars - hashtagsTotalLength - mentionsTotalLength - urlAdjustment;

  return {
    totalChars,
    urlCount,
    urlOriginalLength,
    hashtagsTotalLength,
    mentionsTotalLength,
    visibleCount,
  };
}


