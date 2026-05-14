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
    contents: "1 Álbum + 10 saquetas",
    description: "Capa dura + início de coleção (≈70 cromos)",
    price: 14.99,
    oldPrice: 15.62,
    img: "/assets/kit-basico.png",
  },
  {
    id: "iniciante",
    name: "Kit Iniciante",
    contents: "1 Álbum + 1 Caixa (30 saquetas)",
    description: "Capa dura + 1 caixa selada (210 cromos)",
    price: 29.99,
    oldPrice: 39.90,
    img: "/assets/kit-iniciante.png",
  },
  {
    id: "campeao",
    name: "Kit Campeão",
    contents: "1 Álbum + 2 Caixas (60 saquetas)",
    description: "Capa dura + 2 caixas seladas (420 cromos)",
    price: 39.99,
    oldPrice: 59.90,
    img: "/assets/kit-campeao.png",
    badge: {
      text: "MAIS VENDIDO",
      colorClass: "bg-red-600 text-white",
    },
  },
  {
    id: "colecionador",
    name: "Kit Colecionador",
    contents: "1 Álbum + 3 Caixas (90 saquetas)",
    description: "Capa dura + 3 caixas seladas (630 cromos)",
    price: 59.99,
    oldPrice: 80.00,
    img: "/assets/kit-colecionador.png",
    badge: {
      text: "MELHOR VALOR",
      colorClass: "bg-green-600 text-white",
    },
  },
  {
    id: "dourada",
    name: "Kit Álbum Capa Dourada",
    contents: "1 Álbum Capa Dourada + 6 Caixas (180 saquetas)",
    description: "Capa dura dourada + 6 caixas seladas (1260 cromos)",
    price: 99.99,
    oldPrice: 119.00,
    img: "/assets/kit-capa-dourada.png",
    badge: {
      text: "EXCLUSIVO",
      colorClass: "bg-gradient-to-r from-yellow-500 to-yellow-300 text-black font-bold",
    },
  },
  {
    id: "estadio",
    name: "Kit Exclusivo Estádio Capa Dura",
    contents: "1 Álbum Capa Dura + 250 saquetas",
    description: "Capa dura edição especial + 250 saquetas seladas (1.750 cromos) · Edição limitada numerada",
    price: 129.99,
    oldPrice: 159.00,
    img: "/assets/kit-estadio.png",
    badge: {
      text: "EDIÇÃO LIMITADA",
      colorClass: "bg-gradient-to-r from-amber-700 to-yellow-400 text-white font-bold",
    },
  },
];
