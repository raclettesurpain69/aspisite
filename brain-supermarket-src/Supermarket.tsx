import React from "react";

const Shelf: React.FC<{ x: number; y: number; color1: string; color2: string; color3: string }> = ({ x, y, color1, color2, color3 }) => (
  <g transform={`translate(${x}, ${y})`}>
    {/* Shelf unit */}
    <rect x={0} y={0} width={120} height={180} rx={4} fill="#bdc3c7" />
    <rect x={4} y={4} width={112} height={4} fill="#95a5a6" />
    <rect x={4} y={60} width={112} height={4} fill="#95a5a6" />
    <rect x={4} y={118} width={112} height={4} fill="#95a5a6" />

    {/* Top shelf items */}
    <rect x={10} y={14} width={20} height={42} rx={3} fill={color1} />
    <rect x={34} y={20} width={20} height={36} rx={3} fill={color2} />
    <rect x={58} y={10} width={20} height={46} rx={3} fill={color3} />
    <rect x={82} y={18} width={20} height={38} rx={3} fill={color1} />

    {/* Mid shelf items */}
    <circle cx={22} cy={90} r={16} fill={color2} />
    <rect x={44} y={72} width={22} height={40} rx={3} fill={color3} />
    <circle cx={80} cy={88} r={14} fill={color1} />

    {/* Bottom shelf items */}
    <rect x={8} y={130} width={24} height={44} rx={3} fill={color3} />
    <rect x={36} y={124} width={18} height={50} rx={3} fill={color2} />
    <rect x={58} y={132} width={24} height={42} rx={3} fill={color1} />
    <circle cx={90} cy={152} r={18} fill={color2} />
  </g>
);

export const SupermarketExterior: React.FC = () => (
  <g>
    {/* Sky */}
    <rect x={0} y={0} width={1280} height={720} fill="#87CEEB" />
    {/* Ground */}
    <rect x={0} y={520} width={1280} height={200} fill="#95a5a6" />
    <rect x={0} y={520} width={1280} height={6} fill="#7f8c8d" />

    {/* Clouds */}
    <g opacity={0.9}>
      <ellipse cx={200} cy={100} rx={60} ry={35} fill="white" />
      <ellipse cx={240} cy={85} rx={50} ry={40} fill="white" />
      <ellipse cx={280} cy={100} rx={55} ry={32} fill="white" />
    </g>
    <g opacity={0.9}>
      <ellipse cx={800} cy={130} rx={70} ry={38} fill="white" />
      <ellipse cx={845} cy={110} rx={55} ry={42} fill="white" />
      <ellipse cx={890} cy={130} rx={60} ry={35} fill="white" />
    </g>

    {/* Building */}
    <rect x={200} y={180} width={880} height={360} fill="#ecf0f1" />
    <rect x={200} y={160} width={880} height={30} fill="#3498db" />

    {/* Roof decoration */}
    <rect x={190} y={145} width={900} height={20} rx={4} fill="#2980b9" />

    {/* Store sign */}
    <rect x={380} y={170} width={520} height={80} rx={8} fill="#2ecc71" />
    <text x={640} y={224} textAnchor="middle" fill="white" fontSize={42} fontWeight="bold" fontFamily="Arial">
      🛒 SUPER BRAIN
    </text>

    {/* Windows */}
    <rect x={240} y={230} width={140} height={120} rx={4} fill="#aed6f1" stroke="#3498db" strokeWidth={3} />
    <rect x={900} y={230} width={140} height={120} rx={4} fill="#aed6f1" stroke="#3498db" strokeWidth={3} />
    <line x1={310} y1={230} x2={310} y2={350} stroke="#3498db" strokeWidth={3} />
    <line x1={240} y1={290} x2={380} y2={290} stroke="#3498db" strokeWidth={3} />
    <line x1={970} y1={230} x2={970} y2={350} stroke="#3498db" strokeWidth={3} />
    <line x1={900} y1={290} x2={1040} y2={290} stroke="#3498db" strokeWidth={3} />

    {/* Door */}
    <rect x={556} y={360} width={168} height={160} rx={4} fill="#aed6f1" stroke="#3498db" strokeWidth={3} />
    <line x1={640} y1={360} x2={640} y2={520} stroke="#3498db" strokeWidth={3} />
    <circle cx={620} cy={445} r={6} fill="#3498db" />
    <circle cx={660} cy={445} r={6} fill="#3498db" />

    {/* Sidewalk */}
    <rect x={0} y={510} width={1280} height={20} fill="#bdc3c7" />

    {/* Price signs outside */}
    <rect x={260} y={470} width={100} height={40} rx={4} fill="#e74c3c" />
    <text x={310} y={497} textAnchor="middle" fill="white" fontSize={18} fontWeight="bold" fontFamily="Arial">PROMO!</text>
    <rect x={920} y={470} width={100} height={40} rx={4} fill="#e74c3c" />
    <text x={970} y={497} textAnchor="middle" fill="white" fontSize={18} fontWeight="bold" fontFamily="Arial">SOLDES!</text>
  </g>
);

