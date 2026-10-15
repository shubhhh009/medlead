import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const validStatuses = [
  "NEW",
  "CONTACTED",
  "REPORTS_RECEIVED",
  "QUOTATION_SENT",
  "TRAVEL_PLANNED",
  "CONVERTED",
  "LOST",
] as const;

type LeadStatus = (typeof validStatuses)[number];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const status = body.status;

    if (
      typeof status !== "string" ||
      !validStatuses.includes(status as LeadStatus)
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid lead status" },
        { status: 400 }
      );
    }

    const existingLead = await prisma.lead.findUnique({
      where: { id },
      select: { id: true, status: true, assignedToId: true },
    });

    if (!existingLead) {
      return NextResponse.json(
        { success: false, message: "Lead not found" },
        { status: 404 }
      );
    }

    if (user.role !== "ADMIN" && existingLead.assignedToId !== user.id) {
      return NextResponse.json(
        { success: false, message: "You are not authorized to update this lead" },
        { status: 403 }
      );
    }

    const updatedLead = await prisma.lead.update({
      where: { id },
      data: {
        status: status as LeadStatus,
        activities: {
          create: {
            action: "STATUS_UPDATED",
            details: `Status changed from ${existingLead.status} to ${status}`,
            actorId: user.id,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Lead status updated successfully",
      data: updatedLead,
    });
  } catch (error) {
    console.error("Failed to update lead status:", error);

    return NextResponse.json(
      { success: false, message: "Failed to update lead status" },
      { status: 500 }
    );
  }
}
