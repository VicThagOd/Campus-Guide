import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { RiQuestionAnswerLine, RiSendPlane2Line } from 'react-icons/ri';
import { PiCheckCircleFill } from 'react-icons/pi';
import { TbLoader2, TbRefresh, TbChevronDown, TbChevronUp } from 'react-icons/tb';
import { SiWhatsapp } from 'react-icons/si';
import { SEO } from './SEO';
import { PublicShell } from './PublicShell';
import { whatsappLink, whatsappMessages } from '../../lib/whatsapp';

const PRIMARY = '#2F4EA2';
const INK = '#111827';
const MUTED = '#6B7280';
const BORDER = '#BFC3C6';

const CATEGORIES = [
  'Admission',
  'JAMB',
  'Post-UTME',
  'Clearance & Freshers',
  'Accommodation',
  'Face of Campus Guide',
  'Fees & Payments',
  'Other',
];

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const FAQ_LIST: FAQItem[] = [
  {
    id: 'post-utme-format',
    question: 'How is the UNIPORT Post-UTME structured and conducted?',
    answer:
      'UNIPORT Post-UTME is conducted as a Computer-Based Test (CBT). The exam typically consists of 50 multiple-choice questions to be answered in 30 minutes, covering English Language, General Paper, and subjects related to your course choice.',
  },
  {
    id: 'cbt-practice-access',
    question: 'How can I practice with Campus Guide UNIPORT CBT tests?',
    answer:
      'You can practice with official UNIPORT past questions directly in the Post-UTME section on Campus Guide. We provide free trials, timed CBT mock sessions with real-time scoring, instant explanations, and downloadable PDF past questions.',
  },
  {
    id: 'physical-clearance-docs',
    question: 'What documents are required for UNIPORT physical clearance?',
    answer:
      "Admitted freshers need their original JAMB Admission Letter, O'Level result(s) printout, Birth Certificate or Age Declaration, Local Government Area (LGA) Identification Letter, UNIPORT Acceptance Fee receipt, and recent passport photographs.",
  },
  {
    id: 'off-campus-inspection',
    question: 'Can Campus Guide help me find and inspect off-campus accommodation?',
    answer:
      'Yes. Campus Guide features verified off-campus student apartments, self-cons, and flatshares around Choba, Alakahia, and Delta park areas. You can view listings and book in-person verified inspections before making rent commitments.',
  },
  {
    id: 'focg-pageantry-eligibility',
    question: 'Who can contest in Face of Campus Guide (F.O.C.G)?',
    answer:
      'Any registered student or aspirant of UNIPORT can register for Face of Campus Guide (F.O.C.G) in either the Mr Campus Guide or Miss Campus Guide category. Registration is flat ₦1,000 and voting is open to all university students.',
  },
];

interface Question {
  id: string;
  category: string;
  question: string;
  status: string;
  answer: string | null;
  created_at: string;
}

