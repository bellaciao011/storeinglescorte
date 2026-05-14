import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { ChevronRight, Star, CheckCircle, Truck, ShieldCheck, Lock, Award, Package, ShoppingBag } from "lucide-react";
import { Header } from "@/components/Header";
import { kits } from "@/lib/kits";

const reviews = [
  {
    avatar: "/assets/avatar-carlos.png",
    name: "Carlos Silva",
    city: "Lisboa",
    title: "Entrega rapidíssima",
    text: "Encomendei na quarta e na sexta já estava cá em casa. O kit veio direitinho, sem amassados, e o meu filho ficou aos saltos quando abriu. Excelente serviço!",
    verified: "Compra verificada — há 2 dias",
  },
  {
    avatar: "/assets/avatar-amanda.png",
    name: "Amanda Costa",
    city: "Porto",
    title: "Preço imbatível",
    text: "Andei a comparar em várias lojas e foi aqui que tinha melhor preço. Ainda por cima sem portes. Já recomendei a duas amigas que também encomendaram.",
    verified: "Compra verificada — há 3 dias",
  },
  {
    avatar: "/assets/avatar-roberto.png",
    name: "Roberto Almeida",
    city: "Coimbra",
    title: "Tudo original Panini",
    text: "Confesso que estava desconfiado por ser online, mas chegou tudo selado com a marca Panini. Qualidade igual à das tabacarias e bem mais em conta.",
    verified: "Compra verificada — há 4 dias",
  },
  {
    avatar: "/assets/avatar-fernanda.png",
    name: "Fernanda Lima",
    city: "Braga",
    title: "Valeu cada cêntimo",
    text: "Comprei o kit maior para mim e para o meu marido completarmos juntos. Em duas tardes, já tínhamos colado mais de metade. Vale muito a pena.",
    verified: "Compra verificada — há 5 dias",
  },
  {
    avatar: "/assets/avatar-marcos.png",
    name: "Marcos Santos",
    city: "Faro",
    title: "Segunda compra, igual à primeira",
    text: "É a minha segunda encomenda e o serviço continua impecável. Bem embalado, entrega dentro do prazo e preço honesto. Sem dúvida que volto.",
    verified: "Compra verificada — há 6 dias",
  },
  {
    avatar: "/assets/avatar-rita.png",
    name: "Rita Martins",
    city: "Viseu",
    title: "Finalmente encontrei esta oferta",
    text: "A minha filha estava há meses a pedir o álbum. O preço estava imbatível e chegou em 3 dias. Recomendo vivamente!",
    verified: "Compra verificada — há 1 dia",
  },
  {
    avatar: "/assets/avatar-paulo.png",
    name: "Paulo Ribeiro",
    city: "Setúbal",
    title: "Melhor negócio em 2026",
    text: "Paguei com MB WAY, foi mesmo rápido. Caixas todas seladas, igual à descrição. Já estou à espera da troca de cromos repetidos.",
    verified: "Compra verificada — há 8 horas",
  },
  {
    avatar: "/assets/avatar-soraia.png",
    name: "Soraia Nunes",
    city: "Aveiro",
    title: "Excelente para prenda",
    text: "Ofertei ao meu irmão e ficou maravilhado. Suporte por e-mail respondeu em poucas horas quando tinha uma dúvida sobre a entrega.",
    verified: "Compra verificada — há 12 horas",
  },
];

