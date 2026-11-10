import "./Crosshair.css";
import type { ShooterSettings } from "./types";

type CrosshairProps = {
  settings: ShooterSettings;
  recoil: boolean;
  hitMarker: boolean;
};

export default function Crosshair({ settings, recoil, hitMarker }: CrosshairProps) {
  const { crosshairStyle, crosshairColor } = settings;

  return (
    <div className={`hud-crosshair-container ${recoil ? "is-recoiling" : ""}`} aria-hidden="true">
      {/* Hit marker flash */}
      {hitMarker && (
        <div className="hit-marker" style={{ borderColor: crosshairColor }}>
          <span className="hit-line diag-1" />
          <span className="hit-line diag-2" />
        </div>
      )}

      {/* Crosshair body */}
      <div className={`crosshair-body style-${crosshairStyle}`} style={{ color: crosshairColor }}>
        {crosshairStyle === "cross" && (
          <>
            <span className="ch-line ch-top" style={{ backgroundColor: crosshairColor }} />
            <span className="ch-line ch-bottom" style={{ backgroundColor: crosshairColor }} />
            <span className="ch-line ch-left" style={{ backgroundColor: crosshairColor }} />
            <span className="ch-line ch-right" style={{ backgroundColor: crosshairColor }} />
            <span className="ch-dot" style={{ backgroundColor: crosshairColor }} />
          </>
        )}

        {crosshairStyle === "dot" && (
          <span className="ch-single-dot" style={{ backgroundColor: crosshairColor, boxShadow: `0 0 8px ${crosshairColor}` }} />
        )}

        {crosshairStyle === "circle" && (
          <>
            <div className="ch-ring" style={{ borderColor: crosshairColor }} />
            <span className="ch-dot" style={{ backgroundColor: crosshairColor }} />
          </>
        )}
      </div>
    </div>
  );
}
