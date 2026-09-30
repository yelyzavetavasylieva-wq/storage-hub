// National flags for the language switcher. The Figma file exports each flag as a
// stack of vector layers; national flags carry no bespoke artwork, so these are
// authored to the same standard designs and rendered at the same 20×15 footprint.
import React from 'react';

const box = { display: 'block', borderRadius: 2 };

function Frame({ children }) {
  return (
    <svg width="20" height="15" viewBox="0 0 20 15" style={box} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <clipPath id="fclip"><rect width="20" height="15" rx="2" /></clipPath>
      </defs>
      <g clipPath="url(#fclip)">{children}</g>
      <rect x="0.5" y="0.5" width="19" height="14" rx="1.5" fill="none" stroke="rgba(0,0,0,0.1)" />
    </svg>
  );
}

export function FlagGB() {
  return (
    <Frame>
      <rect width="20" height="15" fill="#012169" />
      <path d="M0 0L20 15M20 0L0 15" stroke="#fff" strokeWidth="3" />
      <path d="M0 0L20 15M20 0L0 15" stroke="#C8102E" strokeWidth="1.5" />
      <path d="M10 0V15M0 7.5H20" stroke="#fff" strokeWidth="5" />
      <path d="M10 0V15M0 7.5H20" stroke="#C8102E" strokeWidth="3" />
    </Frame>
  );
}

export function FlagDE() {
  return (
    <Frame>
      <rect width="20" height="5" y="0" fill="#000" />
      <rect width="20" height="5" y="5" fill="#DD0000" />
      <rect width="20" height="5" y="10" fill="#FFCE00" />
    </Frame>
  );
}

export function FlagFR() {
  return (
    <Frame>
      <rect width="6.67" height="15" x="0" fill="#0055A4" />
      <rect width="6.67" height="15" x="6.67" fill="#fff" />
      <rect width="6.67" height="15" x="13.33" fill="#EF4135" />
    </Frame>
  );
}

export function FlagPT() {
  return (
    <Frame>
      <rect width="8" height="15" x="0" fill="#046A38" />
      <rect width="12" height="15" x="8" fill="#DA291C" />
      <circle cx="8" cy="7.5" r="2.6" fill="#FFE900" stroke="#fff" strokeWidth="0.5" />
    </Frame>
  );
}

export function FlagSE() {
  return (
    <Frame>
      <rect width="20" height="15" fill="#006AA7" />
      <rect x="6" y="0" width="2.5" height="15" fill="#FECC00" />
      <rect x="0" y="6.25" width="20" height="2.5" fill="#FECC00" />
    </Frame>
  );
}

export function FlagNL() {
  return (
    <Frame>
      <rect width="20" height="5" y="0" fill="#AE1C28" />
      <rect width="20" height="5" y="5" fill="#fff" />
      <rect width="20" height="5" y="10" fill="#21468B" />
    </Frame>
  );
}

export function FlagES() {
  return (
    <Frame>
      <rect width="20" height="15" fill="#AA151B" />
      <rect width="20" height="7.5" y="3.75" fill="#F1BF00" />
    </Frame>
  );
}

export const FLAGS = {
  en: FlagGB,
  de: FlagDE,
  fr: FlagFR,
  pt: FlagPT,
  sv: FlagSE,
  nl: FlagNL,
  es: FlagES,
};
