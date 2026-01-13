import { Call, Student, Lead } from "@/lib/types";

const generateIcsFile = (
  id: string,
  date: Date,
  title: string,
  description: string,
  filename: string
) => {
  // Formatear fecha para ICS (UTC)
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const startDate = new Date(date);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hora duración

  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//AI Consultancy//Student Tracking//EN
BEGIN:VEVENT
UID:${id}
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
SUMMARY:${title}
DESCRIPTION:${description}
LOCATION:Videollamada / Teléfono
END:VEVENT
END:VCALENDAR`;

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${filename}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const downloadCallIcs = (call: Call, student: Student) => {
  generateIcsFile(
    call.id,
    call.date,
    `Llamada con ${student.firstName} ${student.lastName}`,
    `Consultoría AI - ${student.occupation}. ${call.notes || ''}`,
    `llamada_${student.firstName}_${student.lastName}`
  );
};

export const downloadLeadCallIcs = (lead: Lead) => {
  if (!lead.nextCallDate) return;

  generateIcsFile(
    lead.id, // Usamos ID del lead como ID del evento ya que es 1 a 1 por ahora
    lead.nextCallDate,
    `Llamada con Lead: ${lead.name}`,
    `Seguimiento de prospecto. Interés: ${lead.interestLevel}. Notas: ${lead.notes || ''}`,
    `lead_${lead.name.replace(/\s+/g, '_')}`
  );
};