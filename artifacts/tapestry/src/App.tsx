import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, Link } from "wouter";
import { motion } from "framer-motion";
import {
  CloudRain,
  MoonStar,
  CalendarDays,
  ShieldCheck,
  Clock,
  Globe2,
  CheckCircle2,
  Users,
  ArrowRight,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import Dashboard from "./Dashboard";
import OnboardingPage from "./pages/OnboardingPage";
import SchedulePage from "./pages/SchedulePage";

const queryClient = new QueryClient();

function Section({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={`py-24 md:py-32 px-6 md:px-12 lg:px-24 max-w-7xl mx-auto ${className}`}
    >
      {children}
    </section>
  );
}

function Reveal({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.7, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      {children}
    </motion.div>
  );
}

function Home() {
  return (
    <div className="min-h-[100dvh] w-full bg-background selection:bg-primary/10">
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border/40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="font-serif font-medium text-xl tracking-tight text-primary">
            Tapestry.
          </div>
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Dashboard
            </Link>
            <Link href="/schedule" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Schedule
            </Link>
            <Link href="/dashboard">
              <Button size="sm" className="shadow-sm">Try the Demo</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-40 pb-24 px-6 md:px-12 lg:px-24 max-w-7xl mx-auto min-h-[90vh] flex flex-col justify-center">
        <div className="max-w-4xl">
          <motion.div
            initial={{ opacity: 0, filter: "blur(10px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <h2 className="text-sm font-sans font-semibold tracking-widest uppercase text-muted-foreground mb-6">
              The context layer for modern work
            </h2>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-normal leading-[1.05] tracking-[-0.02em] text-primary mb-8">
              See the threads.
              <br />
              Understand the whole.
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-2xl mb-12 font-sans font-light">
              Today's tools ask: <em>Can this meeting happen?</em>
              <br />
              Tapestry asks: <strong>Should this meeting happen?</strong>
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/dashboard">
                <Button size="lg" className="h-12 px-8 shadow-sm text-base">
                  View Team Dashboard
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link href="/schedule">
                <Button size="lg" variant="outline" className="h-12 px-8 text-base">
                  <Sparkles className="mr-2 w-4 h-4" />
                  Check Meeting Readiness
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Core Problem */}
      <div className="bg-secondary/40 border-y border-border/40">
        <Section>
          <Reveal>
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <h3 className="text-3xl md:text-4xl font-serif leading-tight text-primary mb-6">
                  Many workplace conflicts are context problems disguised as
                  people problems.
                </h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  We attribute friction to attitude, when it's often just
                  invisible circumstance. A team member isn't disengaged — they're
                  navigating a religious observance. They aren't slow — they're
                  managing caregiving responsibilities no one knew about.
                </p>
              </div>
              <div className="bg-white p-8 rounded-2xl border border-border shadow-sm space-y-5">
                {[
                  { emoji: "🕌", label: "Friday Prayer", desc: "Midday unavailability every Friday" },
                  { emoji: "👶", label: "School Pickup 3pm", desc: "Daily hard stop, non-negotiable" },
                  { emoji: "🌙", label: "Ramadan", desc: "Fasting — afternoon energy affected" },
                  { emoji: "🌍", label: "Lagos Heat Wave", desc: "Power disruption risk this week" },
                ].map((tag, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xl w-8 text-center">{tag.emoji}</span>
                    <div>
                      <div className="text-sm font-medium text-primary">{tag.label}</div>
                      <div className="text-xs text-muted-foreground">{tag.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </Section>
      </div>

      {/* How It Works */}
      <Section>
        <Reveal>
          <h2 className="text-xs font-sans font-semibold tracking-widest uppercase text-muted-foreground mb-4 text-center">
            How Tapestry Works
          </h2>
          <p className="text-center text-muted-foreground text-lg mb-14 max-w-xl mx-auto">
            Three steps from profile to readiness report.
          </p>
        </Reveal>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: "01",
              icon: <Users className="w-6 h-6" />,
              title: "Team members share their context",
              desc: "Each employee fills out a simple onboarding form: timezone, religion, caregiving situation, work schedule, health context. Fully optional — share only what you're comfortable with.",
            },
            {
              step: "02",
              icon: <Globe2 className="w-6 h-6" />,
              title: "Tapestry builds rich profiles",
              desc: "Profiles are surfaced as context tags on a team dashboard — Friday Prayer, School Pickup 3pm, Ramadan, Night Owl — giving managers instant situational awareness.",
            },
            {
              step: "03",
              icon: <Sparkles className="w-6 h-6" />,
              title: "AI checks readiness for any meeting",
              desc: "Propose a time and select attendees. Tapestry queries the AI with each person's profile plus live weather data, producing a Green/Yellow/Red signal per person with a plain-English reason.",
            },
          ].map((item, i) => (
            <Reveal key={i} delay={i * 0.1}>
              <div className="h-full border border-border/60 bg-white rounded-2xl p-8 hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center text-primary">
                    {item.icon}
                  </div>
                  <span className="text-3xl font-serif text-muted-foreground/30 font-bold">{item.step}</span>
                </div>
                <h3 className="text-xl font-serif text-primary mb-3">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">{item.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Use Cases */}
      <div className="bg-secondary/30 border-y border-border/40">
        <Section>
          <Reveal>
            <h2 className="text-xs font-sans font-semibold tracking-widest uppercase text-muted-foreground mb-12 text-center">
              What Tapestry Surfaces
            </h2>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <CloudRain className="w-6 h-6" />,
                title: "Regional Disruption",
                desc: "A tropical storm causes rolling outages in Lagos. The employee can technically attend — Tapestry recommends rescheduling with a plain-English explanation.",
              },
              {
                icon: <MoonStar className="w-6 h-6" />,
                title: "Religious Observance",
                desc: "A fasting period affects collaboration readiness. Tapestry surfaces this respectfully, enabling empathetic scheduling without awkward conversations.",
              },
              {
                icon: <CalendarDays className="w-6 h-6" />,
                title: "Predictable Rhythms",
                desc: "A parent's focus naturally shifts at school pickup time. Tapestry helps teams plan around these predictable life rhythms proactively.",
              },
            ].map((item, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <div className="h-full border border-border/60 bg-white rounded-2xl p-8 hover:shadow-md transition-shadow duration-300">
                  <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center text-primary mb-6">
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-serif text-primary mb-3">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">{item.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Section>
      </div>

      {/* Hidden Costs */}
      <div className="bg-primary text-primary-foreground">
        <Section className="py-32">
          <Reveal>
            <div className="grid lg:grid-cols-2 gap-20">
              <div>
                <h2 className="text-4xl md:text-5xl font-serif leading-tight mb-8">
                  The hidden costs of invisible context.
                </h2>
                <div className="flex items-center space-x-3 text-primary-foreground/70 bg-primary-foreground/10 inline-flex px-4 py-2 rounded-full text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>15 discovery interviews across 5 industries</span>
                </div>
                <p className="mt-4 text-primary-foreground/80 font-serif italic text-xl">
                  "0 people disagreed the problem exists."
                </p>
              </div>
              <div className="space-y-10">
                {[
                  { title: "Delayed Projects", desc: "Missed deadlines traced to assumptions, not actual unavailability." },
                  { title: "Eroded Trust", desc: "Disengagement attributed to attitude rather than circumstance." },
                  { title: "Cross-Cultural Friction", desc: "Misunderstandings stemming from invisible local realities." },
                  { title: "Team Burnout", desc: "Compounded stress from repeated, preventable collaboration breakdowns." },
                ].map((cost, i) => (
                  <div key={i} className="flex space-x-6">
                    <div className="w-px bg-primary-foreground/20 shrink-0 relative">
                      <div className="absolute top-2 -left-1 w-2 h-2 rounded-full bg-primary-foreground/50" />
                    </div>
                    <div>
                      <h4 className="text-xl font-serif mb-2">{cost.title}</h4>
                      <p className="text-primary-foreground/70 text-sm leading-relaxed">{cost.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </Section>
      </div>

      {/* Privacy & Integrations */}
      <Section>
        <div className="grid md:grid-cols-2 gap-12">
          <Reveal>
            <div className="bg-secondary/30 rounded-3xl p-10 h-full border border-border/50">
              <ShieldCheck className="w-8 h-8 text-primary mb-6" />
              <h3 className="text-2xl font-serif mb-4 text-primary">Privacy-preserving by design.</h3>
              <p className="text-muted-foreground leading-relaxed">
                Employee-controlled. Team members share only what they're comfortable sharing. Tapestry surfaces the context without exposing the raw personal data to managers.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="bg-secondary/30 rounded-3xl p-10 h-full border border-border/50">
              <Clock className="w-8 h-8 text-primary mb-6" />
              <h3 className="text-2xl font-serif mb-4 text-primary">Integrates where you work.</h3>
              <p className="text-muted-foreground leading-relaxed">
                No new dashboards to check. Tapestry weaves context directly into Outlook, Microsoft Teams, Google Calendar, and enterprise scheduling tools.
              </p>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* Founder Quote */}
      <Section className="pb-12">
        <Reveal>
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <div className="text-4xl md:text-5xl font-serif text-primary leading-tight relative">
              <span className="absolute -top-6 -left-8 text-8xl text-secondary-foreground/10 font-sans">"</span>
              Tapestry exists to help people make better decisions through greater awareness and empathy.
            </div>
            <div>
              <div className="font-medium text-primary">Harleen Hundal</div>
              <div className="text-sm text-muted-foreground">Founder, Tapestry</div>
            </div>
          </div>
        </Reveal>
      </Section>

      {/* Bottom CTA */}
      <div className="border-t border-border/50 bg-secondary/20">
        <Section className="py-32 text-center flex flex-col items-center">
          <Reveal>
            <h2 className="text-3xl md:text-5xl font-serif text-primary mb-6">
              Ready to see the whole picture?
            </h2>
            <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
              Explore the live demo with a pre-seeded team spanning Lagos, Mumbai, São Paulo, London, Tokyo, Nairobi, and New York.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard">
                <Button size="lg" className="h-12 px-8 shadow-sm text-base">
                  View Team Dashboard
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link href="/schedule">
                <Button size="lg" variant="outline" className="h-12 px-8 text-base">
                  <Sparkles className="mr-2 w-4 h-4" />
                  Try Meeting Scheduler
                </Button>
              </Link>
            </div>
          </Reveal>
        </Section>
      </div>

      <footer className="py-8 text-center text-sm text-muted-foreground border-t border-border/40">
        <p>© {new Date().getFullYear()} Tapestry. Enterprise SaaS for distributed teams.</p>
      </footer>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/onboarding" component={OnboardingPage} />
          <Route path="/schedule" component={SchedulePage} />
        </Switch>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
