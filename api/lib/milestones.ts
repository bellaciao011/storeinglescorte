export interface Milestone {
  day: number;
  status: string;
  label: string;
  desc: string;
  emailSubject: string;
}

export const MILESTONES: Milestone[] = [
  {
    day: 1,
    status: "confirmed",
    label: "Pedido confirmado",
    desc: "Pago aprobado, pedido registrado y correo de confirmación enviado.",
    emailSubject: "¡Tu pedido está confirmado! — Panini FIFA WC26",
  },
  {
    day: 2,
    status: "preparing",
    label: "Preparación logística",
    desc: "Tu producto fue separado y encaminado a procesamiento interno.",
    emailSubject: "Tu pedido está siendo preparado — Panini FIFA WC26",
  },
  {
    day: 4,
    status: "shipped",
    label: "Enviado a transportista",
    desc: "Etiqueta validada y pedido entregado al socio logístico.",
    emailSubject: "¡Tu pedido fue enviado! — Panini FIFA WC26",
  },
  {
    day: 7,
    status: "in_transit",
    label: "Centro logístico internacional",
    desc: "Pedido en tránsito entre centros operacionales por el alto volumen de envíos.",
    emailSubject: "Tu pedido está en camino — Panini FIFA WC26",
  },
  {
    day: 10,
    status: "transport_update",
    label: "Actualización de transporte",
    desc: "Pedido encaminado para distribución regional.",
    emailSubject: "Actualización de tu pedido — Panini FIFA WC26",
  },
  {
    day: 13,
    status: "local_center",
    label: "Entrada en centro local",
    desc: "Pedido recibido en el centro logístico responsable de tu región.",
    emailSubject: "Tu pedido llegó al centro local — Panini FIFA WC26",
  },
  {
    day: 16,
    status: "delivery_prep",
    label: "Preparación de entrega",
    desc: "Separación final y organización de la ruta de distribución.",
    emailSubject: "Tu pedido está casi listo para entregarse — Panini FIFA WC26",
  },
  {
    day: 18,
    status: "out_for_delivery",
    label: "Salió para distribución",
    desc: "Pedido asignado al repartidor responsable.",
    emailSubject: "¡Tu pedido salió para entrega! — Panini FIFA WC26",
  },
  {
    day: 20,
    status: "delivery_expected",
    label: "Entrega prevista",
    desc: "Tu pedido está en la fase final de entrega.",
    emailSubject: "Tu pedido está en fase final de entrega — Panini FIFA WC26",
  },
];

export function getMilestoneForDay(daysSincePaid: number): Milestone | null {
  const passed = MILESTONES.filter((m) => m.day <= daysSincePaid);
  return passed.length > 0 ? passed[passed.length - 1] : null;
}
