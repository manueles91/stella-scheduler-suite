import { BookingCard } from "./BookingCard";

export const BookingCardDemo = () => {
  const demoAppointments = [
    {
      id: "1",
      serviceName: "Paquete relajante",
      appointmentDate: "2025-08-24",
      startTime: "14:00",
      endTime: "19:00",
      status: "confirmed",
      priceCents: 54400,
      categoryName: "Combo",
      clientName: "Cliente 1",
      employeeName: "Empleado 1",
      isCombo: true,
      comboName: "Paquete relajante",
      variant: "upcoming" as const
    },
    {
      id: "2",
      serviceName: "Bioplastia",
      appointmentDate: "2025-08-17",
      startTime: "14:30",
      status: "confirmed",
      priceCents: 8000,
      categoryName: "Cabello",
      clientName: "Cliente5 gutierrez",
      employeeName: "Admin dos",
      variant: "past" as const
    },
    {
      id: "3",
      serviceName: "Alisado Orgánico",
      appointmentDate: "2025-08-17",
      startTime: "14:00",
      status: "confirmed",
      priceCents: 12000,
      categoryName: "Cabello",
      clientName: "Cliente no especificado",
      employeeName: "Manuel Barrantes",
      variant: "past" as const
    }
  ];

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">BookingCard Demo</h1>
      
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Próximas Citas (Upcoming)</h2>
        {demoAppointments.filter(a => a.variant === 'upcoming').map(appointment => (
          <BookingCard
            key={appointment.id}
            {...appointment}
            canEdit={true}
            onUpdate={() => console.log('Updated')}
          />
        ))}
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Últimas Citas (Past)</h2>
        {demoAppointments.filter(a => a.variant === 'past').map(appointment => (
          <BookingCard
            key={appointment.id}
            {...appointment}
            canEdit={true}
            onUpdate={() => console.log('Updated')}
          />
        ))}
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Ingresos Recientes (Revenue)</h2>
        {demoAppointments.map(appointment => (
          <BookingCard
            key={`revenue-${appointment.id}`}
            {...appointment}
            variant="revenue"
            canEdit={false}
          />
        ))}
      </div>
    </div>
  );
};
