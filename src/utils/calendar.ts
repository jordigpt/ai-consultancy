import { Call, Student } from "@/lib/types";

export const downloadCallIcs = (call: Call, student: Student) => {
  // Formatear fecha para ICS (UTC)
  // El formato requerido es: YYYYMMDDTHHhmmssZ
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const startDate = new Date(call.date);
  // Asumimos 1 hora de duración por defecto para el evento en el calendario
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); 

  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//AI Consultancy//Student Tracking//EN
BEGIN:VEVENT
UID:${call.id}
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
SUMMARY:Llamada con ${student.firstName} ${student.lastName}
DESCRIPTION:Consultoría AI - ${student.occupation}. ${call.notes || ''}
LOCATION:Videollamada
END:VEVENT
END:VCALENDAR`;

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `llamada_${student.firstName}_${student.lastName}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};