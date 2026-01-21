import { Call, Student, Lead } from "@/lib/types";
import { format } from "date-fns";

const generateIcsFile = (
  id: string,
  date: Date,
  title: string,
  description: string,
  filename: string,
  attendeeName?: string,
  attendeeEmail?: string
) => {
  // Formatear fecha para ICS (UTC)
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const startDate = new Date(date);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hora duración

  // Construcción del contenido base
  let icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//AI Consultancy//Student Tracking//EN
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
UID:${id}
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
SUMMARY:${title}
DESCRIPTION:${description}
LOCATION:Videollamada / Teléfono
STATUS:CONFIRMED
SEQUENCE:0`;

  // Agregar Invitado (Attendee) si existe email
  // RSVP=TRUE: Pide confirmación
  // ROLE=REQ-PARTICIPANT: Participante requerido
  // PARTSTAT=NEEDS-ACTION: El participante debe actuar (aceptar/rechazar)
  if (attendeeEmail) {
    const cn = attendeeName ? `;CN="${attendeeName}"` : '';
    icsContent += `\nATTENDEE${cn};ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:${attendeeEmail}`;
  }

  icsContent += `\nEND:VEVENT\nEND:VCALENDAR`;

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
    `llamada_${student.firstName}_${student.lastName}`,
    `${student.firstName} ${student.lastName}`,
    student.email // Pasamos el email del estudiante si existe
  );
};

export const downloadLeadCallIcs = (lead: Lead) => {
  if (!lead.nextCallDate) return;

  generateIcsFile(
    lead.id,
    lead.nextCallDate,
    `Discovery: ${lead.name}`,
    `Sesión de Discovery / Consultoría.`,
    `lead_${lead.name.replace(/\s+/g, '_')}`,
    lead.name,
    lead.email // Pasamos el email del lead
  );
};