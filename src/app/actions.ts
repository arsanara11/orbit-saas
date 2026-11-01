"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import Stripe from "stripe";

type TaskStatusType = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
type TaskPriorityType = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

// Inisialisasi Stripe tanpa apiVersion untuk menghindari error type version mismatch
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

const defaultProjects = [
  {
    name: "Orbit Workspace",
    description: "Plan, collaborate, and ship great work together.",
    tasks: [
      { title: "New task", description: "Involves creating and assigning a new task.", status: "TODO" as TaskStatusType, priority: "MEDIUM" as TaskPriorityType, progress: 0, commentCount: 2, fileCount: 1, people: ["NS", "AR"] },
      { title: "Planning meeting for second option of the dashboard", description: "Focus on strategizing option 2.", status: "IN_PROGRESS" as TaskStatusType, priority: "MEDIUM" as TaskPriorityType, progress: 65, commentCount: 7, fileCount: 2, people: ["NS", "MK"] },
      { title: "Finish the ideation", description: "Conclude ideation phase.", status: "IN_PROGRESS" as TaskStatusType, priority: "HIGH" as TaskPriorityType, progress: 75, commentCount: 34, fileCount: 12, people: ["NS", "AR", "MK"] },
      { title: "Preparation low-fidelity for mobile", description: "Wireframes for mobile view.", status: "IN_PROGRESS" as TaskStatusType, priority: "LOW" as TaskPriorityType, progress: 30, commentCount: 3, fileCount: 1, people: ["AR", "MK"] },
      { title: "Business model canvas of product", description: "Outlining business canvas.", status: "IN_REVIEW" as TaskStatusType, priority: "LOW" as TaskPriorityType, progress: 90, commentCount: 5, fileCount: 3, people: ["NS", "MK"] },
    ],
  },
  {
    name: "Website Redesign",
    description: "Revamping core landing page and design system.",
    tasks: [
      { title: "Hero section wireframe", description: "Create high-converting hero layout.", status: "TODO" as TaskStatusType, priority: "HIGH" as TaskPriorityType, progress: 10, commentCount: 4, fileCount: 2, people: ["AN", "AR"] },
      { title: "Optimize image assets", description: "Compress Next.js WebP images.", status: "IN_PROGRESS" as TaskStatusType, priority: "MEDIUM" as TaskPriorityType, progress: 50, commentCount: 2, fileCount: 5, people: ["JL"] },
      { title: "SEO meta tags setup", description: "Add OpenGraph metadata.", status: "IN_REVIEW" as TaskStatusType, priority: "LOW" as TaskPriorityType, progress: 95, commentCount: 1, fileCount: 0, people: ["MK"] },
    ],
  },
  {
    name: "Mobile App UI",
    description: "iOS and Android native UI component library.",
    tasks: [
      { title: "Dark mode color tokens", description: "Define tailwind color variables.", status: "TODO" as TaskStatusType, priority: "MEDIUM" as TaskPriorityType, progress: 20, commentCount: 3, fileCount: 1, people: ["MK", "AR"] },
      { title: "Bottom sheet navigation", description: "Build smooth drawer component.", status: "IN_PROGRESS" as TaskStatusType, priority: "HIGH" as TaskPriorityType, progress: 60, commentCount: 8, fileCount: 3, people: ["AN"] },
    ],
  },
  {
    name: "Marketing Campaign",
    description: "Q4 product launch and social growth strategy.",
    tasks: [
      { title: "Product Hunt teaser page", description: "Design launch page graphic.", status: "IN_PROGRESS" as TaskStatusType, priority: "HIGH" as TaskPriorityType, progress: 40, commentCount: 12, fileCount: 4, people: ["JL", "NS"] },
    ],
  },
];

async function requireAuthSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");
  return session;
}

async function requireWorkspaceMember(userId: string, workspaceId: string) {
  const membership = await prisma.membership.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });
  if (!membership) throw new Error("Forbidden: Access denied to workspace");
  return membership;
}

