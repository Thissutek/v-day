"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface FloatingHeart {
  id: number;
  emoji: string;
  left: number;
  size: number;
  duration: number;
  delay: number;
}

interface FireworkRocket {
  x: number;
  y: number;
  vy: number;
  color: string;
  targetY: number;
}

interface FireworkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
  isHeart: boolean;
  alpha: number;
  life: number;
}

interface Sparkle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
}

const HEART_EMOJIS = ["💕", "💖", "💗", "💓", "❤️", "💘", "💝", "🩷", "♥️"];

const SUBHEADINGS: [number, string][] = [
  [12, "THE BUTTON HAS SPOKEN. YES. 👑✨"],
  [10, "Resistance is futile 💫"],
  [9, "JUST. SAY. YES. 🔥"],
  [7, "Just say yes already! 💕"],
  [5, "Pretty pleeeease? 🥺"],
  [3, "I'll be really sad if you say no... 😢"],
  [1, "Come on, it'll be great! 😊"],
  [0, "I promise it'll be fun! 🥰"],
];

const NO_TEXTS = [
  "No",
  "No 😅",
  "Are you sure?",
  "Really sure??",
  "Stop it! 😩",
  "Think again!",
  "Last chance!",
  "You can't 😤",
  "Nope! ...wait",
  "I give up 🏳️",
  "Fine... yes? 👀",
  "...",
  "💀",
];

const CELEBRATION_MSG_1 =
  "I knew you'd say yes, Ayano! 💕\nYou just made me the happiest person ever!";
const CELEBRATION_MSG_2 = "Happy Valentine's Day! 🥰";
const MSG_1_CHARS = Array.from(CELEBRATION_MSG_1);
const MSG_2_CHARS = Array.from(CELEBRATION_MSG_2);

function getSubheading(attempts: number): string {
  for (const [threshold, text] of SUBHEADINGS) {
    if (attempts >= threshold) return text;
  }
  return SUBHEADINGS[SUBHEADINGS.length - 1][1];
}

function getNoText(attempts: number): string {
  return NO_TEXTS[Math.min(attempts, NO_TEXTS.length - 1)];
}

