import { computeVisibleCharCount } from "../src/index";

describe("computeVisibleCharCount", () => {
  it("counts simple text", () => {
    const r = computeVisibleCharCount("hello world");
    expect(r.visibleCount).toBe(11);
  });

  it("does not count hashtags and mentions", () => {
    const r = computeVisibleCharCount("Hello #tag @user_name rest");
    // lengths: total 24, hashtag 4, mention 10 => visible 10
    expect(r.visibleCount).toBe(10);
  });

  it("counts any URL as 23 chars", () => {
    const r = computeVisibleCharCount("Visit https://example.com/very/long/url path");
    // Compute by comparing adjustment only
    expect(r.urlCount).toBe(1);
    const adjust = Math.max(0, r.urlOriginalLength - 23);
    const expected = r.totalChars - r.hashtagsTotalLength - r.mentionsTotalLength - adjust;
    expect(r.visibleCount).toBe(expected);
  });

  it("handles multiple urls", () => {
    const r = computeVisibleCharCount(
      "a https://a.com b https://b.com/c/d/e f"
    );
    expect(r.urlCount).toBe(2);
    const expected =
      r.totalChars - r.hashtagsTotalLength - r.mentionsTotalLength - (r.urlOriginalLength - 46);
    expect(r.visibleCount).toBe(expected);
  });
});