export const SupermarketInterior: React.FC<{ scrollX?: number }> = ({ scrollX = 0 }) => (
  <g transform={`translate(${scrollX}, 0)`}>
    {/* Floor */}
    <rect x={-200} y={0} width={2000} height={720} fill="#f5f5f0" />

    {/* Floor tiles */}
    {Array.from({ length: 30 }).map((_, i) =>
      Array.from({ length: 10 }).map((_, j) => (
        <rect
          key={`${i}-${j}`}
          x={i * 80 - 200}
          y={j * 80}
          width={78}
          height={78}
          fill={((i + j) % 2 === 0) ? "#ecf0f1" : "#e8e8e4"}
          stroke="#ddd"
          strokeWidth={1}
        />
      ))
    )}

    {/* Ceiling */}
    <rect x={-200} y={0} width={2000} height={60} fill="#dfe6e9" />

    {/* Ceiling lights */}
    {Array.from({ length: 12 }).map((_, i) => (
      <g key={i}>
        <rect x={i * 160 - 160} y={10} width={80} height={20} rx={4} fill="#f0e68c" opacity={0.9} />
        <rect x={i * 160 - 160} y={28} width={80} height={4} fill="#ddd" />
        {/* Light glow */}
        <rect x={i * 160 - 180} y={50} width={120} height={20} fill="rgba(255,255,220,0.3)" />
      </g>
    ))}

    {/* Aisle signs */}
    <g>
      <rect x={80} y={55} width={160} height={35} rx={4} fill="#3498db" />
      <text x={160} y={79} textAnchor="middle" fill="white" fontSize={18} fontWeight="bold" fontFamily="Arial">🥛 LAITIERS</text>
    </g>
    <g>
      <rect x={380} y={55} width={160} height={35} rx={4} fill="#e67e22" />
      <text x={460} y={79} textAnchor="middle" fill="white" fontSize={18} fontWeight="bold" fontFamily="Arial">🍎 FRUITS</text>
    </g>
    <g>
      <rect x={680} y={55} width={160} height={35} rx={4} fill="#2ecc71" />
      <text x={760} y={79} textAnchor="middle" fill="white" fontSize={18} fontWeight="bold" fontFamily="Arial">🥖 BOULANG.</text>
    </g>
    <g>
      <rect x={980} y={55} width={160} height={35} rx={4} fill="#9b59b6" />
      <text x={1060} y={79} textAnchor="middle" fill="white" fontSize={18} fontWeight="bold" fontFamily="Arial">🍬 BONBONS</text>
    </g>

    {/* Shelves left side */}
    <Shelf x={20} y={90} color1="#3498db" color2="#e74c3c" color3="#2ecc71" />
    <Shelf x={160} y={90} color1="#f1c40f" color2="#9b59b6" color3="#e67e22" />
    <Shelf x={320} y={90} color1="#1abc9c" color2="#e74c3c" color3="#3498db" />
    <Shelf x={460} y={90} color1="#e67e22" color2="#2ecc71" color3="#9b59b6" />
    <Shelf x={620} y={90} color1="#3498db" color2="#f1c40f" color3="#e74c3c" />
    <Shelf x={760} y={90} color1="#2ecc71" color2="#9b59b6" color3="#1abc9c" />
    <Shelf x={920} y={90} color1="#e74c3c" color2="#3498db" color3="#f1c40f" />
    <Shelf x={1060} y={90} color1="#9b59b6" color2="#e67e22" color3="#2ecc71" />

    {/* Shelves right side (bottom) */}
    <Shelf x={20} y={420} color1="#e74c3c" color2="#3498db" color3="#f1c40f" />
    <Shelf x={160} y={420} color1="#2ecc71" color2="#e67e22" color3="#9b59b6" />
    <Shelf x={320} y={420} color1="#f1c40f" color2="#1abc9c" color3="#e74c3c" />
    <Shelf x={460} y={420} color1="#9b59b6" color2="#3498db" color3="#2ecc71" />
    <Shelf x={620} y={420} color1="#e67e22" color2="#e74c3c" color3="#3498db" />
    <Shelf x={760} y={420} color1="#3498db" color2="#f1c40f" color3="#e67e22" />
    <Shelf x={920} y={420} color1="#1abc9c" color2="#9b59b6" color3="#e74c3c" />
    <Shelf x={1060} y={420} color1="#e74c3c" color2="#2ecc71" color3="#3498db" />

    {/* Fruit/veggie stand */}
    <rect x={300} y={340} width={200} height={10} fill="#8B6914" />
    <rect x={295} y={350} width={210} height={60} rx={4} fill="#A0522D" />
    <circle cx={330} cy={330} r={20} fill="#e74c3c" />
    <circle cx={370} cy={322} r={22} fill="#e67e22" />
    <circle cx={415} cy={328} r={18} fill="#f1c40f" />
    <circle cx={458} cy={320} r={24} fill="#2ecc71" />
    <circle cx={500} cy={330} r={16} fill="#9b59b6" />
  </g>
);

