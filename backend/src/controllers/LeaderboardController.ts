import { Controller, Get, Route, Tags } from "tsoa";
import { prisma } from "../lib/prisma";

interface LeaderboardUser {
  id: string;
  name: string;
  picture: string | null;
}

interface WeeklyLeader {
  user: LeaderboardUser;
  totalSeconds: number;
  sessionCount: number;
}

interface AllTimeLeader {
  user: LeaderboardUser;
  totalSeconds: number;
  sessionCount: number;
  streak: number;
}

interface LeaderboardResponse {
  weeklyChampion: WeeklyLeader | null;
  monthlyChampion: WeeklyLeader | null;
  allTimeChampion: AllTimeLeader | null;
  weeklyTop: WeeklyLeader[];
  allTimeTop: AllTimeLeader[];
  globalStats: {
    totalSessions: number;
    totalMinutes: number;
    activeUsers: number;
  };
  chartData: {
    week: { label: string; minutes: number }[];
    month: { label: string; minutes: number }[];
    year: { label: string; minutes: number }[];
  };
  funFacts: string[];
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  // Monday is day 1, Sunday is day 0. Adjust to start from Monday.
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(date: Date): Date {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatHours(seconds: number): string {
  const hours = Math.round((seconds / 3600) * 10) / 10;
  return hours.toFixed(1);
}

@Route("api/leaderboard")
@Tags("Leaderboard")
export class LeaderboardController extends Controller {
  /**
   * Get leaderboard stats for all users.
   */
  @Get("/")
  public async getLeaderboard(): Promise<LeaderboardResponse> {
    const weekStart = startOfWeek(new Date());
    const monthStart = startOfMonth(new Date());

    // Get all session logs with user info
    const allLogs = await prisma.sessionLog.findMany({
      include: { user: true },
    });

    // This week's logs
    const weekLogs = allLogs.filter((l) => new Date(l.startedAt) >= weekStart);

    // This month's logs
    const monthLogs = allLogs.filter((l) => new Date(l.startedAt) >= monthStart);

    // Aggregate by user for this week
    const weeklyByUser: Record<
      string,
      { user: LeaderboardUser; totalSeconds: number; sessionCount: number }
    > = {};
    for (const log of weekLogs) {
      if (!weeklyByUser[log.userId]) {
        weeklyByUser[log.userId] = {
          user: { id: log.user.id, name: log.user.name, picture: log.user.picture },
          totalSeconds: 0,
          sessionCount: 0,
        };
      }
      weeklyByUser[log.userId].totalSeconds += log.durationSeconds;
      weeklyByUser[log.userId].sessionCount += 1;
    }

    const weeklyTop = Object.values(weeklyByUser)
      .sort((a, b) => b.totalSeconds - a.totalSeconds)
      .slice(0, 10);

    // Aggregate by user for this month
    const monthlyByUser: Record<
      string,
      { user: LeaderboardUser; totalSeconds: number; sessionCount: number }
    > = {};
    for (const log of monthLogs) {
      if (!monthlyByUser[log.userId]) {
        monthlyByUser[log.userId] = {
          user: { id: log.user.id, name: log.user.name, picture: log.user.picture },
          totalSeconds: 0,
          sessionCount: 0,
        };
      }
      monthlyByUser[log.userId].totalSeconds += log.durationSeconds;
      monthlyByUser[log.userId].sessionCount += 1;
    }

    const monthlyTop = Object.values(monthlyByUser).sort((a, b) => b.totalSeconds - a.totalSeconds);

    // All-time aggregation
    const allTimeByUser: Record<
      string,
      { user: LeaderboardUser; totalSeconds: number; sessionCount: number; days: Set<string> }
    > = {};
    for (const log of allLogs) {
      if (!allTimeByUser[log.userId]) {
        allTimeByUser[log.userId] = {
          user: { id: log.user.id, name: log.user.name, picture: log.user.picture },
          totalSeconds: 0,
          sessionCount: 0,
          days: new Set(),
        };
      }
      allTimeByUser[log.userId].totalSeconds += log.durationSeconds;
      allTimeByUser[log.userId].sessionCount += 1;
      allTimeByUser[log.userId].days.add(new Date(log.startedAt).toDateString());
    }

    // Calculate streak (simplified: unique training days)
    const allTimeTop: AllTimeLeader[] = Object.values(allTimeByUser)
      .sort((a, b) => b.totalSeconds - a.totalSeconds)
      .slice(0, 10)
      .map((u) => ({
        user: u.user,
        totalSeconds: u.totalSeconds,
        sessionCount: u.sessionCount,
        streak: u.days.size,
      }));

    // Weekly champion
    const weeklyChampion = weeklyTop[0] || null;

    // Monthly champion
    const monthlyChampion = monthlyTop[0] || null;

    // All-time champion
    const allTimeChampion = allTimeTop[0] || null;

    // Global stats (all time)
    const uniqueUsers = new Set(allLogs.map((l) => l.userId));
    const globalStats = {
      totalSessions: allLogs.length,
      totalMinutes: Math.round(allLogs.reduce((s, l) => s + l.durationSeconds, 0) / 60),
      activeUsers: uniqueUsers.size,
    };

    // Chart data - weekly (Mon-Sun)
    const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const weekChartData = weekDays.map((label, i) => {
      // Map index to JS day: Mon=1, Tue=2, ..., Sat=6, Sun=0
      const jsDay = i === 6 ? 0 : i + 1;
      const dayLogs = weekLogs.filter((l) => new Date(l.startedAt).getDay() === jsDay);
      return {
        label,
        minutes: Math.round(dayLogs.reduce((s, l) => s + l.durationSeconds, 0) / 60),
      };
    });

    // Chart data - monthly (last 4 weeks)
    const monthChartData: { label: string; minutes: number }[] = [];
    for (let i = 3; i >= 0; i--) {
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() - i * 7);
      const weekBegin = new Date(weekEnd);
      weekBegin.setDate(weekBegin.getDate() - 7);
      const wkLogs = allLogs.filter((l) => {
        const d = new Date(l.startedAt);
        return d >= weekBegin && d < weekEnd;
      });
      monthChartData.push({
        label: `W${4 - i}`,
        minutes: Math.round(wkLogs.reduce((s, l) => s + l.durationSeconds, 0) / 60),
      });
    }

    // Chart data - yearly (last 12 months)
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const yearChartData: { label: string; minutes: number }[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mEnd = new Date(m.getFullYear(), m.getMonth() + 1, 1);
      const mLogs = allLogs.filter((l) => {
        const d = new Date(l.startedAt);
        return d >= m && d < mEnd;
      });
      yearChartData.push({
        label: monthNames[m.getMonth()],
        minutes: Math.round(mLogs.reduce((s, l) => s + l.durationSeconds, 0) / 60),
      });
    }

    const chartData = {
      week: weekChartData,
      month: monthChartData,
      year: yearChartData,
    };

    // Fun facts
    const funFacts: string[] = [];

    const totalHoursAllTime = Math.round(allLogs.reduce((s, l) => s + l.durationSeconds, 0) / 3600);
    if (totalHoursAllTime > 0) {
      funFacts.push(`💪 Our community has trained for ${totalHoursAllTime} hours total!`);
    }

    const totalExercises = allLogs.reduce((s, l) => s + l.exerciseCount, 0);
    if (totalExercises > 100) {
      funFacts.push(
        `🎯 ${totalExercises.toLocaleString()} exercises completed across all sessions!`,
      );
    }

    if (weeklyChampion) {
      funFacts.push(
        `🏆 ${weeklyChampion.user.name.split(" ")[0]} is crushing it with ${formatHours(weeklyChampion.totalSeconds)}h this week!`,
      );
    }

    const avgSessionLength =
      allLogs.length > 0
        ? Math.round(allLogs.reduce((s, l) => s + l.durationSeconds, 0) / allLogs.length / 60)
        : 0;
    if (avgSessionLength > 0) {
      funFacts.push(`⏱️ Average session length: ${avgSessionLength} minutes`);
    }

    const weeklyActiveUsers = Object.keys(weeklyByUser).length;
    if (weeklyActiveUsers > 1) {
      funFacts.push(`🔥 ${weeklyActiveUsers} climbers active this week!`);
    }

    return {
      weeklyChampion,
      monthlyChampion,
      allTimeChampion,
      weeklyTop,
      allTimeTop,
      globalStats,
      chartData,
      funFacts,
    };
  }
}
