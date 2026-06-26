import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Brain } from "./Brain";
import { SupermarketExterior, SupermarketInterior, CheckoutScene } from "./Supermarket";

export const BrainSupermarket: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Scene timings (at 30fps)
  // 0-60:   Title / intro
  // 60-120: Exterior - brain walks to store
  // 120-180: Enter store
  // 180-300: Shopping in aisles
  // 300-390: Checkout
  // 390-450: Exit / end card

  const bounce = Math.sin(frame * 0.3) * 4;

  // ─── SCENE 1: TITLE (0–60) ───
  const titleOpacity = interpolate(frame, [0, 20, 45, 60], [0, 1, 1, 0]);
  const titleScale = interpolate(frame, [0, 20], [0.6, 1], { extrapolateRight: "clamp" });

  // ─── SCENE 2: EXTERIOR + WALKING (60–120) ───
  const exteriorOpacity = interpolate(frame, [55, 70, 110, 120], [0, 1, 1, 0]);
  const brainWalkX = interpolate(frame, [60, 115], [-120, 560], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const brainWalkBounce = frame >= 60 && frame <= 115 ? Math.sin(frame * 0.5) * 8 : 0;

  // ─── SCENE 3: ENTER STORE (120–180) ───
  const enterOpacity = interpolate(frame, [118, 130, 170, 180], [0, 1, 1, 0]);
  const enterScale = spring({ frame: frame - 120, fps, config: { damping: 14, stiffness: 80 } });
  const enterBrainX = interpolate(frame, [120, 175], [-100, 300], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // ─── SCENE 4: SHOPPING (180–300) ───
  const shopOpacity = interpolate(frame, [178, 190, 290, 300], [0, 1, 1, 0]);
  const shopScrollX = interpolate(frame, [190, 285], [0, -700], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const shopBrainX = interpolate(frame, [190, 285], [300, 700], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cartItems = frame < 210 ? 0 : frame < 235 ? 1 : frame < 260 ? 2 : 3;
  const thinkBubbleVisible = frame >= 195 && frame <= 225;
  const thinkOpacity = interpolate(frame, [195, 205, 215, 225], [0, 1, 1, 0]);

  // ─── SCENE 5: CHECKOUT (300–390) ───
  const checkoutOpacity = interpolate(frame, [298, 310, 380, 390], [0, 1, 1, 0]);
  const checkoutBrainX = interpolate(frame, [310, 365], [-100, 320], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const happyScale = frame > 360 ? spring({ frame: frame - 360, fps, config: { damping: 10, stiffness: 120 } }) : 1;

  // ─── SCENE 6: END CARD (390–450) ───
  const endOpacity = interpolate(frame, [388, 402, 445, 450], [0, 1, 1, 0]);
  const starSpin = interpolate(frame, [390, 450], [0, Math.PI * 4]);

  return (
    <AbsoluteFill style={{ background: "#1a1a2e", fontFamily: "Arial, sans-serif" }}>

      {/* ── SCENE 1: TITLE ── */}
      {frame < 65 && (
        <AbsoluteFill
          style={{
            background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: titleOpacity,
          }}
        >
          <svg width={1280} height={720}>
            {/* Stars background */}
            {Array.from({ length: 40 }).map((_, i) => (
              <circle
                key={i}
                cx={(i * 137 + 50) % 1280}
                cy={(i * 97 + 30) % 720}
                r={Math.sin(i) * 2 + 2}
                fill="white"
                opacity={0.5 + Math.sin(frame * 0.1 + i) * 0.3}
              />
            ))}
            <g transform={`translate(640, 360) scale(${titleScale})`}>
              {/* Title card */}
              <rect x={-420} y={-180} width={840} height={360} rx={24} fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.3)" strokeWidth={2} />
              <text textAnchor="middle" y={-80} fontSize={72} fontWeight="bold" fill="white">
                🧠 AU SUPERMARCHÉ
              </text>
              <text textAnchor="middle" y={20} fontSize={36} fill="#aed6f1">
                Les aventures de Cerveau
              </text>
              {/* Mini brain in title */}
              <Brain x={0} y={110} scale={0.6} bounce={bounce} eyeExpression="happy" />
            </g>
          </svg>
        </AbsoluteFill>
      )}

      {/* ── SCENE 2: EXTERIOR ── */}
      {frame >= 55 && frame < 125 && (
        <AbsoluteFill style={{ opacity: exteriorOpacity }}>
          <svg width={1280} height={720}>
            <SupermarketExterior />
            <Brain
              x={brainWalkX}
              y={430}
              scale={1}
              bounce={brainWalkBounce}
              eyeExpression="happy"
            />
            {/* Speech bubble */}
            {frame >= 70 && frame <= 110 && (
              <g transform={`translate(${brainWalkX}, 370)`} opacity={interpolate(frame, [70, 82, 102, 110], [0, 1, 1, 0])}>
                <ellipse cx={60} cy={-20} rx={80} ry={35} fill="white" stroke="#ccc" strokeWidth={2} />
                <polygon points="-10,-5 10,-5 -8,10" fill="white" stroke="#ccc" strokeWidth={1} />
                <text x={60} y={-14} textAnchor="middle" fontSize={22} fill="#2c3e50">Je fais mes</text>
                <text x={60} y={12} textAnchor="middle" fontSize={22} fill="#2c3e50">courses! 🛒</text>
              </g>
            )}
          </svg>
        </AbsoluteFill>
      )}

      {/* ── SCENE 3: ENTERING STORE ── */}
      {frame >= 118 && frame < 185 && (
        <AbsoluteFill style={{ opacity: enterOpacity }}>
          <svg width={1280} height={720}>
            <SupermarketInterior scrollX={0} />
            {/* Entrance arch */}
            <path d="M 440 720 L 440 200 Q 640 100 840 200 L 840 720" fill="rgba(52,152,219,0.15)" stroke="#3498db" strokeWidth={4} />
            <text x={640} y={170} textAnchor="middle" fill="#3498db" fontSize={28} fontWeight="bold">BIENVENUE!</text>

            <Brain
              x={enterBrainX}
              y={480}
              scale={enterScale * 0.9 + 0.1}
              bounce={Math.sin(frame * 0.5) * 6}
              eyeExpression="surprised"
            />

            {/* Wow bubble */}
            {frame >= 130 && frame <= 170 && (
              <g transform={`translate(${enterBrainX}, 400)`} opacity={interpolate(frame, [130, 140, 163, 170], [0, 1, 1, 0])}>
                <ellipse cx={70} cy={-20} rx={90} ry={38} fill="white" stroke="#ccc" strokeWidth={2} />
                <polygon points="-10,-5 10,-5 -8,10" fill="white" stroke="#ccc" strokeWidth={1} />
                <text x={70} y={-22} textAnchor="middle" fontSize={22} fill="#2c3e50">Waouh... c'est</text>
                <text x={70} y={4} textAnchor="middle" fontSize={22} fill="#2c3e50">immense ici! 😲</text>
              </g>
            )}
          </svg>
        </AbsoluteFill>
      )}

      {/* ── SCENE 4: SHOPPING ── */}
      {frame >= 178 && frame < 305 && (
        <AbsoluteFill style={{ opacity: shopOpacity }}>
          <svg width={1280} height={720}>
            <SupermarketInterior scrollX={shopScrollX} />

            <Brain
              x={shopBrainX}
              y={360}
              scale={1}
              bounce={Math.sin(frame * 0.4) * 5}
              eyeExpression={frame < 225 ? "thinking" : "happy"}
              hasCart
              cartItems={cartItems}
            />

            {/* Think bubble: what to buy */}
            {thinkBubbleVisible && (
              <g transform={`translate(${shopBrainX}, 260)`} opacity={thinkOpacity}>
                {/* Thought dots */}
                <circle cx={30} cy={10} r={4} fill="white" stroke="#ccc" strokeWidth={1} />
                <circle cx={50} cy={-5} r={6} fill="white" stroke="#ccc" strokeWidth={1} />
                <circle cx={74} cy={-18} r={9} fill="white" stroke="#ccc" strokeWidth={1} />
                {/* Bubble */}
                <ellipse cx={150} cy={-55} rx={100} ry={55} fill="white" stroke="#ccc" strokeWidth={2} />
                <text x={150} y={-75} textAnchor="middle" fontSize={18} fill="#2c3e50">🥛 Lait</text>
                <text x={150} y={-50} textAnchor="middle" fontSize={18} fill="#2c3e50">🍎 Pommes</text>
                <text x={150} y={-25} textAnchor="middle" fontSize={18} fill="#2c3e50">🍫 Chocolat</text>
              </g>
            )}

            {/* Item pick animations */}
            {frame >= 210 && frame < 235 && (
              <g transform={`translate(${shopBrainX + 40}, ${360 - interpolate(frame, [210, 222], [0, 80], { extrapolateRight: "clamp" })})`}
                opacity={interpolate(frame, [210, 215, 228, 235], [0, 1, 1, 0])}>
                <circle cx={0} cy={0} r={18} fill="#e74c3c" />
                <text x={0} y={6} textAnchor="middle" fontSize={20}>🍎</text>
              </g>
            )}
            {frame >= 237 && frame < 262 && (
              <g transform={`translate(${shopBrainX + 40}, ${360 - interpolate(frame, [237, 249], [0, 80], { extrapolateRight: "clamp" })})`}
                opacity={interpolate(frame, [237, 242, 255, 262], [0, 1, 1, 0])}>
                <circle cx={0} cy={0} r={18} fill="#3498db" />
                <text x={0} y={6} textAnchor="middle" fontSize={20}>🥛</text>
              </g>
            )}
            {frame >= 264 && frame < 290 && (
              <g transform={`translate(${shopBrainX + 40}, ${360 - interpolate(frame, [264, 276], [0, 80], { extrapolateRight: "clamp" })})`}
                opacity={interpolate(frame, [264, 269, 282, 290], [0, 1, 1, 0])}>
                <circle cx={0} cy={0} r={18} fill="#f1c40f" />
                <text x={0} y={6} textAnchor="middle" fontSize={20}>🍫</text>
              </g>
            )}
          </svg>
        </AbsoluteFill>
      )}

      {/* ── SCENE 5: CHECKOUT ── */}
      {frame >= 298 && frame < 395 && (
        <AbsoluteFill style={{ opacity: checkoutOpacity }}>
          <svg width={1280} height={720}>
            <CheckoutScene />
            <Brain
              x={checkoutBrainX}
              y={370}
              scale={happyScale * 0.85 + 0.15}
              bounce={frame > 360 ? Math.sin(frame * 0.6) * 10 : Math.sin(frame * 0.4) * 4}
              eyeExpression={frame > 360 ? "happy" : "normal"}
              hasCart={frame < 355}
              cartItems={3}
            />

            {/* Happy stars after paying */}
            {frame > 360 && (
              <>
                {[0, 1, 2, 3, 4].map((i) => {
                  const angle = starSpin + (i * Math.PI * 2) / 5;
                  const r = 100;
                  return (
                    <g key={i} transform={`translate(${checkoutBrainX + Math.cos(angle) * r}, ${370 + Math.sin(angle) * r})`}
                      opacity={interpolate(frame, [360, 375], [0, 1], { extrapolateRight: "clamp" })}>
                      <text fontSize={28} textAnchor="middle" dy="8">⭐</text>
                    </g>
                  );
                })}
                <g transform={`translate(${checkoutBrainX}, 260)`}
                  opacity={interpolate(frame, [362, 372, 382, 390], [0, 1, 1, 0])}>
                  <ellipse cx={40} cy={-20} rx={80} ry={32} fill="white" stroke="#ccc" strokeWidth={2} />
                  <polygon points="-10,-5 10,-5 -4,8" fill="white" stroke="#ccc" strokeWidth={1} />
                  <text x={40} y={-27} textAnchor="middle" fontSize={20} fill="#2c3e50">Parfait! 🎉</text>
                  <text x={40} y={-3} textAnchor="middle" fontSize={20} fill="#27ae60">12,50 €</text>
                </g>
              </>
            )}
          </svg>
        </AbsoluteFill>
      )}

      {/* ── SCENE 6: END CARD ── */}
      {frame >= 388 && (
        <AbsoluteFill
          style={{
            background: "linear-gradient(135deg, #0f3460 0%, #16213e 50%, #1a1a2e 100%)",
            opacity: endOpacity,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width={1280} height={720}>
            {/* Confetti */}
            {Array.from({ length: 30 }).map((_, i) => {
              const confettiX = ((i * 173 + frame * (i % 3 + 1) * 2) % 1280);
              const confettiY = ((frame - 390) * (i % 3 + 1) * 2 + i * 40) % 800 - 40;
              const colors = ["#e74c3c", "#3498db", "#2ecc71", "#f1c40f", "#9b59b6", "#e67e22"];
              return (
                <rect
                  key={i}
                  x={confettiX}
                  y={confettiY}
                  width={12}
                  height={8}
                  rx={2}
                  fill={colors[i % colors.length]}
                  transform={`rotate(${frame * (i % 4 + 1) * 3}, ${confettiX + 6}, ${confettiY + 4})`}
                  opacity={0.8}
                />
              );
            })}

            <g transform="translate(640, 260)">
              <Brain x={0} y={0} scale={1.2} bounce={Math.sin(frame * 0.4) * 8} eyeExpression="happy" />
            </g>

            {/* Bags */}
            <g transform="translate(490, 370)">
              <rect x={0} y={20} width={50} height={60} rx={4} fill="#3498db" />
              <path d="M 10 20 Q 25 0 40 20" fill="none" stroke="#2980b9" strokeWidth={3} strokeLinecap="round" />
              <text x={25} y={55} textAnchor="middle" fontSize={14} fill="white">🛍️</text>
            </g>
            <g transform="translate(740, 365)">
              <rect x={0} y={20} width={50} height={65} rx={4} fill="#e74c3c" />
              <path d="M 10 20 Q 25 0 40 20" fill="none" stroke="#c0392b" strokeWidth={3} strokeLinecap="round" />
              <text x={25} y={58} textAnchor="middle" fontSize={14} fill="white">🛍️</text>
            </g>

            <text x={640} y={530} textAnchor="middle" fontSize={56} fontWeight="bold" fill="white">
              Mission accomplie! 🎉
            </text>
            <text x={640} y={595} textAnchor="middle" fontSize={30} fill="#aed6f1">
              Cerveau rentre à la maison, heureux et bien nourri.
            </text>
          </svg>
        </AbsoluteFill>
      )}

    </AbsoluteFill>
  );
};
