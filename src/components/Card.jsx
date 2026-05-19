import React from "react";

export default function Card({ title, eyebrow, children, className = "" }) {
  return (
    <div className={`card ${className}`}>
      {eyebrow && (
        <h6 style={{ marginBottom: "0.5rem", marginTop: 0, color: "var(--accent-blue)" }}>
          {eyebrow}
        </h6>
      )}
      <h3 style={{ marginTop: 0, marginBottom: "1.5rem", fontSize: "18px", fontWeight: 600, color: "var(--text-primary)" }}>
        {title}
      </h3>
      <div>{children}</div>
    </div>
  );
}