export const CheckoutScene: React.FC = () => (
  <g>
    {/* Floor */}
    <rect x={0} y={0} width={1280} height={720} fill="#f5f5f0" />
    {Array.from({ length: 20 }).map((_, i) =>
      Array.from({ length: 10 }).map((_, j) => (
        <rect key={`${i}-${j}`} x={i * 80} y={j * 80} width={78} height={78}
          fill={((i + j) % 2 === 0) ? "#ecf0f1" : "#e8e8e4"} stroke="#ddd" strokeWidth={1} />
      ))
    )}
    {/* Ceiling */}
    <rect x={0} y={0} width={1280} height={60} fill="#dfe6e9" />

    {/* Checkout counter */}
    <rect x={200} y={300} width={700} height={120} rx={8} fill="#2c3e50" />
    <rect x={200} y={280} width={700} height={30} rx={4} fill="#34495e" />

    {/* Conveyor belt */}
    <rect x={220} y={295} width={500} height={16} rx={4} fill="#7f8c8d" />
    {Array.from({ length: 10 }).map((_, i) => (
      <line key={i} x1={220 + i * 52} y1={295} x2={220 + i * 52} y2={311} stroke="#95a5a6" strokeWidth={2} />
    ))}

    {/* Cash register */}
    <rect x={760} y={230} width={100} height={80} rx={6} fill="#2c3e50" />
    <rect x={770} y={240} width={80} height={50} rx={4} fill="#1a252f" />
    <rect x={775} y={245} width={70} height={35} rx={2} fill="#27ae60" />
    <text x={810} y={270} textAnchor="middle" fill="white" fontSize={18} fontWeight="bold" fontFamily="Arial">€€€</text>
    <rect x={760} y={318} width={100} height={8} rx={4} fill="#bdc3c7" />

    {/* Items on belt */}
    <rect x={280} y={268} width={30} height={24} rx={3} fill="#e74c3c" />
    <circle cx={345} cy={280} r={14} fill="#f1c40f" />
    <rect x={385} y={265} width={22} height={28} rx={3} fill="#3498db" />
    <circle cx={440} cy={278} r={16} fill="#2ecc71" />
    <rect x={480} y={270} width={18} height={22} rx={3} fill="#9b59b6" />

    {/* Cashier brain */}
    <g transform="translate(940, 310) scale(0.7)">
      {/* Small cashier brain */}
      <ellipse cx={0} cy={0} rx={40} ry={36} fill="#16a085" />
      <path d="M -30 -10 Q -18 -22 -6 -10 Q 6 2 18 -10 Q 28 -20 36 -12" fill="none" stroke="#1abc9c" strokeWidth={3} strokeLinecap="round" />
      <path d="M -28 8 Q -14 -4 0 8 Q 14 20 28 8" fill="none" stroke="#1abc9c" strokeWidth={3} strokeLinecap="round" />
      <circle cx={-13} cy={-2} r={8} fill="white" />
      <circle cx={13} cy={-2} r={8} fill="white" />
      <circle cx={-13} cy={0} r={4} fill="#2c3e50" />
      <circle cx={13} cy={0} r={4} fill="#2c3e50" />
      <path d="M -10 8 Q 0 14 10 8" fill="none" stroke="#2c3e50" strokeWidth={2.5} strokeLinecap="round" />
    </g>

    {/* Price display */}
    <rect x={860} y={200} width={160} height={60} rx={6} fill="#1a252f" />
    <text x={940} y={240} textAnchor="middle" fill="#2ecc71" fontSize={28} fontWeight="bold" fontFamily="monospace">12,50€</text>

    {/* Exit sign */}
    <rect x={1100} y={80} width={140} height={50} rx={6} fill="#27ae60" />
    <text x={1170} y={114} textAnchor="middle" fill="white" fontSize={22} fontWeight="bold" fontFamily="Arial">→ SORTIE</text>
  </g>
);
