export function BrandLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 300 80" className={className} role="img" aria-label="GD BOSS777">
      <defs>
        <linearGradient id="gd777-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFE9A3" />
          <stop offset="45%" stopColor="#F7C948" />
          <stop offset="100%" stopColor="#D79A17" />
        </linearGradient>
        <linearGradient id="gd777-blue" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0A47D6" />
          <stop offset="100%" stopColor="#0022A0" />
        </linearGradient>
        <filter id="gd777-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#001A66" floodOpacity="0.45" />
        </filter>
      </defs>

      {/* Badge with GD77 monogram */}
      <g filter="url(#gd777-shadow)">
        <rect
          x="4"
          y="10"
          width="60"
          height="60"
          rx="16"
          fill="url(#gd777-blue)"
          stroke="url(#gd777-gold)"
          strokeWidth="2"
        />
        <text
          x="34"
          y="41"
          textAnchor="middle"
          fontFamily="Inter, Roboto, system-ui, sans-serif"
          fontSize="22"
          fontWeight="900"
          letterSpacing="0.5"
          fill="url(#gd777-gold)"
        >
          GD
        </text>
        <text
          x="34"
          y="61"
          textAnchor="middle"
          fontFamily="Inter, Roboto, system-ui, sans-serif"
          fontSize="17"
          fontWeight="900"
          letterSpacing="0.5"
          fill="#FFFFFF"
          opacity="0.95"
        >
          777
        </text>

      </g>

      {/* Wordmark */}
      <text
        x="76"
        y="46"
        fontFamily="Inter, Roboto, system-ui, sans-serif"
        fontSize="30"
        fontWeight="800"
        letterSpacing="0.5"
        fill="#FFFFFF"
        filter="url(#gd777-shadow)"
      >
        GD BOSS
      </text>
      <text
        x="220"
        y="46"
        fontFamily="Inter, Roboto, system-ui, sans-serif"
        fontSize="30"
        fontWeight="900"
        letterSpacing="1"
        fill="url(#gd777-gold)"
        filter="url(#gd777-shadow)"
      >
        777
      </text>
      <text
        x="78"
        y="63"
        fontFamily="Inter, Roboto, system-ui, sans-serif"
        fontSize="11"
        fontWeight="600"
        letterSpacing="4"
        fill="#FFFFFF"
        opacity="0.72"
      >
        PREDICTION SUITE
      </text>
    </svg>
  );
}

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 68 80" className={className} role="img" aria-label="GD BOSS777 logo">
      <defs>
        <linearGradient id="gd777-gold-m" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFE9A3" />
          <stop offset="45%" stopColor="#F7C948" />
          <stop offset="100%" stopColor="#D79A17" />
        </linearGradient>
        <linearGradient id="gd777-blue-m" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0A47D6" />
          <stop offset="100%" stopColor="#0022A0" />
        </linearGradient>
      </defs>
      <rect
        x="4"
        y="10"
        width="60"
        height="60"
        rx="16"
        fill="url(#gd777-blue-m)"
        stroke="url(#gd777-gold-m)"
        strokeWidth="2"
      />
      <text
        x="34"
        y="41"
        textAnchor="middle"
        fontFamily="Inter, Roboto, system-ui, sans-serif"
        fontSize="22"
        fontWeight="900"
        fill="url(#gd777-gold-m)"
      >
        GD
      </text>
      <text
        x="34"
        y="61"
        textAnchor="middle"
        fontFamily="Inter, Roboto, system-ui, sans-serif"
        fontSize="17"
        fontWeight="900"
        fill="#FFFFFF"
        opacity="0.95"
      >
        777
      </text>

    </svg>
  );
}
