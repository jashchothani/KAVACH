import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2, Building2, User } from 'lucide-react';
import { motion } from 'motion/react';
import { PROJECT_DETAILS } from '../data/projectData';

export const ContactPage: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    subject: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;
    setSubmitted(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8 pb-16"
    >
      {/* Header */}
      <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 text-rose-600 font-semibold text-xs uppercase tracking-wider mb-1">
          <Mail className="w-4 h-4" />
          Get in Touch with the Project Team
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Contact & Support
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Have questions about Kavach XDR-SOAR platform, industrial pilot deployment at Swastik Chemical, or academic inquiries? Send us a message below.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Contact Info Card */}
        <div className="bg-slate-900 text-white rounded-3xl p-8 space-y-8 shadow-xl flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold">Project Headquarters</h3>
              <p className="text-xs text-slate-400 mt-1">Shri Bhagubhai Mafatlal Polytechnic, Vile Parle West, Mumbai, India</p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <Building2 className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-200">Industry Sponsor</p>
                  <p className="text-slate-400">{PROJECT_DETAILS.sponsor}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-200">Project Guide</p>
                  <p className="text-slate-400">Smt. Priti Bokariya (Computer Engineering Dept)</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-200">Academic Email</p>
                  <p className="text-slate-400">kavach.soar.xdr@sbmp.ac.in</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-200">Support Hotline</p>
                  <p className="text-slate-400">+91 (022) 2614 1234</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800 text-[11px] text-slate-500">
            Course Code: {PROJECT_DETAILS.courseCode} • Semester {PROJECT_DETAILS.semester} (2026–2027)
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-xs p-8">
          {submitted ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Message Sent Successfully!</h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Thank you for reaching out to the Kavach development team. We have received your inquiry and will get back to you shortly.
              </p>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setFormData({ name: '', email: '', organization: '', subject: '', message: '' });
                }}
                className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-rose-600 transition-all"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. rahul@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">Organization / Institution</label>
                  <input
                    type="text"
                    placeholder="e.g. Swastik Chemical / SBMP"
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">Subject</label>
                  <input
                    type="text"
                    placeholder="e.g. XDR Sensor deployment inquiry"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Your Message *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe your inquiry or feedback..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-600/25 transition-all"
              >
                <Send className="w-4 h-4" />
                <span>Send Message to Security Team</span>
              </button>
            </form>
          )}
        </div>

      </div>
    </motion.div>
  );
};
