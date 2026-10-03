const lensMap = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100" viewBox="0 0 200 100">
    <defs>
      <linearGradient id="x" x1="0" x2="1"><stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#f00"/></linearGradient>
      <linearGradient id="y" y1="0" y2="1"><stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#0f0"/></linearGradient>
      <filter id="b"><feGaussianBlur stdDeviation="9"/></filter>
    </defs>
    <rect width="200" height="100" fill="url(#x)"/>
    <rect width="200" height="100" fill="url(#y)" style="mix-blend-mode:screen"/>
    <rect x="18" y="16" width="164" height="68" rx="26" fill="#808000" filter="url(#b)"/>
  </svg>`,
)}`;

export default function GlassFilter() {
  return (
    <svg className="absolute h-0 w-0" aria-hidden="true" focusable="false">
      <filter id="liquid-glass" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
        <feImage href={lensMap} x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="map" />
        <feDisplacementMap in="SourceGraphic" in2="map" scale="-28" xChannelSelector="R" yChannelSelector="G" result="bent" />
        <feGaussianBlur in="bent" stdDeviation="0.6" />
      </filter>
    </svg>
  );
}
