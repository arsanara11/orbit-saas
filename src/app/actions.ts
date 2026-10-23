"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type TaskStatusType = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
type TaskPriorityType = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

// Data dummy dari UI kamu yang akan dipindahkan jadi data asli di Database
const defaultInitialTasks = [
  {
    title: "New task",
    description:
      "Involves creating and assigning a new task within the project management system. The team can collaborate and track progress here.",
    status: "TODO" as TaskStatusType,
    priority: "MEDIUM" as TaskPriorityType,
    progress: 0,
    commentCount: 2,
    fileCount: 1,
    people: ["NS", "AR"],
  },
  {
    title: "Planning meeting for second option of the dashboard",
    description:
      "Focus on strategizing and outlining the development of the second option for the dashboard.",
    status: "IN_PROGRESS" as TaskStatusType,
    priority: "MEDIUM" as TaskPriorityType,
    progress: 65,
    commentCount: 7,
    fileCount: 2,
    people: ["NS", "MK"],
  },
  {
    title: "Finish the ideation",
    description:
      "The team will conclude the ideation phase by finalizing and refining concepts that have been discussed.",
    status: "IN_PROGRESS" as TaskStatusType,
    priority: "HIGH" as TaskPriorityType,
    progress: 75,
    commentCount: 34,
    fileCount: 12,
    people: ["NS", "AR", "MK"],
  },
  {
    title: "Preparation low-fidelity for mobile",
    description:
      "Involves creating low-fidelity wireframes specifically for the mobile version of the project.",
    status: "IN_PROGRESS" as TaskStatusType,
    priority: "LOW" as TaskPriorityType,
    progress: 30,
    commentCount: 3,
    fileCount: 1,
    people: ["AR", "MK"],
  },
  {
    title: "Business model canvas of product",
    description:
      "Developing a comprehensive Business Model Canvas for the product, outlining the key components.",
    status: "IN_REVIEW" as TaskStatusType,
    priority: "LOW" as TaskPriorityType,
    progress: 90,
    commentCount: 5,
    fileCount: 3,
    people: ["NS", "MK"],
  },
];

export async function getInitialWorkspaceData() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  // 1. Ambil atau Buat Workspace milik user
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
          tasks: {
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });

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
            description: "Plan, collaborate, and ship great work together.",
          },
        },
      },
      include: {
        projects: {
          include: {
            tasks: {
              orderBy: { createdAt: "asc" },
            },
          },
        },
      },
    });
  }

  let project = workspace.projects[0];
  if (!project) {
    project = await prisma.project.create({
      data: {
        name: "Orbit Workspace",
        description: "Plan, collaborate, and ship great work together.",
        workspaceId: workspace.id,
      },
      include: {
        tasks: {
          orderBy: { createdAt: "asc" },
        },
      },
    });
  }

  // 2. Jika project belum punya data, isi otomatis dengan 5 Data Dummy UI ke DB
  if (!project.tasks || project.tasks.length === 0) {
    await prisma.task.createMany({
      data: defaultInitialTasks.map((task) => ({
        ...task,
        projectId: project.id,
        createdById: session.user.id,
      })),
    });

    const updatedProject = await prisma.project.findUnique({
      where: { id: project.id },
      include: {
        tasks: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (updatedProject) {
      project = updatedProject;
    }
  }

  return {
    user: session.user,
    workspace,
    project,
    tasks: project.tasks,
  };
}

// Action: Tambah Task Baru ke DB
export async function createTaskAction(data: {
  title: string;
  projectId: string;
  status: TaskStatusType;
  priority: TaskPriorityType;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) throw new Error("Unauthorized");

  const userInitials = session.user.name
    ? session.user.name.slice(0, 2).toUpperCase()
    : "US";

  const newTask = await prisma.task.create({
    data: {
      title: data.title,
      description:
        "Add a description to keep the team aligned on the next steps.",
      status: data.status,
      priority: data.priority,
      projectId: data.projectId,
      createdById: session.user.id,
      people: [userInitials],
    },
  });

  return newTask;
}

// Action: Ganti Status Task di DB (Move column)
export async function updateTaskStatusAction(
  taskId: string,
  newStatus: TaskStatusType
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) throw new Error("Unauthorized");

  return await prisma.task.update({
    where: { id: taskId },
    data: { status: newStatus },
  });
}

// Action: Rename Project di DB
export async function updateProjectNameAction(
  projectId: string,
  newName: string
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) throw new Error("Unauthorized");

  return await prisma.project.update({
    where: { id: projectId },
    data: { name: newName },
  });
}

// Action: Hapus Task dari DB
export async function deleteTaskAction(taskId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) throw new Error("Unauthorized");

  return await prisma.task.delete({
    where: { id: taskId },
  });
}

// Action: Update Detail Task (Judul, Deskripsi, Priority)
export async function updateTaskAction(
  taskId: string,
  data: {
    title?: string;
    description?: string;
    priority?: TaskPriorityType;
    status?: TaskStatusType;
  }
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) throw new Error("Unauthorized");

  return await prisma.task.update({
    where: { id: taskId },
    data: {
      ...(data.title && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.priority && { priority: data.priority }),
      ...(data.status && { status: data.status }),
    },
  });
}