import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const statusMap = {
  "To Do": "TODO",
  "In Progress": "IN_PROGRESS",
  "In Review": "IN_REVIEW",
  Done: "DONE",
} as const;

const priorityMap = {
  Low: "LOW",
  Medium: "MEDIUM",
  High: "HIGH",
  Urgent: "URGENT",
} as const;

async function getCurrentUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session?.user ?? null;
}

async function getDefaultProject(userId: string) {
  const existing = await prisma.project.findFirst({
    where: {
      workspace: {
        OR: [
          { ownerId: userId },
          { memberships: { some: { userId } } },
        ],
      },
    },
    orderBy: { createdAt: "asc" },
  });

  if (existing) return existing;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) return null;

  return prisma.$transaction(async (tx) => {
    // Check again inside the transaction to avoid creating
    // a duplicate default project in ordinary concurrent requests.
    const project = await tx.project.findFirst({
      where: {
        workspace: {
          OR: [
            { ownerId: userId },
            { memberships: { some: { userId } } },
          ],
        },
      },
      orderBy: { createdAt: "asc" },
    });

    if (project) return project;

    const workspace = await tx.workspace.create({
      data: {
        name: "Orbit Workspace",
        slug: `orbit-${userId}`,
        ownerId: userId,
        memberships: {
          create: { userId, role: "OWNER" },
        },
        projects: {
          create: { name: "My Tasks" },
        },
      },
      include: { projects: true },
    });

    return workspace.projects[0] ?? null;
  });
}


function serializeTask(task: {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  const statuses: Record<string, string> = {
    TODO: "To Do",
    IN_PROGRESS: "In Progress",
    IN_REVIEW: "In Review",
    DONE: "Done",
  };

  const priorities: Record<string, string> = {
    LOW: "Low",
    MEDIUM: "Medium",
    HIGH: "High",
    URGENT: "Urgent",
  };

  return {
    ...task,
    status: statuses[task.status] ?? "To Do",
    priority: priorities[task.priority] ?? "Medium",
    date: task.dueDate,
  };
}


export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Silakan login terlebih dahulu." },
        { status: 401 },
      );
    }

    const project = await getDefaultProject(user.id);

    if (!project) {
      return NextResponse.json(
        { error: "Project belum tersedia." },
        { status: 404 },
      );
    }

    const tasks = await prisma.task.findMany({
      where: { projectId: project.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      project: { id: project.id, name: project.name },
      tasks: tasks.map(serializeTask),
    });
  } catch (error) {
    console.error("GET /api/tasks:", error);
    return NextResponse.json(
      { error: "Gagal mengambil task." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Silakan login terlebih dahulu." },
        { status: 401 },
      );
    }

    const body: unknown = await request.json();

    if (
      !body ||
      typeof body !== "object" ||
      !("title" in body) ||
      typeof body.title !== "string" ||
      !body.title.trim()
    ) {
      return NextResponse.json(
        { error: "Judul task wajib diisi." },
        { status: 400 },
      );
    }

    const data = body as Record<string, unknown>;
    const title = (data.title as string).trim();

    if (title.length > 200) {
      return NextResponse.json(
        { error: "Judul maksimal 200 karakter." },
        { status: 400 },
      );
    }

    const status =
      typeof data.status === "string" &&
      data.status in statusMap
        ? statusMap[data.status as keyof typeof statusMap]
        : "TODO";

    const priority =
      typeof data.priority === "string" &&
      data.priority in priorityMap
        ? priorityMap[data.priority as keyof typeof priorityMap]
        : "MEDIUM";

    let dueDate: Date | undefined;

    if (data.date) {
      dueDate = new Date(String(data.date));

      if (Number.isNaN(dueDate.getTime())) {
        return NextResponse.json(
          { error: "Tanggal task tidak valid." },
          { status: 400 },
        );
      }
    }

    const project = await getDefaultProject(user.id);

    if (!project) {
      return NextResponse.json(
        { error: "Project belum tersedia." },
        { status: 404 },
      );
    }

    const task = await prisma.task.create({
      data: {
        title,
        description:
          typeof data.description === "string"
            ? data.description.trim()
            : null,
        status,
        priority,
        ...(dueDate ? { dueDate } : {}),
        projectId: project.id,
        createdById: user.id,
      },
    });

    return NextResponse.json(
      { task: serializeTask(task) },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/tasks:", error);
    return NextResponse.json(
      { error: "Gagal membuat task." },
      { status: 500 },
    );
  }
}
