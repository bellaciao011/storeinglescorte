import { useState, useEffect, useCallback } from "react";
import { apiUrl } from "@/lib/api";
import {
  Lock, RefreshCw, CheckCircle2, Package, Truck, Home,
  Mail, LogOut, ChevronDown, ChevronUp, Send, Plus, X
} from "lucide-react";

type Order = {
  id: string;
  tracking_code: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  shipping_address: string | null;
  shipping_city: string | null;
  shipping_postal_code: string | null;
  product_name: string | null;
  amount_eur: number;
  status: string;
  order_status: string;
  confirmation_email_sent_at: string | null;
  paid_at: string | null;
  utm_source: string | null;
  utm_campaign: string | null;
  utm_medium: string | null;
  utm_content: string | null;
  utm_term: string | null;
  created_at: string;
};

const ORDER_STATUSES = [
  { value: "preparing",  label: "Preparando pedido",           icon: Package, color: "bg-yellow-100 text-yellow-800" },
  { value: "shipped",    label: "Enviado a transportadora",    icon: Truck,   color: "bg-blue-100 text-blue-800" },
  { value: "in_transit", label: "En camino",                   icon: Truck,   color: "bg-purple-100 text-purple-800" },
  { value: "delivered",  label: "Entregado",                   icon: Home,    color: "bg-green-100 text-green-800" },
];

