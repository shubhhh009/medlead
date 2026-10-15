
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 403 }
      );
    }

    const [totalLeads, newLeads, convertedLeads, lostLeads, totalUsers] =
      await Promise.all([
        prisma.lead.count(),
        prisma.lead.count({ where: { status: "NEW" } }),
        prisma.lead.count({ where: { status: "CONVERTED" } }),
        prisma.lead.count({ where: { status: "LOST" } }),
        prisma.user.count(),
      ]);

    return NextResponse.json({
      success: true,
      dashboard: {
        totalLeads,
        newLeads,
        convertedLeads,
        lostLeads,
        totalUsers,
      },
    });
  } catch (error) {
    console.error("Admin dashboard API failed:", error);

    return NextResponse.json(
      { success: false, message: "Unable to load dashboard" },
      { status: 500 }
    );
  }
}
