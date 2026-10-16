import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
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

    if (user.role !== "ADMIN" && lead.assignedToId !== user.id) {
      return NextResponse.json(
        { success: false, message: "You are not authorized to access these follow-ups" },
        { status: 403 }
      );
    }

    const followUps = await prisma.followUp.findMany({
      where: { leadId: id },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
      },
      orderBy: [{ completedAt: "asc" }, { dueAt: "asc" }],
    });

    return NextResponse.json({ success: true, data: followUps });
  } catch (error) {
    console.error("Failed to fetch follow-ups:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch follow-ups" },
      { status: 500 }
    );
  }
}

export async function POST(
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

    const dueAt =
      typeof body.dueAt === "string" ? new Date(body.dueAt) : new Date("");
    const note = typeof body.note === "string" ? body.note.trim() : "";

    if (Number.isNaN(dueAt.getTime())) {
      return NextResponse.json(
        { success: false, message: "A valid follow-up date and time is required" },
        { status: 400 }
      );
    }

    if (note.length > 1000) {
      return NextResponse.json(
        { success: false, message: "Follow-up note must be 1000 characters or fewer" },
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

    if (user.role !== "ADMIN" && lead.assignedToId !== user.id) {
      return NextResponse.json(
        { success: false, message: "You are not authorized to schedule follow-ups for this lead" },
        { status: 403 }
      );
    }

    let assignedToId = lead.assignedToId;

    if (user.role === "ADMIN" && typeof body.assignedToId === "string") {
      const assignee = await prisma.user.findUnique({
        where: { id: body.assignedToId },
        select: { id: true, role: true },
      });

      if (!assignee || assignee.role !== "TELECALLER") {
        return NextResponse.json(
          { success: false, message: "Select a valid tele-caller" },
          { status: 400 }
        );
      }

      assignedToId = assignee.id;
    }

    if (!assignedToId) {
      return NextResponse.json(
        { success: false, message: "Assign this lead to a tele-caller before scheduling a follow-up" },
        { status: 400 }
      );
    }

    const followUp = await prisma.$transaction(async (tx) => {
      const created = await tx.followUp.create({
        data: {
          leadId: id,
          assignedToId,
          dueAt,
          note: note || null,
        },
        include: {
          assignedTo: { select: { id: true, name: true, email: true } },
        },
      });

      await tx.leadActivity.create({
        data: {
          leadId: id,
          actorId: user.id,
          action: "FOLLOW_UP_SCHEDULED",
          details: `Follow-up scheduled for ${dueAt.toLocaleString()}${note ? ` — ${note}` : ""}`,
        },
      });

      return created;
    });

    return NextResponse.json(
      { success: true, message: "Follow-up scheduled successfully", data: followUp },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to schedule follow-up:", error);
    return NextResponse.json(
      { success: false, message: "Failed to schedule follow-up" },
      { status: 500 }
    );
  }
}
