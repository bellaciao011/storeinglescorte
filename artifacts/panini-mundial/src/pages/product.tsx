import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Heart, Share2, Star, CheckCircle, ShieldCheck, Truck, RotateCcw, Zap, ChevronLeft as Prev, ChevronRight as Next } from "lucide-react";
import { Header } from "@/components/Header";
import { products } from "@/lib/products";

const fmtEUR = (n: number) =>
  n.toLocaleString("es-ES", { style: "currency", currency: "EUR", minimumFractionDigits: 2 });

interface ProductPageProps {
  params?: { id?: string };
}

export default function ProductPage({ params }: ProductPageProps) {
  const [, setLocation] = useLocation();
  const product = products.find((p) => p.id === params?.id);
  const [activeImg, setActiveImg] = useState(0);
  const [wished, setWished] = useState(false);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Producto no encontrado</p>
          <button onClick={() => setLocation("/")} className="text-[#0B8A43] font-bold">
            ← Volver a la tienda
          </button>
        </div>
      </div>
    );
  }

  const gallery = product.images && product.images.length > 0 ? product.images : [product.img];
  const discountPct = Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100);
  const handleBuy = () => setLocation(`/checkout?kit=${product.id}`);

  const related = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const prevImg = () => setActiveImg((i) => (i - 1 + gallery.length) % gallery.length);
  const nextImg = () => setActiveImg((i) => (i + 1) % gallery.length);

  return (
    <div className="min-h-screen bg-[#F8F8F8] font-sans">
      <Header />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100 px-4 py-2">
        <div className="max-w-2xl mx-auto flex items-center gap-1 text-xs text-gray-400">
          <button onClick={() => setLocation("/")} className="hover:text-gray-700 transition-colors flex items-center gap-1">
            <ChevronLeft className="w-3 h-3" /> Tienda
          </button>
          <span>/</span>
          <span className="text-gray-500">{product.category}</span>
          <span>/</span>
          <span className="text-gray-700 truncate max-w-[160px]">{product.brand}</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">

        {/* ── Product image gallery ── */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">

          {/* Main image with nav arrows */}
          <div className="relative bg-white flex items-center justify-center" style={{ minHeight: 300 }}>
            <AnimatePresence mode="wait">
              <motion.img
                key={activeImg}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                src={gallery[activeImg]}
                alt={product.name}
                className="w-full object-contain"
                style={{ maxHeight: 320, padding: "24px" }}
                onError={(e) => { (e.target as HTMLImageElement).src = "/assets/kit-basico.png"; }}
              />
            </AnimatePresence>

            {/* Arrows — only show if more than 1 image */}
            {gallery.length > 1 && (
              <>
                <button
                  onClick={prevImg}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full shadow-md flex items-center justify-center border border-gray-100"
                >
                  <Prev className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={nextImg}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full shadow-md flex items-center justify-center border border-gray-100"
                >
                  <Next className="w-4 h-4 text-gray-600" />
                </button>
              </>
            )}

            {/* Top-right actions */}
            <button
              onClick={() => setWished(!wished)}
              className="absolute top-3 right-3 w-9 h-9 bg-white rounded-full shadow flex items-center justify-center"
            >
              <Heart className={`w-4 h-4 ${wished ? "fill-red-500 text-red-500" : "text-gray-400"}`} />
            </button>
            <button className="absolute top-3 right-14 w-9 h-9 bg-white rounded-full shadow flex items-center justify-center">
              <Share2 className="w-4 h-4 text-gray-400" />
            </button>

            {/* Badge */}
            {product.badge && (
              <div className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded">
                {product.badge}
              </div>
            )}

            {/* Dots indicator */}
            {gallery.length > 1 && (
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                {gallery.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${i === activeImg ? "bg-gray-800 w-4" : "bg-gray-300"}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Thumbnail strip */}
          {gallery.length > 1 && (
            <div className="flex gap-2 px-4 pb-4 overflow-x-auto scrollbar-hide">
              {gallery.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                    i === activeImg ? "border-[#0B8A43]" : "border-gray-100"
                  }`}
                >
                  <img
                    src={img}
                    alt={`${product.shortName} ${i + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = "/assets/kit-basico.png"; }}
                  />
                </button>
              ))}
            </div>
          )}

          {/* Info */}
          <div className="px-5 py-5 border-t border-gray-50">
            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mb-1">{product.brand}</p>
            <h1 className="text-base font-bold text-gray-900 leading-snug mb-4">{product.name}</h1>

            {/* Ratings mock */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}
              </div>
              <span className="text-xs text-gray-500">4,8 (127 valoraciones)</span>
            </div>

            {/* Price */}
            <div className="mb-4">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-3xl font-black text-gray-900">{fmtEUR(product.price)}</span>
                <span className="text-sm text-gray-400 line-through">{fmtEUR(product.oldPrice)}</span>
                <span className="bg-red-500 text-white text-xs font-black px-2 py-0.5 rounded">
                  −{discountPct}%
                </span>
              </div>
              {product.badge === "SÚPER" && (
                <span className="inline-flex items-center gap-1 text-[11px] font-black text-[#0B8A43] uppercase tracking-wide">
                  <Zap className="w-3 h-3" /> Súper Tecnoprecios
                </span>
              )}
              <p className="text-xs text-gray-400 mt-1">IVA incluido · Envío gratuito</p>
            </div>

            {/* Color */}
            {product.color && (
              <div className="mb-5">
                <p className="text-xs font-bold text-gray-700 mb-1">
                  Color: <span className="font-normal text-gray-500">{product.color}</span>
                </p>
              </div>
            )}

            {/* Buttons */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleBuy}
              className="w-full py-4 rounded-xl font-black text-white text-base mb-3"
              style={{ background: "linear-gradient(135deg, #0B8A43, #23B05C)" }}
            >
              Añadir a la cesta
            </motion.button>
            <button
              onClick={handleBuy}
              className="w-full py-3.5 rounded-xl font-bold text-gray-900 text-sm border-2 border-gray-200 bg-white mb-4"
            >
              Comprar ahora
            </button>

            {/* Trust badges */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: <Truck className="w-3.5 h-3.5 text-[#0B8A43]" />, text: "Envío gratis" },
                { icon: <ShieldCheck className="w-3.5 h-3.5 text-[#0B8A43]" />, text: "Compra protegida" },
                { icon: <RotateCcw className="w-3.5 h-3.5 text-[#0B8A43]" />, text: "30 días devolución" },
                { icon: <CheckCircle className="w-3.5 h-3.5 text-[#0B8A43]" />, text: "Producto oficial" },
              ].map((b, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs text-gray-600">
                  {b.icon} {b.text}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
          <h2 className="font-black text-gray-900 text-sm mb-3">Descripción</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">{product.description}</p>
          <div className="flex flex-col gap-2">
            {product.features.map((f, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle className="w-4 h-4 text-[#0B8A43] flex-shrink-0 mt-0.5" />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Specs */}
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
          <h2 className="font-black text-gray-900 text-sm mb-3">Especificaciones técnicas</h2>
          <div className="divide-y divide-gray-100">
            {product.specs.map((s, i) => (
              <div key={i} className="flex py-2.5 gap-4">
                <span className="text-xs text-gray-400 w-32 flex-shrink-0 font-medium">{s.label}</span>
                <span className="text-xs text-gray-800 font-semibold">{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Services */}
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
          <h2 className="font-black text-gray-900 text-sm mb-3">Servicios adicionales</h2>
          <div className="space-y-3">
            {[
              { title: "ECI Care — Protección accidentes", sub: "Protege tu producto contra daños accidentales", price: "desde 2,99 €/mes" },
              { title: "Retirada del antiguo", sub: "Retiramos tu producto antiguo sin coste adicional", price: "Gratis" },
              { title: "Entrega a domicilio express", sub: "Recíbelo hoy si pides antes de las 13:00 h", price: "desde 4,95 €" },
            ].map((s, i) => (
              <div key={i} className="flex items-start justify-between gap-3 p-3 border border-gray-100 rounded-xl">
                <div>
                  <p className="text-xs font-bold text-gray-900">{s.title}</p>
                  <p className="text-[10px] text-gray-400">{s.sub}</p>
                </div>
                <span className="text-[10px] font-bold text-[#0B8A43] whitespace-nowrap">{s.price}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <div className="mb-6">
            <h2 className="font-black text-gray-900 text-sm mb-3 px-1">También te puede interesar</h2>
            <div className="grid grid-cols-2 gap-3">
              {related.map((p) => {
                const pct = Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100);
                return (
                  <button
                    key={p.id}
                    onClick={() => { setActiveImg(0); setLocation(`/producto/${p.id}`); }}
                    className="bg-white rounded-xl overflow-hidden shadow-sm text-left"
                  >
                    <div className="bg-white flex items-center justify-center" style={{ height: 110 }}>
                      <img
                        src={p.img}
                        alt={p.shortName}
                        className="w-full h-full object-contain p-3"
                        onError={(e) => { (e.target as HTMLImageElement).src = "/assets/kit-basico.png"; }}
                      />
                    </div>
                    <div className="p-3">
                      <p className="text-[10px] text-gray-400 font-semibold uppercase">{p.brand}</p>
                      <p className="text-xs text-gray-800 font-medium line-clamp-2 leading-snug mb-1">{p.shortName}</p>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-black text-gray-900">{fmtEUR(p.price)}</span>
                        <span className="bg-red-500 text-white text-[9px] font-black px-1 py-0.5 rounded">−{pct}%</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
