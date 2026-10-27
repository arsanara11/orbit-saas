"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type UserProfile = {
  name: string;
  email: string;
  bio: string;
  avatarUrl: string | null;
  initials: string;
};

export type CalendarItem = {
  id: string;
  type: "task" | "event";
  title: string;
  date: string;
  time?: string;
  endTime?: string;
  isAllDay?: boolean;
  project?: string;
  status?: "pending" | "completed" | "overdue";
  priority?: "Low" | "Medium" | "High";
  description?: string;
  colorCategory: "lime" | "purple" | "amber" | "red";
};

export type ActivityItem = {
  id: string;
  actorName: string;
  actorAvatar: string;
  action: string;
  targetItem: string;
  project: string;
  timestamp: string;
  dateGroup: "TODAY" | "YESTERDAY";
  iconType: "check" | "edit" | "folder";
};

type WorkspaceContextType = {
  profile: UserProfile;
  updateProfile: (newProfile: Partial<UserProfile>) => void;
  calendarItems: CalendarItem[];
  addCalendarItem: (item: Omit<CalendarItem, "id">) => void;
  toggleTaskStatus: (id: string) => void;
  activities: ActivityItem[];
  logActivity: (action: string, targetItem: string, project?: string) => void;
};

const DEFAULT_PROFILE: UserProfile = {
  name: "Nabila Sabrina",
  email: "nabila@example.com",
  bio: "Project Lead & Product Strategist at Orbit Workspace.",
  avatarUrl: null,
  initials: "NS",
};

const DEFAULT_CALENDAR: CalendarItem[] = [
  {
    id: "item-1",
    type: "task",
    title: "Finalize dashboard layout",
    date: "2026-10-27",
    time: "10:00 AM",
    project: "Orbit Workspace",
    status: "completed",
    priority: "High",
    colorCategory: "lime",
  },
  {
    id: "item-2",
    type: "event",
    title: "Review API integration",
    date: "2026-10-28",
    time: "02:00 PM",
    project: "Website Redesign",
    colorCategory: "purple",
  },
];

const DEFAULT_ACTIVITIES: ActivityItem[] = [
  {
    id: "act-1",
    actorName: "Nabila Sabrina",
    actorAvatar: "NS",
    action: "updated workspace settings",
    targetItem: "Profile Information",
    project: "Orbit Workspace",
    timestamp: "10:42 AM",
    dateGroup: "TODAY",
    iconType: "edit",
  },
];

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [calendarItems, setCalendarItems] = useState<CalendarItem[]>(DEFAULT_CALENDAR);
  const [activities, setActivities] = useState<ActivityItem[]>(DEFAULT_ACTIVITIES);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load state dari localStorage saat mount
  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem("orbit_profile");
      const savedCalendar = localStorage.getItem("orbit_calendar");
      const savedActivities = localStorage.getItem("orbit_activities");

      if (savedProfile) setProfile(JSON.parse(savedProfile));
      if (savedCalendar) setCalendarItems(JSON.parse(savedCalendar));
      if (savedActivities) setActivities(JSON.parse(savedActivities));
    } catch (e) {
      console.error("Gagal membaca data dari localStorage", e);
    }
    setIsInitialized(true);
  }, []);

  // Sync state ke localStorage tiap ada perubahan
  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem("orbit_profile", JSON.stringify(profile));
    localStorage.setItem("orbit_calendar", JSON.stringify(calendarItems));
    localStorage.setItem("orbit_activities", JSON.stringify(activities));
  }, [profile, calendarItems, activities, isInitialized]);

  const updateProfile = (newProfile: Partial<UserProfile>) => {
    setProfile((prev) => {
      const updated = { ...prev, ...newProfile };
      if (newProfile.name) {
        const parts = newProfile.name.trim().split(" ");
        updated.initials = parts.length > 1 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : parts[0].slice(0, 2).toUpperCase();
      }
      return updated;
    });

    logActivity("updated profile information", newProfile.name || "User Profile", "Orbit Workspace");
  };

  const addCalendarItem = (item: Omit<CalendarItem, "id">) => {
    const newItem: CalendarItem = { ...item, id: `item-${Date.now()}` };
    setCalendarItems((prev) => [...prev, newItem]);
    logActivity(`created new ${item.type}`, item.title, item.project || "Orbit Workspace");
  };

  const toggleTaskStatus = (id: string) => {
    setCalendarItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextStatus = item.status === "completed" ? "pending" : "completed";
          return {
            ...item,
            status: nextStatus,
            colorCategory: nextStatus === "completed" ? "lime" : "purple",
          };
        }
        return item;
      })
    );
  };

  const logActivity = (action: string, targetItem: string, project = "Orbit Workspace") => {
    const newAct: ActivityItem = {
      id: `act-${Date.now()}`,
      actorName: profile.name,
      actorAvatar: profile.initials,
      action,
      targetItem,
      project,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      dateGroup: "TODAY",
      iconType: "edit",
    };
    setActivities((prev) => [newAct, ...prev]);
  };

  return (
    <WorkspaceContext.Provider
      value={{
        profile,
        updateProfile,
        calendarItems,
        addCalendarItem,
        toggleTaskStatus,
        activities,
        logActivity,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace harus digunakan di dalam WorkspaceProvider");
  }
  return context;
}