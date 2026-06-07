import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Star, CheckCircle, Heart, Lock, Truck, ShieldCheck, Award } from "lucide-react";
import { Header } from "@/components/Header";
import { kits } from "@/lib/kits";

const fmtEUR = (n: number) =>
  n.toLocaleString("es-ES", { style: "currency", currency: "EUR", minimumFractionDigits: 2 });

const reviews = [
  { avatar: "/assets/avatar-carlos.png", name: "Carlos Ramírez", city: "Madrid", title: "Entrega rapidísima", text: "Pedí el miércoles y el viernes ya lo tenía en casa. Todo perfecto, sin golpes. ¡Excelente servicio!", verified: "Compra verificada — hace 2 días" },
  { avatar: "/assets/avatar-amanda.png", name: "Amanda Torres", city: "Barcelona", title: "Precio inmejorable", text: "Estuve comparando y aquí tenían el mejor precio con envío gratis. Ya lo recomendé a dos amigas.", verified: "Compra verificada — hace 3 días" },
  { avatar: "/assets/avatar-roberto.png", name: "Roberto Hernández", city: "Sevilla", title: "Todo original", text: "Confieso que tenía dudas por ser en línea, pero llegó todo sellado. Calidad igual a la tienda física.", verified: "Compra verificada — hace 4 días" },
  { avatar: "/assets/avatar-fernanda.png", name: "Fernanda López", city: "Valencia", title: "Valió cada euro", text: "Compré el kit grande y quedé encantada. Vale mucho la pena.", verified: "Compra verificada — hace 5 días" },
  { avatar: "/assets/avatar-marcos.png", name: "Marcos García", city: "Bilbao", title: "Segunda compra", text: "Es mi segundo pedido y el servicio sigue siendo excelente. Bien empacado, entrega a tiempo.", verified: "Compra verificada — hace 6 días" },
  { avatar: "/assets/avatar-rita.png", name: "Rita Martínez", city: "Zaragoza", title: "Por fin encontré esta oferta", text: "Llevaba meses buscando este precio. Llegó en 3 días. ¡Súper recomendado!", verified: "Compra verificada — hace 1 día" },
  { avatar: "/assets/avatar-paulo.png", name: "Pablo Sánchez", city: "Málaga", title: "El mejor negocio", text: "Pagué rápido con tarjeta. Calidad igual a la descripción. Muy satisfecho.", verified: "Compra verificada — hace 8 horas" },
  { avatar: "/assets/avatar-soraia.png", name: "Sofía Núñez", city: "Alicante", title: "Excelente para regalo", text: "Se lo regalé a mi hermano y quedó encantado. El soporte respondió en pocas horas.", verified: "Compra verificada — hace 12 horas" },
];

const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 280, damping: 22 } } };

