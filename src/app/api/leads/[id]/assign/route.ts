import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getCurrentUser();

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    if (admin.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const assignedToId = body.assignedToId;

    if (typeof assignedToId !== "string" || !assignedToId.trim()) {
      return NextResponse.json(
        { success: false, message: "assignedToId is required" },
        { status: 400 }
      );
    }

    const lead = await prisma.lead.findUnique({
      where: { id },
      select: { id: true, assignedToId: true },
    });

    if (!lead) {
      return NextResponse.json(
        { success: false, message: "Lead not found" },
        { status: 404 }
      );
    }

    const telecaller = await prisma.user.findUnique({
      where: { id: assignedToId },
      select: { id: true, name: true, role: true },
    });

    if (!telecaller || telecaller.role !== "TELECALLER") {
      return NextResponse.json(
        { success: false, message: "Valid tele-caller not found" },
        { status: 400 }
      );
    }

    const updatedLead = await prisma.$transaction(async (tx) => {
      const updated = await tx.lead.update({
        where: { id },
        data: { assignedToId: telecaller.id },
        include: {
          assignedTo: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      await tx.leadActivity.create({
        data: {
          leadId: id,
          actorId: admin.id,
          action: "LEAD_ASSIGNED",
          details: lead.assignedToId
            ? `Lead reassigned to ${telecaller.name}`
            : `Lead assigned to ${telecaller.name}`,
        },
      });

      return updated;
    });

    return NextResponse.json({
      success: true,
      message: "Lead assigned successfully",
      data: updatedLead,
    });
  } catch (error) {
    console.error("Failed to assign lead:", error);

    return NextResponse.json(
      { success: false, message: "Failed to assign lead" },
      { status: 500 }
    );
  }
}
