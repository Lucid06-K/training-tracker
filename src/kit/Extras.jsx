import { useEffect, useState, useRef } from 'react';
import { Icons } from './Icons.jsx';

export function useCountUp(target, dur = 900) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf, start;
    const from = 0;
    const step = (t) => {
      if (!start) start = t;
      const p = Math.min(1, (t - start) / dur);
      setV(Math.round(from + (target - from) * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, dur]);
  return v;
}

export function PRToast({ exercise, weight, reps, prevWeight = 0, onDone }) {
  useEffect(() => {
    const t = setTimeout(() => onDone && onDone(), 3800);
    return () => clearTimeout(t);
  }, [onDone]);
  if (!exercise || weight == null || reps == null) return null;
  const gain = Math.max(0, weight - prevWeight);
  const isFirstPR = prevWeight === 0;
  return (
    <div className="tt-pr-toast" role="status" aria-live="polite">
      <div className="tt-pr-ico">{Icons.trophy}</div>
      <div className="pr-ribbon">New Personal Record</div>
      <div className="pr-title">{exercise}</div>
      {isFirstPR
        ? <div className="pr-meta">First recorded set</div>
        : <div className="pr-meta">Previous best · <b className="num">{prevWeight}kg × {reps}</b></div>}
      <div className="pr-stats">
        <div className="pr-stat"><b className="num">{weight}kg</b><span>Weight</span></div>
        <div className="pr-stat"><b className="num">{reps}</b><span>Reps</span></div>
        <div className="pr-stat"><b className="num">+{gain.toFixed(1)}kg</b><span>Gain</span></div>
      </div>
    </div>
  );
}

export function Confetti({ count = 48 }) {
  const reduced = typeof window !== 'undefined'
    && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return null;
  const colors = ['#b26a45', '#6d8a4c', '#c9993a', '#4c7086', '#c97c66', '#cd9657', '#d6a582'];
  const pieces = Array.from({ length: count }).map((_, i) => {
    const left = Math.random() * 100;
    const delay = Math.random() * 400;
    const dur = 1800 + Math.random() * 1600;
    const bg = colors[i % colors.length];
    const w = 6 + Math.random() * 8;
    const h = 10 + Math.random() * 8;
    const rot = Math.random() * 360;
    return (
      <span
        key={i}
        className="tt-confetti"
        style={{
          left: `${left}%`,
          background: bg,
          width: w,
          height: h,
          transform: `rotate(${rot}deg)`,
          animationDuration: `${dur}ms`,
          animationDelay: `${delay}ms`,
          borderRadius: Math.random() > 0.5 ? '2px' : '50%'
        }}
      />
    );
  });
  return <div className="tt-confetti-layer" aria-hidden="true">{pieces}</div>;
}

export function ProgressRing({ value = 0, size = 140, stroke = 12, color = 'var(--accent)', label, unit }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value));
  return (
    <div className="tt-ring-wrap">
      <div className="tt-ring" style={{ width: size, height: size }}>
        <svg width={size} height={size}>
          <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--border)" strokeWidth={stroke} fill="none" />
          <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none"
            strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
            style={{ transition: 'stroke-dashoffset 900ms cubic-bezier(.22,1,.36,1)' }} />
        </svg>
        <div className="tt-ring-v">
          <div className="tt-ring-num">{label}</div>
          {unit && <div className="tt-ring-lbl">{unit}</div>}
        </div>
      </div>
    </div>
  );
}

export function Toast({ children, onDone, dur = 2400 }) {
  useEffect(() => {
    const t = setTimeout(() => onDone && onDone(), dur);
    return () => clearTimeout(t);
  }, [onDone, dur]);
  return (
    <div className="tt-pr-toast" style={{ background: 'var(--glass-tint)', borderColor: 'var(--border-2)' }}>
      <div style={{ color: 'var(--fg-1)', fontWeight: 600, fontSize: 14 }}>{children}</div>
    </div>
  );
}

export function useLocalToggle(defaultVal = false) {
  const [v, setV] = useState(defaultVal);
  const toggle = () => setV((p) => !p);
  return [v, toggle, setV];
}

export function useOnClickOutside(ref, handler) {
  const cb = useRef(handler);
  useEffect(() => { cb.current = handler; }, [handler]);
  useEffect(() => {
    const onClick = (e) => {
      if (!ref.current || ref.current.contains(e.target)) return;
      cb.current && cb.current(e);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('touchstart', onClick, { passive: true });
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('touchstart', onClick, { passive: true });
    };
  }, [ref]);
}

export function EditSheet({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="tt-edit-sheet-wrap" onClick={onClose}>
      <div className="tt-edit-sheet" onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}
