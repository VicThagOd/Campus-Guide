import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart3, CheckCircle2, FileText, Menu, Star, Target, X } from "lucide-react";
import { PublishedReview, getAppState, testConfig } from "../lib/appState";
import { SEO } from "./SEO";

function CampusGuideLogo({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <img
      src="/logo.png"
      alt="Campus Guide"
      width={size}
      height={size}
      className={className}
      style={{ borderRadius: "8px", objectFit: "cover" }}
    />
  );
}

export function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [reviews, setReviews] = useState<PublishedReview[]>([]);

  useEffect(() => {
    setReviews(getAppState().reviews);
  }, []);

  return (
     <div className="min-h-screen bg-white">
    <SEO
      title="UNIPORT Post UTME Past Questions & CBT Practice"
      description="Prepare for your UNIPORT Post UTME with confidence. Access past questions, take realistic CBT mock tests, and track your performance. Start with 2 free trials today."
      canonical="https://campusguide.ng"
    />
      
      <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <CampusGuideLogo size={40} />
              <h1 className="hidden sm:block" style={{ fontSize: "1.25rem", fontWeight: 600, color: "#2F4EA2" }}>
                Campus Guide
              </h1>
            </div>

            <div className="hidden items-center gap-6 md:flex">
              <a href="#features" className="transition-opacity hover:opacity-70" style={{ color: "#000000", fontWeight: 500 }}>
                Features
              </a>
              <Link to="/contact" className="transition-opacity hover:opacity-70" style={{ color: "#000000", fontWeight: 500 }}>
                Contact
              </Link>
              <a href="#reviews" className="transition-opacity hover:opacity-70" style={{ color: "#000000", fontWeight: 500 }}>
                Reviews
              </a>
              <Link to="/login" className="transition-opacity hover:opacity-70" style={{ color: "#2F4EA2", fontWeight: 500 }}>
                Log In
              </Link>
              <Link
                to="/login"
                state={{ isSignup: true }}
                className="rounded-lg px-6 py-2 transition-all hover:opacity-90"
                style={{ backgroundColor: "#2F4EA2", color: "#FFFFFF", fontWeight: 500 }}
              >
                Get Started
              </Link>
            </div>

            <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
              {mobileMenuOpen ? <X size={24} color="#2F4EA2" /> : <Menu size={24} color="#2F4EA2" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="border-t border-gray-200 py-4 md:hidden">
              <div className="flex flex-col gap-4">
                <a href="#features" className="transition-opacity hover:opacity-70" style={{ color: "#000000", fontWeight: 500 }}>
                  Features
                </a>
                <Link to="/contact" className="transition-opacity hover:opacity-70" style={{ color: "#000000", fontWeight: 500 }}>
                  Contact
                </Link>
                <a href="#reviews" className="transition-opacity hover:opacity-70" style={{ color: "#000000", fontWeight: 500 }}>
                  Reviews
                </a>
                <Link to="/login" className="transition-opacity hover:opacity-70" style={{ color: "#2F4EA2", fontWeight: 500 }}>
                  Log In
                </Link>
                <Link
                  to="/login"
                  state={{ isSignup: true }}
                  className="rounded-lg px-6 py-2 text-center transition-all hover:opacity-90"
                  style={{ backgroundColor: "#2F4EA2", color: "#FFFFFF", fontWeight: 500 }}
                >
                  Get Started
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <section className="mx-auto mb-16 max-w-3xl text-center">
          <h2 className="mb-4" style={{ fontSize: "2.5rem", fontWeight: 700, color: "#000000" }}>
            Pass Your Post UTME with Confidence
          </h2>
          <p className="mb-8" style={{ fontSize: "1.125rem", color: "#000000", opacity: 0.7, lineHeight: 1.6 }}>
            Access comprehensive past questions, take realistic mock tests, and track your performance to excel in your Post UTME examination.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              to="/login"
              state={{ isSignup: true }}
              className="inline-block rounded-lg px-8 py-3 transition-all hover:opacity-90"
              style={{ backgroundColor: "#2F4EA2", color: "#FFFFFF", fontWeight: 500 }}
            >
              Get Started
            </Link>
            <Link
              to="/login"
              className="inline-block rounded-lg border-2 px-8 py-3 transition-all hover:bg-gray-50"
              style={{ borderColor: "#2F4EA2", color: "#2F4EA2", fontWeight: 500 }}
            >
              Log In
            </Link>
          </div>
        </section>

        <section id="features" className="mb-16">
          <h3 className="mb-8 text-center" style={{ fontSize: "1.75rem", fontWeight: 600, color: "#000000" }}>
            Features
          </h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <FeatureCard icon={<FileText size={32} color="#2F4EA2" />} title="Past Questions" description="Unlock comprehensive PDF collections of previous Post UTME questions with a one-time payment." />
            <FeatureCard icon={<Target size={32} color="#2F4EA2" />} title="Live Mock Tests" description="Practice with a UNIPORT-style CBT format of 50 questions in 30 minutes, scored over 400." />
            <FeatureCard icon={<BarChart3 size={32} color="#2F4EA2" />} title="Performance Tracking" description="Monitor your score, points earned, answered questions, and subject-by-subject performance." />
            <FeatureCard icon={<CheckCircle2 size={32} color="#2F4EA2" />} title="Subject Analysis" description="See the subjects you struggle with most based on repeated weak performance." />
          </div>
        </section>

        <section id="reviews" className="mx-auto mb-16 max-w-4xl">
          <h3 className="mb-8 text-center" style={{ fontSize: "1.75rem", fontWeight: 600, color: "#000000" }}>
            Student Reviews
          </h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {reviews.map((review) => (
              <ReviewCard key={review.id} name={review.name} course={review.course} rating={review.rating} review={review.review} />
            ))}
          </div>
        </section>
      </div>

      <footer className="mt-16 border-t border-gray-200" style={{ backgroundColor: "#BFC3C6" }}>
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-3">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <CampusGuideLogo size={40} />
                <h3 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#2F4EA2" }}>Campus Guide</h3>
              </div>
              <p style={{ color: "#000000", opacity: 0.7, fontSize: "0.9375rem" }}>Your trusted platform for Post UTME preparation</p>
            </div>

            <div>
              <h4 className="mb-4" style={{ fontWeight: 600, color: "#000000" }}>Quick Links</h4>
              <div className="flex flex-col gap-2">
                <a href="#features" className="transition-opacity hover:opacity-70" style={{ color: "#000000", opacity: 0.7 }}>
                  Features
                </a>
                <Link to="/contact" className="transition-opacity hover:opacity-70" style={{ color: "#000000", opacity: 0.7 }}>
                  Contact
                </Link>
                <a href="#reviews" className="transition-opacity hover:opacity-70" style={{ color: "#000000", opacity: 0.7 }}>
                  Reviews
                </a>
              </div>
            </div>

          </div>

          <div className="border-t pt-6 text-center" style={{ borderColor: "#000000", opacity: 0.2 }}>
            <p style={{ color: "#000000", opacity: 0.7, fontSize: "0.875rem" }}>Copyright 2026 Campus Guide - Post UTME. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-md transition-shadow hover:shadow-lg">
      <div className="mb-4">{icon}</div>
      <h4 className="mb-2" style={{ fontSize: "1.125rem", fontWeight: 600, color: "#000000" }}>
        {title}
      </h4>
      <p style={{ color: "#000000", opacity: 0.7, fontSize: "0.9375rem", lineHeight: 1.5 }}>{description}</p>
    </div>
  );
}

function ReviewCard({ name, course, rating, review }: { name: string; course: string; rating: number; review: string }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-md">
      <div className="mb-3 flex items-center gap-1">
        {[...Array(5)].map((_, index) => (
          <Star key={index} size={18} fill={index < rating ? "#2F4EA2" : "none"} color={index < rating ? "#2F4EA2" : "#BFC3C6"} />
        ))}
      </div>
      <p className="mb-4" style={{ color: "#000000", opacity: 0.8, lineHeight: 1.6, fontSize: "0.9375rem" }}>
        "{review}"
      </p>
      <div>
        <p style={{ fontWeight: 600, color: "#000000" }}>{name}</p>
        <p style={{ fontSize: "0.875rem", color: "#000000", opacity: 0.6 }}>{course}</p>
      </div>
    </div>
  );
}