export async function checkWorkspaceLimit(workspaceId: string, type: "PROJECT" | "MEMBER") {
  const subscription = await prisma.subscription.findUnique({
    where: { workspaceId },
  });

  const plan = subscription?.plan || "FREE";

  if (plan === "FREE") {
    if (type === "PROJECT") {
      const projectCount = await prisma.project.count({ where: { workspaceId } });
      if (projectCount >= 3) {
        throw new Error("Free plan is limited to 3 projects. Please upgrade to Pro!");
      }
    }

    if (type === "MEMBER") {
      const memberCount = await prisma.membership.count({ where: { workspaceId } });
      if (memberCount >= 5) {
        throw new Error("Free plan is limited to 5 members. Please upgrade to Pro!");
      }
    }
  }
}

const workspaceInclude = {
  subscription: true,
  projects: {
    include: { tasks: { orderBy: { createdAt: "asc" as const } } },
    orderBy: { createdAt: "asc" as const },
  },
  memberships: {
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
    orderBy: { joinedAt: "asc" as const },
  },
  messages: {
    include: {
      sender: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
    orderBy: { createdAt: "asc" as const },
  },
  activities: {
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
    orderBy: { createdAt: "desc" as const },
    take: 20,
  },
};

export async function getInitialWorkspaceData(targetWorkspaceId?: string) {
  const session = await requireAuthSession();
  let workspace = null;

  if (targetWorkspaceId) {
    await requireWorkspaceMember(session.user.id, targetWorkspaceId);
    workspace = await prisma.workspace.findUnique({
      where: { id: targetWorkspaceId },
      include: workspaceInclude,
    });
  }

  if (!workspace) {
    workspace = await prisma.workspace.findFirst({
      where: { memberships: { some: { userId: session.user.id } } },
      include: workspaceInclude,
    });
  }

  if (!workspace) {
    workspace = await prisma.workspace.create({
      data: {
        name: `${session.user.name}'s Workspace`,
        slug: `workspace-${Date.now()}`,
        ownerId: session.user.id,
        memberships: { create: { userId: session.user.id, role: "OWNER" } },
        subscription: { create: { plan: "FREE", status: "ACTIVE" } },
      },
      include: workspaceInclude,
    });
  }

  if (workspace.projects.length < 4) {
    for (const projData of defaultProjects) {
      const exists = workspace.projects.some((p) => p.name === projData.name);
      if (!exists) {
        await prisma.project.create({
          data: {
            name: projData.name,
            description: projData.description,
            workspaceId: workspace.id,
            tasks: {
              createMany: {
                data: projData.tasks.map((t) => ({
                  ...t,
                  createdById: session.user.id,
                })),
              },
            },
          },
        });
      }
    }

    workspace = (await prisma.workspace.findUnique({
      where: { id: workspace.id },
      include: workspaceInclude,
    }))!;
  }

  const userWorkspaces = await prisma.workspace.findMany({
    where: { memberships: { some: { userId: session.user.id } } },
    select: { id: true, name: true, slug: true },
    orderBy: { createdAt: "asc" },
  });

  const activeProject = workspace.projects[0];

  return {
    user: session.user,
    workspace,
    userWorkspaces,
    project: activeProject,
    tasks: activeProject?.tasks || [],
  };
}

export async function createWorkspaceAction(name: string) {
  const session = await requireAuthSession();
  const slug = `${name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now()}`;

  return await prisma.workspace.create({
    data: {
      name: name.trim(),
      slug,
      ownerId: session.user.id,
      memberships: { create: { userId: session.user.id, role: "OWNER" } },
      subscription: { create: { plan: "FREE", status: "ACTIVE" } },
    },
  });
}

export async function createProjectAction(name: string, workspaceId?: string) {
  const session = await requireAuthSession();

  let targetWorkspaceId = workspaceId;

  if (!targetWorkspaceId) {
    const membership = await prisma.membership.findFirst({
      where: { userId: session.user.id },
      select: { workspaceId: true },
    });
    if (!membership) throw new Error("Workspace not found");
    targetWorkspaceId = membership.workspaceId;
  }

  await requireWorkspaceMember(session.user.id, targetWorkspaceId);
  await checkWorkspaceLimit(targetWorkspaceId, "PROJECT");

  return await prisma.project.create({
    data: {
      name: name.trim(),
      description: "Plan, collaborate, and ship great work together.",
      workspaceId: targetWorkspaceId,
    },
    include: { tasks: { orderBy: { createdAt: "asc" } } },
  });
}

export async function updateProjectNameAction(projectId: string, newName: string) {
  const session = await requireAuthSession();

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { workspaceId: true },
  });
  if (!project) throw new Error("Project not found");

  await requireWorkspaceMember(session.user.id, project.workspaceId);

  return await prisma.project.update({
    where: { id: projectId },
    data: { name: newName.trim() },
  });
}