export default function Landing() {
  const [, setLocation] = useLocation();
  const handleBuy = (kitId: string) => setLocation(`/checkout?kit=${kitId}`);

  return (
    <div className="min-h-screen bg-[#F8F8F8] flex flex-col font-sans">
      <Header />

      {/* ─── Promo banner ─── */}
      <div className="bg-[#0B8A43] text-white px-4 py-2.5 text-center">
        <p className="text-sm font-bold">
          Súper ofertas exclusivas · <span className="text-yellow-300">Hasta −80%</span>
        </p>
        <p className="text-xs text-white/70">Selección especial para clientes preseleccionados</p>
      </div>

      {/* ─── Section header ─── */}
      <div className="px-4 pt-4 pb-2 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="font-black text-gray-900 text-base">Ofertas especiales</span>
            <span className="text-gray-400 text-sm ml-2">| {kits.length} productos</span>
          </div>
          <span className="text-xs text-[#0B8A43] font-semibold">Ver todo</span>
        </div>

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
          {["Todo", "Más vendidos", "Ofertas", "Colección", "Edición especial"].map((cat, i) => (
            <button
              key={i}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                i === 0
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-600 border-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Product grid ─── */}
      <section id="kits" className="px-3 pt-3 pb-8 bg-[#F8F8F8]">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 gap-3"
        >
          {kits.map((kit) => {
            const discountPct = Math.round(((kit.oldPrice - kit.price) / kit.oldPrice) * 100);
            const isSpecial = kit.id === "dourada" || kit.id === "estadio";

            return (
              <motion.div
                key={kit.id}
                variants={item}
                data-testid={`card-kit-${kit.id}`}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col"
              >
                {/* Image area */}
                <div className="relative bg-gray-50 flex items-center justify-center p-4"
                  style={{ minHeight: 140 }}>
                  <img
                    src={kit.img}
                    alt={kit.name}
                    className="max-h-28 w-auto object-contain"
                    loading="lazy"
                  />
                  {/* Heart */}
                  <button className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full shadow flex items-center justify-center">
                    <Heart className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                  {/* Badge */}
                  {kit.badge && (
                    <div className={`absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wide ${kit.badge.colorClass}`}>
                      {kit.badge.text}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-3 flex flex-col flex-1">
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-0.5">El Corte Inglés</p>
                  <h3 className="text-xs font-semibold text-gray-800 leading-snug mb-2 line-clamp-2">
                    {kit.name}
                    {kit.contents ? ` — ${kit.contents}` : ""}
                  </h3>

                  <div className="mt-auto">
                    {/* Prices */}
                    <div className="flex items-baseline gap-1.5 mb-0.5">
                      <span className="text-base font-black text-gray-900">
                        {fmtEUR(kit.price)}
                      </span>
                      <span className="text-xs text-gray-400 line-through">
                        {fmtEUR(kit.oldPrice)}
                      </span>
                    </div>

                    {/* Discount + SÚPER */}
                    <div className="flex items-center gap-1.5 mb-3">
                      <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded">
                        −{discountPct}%
                      </span>
                      {isSpecial && (
                        <span className="text-[10px] font-black text-[#0B8A43] uppercase tracking-wide">
                          SÚPER
                        </span>
                      )}
                    </div>

                    <button
                      data-testid={`button-order-${kit.id}`}
                      onClick={() => handleBuy(kit.id)}
                      className="w-full py-2.5 rounded-xl text-white font-bold text-sm transition-all active:scale-[0.98]"
                      style={{ background: "linear-gradient(135deg, #0B8A43, #23B05C)" }}
                    >
                      Añadir al carrito
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* ─── Trust strip ─── */}
      <section className="bg-white border-t border-gray-100 py-6 px-4">
        <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
          {[
            { icon: <Truck className="w-5 h-5 text-[#0B8A43]" />, title: "Envío gratis", sub: "En todos los pedidos" },
            { icon: <ShieldCheck className="w-5 h-5 text-[#0B8A43]" />, title: "Compra segura", sub: "Pago protegido · SSL" },
            { icon: <Award className="w-5 h-5 text-[#0B8A43]" />, title: "Original garantizado", sub: "Calidad El Corte Inglés" },
            { icon: <Lock className="w-5 h-5 text-[#0B8A43]" />, title: "Sin riesgos", sub: "Satisfacción garantizada" },
          ].map((t, i) => (
            <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 border border-gray-100">
              <div className="w-9 h-9 rounded-lg bg-[#E8F8EF] flex items-center justify-center flex-shrink-0">
                {t.icon}
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">{t.title}</p>
                <p className="text-[10px] text-gray-400">{t.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Reviews ─── */}
      <section className="bg-[#F8F8F8] py-10 px-4 border-t border-gray-100">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-black text-gray-900 text-base">Valoraciones de clientes</h2>
              <div className="flex items-center gap-1 mt-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 text-yellow-400 fill-current" />
                ))}
                <span className="text-xs text-gray-500 ml-1.5">4,9 · +2.200 reseñas</span>
              </div>
            </div>
          </div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          >
            {reviews.map((r, i) => (
              <motion.article
                key={i}
                variants={item}
                className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col"
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <img src={r.avatar} alt={r.name} className="w-9 h-9 rounded-full object-cover border border-gray-100" />
                  <div>
                    <p className="font-bold text-gray-900 text-xs leading-tight">{r.name}</p>
                    <p className="text-[10px] text-gray-400">{r.city}</p>
                  </div>
                </div>
                <div className="flex text-yellow-400 mb-1.5">
                  {[...Array(5)].map((_, j) => <Star key={j} className="w-3 h-3 fill-current" />)}
                </div>
                <h4 className="font-bold text-gray-800 text-xs mb-1">{r.title}</h4>
                <p className="text-gray-500 text-[11px] leading-relaxed flex-1">"{r.text}"</p>
                <p className="text-[9px] text-[#0B8A43] font-semibold mt-2 flex items-center gap-1">
                  <CheckCircle className="w-2.5 h-2.5" /> {r.verified}
                </p>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="bg-white border-t border-gray-200 pt-8 pb-6 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <img src="/assets/eci-logo.png" alt="El Corte Inglés" className="h-7 w-auto object-contain mb-3" />
            <p className="text-xs text-gray-400 leading-relaxed max-w-xs">
              Ofertas exclusivas seleccionadas para clientes preseleccionados. Envío gratis en todos los pedidos.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6 text-xs">
            <div>
              <p className="font-black text-gray-700 uppercase tracking-widest text-[10px] mb-3">Información</p>
              <ul className="space-y-2 text-gray-500">
                {["Sobre nosotros", "Política de privacidad", "Términos de uso", "Política de devolución"].map((l) => (
                  <li key={l}><a href="#" className="hover:text-gray-800 transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-black text-gray-700 uppercase tracking-widest text-[10px] mb-3">Pago seguro</p>
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded">VISA</span>
                <span className="bg-gray-800 text-white text-[10px] font-black px-2 py-0.5 rounded">MC</span>
                <span className="bg-blue-800 text-white text-[10px] font-black px-2 py-0.5 rounded">AMEX</span>
              </div>
              <p className="text-[10px] text-gray-400 flex items-center gap-1">
                <Lock className="w-3 h-3" /> SSL activo · Compra protegida
              </p>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 text-center text-[10px] text-gray-400">
            © 2026 El Corte Inglés — Todos los derechos reservados. Oferta promocional limitada.
          </div>
        </div>
      </footer>
    </div>
  );
}
