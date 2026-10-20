import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const starterTasks = [
  { title: "New task", description: "Involves creating and assigning a new task within the project management system. The team can collaborate and track progress here.", status: "TODO" as const, priority: "MEDIUM" as const, dueDate: "2026-10-20", progress: 0, commentCount: 2, fileCount: 1, people: ["NS", "AR"] },
  { title: "Planning meeting for second option of the dashboard", description: "Focus on strategizing and outlining the development of the second option for the dashboard.", status: "IN_PROGRESS" as const, priority: "MEDIUM" as const, dueDate: "2026-10-20", progress: 65, commentCount: 7, fileCount: 2, people: ["NS", "MK"] },
  { title: "Finish the ideation", description: "The team will conclude the ideation phase by finalizing and refining concepts that have been discussed.", status: "IN_PROGRESS" as const, priority: "HIGH" as const, dueDate: "2026-10-22", progress: 75, commentCount: 34, fileCount: 12, people: ["NS", "AR", "MK"] },
  { title: "Preparation low-fidelity for mobile", description: "Involves creating low-fidelity wireframes specifically for the mobile version of the project.", status: "IN_PROGRESS" as const, priority: "LOW" as const, dueDate: "2026-10-24", progress: 30, commentCount: 3, fileCount: 1, people: ["AR", "MK"] },
  { title: "Business model canvas of product", description: "Developing a comprehensive Business Model Canvas for the product, outlining the key components.", status: "IN_REVIEW" as const, priority: "LOW" as const, dueDate: "2026-10-21", progress: 90, commentCount: 5, fileCount: 3, people: ["NS", "MK"] },
];

export async function POST() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });

    const membership = await prisma.membership.findFirst({
      where: { userId: session.user.id },
      include: { workspace: { include: { projects: { orderBy: { createdAt: "asc" }, take: 1 } } } },
      orderBy: { joinedAt: "asc" },
    });
    let project = membership?.workspace.projects[0];
    if (!project) {
      const owned = await prisma.workspace.create({
        data: {
          name: "Orbit Workspace", slug: `orbit-${session.user.id}`, ownerId: session.user.id,
          memberships: { create: { userId: session.user.id, role: "OWNER" } },
          projects: { create: { name: "Orbit Workspace" } },
        }, include: { projects: { take: 1 } },
      });
      project = owned.projects[0];
    }

    const existing = await prisma.task.count({ where: { projectId: project.id, createdById: session.user.id } });
    if (existing > 0) {
      return NextResponse.json({ message: "Task tidak ditambahkan ulang karena project ini sudah memiliki task.", created: 0 });
    }

    await prisma.task.createMany({
      data: starterTasks.map((task) => ({
        ...task, dueDate: new Date(`${task.dueDate}T00:00:00.000Z`), projectId: project!.id, createdById: session.user.id,
      })),
    });
    return NextResponse.json({ message: "5 task awal berhasil dimasukkan ke database.", created: starterTasks.length });
  } catch (error) {
    console.error("POST /api/tasks/seed failed:", error);
    return NextResponse.json({ error: "Gagal memasukkan task awal ke database." }, { status: 500 });
  }
}
