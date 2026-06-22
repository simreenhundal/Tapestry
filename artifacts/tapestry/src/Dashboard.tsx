import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import {
  AlertTriangle,
  Clock,
  Globe2,
  Info,
  PlusCircle,
  Loader2,
  Sparkles,
  Calendar,
  Users,
  RefreshCw,
  CalendarDays,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useListEmployees } from "@workspace/api-client-react";

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Employee = {
  id: number;
  name: string;
  email: string;
  city: string;
  country: string;
  timezone: string;
  religion?: string;
  culturalBackground?: string;
  caregivingResponsibilities?: string;
  additionalContext?: string;
  createdAt: string;
};

type Attendee = { email: string; name: string };

type Meeting = {
  id: string;
  title: string;
  start: string;
  end: string;
  provider: "google" | "microsoft";
  attendees: Attendee[];
  matchedEmployees: Employee[];
};

type CalendarStatus = { google: boolean; microsoft: boolean };

type Insight = { insight: string; readiness: string; summary: string };

function getContextFlags(employee: Employee) {
  const flags: string[] = [];
  const religionLower = (employee.religion || "").toLowerCase();
  if (religionLower.includes("islam") || religionLower.includes("muslim")) {
    flags.push("Observes Ramadan — schedule consideration for Feb–Mar annually");
  }
  const caregivingLower = (employee.caregivingResponsibilities || "").toLowerCase();
  if (caregivingLower.includes("school")) flags.push("May have adjusted focus during school holidays");
  if (caregivingLower.includes("elderly")) flags.push("Caregiving responsibilities may affect availability");
  return flags;
}

function EmployeeCard({ employee }: { employee: Employee }) {
  const flags = getContextFlags(employee);
  const [insightLoading, setInsightLoading] = useState(false);
  const [insight, setInsight] = useState<Insight | null>(null);
  const [insightError, setInsightError] = useState<string | null>(null);

  const generateInsight = async () => {
    setInsightLoading(true);
    setInsightError(null);
    try {
      const response = await fetch("/api/context-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(employee),
      });
      if (!response.ok) throw new Error("Failed to generate insight");
      const data = await response.json();
      setInsight(data);
    } catch (err) {
      setInsightError(err instanceof Error ? err.message : "Failed to generate insight");
    } finally {
      setInsightLoading(false);
    }
  };

  let signalColor = "bg-green-500";
  if (insight) {
    if (insight.readiness === "yellow") signalColor = "bg-yellow-500";
    else if (insight.readiness === "red") signalColor = "bg-red-500";
  } else {
    if (flags.length === 1) signalColor = "bg-yellow-500";
    else if (flags.length >= 2) signalColor = "bg-red-500";
  }

  return (
    <Card className="border-border/60 shadow-sm flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-serif text-primary">{employee.name}</CardTitle>
            <div className="text-sm text-muted-foreground flex items-center mt-1">
              <Globe2 className="w-3.5 h-3.5 mr-1.5" />
              {employee.city}, {employee.country}
            </div>
            <div className="text-sm text-muted-foreground flex items-center mt-1">
              <Clock className="w-3.5 h-3.5 mr-1.5" />
              {employee.timezone}
            </div>
          </div>
          <div className="relative flex h-3 w-3 mt-1">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${signalColor}`}></span>
            <span className={`relative inline-flex rounded-full h-3 w-3 ${signalColor}`}></span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col pb-2">
        <div className="flex flex-wrap gap-2 mb-4">
          {employee.religion && (
            <Badge variant="secondary" className="bg-secondary/50 font-normal">{employee.religion}</Badge>
          )}
          {employee.culturalBackground && (
            <Badge variant="secondary" className="bg-secondary/50 font-normal">{employee.culturalBackground}</Badge>
          )}
          {employee.caregivingResponsibilities && employee.caregivingResponsibilities !== "None" && (
            <Badge variant="secondary" className="bg-secondary/50 font-normal">
              Care: {employee.caregivingResponsibilities}
            </Badge>
          )}
        </div>

        <div className="mt-auto space-y-3 pt-4 border-t border-border/40">
          {insightLoading ? (
            <div className="flex flex-col items-center justify-center py-4 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mb-2" />
              <span className="text-xs">Generating AI insight...</span>
            </div>
          ) : insight ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center">
                  <Sparkles className="w-3.5 h-3.5 mr-1 text-primary/70" />
                  AI Insight
                </div>
                {insight.summary && (
                  <Badge variant="outline" className="text-[10px] font-medium bg-background">
                    {insight.summary}
                  </Badge>
                )}
              </div>
              <div className="text-sm text-primary/90 leading-relaxed bg-primary/5 p-3 rounded-md border border-primary/10">
                {insight.insight}
              </div>
            </div>
          ) : flags.length > 0 ? (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Readiness Insights</div>
              {flags.map((flag, idx) => (
                <div key={idx} className="flex items-start text-sm">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 mr-2 shrink-0 mt-0.5" />
                  <span className="text-primary/90">{flag}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-start text-sm">
              <Info className="w-4 h-4 text-green-600 mr-2 shrink-0 mt-0.5" />
              <span className="text-primary/90">No active context flags. Routine scheduling.</span>
            </div>
          )}

          {!insight && employee.additionalContext && (
            <div className="bg-secondary/30 p-3 rounded-md mt-4 text-sm italic text-muted-foreground border border-border/50">
              "{employee.additionalContext}"
            </div>
          )}
          {insightError && (
            <div className="text-xs text-destructive mt-2 text-center">{insightError}</div>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-2 pb-4">
        <Button
          variant="secondary"
          size="sm"
          className="w-full text-xs font-medium bg-secondary/50 hover:bg-secondary/80 text-secondary-foreground"
          onClick={generateInsight}
          disabled={insightLoading}
        >
          {insightLoading ? (
            <><Loader2 className="mr-2 h-3 w-3 animate-spin" />Analyzing...</>
          ) : insight ? (
            <><Sparkles className="mr-2 h-3 w-3" />Refresh Insight</>
          ) : (
            <><Sparkles className="mr-2 h-3 w-3" />Generate AI Insight</>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

function formatTime(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(start: string, end: string) {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60 > 0 ? `${mins % 60}m` : ""}`.trim();
}

