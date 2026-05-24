import { google } from "googleapis";

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || "primary";
const CLIENT_EMAIL = process.env.GOOGLE_CALENDAR_CLIENT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_CALENDAR_PRIVATE_KEY?.replace(/\\n/g, "\n");

function getCalendar() {
  if (!CLIENT_EMAIL || !PRIVATE_KEY) return null;
  const auth = new google.auth.JWT({
    email: CLIENT_EMAIL,
    key: PRIVATE_KEY,
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });
  return google.calendar({ version: "v3", auth });
}

export async function createBookingCalendarEvent({
  bookingNumber,
  customerName,
  customerEmail,
  customerPhone,
  serviceName,
  address,
  scheduledDate,
  totalPrice,
  squareFootage,
  specialInstructions,
}: {
  bookingNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceName: string;
  address: string;
  scheduledDate: Date;
  totalPrice: string;
  squareFootage: number;
  specialInstructions?: string | null;
}): Promise<string | null> {
  const calendar = getCalendar();
  if (!calendar) {
    console.log("[Calendar] Not configured – skipping event creation");
    return null;
  }

  const start = new Date(scheduledDate);
  const end = new Date(start.getTime() + 3 * 60 * 60 * 1000); // 3-hour window

  const description = [
    `Booking #: ${bookingNumber}`,
    `Service: ${serviceName}`,
    `Area: ${squareFootage} sq ft`,
    `Total: $${parseFloat(totalPrice).toFixed(2)}`,
    ``,
    `Customer: ${customerName}`,
    `Email: ${customerEmail}`,
    `Phone: ${customerPhone}`,
    `Address: ${address}`,
    specialInstructions ? `\nNotes: ${specialInstructions}` : "",
  ]
    .filter((l) => l !== "")
    .join("\n");

  try {
    const response = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      requestBody: {
        summary: `${serviceName} – ${customerName} (${bookingNumber})`,
        description,
        location: address,
        start: { dateTime: start.toISOString(), timeZone: "America/Chicago" },
        end: { dateTime: end.toISOString(), timeZone: "America/Chicago" },
        colorId: "1", // blue
        attendees: [{ email: customerEmail, displayName: customerName }],
        reminders: {
          useDefault: false,
          overrides: [
            { method: "email", minutes: 24 * 60 }, // 1 day before
            { method: "popup", minutes: 60 },      // 1 hour before
          ],
        },
      },
    });
    console.log("[Calendar] Event created:", response.data.id);
    return response.data.id ?? null;
  } catch (err: any) {
    console.error("[Calendar] Failed to create event:", err.message);
    return null;
  }
}
