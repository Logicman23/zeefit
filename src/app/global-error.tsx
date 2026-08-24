"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1.5rem",
          background: "#fff",
          color: "#0b1418",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <h1 style={{ fontSize: "2rem", fontWeight: 600, letterSpacing: "-0.03em", margin: 0 }}>
          Something went wrong
        </h1>
        <p style={{ color: "#6b7f88", fontSize: "0.9375rem", margin: 0 }}>
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={() => reset()}
          style={{
            border: "none",
            background: "#0d5f63",
            color: "#fff",
            padding: "1rem 2.25rem",
            fontSize: "0.6875rem",
            fontWeight: 600,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
