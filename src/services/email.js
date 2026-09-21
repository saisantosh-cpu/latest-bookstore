import emailjs from '@emailjs/browser';

// EmailJS lets you send real emails straight from the browser — no backend
// server needed, free for up to 200 emails/month. See README.md for setup.
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const CONTACT_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_CONTACT_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

export const isEmailConfigured = Boolean(SERVICE_ID && TEMPLATE_ID && PUBLIC_KEY);
export const isContactFormConfigured = Boolean(SERVICE_ID && CONTACT_TEMPLATE_ID && PUBLIC_KEY);

/**
 * Sends an order confirmation email to the customer.
 * Silently does nothing (and resolves) if EmailJS isn't configured yet —
 * this should never block or break the checkout flow.
 */
export const sendOrderConfirmationEmail = async ({ toEmail, toName, orderId, total, itemsSummary }) => {
  if (!isEmailConfigured) {
    console.warn('[email] EmailJS is not configured — skipping order confirmation email. See README.md.');
    return { skipped: true };
  }

  return emailjs.send(
    SERVICE_ID,
    TEMPLATE_ID,
    {
      to_email: toEmail,
      to_name: toName,
      order_id: orderId,
      order_total: `₹${(total || 0).toLocaleString('en-IN')}`,
      order_items: itemsSummary,
    },
    { publicKey: PUBLIC_KEY }
  );
};

/**
 * Sends a Contact Us form submission to the store's inbox via a SEPARATE
 * EmailJS template from order confirmations (so the two can be routed/
 * formatted differently). Same safe pattern as above: only a public key is
 * ever used client-side, never a secret. Throws if not configured — the
 * Contact page shows a clear message rather than pretending it worked.
 */
export const sendContactMessage = async ({ name, email, phone, orderId, subject, message }) => {
  if (!isContactFormConfigured) {
    throw new Error('not_configured');
  }
  return emailjs.send(
    SERVICE_ID,
    CONTACT_TEMPLATE_ID,
    {
      from_name: name,
      from_email: email,
      from_phone: phone,
      order_id: orderId || '—',
      subject,
      message,
    },
    { publicKey: PUBLIC_KEY }
  );
};
