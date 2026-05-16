import { useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";
import { CheckCircle2, Clock, Package, Search, AlertCircle, X, ChevronDown, ChevronUp, MessageCircle, Send, Loader2 } from "lucide-react";

const MILESTONES = [
  { day: 1,  status: "confirmed",         label: "Pedido confirmado",                desc: "Pago aprobado, pedido registrado y correo de confirmación enviado." },
  { day: 2,  status: "preparing",         label: "Preparación logística",            desc: "Tu producto fue separado y encaminado a procesamiento interno." },
  { day: 4,  status: "shipped",           label: "Enviado a transportista",          desc: "Etiqueta validada y pedido entregado al socio logístico." },
  { day: 7,  status: "in_transit",        label: "Centro logístico internacional",   desc: "Pedido en tránsito entre centros operacionales por el alto volumen de envíos." },
  { day: 10, status: "transport_update",  label: "Actualización de transporte",      desc: "Pedido encaminado para distribución regional." },
  { day: 13, status: "local_center",      label: "Entrada en centro local",          desc: "Pedido recibido en el centro logístico responsable de tu región." },
  { day: 16, status: "delivery_prep",     label: "Preparación de entrega",           desc: "Separación final y organización de la ruta de distribución." },
  { day: 18, status: "out_for_delivery",  label: "Salió para distribución",          desc: "Pedido asignado al repartidor responsable." },
  { day: 20, status: "delivery_expected", label: "Entrega prevista",                 desc: "Tu pedido está en la fase final de entrega." },
];

const STATUS_ORDER = MILESTONES.map((m) => m.status);

const FAQ = [
  {
    icon: "📦",
    title: "ONDE ESTÁ A MINHA ENCOMENDA?",
    body: "A tua encomenda encontra-se em processamento logístico e poderá receber novas atualizações automaticamente nas próximas horas/dias úteis.\n\nDevido ao elevado volume de pedidos da campanha atual, alguns rastreios podem demorar mais tempo a sincronizar no sistema.",
  },
  {
    icon: "⏳",
    title: "QUAL O PRAZO DE ENTREGA?",
    body: "O prazo médio de entrega pode variar entre 3 a 8 dias úteis dependendo da região, transportadora e fluxo logístico internacional.\n\nEm períodos promocionais, algumas encomendas podem sofrer pequenos atrasos operacionais.",
  },
  {
    icon: "🚚",
    title: "O MEU RASTREIO NÃO ATUALIZA",
    body: "Não te preocupes. Em alguns casos, o sistema apenas atualiza quando a encomenda chega ao próximo centro logístico.\n\nIsso não significa que o pedido esteja parado.",
  },
  {
    icon: "💬",
    title: "FALAR COM O SUPORTE",
    body: "Caso precises de ajuda adicional, a nossa equipa irá analisar o teu caso o mais rapidamente possível.\n\nTempo médio de resposta:\n• 24h a 72h úteis",
  },
];

type TrackingData = {
  tracking_code: string;
  customer_name: string;
  product_name: string;
  amount_eur: number;
  payment_status: string;
  order_status: string;
  paid_at: string | null;
  created_at: string;
};

function SupportWidget() {
  const [open, setOpen] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ nome: "", encomenda: "", email: "", motivo: "", opcao: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    try {
      await fetch(apiUrl("/api/public/support"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } catch { /* silent */ }
    setSending(false);
    setSubmitted(true);
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#7B1C1C] text-white shadow-lg flex items-center justify-center hover:bg-[#5a0c16] transition-all hover:scale-105 active:scale-95"
        aria-label="Suporte"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Panel */}
      <div className={`fixed bottom-0 right-0 z-50 w-full max-w-md h-[88vh] bg-white rounded-t-2xl shadow-2xl flex flex-col transition-transform duration-300 ${open ? "translate-y-0" : "translate-y-full"}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#7B1C1C] flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-black text-gray-900 text-sm leading-tight">SUPORTE AO CLIENTE</p>
              <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                Centro de Apoio
              </p>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200">
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">

          {/* Welcome */}
          <div className="bg-[#7B1C1C]/5 rounded-xl p-4 border border-[#7B1C1C]/10">
            <p className="text-sm text-gray-700 leading-relaxed">
              👋 <strong>Olá! Bem-vindo ao Centro de Apoio ao Cliente.</strong>
            </p>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              A nossa equipa está disponível para ajudar com dúvidas relacionadas ao estado da encomenda, prazos de entrega, atualizações logísticas, reembolsos e suporte geral.
            </p>
          </div>

          {/* FAQ items */}
          {FAQ.map((item, idx) => (
            <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <span>{item.icon}</span>
                  <span>{item.title}</span>
                </span>
                {expandedFaq === idx
                  ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                }
              </button>
              {expandedFaq === idx && (
                <div className="px-4 pb-4 pt-0">
                  <div className="border-t border-gray-100 pt-3">
                    {item.body.split("\n").map((line, i) => (
                      <p key={i} className={`text-xs text-gray-600 leading-relaxed ${i > 0 && line === "" ? "mt-2" : line !== "" && i > 0 ? "mt-1" : ""}`}>
                        {line || "\u00A0"}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Refund form section */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setShowForm(!showForm)}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <span>📄</span>
                <span>PEDIDO DE REEMBOLSO</span>
              </span>
              {showForm
                ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
              }
            </button>

            {showForm && (
              <div className="px-4 pb-4 pt-0 border-t border-gray-100">
                {submitted ? (
                  <div className="pt-4 text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    </div>
                    <p className="font-bold text-green-700 text-sm mb-1">✅ PEDIDO RECEBIDO</p>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Após o envio do formulário, o teu pedido será encaminhado automaticamente para análise interna.<br/><br/>
                      Receberás uma atualização assim que o processo for revisto pela equipa responsável.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="pt-3 space-y-3">
                    <p className="text-xs text-gray-500 leading-relaxed mb-3">
                      Se pretendes solicitar uma análise de cancelamento ou reembolso, preenche o formulário abaixo. A nossa equipa irá validar as informações e responder em breve.
                    </p>

                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1">Nome completo</label>
                      <input
                        required
                        value={form.nome}
                        onChange={e => setForm({ ...form, nome: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B1C1C]/20 focus:border-[#7B1C1C]"
                        placeholder="Seu nome completo"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1">Número da encomenda</label>
                      <input
                        required
                        value={form.encomenda}
                        onChange={e => setForm({ ...form, encomenda: e.target.value.toUpperCase() })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#7B1C1C]/20 focus:border-[#7B1C1C]"
                        placeholder="Ex: PANAB1234"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1">Email utilizado na compra</label>
                      <input
                        required
                        type="email"
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B1C1C]/20 focus:border-[#7B1C1C]"
                        placeholder="seu@email.com"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1">Motivo do pedido</label>
                      <textarea
                        required
                        rows={2}
                        value={form.motivo}
                        onChange={e => setForm({ ...form, motivo: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B1C1C]/20 focus:border-[#7B1C1C] resize-none"
                        placeholder="Descreve o motivo..."
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-2">Pretende:</label>
                      <div className="space-y-1.5">
                        {[
                          "Continuar com a encomenda",
                          "Receber atualização prioritária",
                          "Solicitar análise de reembolso",
                        ].map((opt) => (
                          <label key={opt} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="opcao"
                              value={opt}
                              checked={form.opcao === opt}
                              onChange={() => setForm({ ...form, opcao: opt })}
                              className="accent-[#7B1C1C]"
                            />
                            <span className="text-xs text-gray-700">{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={sending}
                      className="w-full bg-[#7B1C1C] text-white font-bold text-sm py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-[#5a0c16] disabled:opacity-60 transition-colors"
                    >
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      {sending ? "Enviando..." : "Enviar formulário"}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>

          <div className="h-4" />
        </div>
      </div>
    </>
  );
}

export default function Rastreio() {
  const params = new URLSearchParams(window.location.search);
  const codigoFromUrl = (params.get("codigo") ?? "").toUpperCase();

  const [input, setInput] = useState(codigoFromUrl);
  const [data, setData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchTracking(code: string) {
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch(apiUrl(`/api/public/rastreio?codigo=${encodeURIComponent(code.trim())}`));
      if (res.status === 404) {
        setError("Código de rastreo no encontrado. Verifica que hayas escrito el código correcto.");
        return;
      }
      if (res.status >= 500) {
        setError("Error del servidor. Inténtalo de nuevo en unos minutos.");
        return;
      }
      if (!res.ok) {
        setError("Error al buscar. Inténtalo de nuevo.");
        return;
      }
      setData(await res.json());
    } catch {
      setError("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (codigoFromUrl) fetchTracking(codigoFromUrl);
  }, []);

  const isPaid = data?.payment_status === "paid";
  const currentStatusIdx = data ? STATUS_ORDER.indexOf(data.order_status) : -1;
  const currentMilestone = currentStatusIdx >= 0 ? MILESTONES[currentStatusIdx] : null;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" });

  const formatAmount = (v: number) =>
    `$${Number(v).toLocaleString("es-MX", { minimumFractionDigits: 0 })} MXN`;

  const estimatedDelivery = data?.paid_at
    ? new Date(new Date(data.paid_at).getTime() + 20 * 24 * 60 * 60 * 1000)
        .toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" })
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="w-full bg-[#7B1C1C] text-white py-4 px-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <div className="bg-[#F5C518] rounded-md px-3 py-1">
            <span className="font-black text-[#7B1C1C] text-sm tracking-wider">PANINI</span>
          </div>
          <div>
            <p className="text-xs text-white/70 uppercase tracking-widest leading-none">Rastreo de Pedido</p>
            <p className="text-sm font-bold leading-tight">FIFA World Cup 2026</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Search */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-6">
          <p className="text-sm font-semibold text-gray-700 mb-3">Código de rastreo</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value.toUpperCase())}
              onKeyDown={e => { if (e.key === "Enter") fetchTracking(input); }}
              placeholder="Ej: PANAB1234"
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[#7B1C1C]/30 focus:border-[#7B1C1C]"
            />
            <button
              onClick={() => fetchTracking(input)}
              disabled={loading}
              className="bg-[#7B1C1C] hover:bg-[#5a0c16] text-white px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 disabled:opacity-60"
            >
              <Search className="w-4 h-4" />
              {loading ? "..." : "Buscar"}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 mb-6">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Order card */}
        {data && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <p className="text-xs text-[#7B1C1C] font-bold uppercase tracking-widest mb-1">{data.tracking_code}</p>
                  <h2 className="text-lg font-black text-gray-900">
                    {(data.customer_name ?? "").split(" ")[0]}
                  </h2>
                  <p className="text-sm text-gray-500">{data.product_name}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-lg font-black text-gray-900">{formatAmount(data.amount_eur)}</p>
                  <p className="text-xs text-gray-400">Tarjeta de crédito</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  isPaid ? "bg-green-100 text-green-700" :
                  data.payment_status === "refused" ? "bg-red-100 text-red-700" :
                  "bg-yellow-100 text-yellow-700"
                }`}>
                  {isPaid ? "✓ Pago confirmado" :
                   data.payment_status === "refused" ? "Pago rechazado" :
                   "Esperando pago"}
                </span>
                <span className="text-xs text-gray-400">{formatDate(data.created_at)}</span>
              </div>
              {estimatedDelivery && isPaid && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Entrega estimada: <span className="font-semibold text-gray-700">{estimatedDelivery}</span>
                  </p>
                </div>
              )}
            </div>

            {!isPaid && data.payment_status !== "refused" && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
                <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-yellow-800 font-semibold text-sm">Esperando confirmación de pago</p>
                  <p className="text-yellow-700 text-xs mt-0.5">Una vez confirmado, tu pedido entra en preparación.</p>
                </div>
              </div>
            )}

            {isPaid && currentMilestone && (
              <div className="bg-[#7B1C1C]/5 border border-[#7B1C1C]/20 rounded-xl p-4">
                <p className="text-xs font-bold text-[#7B1C1C]/60 uppercase tracking-widest mb-1">Estado actual</p>
                <p className="text-base font-black text-[#7B1C1C]">{currentMilestone.label}</p>
                <p className="text-sm text-gray-600 mt-1">{currentMilestone.desc}</p>
              </div>
            )}

            {isPaid && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-5">Seguimiento completo</p>
                <div className="relative">
                  <div className="absolute left-[13px] top-3 bottom-3 w-0.5 bg-gray-200" />
                  <div className="space-y-0">
                    {MILESTONES.map((m, idx) => {
                      const isCompleted = currentStatusIdx > idx;
                      const isCurrent = currentStatusIdx === idx;
                      return (
                        <div key={m.status} className="flex items-start gap-4 relative pb-5 last:pb-0">
                          <div className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            isCompleted ? "bg-green-500" : isCurrent ? "bg-[#7B1C1C]" : "bg-gray-200"
                          }`}>
                            {isCompleted
                              ? <CheckCircle2 className="w-4 h-4 text-white" />
                              : isCurrent
                              ? <div className="w-2.5 h-2.5 rounded-full bg-white" />
                              : <div className="w-2 h-2 rounded-full bg-gray-400" />
                            }
                          </div>
                          <div className="pt-0.5 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className={`text-sm font-bold ${
                                isCompleted ? "text-green-700" : isCurrent ? "text-[#7B1C1C]" : "text-gray-400"
                              }`}>{m.label}</p>
                              {isCurrent && (
                                <span className="text-xs bg-[#7B1C1C] text-white font-semibold px-2 py-0.5 rounded-full">Ahora</span>
                              )}
                            </div>
                            {(isCompleted || isCurrent) && (
                              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{m.desc}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {!data && !loading && !error && !codigoFromUrl && (
          <div className="text-center py-12 text-gray-400">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Ingresa el código de rastreo<br/>que recibiste en tu correo de confirmación.</p>
          </div>
        )}
      </div>

      <SupportWidget />
    </div>
  );
}
