import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
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

const validTreatments = [
  "CARDIAC",
  "ORTHOPEDIC",
  "ONCOLOGY",
  "IVF",
  "TRANSPLANT",
  "OTHER",
] as const;

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const params = request.nextUrl.searchParams;
    const search = params.get("search")?.trim() ?? "";
    const status = params.get("status") ?? "";
    const country = params.get("country")?.trim() ?? "";
    const fromDate = params.get("fromDate") ?? "";
    const toDate = params.get("toDate") ?? "";
    const treatment = params.get("treatment") ?? "";
    const validDate = (value: string) => {
  if (!value) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
};

if (!validDate(fromDate) || !validDate(toDate)) {
  return NextResponse.json(
    { success: false, message: "Invalid date filter. Use YYYY-MM-DD." },
    { status: 400 }
  );
}

if (fromDate && toDate && fromDate > toDate) {
  return NextResponse.json(
    {
      success: false,
      message: "Start date must be before or equal to end date.",
    },
    { status: 400 }
  );
}

const startDate = fromDate
  ? new Date(`${fromDate}T00:00:00.000Z`)
  : undefined;

const endDateExclusive = toDate
  ? new Date(
      new Date(`${toDate}T00:00:00.000Z`).getTime() +
        24 * 60 * 60 * 1000
    )
  : undefined;
  
    const requestedPage = Number(params.get("page") ?? "1");
    const requestedLimit = Number(params.get("limit") ?? "10");

    const page =
      Number.isInteger(requestedPage) && requestedPage > 0
        ? requestedPage
        : 1;
    const limit =
      Number.isInteger(requestedLimit) && requestedLimit > 0
        ? Math.min(requestedLimit, 100)
        : 10;

    if (
      status &&
      !validStatuses.includes(status as (typeof validStatuses)[number])
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid status filter" },
        { status: 400 }
      );
    }

    if (
      treatment &&
      !validTreatments.includes(
        treatment as (typeof validTreatments)[number]
      )
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid treatment filter" },
        { status: 400 }
      );
    }

    const where: Prisma.LeadWhereInput = {
      ...(status
        ? { status: status as (typeof validStatuses)[number] }
        : {}),
            ...(treatment
        ? { treatment: treatment as (typeof validTreatments)[number] }
        : {}),
      ...(country
        ? { country: { equals: country, mode: "insensitive" as const } }
        : {}),
      ...(startDate || endDateExclusive
        ? {
            createdAt: {
              ...(startDate ? { gte: startDate } : {}),
              ...(endDateExclusive ? { lt: endDateExclusive } : {}),
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              { fullName: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { phone: { contains: search } },
            ],
          }
        : {}),
      ...(user.role === "TELECALLER" ? { assignedToId: user.id } : {}),
    };

    const [leads, total] = await prisma.$transaction([
      prisma.lead.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          fullName: true,
          country: true,
          phone: true,
          email: true,
          treatment: true,
          preferredCity: true,
          status: true,
          createdAt: true,
          assignedToId: true,
          assignedTo: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.lead.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: leads,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Failed to fetch leads:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch leads" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const fullName =
      typeof body.fullName === "string" ? body.fullName.trim() : "";
    const country =
      typeof body.country === "string" ? body.country.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const description =
      typeof body.description === "string" ? body.description.trim() : "";
    const preferredCity =
      typeof body.preferredCity === "string"
        ? body.preferredCity.trim()
        : "";
    const treatment =
      typeof body.treatment === "string" ? body.treatment : "";

    if (
      !fullName ||
      !country ||
      !phone ||
      !email ||
      !description ||
      !preferredCity ||
      !validTreatments.includes(
        treatment as (typeof validTreatments)[number]
      )
    ) {
      return NextResponse.json(
        { success: false, message: "Please provide all required fields" },
        { status: 400 }
      );
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      fullName.length > 120 ||
      country.length > 100 ||
      phone.length > 30 ||
      email.length > 254 ||
      description.length > 5000 ||
      preferredCity.length > 120
    ) {
      return NextResponse.json(
        { success: false, message: "Please check the submitted field values" },
        { status: 400 }
      );
    }

    const duplicate = await prisma.lead.findFirst({
      where: {
        OR: [{ email }, { phone }],
      },
      select: { id: true },
    });

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          message: "A lead with this email or phone already exists",
        },
        { status: 409 }
      );
    }

    const lead = await prisma.lead.create({
      data: {
        fullName,
        country,
        phone,
        email,
        treatment: treatment as (typeof validTreatments)[number],
        description,
        preferredCity,
        activities: {
          create: {
            action: "LEAD_CREATED",
            details: "Patient inquiry submitted",
          },
        },
      },
      select: {
        id: true,
        fullName: true,
        country: true,
        phone: true,
        email: true,
        treatment: true,
        preferredCity: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Patient inquiry submitted successfully",
        data: lead,
      },
      { status: 201 }
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "A lead with this email or phone already exists",
        },
        { status: 409 }
      );
    }

    console.error("Failed to create lead:", error);
    return NextResponse.json(
      { success: false, message: "Failed to submit patient inquiry" },
      { status: 500 }
    );
  }
}
