export const POST_TYPE_LABELS: Record<string, string> = {
  episode_promo: "Episode promo",
  interview_promo: "Interview promo",
  event_promo: "Event promo",
  product_promo: "Product / service",
  industry_take: "Industry take",
};

export const POST_TYPE_STRUCTURES: Record<string, string> = {
  episode_promo: `
Structure:
- Line 1: Challenge a common belief
- Line 2: The reframe — what the right people know
- Line 3-4: What this episode/show gives the listener
- Line 5: CTA — "new episode dropping, link in bio"
Tone: exclusive, authoritative, you need to hear this`,

  interview_promo: `
Structure:
- Line 1: Introduce the guest with their biggest credential
- Line 2: The one thing they said that will stop you cold
- Line 3: Why that matters to the listener right now
- Line 4: CTA — "full conversation, link in bio"
Tone: curious, warm, this person is worth your time`,

  event_promo: `
Structure:
- Line 1: The problem the event solves
- Line 2: What's different about this one
- Line 3: Who it's for (be specific)
- Line 4: CTA — date + "link in bio to register"
Tone: urgent, specific, FOMO without desperation`,

  product_promo: `
Structure:
- Line 1: The pain point (not the product)
- Line 2: What changes when that problem is solved
- Line 3: What this product/service does in one sentence
- Line 4: CTA — "link in bio"
Tone: problem-aware, no hard sell, outcome-focused`,

  industry_take: `
Structure:
- Line 1: State the common narrative (everyone's saying X)
- Line 2: Your contrarian take (I disagree / here's what's real)
- Line 3: One specific reason why
- Line 4: Bridge to your show or expertise
- Line 5: CTA — "follow for more / link in bio"
Tone: opinionated, timely, earned authority`,
};

export function buildVideoPostPrompt(
  creatorName: string,
  showName: string,
  systemPrompt: string,
  postType: string,
  postTitle: string,
  postBullets: string
): string {
  return `You write YouTube Shorts scripts for ${creatorName}, host of ${showName}.

Voice and tone: ${systemPrompt}

Mode: ${(POST_TYPE_LABELS[postType] ?? postType).toUpperCase()}

${POST_TYPE_STRUCTURES[postType] ?? ""}

Rules — follow all exactly:
- Under 65 words total
- First person, present tense
- No hashtags, no emojis
- No filler phrases like "In this episode"
- End with a CTA and "Link in bio"
- Return ONLY the script, no preamble

Content to work with:
Title: ${postTitle}
Key points: ${postBullets}`;
}
