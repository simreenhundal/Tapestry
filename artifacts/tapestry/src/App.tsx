import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import { motion } from "framer-motion";
import {
  CloudRain,
  MoonStar,
  CalendarDays,
  Plane,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Globe2,
  Users,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import Dashboard from "./Dashboard";
import OnboardingPage from "./pages/OnboardingPage";

const queryClient = new QueryClient();

function WaitlistForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success">(
    "idle",
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("submitting");
    setTimeout(() => {
      setStatus("success");
    }, 1000);
  };

  if (status === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center space-x-3 text-primary bg-secondary/50 p-4 rounded-lg border border-border"
      >
        <CheckCircle2 className="w-5 h-5 text-primary" />
        <div>
          <p className="font-medium text-sm">You're on the list.</p>
          <p className="text-xs text-muted-foreground">
            We'll be in touch soon.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row gap-3 max-w-md w-full"
    >
      <div className="flex-1 space-y-1">
        <Input
          type="email"
          placeholder="Work Email"
          required
          className="h-12 bg-white border-border/60 shadow-sm"
        />
      </div>
      <div className="flex-1 space-y-1">
        <Input
          type="text"
          placeholder="Company Name"
          required
          className="h-12 bg-white border-border/60 shadow-sm"
        />
      </div>
      <Button
        type="submit"
        disabled={status === "submitting"}
        className="h-12 px-6 shadow-sm"
      >
        {status === "submitting" ? "Requesting..." : "Request Access"}
      </Button>
    </form>
  );
}

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
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border/40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="font-serif font-medium text-xl tracking-tight text-primary">
            Tapestry.
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              document
                .getElementById("waitlist")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Request Access
          </Button>
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
            <WaitlistForm />
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
                  invisible circumstance. A team member isn't disengaged—they're
                  navigating a regional power outage. They aren't slow—they're
                  observing a religious fast.
                </p>
              </div>
              <div className="bg-white p-8 rounded-2xl border border-border shadow-sm">
                <div className="flex items-start space-x-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <Globe2 className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h4 className="font-medium text-primary">
                      What today's tools miss
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                      Regional disruptions, religious observances, school
                      schedules, caregiving responsibilities, and travel
                      fatigue. The realities that actually dictate how we work.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </Section>
      </div>

      {/* Use Cases */}
      <Section>
        <Reveal>
          <h2 className="text-xs font-sans font-semibold tracking-widest uppercase text-muted-foreground mb-12 text-center">
            How Tapestry Works
          </h2>
        </Reveal>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: <CloudRain className="w-6 h-6" />,
              title: "Regional Disruption",
              desc: "A snowstorm causes rolling outages in Southwestern Ontario. The employee can technically attend—Tapestry recommends rescheduling.",
            },
            {
              icon: <MoonStar className="w-6 h-6" />,
              title: "Religious Observance",
              desc: "A fasting period affects collaboration readiness. Tapestry surfaces this respectfully, enabling empathetic scheduling without awkward conversations.",
            },
            {
              icon: <CalendarDays className="w-6 h-6" />,
              title: "Predictable Rhythms",
              desc: "A parent's focus naturally shifts during school breaks. Tapestry helps teams plan around these predictable life rhythms proactively.",
            },
          ].map((item, i) => (
            <Reveal key={i} delay={i * 0.1}>
              <div className="h-full border border-border/60 bg-white rounded-2xl p-8 hover:shadow-md transition-shadow duration-300">
                <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center text-primary mb-6">
                  {item.icon}
                </div>
                <h3 className="text-xl font-serif text-primary mb-3">
                  {item.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  {item.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

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
                  {
                    title: "Delayed Projects",
                    desc: "Missed deadlines traced to assumptions, not actual unavailability.",
                  },
                  {
                    title: "Eroded Trust",
                    desc: "Disengagement attributed to attitude rather than circumstance.",
                  },
                  {
                    title: "Cross-Cultural Friction",
                    desc: "Misunderstandings stemming from invisible local realities.",
                  },
                  {
                    title: "Team Burnout",
                    desc: "Compounded stress from repeated, preventable collaboration breakdowns.",
                  },
                ].map((cost, i) => (
                  <div key={i} className="flex space-x-6">
                    <div className="w-px bg-primary-foreground/20 shrink-0 relative">
                      <div className="absolute top-2 -left-1 w-2 h-2 rounded-full bg-primary-foreground/50" />
                    </div>
                    <div>
                      <h4 className="text-xl font-serif mb-2">{cost.title}</h4>
                      <p className="text-primary-foreground/70 text-sm leading-relaxed">
                        {cost.desc}
                      </p>
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
              <h3 className="text-2xl font-serif mb-4 text-primary">
                Privacy-preserving by design.
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Employee-controlled. Employees receive value and empathy without
                being forced to over-share personal information. Trust is built
                through structural respect, not surveillance.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="bg-secondary/30 rounded-3xl p-10 h-full border border-border/50">
              <Clock className="w-8 h-8 text-primary mb-6" />
              <h3 className="text-2xl font-serif mb-4 text-primary">
                Integrates where you work.
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                No new dashboards to check. Tapestry weaves context directly
                into Outlook, Microsoft Teams, and enterprise calendars.
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
              <span className="absolute -top-6 -left-8 text-8xl text-secondary-foreground/10 font-sans">
                "
              </span>
              Tapestry exists to help people make better decisions through
              greater awareness and empathy.
            </div>
            <div>
              <div className="font-medium text-primary">Harleen Hundal</div>
              <div className="text-sm text-muted-foreground">
                Founder, Tapestry
              </div>
            </div>
          </div>
        </Reveal>
      </Section>

      {/* Bottom CTA */}
      <div className="border-t border-border/50 bg-secondary/20" id="waitlist">
        <Section className="py-32 text-center flex flex-col items-center">
          <Reveal>
            <h2 className="text-3xl md:text-5xl font-serif text-primary mb-6">
              Ready to see the whole picture?
            </h2>
            <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
              Join the waitlist for early access. Built for Chief of Staffs,
              Global Operations, and Enterprise Transformation Leaders.
            </p>
            <div className="flex justify-center w-full">
              <WaitlistForm />
            </div>
          </Reveal>
        </Section>
      </div>

      <footer className="py-8 text-center text-sm text-muted-foreground border-t border-border/40">
        <p>
          © {new Date().getFullYear()} Tapestry. Enterprise SaaS for modern
          work.
        </p>
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
        </Switch>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
