import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, message: "Authentication required" }, { status: 401 });
    if (user.role !== "ADMIN") return NextResponse.json({ success: false, message: "Admin access required" }, { status: 403 });

    const [totalLeads, newLeads, convertedLeads, lostLeads, totalUsers, statusGroups, countryGroups, telecallers, followUpsDueToday, overdueFollowUps] = await Promise.all([
      prisma.lead.count(),
      prisma.lead.count({ where: { status: "NEW" } }),
      prisma.lead.count({ where: { status: "CONVERTED" } }),
      prisma.lead.count({ where: { status: "LOST" } }),
      prisma.user.count(),
      prisma.lead.groupBy({ by: ["status"], _count: { _all: true }, orderBy: { status: "asc" } }),
      prisma.lead.groupBy({ by: ["country"], _count: { _all: true }, orderBy: { _count: { country: "desc" } }, take: 10 }),
      prisma.user.findMany({ where: { role: "TELECALLER" }, select: { id: true, name: true, email: true, _count: { select: { assignedLeads: true } }, assignedLeads: { where: { status: "CONVERTED" }, select: { id: true } } }, orderBy: { name: "asc" } }),
      prisma.followUp.count({ where: { dueAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)), lt: new Date(new Date().setHours(24, 0, 0, 0)) }, completedAt: null } }),
      prisma.followUp.count({ where: { dueAt: { lt: new Date() }, completedAt: null } }),
    ]);

    return NextResponse.json({ success: true, dashboard: {
      totalLeads, newLeads, convertedLeads, lostLeads, totalUsers,
      conversionRate: totalLeads > 0 ? Number(((convertedLeads / totalLeads) * 100).toFixed(2)) : 0,
      statusDistribution: statusGroups.map((item) => ({ status: item.status, count: item._count._all })),
      countryDistribution: Object.values(
        countryGroups.reduce<Record<string, { country: string; count: number }>>((acc, item) => {
          const country = item.country.trim().toLowerCase();
          if (!country) return acc;

          if (!acc[country]) {
            acc[country] = {
              country: country.charAt(0).toUpperCase() + country.slice(1),
              count: 0,
            };
          }

          acc[country].count += item._count._all;
          return acc;
        }, {})
      )
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      telecallerPerformance: telecallers.map((item) => ({ id: item.id, name: item.name, email: item.email, assignedLeads: item._count.assignedLeads, convertedLeads: item.assignedLeads.length, conversionRate: item._count.assignedLeads > 0 ? Number(((item.assignedLeads.length / item._count.assignedLeads) * 100).toFixed(2)) : 0 })),
      followUpsDueToday, overdueFollowUps,
    } });
  } catch (error) {
    console.error("Admin dashboard API failed:", error);
    return NextResponse.json({ success: false, message: "Unable to load dashboard" }, { status: 500 });
  }
}
