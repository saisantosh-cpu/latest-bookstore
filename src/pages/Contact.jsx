import React, { useState } from 'react';
import { Phone, Mail, MapPin, Clock, MapPinned, Send } from 'lucide-react';
import { businessInfo, isStoreOpenNow } from '../data/businessInfo';
import { sendContactMessage, isContactFormConfigured } from '../services/email';
import { useToast } from '../context/ToastContext';

const MAX_MESSAGE_LENGTH = 1000;

const Contact = () => {
  const toast = useToast();
  const [form, setForm] = useState({ name: '', email: '', phone: '', orderId: '', subject: '', message: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const storeOpen = isStoreOpenNow();
  const mapsConfigured = Boolean(businessInfo.googleMapsUrl);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = 'Enter a valid email address.';
    if (form.phone.trim() && form.phone.replace(/\D/g, '').length < 10) errs.phone = 'Enter a valid phone number.';
    if (!form.message.trim()) errs.message = 'Message is required.';
    if (form.message.length > MAX_MESSAGE_LENGTH) errs.message = 'Message must be under ' + MAX_MESSAGE_LENGTH + ' characters.';
    return errs;
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: null });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    try {
      await sendContactMessage({
        name: form.name,
        email: form.email,
        phone: form.phone,
        orderId: form.orderId,
        subject: form.subject || 'Contact form message',
        message: form.message,
      });
      setSubmitted(true);
    } catch (err) {
      if (err.message === 'not_configured') {
        toast?.show("This form isn't fully set up yet -- please reach us by phone or email in the meantime.", 'info', 8000);
      } else {
        toast?.show('Could not send your message. Please try again or contact us by phone.', 'error');
      }
    }
    setSubmitting(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <div className="text-center mb-12">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1C1A18] dark:text-[#F5F3EF]">Contact Us</h1>
        <p className="text-[#877F74] dark:text-[#8E887E] mt-2">We're here to help.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        <div className="lg:col-span-3">
          {submitted ? (
            <div className="bg-white dark:bg-[#1A1A20] border border-[#EDE4D8] dark:border-[#2A2A33] rounded-sm p-8 text-center">
              <p className="font-serif text-lg font-semibold text-[#1C1A18] dark:text-[#F5F3EF]">
                Your message has been sent. We'll get back to you soon.
              </p>
              <button
                onClick={() => { setSubmitted(false); setForm({ name: '', email: '', phone: '', orderId: '', subject: '', message: '' }); }}
                className="mt-5 text-sm font-semibold text-[#C85A32] dark:text-[#E06F45] hover:underline"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white dark:bg-[#1A1A20] border border-[#EDE4D8] dark:border-[#2A2A33] rounded-sm p-6 sm:p-8 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase font-bold tracking-wider text-[#877F74] mb-1.5">Name *</label>
                  <input name="name" value={form.name} onChange={handleChange} maxLength={100}
                    className="w-full p-2.5 rounded border border-[#DCD0BF] dark:border-[#363644] bg-[#FAF6EE] dark:bg-[#121215] text-[#1C1A18] dark:text-[#F5F3EF] text-sm focus:outline-none focus:border-[#C85A32]" />
                  {errors.name && <p className="text-[11px] text-red-500 mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-xs uppercase font-bold tracking-wider text-[#877F74] mb-1.5">Email *</label>
                  <input name="email" type="email" value={form.email} onChange={handleChange} maxLength={100}
                    className="w-full p-2.5 rounded border border-[#DCD0BF] dark:border-[#363644] bg-[#FAF6EE] dark:bg-[#121215] text-[#1C1A18] dark:text-[#F5F3EF] text-sm focus:outline-none focus:border-[#C85A32]" />
                  {errors.email && <p className="text-[11px] text-red-500 mt-1">{errors.email}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase font-bold tracking-wider text-[#877F74] mb-1.5">Phone (optional)</label>
                  <input name="phone" type="tel" value={form.phone} onChange={handleChange} maxLength={20}
                    className="w-full p-2.5 rounded border border-[#DCD0BF] dark:border-[#363644] bg-[#FAF6EE] dark:bg-[#121215] text-[#1C1A18] dark:text-[#F5F3EF] text-sm focus:outline-none focus:border-[#C85A32]" />
                  {errors.phone && <p className="text-[11px] text-red-500 mt-1">{errors.phone}</p>}
                </div>
                <div>
                  <label className="block text-xs uppercase font-bold tracking-wider text-[#877F74] mb-1.5">Order ID (optional)</label>
                  <input name="orderId" value={form.orderId} onChange={handleChange} maxLength={20} placeholder="NB-123456"
                    className="w-full p-2.5 rounded border border-[#DCD0BF] dark:border-[#363644] bg-[#FAF6EE] dark:bg-[#121215] text-[#1C1A18] dark:text-[#F5F3EF] text-sm focus:outline-none focus:border-[#C85A32]" />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase font-bold tracking-wider text-[#877F74] mb-1.5">Subject</label>
                <input name="subject" value={form.subject} onChange={handleChange} maxLength={150}
                  className="w-full p-2.5 rounded border border-[#DCD0BF] dark:border-[#363644] bg-[#FAF6EE] dark:bg-[#121215] text-[#1C1A18] dark:text-[#F5F3EF] text-sm focus:outline-none focus:border-[#C85A32]" />
              </div>

              <div>
                <label className="block text-xs uppercase font-bold tracking-wider text-[#877F74] mb-1.5">Message *</label>
                <textarea name="message" value={form.message} onChange={handleChange} maxLength={MAX_MESSAGE_LENGTH} rows={5}
                  className="w-full p-2.5 rounded border border-[#DCD0BF] dark:border-[#363644] bg-[#FAF6EE] dark:bg-[#121215] text-[#1C1A18] dark:text-[#F5F3EF] text-sm focus:outline-none focus:border-[#C85A32] resize-none" />
                <div className="flex justify-between mt-1">
                  {errors.message ? <p className="text-[11px] text-red-500">{errors.message}</p> : <span />}
                  <span className="text-[11px] text-[#877F74]">{form.message.length}/{MAX_MESSAGE_LENGTH}</span>
                </div>
              </div>

              <button type="submit" disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#1C1A18] hover:bg-[#2E2A27] disabled:opacity-60 dark:bg-[#F5F3EF] dark:hover:bg-white text-[#FAF6EE] dark:text-[#1C1A18] text-sm font-semibold rounded transition-colors">
                <Send size={15} /> {submitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-[#1A1A20] border border-[#EDE4D8] dark:border-[#2A2A33] rounded-sm p-6">
            <h2 className="font-serif text-lg font-semibold text-[#1C1A18] dark:text-[#F5F3EF] mb-4">Contact Information</h2>

            <div className="space-y-4 text-sm">
              <div className="flex gap-3">
                <Phone size={17} className="text-[#C85A32] dark:text-[#E06F45] shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-[#877F74] tracking-wider">Phone</p>
                  <a href={'tel:' + businessInfo.phone1.replace(/\s/g, '')} className="block text-[#1C1A18] dark:text-[#F5F3EF] hover:text-[#C85A32] dark:hover:text-[#E06F45]">
                    Phone 1: {businessInfo.phone1}
                  </a>
                  <a href={'tel:' + businessInfo.phone2.replace(/\s/g, '')} className="block text-[#1C1A18] dark:text-[#F5F3EF] hover:text-[#C85A32] dark:hover:text-[#E06F45]">
                    Phone 2: {businessInfo.phone2}
                  </a>
                </div>
              </div>

              <div className="flex gap-3">
                <Mail size={17} className="text-[#C85A32] dark:text-[#E06F45] shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-[#877F74] tracking-wider">Email</p>
                  <a href={'mailto:' + businessInfo.email} className="text-[#1C1A18] dark:text-[#F5F3EF] hover:text-[#C85A32] dark:hover:text-[#E06F45] break-all">
                    {businessInfo.email}
                  </a>
                </div>
              </div>

              <div className="flex gap-3">
                <MapPin size={17} className="text-[#C85A32] dark:text-[#E06F45] shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-[#877F74] tracking-wider">Address</p>
                  <p className="text-[#1C1A18] dark:text-[#F5F3EF]">{businessInfo.address.line1}</p>
                  {businessInfo.address.line2 && <p className="text-[#1C1A18] dark:text-[#F5F3EF]">{businessInfo.address.line2}</p>}
                </div>
              </div>
            </div>

            {mapsConfigured ? (
              <a href={businessInfo.googleMapsUrl} target="_blank" rel="noopener noreferrer"
                className="mt-5 flex items-center justify-center gap-2 w-full py-2.5 border border-[#C85A32] text-[#C85A32] dark:text-[#E06F45] dark:border-[#E06F45] hover:bg-[#C85A32] hover:text-white dark:hover:bg-[#E06F45] dark:hover:text-[#1C1A18] rounded text-sm font-semibold transition-colors">
                <MapPinned size={15} /> View on Google Maps
              </a>
            ) : (
              <p className="mt-5 text-[11px] text-[#877F74] italic">Google Maps link not configured yet.</p>
            )}
          </div>

          <div className="bg-white dark:bg-[#1A1A20] border border-[#EDE4D8] dark:border-[#2A2A33] rounded-sm p-6">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={17} className="text-[#C85A32] dark:text-[#E06F45]" />
              <h2 className="font-serif text-lg font-semibold text-[#1C1A18] dark:text-[#F5F3EF]">Opening Hours</h2>
            </div>
            <p className="text-sm font-semibold text-[#1C1A18] dark:text-[#F5F3EF]">{businessInfo.openingHours.daysText}</p>
            <p className="text-sm text-[#575047] dark:text-[#CBC4B8]">{businessInfo.openingHours.displayText}</p>
            <span className={'inline-flex items-center gap-1.5 mt-3 text-xs font-bold px-2.5 py-1 rounded-full ' + (storeOpen ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400')}>
              <span className={'w-1.5 h-1.5 rounded-full ' + (storeOpen ? 'bg-green-500' : 'bg-gray-400')} />
              {storeOpen ? 'Open Now' : 'Closed'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
