// ============================================================================
// BUSINESS CONTACT INFORMATION — REPLACE THESE PLACEHOLDER VALUES
// ============================================================================
// The values below are NOT real — they are placeholders. Before deploying,
// the store owner must replace every "REPLACE_ME" value with the real
// business details. Nothing here was invented as if it were real data —
// these are intentionally obvious placeholders so they can't be mistaken
// for genuine contact info.
// ============================================================================

export const businessInfo = {
  storeName: 'S LV BOOK CENTER',

  // Year the shop was established — shown in the header, footer and invoices.
  establishedYear: 1997,
  establishedText: 'Established in 1997',

  // Two contact numbers, each shown separately and made tap-to-call.
  phone1: 'REPLACE_ME_PHONE_1', // e.g. '+91 98765 43210'
  phone2: 'REPLACE_ME_PHONE_2', // e.g. '+91 91234 56789'

  email: 'REPLACE_ME_EMAIL', // e.g. 'hello@yourbookstore.com'

  address: {
    line1: 'REPLACE_ME_ADDRESS_LINE_1',
    line2: 'REPLACE_ME_ADDRESS_LINE_2', // city, state, PIN — or leave '' if not needed
  },

  // Get this from Google Maps: search your shop -> Share -> Copy link.
  googleMapsUrl: '', // e.g. 'https://maps.app.goo.gl/xxxxxxxx' — leave '' until set

  // Fixed, real hours as given — same every day.
  openingHours: {
    open: { hour: 9, minute: 30 },
    close: { hour: 22, minute: 0 },
    displayText: '9:30 AM – 10:00 PM',
    daysText: 'Open 7 Days a Week',
  },
};

/** Returns true if the current local time falls within opening hours. */
export const isStoreOpenNow = () => {
  const now = new Date();
  const minutesNow = now.getHours() * 60 + now.getMinutes();
  const openMinutes = businessInfo.openingHours.open.hour * 60 + businessInfo.openingHours.open.minute;
  const closeMinutes = businessInfo.openingHours.close.hour * 60 + businessInfo.openingHours.close.minute;
  return minutesNow >= openMinutes && minutesNow < closeMinutes;
};