export async function getProjectTasksAction(projectId: string) {
  const session = await requireAuthSession();

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { tasks: { orderBy: { createdAt: "asc" } } },
  });

  if (!project) throw new Error("Project not found");
  await requireWorkspaceMember(session.user.id, project.workspaceId);

  return project;
}

export async function createTaskAction(data: {
  title: string;
  projectId: string;
  status: TaskStatusType;
  priority: TaskPriorityType;
}) {
  const session = await requireAuthSession();

  const project = await prisma.project.findUnique({
    where: { id: data.projectId },
    select: { workspaceId: true },
  });
  if (!project) throw new Error("Project not found");

  await requireWorkspaceMember(session.user.id, project.workspaceId);

  const userInitials = session.user.name
    ? session.user.name.slice(0, 2).toUpperCase()
    : "US";

  return await prisma.task.create({
    data: {
      title: data.title.trim(),
      description: "Add a description to keep the team aligned on next steps.",
      status: data.status,
      priority: data.priority,
      projectId: data.projectId,
      createdById: session.user.id,
      people: [userInitials],
    },
  });
}

export async function updateTaskStatusAction(taskId: string, newStatus: TaskStatusType) {
  const session = await requireAuthSession();

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { project: { select: { workspaceId: true } } },
  });
  if (!task) throw new Error("Task not found");

  await requireWorkspaceMember(session.user.id, task.project.workspaceId);

  return await prisma.task.update({
    where: { id: taskId },
    data: { status: newStatus },
  });
}

export async function updateTaskAction(
  taskId: string,
  data: {
    title?: string;
    description?: string;
    priority?: TaskPriorityType;
    status?: TaskStatusType;
  }
) {
  const session = await requireAuthSession();

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { project: { select: { workspaceId: true } } },
  });
  if (!task) throw new Error("Task not found");

  await requireWorkspaceMember(session.user.id, task.project.workspaceId);

  return await prisma.task.update({
    where: { id: taskId },
    data: {
      ...(data.title && { title: data.title.trim() }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.priority && { priority: data.priority }),
      ...(data.status && { status: data.status }),
    },
  });
}

export async function deleteTaskAction(taskId: string) {
  const session = await requireAuthSession();

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { project: { select: { workspaceId: true } } },
  });
  if (!task) throw new Error("Task not found");

  await requireWorkspaceMember(session.user.id, task.project.workspaceId);

  return await prisma.task.delete({ where: { id: taskId } });
}

