import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; followUpId: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const { id, followUpId } = await params;

    const followUp = await prisma.followUp.findFirst({
      where: { id: followUpId, leadId: id },
      include: {
        lead: { select: { id: true, assignedToId: true } },
      },
    });

    if (!followUp) {
      return NextResponse.json(
        { success: false, message: "Follow-up not found" },
        { status: 404 }
      );
    }

    if (user.role !== "ADMIN" && followUp.lead.assignedToId !== user.id) {
      return NextResponse.json(
        { success: false, message: "You are not authorized to update this follow-up" },
        { status: 403 }
      );
    }

    if (followUp.completedAt) {
      return NextResponse.json(
        { success: false, message: "This follow-up is already completed" },
        { status: 409 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.followUp.update({
        where: { id: followUpId },
        data: { completedAt: new Date() },
        include: {
          assignedTo: { select: { id: true, name: true, email: true } },
        },
      });

      await tx.leadActivity.create({
        data: {
          leadId: id,
          actorId: user.id,
          action: "FOLLOW_UP_COMPLETED",
          details: `Follow-up completed${followUp.note ? ` — ${followUp.note}` : ""}`,
        },
      });

      return result;
    });

    return NextResponse.json({
      success: true,
      message: "Follow-up marked as completed",
      data: updated,
    });
  } catch (error) {
    console.error("Failed to complete follow-up:", error);
    return NextResponse.json(
      { success: false, message: "Failed to complete follow-up" },
      { status: 500 }
    );
  }
}
