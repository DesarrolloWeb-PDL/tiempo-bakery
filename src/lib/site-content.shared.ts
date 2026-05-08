export interface SiteContent {
  navProductsLabel: string
  navAboutLabel: string
  navContactLabel: string
  footerDescription: string
  footerScheduleTitle: string
  footerScheduleText: string
  footerDeliveryText: string
  footerContactTitle: string
  footerLegalNote: string
  contactEmail: string
  contactPhone: string
  contactWhatsapp: string
  contactAddress: string
  aboutTitle: string
  aboutBody: string
  aboutSecondaryBody: string
  contactTitle: string
  contactIntro: string
  deliveryPickupText: string
  deliveryLocalText: string
  deliveryCourierText: string
}

export const DEFAULT_SITE_CONTENT: SiteContent = {
  navProductsLabel: 'Productos',
  navAboutLabel: 'Sobre Nosotros',
  navContactLabel: 'Contacto',
  footerDescription:
    'Micropanadería artesanal por encargo semanal. Horneamos en tandas pequeñas para priorizar fermentación, sabor y producto real.',
  footerScheduleTitle: 'Horario de Pedidos',
  footerScheduleText: 'La carta abre los miércoles a las 18:00 y cierra el domingo a las 20:00.',
  footerDeliveryText: 'Recogida en punto, reparto local y mensajería urgente el día del horneado.',
  footerContactTitle: 'Contacto',
  footerLegalNote: 'Obrador artesanal. Producción limitada y trabajo bajo pedido para priorizar calidad sobre cantidad.',
  contactEmail: 'contacto@tiempobakery.com',
  contactPhone: '+34 600 000 000',
  contactWhatsapp: '+34 600 000 000',
  contactAddress: 'Obrador: Calle Ejemplo 123, Utrera',
  aboutTitle: 'Sobre Nosotros',
  aboutBody:
    'Somos una micropanadería artesanal y trabajamos bajo pedido. Fermentamos con tiempo, horneamos en tandas pequeñas y priorizamos calidad antes que cantidad. Cada semana abrimos una ventana breve de preventa para producir solo lo necesario y entregar pan fresco, real y sin apuro.',
  aboutSecondaryBody:
    'Nuestra producción es limitada por diseño. Eso nos permite cuidar masas, tiempos y hornadas, asumir variaciones naturales del pan real y sostener una relación más directa con cada pedido y cada punto de entrega.',
  contactTitle: 'Contacto',
  contactIntro:
    'Escribinos para encargos, dudas sobre recogida, reparto o mensajería. Si necesitás seguimiento de tu pedido, te respondemos por email o WhatsApp.',
  deliveryPickupText:
    'Al hacer tu pedido podés elegir el punto de recogida que más te convenga. Horneamos nosotros, vos decidís dónde retirar.',
  deliveryLocalText:
    'El reparto local se ofrece únicamente dentro del casco urbano y se coordina el mismo día del horneado.',
  deliveryCourierText:
    'También podés optar por mensajería urgente. El pedido sale el mismo día del horneado programado.',
}

export const SITE_CONTENT_KEYS = Object.keys(DEFAULT_SITE_CONTENT) as Array<keyof SiteContent>