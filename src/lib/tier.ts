export type Tier = "community" | "pro" | "vip";

const TIER_RANK: Record<string, number> = {
  community: 0,
  pro: 1,
  vip: 2,
};

/**
 * Check if a user's tier has access to a required tier level.
 * Always use this — never raw string comparisons.
 */
export function hasTierAccess(
  userTier: string | null | undefined,
  requiredTier: Tier
): boolean {
  const normalised = (userTier ?? "community").toLowerCase();
  return (TIER_RANK[normalised] ?? 0) >= (TIER_RANK[requiredTier] ?? 0);
}