function MeetingInsightRow({ employee, meetingDate }: { employee: Employee; meetingDate: string }) {
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState<Insight | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/context-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...employee, meetingDate }),
      });
      if (!res.ok) throw new Error("Failed");
      setInsight(await res.json());
    } catch {
      setError("Could not generate insight");
    } finally {
      setLoading(false);
    }
  };

  const dot =
    insight?.readiness === "red"
      ? "bg-red-500"
      : insight?.readiness === "yellow"
      ? "bg-yellow-500"
      : "bg-green-500";

  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/30 last:border-0">
      <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${dot}`} />
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm text-primary">{employee.name}</div>
        <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3 mt-0.5">
          <span>{employee.city}, {employee.country}</span>
          <span>{employee.timezone}</span>
          {employee.religion && <span>{employee.religion}</span>}
        </div>
        {insight && (
          <div className="mt-2 text-xs bg-primary/5 border border-primary/10 rounded p-2 text-primary/80 leading-relaxed">
            {insight.insight}
          </div>
        )}
        {error && <div className="text-xs text-destructive mt-1">{error}</div>}
      </div>
      <Button
        size="sm"
        variant="ghost"
        className="shrink-0 text-xs h-7 px-2"
        onClick={generate}
        disabled={loading}
      >
        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : insight ? <RefreshCw className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
        <span className="ml-1">{insight ? "Refresh" : "Insight"}</span>
      </Button>
    </div>
  );
}

function MeetingCard({ meeting }: { meeting: Meeting }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge
                variant="outline"
                className={`text-[10px] font-medium shrink-0 ${
                  meeting.provider === "google"
                    ? "border-blue-200 text-blue-700 bg-blue-50"
                    : "border-indigo-200 text-indigo-700 bg-indigo-50"
                }`}
              >
                {meeting.provider === "google" ? "Google" : "Microsoft"}
              </Badge>
              {meeting.matchedEmployees.length > 0 && (
                <Badge className="text-[10px] bg-primary/10 text-primary hover:bg-primary/10 shrink-0">
                  {meeting.matchedEmployees.length} in Tapestry
                </Badge>
              )}
            </div>
            <CardTitle className="text-base font-medium text-primary leading-tight">
              {meeting.title}
            </CardTitle>
          </div>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-2">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatTime(meeting.start)}
          </span>
          <span className="flex items-center gap-1">
            <CalendarDays className="w-3 h-3" />
            {formatDuration(meeting.start, meeting.end)}
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {meeting.attendees.length} attendee{meeting.attendees.length !== 1 ? "s" : ""}
          </span>
        </div>
      </CardHeader>

      {meeting.matchedEmployees.length > 0 && (
        <CardContent className="pt-0">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs justify-between text-muted-foreground hover:text-primary h-8 px-3 mb-1"
            onClick={() => setExpanded(!expanded)}
          >
            <span>Context insights for {meeting.matchedEmployees.length} team member{meeting.matchedEmployees.length !== 1 ? "s" : ""}</span>
            <Sparkles className="w-3 h-3" />
          </Button>

          {expanded && (
            <div className="mt-2">
              {meeting.matchedEmployees.map((emp) => (
                <MeetingInsightRow
                  key={emp.id}
                  employee={emp}
                  meetingDate={meeting.start.split("T")[0]}
                />
              ))}
            </div>
          )}
        </CardContent>
      )}

      {meeting.matchedEmployees.length === 0 && (
        <CardContent className="pt-0 pb-4">
          <p className="text-xs text-muted-foreground italic">
            No participants are onboarded to Tapestry yet.
          </p>
        </CardContent>
      )}
    </Card>
  );
}

function MeetingsTab() {
  const [status, setStatus] = useState<CalendarStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [meetings, setMeetings] = useState<Meeting[] | null>(null);
  const [meetingsLoading, setMeetingsLoading] = useState(false);
  const [meetingsError, setMeetingsError] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/calendar/status");
      if (res.ok) setStatus(await res.json());
    } catch {
      /* silently handled */
    } finally {
      setStatusLoading(false);
    }
  }, []);

  const loadMeetings = useCallback(async () => {
    setMeetingsLoading(true);
    setMeetingsError(null);
    try {
      const res = await fetch("/api/calendar/meetings?hoursAhead=48");
      if (!res.ok) {
        if (res.status === 503) {
          setMeetingsError("No calendar connected.");
        } else {
          setMeetingsError("Failed to load meetings.");
        }
        return;
      }
      const data = await res.json();
      setMeetings(data.meetings ?? []);
    } catch {
      setMeetingsError("Failed to load meetings.");
    } finally {
      setMeetingsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    if (status && (status.google || status.microsoft)) {
      loadMeetings();
    }
  }, [status, loadMeetings]);

  const isConnected = status && (status.google || status.microsoft);

  if (statusLoading) {
    return (
      <div className="flex justify-center items-center py-24 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-3">Checking calendar connections...</span>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center">
        <Calendar className="mx-auto h-14 w-14 text-muted-foreground/40 mb-5" />
        <h2 className="text-2xl font-serif text-primary mb-2">Connect Your Calendar</h2>
        <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
          Tapestry will automatically detect your upcoming meetings, identify participants, and
          surface context insights — before the call starts.
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="border border-border/60 rounded-xl p-5 bg-white text-left hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-sm font-bold text-blue-600">G</div>
              <div>
                <div className="font-medium text-sm text-primary">Google Calendar</div>
                <div className="text-[11px] text-muted-foreground">Google Workspace</div>
              </div>
              {status?.google ? (
                <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />
              ) : (
                <XCircle className="w-4 h-4 text-muted-foreground/40 ml-auto" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {status?.google
                ? "Connected — meetings loading."
                : "Ask your admin to connect Google Calendar in the Tapestry integrations panel."}
            </p>
          </div>

          <div className="border border-border/60 rounded-xl p-5 bg-white text-left hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-sm font-bold text-indigo-600">M</div>
              <div>
                <div className="font-medium text-sm text-primary">Microsoft 365</div>
                <div className="text-[11px] text-muted-foreground">Outlook Calendar</div>
              </div>
              {status?.microsoft ? (
                <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />
              ) : (
                <XCircle className="w-4 h-4 text-muted-foreground/40 ml-auto" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {status?.microsoft
                ? "Connected — meetings loading."
                : "Ask your admin to connect Microsoft 365 in the Tapestry integrations panel."}
            </p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-6">
          Calendar connections are configured by your Tapestry administrator through the Replit integrations panel.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-serif text-primary">Upcoming Meetings</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Next 48 hours · participants matched to Tapestry profiles</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadMeetings} disabled={meetingsLoading} className="text-xs gap-1.5">
          <RefreshCw className={`h-3 w-3 ${meetingsLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {meetingsLoading ? (
        <div className="flex justify-center items-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-3 text-sm">Fetching your calendar...</span>
        </div>
      ) : meetingsError ? (
        <div className="text-center py-16 text-destructive text-sm">{meetingsError}</div>
      ) : !meetings || meetings.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-border/50">
          <CalendarDays className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground text-sm">No meetings in the next 48 hours.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {meetings.map((m) => (
            <MeetingCard key={m.id} meeting={m} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { data: employees, isLoading, isError } = useListEmployees();
  const [activeTab, setActiveTab] = useState<"team" | "meetings">("team");

  return (
    <div className="min-h-[100dvh] bg-secondary/20 p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-serif text-primary">Team Context Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Understand your team's rhythms and responsibilities.
            </p>
          </div>
          <Link
            href="/onboarding"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Team Member
          </Link>
        </div>

        <div className="flex gap-1 bg-secondary/40 rounded-lg p-1 w-fit">
          <button
            onClick={() => setActiveTab("team")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "team"
                ? "bg-white text-primary shadow-sm"
                : "text-muted-foreground hover:text-primary"
            }`}
          >
            <Users className="w-4 h-4" />
            Team Context
          </button>
          <button
            onClick={() => setActiveTab("meetings")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "meetings"
                ? "bg-white text-primary shadow-sm"
                : "text-muted-foreground hover:text-primary"
            }`}
          >
            <Calendar className="w-4 h-4" />
            Upcoming Meetings
          </button>
        </div>

        {activeTab === "team" ? (
          isLoading ? (
            <div className="flex justify-center items-center py-24 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-3">Loading team context...</span>
            </div>
          ) : isError ? (
            <div className="text-center py-24 text-destructive">
              Failed to load employees. Please try again.
            </div>
          ) : !employees || employees.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-xl border border-border/50">
              <Globe2 className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-primary mb-2">No team members yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Add someone to your team to start building a contextual understanding of how they work best.
              </p>
              <Link
                href="/onboarding"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add First Member
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {employees.map((employee) => (
                <EmployeeCard key={employee.id} employee={employee} />
              ))}
            </div>
          )
        ) : (
          <MeetingsTab />
        )}
      </div>
    </div>
  );
}
