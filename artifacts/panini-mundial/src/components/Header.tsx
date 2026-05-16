import { useState, useEffect } from "react";
import { ShieldCheck, Truck, Lock, Package } from "lucide-react";

export function Header() {
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [buying, setBuying] = useState(() => Math.floor(Math.random() * 60) + 80);
  const [sold, setSold] = useState(() => Math.floor(Math.random() * 400) + 400);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 15 * 60));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const buyingTimer = setInterval(() => {
      setBuying((prev) => Math.max(60, prev + (Math.random() > 0.4 ? 1 : -1)));
    }, 4000);
    const soldTimer = setInterval(() => {
      setSold((prev) => prev + Math.floor(Math.random() * 2) + 1);
    }, 7000);
    return () => {
      clearInterval(buyingTimer);
      clearInterval(soldTimer);
    };
  }, []);

  return (
    <header className="w-full flex flex-col items-center sticky top-0 z-50 shadow-md">
      {/* Main top bar */}
      <div className="w-full bg-[#6b0f1a] text-white py-2.5 px-4 flex items-center justify-between gap-4">
        <a href="/" className="flex-shrink-0 bg-white rounded-md px-2 py-1">
          <img
            src="/assets/logo-panini-oficial.png"
            alt="Panini"
            className="h-7 w-auto object-contain"
          />
        </a>

        <div className="flex flex-col items-end gap-0.5">
          <span className="text-white/60 text-[10px] font-semibold uppercase tracking-widest leading-none">
            ⏱ Oferta expira en
          </span>
          <div className="flex items-center gap-1">
            {(() => {
              const h = Math.floor(timeLeft / 3600).toString().padStart(2, "0");
              const m = Math.floor((timeLeft % 3600) / 60).toString().padStart(2, "0");
              const s = (timeLeft % 60).toString().padStart(2, "0");
              return (
                <>
                  {[h, m, s].map((unit, i) => (
                    <span key={i} className="flex items-center gap-1">
                      <span className="bg-black/40 border border-white/20 rounded px-1.5 py-0.5 text-yellow-300 font-black text-sm tabular-nums leading-none min-w-[26px] text-center">
                        {unit}
                      </span>
                      {i < 2 && <span className="text-yellow-300 font-black text-sm leading-none">:</span>}
                    </span>
                  ))}
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Social Proof Bar */}
      <div className="w-full bg-[#3d0710] text-white/90 py-1.5 px-4 flex justify-center gap-6 text-xs font-medium border-b border-white/10">
        <span className="flex items-center gap-1.5 text-orange-300 font-bold">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-400"></span>
          </span>
          {buying} comprando ahora
        </span>
        <span className="text-white/40">|</span>
        <span className="flex items-center gap-1.5">
          <Package className="w-3.5 h-3.5 text-green-400" />
          <span className="text-green-300 font-bold">{sold} vendidos hoy</span>
        </span>
      </div>

      {/* Trust Badges Row */}
      <div className="w-full py-2 px-4 flex flex-wrap justify-center gap-x-5 gap-y-1 text-[11px] text-gray-500 bg-white border-b border-gray-100">
        <span className="flex items-center gap-1 font-medium"><Lock className="w-3 h-3 text-green-600" /> Pago 100% seguro</span>
        <span className="flex items-center gap-1 font-medium"><ShieldCheck className="w-3 h-3 text-green-600" /> Compra protegida</span>
        <span className="flex items-center gap-1 font-medium"><Truck className="w-3 h-3 text-green-600" /> Envío gratis México</span>
        <span className="flex items-center gap-1 font-medium"><ShieldCheck className="w-3 h-3 text-green-600" /> Producto original</span>
      </div>
    </header>
  );
}