export function AskCampusGuide() {
  const { profile } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [questionText, setQuestionText] = useState('');
  const [success, setSuccess] = useState(false);
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);

  const fetchQuestions = async () => {
    if (!profile?.id) return;
    setLoading(true);
    const { data } = await supabase
      .from('ask_questions')
      .select('id, category, question, status, answer, created_at')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });
    setQuestions(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (profile?.id) {
      fetchQuestions();
    }
  }, [profile?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) return;

    setSubmitting(true);
    try {
      if (profile?.id) {
        const { error } = await supabase.from('ask_questions').insert({
          user_id: profile.id,
          name: profile.username || profile.name || 'Student',
          email: profile.email,
          category,
          question: questionText.trim(),
          status: 'open',
        });
        if (!error) {
          setQuestionText('');
          setSuccess(true);
          setTimeout(() => setSuccess(false), 4000);
          fetchQuestions();
        }
      } else {
        window.open(whatsappLink(whatsappMessages.askQuestionSupport(questionText.trim())), '_blank');
        setQuestionText('');
        setSuccess(true);
        setTimeout(() => setSuccess(false), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicShell>
      <SEO
        title="Ask Campus Guide"
        description="Ask anything about UNIPORT and get a straight answer."
      />
      <div className="min-h-screen" style={{ backgroundColor: '#F7F8FA' }}>
        <div className="mx-auto max-w-3xl px-4 py-8 space-y-8">
          {/* Header */}
          <div>
            <span className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: '#EEF2FC' }}>
              <RiQuestionAnswerLine size={24} color={PRIMARY} />
            </span>
            <h1 className="mt-4 text-2xl font-bold tracking-tight" style={{ color: INK }}>
              Ask Campus Guide
            </h1>
            <p className="mt-1 text-sm" style={{ color: MUTED }}>
              Got a question about UNIPORT? Ask here and we will get back to you.
            </p>
          </div>

          {/* Submit Question Form */}
          <form onSubmit={handleSubmit} className="rounded-xl border bg-white p-6" style={{ borderColor: BORDER }}>
            <h2 className="mb-4 text-sm font-semibold" style={{ color: INK }}>
              Ask a new question
            </h2>

            <div className="mb-4">
              <label className="mb-1 block text-xs font-semibold" style={{ color: MUTED }}>
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ borderColor: BORDER, color: INK }}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="mb-1 block text-xs font-semibold" style={{ color: MUTED }}>
                Your question
              </label>
              <textarea
                rows={4}
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="Type your question here..."
                required
                className="w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ borderColor: BORDER, color: INK }}
              />
            </div>

            {success && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
                <PiCheckCircleFill size={16} />
                Question submitted successfully!
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !questionText.trim()}
              className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: PRIMARY }}
            >
              {submitting ? (
                <>
                  <TbLoader2 size={16} className="animate-spin" /> Submitting...
                </>
              ) : (
                <>
                  <RiSendPlane2Line size={16} /> Submit Question
                </>
              )}
            </button>
          </form>

          {/* User's Previous Questions (If Logged In) */}
          {profile?.id && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold" style={{ color: INK }}>
                  My Questions ({questions.length})
                </h2>
                <button
                  onClick={fetchQuestions}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 rounded-lg border bg-white px-3 py-1.5 text-xs font-medium transition-colors hover:bg-slate-50"
                  style={{ borderColor: BORDER, color: INK }}
                >
                  <TbRefresh size={12} className={loading ? 'animate-spin' : ''} />
                  Refresh
                </button>
              </div>

              {loading ? (
                <div className="py-8 text-center text-sm" style={{ color: MUTED }}>
                  Loading...
                </div>
              ) : questions.length === 0 ? (
                <div className="rounded-xl border bg-white p-8 text-center" style={{ borderColor: BORDER }}>
                  <p className="text-sm" style={{ color: MUTED }}>
                    You haven't asked any questions yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {questions.map((q) => (
                    <div key={q.id} className="rounded-xl border bg-white p-5" style={{ borderColor: BORDER }}>
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                          style={{
                            backgroundColor: q.status === 'open' ? '#FEF6E4' : '#DCFCE7',
                            color: q.status === 'open' ? '#B7791F' : '#16A34A',
                          }}
                        >
                          {q.status === 'open' ? 'Pending' : 'Answered'}
                        </span>
                        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: MUTED }}>
                          {q.category}
                        </span>
                        <span className="ml-auto text-[11px]" style={{ color: MUTED }}>
                          {new Date(q.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-medium" style={{ color: INK }}>
                        {q.question}
                      </p>
                      {q.answer && (
                        <div className="mt-3 rounded-lg border p-3" style={{ borderColor: '#D1D9F0', backgroundColor: '#F9FAFB' }}>
                          <p className="text-[11px] font-semibold" style={{ color: PRIMARY }}>
                            ANSWER
                          </p>
                          <p className="mt-1 text-sm leading-relaxed" style={{ color: INK }}>
                            {q.answer}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Frequently Asked Questions (LAST) */}
          <div className="space-y-4 pt-2">
            <h2 className="text-base font-bold tracking-tight" style={{ color: INK }}>
              Frequently Asked Questions
            </h2>

            <div className="space-y-3">
              {FAQ_LIST.map((faq) => {
                const isExpanded = expandedFaqId === faq.id;

                return (
                  <div
                    key={faq.id}
                    className="rounded-xl border bg-white transition-all overflow-hidden"
                    style={{ borderColor: BORDER }}
                  >
                    <button
                      onClick={() => setExpandedFaqId(isExpanded ? null : faq.id)}
                      className="w-full flex items-center justify-between p-4 text-left transition-colors hover:bg-gray-50"
                    >
                      <span className="text-sm font-semibold pr-4" style={{ color: INK }}>
                        {faq.question}
                      </span>
                      <span className="shrink-0 text-gray-400">
                        {isExpanded ? <TbChevronUp size={18} /> : <TbChevronDown size={18} />}
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1 text-sm leading-relaxed border-t border-gray-100" style={{ color: MUTED }}>
                        <p>{faq.answer}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* WhatsApp Action Strip (Identical to rest of site) */}
          <div
            className="flex flex-col items-center justify-between gap-4 rounded-2xl border p-6 md:flex-row"
            style={{ borderColor: '#D1D9F0', backgroundColor: '#EEF2FC' }}
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: '#FFFFFF' }}>
                <SiWhatsapp size={20} color="#25D366" />
              </span>
              <div>
                <p className="text-sm font-semibold" style={{ color: INK }}>
                  Need quick help on WhatsApp?
                </p>
                <p className="text-sm" style={{ color: MUTED }}>
                  Chat with the Campus Guide team for fast answers.
                </p>
              </div>
            </div>
            <a
              href={whatsappLink(whatsappMessages.generalInquiry())}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-opacity duration-150 hover:opacity-90 shrink-0"
              style={{ backgroundColor: '#25D366' }}
            >
              <SiWhatsapp size={16} />
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </div>
    </PublicShell>
  );
}


