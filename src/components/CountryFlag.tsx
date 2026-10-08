export function SpainFlag({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 750 500"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
    >
      {/* Top red stripe */}
      <rect width="750" height="125" fill="#AA151B" />
      {/* Middle yellow stripe (double width) */}
      <rect y="125" width="750" height="250" fill="#F1BF00" />
      {/* Bottom red stripe */}
      <rect y="375" width="750" height="125" fill="#AA151B" />

      {/* Spanish Coat of Arms heraldic emblem */}
      <g transform="translate(190, 250) scale(0.95)">
        {/* Left Pillar of Hercules */}
        <rect x="-80" y="-70" width="14" height="130" rx="3" fill="#EAEAEA" stroke="#BBBBBB" strokeWidth="2" />
        <rect x="-88" y="52" width="30" height="12" rx="2" fill="#D4AF37" />
        <rect x="-88" y="-76" width="30" height="12" rx="2" fill="#D4AF37" />
        <path d="M-88 -10 Q-65 -22 -88 -34" stroke="#AA151B" strokeWidth="8" fill="none" strokeLinecap="round" />

        {/* Right Pillar of Hercules */}
        <rect x="66" y="-70" width="14" height="130" rx="3" fill="#EAEAEA" stroke="#BBBBBB" strokeWidth="2" />
        <rect x="58" y="52" width="30" height="12" rx="2" fill="#D4AF37" />
        <rect x="58" y="-76" width="30" height="12" rx="2" fill="#D4AF37" />
        <path d="M66 -10 Q89 -22 66 -34" stroke="#AA151B" strokeWidth="8" fill="none" strokeLinecap="round" />

        {/* Royal Crown top crest */}
        <path d="M-36 -46 L-36 -68 L-18 -55 L0 -76 L18 -55 L36 -68 L36 -46 Z" fill="#D4AF37" stroke="#997A15" strokeWidth="2" />
        <circle cx="0" cy="-79" r="6" fill="#F1BF00" stroke="#997A15" strokeWidth="1.5" />
        <circle cx="-36" cy="-70" r="4" fill="#AA151B" />
        <circle cx="36" cy="-70" r="4" fill="#AA151B" />

        {/* Main Shield Body */}
        <path
          d="M-44 -42 L44 -42 L44 20 Q44 72 0 88 Q-44 72 -44 20 Z"
          fill="#AA151B"
          stroke="#D4AF37"
          strokeWidth="6"
        />

        {/* Shield Quarter 1: Castile (Gold Castle) */}
        <rect x="-40" y="-38" width="40" height="46" fill="#AA151B" />
        <rect x="-29" y="-22" width="18" height="22" fill="#F1BF00" rx="2" />
        <rect x="-33" y="-12" width="26" height="14" fill="#F1BF00" rx="1" />

        {/* Shield Quarter 2: León (Silver with Purple Lion) */}
        <rect x="0" y="-38" width="40" height="46" fill="#FFFFFF" />
        <circle cx="20" cy="-15" r="10" fill="#9B111E" />
        <rect x="14" y="-8" width="12" height="12" rx="2" fill="#9B111E" />

        {/* Shield Quarter 3: Aragon (Gold with 4 Red Stripes) */}
        <rect x="-40" y="8" width="40" height="46" fill="#F1BF00" />
        <line x1="-32" y1="8" x2="-32" y2="58" stroke="#AA151B" strokeWidth="4" />
        <line x1="-24" y1="8" x2="-24" y2="66" stroke="#AA151B" strokeWidth="4" />
        <line x1="-16" y1="8" x2="-16" y2="72" stroke="#AA151B" strokeWidth="4" />

        {/* Shield Quarter 4: Navarre (Gold Chains) */}
        <rect x="0" y="8" width="40" height="46" fill="#AA151B" />
        <circle cx="20" cy="30" r="8" fill="#F1BF00" stroke="#997A15" strokeWidth="2" />
        <path d="M12 22 L28 38 M28 22 L12 38" stroke="#F1BF00" strokeWidth="2" />

        {/* Center Inescutcheon: Bourbon (French Lilies) */}
        <ellipse cx="0" cy="8" rx="8" ry="10" fill="#002395" stroke="#FFFFFF" strokeWidth="1.5" />
        <circle cx="0" cy="8" r="3" fill="#F1BF00" />
      </g>
    </svg>
  );
}

export function GermanyFlag({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 750 500"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
    >
      <rect width="750" height="166.7" fill="#000000" />
      <rect y="166.7" width="750" height="166.7" fill="#DD0000" />
      <rect y="333.4" width="750" height="166.7" fill="#FFCE00" />
    </svg>
  );
}

export function JapanFlag({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 750 500"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
    >
      <rect width="750" height="500" fill="#FFFFFF" />
      <circle cx="375" cy="250" r="145" fill="#BC002D" />
    </svg>
  );
}

export function FranceFlag({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 750 500"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
    >
      <rect width="250" height="500" fill="#002395" />
      <rect x="250" width="250" height="500" fill="#FFFFFF" />
      <rect x="500" width="250" height="500" fill="#ED2939" />
    </svg>
  );
}

export function ItalyFlag({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 750 500"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
    >
      <rect width="250" height="500" fill="#009246" />
      <rect x="250" width="250" height="500" fill="#FFFFFF" />
      <rect x="500" width="250" height="500" fill="#CE2B37" />
    </svg>
  );
}

interface CountryFlagProps {
  code?: string;
  title?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function CountryFlag({
  code,
  title,
  size = "md",
  className = "",
}: CountryFlagProps) {
  const c = (code || "").trim().toLowerCase();
  const t = (title || "").trim().toLowerCase();

  const sizeClasses = {
    sm: "w-5 h-3.5 rounded-sm",
    md: "w-7 h-[19px] rounded-md",
    lg: "w-10 h-7 rounded-lg",
    xl: "w-16 h-11 rounded-xl shadow-md",
  }[size];

  const wrapperClass = `inline-flex items-center justify-center overflow-hidden shrink-0 border border-black/15 shadow-sm align-middle select-none ${sizeClasses} ${className}`;

  if (c === "jp" || c === "ja" || t.includes("japan") || t.includes("nihon")) {
    return (
      <span className={wrapperClass} title="Japan">
        <JapanFlag className="w-full h-full block" />
      </span>
    );
  }

  if (c === "es" || t.includes("spanish") || t.includes("espan")) {
    return (
      <span className={wrapperClass} title="Spain">
        <SpainFlag className="w-full h-full block" />
      </span>
    );
  }

  if (c === "de" || t.includes("german") || t.includes("deutsch")) {
    return (
      <span className={wrapperClass} title="Germany">
        <GermanyFlag className="w-full h-full block" />
      </span>
    );
  }

  if (c === "fr" || t.includes("french") || t.includes("franc")) {
    return (
      <span className={wrapperClass} title="France">
        <FranceFlag className="w-full h-full block" />
      </span>
    );
  }

  if (c === "it" || t.includes("italian") || t.includes("ital")) {
    return (
      <span className={wrapperClass} title="Italy">
        <ItalyFlag className="w-full h-full block" />
      </span>
    );
  }

  // Fallback
  return (
    <span className={`inline-flex items-center justify-center bg-blue-50 text-blue-600 font-bold ${wrapperClass}`}>
      🌐
    </span>
  );
}
