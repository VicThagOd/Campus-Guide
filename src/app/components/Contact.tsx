import { Link, useNavigate } from "react-router-dom";
import { Mail, Phone, MapPin, MessageCircle, Facebook, Music, ArrowLeft } from "lucide-react";
import { SiFacebook, SiTiktok, SiWhatsapp } from "react-icons/si";
import { SEO } from "./SEO";


export function Contact() {
  const navigate = useNavigate();
 return (
  <div className="min-h-screen bg-white">
    <SEO
      title="Contact Us"
      description="Reach the Campus Guide team via email, phone, WhatsApp, Facebook or TikTok. We're here to help you prepare for your UNIPORT Post UTME."
      canonical="https://campusguide.ng/contact"
    />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 rounded-lg px-4 py-2 transition-all hover:opacity-90"
            style={{ backgroundColor: "#6b7280", color: "#FFFFFF", fontWeight: 500 }}
          >
            <ArrowLeft size={16} />
            Back to Home
          </button>
            <button
                      onClick={() => navigate('/')}
                      className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all hover:bg-gray-100"
                      style={{ color: '#2F4EA2', border: '1px solid #2F4EA2' }}
                    >
                      <ArrowLeft size={16} />
                      Back to Home
              </button>
        </div>
        <div className="text-center mb-12">
          <h1 className="mb-4" style={{ fontSize: '2rem', fontWeight: 600, color: '#2F4EA2' }}>
            Contact Us
          </h1>
          <p style={{ fontSize: '1.125rem', color: '#000000', opacity: 0.7 }}>
            Get in touch with us through any of these channels
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#2F4EA2' }}>
                <Mail size={24} color="#FFFFFF" />
              </div>
              <div>
                <h3 className="mb-2" style={{ fontSize: '1.125rem', fontWeight: 600, color: '#000000' }}>
                  Email
                </h3>
                <a
                  href="mailto:ehreekig@gmail.com"
                  className="hover:opacity-70 transition-opacity"
                  style={{ color: '#2F4EA2' }}
                >
                  ehreekig@gmail.com
                </a>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#2F4EA2' }}>
                <Phone size={24} color="#FFFFFF" />
              </div>
              <div>
                <h3 className="mb-2" style={{ fontSize: '1.125rem', fontWeight: 600, color: '#000000' }}>
                  Phone
                </h3>
                <a
                  href="tel:+2349155856826"
                  className="hover:opacity-70 transition-opacity"
                  style={{ color: '#2F4EA2' }}
                >
                  +234 915 585 6826
                
                </a>
                 <a
                  href=""
                 
                  style={{ color: '#000000' }}
                >
                     ,     
                
                </a>
                 <a
                  href="tel:+2348109030024"
                  className="hover:opacity-70 transition-opacity"
                  style={{ color: '#2F4EA2' }}
                >
                  +234 810 903 0024
                
                </a>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#2F4EA2' }}>
                <MapPin size={24} color="#FFFFFF" />
              </div>
              <div>
                <h3 className="mb-2" style={{ fontSize: '1.125rem', fontWeight: 600, color: '#000000' }}>
                  Address
                </h3>
                <p style={{ color: '#000000', opacity: 0.7 }}>
                  University of  Port Harcourt, Choba, Rivers State, Nigeria
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
  <div className="flex items-start gap-4">
    {/* Updated background to the official WhatsApp Brand Green #25D366 */}
    <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#25D366' }}>
      <SiWhatsapp size={24} color="#FFFFFF" />
    </div>
    <div>
      <h3 className="mb-2" style={{ fontSize: '1.125rem', fontWeight: 600, color: '#000000' }}>
        WhatsApp
      </h3>
      <a
        href="https://wa.link/wx16gs"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:opacity-70 transition-opacity"
        style={{ color: '#25D366' }}
      >
        Chat with us
      </a>
    </div>
  </div>
</div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8 border border-gray-100 mb-12">
          <h2 className="mb-6 text-center" style={{ fontSize: '1.5rem', fontWeight: 600, color: '#000000' }}>
            Follow Us on Social Media
          </h2>
          <div className="flex items-center justify-center gap-6">
  {/* WhatsApp */}
  <a
    href="https://chat.whatsapp.com/Esl8N9ciZoVJW4SCFpXGGu?mode=gi_t"
    target="_blank"
    rel="noopener noreferrer"
    className="flex flex-col items-center gap-2 hover:opacity-70 transition-opacity"
  >
    <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: '#25D366' }}>
      <SiWhatsapp size={32} color="#FFFFFF" />
    </div>
    <span style={{ color: '#000000', fontWeight: 500 }}>WhatsApp</span>
  </a>

  {/* Facebook */}
  <a
    href="https://www.facebook.com/profile.php?id=61555729226768"
    target="_blank"
    rel="noopener noreferrer"
    className="flex flex-col items-center gap-2 hover:opacity-70 transition-opacity"
  >
    <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: '#1877F2' }}>
      <SiFacebook size={32} color="#FFFFFF" />
    </div>
    <span style={{ color: '#000000', fontWeight: 500 }}>Facebook</span>
  </a>

  {/* TikTok */}
  <a
    href="https://www.tiktok.com/@campus.guide?_r=1&_t=ZS-95tEylhdaOT"
    target="_blank"
    rel="noopener noreferrer"
    className="flex flex-col items-center gap-2 hover:opacity-70 transition-opacity"
  >
    <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: '#000000' }}>
      <SiTiktok size={32} color="#FFFFFF" />
    </div>
    <span style={{ color: '#000000', fontWeight: 500 }}>TikTok</span>
  </a>
</div>
        </div>

        <div className="text-center">
          <Link
            to="/"
            className="inline-block px-8 py-3 rounded-lg border-2 transition-all hover:opacity-70"
            style={{ borderColor: '#2F4EA2', color: '#2F4EA2', fontWeight: 500 }}
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
