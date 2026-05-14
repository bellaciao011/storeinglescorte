import { useEffect, useState } from "react";
import { CheckCircle2, Clock, Package, Truck, Home, Search, AlertCircle } from "lucide-react";

const STATUS_STEPS = [
  { key: "preparing",  label: "Preparando pedido",              icon: Package },
  { key: "shipped",    label: "Enviado para a transportadora",  icon: Truck },
  { key: "in_transit", label: "A caminho",                      icon: Truck },
  { key: "delivered",  label: "Pedido entregue",                icon: Home },
];

const STATUS_INDEX: Record<string, number> = {
  preparing: 0,
  shipped: 1,
  in_transit: 2,
  delivered: 3,
};

type TrackingData = {
  tracking_code: string;
  customer_name: string;
  product_name: string;
  amount_eur: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
  paid_at: string | null;
  created_at: string;
};

export default function Rastreio() {
  const params = new URLSearchParams(window.location.search);
  const codigoFromUrl = (params.get("codigo") ?? "").toUpperCase();

  const [codigo, setCodigo] = useState(codigoFromUrl);
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
      const res = await fetch(`/api/public/rastreio?codigo=${encodeURIComponent(code.trim())}`);
      if (res.status === 404) { setError("Código de rastreio não encontrado. Confirma que introduziste o código correto."); return; }
      if (res.status >= 500) { setError("A base de dados ainda está a ser configurada. Tenta novamente em alguns minutos."); return; }
      if (!res.ok) { setError("Erro ao pesquisar. Tenta novamente."); return; }
      const json = await res.json();
      setData(json);
    } catch {
      setError("Erro de ligação. Tenta novamente.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (codigoFromUrl) fetchTracking(codigoFromUrl);
  }, []);

  const currentIdx = data ? (STATUS_INDEX[data.order_status] ?? 0) : -1;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("pt-PT", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="w-full bg-[#6b0f1a] text-white py-4 px-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <div className="bg-white rounded-md px-2 py-1">
            <img src="/assets/logo-panini-oficial.png" alt="Panini" className="h-7 w-auto object-contain" />
          </div>
          <div>
            <p className="text-xs text-white/70 uppercase tracking-widest leading-none">Rastreio de Encomenda</p>
            <p className="text-sm font-bold leading-tight">FIFA World Cup 2026</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Search box */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-6">
          <p className="text-sm font-semibold text-gray-700 mb-3">Código de rastreio</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value.toUpperCase())}
              onKeyDown={e => { if (e.key === "Enter") { setCodigo(input); fetchTracking(input); } }}
              placeholder="Ex: PANAB1234"
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[#6b0f1a]/30 focus:border-[#6b0f1a]"
            />
            <button
              onClick={() => { setCodigo(input); fetchTracking(input); }}
              disabled={loading}
              className="bg-[#6b0f1a] hover:bg-[#5a0c16] text-white px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 disabled:opacity-60"
            >
              <Search className="w-4 h-4" />
              {loading ? "..." : "Pesquisar"}
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
            {/* Summary */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <p className="text-xs text-[#6b0f1a] font-bold uppercase tracking-widest mb-1">{data.tracking_code}</p>
                  <h2 className="text-lg font-black text-gray-900">{data.customer_name.split(" ")[0]}</h2>
                  <p className="text-sm text-gray-500">{data.product_name}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-lg font-black text-gray-900">€{Number(data.amount_eur).toFixed(2).replace(".", ",")}</p>
                  <p className="text-xs text-gray-400">{data.payment_method === "mbway" ? "MB WAY" : "Multibanco"}</p>
                </div>
              </div>
              <div className="text-xs text-gray-400">
                Encomenda feita a {formatDate(data.created_at)}
              </div>
            </div>

            {/* Waiting payment */}
            {data.payment_status === "waiting_payment" && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
                <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-yellow-800 font-semibold text-sm">A aguardar pagamento</p>
                  <p className="text-yellow-700 text-xs mt-0.5">Assim que o pagamento for confirmado, a tua encomenda entra em preparação.</p>
                </div>
              </div>
            )}

            {/* Tracking timeline */}
            {data.payment_status === "paid" && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-5">Estado da encomenda</p>
                <div className="relative">
                  {/* Vertical line */}
                  <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gray-200" />

                  <div className="space-y-0">
                    {STATUS_STEPS.map((step, idx) => {
                      const isCompleted = idx < currentIdx;
                      const isCurrent = idx === currentIdx;
                      const isFuture = idx > currentIdx;
                      const Icon = step.icon;

                      return (
                        <div key={step.key} className="flex items-start gap-4 relative pb-6 last:pb-0">
                          {/* Icon circle */}
                          <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isCompleted ? "bg-green-500" :
                            isCurrent ? "bg-[#6b0f1a]" :
                            "bg-gray-200"
                          }`}>
                            {isCompleted ? (
                              <CheckCircle2 className="w-4 h-4 text-white" />
                            ) : (
                              <Icon className={`w-4 h-4 ${isCurrent ? "text-white" : "text-gray-400"}`} />
                            )}
                          </div>

                          {/* Label */}
                          <div className="pt-1">
                            <p className={`text-sm font-semibold ${
                              isCompleted ? "text-green-700" :
                              isCurrent ? "text-[#6b0f1a]" :
                              "text-gray-400"
                            }`}>
                              {step.label}
                            </p>
                            {isCurrent && (
                              <span className="inline-block mt-1 text-xs bg-[#6b0f1a]/10 text-[#6b0f1a] font-semibold px-2 py-0.5 rounded-full">
                                Estado atual
                              </span>
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

        {/* Empty state */}
        {!data && !loading && !error && !codigoFromUrl && (
          <div className="text-center py-12 text-gray-400">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Introduz o código de rastreio<br/>que recebeste no email de confirmação.</p>
          </div>
        )}
      </div>
    </div>
  );
}
