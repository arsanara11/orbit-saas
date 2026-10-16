"use client";

import { useState } from "react";

type Task = {
  id: number;
  title: string;
  date: string;
  duration: string;
  progress: number;
  done: boolean;
};

const initialTasks: Task[] = [
  { id: 1, title: "Conduct research", date: "17 Oct, 09:20 AM", duration: "02 h 45 m", progress: 90, done: false },
  { id: 2, title: "Schedule a meeting", date: "17 Oct, 12:45 AM", duration: "06 h 55 m", progress: 50, done: false },
  { id: 3, title: "Send out reminders", date: "21 Oct, 10:30 AM", duration: "01 h 30 m", progress: 10, done: false },
];

const days = [
  { day: "Mon", date: 14 },
  { day: "Tue", date: 15 },
  { day: "Wed", date: 16 },
  { day: "Thu", date: 17 },
  { day: "Fri", date: 18 },
  { day: "Sat", date: 19 },
  { day: "Sun", date: 20 },
];

export default function Home() {
  const [dark, setDark] = useState(false);
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [tasks, setTasks] = useState(initialTasks);
  const [search, setSearch] = useState("");
  const [newTask, setNewTask] = useState("");
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selectedDay, setSelectedDay] = useState(18);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showExport, setShowExport] = useState(false);

  const visibleTasks = tasks.filter((task) =>
    task.title.toLowerCase().includes(search.toLowerCase())
  );

  const completedCount = tasks.filter((task) => task.done).length;

  function addTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newTask.trim()) return;

    setTasks((current) => [
      ...current,
      {
        id: Date.now(),
        title: newTask.trim(),
        date: "17 Oct, 03:00 PM",
        duration: "00 h 30 m",
        progress: 0,
        done: false,
      },
    ]);
    setNewTask("");
    setShowTaskForm(false);
  }

  function toggleTask(id: number) {
    setTasks((current) =>
      current.map((task) =>
        task.id === id
          ? { ...task, done: !task.done, progress: task.done ? task.progress : 100 }
          : task
      )
    );
  }

  return (
    <main className={`orbit-shell ${dark ? "dark-mode" : ""}`}>
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="ambient-dot dot-one" />
      <div className="ambient-dot dot-two" />

      <div className="orbit-window">
        <aside className="orbit-sidebar">
          <div className="sidebar-wave" />

          <button className="mobile-brand" onClick={() => setActiveNav("Dashboard")}>
            ✳
          </button>

          <div className="sidebar-menu">
            {[
              { label: "Dashboard", icon: "▦" },
              { label: "Profile", icon: "♙" },
              { label: "Analytics", icon: "◔" },
              { label: "Notifications", icon: "♧" },
              { label: "Calendar", icon: "▦" },
              { label: "Messages", icon: "✉" },
              { label: "Notes", icon: "▤" },
              { label: "Community", icon: "◉" },
            ].map((item, index) => (
              <button
                key={item.label}
                title={item.label}
                className={`sidebar-icon ${activeNav === item.label ? "sidebar-icon-active" : ""}`}
                onClick={() => {
                  setActiveNav(item.label);
                  if (item.label === "Notifications") setShowNotifications(true);
                }}
              >
                <span>{item.icon}</span>
                {index === 2 && <small>PRO</small>}
                {index === 5 && <i />}
              </button>
            ))}
          </div>

          <div className="sidebar-bottom-mark">O</div>
        </aside>

        <div className="orbit-main">
          <header className="orbit-navbar">
            <div className="nav-links">
              {["Dashboard", "Workflows", "Integrations"].map((item, index) => (
                <button
                  key={item}
                  className={activeNav === item ? "nav-link nav-link-active" : "nav-link"}
                  onClick={() => setActiveNav(item)}
                >
                  <span>{["▦", "♧", "♧"][index]}</span>
                  {item}
                </button>
              ))}
            </div>

            <label className="command-search">
              <span>⌕</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search or type command"
              />
              {search && (
                <button onClick={() => setSearch("")} aria-label="Clear search">×</button>
              )}
            </label>

            <div className="navbar-tools">
              <div className="theme-switch">
                <button className={!dark ? "theme-active" : ""} onClick={() => setDark(false)}>
                  ☀ <span>Light</span>
                </button>
                <button className={dark ? "theme-active" : ""} onClick={() => setDark(true)}>
                  ☾ <span>Dark</span>
                </button>
              </div>

              <div className="tool-popover-wrap">
                <button
                  className="navbar-icon"
                  title="Notifications"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  ♧
                  <i />
                </button>
                {showNotifications && (
                  <div className="small-popover">
                    <strong>Notifications</strong>
                    <p>Your design sync starts today at 10:30 AM.</p>
                    <p>You have {tasks.filter((task) => !task.done).length} tasks in progress.</p>
                    <button onClick={() => setShowNotifications(false)}>Got it</button>
                  </div>
                )}
              </div>

              <div className="tool-popover-wrap">
                <button
                  className="navbar-icon"
                  title="Settings"
                  onClick={() => setShowSettings(!showSettings)}
                >
                  ⚙
                </button>
                {showSettings && (
                  <div className="small-popover">
                    <strong>Quick settings</strong>
                    <p>Appearance</p>
                    <button onClick={() => setDark(!dark)}>
                      Switch to {dark ? "light" : "dark"} mode
                    </button>
                    <button onClick={() => setShowSettings(false)}>Close</button>
                  </div>
                )}
              </div>

              <div className="tool-popover-wrap export-wrap">
                <button className="export-button" onClick={() => setShowExport(!showExport)}>
                  ↓ <span>Export data</span> <b>xls</b>
                </button>
                {showExport && (
                  <div className="small-popover">
                    <strong>Export your tasks</strong>
                    <p>{tasks.length} tasks are ready to export.</p>
                    <button
                      onClick={() => {
                        const csv = [
                          "Task,Date,Duration,Progress,Completed",
                          ...tasks.map((task) =>
                            `"${task.title}","${task.date}","${task.duration}",${task.progress}%,${task.done}`
                          ),
                        ].join("\n");
                        const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
                        const link = document.createElement("a");
                        link.href = url;
                        link.download = "orbit-tasks.csv";
                        link.click();
                        URL.revokeObjectURL(url);
                        setShowExport(false);
                      }}
                    >
                      Download CSV
                    </button>
                  </div>
                )}
              </div>

              <button className="add-board-button" onClick={() => setShowTaskForm(true)}>
                Add new board
              </button>
            </div>
          </header>

          <div className="orbit-content">
            <section className="hero-row">
              <div className="hero-copy">
                <div className="hero-greeting">
                  <h1>Hi, Nabila!</h1>
                  <span className="greeting-orbit">✺</span>
                  <span className="greeting-sound">◉</span>
                </div>
                <h2>What are your<br />plans for today?</h2>
                <p>
                  Your space to organize ideas, manage tasks,<br className="desktop-break" />
                  and bring your best work together.
                </p>
              </div>

              <div className="feature-area">
                <button
                  className="add-feature-card"
                  onClick={() => setShowTaskForm(true)}
                  aria-label="Add new item"
                >
                  <span>+</span>
                </button>

                <article className="feature-card">
                  <div className="feature-art art-calendar">
                    <div className="art-calendar-top" />
                    <div className="art-calendar-grid">
                      {Array.from({ length: 9 }, (_, index) => (
                        <i key={index} />
                      ))}
                    </div>
                    <span className="art-pointer">↗</span>
                  </div>
                  <h3>Stay organized</h3>
                  <p>A clear structure for your notes</p>
                </article>

                <article className="feature-card">
                  <div className="feature-art art-notes">
                    <div className="note-sheet note-one">✓<i /><i /><i /></div>
                    <div className="note-sheet note-two">✎<i /><i /><i /></div>
                    <div className="note-sheet note-three">♡<i /><i /><i /></div>
                  </div>
                  <h3>Sync your notes</h3>
                  <p>Keep all your ideas in one place</p>
                </article>

                <article className="feature-card">
                  <div className="feature-art art-folder">
                    <div className="folder-tab" />
                    <div className="folder-sheet"><i /><i /><i /></div>
                    <span className="folder-spark">✧</span>
                  </div>
                  <h3>Collaborate and share</h3>
                  <p>Share notes with your colleagues</p>
                </article>
              </div>
            </section>

            {showTaskForm && (
              <form className="task-composer" onSubmit={addTask}>
                <div>
                  <strong>Create a new task</strong>
                  <p>Add something you want to get done.</p>
                </div>
                <input
                  autoFocus
                  value={newTask}
                  onChange={(event) => setNewTask(event.target.value)}
                  placeholder="Enter task name..."
                />
                <button className="composer-submit" type="submit">Add task</button>
                <button className="composer-cancel" type="button" onClick={() => setShowTaskForm(false)}>×</button>
              </form>
            )}

            <section className="middle-grid">
              <article className="soft-panel notifications-panel">
                <div className="section-title">
                  <h3>Notifications</h3>
                  <button onClick={() => setShowNotifications(false)}>♧ Clear</button>
                </div>

                <div className="notification-feature">
                  <div className="notification-text">
                    <div className="notification-title">Upcoming event <span className="online-dot" /></div>
                    <p>Landing design meeting · Time: 120 min</p>
                    <small>▦ Sat, 17 Oct <span>◷ 11 AM - 11:45 AM</span></small>
                  </div>
                  <button aria-label="More event options" onClick={() => alert("Event options coming soon.")}>•••</button>
                </div>

                <div className="notification-message">
                  <div className="message-top">
                    <div>
                      <strong>Message | Product design</strong>
                      <p>✉ Message from Ken Smith</p>
                    </div>
                    <button aria-label="More message options" onClick={() => alert("Message options coming soon.")}>•••</button>
                  </div>
                  <div className="message-preview">Hey team, just wanted to check in and see how is...</div>
                </div>
              </article>

              <article className="soft-panel assignments-panel">
                <div className="section-title">
                  <h3>Assignments</h3>
                  <button onClick={() => setShowTaskForm(true)}>♢ Edit</button>
                </div>

                <div className="assignment-project">
                  <span>Motion design</span>
                  <span>Logo</span>
                  <button aria-label="Assignment options" onClick={() => alert("Assignment options coming soon.")}>•••</button>
                </div>

                <div className="assignment-content">
                  <div>
                    <h4>Design a packaging concept<br />for a new product</h4>
                    <span className="assignment-tag">Package design</span>
                  </div>
                  <div className="assignment-meta">
                    <span className="high-tag">High</span>
                    <small>Rachel Lee <b>RL</b></small>
                  </div>
                </div>

                <button className="add-assignment" onClick={() => setShowTaskForm(true)}>
                  <span>+</span> Add new assignment
                </button>
              </article>

              <article className="soft-panel calendar-panel">
                <div className="section-title">
                  <h3>October 2026</h3>
                  <div className="calendar-arrows">
                    <button onClick={() => setSelectedDay(Math.max(14, selectedDay - 1))}>‹</button>
                    <button onClick={() => setSelectedDay(Math.min(20, selectedDay + 1))}>›</button>
                  </div>
                </div>

                <div className="mini-calendar">
                  {days.map((item) => (
                    <button
                      key={item.day}
                      className={selectedDay === item.date ? "selected-day" : ""}
                      onClick={() => setSelectedDay(item.date)}
                    >
                      <small>{item.day}</small>
                      <span>{item.date}</span>
                    </button>
                  ))}
                </div>

                <div className="calendar-time">04:30-05:00 PM <span /></div>

                <div className="meeting-item">
                  <div className="meeting-symbol">♧</div>
                  <div>
                    <strong>Team meeting</strong>
                    <p>12:00 - 12:30 · UX/UI design</p>
                  </div>
                  <button onClick={() => alert("Meeting options coming soon.")}>⋮</button>
                </div>

                <div className="calendar-time">11:30-12:30 PM <span /></div>

                <div className="meeting-item">
                  <div className="meeting-symbol">▣</div>
                  <div>
                    <strong>Meeting with new client</strong>
                    <p>12:30 - 01:30 PM · Job interview</p>
                  </div>
                  <button onClick={() => alert("Meeting options coming soon.")}>⋮</button>
                </div>
              </article>
            </section>

            <section className="bottom-grid">
              <article className="soft-panel today-panel">
                <div className="section-title">
                  <div className="today-heading">
                    <h3>Today tasks</h3>
                    <div className="avatar-stack">
                      <span>NS</span><span>AR</span><span>MK</span><button>+</button>
                    </div>
                  </div>
                  <div className="task-panel-actions">
                    <span>◉ <b>{completedCount}</b></span>
                    <button onClick={() => setShowTaskForm(true)}>♢ Edit</button>
                    <button onClick={() => alert("Sharing options coming soon.")}>♧ Share</button>
                  </div>
                </div>

                <div className="task-table-heading">
                  <span>TASK</span><span>DURATION</span><span>PROGRESS</span>
                </div>

                <div className="today-task-list">
                  {visibleTasks.map((task) => (
                    <div className={`today-task-row ${task.done ? "task-completed" : ""}`} key={task.id}>
                      <button className="task-name-button" onClick={() => toggleTask(task.id)}>
                        <span className={`task-check ${task.done ? "task-check-done" : ""}`}>
                          {task.done ? "✓" : ""}
                        </span>
                        <span>
                          <strong>{task.title}</strong>
                          <small>{task.date}</small>
                        </span>
                      </button>
                      <span className="duration-value">{task.duration}</span>
                      <div className="task-progress">
                        <strong>{task.done ? 100 : task.progress}%</strong>
                        <div className="progress-line"><span style={{ width: `${task.done ? 100 : task.progress}%` }} /></div>
                      </div>
                    </div>
                  ))}
                  {visibleTasks.length === 0 && <p className="empty-tasks">No matching tasks. Try another search.</p>}
                </div>

                <button className="view-tasks" onClick={() => setShowTaskForm(true)}>+ Add another task</button>
              </article>

              <article className="premium-card">
                <div className="premium-illustration">
                  <span className="premium-star">✦</span>
                  <div className="gift-box"><span>✳</span></div>
                  <div className="gift-ribbon" />
                  <span className="gift-spark spark-a">✧</span>
                  <span className="gift-spark spark-b">✦</span>
                  <span className="gift-spark spark-c">✧</span>
                </div>
                <h3>Go premium!</h3>
                <p>Gain access to a range of<br />benefits designed to enhance<br />your workspace experience.</p>
                <button onClick={() => alert("Orbit Premium is coming soon!")}>Find out more</button>
              </article>

              <div className="right-bottom-stack">
                <div className="progress-cards">
                  <article className="progress-card">
                    <div className="ring ring-green"><span>90%</span></div>
                    <div><small>DATA RESEARCH</small><strong>Marketing</strong><p>You marked 5/5<br />All assignments are done!</p></div>
                  </article>
                  <article className="progress-card">
                    <div className="ring ring-red"><span>65%</span></div>
                    <div><small>UX/UI DESIGN</small><strong>Typography</strong><p>You marked 3/5<br />2 assignments left</p><button onClick={() => setActiveNav("Assignments")}>Check</button></div>
                  </article>
                </div>

                <article className="soft-panel board-meeting">
                  <div className="section-title">
                    <div>
                      <h3>Board meeting</h3>
                      <p className="board-date"><span /> March 24 at 4:00 PM</p>
                    </div>
                    <button onClick={() => alert("Meeting editing coming soon.")}>♢ Edit</button>
                  </div>
                  <p className="board-description">Meeting with John Smith,<br />4th floor, room 159</p>
                  <div className="board-actions">
                    <button onClick={() => alert("Rescheduling will be available soon.")}>Reschedule</button>
                    <button onClick={() => alert("Invitation accepted!")}>Accept invite</button>
                  </div>
                </article>
              </div>
            </section>

            <footer className="orbit-footer">
              <span>© 2026 Orbit Workspace</span>
              <span>Designed for your flow ✦</span>
            </footer>
          </div>
        </div>
      </div>
    </main>
  );
}
