/* Tekenen van figuren (SVG) — gedeeld door figuurreeksen en abstract redeneren */
(function (G) {
  'use strict';
  const MT = G.MT;
  let uid = 0;

  const SHAPES = ['circle', 'square', 'triangle', 'diamond', 'pentagon', 'hexagon'];
  const SHAPE_NL = { circle: 'cirkel', square: 'vierkant', triangle: 'driehoek', diamond: 'ruit', pentagon: 'vijfhoek', hexagon: 'zeshoek' };
  const CORNERS = { circle: 0, square: 4, triangle: 3, diamond: 4, pentagon: 5, hexagon: 6 };
  const FILL_NL = { empty: 'leeg', full: 'gevuld', half: 'half gevuld' };
  const DIR_NL = { 0: 'omhoog', 45: 'rechtsboven', 90: 'rechts', 135: 'rechtsonder', 180: 'omlaag', 225: 'linksonder', 270: 'links', 315: 'linksboven' };
  const norm = (a) => ((a % 360) + 360) % 360;

  function poly(n, cx, cy, r, rot = -90) {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = ((rot + (360 / n) * i) * Math.PI) / 180;
      pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
    }
    return pts.join(' ');
  }
  function shapeEl(shape, attrs) {
    switch (shape) {
      case 'circle': return { el: `<circle cx="35" cy="30" r="21" ${attrs}/>`, cy: 30 };
      case 'square': return { el: `<rect x="15" y="10" width="40" height="40" ${attrs}/>`, cy: 30 };
      case 'triangle': return { el: `<polygon points="35,5 60,50 10,50" ${attrs}/>`, cy: 35 };
      case 'diamond': return { el: `<polygon points="35,5 60,30 35,55 10,30" ${attrs}/>`, cy: 30 };
      case 'pentagon': return { el: `<polygon points="${poly(5, 35, 31, 23)}" ${attrs}/>`, cy: 32 };
      case 'hexagon': return { el: `<polygon points="${poly(6, 35, 30, 23, 0)}" ${attrs}/>`, cy: 30 };
    }
  }

  /** f = {shape, fill, rot, dots} */
  function draw(f) {
    const id = 'c' + ++uid;
    const base = shapeEl(f.shape, '');
    const cy = base.cy;
    let s = '';
    if (f.fill === 'half') {
      s += `<clipPath id="${id}"><rect x="0" y="0" width="35" height="70"/></clipPath>`;
      s += shapeEl(f.shape, 'class="f-ink" clip-path="url(#' + id + ')"').el;
    }
    s += shapeEl(f.shape, `class="s-ink ${f.fill === 'full' ? 'f-ink' : 'f-none'}" stroke-width="2.4" stroke-linejoin="round"`).el;
    const a = `<g transform="rotate(${f.rot} 35 ${cy})"><line x1="35" y1="${cy + 10}" x2="35" y2="${cy - 5}" stroke-width="3.2" stroke-linecap="round"/><polygon points="35,${cy - 13} 29,${cy - 3} 41,${cy - 3}" stroke-width="0"/></g>`;
    if (f.fill === 'full') s += `<g class="s-bg f-bg">${a}</g>`;
    else if (f.fill === 'half') s += `<g class="s-bg f-bg" style="stroke-width:6">${a.replace(/stroke-width="[\d.]+"/g, '')}</g><g class="s-ink f-ink">${a}</g>`;
    else s += `<g class="s-ink f-ink">${a}</g>`;
    const n = f.dots || 0;
    for (let i = 0; i < n; i++) s += `<circle cx="${35 - (n - 1) * 4 + i * 8}" cy="64" r="2.8" class="f-ink"/>`;
    return `<svg viewBox="0 0 70 70" aria-hidden="true">${s}</svg>`;
  }

  /** Raster: n = 3 of 4; markers = [{pos, m:1|2}] ; pos = index in n×n */
  function drawGrid(n, markers) {
    const cell = n === 3 ? 19 : 14.5, gap = 2, tot = n * cell + (n - 1) * gap, off = (70 - tot) / 2;
    let s = '';
    for (let i = 0; i < n * n; i++) {
      const x = off + (i % n) * (cell + gap), y = off + Math.floor(i / n) * (cell + gap);
      const m = markers.find((k) => k.pos === i);
      s += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${cell}" height="${cell}" rx="2" class="${m && m.m === 1 ? 'f-acc' : 'f-bg'} s-ink" stroke-width="1.2"/>`;
      if (m && m.m === 2) s += `<circle cx="${(x + cell / 2).toFixed(1)}" cy="${(y + cell / 2).toFixed(1)}" r="${(cell * 0.3).toFixed(1)}" class="f-ink"/>`;
    }
    return `<svg viewBox="0 0 70 70" aria-hidden="true">${s}</svg>`;
  }
  const perimeter = (n) => {
    const p = [];
    for (let c = 0; c < n; c++) p.push(c);
    for (let r = 1; r < n; r++) p.push(r * n + n - 1);
    for (let c = n - 2; c >= 0; c--) p.push((n - 1) * n + c);
    for (let r = n - 2; r >= 1; r--) p.push(r * n);
    return p;
  };

  const key = (f) => `${f.shape}|${f.fill}|${norm(f.rot)}|${f.dots}`;
  const describe = (f) => `${SHAPE_NL[f.shape]}, ${FILL_NL[f.fill]}, pijl ${DIR_NL[norm(f.rot)]}, ${f.dots} ${f.dots === 1 ? 'stip' : 'stippen'}`;

  MT.fig = { draw, drawGrid, perimeter, key, describe, norm, SHAPES, SHAPE_NL, CORNERS, FILL_NL, DIR_NL };
})(typeof window !== 'undefined' ? window : globalThis);
