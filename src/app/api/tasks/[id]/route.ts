
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const statusMap: Record<string, string> = {
  "To Do": "TODO",
  "In Progress": "IN_PROGRESS",
  "In Review": "IN_REVIEW",
  Done: "DONE",
};

const priorityMap: Record<string, string> = {
  Low: "LOW",
  Medium: "MEDIUM",
  High: "HIGH",
  Urgent: "URGENT",
};

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(
  request: Request,
  { params }: RouteContext,
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: "Silakan login terlebih dahulu." },
        { status: 401 },
      );
    }

    const { id } = await params;
    const body: unknown = await request.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Data update tidak valid." },
        { status: 400 },
      );
    }

    const data = body as Record<string, unknown>;

    const existing = await prisma.task.findFirst({
      where: {
        id,
        project: {
          workspace: {
            OR: [
              { ownerId: session.user.id },
              {
                memberships: {
                  some: { userId: session.user.id },
                },
              },
            ],
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Task tidak ditemukan atau akses ditolak." },
        { status: 404 },
      );
    }

    const updateData: {
      title?: string;
      description?: string | null;
      status?: "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
      priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
      dueDate?: Date | null;
    } = {};

    if ("title" in data) {
      if (
        typeof data.title !== "string" ||
        !data.title.trim() ||
        data.title.trim().length > 200
      ) {
        return NextResponse.json(
          { error: "Judul task tidak valid." },
          { status: 400 },
        );
      }

      updateData.title = data.title.trim();
    }

    if ("description" in data) {
      if (
        data.description !== null &&
        typeof data.description !== "string"
      ) {
        return NextResponse.json(
          { error: "Deskripsi tidak valid." },
          { status: 400 },
        );
      }

      updateData.description =
        typeof data.description === "string"
          ? data.description.trim()
          : null;
    }

    if ("status" in data) {
      if (
        typeof data.status !== "string" ||
        !statusMap[data.status]
      ) {
        return NextResponse.json(
          { error: "Status task tidak valid." },
          { status: 400 },
        );
      }

      updateData.status = statusMap[data.status] as
        | "TODO"
        | "IN_PROGRESS"
        | "IN_REVIEW"
        | "DONE";
    }

    if ("priority" in data) {
      if (
        typeof data.priority !== "string" ||
        !priorityMap[data.priority]
      ) {
        return NextResponse.json(
          { error: "Prioritas task tidak valid." },
          { status: 400 },
        );
      }

      updateData.priority = priorityMap[data.priority] as
        | "LOW"
        | "MEDIUM"
        | "HIGH"
        | "URGENT";
    }

    if ("date" in data) {
      if (data.date === null || data.date === "") {
        updateData.dueDate = null;
      } else {
        const date = new Date(String(data.date));

        if (Number.isNaN(date.getTime())) {
          return NextResponse.json(
            { error: "Tanggal task tidak valid." },
            { status: 400 },
          );
        }

        updateData.dueDate = date;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "Tidak ada perubahan yang dikirim." },
        { status: 400 },
      );
    }

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ task });
  } catch (error) {
    console.error("PATCH /api/tasks/[id]:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui task." },
      { status: 500 },
    );
  }
}
