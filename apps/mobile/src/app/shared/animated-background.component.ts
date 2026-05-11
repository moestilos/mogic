import { Component, inject } from '@angular/core';
import { ThemeStore } from '../core/stores/theme.store';

/**
 * Renders a theme-aware animated background. Sits at z-index 0 so all content above (z-10+) reads it.
 * Pure CSS — no canvas, no perf hit on mobile.
 */
@Component({
  selector: 'app-animated-background',
  standalone: true,
  template: `
    <div class="anim-bg" [attr.data-active]="theme.current()">
      <!-- Chrome: holofoil shimmer waves -->
      @if (theme.current() === 'chrome') {
        <div class="bg-chrome-wave"></div>
        <div class="bg-chrome-wave bg-chrome-wave-2"></div>
        <div class="bg-grain"></div>
      }
      <!-- Editorial: hairline grid drifting -->
      @if (theme.current() === 'editorial') {
        <div class="bg-editorial-grid"></div>
      }
      <!-- Vapor: constellation field (drifting stars + connecting lines) -->
      @if (theme.current() === 'vapor') {
        <div class="bg-vapor-blob bg-vapor-blob-1"></div>
        <div class="bg-vapor-blob bg-vapor-blob-2"></div>
        <svg class="bg-vapor-constellation" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice">
          <defs>
            <radialGradient id="vstar" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#fff" stop-opacity="0.95"/>
              <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
            </radialGradient>
          </defs>
          <g class="vapor-lines" stroke="rgba(220,210,240,0.18)" stroke-width="0.5" fill="none">
            <line x1="120" y1="180" x2="280" y2="240"></line>
            <line x1="280" y1="240" x2="420" y2="160"></line>
            <line x1="420" y1="160" x2="580" y2="280"></line>
            <line x1="580" y1="280" x2="740" y2="220"></line>
            <line x1="740" y1="220" x2="860" y2="380"></line>
            <line x1="120" y1="640" x2="240" y2="720"></line>
            <line x1="240" y1="720" x2="400" y2="680"></line>
            <line x1="400" y1="680" x2="540" y2="780"></line>
            <line x1="540" y1="780" x2="700" y2="700"></line>
            <line x1="700" y1="700" x2="860" y2="820"></line>
            <line x1="320" y1="420" x2="500" y2="500"></line>
            <line x1="500" y1="500" x2="660" y2="440"></line>
            <line x1="280" y1="240" x2="320" y2="420"></line>
            <line x1="580" y1="280" x2="500" y2="500"></line>
            <line x1="660" y1="440" x2="740" y2="220"></line>
            <line x1="400" y1="680" x2="500" y2="500"></line>
            <line x1="540" y1="780" x2="660" y2="440"></line>
          </g>
          <g class="vapor-stars">
            <circle cx="120" cy="180" r="2.5" fill="url(#vstar)"><animate attributeName="opacity" values="0.4;1;0.4" dur="3.2s" repeatCount="indefinite"/></circle>
            <circle cx="280" cy="240" r="3" fill="url(#vstar)"><animate attributeName="opacity" values="0.5;1;0.5" dur="4.1s" repeatCount="indefinite"/></circle>
            <circle cx="420" cy="160" r="2" fill="url(#vstar)"><animate attributeName="opacity" values="0.3;0.9;0.3" dur="3.6s" repeatCount="indefinite"/></circle>
            <circle cx="580" cy="280" r="3.5" fill="url(#vstar)"><animate attributeName="opacity" values="0.6;1;0.6" dur="2.8s" repeatCount="indefinite"/></circle>
            <circle cx="740" cy="220" r="2.2" fill="url(#vstar)"><animate attributeName="opacity" values="0.4;0.9;0.4" dur="3.8s" repeatCount="indefinite"/></circle>
            <circle cx="860" cy="380" r="2.8" fill="url(#vstar)"><animate attributeName="opacity" values="0.5;1;0.5" dur="4.4s" repeatCount="indefinite"/></circle>
            <circle cx="120" cy="640" r="2.4" fill="url(#vstar)"><animate attributeName="opacity" values="0.3;0.85;0.3" dur="3.4s" repeatCount="indefinite"/></circle>
            <circle cx="240" cy="720" r="3.2" fill="url(#vstar)"><animate attributeName="opacity" values="0.55;1;0.55" dur="2.6s" repeatCount="indefinite"/></circle>
            <circle cx="400" cy="680" r="2" fill="url(#vstar)"><animate attributeName="opacity" values="0.4;0.95;0.4" dur="3.9s" repeatCount="indefinite"/></circle>
            <circle cx="540" cy="780" r="3" fill="url(#vstar)"><animate attributeName="opacity" values="0.5;1;0.5" dur="3.1s" repeatCount="indefinite"/></circle>
            <circle cx="700" cy="700" r="2.6" fill="url(#vstar)"><animate attributeName="opacity" values="0.4;0.9;0.4" dur="4.2s" repeatCount="indefinite"/></circle>
            <circle cx="860" cy="820" r="2.3" fill="url(#vstar)"><animate attributeName="opacity" values="0.35;0.85;0.35" dur="3.5s" repeatCount="indefinite"/></circle>
            <circle cx="320" cy="420" r="2.8" fill="url(#vstar)"><animate attributeName="opacity" values="0.45;1;0.45" dur="3.7s" repeatCount="indefinite"/></circle>
            <circle cx="500" cy="500" r="4" fill="url(#vstar)"><animate attributeName="opacity" values="0.6;1;0.6" dur="2.4s" repeatCount="indefinite"/></circle>
            <circle cx="660" cy="440" r="2.2" fill="url(#vstar)"><animate attributeName="opacity" values="0.4;0.9;0.4" dur="3.3s" repeatCount="indefinite"/></circle>
            <circle cx="80" cy="380" r="1.5" fill="url(#vstar)"><animate attributeName="opacity" values="0.2;0.7;0.2" dur="4.6s" repeatCount="indefinite"/></circle>
            <circle cx="200" cy="100" r="1.8" fill="url(#vstar)"><animate attributeName="opacity" values="0.3;0.8;0.3" dur="3.9s" repeatCount="indefinite"/></circle>
            <circle cx="380" cy="540" r="1.6" fill="url(#vstar)"><animate attributeName="opacity" values="0.25;0.75;0.25" dur="4.1s" repeatCount="indefinite"/></circle>
            <circle cx="640" cy="120" r="1.7" fill="url(#vstar)"><animate attributeName="opacity" values="0.3;0.8;0.3" dur="3.5s" repeatCount="indefinite"/></circle>
            <circle cx="800" cy="540" r="1.9" fill="url(#vstar)"><animate attributeName="opacity" values="0.35;0.85;0.35" dur="3.7s" repeatCount="indefinite"/></circle>
            <circle cx="940" cy="640" r="1.5" fill="url(#vstar)"><animate attributeName="opacity" values="0.25;0.7;0.25" dur="4.3s" repeatCount="indefinite"/></circle>
            <circle cx="60" cy="860" r="1.8" fill="url(#vstar)"><animate attributeName="opacity" values="0.3;0.8;0.3" dur="3.8s" repeatCount="indefinite"/></circle>
            <circle cx="460" cy="900" r="1.6" fill="url(#vstar)"><animate attributeName="opacity" values="0.25;0.75;0.25" dur="4.5s" repeatCount="indefinite"/></circle>
            <circle cx="900" cy="80" r="1.7" fill="url(#vstar)"><animate attributeName="opacity" values="0.3;0.8;0.3" dur="3.6s" repeatCount="indefinite"/></circle>
          </g>
        </svg>
      }
      <!-- Brutal: visible 16px grid + scanline -->
      @if (theme.current() === 'brutal') {
        <div class="bg-brutal-grid"></div>
        <div class="bg-brutal-scanline"></div>
      }
      <!-- Sigil: gold particles drifting up -->
      @if (theme.current() === 'sigil') {
        <div class="bg-sigil-grain"></div>
        <div class="bg-sigil-particle" style="--p-x: 12%; --p-d: 22s; --p-delay: 0s;"></div>
        <div class="bg-sigil-particle" style="--p-x: 28%; --p-d: 28s; --p-delay: 4s;"></div>
        <div class="bg-sigil-particle" style="--p-x: 47%; --p-d: 18s; --p-delay: 2s;"></div>
        <div class="bg-sigil-particle" style="--p-x: 63%; --p-d: 30s; --p-delay: 7s;"></div>
        <div class="bg-sigil-particle" style="--p-x: 81%; --p-d: 24s; --p-delay: 1s;"></div>
        <div class="bg-sigil-particle" style="--p-x: 92%; --p-d: 26s; --p-delay: 9s;"></div>
      }
      <!-- Stark: animated hexagon grid -->
      @if (theme.current() === 'stark') {
        <div class="bg-stark-hex"></div>
        <div class="bg-stark-hex bg-stark-hex-2"></div>
      }
      <!-- Cards: velvet table — soft candle spotlight + heavy grain -->
      @if (theme.current() === 'cards') {
        <div class="bg-cards-vignette"></div>
        <div class="bg-cards-grain"></div>
        <div class="bg-cards-candle"></div>
      }
    </div>
  `,
  styles: [`
    :host {
      position: absolute;
      inset: 0;
      z-index: 0;
      overflow: hidden;
      pointer-events: none;
    }
    .anim-bg {
      position: absolute;
      inset: 0;
      overflow: hidden;
    }

    /* ── CHROME — iridescent shimmer ── */
    .bg-chrome-wave {
      position: absolute;
      inset: -20%;
      background: radial-gradient(60% 50% at 30% 20%, rgba(179, 157, 255, 0.06), transparent 60%),
                  radial-gradient(40% 40% at 80% 80%, rgba(157, 210, 255, 0.05), transparent 60%);
      animation: chromeDrift 30s ease-in-out infinite alternate;
    }
    .bg-chrome-wave-2 {
      background: radial-gradient(50% 40% at 70% 30%, rgba(255, 158, 208, 0.05), transparent 60%),
                  radial-gradient(50% 50% at 20% 70%, rgba(157, 255, 179, 0.04), transparent 60%);
      animation: chromeDrift 38s ease-in-out infinite alternate-reverse;
    }
    @keyframes chromeDrift {
      0%   { transform: translate(0, 0); }
      100% { transform: translate(8%, -6%); }
    }

    /* ── EDITORIAL — hairline grid drifting ── */
    .bg-editorial-grid {
      position: absolute;
      inset: -10%;
      background-image:
        linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
      background-size: 64px 64px;
      animation: editorialDrift 60s linear infinite;
    }
    @keyframes editorialDrift {
      0%   { background-position: 0 0, 0 0; }
      100% { background-position: 64px 64px, 64px 64px; }
    }

    /* ── VAPOR — constellation field with soft nebula glow ── */
    .bg-vapor-blob {
      position: absolute;
      width: 70vmax;
      height: 70vmax;
      border-radius: 50%;
      filter: blur(100px);
      opacity: 0.4;
      mix-blend-mode: screen;
    }
    .bg-vapor-blob-1 {
      background: rgba(180, 140, 220, 0.4);
      top: -25%; left: -25%;
      animation: vaporFloat1 34s ease-in-out infinite alternate;
    }
    .bg-vapor-blob-2 {
      background: rgba(120, 180, 230, 0.35);
      bottom: -30%; right: -25%;
      animation: vaporFloat2 40s ease-in-out infinite alternate;
    }
    @keyframes vaporFloat1 { 0% { transform: translate(0,0); } 100% { transform: translate(18vw, 12vh); } }
    @keyframes vaporFloat2 { 0% { transform: translate(0,0); } 100% { transform: translate(-14vw, -10vh); } }
    .bg-vapor-constellation {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      animation: vaporConstellationDrift 80s ease-in-out infinite alternate;
    }
    .bg-vapor-constellation .vapor-lines {
      animation: vaporLineFade 8s ease-in-out infinite;
    }
    @keyframes vaporConstellationDrift {
      0%   { transform: translate(0, 0) scale(1); }
      100% { transform: translate(-2%, 1%) scale(1.03); }
    }
    @keyframes vaporLineFade {
      0%, 100% { opacity: 0.6; }
      50%      { opacity: 1; }
    }

    /* ── STARK — hexagon grid drifting ── */
    .bg-stark-hex {
      position: absolute;
      inset: -30%;
      background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 56 64'><polygon points='28,1 55,17 55,47 28,63 1,47 1,17' fill='none' stroke='rgba(20,20,14,0.07)' stroke-width='1'/></svg>");
      background-size: 56px 64px;
      background-position: 0 0;
      animation: starkHexDrift 60s linear infinite;
    }
    .bg-stark-hex-2 {
      inset: -30%;
      background-size: 84px 96px;
      opacity: 0.5;
      animation: starkHexDrift2 90s linear infinite reverse;
    }
    @keyframes starkHexDrift {
      0%   { background-position: 0 0; }
      100% { background-position: 56px 64px; }
    }
    @keyframes starkHexDrift2 {
      0%   { background-position: 0 0; }
      100% { background-position: -84px 96px; }
    }

    /* ── CARDS — velvet table + candle + grain ── */
    .bg-cards-vignette {
      position: absolute; inset: 0;
      background: radial-gradient(80% 60% at 50% 40%, transparent 50%, rgba(0,0,0,0.55) 100%);
    }
    .bg-cards-grain {
      position: absolute; inset: 0;
      background-image: url("data:image/svg+xml;utf8,<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.6 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
      opacity: 0.06;
      mix-blend-mode: overlay;
    }
    .bg-cards-candle {
      position: absolute;
      top: 0; left: 50%;
      transform: translateX(-50%);
      width: 80vmax; height: 80vmax;
      background: radial-gradient(50% 50% at 50% 0%, rgba(201, 162, 86, 0.18), rgba(255, 158, 70, 0.06) 40%, transparent 70%);
      pointer-events: none;
      animation: cardsCandleFlicker 6s ease-in-out infinite;
    }
    @keyframes cardsCandleFlicker {
      0%, 100% { opacity: 0.7; transform: translateX(-50%) scale(1); }
      50%      { opacity: 1;   transform: translateX(-50%) scale(1.05); }
    }

    /* ── BRUTAL — visible 16px grid + scanline ── */
    .bg-brutal-grid {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
      background-size: 16px 16px;
    }
    .bg-brutal-scanline {
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 1px;
      background: rgba(255,255,255,0.18);
      box-shadow: 0 0 6px rgba(255,255,255,0.4);
      animation: brutalScan 7s linear infinite;
    }
    @keyframes brutalScan {
      0%   { transform: translateY(0); }
      100% { transform: translateY(100vh); }
    }

    /* ── SIGIL — gold particles + parchment grain ── */
    .bg-sigil-grain {
      position: absolute;
      inset: 0;
      background-image: url("data:image/svg+xml;utf8,<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.79  0 0 0 0 0.64  0 0 0 0 0.34  0 0 0 0.06 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
      opacity: 0.6;
    }
    .bg-sigil-particle {
      position: absolute;
      bottom: -10px;
      left: var(--p-x);
      width: 2px;
      height: 2px;
      border-radius: 99px;
      background: #F2D58A;
      box-shadow: 0 0 6px rgba(242, 213, 138, 0.8);
      animation: sigilRise var(--p-d) linear infinite;
      animation-delay: var(--p-delay);
      opacity: 0;
    }
    @keyframes sigilRise {
      0%   { transform: translateY(0); opacity: 0; }
      10%  { opacity: 0.9; }
      90%  { opacity: 0.5; }
      100% { transform: translateY(-110vh); opacity: 0; }
    }

    /* ── Shared grain ── */
    .bg-grain {
      position: absolute;
      inset: 0;
      pointer-events: none;
      background-image: url("data:image/svg+xml;utf8,<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.5 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
      opacity: 0.04;
      mix-blend-mode: overlay;
    }
  `],
})
export class AnimatedBackgroundComponent {
  readonly theme = inject(ThemeStore);
}
