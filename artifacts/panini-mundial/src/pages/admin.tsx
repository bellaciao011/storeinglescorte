import { useState, useEffect, useCallback } from "react";
import { Lock, RefreshCw, CheckCircle2, Package, Truck, Home, Mail, LogOut, ChevronDown, ChevronUp, Send } from "lucide-react";

type Order = {
  id: string;
  tracking_code: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  product_name: string;
  amount_eur: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
  email_sent: boolean;
  created_at: string;
  paid_at: string | null;
  utm_source: string | null;
  utm_campaign: string | null;
  utm_medium: string | null;
  utm_content: string | null;
  utm_term: string | null;
  src: string | null;
  sck: string | null;
};

const ORDER_STATUSES = [
  { value: "preparing",  label: "Preparando pedido",            icon: Package, color: "bg-yellow-100 text-yellow-800" },
  { value: "shipped",    label: "Enviado para transportadora",  icon: Truck,   color: "bg-blue-100 text-blue-800" },
  { value: "in_transit", label: "A caminho",                    icon: Truck,   color: "bg-purple-100 text-purple-800" },
  { value: "delivered",  label: "Entregue",                     icon: Home,    color: "bg-green-100 text-green-800" },
];

const PAYMENT_BADGE: Record<string, string> = {
  waiting_payment: "bg-yellow-100 text-yellow-800",
  paid:            "bg-green-100 text-green-800",
  refused:         "bg-red-100 text-red-800",
};

function formatDate(d: string) {
  return new Date(d).toLocaleString("pt-PT", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function UtmRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className="text-xs text-gray-400 flex-shrink-0">{label}:</span>
      <span className="text-xs font-mono text-gray-700 truncate">{value}</span>
    </div>
  );
}

