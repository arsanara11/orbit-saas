"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TaskStatus, TaskPriority } from "@prisma/client";

// 1. Ambil atau Buatkan Workspace + Project + Tasks milik user yang login
export async function getInitialWorkspaceData() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  // Cari workspace user
  let workspace = await prisma.workspace.findFirst({
    where: {
      memberships: {
        some: {
          userId: session.user.id,
        },
      },
    },
    include: {
      projects: {
        include: {
          tasks: true,
        },
      },
    },
  });

  // Buat workspace otomatis kalau akun baru belum punya
  if (!workspace) {
    const slug = `workspace-${Date.now()}`;
    workspace = await prisma.workspace.create({
      data: {
        name: `${session.user.name}'s Workspace`,
        slug: slug,
        ownerId: session.user.id,
        memberships: {
          create: {
            userId: session.user.id,
            role: "OWNER",
          },
        },
        projects: {
          create: {
            name: "Orbit Workspace",
            description: "Default project",
          },
        },
      },
      include: {
        projects: {
          include: {
            tasks: true,
          },
        },
      },
    });
  }

  // Jika projek belum ada, buatkan default projek
  let project = workspace.projects[0];
  if (!project) {
    project = await prisma.project.create({
      data: {
        name: "Orbit Workspace",
        workspaceId: workspace.id,
      },
      include: {
        tasks: true,
      },
    });
  }

  return {
    user: session.user,
    workspace,
    project,
    tasks: project.tasks,
  };
}

// 2. Tambah Task Baru ke Database
export async function createTaskAction(data: {
  title: string;
  projectId: string;
  status: TaskStatus;
  priority: TaskPriority;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) throw new Error("Unauthorized");

  const newTask = await prisma.task.create({
    data: {
      title: data.title,
      description: "Add a description to keep the team aligned on the next steps.",
      status: data.status,
      priority: data.priority,
      projectId: data.projectId,
      createdById: session.user.id,
      people: [session.user.name.slice(0, 2).toUpperCase()],
    },
  });

  return newTask;
}

// 3. Update Status Task (Move column / Mark Complete)
export async function updateTaskStatusAction(taskId: string, newStatus: TaskStatus) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) throw new Error("Unauthorized");

  const updatedTask = await prisma.task.update({
    where: { id: taskId },
    data: { status: newStatus },
  });

  return updatedTask;
}