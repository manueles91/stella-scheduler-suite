import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BookingConfirmationRequest {
  customerEmail: string;
  customerName: string;
  serviceName: string;
  appointmentDate: string;
  appointmentTime: string;
  employeeName?: string;
  registrationToken?: string;
  isGuestBooking: boolean;
  notes?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      customerEmail,
      customerName,
      serviceName,
      appointmentDate,
      appointmentTime,
      employeeName,
      registrationToken,
      isGuestBooking,
      notes
    }: BookingConfirmationRequest = await req.json();

    const baseUrl = "https://eygyyswmlsqyvfdbmwfw.supabase.co";
    const registrationUrl = registrationToken 
      ? `${baseUrl}/register?token=${registrationToken}`
      : `${baseUrl}/auth`;

    // Create calendar event
    const eventDate = new Date(`${appointmentDate}T${appointmentTime}`);
    const endDate = new Date(eventDate.getTime() + 60 * 60 * 1000); // 1 hour default
    
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Salon//Appointment//EN
BEGIN:VEVENT
UID:${Date.now()}@salon.com
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART:${eventDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTEND:${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
SUMMARY:Cita - ${serviceName}
DESCRIPTION:Servicio: ${serviceName}${employeeName ? `\\nProfesional: ${employeeName}` : ''}${notes ? `\\nNotas: ${notes}` : ''}
LOCATION:Nuestro Salón
END:VEVENT
END:VCALENDAR`;

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #333; text-align: center;">¡Confirmación de Cita!</h1>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="color: #495057; margin-top: 0;">Detalles de tu Cita</h2>
          <p><strong>Servicio:</strong> ${serviceName}</p>
          <p><strong>Fecha:</strong> ${new Date(appointmentDate).toLocaleDateString('es-ES')}</p>
          <p><strong>Hora:</strong> ${appointmentTime}</p>
          ${employeeName ? `<p><strong>Profesional:</strong> ${employeeName}</p>` : ''}
          ${notes ? `<p><strong>Notas:</strong> ${notes}</p>` : ''}
        </div>

        ${isGuestBooking ? `
        <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1976d2; margin-top: 0;">¡Completa tu Registro!</h3>
          <p>Para gestionar mejor tus citas futuras, te invitamos a completar tu registro:</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${registrationUrl}" 
               style="background-color: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Completar Registro
            </a>
          </div>
          <p style="font-size: 14px; color: #666;">
            Al registrarte podrás ver el historial de tus citas, modificar tu información y recibir recordatorios.
          </p>
        </div>
        ` : ''}

        <div style="margin: 20px 0; text-align: center;">
          <p style="color: #666;">¿Necesitas hacer cambios a tu cita?</p>
          <p style="color: #666;">Contáctanos o visita nuestro salón.</p>
        </div>

        <div style="border-top: 1px solid #ddd; padding-top: 20px; margin-top: 30px; text-align: center; color: #666; font-size: 14px;">
          <p>Gracias por confiar en nosotros.</p>
          <p>¡Te esperamos!</p>
        </div>
      </div>
    `;

    const emailResponse = await resend.emails.send({
      from: "Salón <onboarding@resend.dev>",
      to: [customerEmail],
      subject: "Confirmación de Cita - Tu reserva está confirmada",
      html: emailContent,
      attachments: [
        {
          filename: "cita.ics",
          content: Buffer.from(icsContent).toString('base64'),
        },
      ],
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-booking-confirmation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);