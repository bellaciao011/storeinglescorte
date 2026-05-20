export type Kit = {
  id: string;
  name: string;
  contents: string;
  description: string;
  price: number;
  oldPrice: number;
  img: string;
  checkoutUrl: string;
  badge?: {
    text: string;
    colorClass: string;
  };
};

export const kits: Kit[] = [
  {
    id: "basico",
    name: "Kit Básico",
    contents: "Álbum + 10 sobres",
    description: "Tapa dura + inicio de colección (~70 cromos)",
    price: 329,
    oldPrice: 449,
    img: "/assets/kit-basico.png",
    checkoutUrl: "https://checkout.cooud.com/01KS137170J22EER29WXMDJ5T7",
  },
  {
    id: "iniciante",
    name: "Kit Iniciante",
    contents: "Álbum + 30 sobres",
    description: "Tapa dura + 30 sobres sellados (~210 cromos)",
    price: 749,
    oldPrice: 999,
    img: "/assets/kit-iniciante.png",
    checkoutUrl: "https://checkout.cooud.com/01KS14367WFPP7TQ98HS2ACAC5",
  },
  {
    id: "campeao",
    name: "Kit Campeón",
    contents: "Álbum + 60 sobres",
    description: "Tapa dura + 60 sobres sellados (~420 cromos)",
    price: 1199,
    oldPrice: 1799,
    img: "/assets/kit-campeao.png",
    checkoutUrl: "https://checkout.cooud.com/01KS14A4TGAGPQSBXAMRAKFXHY",
    badge: {
      text: "MÁS VENDIDO",
      colorClass: "bg-red-600 text-white",
    },
  },
  {
    id: "colecionador",
    name: "Kit Coleccionista",
    contents: "Álbum + 90 sobres",
    description: "Tapa dura + 90 sobres sellados (~630 cromos)",
    price: 1899,
    oldPrice: 2499,
    img: "/assets/kit-colecionador.png",
    checkoutUrl: "https://checkout.cooud.com/01KS14E2ENQY9PHF9E446W3FA9",
    badge: {
      text: "MEJOR VALOR",
      colorClass: "bg-green-600 text-white",
    },
  },
  {
    id: "dourada",
    name: "Álbum Golden Edition",
    contents: "Álbum dorado + 180 sobres",
    description: "Tapa dura dorada + 180 sobres sellados (~1,260 cromos)",
    price: 4199,
    oldPrice: 4999,
    img: "/assets/kit-capa-dourada.png",
    checkoutUrl: "https://checkout.cooud.com/01KS14HQMQDCP6KX7NRXYRTMPG",
    badge: {
      text: "EXCLUSIVO",
      colorClass: "bg-gradient-to-r from-yellow-500 to-yellow-300 text-black font-bold",
    },
  },
  {
    id: "estadio",
    name: "Kit Estadio — Edición Limitada",
    contents: "Kit Estadio + 250 sobres",
    description: "Edición especial numerada + 250 sobres sellados (~1,750 cromos)",
    price: 5699,
    oldPrice: 6999,
    img: "/assets/kit-estadio.png",
    checkoutUrl: "https://checkout.cooud.com/01KS14MTF1T7YY2S7QNXE7HMDS",
    badge: {
      text: "EDICIÓN LIMITADA",
      colorClass: "bg-gradient-to-r from-amber-700 to-yellow-400 text-white font-bold",
    },
  },
];
