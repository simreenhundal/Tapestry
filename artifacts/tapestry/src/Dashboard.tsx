import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  Clock,
  Globe2,
  PlusCircle,
  Sparkles,
  Users,
  Calendar,
  CalendarDays,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  Wifi,
  WifiOff,
  ArrowRight,
} from "lucide-react";
import {
  useListEmployees,
  useGetCalendarStatus,
  useListCalendarMeetings,
  getListCalendarMeetingsQueryKey,
} from "@workspace/api-client-react";
import type { CalendarMeeting, MatchedEmployee } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Employee = {
  id: number;
  name: string;
  email: string;
  city: string;
  country: string;
  timezone: string;
  role?: string;
  religion?: string;
  culturalBackground?: string;
  caregivingResponsibilities?: string;
  preferredWorkStart?: string;
  preferredWorkEnd?: string;
  preferredWorkDays?: string;
  healthConsiderations?: string;
  additionalContext?: string;
  createdAt: string;
};

function useLocalTime(timezone: string) {
  const [time, setTime] = useState("");
  useEffect(() => {
    const update = () => {
      try {
        setTime(
          new Date().toLocaleTimeString("en-US", {
            timeZone: timezone,
            hour: "2-digit",
            minute: "2-digit",
            timeZoneName: "short",
          })
        );
      } catch {
        setTime("—");
      }
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [timezone]);
  return time;
}

type ContextTag = {
  emoji: string;
  label: string;
  color: string;
};

function getContextTags(employee: Employee | MatchedEmployee): ContextTag[] {
  const tags: ContextTag[] = [];
  const religionLower = (employee.religion || "").toLowerCase();
  const caregivingLower = ("caregivingResponsibilities" in employee ? employee.caregivingResponsibilities || "" : "").toLowerCase();
  const culturalLower = (employee.culturalBackground || "").toLowerCase();
  const healthLower = ("healthConsiderations" in employee ? employee.healthConsiderations || "" : "").toLowerCase();
  const notesLower = (employee.additionalContext || "").toLowerCase();

  if (religionLower.includes("islam") || religionLower.includes("muslim")) {
    tags.push({ emoji: "🕌", label: "Friday Prayer", color: "bg-emerald-50 text-emerald-700 border-emerald-200" });
    if (new Date().getMonth() >= 2 && new Date().getMonth() <= 3) {
      tags.push({ emoji: "🌙", label: "Ramadan Season", color: "bg-indigo-50 text-indigo-700 border-indigo-200" });
    }
  }
  if (religionLower.includes("judaism") || religionLower.includes("jewish")) {
    tags.push({ emoji: "✡️", label: "Shabbat Observer", color: "bg-blue-50 text-blue-700 border-blue-200" });
  }
  if (religionLower.includes("hinduism") || religionLower.includes("hindu")) {
    tags.push({ emoji: "🪔", label: "Hindu Observances", color: "bg-orange-50 text-orange-700 border-orange-200" });
  }
  if (religionLower.includes("buddhism") || religionLower.includes("buddhist")) {
    tags.push({ emoji: "☸️", label: "Buddhist Observances", color: "bg-amber-50 text-amber-700 border-amber-200" });
  }
  if (caregivingLower.includes("school") || notesLower.includes("school drop") || notesLower.includes("pickup")) {
    tags.push({ emoji: "👶", label: "School Pickup", color: "bg-pink-50 text-pink-700 border-pink-200" });
  }
  if (caregivingLower.includes("elderly") || caregivingLower.includes("parent")) {
    tags.push({ emoji: "🏥", label: "Caregiving", color: "bg-rose-50 text-rose-700 border-rose-200" });
  }
  if (healthLower && healthLower !== "none" && healthLower.length > 2) {
    tags.push({ emoji: "💙", label: "Health Context", color: "bg-sky-50 text-sky-700 border-sky-200" });
  }
  if (culturalLower.includes("carnival") || culturalLower.includes("lunar") || culturalLower.includes("golden week") || culturalLower.includes("obon")) {
    tags.push({ emoji: "🎊", label: "Cultural Calendar", color: "bg-purple-50 text-purple-700 border-purple-200" });
  }

  if ("preferredWorkStart" in employee && "preferredWorkEnd" in employee) {
    const startHour = parseInt(employee.preferredWorkStart?.split(":")?.[0] ?? "9", 10);
    const endHour = parseInt(employee.preferredWorkEnd?.split(":")?.[0] ?? "17", 10);
    if (startHour >= 7 && endHour >= 19) {
      tags.push({ emoji: "🦉", label: "Night Owl", color: "bg-slate-50 text-slate-600 border-slate-200" });
    } else if (startHour <= 7) {
      tags.push({ emoji: "🌅", label: "Early Bird", color: "bg-yellow-50 text-yellow-700 border-yellow-200" });
    }
  }

  return tags;
}

function ContextTagChips({ employee }: { employee: Employee | MatchedEmployee }) {
  const tags = getContextTags(employee);
  if (tags.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((tag, i) => (
        <span
          key={i}
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${tag.color}`}
        >
          {tag.emoji} {tag.label}
        </span>
      ))}
    </div>
  );
}

function EmployeeCard({ employee }: { employee: Employee }) {
  const localTime = useLocalTime(employee.timezone);
  const tags = getContextTags(employee);

  const tzCity = employee.timezone.split("/").pop()?.replace("_", " ") ?? employee.timezone;

  return (
    <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-serif text-primary truncate">{employee.name}</CardTitle>
            {employee.role && (
              <p className="text-xs text-muted-foreground mt-0.5 font-medium">{employee.role}</p>
            )}
          </div>
          <div className="shrink-0 text-right">
            <div className="text-xs font-mono font-medium text-primary bg-secondary/50 px-2 py-1 rounded-md">
              {localTime}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
          <Globe2 className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{employee.city}, {employee.country}</span>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{tzCity}</span>
          {employee.preferredWorkStart && employee.preferredWorkEnd && (
            <span className="text-muted-foreground/60">
              · {employee.preferredWorkStart}–{employee.preferredWorkEnd}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col pb-4">
        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {tags.map((tag, i) => (
              <span
                key={i}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${tag.color}`}
              >
                {tag.emoji} {tag.label}
              </span>
            ))}
          </div>
        ) : (
          <div className="mb-4">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-green-50 text-green-700 border-green-200">
              ✓ No active context flags
            </span>
          </div>
        )}

        {employee.additionalContext && (
          <p className="text-xs text-muted-foreground italic leading-relaxed bg-secondary/30 rounded-md px-3 py-2 border border-border/40 mt-auto">
            "{employee.additionalContext}"
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function formatMeetingTime(isoString: string): string {
  if (!isoString) return "—";
  const d = new Date(isoString);
  return d.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

function formatDuration(start: string, end: string): string {
  const startMs = new Date(start).getTime();
  const endMs = new Date(end).getTime();
  const mins = Math.round((endMs - startMs) / 60000);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function MeetingCard({ meeting, onCheckReadiness }: { meeting: CalendarMeeting; onCheckReadiness: (ids: number[], time: string) => void }) {
  const matchedIds = meeting.matchedEmployees.map((e) => e.id);
  const hasMatched = matchedIds.length > 0;

  return (
    <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/8 border border-border/40 flex items-center justify-center shrink-0 mt-0.5">
            <CalendarDays className="w-4.5 h-4.5 text-primary/70" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-base font-serif text-primary leading-tight">{meeting.title}</CardTitle>
              <Badge
                variant="secondary"
                className="text-[10px] font-medium shrink-0 capitalize"
              >
                {meeting.provider === "google" ? "Google" : "Microsoft"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatMeetingTime(meeting.start)}
              {meeting.start && meeting.end && (
                <span className="text-muted-foreground/60"> · {formatDuration(meeting.start, meeting.end)}</span>
              )}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-4 space-y-4">
        {meeting.attendees.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">
              {meeting.attendees.length} attendee{meeting.attendees.length !== 1 ? "s" : ""}
              {hasMatched && (
                <span className="text-primary ml-1">
                  · {matchedIds.length} in Tapestry
                </span>
              )}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {meeting.attendees.map((att) => {
                const matched = meeting.matchedEmployees.find(
                  (e) => e.email.toLowerCase() === att.email.toLowerCase()
                );
                return (
                  <span
                    key={att.email}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${
                      matched
                        ? "bg-primary/5 text-primary border-primary/20 font-medium"
                        : "bg-secondary/50 text-muted-foreground border-border/40"
                    }`}
                  >
                    {matched && <span className="w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />}
                    {att.name || att.email}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {hasMatched && (
          <div className="space-y-2">
            {meeting.matchedEmployees.map((emp) => (
              <div key={emp.id} className="bg-secondary/20 rounded-lg px-3 py-2 border border-border/30">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-medium text-primary">{emp.name}</span>
                  <span className="text-[10px] text-muted-foreground">{emp.city}, {emp.country}</span>
                </div>
                <ContextTagChips employee={emp} />
              </div>
            ))}
          </div>
        )}

        {hasMatched ? (
          <Button
            size="sm"
            className="w-full gap-2"
            onClick={() => onCheckReadiness(matchedIds, meeting.start)}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Check Readiness
            <ArrowRight className="w-3.5 h-3.5 ml-auto" />
          </Button>
        ) : (
          <p className="text-xs text-muted-foreground/70 italic text-center py-1">
            No Tapestry team members matched for this meeting.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function CalendarStatusBadge() {
  const { data: status, isLoading } = useGetCalendarStatus();

  if (isLoading) return null;

  const connected = status?.google || status?.microsoft;
  const label = status?.google ? "Google Calendar" : status?.microsoft ? "Microsoft Calendar" : null;

  if (connected && label) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full font-medium">
        <Wifi className="w-3 h-3" />
        {label} connected
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/50 border border-border/40 px-2.5 py-1 rounded-full">
      <WifiOff className="w-3 h-3" />
      No calendar connected
    </span>
  );
}

function UpcomingMeetingsTab() {
  const [, navigate] = useLocation();
  const { data: calStatus } = useGetCalendarStatus();
  const calendarConnected = calStatus?.google || calStatus?.microsoft;

  const { data, isLoading, error } = useListCalendarMeetings(
    { hoursAhead: 48 },
    { query: { enabled: !!calendarConnected, queryKey: getListCalendarMeetingsQueryKey({ hoursAhead: 48 }) } }
  );

  const handleCheckReadiness = (ids: number[], time: string) => {
    const params = new URLSearchParams({
      ids: ids.join(","),
      time,
    });
    navigate(`/schedule?${params.toString()}`);
  };

  if (!calendarConnected && calStatus !== undefined) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-6">
        <div className="w-16 h-16 rounded-full bg-secondary/50 border border-border/40 flex items-center justify-center mb-6">
          <CalendarDays className="w-7 h-7 text-muted-foreground/40" />
        </div>
        <h2 className="text-xl font-serif text-primary mb-2">Connect your calendar</h2>
        <p className="text-muted-foreground text-sm max-w-sm leading-relaxed mb-6">
          Link your Google Calendar or Microsoft 365 to automatically surface upcoming meetings and check team readiness — no manual scheduling needed.
        </p>
        <div className="bg-secondary/30 border border-border/40 rounded-xl p-5 max-w-sm text-left space-y-3">
          <p className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">How to connect</p>
          <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
              <span>Open the <strong>Integrations</strong> panel in your Replit workspace sidebar</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
              <span>Find and connect <strong>Google Calendar</strong></span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
              <span>Return here — meetings will appear automatically</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading || calStatus === undefined) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-52 rounded-xl bg-secondary/40 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center mt-2">
        <p className="text-destructive font-medium text-sm">Failed to load calendar meetings</p>
        <p className="text-xs text-muted-foreground mt-1">Check your calendar connection and try again.</p>
      </div>
    );
  }

  const meetings = data?.meetings ?? [];

  if (meetings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-6">
        <CheckCircle2 className="w-12 h-12 text-muted-foreground/20 mb-4" />
        <h2 className="text-xl font-serif text-primary mb-2">All clear</h2>
        <p className="text-muted-foreground text-sm max-w-sm leading-relaxed">
          No meetings found in the next 48 hours. Enjoy the breathing room!
        </p>
      </div>
    );
  }

  const withMatched = meetings.filter((m) => m.matchedEmployees.length > 0);
  const withoutMatched = meetings.filter((m) => m.matchedEmployees.length === 0);

  return (
    <div className="space-y-8 mt-2">
      {withMatched.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" />
              {withMatched.length} meeting{withMatched.length !== 1 ? "s" : ""} with matched team members
            </p>
            <div className="flex-1 border-t border-border/40" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {withMatched.map((m) => (
              <MeetingCard key={m.id} meeting={m} onCheckReadiness={handleCheckReadiness} />
            ))}
          </div>
        </div>
      )}

      {withoutMatched.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <p className="text-sm text-muted-foreground">
              {withoutMatched.length} other upcoming meeting{withoutMatched.length !== 1 ? "s" : ""}
            </p>
            <div className="flex-1 border-t border-border/40" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {withoutMatched.map((m) => (
              <MeetingCard key={m.id} meeting={m} onCheckReadiness={handleCheckReadiness} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

type Tab = "team" | "meetings";

export default function Dashboard() {
  const { data: employees, isLoading, error } = useListEmployees();
  const [activeTab, setActiveTab] = useState<Tab>("team");

  return (
    <div className="min-h-[100dvh] bg-background">
      <nav className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border/40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-serif font-medium text-xl tracking-tight text-primary">
            Tapestry.
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-sm text-primary font-medium border-b border-primary pb-0.5">
              Dashboard
            </Link>
            <Link href="/schedule" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Schedule
            </Link>
            <Link href="/onboarding">
              <Button size="sm" variant="outline" className="gap-1.5">
                <PlusCircle className="w-4 h-4" />
                Add Member
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-serif text-primary mb-2">Team Dashboard</h1>
            <p className="text-muted-foreground">
              Real-time context across your distributed team. All times update live.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Link href="/schedule">
              <Button variant="outline" className="gap-2">
                <Calendar className="w-4 h-4" />
                Schedule Meeting
              </Button>
            </Link>
            <Link href="/onboarding">
              <Button className="gap-2 shadow-sm">
                <PlusCircle className="w-4 h-4" />
                Add Member
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-1 border border-border/40">
            <button
              onClick={() => setActiveTab("team")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === "team"
                  ? "bg-background text-primary shadow-sm border border-border/40"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Users className="w-4 h-4" />
              Team Roster
              {employees && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === "team" ? "bg-secondary text-muted-foreground" : "bg-secondary/80 text-muted-foreground/70"}`}>
                  {employees.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("meetings")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === "meetings"
                  ? "bg-background text-primary shadow-sm border border-border/40"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              Upcoming Meetings
            </button>
          </div>

          {activeTab === "meetings" && <CalendarStatusBadge />}

          {activeTab === "team" && (
            <Link href="/schedule">
              <Button size="sm" variant="ghost" className="text-xs gap-1.5 text-muted-foreground hover:text-primary">
                <Sparkles className="w-3.5 h-3.5" />
                Check meeting readiness
              </Button>
            </Link>
          )}
        </div>

        {activeTab === "team" && (
          <>
            {isLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className="h-56 rounded-xl bg-secondary/40 animate-pulse" />
                ))}
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center">
                <p className="text-destructive font-medium">Failed to load employees</p>
                <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
              </div>
            )}

            {!isLoading && !error && employees?.length === 0 && (
              <div className="flex flex-col items-center justify-center py-32 text-center">
                <Users className="w-16 h-16 text-muted-foreground/20 mb-6" />
                <h2 className="text-2xl font-serif text-primary mb-3">No team members yet</h2>
                <p className="text-muted-foreground mb-8 max-w-sm leading-relaxed">
                  Add your first team member to start seeing context-aware scheduling insights.
                </p>
                <Link href="/onboarding">
                  <Button size="lg" className="gap-2 shadow-sm">
                    <PlusCircle className="w-5 h-5" />
                    Add First Team Member
                  </Button>
                </Link>
              </div>
            )}

            {!isLoading && !error && employees && employees.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {employees.map((emp) => (
                  <EmployeeCard key={emp.id} employee={emp as Employee} />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "meetings" && <UpcomingMeetingsTab />}
      </div>
    </div>
  );
}
