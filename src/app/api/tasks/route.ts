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

function displayTask(task: {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: Date | null;
}) {
  const status =
    Object.entries(statusMap).find(
      ([, value]) => value === task.status,
    )?.[0] ?? "To Do";

  const priority =
    Object.entries(priorityMap).find(
      ([, value]) => value === task.priority,
    )?.[0] ?? "Medium";

  return {
    id: task.id,
    title: task.title,
    description: task.description ?? "",
    status,
    priority,
    date: task.dueDate?.toISOString() ?? null,
    progress: 0,
    comments: 0,
    files: 0,
    people: [],
  };
}

async function getSessionUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session?.user ?? null;
}

async function getOrCreateProject(user: { id: string }) {
  const membership = await prisma.membership.findFirst({
    where: { userId: user.id },
    include: {
      workspace: {
        include: {
          projects: {
            orderBy: { createdAt: "asc" },
            take: 1,
          },
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  if (membership) {
    const existingProject = membership.workspace.projects[0];

    if (existingProject) {
      return {
        workspace: membership.workspace,
        project: existingProject,
      };
    }

    const newProject = await prisma.project.create({
      data: {
        name: "Orbit Workspace",
        workspaceId: membership.workspaceId,
      },
    });

    return {
      workspace: membership.workspace,
      project: newProject,
    };
  }

  const workspace = await prisma.workspace.create({
    data: {
      name: "Orbit Workspace",
      slug: `orbit-${user.id}`,
      ownerId: user.id,
      memberships: {
        create: {
          userId: user.id,
          role: "OWNER",
        },
      },
      projects: {
        create: {
          name: "Orbit Workspace",
        },
      },
    },
    include: {
      projects: {
        take: 1,
      },
    },
  });

  const newProject = workspace.projects[0];

  if (!newProject) {
    throw new Error("Gagal membuat project Orbit Workspace.");
  }

  return {
    workspace,
    project: newProject,
  };
}

export async function GET() {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json(
        { error: "Silakan login terlebih dahulu." },
        { status: 401 },
      );
    }

    const { workspace, project } = await getOrCreateProject(user);

    const tasks = await prisma.task.findMany({
      where: {
        projectId: project.id,
        createdById: user.id,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json({
      project: {
        id: project.id,
        name: project.name,
        workspaceId: workspace.id,
      },
      tasks: tasks.map(displayTask),
    });
  } catch (error) {
    console.error("GET /api/tasks failed:", error);

    return NextResponse.json(
      { error: "Gagal memuat task dari database." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json(
        { error: "Silakan login terlebih dahulu." },
        { status: 401 },
      );
    }

    const body = await request.json();
    const title =
      typeof body.title === "string" ? body.title.trim() : "";

    if (!title) {
      return NextResponse.json(
        { error: "Judul task wajib diisi." },
        { status: 400 },
      );
    }

    const status =
      statusMap[body.status as keyof typeof statusMap] ?? "TODO";

    const priority =
      priorityMap[body.priority as keyof typeof priorityMap] ??
      "MEDIUM";

    let dueDate: Date | null = null;

    if (body.date !== undefined && body.date !== null && body.date !== "") {
      if (typeof body.date !== "string") {
        return NextResponse.json(
          { error: "Format tanggal tidak valid." },
          { status: 400 },
        );
      }

      dueDate = new Date(body.date);

      if (Number.isNaN(dueDate.getTime())) {
        return NextResponse.json(
          { error: "Format tanggal tidak valid." },
          { status: 400 },
        );
      }
    }

    const { project } = await getOrCreateProject(user);

    const task = await prisma.task.create({
      data: {
        title,
        description:
          typeof body.description === "string"
            ? body.description
            : "",
        status,
        priority,
        dueDate,
        projectId: project.id,
        createdById: user.id,
      },
    });

    return NextResponse.json(
      { task: displayTask(task) },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/tasks failed:", error);

    return NextResponse.json(
      { error: "Gagal menyimpan task ke database." },
      { status: 500 },
    );
  }
}