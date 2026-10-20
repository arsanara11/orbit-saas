import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const statusMap: Record<
  string,
  "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE"
> = {
  "To Do": "TODO",
  TODO: "TODO",
  "In Progress": "IN_PROGRESS",
  IN_PROGRESS: "IN_PROGRESS",
  "In Review": "IN_REVIEW",
  IN_REVIEW: "IN_REVIEW",
  Done: "DONE",
  DONE: "DONE",
};

const statusLabels: Record<string, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  DONE: "Done",
};

const priorityMap: Record<
  string,
  "LOW" | "MEDIUM" | "HIGH" | "URGENT"
> = {
  Low: "LOW",
  LOW: "LOW",
  Medium: "MEDIUM",
  MEDIUM: "MEDIUM",
  High: "HIGH",
  HIGH: "HIGH",
  Urgent: "URGENT",
  URGENT: "URGENT",
};

const priorityLabels: Record<string, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

type RouteContext = {
  params: Promise<{ id: string }>;
};

function displayTask(task: {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: Date | null;
}) {
  return {
    id: task.id,
    title: task.title,
    description: task.description ?? "",
    status: statusLabels[task.status] ?? "To Do",
    priority: priorityLabels[task.priority] ?? "Medium",
    date: task.dueDate?.toISOString() ?? null,
    progress: 0,
    comments: 0,
    files: 0,
    people: [],
  };
}

export async function PATCH(
  request: Request,
  context: RouteContext,
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Silakan login terlebih dahulu." },
        { status: 401 },
      );
    }

    const { id } = await context.params;
    const body = await request.json();

    const existing = await prisma.task.findFirst({
      where: {
        id,
        createdById: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Task tidak ditemukan atau akses ditolak." },
        { status: 404 },
      );
    }

    const data: {
      title?: string;
      description?: string;
      status?: "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
      priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
      dueDate?: Date | null;
    } = {};

    if (typeof body.title === "string") {
      const title = body.title.trim();

      if (!title) {
        return NextResponse.json(
          { error: "Judul task tidak boleh kosong." },
          { status: 400 },
        );
      }

      data.title = title;
    }

    if (typeof body.description === "string") {
      data.description = body.description;
    }

    if (typeof body.status === "string") {
      const status = statusMap[body.status];

      if (!status) {
        return NextResponse.json(
          { error: "Status task tidak valid." },
          { status: 400 },
        );
      }

      data.status = status;
    }

    if (typeof body.priority === "string") {
      const priority = priorityMap[body.priority];

      if (!priority) {
        return NextResponse.json(
          { error: "Prioritas task tidak valid." },
          { status: 400 },
        );
      }

      data.priority = priority;
    }

    if (body.date !== undefined) {
      if (body.date === null || body.date === "") {
        data.dueDate = null;
      } else if (typeof body.date === "string") {
        const dueDate = new Date(body.date);

        if (Number.isNaN(dueDate.getTime())) {
          return NextResponse.json(
            { error: "Format tanggal tidak valid." },
            { status: 400 },
          );
        }

        data.dueDate = dueDate;
      } else {
        return NextResponse.json(
          { error: "Format tanggal tidak valid." },
          { status: 400 },
        );
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "Tidak ada perubahan task yang dikirim." },
        { status: 400 },
      );
    }

    const task = await prisma.task.update({
      where: { id },
      data,
    });

    return NextResponse.json({
      task: displayTask(task),
    });
  } catch (error) {
    console.error("PATCH /api/tasks/[id] failed:", error);

    return NextResponse.json(
      { error: "Gagal memperbarui task." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext,
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Silakan login terlebih dahulu." },
        { status: 401 },
      );
    }

    const { id } = await context.params;

    const deleted = await prisma.task.deleteMany({
      where: {
        id,
        createdById: session.user.id,
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json(
        { error: "Task tidak ditemukan atau akses ditolak." },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/tasks/[id] failed:", error);

    return NextResponse.json(
      { error: "Gagal menghapus task." },
      { status: 500 },
    );
  }
}