export default function Landing() {
  const [, setLocation] = useLocation();

  const handleBuy = (kitId: string) => {
    setLocation(`/checkout?kit=${kitId}`);
  };

  const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const item = {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 280, damping: 22 } },
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Header />

      {/* ─── Hero ─── */}
      <section className="bg-[#f5f5f7] pt-10 pb-0 px-4 overflow-hidden">
        <div className="max-w-lg mx-auto text-center">

          {/* NIF badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white text-gray-800 text-xs font-black uppercase tracking-widest mb-8 border border-amber-300 shadow-sm"
          >
            Compra Única por NIF
          </motion.div>

          {/* FIFA WC26 Official Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="flex justify-center mb-5"
          >
            <img
              src="/assets/fifa-wc26-logo.png"
              alt="FIFA World Cup 26 — Official Licensed Product"
              className="h-36 sm:h-44 w-auto object-contain drop-shadow-md"
            />
          </motion.div>

          {/* ÁLBUM OFICIAL — green label */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-[#16a34a] font-black text-base uppercase tracking-widest mb-1"
          >
            Álbum Oficial
          </motion.p>

          {/* Subtitle */}
          <p className="text-gray-400 font-medium text-sm mb-4">
            FIFA World Cup 26™ | Panini
          </p>

          {/* Main headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-6xl sm:text-7xl font-black text-gray-900 leading-[1.0] mb-6 tracking-tight"
          >
            MUNDIAL<br />2026
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="text-base text-gray-600 max-w-sm mx-auto mb-2 leading-relaxed"
          >
            O maior evento do futebol mundial está a chegar!
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.28 }}
            className="text-base text-gray-600 max-w-sm mx-auto mb-5 leading-relaxed"
          >
            Garante o teu álbum de capa dura com 30, 60 ou 90 saquetas de cromos incluídas.
          </motion.p>

          {/* Stock warning — red bold */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-[#c8102e] font-black text-sm mb-7"
          >
            Apenas 5.000 unidades disponíveis para Portugal
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10"
          >
            <button
              data-testid="button-buy-hero"
              onClick={() => document.getElementById("kits")?.scrollIntoView({ behavior: "smooth" })}
              className="bg-[#16a34a] hover:bg-[#15803d] active:scale-[0.98] text-white font-black text-xl px-10 py-5 rounded-xl shadow-[0_6px_0_0_#15803d] hover:shadow-[0_3px_0_0_#15803d] hover:translate-y-[3px] transition-all flex items-center gap-3"
            >
              Comprar Agora <ShoppingBag className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Lock className="w-4 h-4 text-green-600" />
              Pagamento 100% seguro
            </div>
          </motion.div>
        </div>

        {/* Hero product image */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7 }}
          className="w-full bg-[#f5f5f7] mt-2"
        >
          <div className="max-w-2xl mx-auto">
            <img
              src="/assets/kit-colecionador.png"
              alt="Álbum oficial e caixas Panini FIFA World Cup 2026"
              className="w-full h-auto object-contain block"
            />
          </div>
        </motion.div>
      </section>

      {/* ─── Stats ─── */}
      <section className="bg-[#6b0f1a] py-3 px-4 text-white">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center divide-x divide-white/20">
          {[
            { stat: "7", label: "cromos por saqueta" },
            { stat: "670+", label: "cromos únicos no álbum" },
            { stat: "48", label: "seleções" },
            { stat: "4,9★", label: "avaliação média" },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-2 px-4 py-1">
              <span className="text-yellow-300 font-black text-sm tabular-nums">{s.stat}</span>
              <span className="text-white/70 text-xs">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Kits ─── */}
      <section id="kits" className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3 tracking-tight">
              Escolhe o teu kit
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Quantas mais saquetas, mais hipóteses de completar o álbum! Envio gratuito em todos os kits para Portugal Continental e Ilhas.
            </p>
          </div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {kits.map((kit) => {
              const isDourada = kit.id === "dourada";
              const isEstadio = kit.id === "estadio";
              const isCampeao = kit.id === "campeao";

              if (isDourada || isEstadio) {
                return (
                  <motion.div
                    key={kit.id}
                    variants={item}
                    data-testid={`card-kit-${kit.id}`}
                    className="relative p-[3px] rounded-2xl overflow-hidden hover:-translate-y-1 transition-transform duration-200 shadow-2xl"
                  >
                    {/* Rotating gradient border */}
                    <motion.div
                      className="absolute w-[200%] h-[200%] top-[-50%] left-[-50%] z-0"
                      style={{
                        background: isEstadio
                          ? "conic-gradient(from 0deg, #f59e0b, #ef4444, #3b82f6, #10b981, #a855f7, #ec4899, #fbbf24, #f59e0b)"
                          : "conic-gradient(from 0deg, #f59e0b, #fbbf24, #fde68a, #fffbeb, #fcd34d, #d97706, #b45309, #f59e0b)",
                      }}
                      animate={{ rotate: 360 }}
                      transition={{ duration: isEstadio ? 4 : 6, repeat: Infinity, ease: "linear" }}
                    />

                    {/* Card inner */}
                    <div className="relative z-10 bg-white rounded-[13px] flex flex-col overflow-hidden h-full">
                      {kit.badge && (
                        <div
                          className={`absolute top-3 right-3 z-10 px-3 py-1 rounded-md text-[10px] font-black tracking-widest uppercase ${kit.badge.colorClass} shadow`}
                        >
                          {kit.badge.text}
                        </div>
                      )}

                      {/* Product image */}
                      <div
                        className={`w-full flex items-center justify-center p-6 pb-2 ${
                          isEstadio
                            ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
                            : "bg-gradient-to-br from-yellow-50 to-amber-50"
                        }`}
                        style={{ minHeight: 200 }}
                      >
                        <img
                          src={kit.img}
                          alt={kit.name}
                          className="max-h-48 w-auto object-contain drop-shadow-xl"
                          loading="lazy"
                        />
                      </div>

                      <div className="p-5 flex flex-col flex-1">
                        <h3
                          className={`text-lg font-black mb-1 ${
                            isEstadio
                              ? "bg-gradient-to-r from-yellow-600 via-amber-400 to-yellow-700 bg-clip-text text-transparent"
                              : "text-yellow-700"
                          }`}
                        >
                          {kit.name}
                        </h3>
                        <p className="text-sm font-bold text-[#16a34a] mb-1">{kit.contents}</p>
                        <p className="text-xs text-gray-400 mb-5 border-b border-gray-100 pb-4">{kit.description}</p>

                        <div className="mt-auto">
                          <div className="flex items-end gap-2 mb-4">
                            <span className="text-3xl font-black text-gray-900 tracking-tight">
                              €{kit.price.toFixed(2).replace(".", ",")}
                            </span>
                            <span className="text-sm text-gray-400 line-through mb-0.5">
                              €{kit.oldPrice.toFixed(2).replace(".", ",")}
                            </span>
                            <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full ml-1 mb-0.5">
                              Portes grátis
                            </span>
                          </div>

                          <motion.button
                            data-testid={`button-order-${kit.id}`}
                            onClick={() => handleBuy(kit.id)}
                            className={`w-full active:scale-[0.98] font-black py-3.5 rounded-xl flex items-center justify-center gap-2 text-base text-gray-900 ${
                              isEstadio
                                ? "bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-400"
                                : "bg-gradient-to-r from-amber-400 to-yellow-400"
                            }`}
                            animate={{
                              boxShadow: isEstadio
                                ? ["0 0 0px rgba(251,191,36,0)", "0 0 28px rgba(251,191,36,0.9)", "0 0 0px rgba(251,191,36,0)"]
                                : ["0 0 0px rgba(251,191,36,0)", "0 0 20px rgba(251,191,36,0.7)", "0 0 0px rgba(251,191,36,0)"],
                            }}
                            transition={{ duration: isEstadio ? 1.4 : 1.8, repeat: Infinity, ease: "easeInOut" }}
                          >
                            Garantir o meu kit <ChevronRight className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              }

              return (
                <motion.div
                  key={kit.id}
                  variants={item}
                  data-testid={`card-kit-${kit.id}`}
                  className={`bg-white rounded-2xl border-2 relative flex flex-col overflow-hidden transition-all duration-200 hover:-translate-y-1 ${
                    isCampeao
                      ? "border-[#16a34a] shadow-xl ring-1 ring-green-200"
                      : "border-gray-100 shadow-sm hover:border-gray-200 hover:shadow-md"
                  }`}
                >
                  {kit.badge && (
                    <div
                      className={`absolute top-3 right-3 z-10 px-3 py-1 rounded-md text-[10px] font-black tracking-widest uppercase ${kit.badge.colorClass} shadow`}
                    >
                      {kit.badge.text}
                    </div>
                  )}

                  <div className="w-full bg-white flex items-center justify-center p-6 pb-2" style={{ minHeight: 200 }}>
                    <img
                      src={kit.img}
                      alt={kit.name}
                      className="max-h-48 w-auto object-contain"
                      loading="lazy"
                    />
                  </div>

                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="text-lg font-black text-gray-900 mb-1">{kit.name}</h3>
                    <p className="text-sm font-bold text-[#16a34a] mb-1">{kit.contents}</p>
                    <p className="text-xs text-gray-400 mb-5 border-b border-gray-100 pb-4">{kit.description}</p>

                    <div className="mt-auto">
                      <div className="flex items-end gap-2 mb-4">
                        <span className="text-3xl font-black text-gray-900 tracking-tight">
                          €{kit.price.toFixed(2).replace(".", ",")}
                        </span>
                        <span className="text-sm text-gray-400 line-through mb-0.5">
                          €{kit.oldPrice.toFixed(2).replace(".", ",")}
                        </span>
                        <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full ml-1 mb-0.5">
                          Portes grátis
                        </span>
                      </div>

                      <button
                        data-testid={`button-order-${kit.id}`}
                        onClick={() => handleBuy(kit.id)}
                        className="w-full bg-[#f5a623] hover:bg-[#e09400] active:scale-[0.98] text-gray-900 font-black py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all text-base shadow-sm"
                      >
                        Garantir o meu kit <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ─── Trust / Credibility ─── */}
      <section className="bg-white py-14 px-4 border-t border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-2">
              O álbum oficial mais aguardado do mundo
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-sm">
              Desde 1970, a Panini é a marca de referência mundial em cromos de futebol. O álbum do FIFA World Cup 26™ é o único produto com licença oficial FIFA.
            </p>
          </div>

          {/* Logos / Official badges row */}
          <div className="flex flex-wrap items-center justify-center gap-8 mb-12 py-6 border-y border-gray-100">
            <img src="/assets/logo-panini-oficial.png" alt="Panini" className="h-10 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity" />
            <img src="/assets/fifa-wc26-logo.png" alt="FIFA World Cup 26" className="h-14 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity" />
            <div className="flex flex-col items-center gap-1 text-center">
              <span className="text-2xl font-black text-[#16a34a]">+55 anos</span>
              <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">de história</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <span className="text-2xl font-black text-[#16a34a]">140+</span>
              <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">países</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <span className="text-2xl font-black text-[#16a34a]">1 Mil Milhões+</span>
              <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">cromos vendidos/ano</span>
            </div>
          </div>

          {/* Trust points grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="flex gap-4 items-start bg-gray-50 rounded-2xl p-5 border border-gray-100">
              <div className="w-10 h-10 rounded-xl bg-[#6b0f1a]/10 flex items-center justify-center flex-shrink-0">
                <Award className="w-5 h-5 text-[#6b0f1a]" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm mb-1">Licença FIFA Oficial</h4>
                <p className="text-xs text-gray-500 leading-relaxed">O único álbum com licença oficial da FIFA para o Mundial 2026. Produto autêntico e certificado.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start bg-gray-50 rounded-2xl p-5 border border-gray-100">
              <div className="w-10 h-10 rounded-xl bg-[#6b0f1a]/10 flex items-center justify-center flex-shrink-0">
                <Package className="w-5 h-5 text-[#6b0f1a]" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm mb-1">Caixas 100% Seladas</h4>
                <p className="text-xs text-gray-500 leading-relaxed">Todas as caixas chegam com lacre de fábrica intacto. Nunca abertas, nunca manipuladas.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start bg-gray-50 rounded-2xl p-5 border border-gray-100">
              <div className="w-10 h-10 rounded-xl bg-[#6b0f1a]/10 flex items-center justify-center flex-shrink-0">
                <Truck className="w-5 h-5 text-[#6b0f1a]" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm mb-1">Entrega CTT Rastreada</h4>
                <p className="text-xs text-gray-500 leading-relaxed">Envio com número de rastreio CTT. Entrega em 2–4 dias úteis para Portugal Continental e Ilhas.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Sobre o Álbum / Why Now ─── */}
      <section className="bg-white py-16 px-4 border-t border-gray-100">
        <div className="max-w-2xl mx-auto">
          {/* Sobre o álbum */}
          <div className="text-center mb-8">
            <p className="text-[#16a34a] font-black text-xs uppercase tracking-widest mb-3">Sobre o Álbum Oficial</p>
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight">
              O melhor álbum da história do Campeonato do Mundo
            </h2>
          </div>

          {/* Stats 2x2 */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { stat: "112", label: "Páginas", sub: "O maior álbum da Panini" },
              { stat: "670+", label: "Cromos", sub: "Cromos únicos no álbum" },
              { stat: "7", label: "Cromos por saqueta", sub: "Mais cromos por embalagem" },
              { stat: "48", label: "Seleções", sub: "Todas as seleções apuradas" },
            ].map((s, i) => (
              <div key={i} className="bg-gray-50 border border-gray-100 rounded-2xl p-5 text-center">
                <div className="text-4xl font-black text-[#16a34a] mb-1">{s.stat}</div>
                <div className="font-bold text-gray-900 text-sm mb-0.5">{s.label}</div>
                <div className="text-xs text-gray-400">{s.sub}</div>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-gray-400 mb-12">
            3ª edição histórica — edição Mundial 26 com 48 selecções
          </p>

          {/* Porquê garantir agora */}
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-black text-gray-900">
              Porquê garantir o teu kit agora?
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { emoji: "🚚", title: "Entrega prioritária", desc: "Recebe antes de toda a gente" },
              { emoji: "🎁", title: "Desconto exclusivo", desc: "Apenas nesta oferta online" },
              { emoji: "✅", title: "Produto original Panini", desc: "Garantia de autenticidade" },
              { emoji: "📦", title: "Portes grátis", desc: "Envio grátis para todo Portugal" },
            ].map((b, i) => (
              <div key={i} className="bg-gray-50 border border-gray-100 rounded-2xl p-5 flex flex-col items-center text-center gap-2">
                <span className="text-3xl">{b.emoji}</span>
                <p className="font-bold text-gray-900 text-sm">{b.title}</p>
                <p className="text-xs text-gray-400 leading-snug">{b.desc}</p>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-gray-400">
            ✓ Portes grátis &nbsp;·&nbsp; ✓ Produto original
          </p>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section className="bg-gray-50 py-20 px-4 border-t border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-gray-900 mb-3">O que dizem os nossos clientes</h2>
            <div className="flex justify-center items-center gap-0.5 text-yellow-400 mb-2">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-current" />)}
            </div>
            <p className="text-sm text-gray-500 font-medium">Classificação Excelente · +2.200 avaliações</p>
          </div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
          >
            {reviews.map((r, i) => (
              <motion.article
                key={i}
                variants={item}
                className="bg-gray-50 border border-gray-100 rounded-2xl p-5 flex flex-col"
              >
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={r.avatar}
                    alt={r.name}
                    className="w-11 h-11 rounded-full object-cover flex-shrink-0 border-2 border-white shadow-sm"
                  />
                  <div>
                    <p className="font-bold text-gray-900 text-sm leading-tight">{r.name}</p>
                    <p className="text-xs text-gray-400">{r.city}</p>
                  </div>
                </div>
                <div className="flex text-yellow-400 mb-2">
                  {[...Array(5)].map((_, j) => <Star key={j} className="w-3.5 h-3.5 fill-current" />)}
                </div>
                <h4 className="font-bold text-gray-800 text-sm mb-1">{r.title}</h4>
                <p className="text-gray-600 text-xs leading-relaxed flex-1">"{r.text}"</p>
                <p className="text-[10px] text-green-700 font-semibold mt-3 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> {r.verified}
                </p>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── CTA antes do Why Us ─── */}
      <section className="py-10 px-4 bg-gray-50 border-t border-gray-100 text-center">
        <div className="max-w-xl mx-auto">
          <p className="text-sm text-gray-500 mb-4 flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse inline-block"></span>
            Stock limitado — oferta pode terminar a qualquer momento
          </p>
          <button
            data-testid="button-cta-final"
            onClick={() => document.getElementById("kits")?.scrollIntoView({ behavior: "smooth" })}
            className="bg-[#f5a623] hover:bg-[#e09400] active:scale-[0.98] text-gray-900 font-black text-lg px-10 py-4 rounded-xl shadow-sm transition-all inline-flex items-center gap-2"
          >
            Garantir o Meu Kit <ShoppingBag className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* ─── Why Us ─── */}
      <section className="py-12 px-4 bg-gray-50 border-t border-gray-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-black text-gray-900 text-center mb-8">Porquê comprar connosco?</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: <Truck className="w-6 h-6" />, title: "Envio Rápido", desc: "2-4 dias úteis para todo Portugal" },
              { icon: <Award className="w-6 h-6" />, title: "Produto Oficial", desc: "Licença oficial FIFA e Panini" },
              { icon: <Lock className="w-6 h-6" />, title: "Compra Segura", desc: "Pagamento protegido + SSL" },
              { icon: <ShieldCheck className="w-6 h-6" />, title: "Sem Riscos", desc: "Satisfação garantida" },
            ].map((w, i) => (
              <div key={i} className="text-center bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <div className="w-11 h-11 mx-auto bg-red-50 rounded-xl flex items-center justify-center mb-3 text-[#6b0f1a]">
                  {w.icon}
                </div>
                <h4 className="font-bold text-gray-900 text-sm mb-0.5">{w.title}</h4>
                <p className="text-xs text-gray-400">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="bg-[#6b0f1a] text-white px-6 pt-10 pb-0">
        <div className="max-w-2xl mx-auto">
          {/* Logo + tagline */}
          <div className="mb-8">
            <div className="bg-white rounded-md px-2 py-1 inline-flex mb-4">
              <img src="/assets/logo-panini-oficial.png" alt="Panini" className="h-6 w-auto object-contain" />
            </div>
            <p className="text-white/70 text-sm leading-relaxed max-w-sm">
              A colecção oficial do Mundial 2026. Compra única por NIF, portes grátis para todo Portugal.
            </p>
          </div>

          {/* Links + Payment columns */}
          <div className="grid grid-cols-2 gap-8 mb-10">
            <div>
              <p className="text-[#f5a623] font-black text-xs uppercase tracking-widest mb-4">Institucional</p>
              <ul className="space-y-3 text-sm text-white/80">
                <li><a href="#" className="hover:text-white transition-colors">Sobre nós</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Política de privacidade</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Termos de uso</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Política de troca</a></li>
              </ul>
            </div>
            <div>
              <p className="text-[#f5a623] font-black text-xs uppercase tracking-widest mb-4">Pagamento Seguro</p>
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-[#c8102e] text-white text-xs font-black px-2.5 py-1 rounded">MB WAY</span>
                <span className="bg-blue-600 text-white text-xs font-black px-2.5 py-1 rounded">MULTIBANCO</span>
              </div>
              <p className="text-white/60 text-xs flex items-center gap-1.5">
                <Lock className="w-3 h-3" /> Site 100% seguro · SSL activo
              </p>
            </div>
          </div>
        </div>

        {/* Copyright bar */}
        <div className="border-t border-white/10 py-4 text-center text-white/40 text-xs">
          © 2026 Panini Portugal — Todos os direitos reservados. Oferta promocional limitada.
        </div>
      </footer>
    </div>
  );
}
