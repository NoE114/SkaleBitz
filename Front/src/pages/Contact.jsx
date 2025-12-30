import { Mail, MessageSquare, Phone, Sparkles } from 'lucide-react';
import Container from '../components/layout/Container';

export default function Contact() {
  return (
    <div className="min-h-screen bg-[#F6F9FC] text-[#111827]">
      <Container className="flex items-center justify-center py-16">
        <div className="relative w-full max-w-4xl">
        <div className="absolute inset-0 blur-3xl">
          <div className="h-full rounded-3xl bg-linear-to-br from-[#DCEBFF] via-[#E6F7FF] to-[#F4F3FF]" />
        </div>

        <div className="relative rounded-3xl border border-[#E5E7EB] bg-white p-10 shadow-2xl shadow-[#E0E7FF] space-y-6">
          <div className="flex items-center gap-3 text-sm font-semibold text-[#1F6FEB]">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#E6F0FF] text-[#1F6FEB]">
              <Sparkles size={20} />
            </div>
            SkaleBitz · Talk to us
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-[#0F172A]">Contact our team</h1>
            <p className="text-[#4B5563]">
              We’ll help you with onboarding, investor access, or product questions.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 text-sm">
            <div className="rounded-2xl border border-[#E5E7EB] bg-[#F8FAFC] p-4 flex items-center gap-3">
              <Mail className="text-[#1F6FEB]" size={18} />
              <div>
                <p className="font-semibold text-[#0F172A]">Email</p>
                <p className="text-[#4B5563]">support@fintechos.app</p>
              </div>
            </div>
            <div className="rounded-2xl border border-[#E5E7EB] bg-[#F8FAFC] p-4 flex items-center gap-3">
              <Phone className="text-[#1F6FEB]" size={18} />
              <div>
                <p className="font-semibold text-[#0F172A]">Phone</p>
                <p className="text-[#4B5563]">+65 8000 1234</p>
              </div>
            </div>
            <div className="rounded-2xl border border-[#E5E7EB] bg-[#F8FAFC] p-4 flex items-center gap-3">
              <MessageSquare className="text-[#1F6FEB]" size={18} />
              <div>
                <p className="font-semibold text-[#0F172A]">Chat</p>
                <p className="text-[#4B5563]">In-app support</p>
              </div>
            </div>
          </div>
        </div>
        </div>
      </Container>
    </div>
  );
}
