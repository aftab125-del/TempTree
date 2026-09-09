import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "TempTree — Bespoke Instagram Story Editor by Aftab Kathat";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #120c10 0%, #1d1017 50%, #29121f 100%)",
          color: "#FAF7F2",
          fontFamily: "sans-serif",
          padding: "60px",
          position: "relative",
        }}
      >
        {/* Glowing border frame */}
        <div
          style={{
            position: "absolute",
            inset: 30,
            borderRadius: 24,
            border: "1px solid rgba(226, 180, 189, 0.25)",
            background: "radial-gradient(circle at 50% 30%, rgba(247, 214, 208, 0.08) 0%, transparent 70%)",
          }}
        />

        {/* Eyebrow Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 20px",
            borderRadius: 999,
            backgroundColor: "rgba(255, 255, 255, 0.06)",
            border: "1px solid rgba(226, 180, 189, 0.4)",
            marginBottom: 24,
          }}
        >
          <span style={{ fontSize: 16 }}>🌸</span>
          <span
            style={{
              fontSize: 14,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: "#F7D6D0",
              fontWeight: 600,
            }}
          >
            INDEPENDENT STUDIO · 桜の工房
          </span>
        </div>

        {/* Wordmark Title */}
        <div
          style={{
            fontSize: 76,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: "#FAF7F2",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          TempTree
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 28,
            color: "#E2B4BD",
            fontWeight: 300,
            marginBottom: 32,
            textAlign: "center",
            maxWidth: 800,
          }}
        >
          A bespoke story editor, made by Aftab Kathat.
        </div>

        {/* Feature Pills */}
        <div
          style={{
            display: "flex",
            gap: 16,
            marginTop: 10,
          }}
        >
          <div
            style={{
              padding: "10px 22px",
              borderRadius: 14,
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              fontSize: 15,
              color: "#FAF7F2",
            }}
          >
            🌿 100% In-Browser
          </div>
          <div
            style={{
              padding: "10px 22px",
              borderRadius: 14,
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              fontSize: 15,
              color: "#FAF7F2",
            }}
          >
            🛡️ Zero Server Uploads
          </div>
          <div
            style={{
              padding: "10px 22px",
              borderRadius: 14,
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              fontSize: 15,
              color: "#FAF7F2",
            }}
          >
            🌸 Lossless 1080×1920
          </div>
        </div>

        {/* Footer URL */}
        <div
          style={{
            position: "absolute",
            bottom: 50,
            fontSize: 14,
            letterSpacing: "0.2em",
            color: "rgba(250, 247, 242, 0.5)",
            textTransform: "uppercase",
          }}
        >
          temptree.art · Client-Side Story Atelier
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