export async function addMemberByEmailAction(workspaceId: string, email: string) {
  const session = await requireAuthSession();
  const membership = await requireWorkspaceMember(session.user.id, workspaceId);

  if (membership.role === "MEMBER") {
    throw new Error("Only OWNER or ADMIN can invite members.");
  }

  await checkWorkspaceLimit(workspaceId, "MEMBER");

  const targetEmail = email.trim().toLowerCase();
  const targetUser = await prisma.user.findUnique({
    where: { email: targetEmail },
  });

  if (!targetUser) {
    const token = randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    return await prisma.invitation.upsert({
      where: { email_workspaceId: { email: targetEmail, workspaceId } },
      create: { email: targetEmail, workspaceId, token, expiresAt },
      update: { token, expiresAt },
    });
  }

  const existing = await prisma.membership.findUnique({
    where: {
      userId_workspaceId: {
        userId: targetUser.id,
        workspaceId,
      },
    },
  });

  if (existing) {
    throw new Error("User is already a member of this workspace.");
  }

  return await prisma.membership.create({
    data: {
      workspaceId,
      userId: targetUser.id,
      role: "MEMBER",
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
  });
}

export async function acceptInvitationAction(token: string) {
  const session = await requireAuthSession();

  const invitation = await prisma.invitation.findUnique({
    where: { token },
  });

  if (!invitation) throw new Error("Invitation link not found or expired.");
  if (invitation.expiresAt < new Date()) throw new Error("Invitation link has expired.");

  await checkWorkspaceLimit(invitation.workspaceId, "MEMBER");

  const membership = await prisma.membership.create({
    data: {
      workspaceId: invitation.workspaceId,
      userId: session.user.id,
      role: invitation.role,
    },
  });

  await prisma.invitation.delete({ where: { id: invitation.id } });

  return membership;
}

export async function updateMemberRoleAction(
  workspaceId: string,
  memberId: string,
  newRole: "ADMIN" | "MEMBER"
) {
  const session = await requireAuthSession();
  const currentMembership = await requireWorkspaceMember(session.user.id, workspaceId);

  if (currentMembership.role !== "OWNER") {
    throw new Error("Only OWNER can update member roles.");
  }

  return await prisma.membership.update({
    where: { id: memberId },
    data: { role: newRole },
  });
}

export async function removeMemberAction(workspaceId: string, memberId: string) {
  const session = await requireAuthSession();
  const currentMembership = await requireWorkspaceMember(session.user.id, workspaceId);

  if (currentMembership.role === "MEMBER") {
    throw new Error("Only OWNER or ADMIN can remove members.");
  }

  return await prisma.membership.delete({ where: { id: memberId } });
}

export async function getWorkspaceMembersAction(workspaceId: string) {
  const session = await requireAuthSession();
  await requireWorkspaceMember(session.user.id, workspaceId);

  return await prisma.membership.findMany({
    where: { workspaceId },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
    orderBy: { joinedAt: "asc" },
  });
}

export async function getWorkspaceMessagesAction(workspaceId: string) {
  const session = await requireAuthSession();
  await requireWorkspaceMember(session.user.id, workspaceId);

  return await prisma.message.findMany({
    where: { workspaceId },
    include: {
      sender: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function sendMessageAction(workspaceId: string, content: string) {
  const session = await requireAuthSession();
  await requireWorkspaceMember(session.user.id, workspaceId);

  if (!content.trim()) throw new Error("Content cannot be empty");

  return await prisma.message.create({
    data: {
      workspaceId,
      senderId: session.user.id,
      content: content.trim(),
    },
    include: {
      sender: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
  });
}

export async function getWorkspaceActivitiesAction(workspaceId: string) {
  const session = await requireAuthSession();
  await requireWorkspaceMember(session.user.id, workspaceId);

  return await prisma.activity.findMany({
    where: { workspaceId },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

export async function logActivityAction(data: {
  workspaceId: string;
  action: string;
  targetItem: string;
  project: string;
}) {
  const session = await requireAuthSession();
  await requireWorkspaceMember(session.user.id, data.workspaceId);

  return await prisma.activity.create({
    data: {
      workspaceId: data.workspaceId,
      userId: session.user.id,
      action: data.action,
      targetItem: data.targetItem,
      project: data.project,
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
  });
}

export async function createCheckoutSessionAction(workspaceId: string) {
  const session = await requireAuthSession();
  await requireWorkspaceMember(session.user.id, workspaceId);

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: session.user.email,
    line_items: [
      {
        price: process.env.STRIPE_PRO_PRICE_ID,
        quantity: 1,
      },
    ],
    metadata: { workspaceId },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/overview?billing=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/overview?billing=canceled`,
  });

  return { url: checkoutSession.url };
}