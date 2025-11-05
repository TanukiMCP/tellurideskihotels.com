/**
 * Email service for booking confirmations
 * Uses Resend API for transactional emails
 */

const RESEND_API_KEY = import.meta.env.RESEND_API_KEY || '';
const FROM_EMAIL = import.meta.env.FROM_EMAIL || 'bookings@tellurideskihotels.com';
const SITE_URL = import.meta.env.PUBLIC_SITE_URL || 'https://tellurideskihotels.com';

export interface BookingEmailData {
  bookingId: string;
  confirmationNumber: string;
  guestName: string;
  guestEmail: string;
  hotelName: string;
  checkIn: string;
  checkOut: string;
  roomName: string;
  adults: number;
  children?: number;
  totalPrice: number;
  currency: string;
}

/**
 * Send booking confirmation email to guest
 */
export async function sendBookingConfirmation(data: BookingEmailData): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.warn('[Email] RESEND_API_KEY not configured, skipping email');
    return false;
  }

  const checkInDate = new Date(data.checkIn).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const checkOutDate = new Date(data.checkOut).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const nights = Math.ceil(
    (new Date(data.checkOut).getTime() - new Date(data.checkIn).getTime()) / (1000 * 60 * 60 * 24)
  );

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0066CC 0%, #1e40af 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Booking Confirmed!</h1>
              <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px; opacity: 0.9;">Your reservation is all set</p>
            </td>
          </tr>

          <!-- Confirmation Number -->
          <tr>
            <td style="padding: 30px; text-align: center; background-color: #f8f9fa; border-bottom: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Confirmation Number</p>
              <p style="margin: 0; color: #111827; font-size: 32px; font-weight: 700; letter-spacing: 1px;">${data.confirmationNumber}</p>
            </td>
          </tr>

          <!-- Booking Details -->
          <tr>
            <td style="padding: 30px;">
              <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 20px; font-weight: 600;">Booking Details</h2>
              
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 15px 0; border-bottom: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 14px;">Hotel</p>
                    <p style="margin: 0; color: #111827; font-size: 16px; font-weight: 600;">${data.hotelName}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 15px 0; border-bottom: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 14px;">Room</p>
                    <p style="margin: 0; color: #111827; font-size: 16px; font-weight: 600;">${data.roomName}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 15px 0; border-bottom: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 14px;">Check-in</p>
                    <p style="margin: 0; color: #111827; font-size: 16px; font-weight: 600;">${checkInDate}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 15px 0; border-bottom: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 14px;">Check-out</p>
                    <p style="margin: 0; color: #111827; font-size: 16px; font-weight: 600;">${checkOutDate}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 15px 0; border-bottom: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 14px;">Guests</p>
                    <p style="margin: 0; color: #111827; font-size: 16px; font-weight: 600;">${data.adults} Adult${data.adults !== 1 ? 's' : ''}${data.children ? `, ${data.children} Child${data.children !== 1 ? 'ren' : ''}` : ''}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 15px 0; border-bottom: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 14px;">Duration</p>
                    <p style="margin: 0; color: #111827; font-size: 16px; font-weight: 600;">${nights} Night${nights !== 1 ? 's' : ''}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 15px 0;">
                    <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 14px;">Total Amount</p>
                    <p style="margin: 0; color: #0066CC; font-size: 24px; font-weight: 700;">${new Intl.NumberFormat('en-US', { style: 'currency', currency: data.currency }).format(data.totalPrice)}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Important Info -->
          <tr>
            <td style="padding: 30px; background-color: #eff6ff; border-top: 1px solid #e5e7eb;">
              <h3 style="margin: 0 0 15px 0; color: #111827; font-size: 16px; font-weight: 600;">Important Information</h3>
              <ul style="margin: 0; padding-left: 20px; color: #374151; font-size: 14px; line-height: 1.6;">
                <li style="margin-bottom: 8px;">Please bring a valid photo ID and credit card at check-in</li>
                <li style="margin-bottom: 8px;">Check-in time is typically after 3:00 PM</li>
                <li style="margin-bottom: 8px;">Check-out time is typically before 11:00 AM</li>
                <li>Contact the hotel directly for any special requests or modifications</li>
              </ul>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding: 30px; text-align: center;">
              <a href="${SITE_URL}/booking/confirmation/${data.bookingId}" style="display: inline-block; padding: 14px 32px; background-color: #0066CC; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">View Booking Details</a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px; text-align: center; background-color: #f8f9fa; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">Questions? Contact us at <a href="mailto:support@tellurideskihotels.com" style="color: #0066CC; text-decoration: none;">support@tellurideskihotels.com</a></p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">&copy; ${new Date().getFullYear()} Telluride Ski Hotels. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: data.guestEmail,
        subject: `Booking Confirmation - ${data.hotelName} - ${data.confirmationNumber}`,
        html: emailHtml,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Email] Failed to send:', error);
      return false;
    }

    console.log('[Email] Booking confirmation sent to:', data.guestEmail);
    return true;
  } catch (error) {
    console.error('[Email] Error sending confirmation:', error);
    return false;
  }
}

