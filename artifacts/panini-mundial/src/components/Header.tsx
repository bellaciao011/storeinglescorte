import { useState, useEffect } from "react";
import { Search, User, Heart, ShoppingBag, Package } from "lucide-react";
import { useCart } from "@/lib/CartContext";

export function Header() {
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [buying, setBuying] = useState(() => Math.floor(Math.random() * 60) + 80);
  const [sold, setSold] = useState(() => Math.floor(Math.random() * 400) + 400);
  const { count, open } = useCart();

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 15 * 60));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const b = setInterval(() => setBuying((p) => Math.max(60, p + (Math.random() > 0.4 ? 1 : -1))), 4000);
    const s = setInterval(() => setSold((p) => p + Math.floor(Math.random() * 2) + 1), 7000);
    return () => { clearInterval(b); clearInterval(s); };
  }, []);

  const mm = Math.floor(timeLeft / 60).toString().padStart(2, "0");
  const ss = (timeLeft % 60).toString().padStart(2, "0");

  return (
    <header className="w-full flex flex-col sticky top-0 z-50">

      {/* ── Announcement bar ── */}
      <div className="w-full bg-black text-white py-2 px-4 text-center text-xs font-medium">
        <span className="flex items-center justify-center gap-3 flex-wrap">
          <span className="flex items-center gap-1.5 text-yellow-300 font-bold">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-yellow-400" />
            </span>
            {buying} personas comprando ahora
          </span>
          <span className="text-white/30">·</span>
          <span>Hasta <strong className="text-yellow-300">−92%</strong> en productos seleccionados</span>
          <span className="text-white/30">·</span>
          <span className="text-white/70">Oferta expira en <strong className="text-white tabular-nums">{mm}:{ss}</strong></span>
        </span>
      </div>

      {/* ── Main header ── */}
      <div className="w-full bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        {/* Logo */}
        <a href="/" className="flex-shrink-0">
          <img src="/assets/eci-logo.png" alt="El Corte Inglés" className="h-8 w-auto object-contain" />
        </a>

        {/* Search bar */}
        <div className="flex-1 flex items-center bg-gray-100 rounded-full px-4 py-2 gap-2">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className="text-sm text-gray-400 truncate">¿Qué estás buscando?</span>
        </div>

        {/* Icons */}
        <div className="flex items-center gap-3 flex-shrink-0 text-gray-600">
          <User className="w-5 h-5" />
          <Heart className="w-5 h-5" />
          <button
            onClick={open}
            className="relative"
            aria-label="Abrir cesta"
          >
            <ShoppingBag className="w-5 h-5" />
            {count > 0 && (
              <span className="absolute -top-2 -right-2 w-4.5 h-4.5 min-w-[18px] min-h-[18px] bg-[#0B8A43] text-white text-[10px] font-black rounded-full flex items-center justify-center leading-none px-0.5">
                {count > 9 ? "9+" : count}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Trust strip ── */}
      <div className="w-full bg-[#F8F8F8] border-b border-gray-100 py-1.5 px-4 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5 text-[10px] text-gray-500">
        <span className="flex items-center gap-1">
          <Package className="w-3 h-3 text-[#0B8A43]" />
          <span className="text-[#0B8A43] font-bold">{sold} vendidos hoy</span>
        </span>
        <span className="text-gray-300">·</span>
        <span>Envío gratis en todos los pedidos</span>
        <span className="text-gray-300">·</span>
        <span>Pago 100% seguro</span>
      </div>

    </header>
  );
}
