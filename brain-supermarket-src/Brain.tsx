import React from "react";

interface BrainProps {
  x: number;
  y: number;
  scale?: number;
  bounce?: number;
  eyeExpression?: "normal" | "happy" | "surprised" | "thinking";
  hasCart?: boolean;
  cartItems?: number;
}

export const Brain: React.FC<BrainProps> = ({
  x,
  y,
  scale = 1,
  bounce = 0,
  eyeExpression = "normal",
  hasCart = false,
  cartItems = 0,
}) => {
  const eyeY = eyeExpression === "surprised" ? -3 : 0;
  const mouthPath =
    eyeExpression === "happy"
      ? "M -12 2 Q 0 14 12 2"
      : eyeExpression === "surprised"
      ? "M -8 6 Q 0 14 8 6"
      : eyeExpression === "thinking"
      ? "M -10 4 Q 0 8 10 4"
      : "M -10 4 Q 0 10 10 4";

  return (
    <g transform={`translate(${x}, ${y + bounce})`}>
      {/* Shadow */}
      <ellipse cx={0} cy={72 * scale} rx={38 * scale} ry={8 * scale} fill="rgba(0,0,0,0.15)" />

      <g transform={`scale(${scale})`}>
        {/* Body legs */}
        <ellipse cx={-14} cy={68} rx={8} ry={12} fill="#c0392b" />
        <ellipse cx={14} cy={68} rx={8} ry={12} fill="#c0392b" />
        {/* Shoes */}
        <ellipse cx={-16} cy={79} rx={11} ry={6} fill="#2c3e50" />
        <ellipse cx={16} cy={79} rx={11} ry={6} fill="#2c3e50" />

        {/* Arms */}
        <line x1={-32} y1={10} x2={-48} y2={28} stroke="#e74c3c" strokeWidth={9} strokeLinecap="round" />
        <line x1={32} y1={10} x2={hasCart ? 54 : 48} y2={hasCart ? 20 : 28} stroke="#e74c3c" strokeWidth={9} strokeLinecap="round" />

        {/* Brain body */}
        <ellipse cx={0} cy={0} rx={40} ry={36} fill="#e74c3c" />

        {/* Brain wrinkles */}
        <path d="M -30 -10 Q -18 -22 -6 -10 Q 6 2 18 -10 Q 28 -20 36 -12" fill="none" stroke="#c0392b" strokeWidth={3} strokeLinecap="round" />
        <path d="M -28 8 Q -14 -4 0 8 Q 14 20 28 8" fill="none" stroke="#c0392b" strokeWidth={3} strokeLinecap="round" />
        <path d="M -20 -28 Q -8 -38 8 -28 Q 20 -18 32 -28" fill="none" stroke="#c0392b" strokeWidth={3} strokeLinecap="round" />

        {/* Brain highlight */}
        <ellipse cx={-12} cy={-20} rx={10} ry={6} fill="rgba(255,255,255,0.2)" />

        {/* Eyes */}
        <circle cx={-13} cy={eyeY - 2} r={8} fill="white" />
        <circle cx={13} cy={eyeY - 2} r={8} fill="white" />
        <circle cx={-13 + (eyeExpression === "thinking" ? 2 : 0)} cy={eyeY} r={4} fill="#2c3e50" />
        <circle cx={13 + (eyeExpression === "thinking" ? 2 : 0)} cy={eyeY} r={4} fill="#2c3e50" />
        {/* Eye shine */}
        <circle cx={-11} cy={eyeY - 3} r={1.5} fill="white" />
        <circle cx={15} cy={eyeY - 3} r={1.5} fill="white" />

        {/* Eyebrows */}
        {eyeExpression === "thinking" && (
          <>
            <path d="M -20 -14 Q -13 -18 -6 -14" fill="none" stroke="#c0392b" strokeWidth={2.5} strokeLinecap="round" />
            <path d="M 6 -16 Q 13 -12 20 -16" fill="none" stroke="#c0392b" strokeWidth={2.5} strokeLinecap="round" />
          </>
        )}
        {eyeExpression === "surprised" && (
          <>
            <path d="M -20 -16 Q -13 -22 -6 -16" fill="none" stroke="#c0392b" strokeWidth={2.5} strokeLinecap="round" />
            <path d="M 6 -16 Q 13 -22 20 -16" fill="none" stroke="#c0392b" strokeWidth={2.5} strokeLinecap="round" />
          </>
        )}

        {/* Mouth */}
        <path d={mouthPath} fill="none" stroke="#2c3e50" strokeWidth={2.5} strokeLinecap="round" />

        {/* Shopping cart if needed */}
        {hasCart && (
          <g transform="translate(44, 14)">
            {/* Cart body */}
            <rect x={0} y={0} width={36} height={24} rx={3} fill="none" stroke="#3498db" strokeWidth={2.5} />
            <line x1={0} y1={8} x2={36} y2={8} stroke="#3498db" strokeWidth={2} />
            {/* Cart handle */}
            <line x1={-6} y1={-8} x2={36} y2={-8} stroke="#3498db" strokeWidth={2.5} strokeLinecap="round" />
            <line x1={-6} y1={-8} x2={-6} y2={0} stroke="#3498db" strokeWidth={2.5} strokeLinecap="round" />
            {/* Cart wheels */}
            <circle cx={8} cy={28} r={4} fill="#3498db" />
            <circle cx={28} cy={28} r={4} fill="#3498db" />
            {/* Items in cart */}
            {cartItems > 0 && (
              <rect x={4} y={-4} width={10} height={10} rx={2} fill="#e67e22" />
            )}
            {cartItems > 1 && (
              <rect x={16} y={-6} width={8} height={12} rx={2} fill="#2ecc71" />
            )}
            {cartItems > 2 && (
              <circle cx={28} cy={2} r={5} fill="#f1c40f" />
            )}
          </g>
        )}
      </g>
    </g>
  );
};
