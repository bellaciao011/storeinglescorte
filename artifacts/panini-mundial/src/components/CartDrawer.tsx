import { useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, ShoppingBag, ChevronRight } from "lucide-react";
import { useCart } from "@/lib/CartContext";

const fmtEUR = (n: number) =>
  n.toLocaleString("es-ES", { style: "currency", currency: "EUR", minimumFractionDigits: 2 });

export function CartDrawer() {
  const { items, isOpen, close, removeItem, updateQty, total, count } = useCart();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const handleCheckout = () => {
    close();
    setLocation("/checkout?cart=1");
    setTimeout(() => window.scrollTo({ top: 0, behavior: "instant" }), 50);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 z-[60]"
            onClick={close}
          />

          {/* Drawer */}
          <motion.div
            key="drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-sm bg-white z-[70] flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#0B8A43]" />
                <span className="font-black text-gray-900 text-base">
                  Mi cesta
                  {count > 0 && (
                    <span className="ml-2 text-sm font-bold text-gray-400">({count})</span>
                  )}
                </span>
              </div>
              <button
                onClick={close}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                    <ShoppingBag className="w-8 h-8 text-gray-300" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 mb-1">Tu cesta está vacía</p>
                    <p className="text-sm text-gray-400">Añade productos para continuar.</p>
                  </div>
                  <button
                    onClick={close}
                    className="mt-2 px-6 py-2.5 rounded-full border-2 border-[#0B8A43] text-[#0B8A43] font-bold text-sm hover:bg-green-50 transition-colors"
                  >
                    Seguir comprando
                  </button>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100 px-4 py-2">
                  {items.map(({ product, quantity }) => {
                    const pct = Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100);
                    return (
                      <li key={product.id} className="py-4 flex gap-3">
                        <img
                          src={product.img}
                          alt={product.shortName}
                          className="w-16 h-16 object-contain rounded-xl border border-gray-100 flex-shrink-0 bg-white p-1"
                          onError={(e) => { (e.target as HTMLImageElement).src = "/assets/kit-basico.png"; }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-gray-400 font-bold uppercase">{product.brand}</p>
                          <p className="text-xs text-gray-800 font-semibold leading-snug line-clamp-2 mb-1">
                            {product.shortName}
                          </p>
                          <div className="flex items-center gap-1.5 mb-2">
                            <span className="text-sm font-black text-gray-900">{fmtEUR(product.price)}</span>
                            <span className="bg-red-500 text-white text-[9px] font-black px-1 py-0.5 rounded">−{pct}%</span>
                          </div>
                          <div className="flex items-center justify-between">
                            {/* Qty controls */}
                            <div className="flex items-center gap-1 border border-gray-200 rounded-lg overflow-hidden">
                              <button
                                onClick={() => updateQty(product.id, quantity - 1)}
                                className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors font-bold text-base"
                              >−</button>
                              <span className="w-6 text-center text-sm font-bold text-gray-900">{quantity}</span>
                              <button
                                onClick={() => updateQty(product.id, quantity + 1)}
                                className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors font-bold text-base"
                              >+</button>
                            </div>
                            <button
                              onClick={() => removeItem(product.id)}
                              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-400" />
                            </button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Footer — only when cart has items */}
            {items.length > 0 && (
              <div className="border-t border-gray-100 px-5 pt-4 pb-6 flex flex-col gap-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-500 font-medium">Envío</span>
                  <span className="text-sm font-bold text-[#0B8A43]">Gratis</span>
                </div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-base font-black text-gray-900">Total</span>
                  <span className="text-xl font-black text-gray-900">{fmtEUR(total)}</span>
                </div>
                <button
                  onClick={handleCheckout}
                  className="w-full py-4 rounded-xl font-black text-white text-base flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg, #0B8A43, #23B05C)" }}
                >
                  Ir al pago <ChevronRight className="w-5 h-5" />
                </button>
                <button
                  onClick={close}
                  className="w-full py-3 rounded-xl font-bold text-gray-700 text-sm border-2 border-gray-200 hover:border-gray-300 transition-colors"
                >
                  Continuar comprando
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
