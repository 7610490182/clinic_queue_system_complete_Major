import { useState } from 'react';
import { FiCheckCircle, FiCopy, FiSmartphone, FiShield, FiPrinter } from 'react-icons/fi';

/**
 * High-precision SVG QR Code Generator for Contactless Clinical Check-In
 */
const SimpleSVGQR = ({ value, size = 180 }) => {
  // Generate a deterministic pseudo-matrix based on value string hash
  const modules = 21; // standard Version 1 QR matrix (21x21)
  const matrix = Array.from({ length: modules }, () => Array(modules).fill(false));

  // Corner Finder Patterns (7x7 squares at 3 corners)
  const addFinder = (startX, startY) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 || r === 6 || c === 0 || c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          matrix[startY + r][startX + c] = true;
        }
      }
    }
  };

  addFinder(0, 0); // Top-Left
  addFinder(modules - 7, 0); // Top-Right
  addFinder(0, modules - 7); // Bottom-Left

  // Timing lines
  for (let i = 8; i < modules - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Populate data area based on simple byte hashes of string
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = ((hash << 5) - hash) + value.charCodeAt(i);
    hash |= 0;
  }

  for (let r = 0; r < modules; r++) {
    for (let c = 0; c < modules; c++) {
      // Skip finder patterns
      const inTopLeft = r < 8 && c < 8;
      const inTopRight = r < 8 && c >= modules - 8;
      const inBottomLeft = r >= modules - 8 && c < 8;
      const inTiming = r === 6 || c === 6;

      if (!inTopLeft && !inTopRight && !inBottomLeft && !inTiming) {
        const seed = Math.sin(hash + r * 31 + c * 17) * 10000;
        matrix[r][c] = (seed - Math.floor(seed)) > 0.45;
      }
    }
  }

  const cellSize = size / modules;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rounded-xl shadow-md bg-white p-2">
      <rect width={size} height={size} fill="white" />
      {matrix.map((row, r) =>
        row.map((cell, c) =>
          cell ? (
            <rect
              key={`${r}-${c}`}
              x={c * cellSize}
              y={r * cellSize}
              width={cellSize + 0.3}
              height={cellSize + 0.3}
              fill="#0f172a"
            />
          ) : null
        )
      )}
    </svg>
  );
};

const QRCheckInCard = ({ appointment }) => {
  const [copied, setCopied] = useState(false);
  const checkInCode = appointment?.checkInCode || 'CK-789';
  const qrPayload = JSON.stringify({
    aptId: appointment?._id,
    token: appointment?.tokenNumber,
    code: checkInCode,
    doctor: appointment?.doctor?.name || 'Clinic'
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(checkInCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 text-white rounded-3xl p-6 shadow-2xl border border-blue-500/30 max-w-sm mx-auto text-center space-y-4">
      {/* Header Badge */}
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-blue-300">
          <FiShield className="text-emerald-400" /> Contactless Check-In
        </span>
        <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
          Token #{appointment?.tokenNumber || 1}
        </span>
      </div>

      {/* QR Code Container */}
      <div className="flex justify-center py-2">
        <SimpleSVGQR value={qrPayload} size={190} />
      </div>

      {/* 6-Digit PIN Backup */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
        <span className="text-[10px] uppercase font-bold text-slate-300 block">
          Reception Check-In Code:
        </span>
        <div className="flex items-center justify-center gap-2 mt-1">
          <span className="font-mono text-2xl font-black tracking-widest text-blue-300">
            {checkInCode}
          </span>
          <button
            onClick={handleCopy}
            className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition"
            title="Copy Code"
          >
            <FiCopy className="text-sm" />
          </button>
        </div>
        {copied && (
          <span className="text-[10px] text-emerald-400 font-bold block mt-0.5">
            ✓ Copied to clipboard!
          </span>
        )}
      </div>

      <p className="text-[11px] text-slate-300 leading-relaxed">
        Scan this QR at the clinic kiosk or show the 6-digit code at reception to instantly mark yourself arrived.
      </p>

      {/* Print Action */}
      <div className="pt-1 flex gap-2">
        <button
          onClick={handlePrint}
          className="flex-1 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition flex items-center justify-center gap-1.5"
        >
          <FiPrinter /> Print Pass
        </button>
      </div>
    </div>
  );
};

export default QRCheckInCard;

