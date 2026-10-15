
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
        { success: false, message: "You are not authorized to access this lead's notes" },
        { status: 403 }
      );
    }

    const notes = await prisma.note.findMany({
      where: { leadId: id },
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: notes });
  } catch (error) {
    console.error("Failed to fetch notes:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch notes" },
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
    const content =
      typeof body.content === "string" ? body.content.trim() : "";

    if (!content) {
      return NextResponse.json(
        { success: false, message: "Note content is required" },
        { status: 400 }
      );
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { success: false, message: "Note must be 2000 characters or fewer" },
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
        { success: false, message: "You are not authorized to access this lead's notes" },
        { status: 403 }
      );
    }

    const note = await prisma.$transaction(async (tx) => {
      const createdNote = await tx.note.create({
        data: {
          leadId: id,
          authorId: user.id,
          content,
        },
        include: {
          author: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      await tx.leadActivity.create({
        data: {
          leadId: id,
          actorId: user.id,
          action: "NOTE_ADDED",
          details: `Note added by ${user.name}`,
        },
      });

      return createdNote;
    });

    return NextResponse.json(
      {
        success: true,
        message: "Note added successfully",
        data: note,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to add note:", error);
    return NextResponse.json(
      { success: false, message: "Failed to add note" },
      { status: 500 }
    );
  }
}
