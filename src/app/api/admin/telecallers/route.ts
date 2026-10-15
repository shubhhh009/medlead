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

    const telecallers = await prisma.user.findMany({
      where: { role: "TELECALLER" },
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: telecallers,
    });
  } catch (error) {
    console.error("Failed to fetch tele-callers:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch tele-callers" },
      { status: 500 }
    );
  }
}
