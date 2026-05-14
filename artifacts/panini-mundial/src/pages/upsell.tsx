import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Zap, Package, Lock, ChevronRight, Smartphone, Building2, CheckCircle2 } from "lucide-react";

type CustomerData = {
  name: string;
  email: string;
  phone: string;
  mbwayPhone: string;
  address: string;
};

const SHIPPING_OPTIONS = [
  {
    id: "expresso",
    icon: "⚡",
    label: "Expresso",
    desc: "Entrega rápida garantida · Chegará em 1-2 dias úteis",
    price: 10.99,
  },
  {
    id: "postal",
    icon: "📦",
    label: "Encomenda Postal",
    desc: "Via CTT · ~3 dias úteis",
    price: 7.99,
  },
];

export default function Upsell() {
  const [, setLocation] = useLocation();
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [method, setMethod] = useState<"mbway" | "multibanco">("mbway");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

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

  const selectedOption = SHIPPING_OPTIONS.find(o => o.id === selected);

  const handlePay = async () => {
    if (!selectedOption) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/payment/upsell", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: selectedOption.price,
          method,
          shippingOption: selectedOption.label,
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
      setResult({ ...data, method, amount: selectedOption.price });
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
              <p className="text-gray-500 text-sm mb-4">
                Aceita o pedido de <strong>€{result.amount.toFixed(2).replace(".", ",")}</strong> na app <strong>MB WAY</strong>.
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
                  <div className="flex justify-between"><span className="text-gray-500">Valor</span><span className="font-bold text-[#6b0f1a]">€{result.amount.toFixed(2).replace(".", ",")}</span></div>
                </div>
              )}
            </>
          )}
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
    <div className="min-h-screen bg-[#fdf6f0] pb-12">
      {/* Header */}
      <div className="w-full bg-[#6b0f1a] text-white py-3 px-4 flex items-center justify-center mb-6">
        <div className="bg-white rounded-md px-2 py-1">
          <img src="/assets/logo-panini-oficial.png" alt="Panini" className="h-7 w-auto object-contain" />
        </div>
      </div>

      <div className="max-w-md mx-auto px-4">

        {/* Error notice */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border-2 border-red-400 rounded-2xl p-5 mb-5 shadow-sm"
        >
          <div className="flex items-start gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <h2 className="font-black text-red-700 text-base">Erro no Cálculo do Frete</h2>
              <p className="text-sm text-gray-700 mt-1 leading-relaxed">
                Detectámos um erro no cálculo do frete para o endereço{" "}
                <strong className="text-gray-900">
                  {customer?.address ?? "o teu endereço"}
                </strong>
                . Este erro pode causar{" "}
                <strong>atrasos de até 45 dias</strong> no envio do produto.
              </p>
            </div>
          </div>
          <div className="bg-red-50 rounded-xl px-4 py-2.5 border border-red-200">
            <p className="text-sm text-red-700 font-medium">
              🎁 Por causa deste erro, iremos enviar <strong>5 pacotinhos de cromos de brinde</strong> junto com a tua encomenda!
            </p>
          </div>
          <div className="bg-pink-50 border border-pink-200 rounded-xl px-4 py-2.5 mt-2">
            <p className="text-sm text-pink-700 font-semibold">
              📌 Seleciona uma opção de envio abaixo para garantir a entrega no prazo.
            </p>
          </div>
        </motion.div>

        {/* Sticker pack image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="flex flex-col items-center mb-5"
        >
          <img
            src="/assets/pacotes-panini.png"
            alt="5 pacotinhos de brinde"
            className="w-52 h-auto object-contain drop-shadow-md"
          />
          <p className="text-sm font-bold text-green-700 mt-2">
            ✅ +5 pacotinhos de brinde incluídos
          </p>
          <p className="text-xs text-gray-400">Enviados gratuitamente com a tua encomenda</p>
        </motion.div>

        {/* Shipping options */}
        <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">
          Opções de envio disponíveis
        </p>

        <div className="space-y-3 mb-6">
          {SHIPPING_OPTIONS.map((opt, i) => (
            <motion.button
              key={opt.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.08 }}
              onClick={() => setSelected(opt.id)}
              className={`w-full bg-white rounded-2xl border-2 p-4 flex items-center gap-4 text-left transition-all ${
                selected === opt.id
                  ? "border-[#6b0f1a] shadow-sm"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <span className="text-2xl flex-shrink-0">{opt.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-sm">{opt.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-black text-gray-900 text-base">€{opt.price.toFixed(2).replace(".", ",")}</p>
                <p className="text-xs text-[#6b0f1a] font-semibold">selecionar →</p>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Payment form — shown when option selected */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
                <p className="text-sm font-bold text-gray-700 mb-4">Método de pagamento</p>

                {/* Method selector */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setMethod("mbway")}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all ${method === "mbway" ? "bg-[#6b0f1a] text-white border-[#6b0f1a]" : "bg-white text-gray-600 border-gray-300"}`}
                  >
                    📱 MB WAY
                  </button>
                  <button
                    onClick={() => setMethod("multibanco")}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all ${method === "multibanco" ? "bg-[#6b0f1a] text-white border-[#6b0f1a]" : "bg-white text-gray-600 border-gray-300"}`}
                  >
                    🏧 Multibanco
                  </button>
                </div>

                {method === "mbway" && (
                  <div>
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
                  <p className="text-red-600 text-xs mt-3 bg-red-50 rounded-lg px-3 py-2">{error}</p>
                )}

                <button
                  onClick={handlePay}
                  disabled={loading || (method === "mbway" && !phone.trim())}
                  className="w-full mt-4 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-black text-base py-4 rounded-xl flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span className="animate-pulse">A processar...</span>
                  ) : (
                    <>
                      Confirmar envio — €{selectedOption?.price.toFixed(2).replace(".", ",")}
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Skip */}
        <div className="text-center mt-2">
          <button
            onClick={() => setLocation("/")}
            className="text-xs text-gray-400 hover:text-gray-600 underline"
          >
            Não, obrigado — continuar sem upgrade de envio
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6 flex items-center justify-center gap-1.5">
          <Lock className="w-3.5 h-3.5" />
          Pagamento 100% seguro via WayMB
        </p>
      </div>
    </div>
  );
}
