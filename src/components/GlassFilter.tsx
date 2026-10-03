import { useEffect, useState, type RefObject } from 'react';

type Lens = { map: string; width: number; height: number };

function edgeMap(width: number, height: number, radius: number, bezel: number) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return '';
  const image = context.createImageData(width, height);
  const halfW = width / 2;
  const halfH = height / 2;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const px = x + 0.5 - halfW;
      const py = y + 0.5 - halfH;
      const qx = Math.abs(px) - (halfW - radius);
      const qy = Math.abs(py) - (halfH - radius);
      let depth: number;
      let nx = 0;
      let ny = 0;
      if (qx > 0 && qy > 0) {
        const length = Math.hypot(qx, qy);
        depth = radius - length;
        nx = (qx / length) * Math.sign(px);
        ny = (qy / length) * Math.sign(py);
      } else if (halfW - Math.abs(px) < halfH - Math.abs(py)) {
        depth = halfW - Math.abs(px);
        nx = Math.sign(px);
      } else {
        depth = halfH - Math.abs(py);
        ny = Math.sign(py);
      }
      const t = Math.min(Math.max(depth / bezel, 0), 1);
      const strength = (1 - t) ** 2;
      const i = (y * width + x) * 4;
      image.data[i] = 128 + nx * strength * 127;
      image.data[i + 1] = 128 + ny * strength * 127;
      image.data[i + 2] = 128;
      image.data[i + 3] = 255;
    }
  }
  context.putImageData(image, 0, 0);
  return canvas.toDataURL();
}

export function useLens(target: RefObject<HTMLElement | null>) {
  const [lens, setLens] = useState<Lens | null>(null);

  useEffect(() => {
    const element = target.current;
    if (!element || !document.documentElement.classList.contains('refract')) return;
    const observer = new ResizeObserver(() => {
      const width = Math.round(element.offsetWidth);
      const height = Math.round(element.offsetHeight);
      const radius = Math.min(parseFloat(getComputedStyle(element).borderTopLeftRadius), height / 2);
      setLens({ map: edgeMap(width, height, radius, 14), width, height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [target]);

  return lens;
}

export default function GlassFilter({ lens }: { lens: Lens | null }) {
  if (!lens) return null;
  return (
    <svg className="absolute h-0 w-0" aria-hidden="true" focusable="false">
      <filter id="liquid-glass" x="0" y="0" width={lens.width} height={lens.height} filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <feImage href={lens.map} x="0" y="0" width={lens.width} height={lens.height} preserveAspectRatio="none" result="map" />
        <feDisplacementMap in="SourceGraphic" in2="map" scale="-36" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  );
}
