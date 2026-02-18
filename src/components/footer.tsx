export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Info */}
          <div>
            <h3 className="font-semibold text-amber-900 mb-3">
              🥖 Tiempo Bakery
            </h3>
            <p className="text-sm text-gray-600">
              Panadería artesanal con preventa semanal.
              <br />
              Horneado fresco cada semana.
            </p>
          </div>

          {/* Horarios */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">
              Horario de Pedidos
            </h3>
            <p className="text-sm text-gray-600">
              Miércoles 18:00 - Domingo 20:00
              <br />
              <span className="text-xs text-gray-500">
                Entregas: Viernes y Sábado
              </span>
            </p>
          </div>

          {/* Contacto */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">
              Contacto
            </h3>
            <p className="text-sm text-gray-600">
              Email: contacto@tiempobakery.com
              <br />
              Tel: +34 XXX XXX XXX
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-center text-sm text-gray-500">
            © {new Date().getFullYear()} Tiempo Bakery. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
