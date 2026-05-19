import { useEffect, useRef } from "react";
import { useLocation } from "wouter";

const COOUD_URLS: Record<string, string> = {
  basico:      "https://checkout.cooud.com/embed/01KS137170J22EER29WXMDJ5T7",
  iniciante:   "https://checkout.cooud.com/embed/01KS14367WFPP7TQ98HS2ACAC5",
  campeao:     "https://checkout.cooud.com/embed/01KS14A4TGAGPQSBXAMRAKFXHY",
  colecionador:"https://checkout.cooud.com/embed/01KS14E2ENQY9PHF9E446W3FA9",
  dourada:     "https://checkout.cooud.com/embed/01KS14HQMQDCP6KX7NRXYRTMPG",
  estadio:     "https://checkout.cooud.com/embed/01KS14MTF1T7YY2S7QNXE7HMDS",
};

export default function Checkout() {
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const kitId = params.get("kit") ?? "";
  const frameRef = useRef<HTMLIFrameElement>(null);

  const embedUrl = COOUD_URLS[kitId];

  useEffect(() => {
    if (!embedUrl) return;

    function handleMessage(event: MessageEvent) {
      if (event.origin !== "https://checkout.cooud.com") return;
      if (frameRef.current && event.source !== frameRef.current.contentWindow) return;

      const data = event.data ?? {};
      if (data._cooud !== true || data.v !== 1) return;

      if (data.type === "cooud:redirect" && typeof data.url === "string") {
        window.location.replace(data.url);
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [embedUrl]);

  if (!embedUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Kit no encontrado.</p>
          <button
            onClick={() => setLocation("/")}
            className="text-[#7B1C1C] font-semibold underline"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ margin: 0, padding: 0, height: "100vh", overflow: "hidden" }}>
      <iframe
        ref={frameRef}
        id="cooud-checkout-frame"
        src={embedUrl}
        allow="payment; storage-access"
        scrolling="auto"
        style={{ width: "100%", height: "100vh", border: 0, display: "block" }}
      />
    </div>
  );
}
