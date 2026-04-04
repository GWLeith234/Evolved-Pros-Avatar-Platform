import Link from "next/link";

export default function CompoundBoardLocked() {
  return (
    <main
      className="min-h-screen relative overflow-hidden"
      style={{ background: "#0A0F18" }}
    >
      {/* Blurred preview */}
      <div
        className="absolute inset-0 opacity-40"
        style={{ filter: "blur(8px)" }}
      >
        <div className="max-w-2xl mx-auto px-4 pt-12 text-center">
          <div
            className="text-6xl font-bold mb-2"
            style={{
              fontFamily: "'Playfair Display', serif",
              color: "rgba(255,255,255,0.3)",
            }}
          >
            0
          </div>
          <div
            className="text-xs uppercase tracking-widest mb-8"
            style={{ color: "rgba(255,255,255,0.15)" }}
          >
            Compound XP
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-14 rounded-xl mb-2"
              style={{ background: "#112535" }}
            />
          ))}
        </div>
      </div>

      {/* Frosted glass lock card */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="rounded-2xl px-8 py-10 text-center max-w-sm mx-4"
          style={{
            background: "rgba(17,37,53,0.85)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
          }}
        >
          {/* Lock icon */}
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(239,14,48,0.1)" }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="5" y="11" width="14" height="10" rx="2" stroke="#EF0E30" strokeWidth="2" />
              <path d="M8 11V7a4 4 0 018 0v4" stroke="#EF0E30" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>

          <h2
            className="text-xl mb-2"
            style={{ fontFamily: "'Playfair Display', serif", color: "#fff" }}
          >
            Your habits compound.
          </h2>
          <p
            className="text-sm mb-6"
            style={{
              fontFamily: "'Barlow', sans-serif",
              color: "rgba(255,255,255,0.5)",
            }}
          >
            Track them with the Compound Board — available for VIP members.
          </p>

          <Link
            href="/auth/signup"
            className="inline-block px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors"
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              background: "#EF0E30",
              color: "#fff",
            }}
          >
            Upgrade to VIP
          </Link>
        </div>
      </div>
    </main>
  );
}