export default function Home() {
  const [noAttempts, setNoAttempts] = useState(0);
  const [accepted, setAccepted] = useState(false);
  const [noButtonPos, setNoButtonPos] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [hearts, setHearts] = useState<FloatingHeart[]>([]);
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const [shaking, setShaking] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const mousePos = useRef({ x: 0, y: 0 });
  const sparkleCounter = useRef(0);
  const [typedIndex, setTypedIndex] = useState(0);
  const [typingPhase, setTypingPhase] = useState(0);

  // Track mouse position
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  // Generate floating hearts on mount
  useEffect(() => {
    const generated: FloatingHeart[] = Array.from({ length: 18 }, (_, i) => ({
      id: i,
      emoji: HEART_EMOJIS[Math.floor(Math.random() * HEART_EMOJIS.length)],
      left: Math.random() * 100,
      size: 16 + Math.random() * 24,
      duration: 8 + Math.random() * 12,
      delay: Math.random() * 10,
    }));
    setHearts(generated);
  }, []);

  // Sparkle effect around Yes button at higher attempts
  useEffect(() => {
    if (noAttempts < 4 || accepted) return;
    const interval = setInterval(() => {
      const newSparkle: Sparkle = {
        id: sparkleCounter.current++,
        x: (Math.random() - 0.5) * 120,
        y: (Math.random() - 0.5) * 80,
        size: 4 + Math.random() * 8,
        opacity: 1,
      };
      setSparkles((prev) => [...prev.slice(-12), newSparkle]);
    }, 200 - noAttempts * 10);
    return () => clearInterval(interval);
  }, [noAttempts, accepted]);

  // Clean up faded sparkles
  useEffect(() => {
    if (sparkles.length === 0) return;
    const timeout = setTimeout(() => {
      setSparkles((prev) => prev.slice(1));
    }, 800);
    return () => clearTimeout(timeout);
  }, [sparkles]);

  const dodgeNo = useCallback(() => {
    if (noAttempts >= 10) return;
    const padding = 60;
    const btnSize = 120;
    const mx = mousePos.current.x;
    const my = mousePos.current.y;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Move AWAY from cursor with some randomness
    let angle = Math.atan2(vh / 2 - my, vw / 2 - mx) + (Math.random() - 0.5) * 1.5;
    let dist = 200 + Math.random() * 250;

    let newLeft = mx + Math.cos(angle) * dist;
    let newTop = my + Math.sin(angle) * dist;

    // Clamp within viewport
    newLeft = Math.max(padding, Math.min(vw - btnSize - padding, newLeft));
    newTop = Math.max(padding, Math.min(vh - btnSize - padding, newTop));

    // If still too close to cursor, push to opposite side
    const dx = newLeft - mx;
    const dy = newTop - my;
    if (Math.sqrt(dx * dx + dy * dy) < 150) {
      newLeft = vw - mx + (Math.random() - 0.5) * 100;
      newTop = vh - my + (Math.random() - 0.5) * 100;
      newLeft = Math.max(padding, Math.min(vw - btnSize - padding, newLeft));
      newTop = Math.max(padding, Math.min(vh - btnSize - padding, newTop));
    }

    setNoButtonPos({ top: newTop, left: newLeft });
    setNoAttempts((n) => n + 1);

    // Screen shake at high attempts
    if (noAttempts >= 5) {
      setShaking(true);
      setTimeout(() => setShaking(false), 400);
    }
  }, [noAttempts]);

  // Fireworks canvas effect
  useEffect(() => {
    if (!accepted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = [
      "#ff4d6d",
      "#ff758f",
      "#c9184a",
      "#ffd700",
      "#ff85a1",
      "#ff0a54",
      "#ff477e",
      "#f72585",
      "#ff69b4",
      "#fe5196",
    ];

    const rockets: FireworkRocket[] = [];
    const particles: FireworkParticle[] = [];
    let alive = true;
    let nextLaunch = 0;

    function drawHeart(
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      size: number,
      color: string,
      rotation: number,
      alpha: number
    ) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.beginPath();
      const s = size / 2;
      ctx.moveTo(0, s * 0.4);
      ctx.bezierCurveTo(-s, -s * 0.5, -s * 2, s * 0.3, 0, s * 1.5);
      ctx.bezierCurveTo(s * 2, s * 0.3, s, -s * 0.5, 0, s * 0.4);
      ctx.fill();
      ctx.restore();
    }

    function launchFirework() {
      if (!canvas) return;
      const x = canvas.width * (0.15 + Math.random() * 0.7);
      const targetY = canvas.height * (0.15 + Math.random() * 0.35);
      const color = colors[Math.floor(Math.random() * colors.length)];
      rockets.push({
        x,
        y: canvas.height,
        vy: -8 - Math.random() * 4,
        color,
        targetY,
      });
    }

    function explode(rocket: FireworkRocket) {
      const count = 30 + Math.floor(Math.random() * 21);
      for (let i = 0; i < count; i++) {
        const angle =
          (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
        const speed = 2 + Math.random() * 4;
        particles.push({
          x: rocket.x,
          y: rocket.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color:
            Math.random() > 0.3
              ? rocket.color
              : colors[Math.floor(Math.random() * colors.length)],
          size: 3 + Math.random() * 6,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.3,
          isHeart: Math.random() > 0.4,
          alpha: 1,
          life: 1,
        });
      }
    }

    function animate(time: number) {
      if (!alive || !ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (time >= nextLaunch) {
        launchFirework();
        nextLaunch = time + 400 + Math.random() * 400;
      }

      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.y += r.vy;

        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(r.x, r.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = r.color;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(r.x, r.y + 8, 2, 0, Math.PI * 2);
        ctx.globalAlpha = 0.5;
        ctx.fill();

        if (r.y <= r.targetY) {
          explode(r);
          rockets.splice(i, 1);
        }
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.06;
        p.vx *= 0.98;
        p.vy *= 0.98;
        p.rotation += p.rotationSpeed;
        p.life -= 0.012;
        p.alpha = Math.max(0, p.life);

        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        if (p.isHeart) {
          drawHeart(ctx, p.x, p.y, p.size, p.color, p.rotation, p.alpha);
        } else {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
          ctx.restore();
        }
      }

      ctx.globalAlpha = 1;
      animFrameRef.current = requestAnimationFrame(animate);
    }

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      alive = false;
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [accepted]);

  // Typing effect for celebration message
  useEffect(() => {
    if (!accepted) return;

    if (typingPhase === 1) {
      const timeout = setTimeout(() => {
        setTypingPhase(2);
        setTypedIndex(0);
      }, 500);
      return () => clearTimeout(timeout);
    }

    if (typingPhase === 3) return;

    const msgChars = typingPhase === 0 ? MSG_1_CHARS : MSG_2_CHARS;

    if (typedIndex >= msgChars.length) {
      if (typingPhase === 0) {
        setTypingPhase(1);
      } else if (typingPhase === 2) {
        setTypingPhase(3);
      }
      return;
    }

    const timeout = setTimeout(() => {
      setTypedIndex((prev) => prev + 1);
    }, 50);

    return () => clearTimeout(timeout);
  }, [accepted, typedIndex, typingPhase]);

  // Yes button escalation
  const yesScale = 1 + noAttempts * 0.18;
  const yesPadding = 16 + noAttempts * 3;
  const yesFontSize = 18 + noAttempts * 2;
  let yesClassName = "yes-btn";
  if (noAttempts >= 10) {
    yesClassName += " yes-btn-rainbow";
  } else if (noAttempts >= 7) {
    yesClassName += " yes-btn-shimmer";
  } else if (noAttempts >= 4) {
    yesClassName += " yes-btn-pulse";
  } else if (noAttempts >= 2) {
    yesClassName += " yes-btn-glow";
  }

  // No button shrink/fade - gets more aggressive
  const noScale = Math.max(0.35, 1 - noAttempts * 0.07);
  const noOpacity = Math.max(0.25, 1 - noAttempts * 0.08);
  const noFontSize = Math.max(10, 18 - noAttempts * 0.8);

  // Yes button text escalation
  const getYesText = () => {
    if (noAttempts >= 10) return "YES!!! 💖🔥💖";
    if (noAttempts >= 7) return "YES!! 💖✨";
    if (noAttempts >= 4) return "YES! 💖";
    return "Yes! 💖";
  };

  return (
    <div
      className={shaking ? "screen-shake" : ""}
      style={{ minHeight: "100vh", position: "relative" }}
    >
      {/* Floating hearts background */}
      {hearts.map((h) => (
        <span
          key={h.id}
          className="floating-heart"
          style={{
            left: `${h.left}%`,
            fontSize: `${h.size}px`,
            animationDuration: `${h.duration}s`,
            animationDelay: `${h.delay}s`,
          }}
        >
          {h.emoji}
        </span>
      ))}

      {!accepted ? (
        /* Question Card */
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            padding: "20px",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div
            className={noAttempts >= 8 ? "card-glow" : ""}
            style={{
              background: "rgba(255, 255, 255, 0.85)",
              backdropFilter: "blur(10px)",
              borderRadius: "24px",
              padding: "48px 40px",
              maxWidth: "480px",
              width: "100%",
              textAlign: "center",
              boxShadow: "0 8px 32px rgba(201, 24, 74, 0.15)",
              transition: "box-shadow 0.3s",
            }}
          >
            <div
              style={{ fontSize: "64px", marginBottom: "16px" }}
              className={noAttempts >= 6 ? "heart-bounce" : ""}
            >
              💝
            </div>
            <h1
              style={{
                fontSize: "28px",
                fontWeight: 800,
                color: "#c9184a",
                marginBottom: "12px",
                lineHeight: 1.3,
              }}
            >
              Ayano, will you be my Valentine?
            </h1>
            <p
              className={noAttempts >= 9 ? "text-shimmer" : ""}
              style={{
                fontSize: "18px",
                color: noAttempts >= 9 ? "transparent" : "#a4133c",
                marginBottom: "36px",
                minHeight: "28px",
                fontWeight: noAttempts >= 7 ? 700 : 400,
                transition: "font-weight 0.3s",
              }}
            >
              {getSubheading(noAttempts)}
            </p>

            <div
              style={{
                display: "flex",
                gap: "16px",
                justifyContent: "center",
                alignItems: "center",
                flexWrap: "wrap",
                position: "relative",
              }}
            >
              {/* Yes Button with sparkle wrapper */}
              <div style={{ position: "relative", display: "inline-block" }}>
                {/* Sparkles */}
                {sparkles.map((s) => (
                  <span
                    key={s.id}
                    className="sparkle"
                    style={{
                      position: "absolute",
                      left: `calc(50% + ${s.x}px)`,
                      top: `calc(50% + ${s.y}px)`,
                      fontSize: `${s.size}px`,
                      pointerEvents: "none",
                    }}
                  >
                    ✨
                  </span>
                ))}

                <button
                  className={yesClassName}
                  onClick={() => setAccepted(true)}
                  style={{
                    padding: `${yesPadding}px ${yesPadding * 2}px`,
                    fontSize: `${yesFontSize}px`,
                    transform: `scale(${yesScale})`,
                  }}
                >
                  {getYesText()}
                </button>
              </div>

              {/* No Button (in flow) */}
              {!noButtonPos && (
                <button
                  className="no-btn"
                  onMouseEnter={dodgeNo}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    dodgeNo();
                  }}
                >
                  No
                </button>
              )}
            </div>
          </div>

          {/* No Button (fixed, after first dodge) */}
          {noButtonPos && (
            <button
              className={`no-btn${noAttempts >= 10 ? " no-btn-surrender" : noAttempts >= 8 ? " no-btn-glitch" : ""}`}
              onMouseEnter={noAttempts >= 10 ? undefined : dodgeNo}
              onClick={noAttempts >= 10 ? () => setAccepted(true) : undefined}
              onTouchStart={
                noAttempts >= 10
                  ? () => setAccepted(true)
                  : (e) => {
                      e.preventDefault();
                      dodgeNo();
                    }
              }
              style={{
                position: "fixed",
                top: `${noButtonPos.top}px`,
                left: `${noButtonPos.left}px`,
                transform:
                  noAttempts >= 10 ? "scale(1)" : `scale(${noScale})`,
                opacity: noAttempts >= 10 ? 1 : noOpacity,
                fontSize:
                  noAttempts >= 10 ? "18px" : `${noFontSize}px`,
                transition:
                  noAttempts >= 10
                    ? "all 0.5s ease"
                    : "top 0s, left 0s, transform 0.3s, opacity 0.3s, font-size 0.3s",
                zIndex: 10,
              }}
            >
              {noAttempts >= 10 ? "Fine... Yes! 💖" : getNoText(noAttempts)}
            </button>
          )}
        </div>
      ) : (
        /* Celebration Screen */
        <>
          <canvas
            ref={canvasRef}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
              zIndex: 100,
            }}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "100vh",
              padding: "20px",
              position: "relative",
              zIndex: 10,
              animation: "bounceIn 0.8s ease-out",
            }}
          >
            <h1
              className="celebration-title"
              style={{
                fontSize: "52px",
                fontWeight: 800,
                marginBottom: "24px",
              }}
            >
              Yay!! 🎉
            </h1>
            <div
              className="celebration-card"
              style={{
                background: "rgba(255, 255, 255, 0.9)",
                backdropFilter: "blur(10px)",
                borderRadius: "24px",
                padding: "40px",
                maxWidth: "440px",
                width: "100%",
                textAlign: "center",
                boxShadow:
                  "0 8px 32px rgba(201, 24, 74, 0.2), 0 0 60px rgba(255, 77, 109, 0.15)",
              }}
            >
              <img
                src="/she-said-yes.png"
                alt="She said yes!"
                style={{
                  width: "100%",
                  maxWidth: "360px",
                  borderRadius: "16px",
                  marginBottom: "24px",
                  boxShadow: "0 4px 20px rgba(201, 24, 74, 0.2)",
                  animation: "bounceIn 0.8s ease-out",
                }}
              />
              <p
                style={{
                  fontSize: "22px",
                  color: "#a4133c",
                  lineHeight: 1.7,
                  marginBottom: "24px",
                  minHeight: "3.4em",
                }}
              >
                {(() => {
                  const text =
                    typingPhase === 0
                      ? MSG_1_CHARS.slice(0, typedIndex).join("")
                      : CELEBRATION_MSG_1;
                  const lines = text.split("\n");
                  return lines.map((line, i) => (
                    <span key={i}>
                      {i > 0 && <br />}
                      {line}
                    </span>
                  ));
                })()}
                {typingPhase < 1 && typedIndex < MSG_1_CHARS.length && (
                  <span className="typing-cursor">|</span>
                )}
              </p>
              <p
                style={{
                  fontSize: "18px",
                  color: "#c9184a",
                  fontWeight: 600,
                  minHeight: "1.5em",
                }}
              >
                {typingPhase >= 2 && (
                  <>
                    {typingPhase === 2
                      ? MSG_2_CHARS.slice(0, typedIndex).join("")
                      : CELEBRATION_MSG_2}
                    {typingPhase === 2 && typedIndex < MSG_2_CHARS.length && (
                      <span className="typing-cursor">|</span>
                    )}
                  </>
                )}
              </p>
              <div
                style={{
                  marginTop: "24px",
                  fontSize: "40px",
                  animation: "heartBeat 1.2s ease-in-out infinite",
                }}
              >
                ❤️‍🔥
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
