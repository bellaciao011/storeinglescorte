import { useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";
import { CheckCircle2, Clock, Package, Truck, Home, Search, AlertCircle } from "lucide-react";

const STATUS_STEPS = [
  { key: "preparing",  label: "Preparando pedido",            icon: Package },
  { key: "shipped",    label: "Enviado para transportadora",  icon: Truck },
  { key: "in_transit", label: "A caminho",                    icon: Truck },
  { key: "delivered",  label: "Entregue",                     icon: Home },
];

const STATUS_INDEX: Record<string, number> = {
  preparing: 0, shipped: 1, in_transit: 2, delivered: 3,
};

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
  const currentIdx = data ? (STATUS_INDEX[data.order_status] ?? 0) : -1;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" });

  const formatAmount = (v: number) =>
    `$${Number(v).toLocaleString("es-MX", { minimumFractionDigits: 0 })} MXN`;

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
              <div className="flex items-center gap-2">
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
            </div>

            {/* Awaiting payment */}
            {!isPaid && data.payment_status !== "refused" && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
                <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-yellow-800 font-semibold text-sm">Esperando confirmación de pago</p>
                  <p className="text-yellow-700 text-xs mt-0.5">Una vez confirmado, tu pedido entra en preparación.</p>
                </div>
              </div>
            )}

            {/* Timeline */}
            {isPaid && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-5">Estado del pedido</p>
                <div className="relative">
                  <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gray-200" />
                  <div className="space-y-0">
                    {STATUS_STEPS.map((step, idx) => {
                      const isCompleted = idx < currentIdx;
                      const isCurrent = idx === currentIdx;
                      const Icon = step.icon;
                      return (
                        <div key={step.key} className="flex items-start gap-4 relative pb-6 last:pb-0">
                          <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isCompleted ? "bg-green-500" : isCurrent ? "bg-[#7B1C1C]" : "bg-gray-200"
                          }`}>
                            {isCompleted
                              ? <CheckCircle2 className="w-4 h-4 text-white" />
                              : <Icon className={`w-4 h-4 ${isCurrent ? "text-white" : "text-gray-400"}`} />
                            }
                          </div>
                          <div className="pt-1">
                            <p className={`text-sm font-semibold ${
                              isCompleted ? "text-green-700" : isCurrent ? "text-[#7B1C1C]" : "text-gray-400"
                            }`}>{step.label}</p>
                            {isCurrent && (
                              <span className="inline-block mt-1 text-xs bg-[#7B1C1C]/10 text-[#7B1C1C] font-semibold px-2 py-0.5 rounded-full">
                                Estado actual
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

        {!data && !loading && !error && !codigoFromUrl && (
          <div className="text-center py-12 text-gray-400">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Ingresa el código de rastreo<br/>que recibiste en tu correo de confirmación.</p>
          </div>
        )}
      </div>
    </div>
  );
}