function fmtDate(d: string) {
  return new Date(d).toLocaleString("es-MX", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}
function fmtAmount(v: number) {
  return `$${Number(v).toLocaleString("es-MX", { minimumFractionDigits: 0 })} MXN`;
}

export default function Admin() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [savedPw, setSavedPw] = useState("");
  const [authError, setAuthError] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingStatus, setSavingStatus] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  const [emailResult, setEmailResult] = useState<Record<string, "ok" | "err">>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [newOrder, setNewOrder] = useState({
    customer_name: "", customer_email: "", customer_phone: "",
    shipping_address: "", shipping_city: "", product_name: "Kit Básico Panini FIFA World Cup 2026",
    amount_eur: "329",
  });
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"all" | "paid" | "pending">("all");

  const fetchOrders = useCallback(async (pw: string) => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/admin/orders"), { headers: { "x-admin-password": pw } });
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
      const res = await fetch(apiUrl("/api/admin/orders"), { headers: { "x-admin-password": password } });
      if (res.status === 401) { setAuthError(true); return; }
      setOrders(await res.json());
      setSavedPw(password);
      setAuthed(true);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    setSavingStatus(id);
    try {
      await fetch(apiUrl("/api/admin/orders"), {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": savedPw },
        body: JSON.stringify({ id, status }),
      });
      setOrders(prev => prev.map(o => o.id === id ? { ...o, order_status: status } : o));
    } finally {
      setSavingStatus(null);
    }
  };

  const sendEmail = async (id: string) => {
    setSendingEmail(id);
    setEmailResult(prev => { const n = { ...prev }; delete n[id]; return n; });
    try {
      const res = await fetch(apiUrl("/api/admin/orders"), {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-admin-password": savedPw },
        body: JSON.stringify({ id, action: "send_email" }),
      });
      const ok = res.ok;
      setEmailResult(prev => ({ ...prev, [id]: ok ? "ok" : "err" }));
      if (ok) {
        setOrders(prev => prev.map(o =>
          o.id === id ? { ...o, confirmation_email_sent_at: new Date().toISOString() } : o
        ));
      }
    } catch {
      setEmailResult(prev => ({ ...prev, [id]: "err" }));
    } finally {
      setSendingEmail(null);
    }
  };

  const createManualOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingOrder(true);
    try {
      const res = await fetch(apiUrl("/api/admin/orders"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-password": savedPw },
        body: JSON.stringify({
          ...newOrder,
          amount_eur: Number(newOrder.amount_eur),
          status: "paid",
        }),
      });
      if (res.ok) {
        setShowNewOrder(false);
        setNewOrder({
          customer_name: "", customer_email: "", customer_phone: "",
          shipping_address: "", shipping_city: "",
          product_name: "Kit Básico Panini FIFA World Cup 2026", amount_eur: "329",
        });
        await fetchOrders(savedPw);
      }
    } finally {
      setCreatingOrder(false);
    }
  };

  useEffect(() => {
    if (!authed) return;
    const t = setInterval(() => fetchOrders(savedPw), 30000);
    return () => clearInterval(t);
  }, [authed, savedPw, fetchOrders]);

  const filtered = orders.filter(o =>
    filterStatus === "all" ? true :
    filterStatus === "paid" ? o.status === "paid" :
    o.status !== "paid"
  );

  const totalPaid = orders.filter(o => o.status === "paid").length;
  const totalRevenue = orders.filter(o => o.status === "paid").reduce((s, o) => s + Number(o.amount_eur), 0);
  const pendingCount = orders.filter(o => o.status !== "paid" && o.status !== "refused").length;

  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-sm">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-[#7B1C1C]/10 mx-auto mb-5">
            <Lock className="w-7 h-7 text-[#7B1C1C]" />
          </div>
          <h1 className="text-xl font-black text-gray-900 text-center mb-1">Panel Admin</h1>
          <p className="text-gray-500 text-sm text-center mb-6">Panini FIFA WC26</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Contraseña de acceso"
              className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B1C1C]/30 ${authError ? "border-red-400 bg-red-50" : "border-gray-300"}`}
              autoFocus
            />
            {authError && <p className="text-red-600 text-xs">Contraseña incorrecta.</p>}
            <button type="submit" disabled={loading}
              className="w-full bg-[#7B1C1C] hover:bg-[#5a0c16] text-white font-semibold py-3 rounded-xl text-sm disabled:opacity-60">
              {loading ? "Verificando..." : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#7B1C1C] text-white px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="font-black text-lg">Panel Admin</h1>
          <p className="text-white/60 text-xs">Panini FIFA WC26</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowNewOrder(true)}
            className="bg-[#F5C518] hover:bg-yellow-400 text-[#7B1C1C] font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Nuevo pedido
          </button>
          <button onClick={() => fetchOrders(savedPw)}
            className="bg-white/10 hover:bg-white/20 p-2 rounded-lg">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button onClick={() => { setAuthed(false); setSavedPw(""); setOrders([]); }}
            className="bg-white/10 hover:bg-white/20 p-2 rounded-lg">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-black text-gray-900">{orders.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Total</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-black text-green-600">{totalPaid}</p>
            <p className="text-xs text-gray-500 mt-0.5">Pagados</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-lg font-black text-[#7B1C1C]">{fmtAmount(totalRevenue)}</p>
            <p className="text-xs text-gray-500 mt-0.5">Ingresos</p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-4">
          {(["all", "paid", "pending"] as const).map(f => (
            <button key={f} onClick={() => setFilterStatus(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                filterStatus === f
                  ? "bg-[#7B1C1C] text-white border-[#7B1C1C]"
                  : "bg-white text-gray-600 border-gray-300 hover:border-[#7B1C1C]"
              }`}>
              {f === "all" ? `Todos (${orders.length})` : f === "paid" ? `Pagados (${totalPaid})` : `Pendientes (${pendingCount})`}
            </button>
          ))}
        </div>

        {/* Orders */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Ningún pedido.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(order => {
              const isOpen = expanded[order.id] ?? false;
              const emailSent = !!order.confirmation_email_sent_at;
              const rr = emailResult[order.id];
              const isPaid = order.status === "paid";
              const hasAddress = order.shipping_address || order.shipping_city;

              return (
                <div key={order.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="p-4">
                    <div className="flex flex-wrap items-start gap-3">
                      <div className="flex-1 min-w-0">
                        {/* Name + badges */}
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-black text-gray-900 text-sm">{order.customer_name ?? "—"}</span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            isPaid ? "bg-green-100 text-green-700" :
                            order.status === "refused" ? "bg-red-100 text-red-700" :
                            "bg-yellow-100 text-yellow-700"
                          }`}>
                            {isPaid ? "Pagado" : order.status === "refused" ? "Rechazado" : "Pendiente"}
                          </span>
                          {emailSent && (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 flex items-center gap-1">
                              <Mail className="w-3 h-3" /> Email enviado
                            </span>
                          )}
                        </div>

                        {/* Email + phone */}
                        <p className="text-xs text-gray-500 truncate mb-1">
                          {order.customer_email ?? "Sin email"} {order.customer_phone ? `· ${order.customer_phone}` : ""}
                        </p>

                        {/* Address */}
                        {hasAddress && (
                          <p className="text-xs text-gray-400 truncate mb-1">
                            📍 {[order.shipping_address, order.shipping_city, order.shipping_postal_code].filter(Boolean).join(", ")}
                          </p>
                        )}

                        {/* Product + amount */}
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className="text-sm text-gray-700">{order.product_name ?? "—"}</span>
                          <span className="text-sm font-bold text-[#7B1C1C]">{fmtAmount(order.amount_eur)}</span>
                        </div>

                        {/* Tracking + date */}
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          {order.tracking_code ? (
                            <span className="text-xs font-mono font-bold text-[#7B1C1C] bg-[#7B1C1C]/5 px-2 py-0.5 rounded">
                              {order.tracking_code}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Sin código de rastreo</span>
                          )}
                          <span className="text-xs text-gray-400">{fmtDate(order.created_at)}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        {/* Send email */}
                        {order.customer_email && (
                          <button
                            onClick={() => sendEmail(order.id)}
                            disabled={sendingEmail === order.id}
                            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
                              emailSent
                                ? "border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100"
                                : "border-gray-300 bg-white hover:border-[#7B1C1C] hover:text-[#7B1C1C]"
                            }`}
                          >
                            {sendingEmail === order.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                            {emailSent ? "Reenviar email" : "Enviar email"}
                          </button>
                        )}
                        {rr === "ok" && <span className="text-xs text-green-600 font-semibold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Enviado</span>}
                        {rr === "err" && <span className="text-xs text-red-500 font-semibold">Error al enviar</span>}

                        {/* Status selector */}
                        {isPaid && (
                          <select
                            value={order.order_status}
                            onChange={e => updateStatus(order.id, e.target.value)}
                            disabled={savingStatus === order.id}
                            className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#7B1C1C]/30 disabled:opacity-60"
                          >
                            {ORDER_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                          </select>
                        )}

                        {/* UTMs toggle */}
                        <button
                          onClick={() => setExpanded(prev => ({ ...prev, [order.id]: !isOpen }))}
                          className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700"
                        >
                          {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          UTMs
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* UTM details */}
                  {isOpen && (
                    <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
                      <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                        {[
                          ["utm_source", order.utm_source],
                          ["utm_campaign", order.utm_campaign],
                          ["utm_medium", order.utm_medium],
                          ["utm_content", order.utm_content],
                          ["utm_term", order.utm_term],
                        ].map(([k, v]) => v ? (
                          <div key={k as string} className="flex items-center gap-2 min-w-0">
                            <span className="text-xs text-gray-400 flex-shrink-0">{k}:</span>
                            <span className="text-xs font-mono text-gray-700 truncate">{v}</span>
                          </div>
                        ) : null)}
                        {!order.utm_source && !order.utm_campaign && !order.utm_medium && (
                          <span className="text-xs text-gray-400 italic col-span-2">Sin UTMs registrados.</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New order modal */}
      {showNewOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-black text-gray-900">Nuevo pedido manual</h2>
              <button onClick={() => setShowNewOrder(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={createManualOrder} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Nombre completo *</label>
                  <input required value={newOrder.customer_name}
                    onChange={e => setNewOrder(p => ({ ...p, customer_name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B1C1C]/30" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Email *</label>
                  <input required type="email" value={newOrder.customer_email}
                    onChange={e => setNewOrder(p => ({ ...p, customer_email: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B1C1C]/30" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Teléfono</label>
                  <input value={newOrder.customer_phone}
                    onChange={e => setNewOrder(p => ({ ...p, customer_phone: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B1C1C]/30" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Dirección de envío</label>
                  <input value={newOrder.shipping_address}
                    onChange={e => setNewOrder(p => ({ ...p, shipping_address: e.target.value }))}
                    placeholder="Calle, número, colonia"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B1C1C]/30" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Ciudad</label>
                  <input value={newOrder.shipping_city}
                    onChange={e => setNewOrder(p => ({ ...p, shipping_city: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B1C1C]/30" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Monto (MXN) *</label>
                  <input required type="number" value={newOrder.amount_eur}
                    onChange={e => setNewOrder(p => ({ ...p, amount_eur: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B1C1C]/30" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Producto *</label>
                  <select value={newOrder.product_name}
                    onChange={e => setNewOrder(p => ({ ...p, product_name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B1C1C]/30">
                    <option value="Kit Básico Panini FIFA World Cup 2026">Kit Básico — $329 MXN</option>
                    <option value="Kit Campeón Panini FIFA World Cup 2026">Kit Campeón — $1,199 MXN</option>
                    <option value="Kit Coleccionista Panini FIFA World Cup 2026">Kit Coleccionista — $1,899 MXN</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowNewOrder(false)}
                  className="flex-1 border border-gray-300 rounded-xl py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" disabled={creatingOrder}
                  className="flex-1 bg-[#7B1C1C] hover:bg-[#5a0c16] text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-60">
                  {creatingOrder ? "Creando..." : "Crear pedido"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
