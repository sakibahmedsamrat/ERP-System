'use client'

import { useState, useEffect, useRef, useCallback } from 'react';
import { Download, Printer, RefreshCw, Hash, Check } from 'lucide-react';

export default function VisitorIdCardSection() {
  const [cardNo, setCardNo] = useState('1021');
  const [isReady, setIsReady] = useState(false);
  const frontCanvasRef = useRef<HTMLCanvasElement>(null);
  const backCanvasRef = useRef<HTMLCanvasElement>(null);
  const frontImgRef = useRef<HTMLImageElement | null>(null);
  const backImgRef = useRef<HTMLImageElement | null>(null);
  const cardNoRef = useRef(cardNo);
  cardNoRef.current = cardNo;

  const drawFront = useCallback((num?: string) => {
    const canvas = frontCanvasRef.current;
    const img = frontImgRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = img.naturalWidth || 633;
    canvas.height = img.naturalHeight || 1024;

    // 1. Draw base front image
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // 2. Clear CARD NO. area with white rectangle
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(150, 782, 330, 52);

    // 3. Draw dynamic "CARD NO. : {cardNo}" centered
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Format text: CARD NO. : {cardNo}
    const currentNum = num !== undefined ? num : cardNoRef.current;
    const label = `CARD NO. : ${(currentNum || '').trim() || '----'}`;
    ctx.font = 'bold 36px "Plus Jakarta Sans", "Segoe UI", Arial, sans-serif';
    ctx.fillText(label, canvas.width / 2, 808);

    setIsReady(true);
  }, []);

  const drawBack = useCallback(() => {
    const canvas = backCanvasRef.current;
    const img = backImgRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = img.naturalWidth || 632;
    canvas.height = img.naturalHeight || 1024;

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  }, []);

  useEffect(() => {
    const fImg = new Image();
    fImg.crossOrigin = 'anonymous';
    fImg.src = '/visitor-card/visitor_front.jpg';
    fImg.onload = () => {
      frontImgRef.current = fImg;
      drawFront();
    };

    const bImg = new Image();
    bImg.crossOrigin = 'anonymous';
    bImg.src = '/visitor-card/visitor_back.jpg?v=3';
    bImg.onload = () => {
      backImgRef.current = bImg;
      drawBack();
    };
  }, [drawFront, drawBack]);

  useEffect(() => {
    drawFront(cardNo);
  }, [cardNo, drawFront]);

  const downloadFront = () => {
    const canvas = frontCanvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `Visitor_ID_Card_Front_${cardNo || '1021'}.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.95);
    link.click();
  };

  const downloadBack = () => {
    const canvas = backCanvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `Visitor_ID_Card_Back.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.95);
    link.click();
  };

  const downloadBoth = () => {
    downloadFront();
    setTimeout(() => {
      downloadBack();
    }, 400);
  };

  const handlePrint = () => {
    const frontData = frontCanvasRef.current?.toDataURL('image/jpeg', 0.95);
    const backData = backCanvasRef.current?.toDataURL('image/jpeg', 0.95);
    if (!frontData || !backData) return;

    const printWin = window.open('', '_blank');
    if (!printWin) return;

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Visitor ID Card - ${cardNo}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 15mm;
            }
            body {
              margin: 0;
              padding: 20px;
              display: flex;
              gap: 20px;
              justify-content: center;
              font-family: sans-serif;
            }
            .card {
              width: 54mm;
              height: 85.6mm;
              border: 1px dashed #ccc;
              border-radius: 4mm;
              overflow: hidden;
            }
            .card img {
              width: 100%;
              height: 100%;
              object-fit: cover;
              display: block;
            }
          </style>
        </head>
        <body>
          <div class="card"><img src="${frontData}" /></div>
          <div class="card"><img src="${backData}" /></div>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Control Bar */}
      <div className="glass-card bg-white/70 backdrop-blur-xl p-6 rounded-2xl border border-white/60 shadow-glass flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Hash size={16} />
            </div>
            <input
              type="text"
              value={cardNo}
              onChange={(e) => setCardNo(e.target.value)}
              placeholder="Enter Card No (e.g. 1021)"
              className="w-full pl-10 pr-4 py-2.5 bg-white/60 hover:bg-white focus:bg-white border border-slate-200/80 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-semibold text-gray-800 transition"
            />
          </div>
          <div className="text-xs text-gray-500 hidden sm:block">
            Type any Card Number to update card instantly
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          <button
            onClick={downloadFront}
            className="px-4 py-2 bg-white/80 border border-slate-200/80 text-gray-700 hover:bg-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-xs transition"
          >
            <Download size={16} className="text-blue-600" /> Download Front
          </button>
          <button
            onClick={downloadBack}
            className="px-4 py-2 bg-white/80 border border-slate-200/80 text-gray-700 hover:bg-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-xs transition"
          >
            <Download size={16} className="text-indigo-600" /> Download Back
          </button>
          <button
            onClick={downloadBoth}
            className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-md shadow-blue-500/20 transition"
          >
            <Download size={16} /> Download Both (JPG)
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-800 text-white hover:bg-slate-900 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm transition"
          >
            <Printer size={16} /> Print
          </button>
        </div>
      </div>

      {/* Cards Preview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start justify-center">
        {/* Front Card */}
        <div className="glass-card bg-white/70 backdrop-blur-xl p-6 rounded-2xl border border-white/60 shadow-glass flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span> Front Side
            </h3>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
              Card No: {cardNo || '----'}
            </span>
          </div>

          <div className="relative rounded-2xl overflow-hidden shadow-xl border border-gray-100 max-w-[340px] w-full aspect-[633/1024]">
            <canvas
              ref={frontCanvasRef}
              className="w-full h-full object-cover block"
            />
          </div>

          <button
            onClick={downloadFront}
            className="mt-5 w-full max-w-[340px] py-2.5 bg-white/60 hover:bg-blue-50 text-gray-700 hover:text-blue-600 border border-slate-200/80 hover:border-blue-200 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition"
          >
            <Download size={16} /> Download Front (JPG)
          </button>
        </div>

        {/* Back Card */}
        <div className="glass-card bg-white/70 backdrop-blur-xl p-6 rounded-2xl border border-white/60 shadow-glass flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600"></span> Back Side
            </h3>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700">
              MEP Group Info
            </span>
          </div>

          <div className="relative rounded-2xl overflow-hidden shadow-xl border border-gray-100 max-w-[340px] w-full aspect-[632/1024]">
            <canvas
              ref={backCanvasRef}
              className="w-full h-full object-cover block"
            />
          </div>

          <button
            onClick={downloadBack}
            className="mt-5 w-full max-w-[340px] py-2.5 bg-gray-50 hover:bg-indigo-50 text-gray-700 hover:text-indigo-600 border border-gray-200 hover:border-indigo-200 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition"
          >
            <Download size={16} /> Download Back (JPG)
          </button>
        </div>
      </div>
    </div>
  );
}