export default function Admin() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [resending, setResending] = useState<string | null>(null);
  const [resendResult, setResendResult] = useState<Record<string, "ok" | "err">>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [savedPw, setSavedPw] = useState("");

  const fetchOrders = useCallback(async (pw: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/orders", { headers: { "x-admin-password": pw } });
      if (res.status === 401) { setAuthed(false); return; }
      if (!res.ok) return;
      setOrders(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(false);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/orders", { headers: { "x-admin-password": password } });
      if (res.status === 401) { setAuthError(true); return; }
      setOrders(await res.json());
      setSavedPw(password);
      setAuthed(true);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    setSaving(id);
    try {
      await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": savedPw },
        body: JSON.stringify({ id, status }),
      });
      setOrders(prev => prev.map(o => o.id === id ? { ...o, order_status: status } : o));
    } finally {
      setSaving(null);
    }
  };

  const resendUtmify = async (id: string) => {
    setResending(id);
    setResendResult(prev => { const n = { ...prev }; delete n[id]; return n; });
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-admin-password": savedPw },
        body: JSON.stringify({ id, action: "resend_utmify" }),
      });
      setResendResult(prev => ({ ...prev, [id]: res.ok ? "ok" : "err" }));
    } catch {
      setResendResult(prev => ({ ...prev, [id]: "err" }));
    } finally {
      setResending(null);
    }
  };

  useEffect(() => {
    if (!authed) return;
    const interval = setInterval(() => fetchOrders(savedPw), 30000);
    return () => clearInterval(interval);
  }, [authed, savedPw, fetchOrders]);

  const totalPaid = orders.filter(o => o.payment_status === "paid").length;
  const totalRevenue = orders.filter(o => o.payment_status === "paid").reduce((s, o) => s + Number(o.amount_eur), 0);

  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-sm">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-[#6b0f1a]/10 mx-auto mb-5">
            <Lock className="w-7 h-7 text-[#6b0f1a]" />
          </div>
          <h1 className="text-xl font-black text-gray-900 text-center mb-1">Painel Admin</h1>
          <p className="text-gray-500 text-sm text-center mb-6">Panini FIFA WC26</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Senha de acesso"
              className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#6b0f1a]/30 ${authError ? "border-red-400 bg-red-50" : "border-gray-300"}`}
              autoFocus
            />
            {authError && <p className="text-red-600 text-xs">Senha incorreta.</p>}
            <button type="submit" disabled={loading}
              className="w-full bg-[#6b0f1a] hover:bg-[#5a0c16] text-white font-semibold py-3 rounded-xl text-sm disabled:opacity-60">
              {loading ? "A verificar..." : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#6b0f1a] text-white px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="font-black text-lg">Painel Admin</h1>
          <p className="text-white/60 text-xs">Panini FIFA WC26 · Todos os pedidos</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => fetchOrders(savedPw)} className="bg-white/10 hover:bg-white/20 p-2 rounded-lg">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button onClick={() => { setAuthed(false); setSavedPw(""); setOrders([]); }}
            className="bg-white/10 hover:bg-white/20 p-2 rounded-lg">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-black text-gray-900">{orders.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Total pedidos</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-black text-green-600">{totalPaid}</p>
            <p className="text-xs text-gray-500 mt-0.5">Pagos</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-black text-[#6b0f1a]">€{totalRevenue.toFixed(2).replace(".", ",")}</p>
            <p className="text-xs text-gray-500 mt-0.5">Receita</p>
          </div>
        </div>

        {/* Orders */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Nenhum pedido ainda.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map(order => {
              const isOpen = expanded[order.id] ?? false;
              const hasUtms = order.utm_source || order.utm_campaign || order.utm_medium ||
                              order.utm_content || order.utm_term || order.src || order.sck;
              const rr = resendResult[order.id];
              return (
                <div key={order.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  {/* Main row */}
                  <div className="p-4">
                    <div className="flex flex-wrap items-start gap-4">
                      {/* Left info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-black text-gray-900 text-sm">{order.customer_name}</span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PAYMENT_BADGE[order.payment_status] ?? "bg-gray-100 text-gray-600"}`}>
                            {order.payment_status === "waiting_payment" ? "Aguardando" : order.payment_status === "paid" ? "Pago" : "Recusado"}
                          </span>
                          {order.email_sent && (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 flex items-center gap-1">
                              <Mail className="w-3 h-3" /> Email enviado
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate">{order.customer_email ?? "—"} · {order.customer_phone ?? "—"}</p>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          <span className="text-sm text-gray-700">{order.product_name}</span>
                          <span className="text-sm font-bold text-[#6b0f1a]">€{Number(order.amount_eur).toFixed(2).replace(".", ",")}</span>
                          <span className="text-xs text-gray-400">{order.payment_method === "mbway" ? "MB WAY" : "Multibanco"}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-gray-400 font-mono">{order.tracking_code}</span>
                          <span className="text-xs text-gray-400">{formatDate(order.created_at)}</span>
                        </div>
                      </div>

                      {/* Right actions */}
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        {order.payment_status === "paid" && (
                          <select
                            value={order.order_status}
                            onChange={e => updateStatus(order.id, e.target.value)}
                            disabled={saving === order.id}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#6b0f1a]/30 disabled:opacity-60"
                          >
                            {ORDER_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                          </select>
                        )}
                        {/* Expand UTMs */}
                        <button
                          onClick={() => setExpanded(prev => ({ ...prev, [order.id]: !isOpen }))}
                          className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors"
                        >
                          {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          UTMs {hasUtms ? "" : "(vazios)"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded UTM section */}
                  {isOpen && (
                    <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 grid grid-cols-1 gap-1 min-w-0">
                          {hasUtms ? (
                            <>
                              <UtmRow label="src"          value={order.src} />
                              <UtmRow label="sck"          value={order.sck} />
                              <UtmRow label="utm_source"   value={order.utm_source} />
                              <UtmRow label="utm_campaign" value={order.utm_campaign} />
                              <UtmRow label="utm_medium"   value={order.utm_medium} />
                              <UtmRow label="utm_content"  value={order.utm_content} />
                              <UtmRow label="utm_term"     value={order.utm_term} />
                            </>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Nenhuma UTM registada neste pedido.</span>
                          )}
                        </div>

                        {/* Resend to UTMify */}
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <button
                            onClick={() => resendUtmify(order.id)}
                            disabled={resending === order.id}
                            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-300 hover:border-[#6b0f1a] hover:text-[#6b0f1a] transition-colors disabled:opacity-50 bg-white"
                          >
                            {resending === order.id
                              ? <RefreshCw className="w-3 h-3 animate-spin" />
                              : <Send className="w-3 h-3" />}
                            Reenviar UTMify
                          </button>
                          {rr === "ok" && <span className="text-xs text-green-600 font-semibold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Enviado</span>}
                          {rr === "err" && <span className="text-xs text-red-500 font-semibold">Falhou</span>}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
