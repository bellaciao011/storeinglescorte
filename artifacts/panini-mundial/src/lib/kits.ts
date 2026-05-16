export type Kit = {
  id: string;
  name: string;
  contents: string;
  description: string;
  price: number;
  oldPrice: number;
  img: string;
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
    price: 149,
    oldPrice: 299,
    img: "/assets/kit-basico.png",
  },
  {
    id: "iniciante",
    name: "Kit Iniciante",
    contents: "Álbum + 1 caja (30 sobres)",
    description: "Tapa dura + 1 caja sellada (~210 cromos)",
    price: 349,
    oldPrice: 799,
    img: "/assets/kit-iniciante.png",
  },
  {
    id: "campeao",
    name: "Kit Campeón",
    contents: "Álbum + 2 cajas (60 sobres)",
    description: "Tapa dura + 2 cajas selladas (~420 cromos)",
    price: 599,
    oldPrice: 1299,
    img: "/assets/kit-campeao.png",
    badge: {
      text: "MÁS VENDIDO",
      colorClass: "bg-red-600 text-white",
    },
  },
  {
    id: "colecionador",
    name: "Kit Coleccionista",
    contents: "Álbum + 3 cajas (90 sobres)",
    description: "Tapa dura + 3 cajas selladas (~630 cromos)",
    price: 899,
    oldPrice: 1799,
    img: "/assets/kit-colecionador.png",
    badge: {
      text: "MEJOR VALOR",
      colorClass: "bg-green-600 text-white",
    },
  },
  {
    id: "dourada",
    name: "Álbum Golden Edition",
    contents: "Álbum Edición Dorada + 6 cajas (180 sobres)",
    description: "Tapa dura dorada + 6 cajas selladas (~1,260 cromos)",
    price: 999,
    oldPrice: 2499,
    img: "/assets/kit-capa-dourada.png",
    badge: {
      text: "EXCLUSIVO",
      colorClass: "bg-gradient-to-r from-yellow-500 to-yellow-300 text-black font-bold",
    },
  },
  {
    id: "estadio",
    name: "Kit Estadio — Edición Limitada",
    contents: "Álbum + 250 sobres en caja estadio",
    description: "Edición especial numerada + 250 sobres sellados (~1,750 cromos)",
    price: 1999,
    oldPrice: 3999,
    img: "/assets/kit-estadio.png",
    badge: {
      text: "EDICIÓN LIMITADA",
      colorClass: "bg-gradient-to-r from-amber-700 to-yellow-400 text-white font-bold",
    },
  },
];
