// Simple Study Planner App
// All data stored in localStorage

const app = {
  subjects: [],
  schedules: [],
  tasks: [],
  settings: { darkMode: false, deadlineNotif: true, sessionNotif: true },
  currentFilter: "all",
  currentView: "daily",
  currentDate: new Date(),

  // Initialize
  init() {
    this.loadData();
    this.setupEvents();
    this.renderAll();
    this.updateDashboard();
    document.getElementById("dateInput").valueAsDate = this.currentDate;
  },

  // Load from localStorage
  loadData() {
    this.subjects = JSON.parse(
      localStorage.getItem("planner_subjects") || "[]",
    );
    this.schedules = JSON.parse(
      localStorage.getItem("planner_schedules") || "[]",
    );
    this.tasks = JSON.parse(localStorage.getItem("planner_tasks") || "[]");
    this.settings = JSON.parse(
      localStorage.getItem("planner_settings") ||
        '{"darkMode":false,"deadlineNotif":true,"sessionNotif":true}',
    );

    if (this.settings.darkMode) {
      document.body.classList.add("dark");
      document.getElementById("themeBtn").textContent = "☀️";
      document.getElementById("darkMode").checked = true;
    }
  },

  // Save to localStorage
  save(type) {
    localStorage.setItem(`planner_${type}`, JSON.stringify(this[type]));
  },

  // Setup event listeners
  setupEvents() {
    // Navigation
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", (e) => {
        document
          .querySelectorAll(".nav-link")
          .forEach((l) => l.classList.remove("active"));
        e.currentTarget.classList.add("active");

        document
          .querySelectorAll(".page")
          .forEach((p) => p.classList.remove("active"));
        document
          .getElementById(e.currentTarget.dataset.page)
          .classList.add("active");

        if (e.currentTarget.dataset.page === "analytics") {
          this.renderCharts();
        }
      });
    });

    // Theme
    document.getElementById("themeBtn").addEventListener("click", () => {
      document.body.classList.toggle("dark");
      const isDark = document.body.classList.contains("dark");
      document.getElementById("themeBtn").textContent = isDark ? "☀️" : "🌙";
      this.settings.darkMode = isDark;
      this.save("settings");
    });

    document.getElementById("darkMode").addEventListener("change", (e) => {
      document.body.classList.toggle("dark");
      const isDark = e.target.checked;
      document.getElementById("themeBtn").textContent = isDark ? "☀️" : "🌙";
      this.settings.darkMode = isDark;
      this.save("settings");
    });

    // Forms
    document.getElementById("subjectForm").addEventListener("submit", (e) => {
      e.preventDefault();
      this.saveSubject();
    });

    document.getElementById("scheduleForm").addEventListener("submit", (e) => {
      e.preventDefault();
      this.saveSchedule();
    });

    document.getElementById("taskForm").addEventListener("submit", (e) => {
      e.preventDefault();
      this.saveTask();
    });

    // Tabs
    document.querySelectorAll(".tab").forEach((tab) => {
      tab.addEventListener("click", (e) => {
        document
          .querySelectorAll(".tab")
          .forEach((t) => t.classList.remove("active"));
        e.target.classList.add("active");

        document
          .querySelectorAll(".schedule-view")
          .forEach((v) => v.classList.remove("active"));
        document
          .getElementById(e.target.dataset.view + "View")
          .classList.add("active");

        this.currentView = e.target.dataset.view;
        this.renderSchedule();
      });
    });

    // Filters
    document.querySelectorAll(".filter").forEach((filter) => {
      filter.addEventListener("click", (e) => {
        document
          .querySelectorAll(".filter")
          .forEach((f) => f.classList.remove("active"));
        e.target.classList.add("active");
        this.currentFilter = e.target.dataset.filter;
        this.renderTasks();
      });
    });

    // Date change
    document.getElementById("dateInput").addEventListener("change", (e) => {
      this.currentDate = new Date(e.target.value);
      this.renderSchedule();
    });

    // Settings
    document.getElementById("deadlineNotif").addEventListener("change", (e) => {
      this.settings.deadlineNotif = e.target.checked;
      this.save("settings");
    });

    document.getElementById("sessionNotif").addEventListener("change", (e) => {
      this.settings.sessionNotif = e.target.checked;
      this.save("settings");
    });
  },

  // Render everything
  renderAll() {
    this.renderSubjects();
    this.renderSchedule();
    this.renderTasks();
    this.updateSubjectSelects();
  },

  // Update dashboard stats
  updateDashboard() {
    document.getElementById("subjectCount").textContent = this.subjects.length;
    document.getElementById("taskCount").textContent = this.tasks.filter(
      (t) => !t.completed,
    ).length;

    // Calculate study hours
    let hours = 0;
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    this.schedules.forEach((s) => {
      const date = new Date(s.date);
      if (date >= weekAgo && date <= today) {
        const start = new Date("2000-01-01 " + s.startTime);
        const end = new Date("2000-01-01 " + s.endTime);
        hours += (end - start) / (1000 * 60 * 60);
      }
    });
    document.getElementById("hoursCount").textContent = Math.round(hours) + "h";

    // Completion rate
    const completedTasks = this.tasks.filter((t) => t.completed).length;
    const rate =
      this.tasks.length > 0
        ? Math.round((completedTasks / this.tasks.length) * 100)
        : 0;
    document.getElementById("completeRate").textContent = rate + "%";

    // Today's schedule
    this.renderTodaySchedule();

    // Upcoming deadlines
    this.renderUpcomingDeadlines();

    // Subject overview
    this.renderSubjectOverview();
  },

  renderTodaySchedule() {
    const today = new Date().toISOString().split("T")[0];
    const todaySessions = this.schedules.filter((s) => s.date === today);

    const html =
      todaySessions.length > 0
        ? todaySessions
            .map((s) => {
              const subj = this.subjects.find((sub) => sub.id === s.subjectId);
              return `<div class="schedule-item" style="border-color: ${subj?.color || "#6366f1"}">
                    <div>
                        <strong>${subj?.name || "Unknown"}</strong>
                        <div>${s.startTime} - ${s.endTime}</div>
                        ${s.topic ? `<div style="font-size: 13px; color: #888;">${s.topic}</div>` : ""}
                    </div>
                </div>`;
            })
            .join("")
        : '<div class="empty">No sessions today</div>';

    document.getElementById("todayList").innerHTML = html;
  },

  renderUpcomingDeadlines() {
    const upcoming = this.tasks
      .filter((t) => !t.completed && new Date(t.deadline) >= new Date())
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
      .slice(0, 5);

    const html =
      upcoming.length > 0
        ? upcoming
            .map((t) => {
              const subj = this.subjects.find((s) => s.id === t.subjectId);
              const days = Math.ceil(
                (new Date(t.deadline) - new Date()) / (1000 * 60 * 60 * 24),
              );
              return `<div class="task-item">
                    <div>
                        <strong>${t.title}</strong>
                        <div class="task-meta">
                            ${subj?.name || "Unknown"} • ${t.type}
                            <span class="deadline-badge ${days <= 3 ? "urgent" : "soon"}">
                                ${days === 0 ? "Today" : days === 1 ? "Tomorrow" : days + " days"}
                            </span>
                        </div>
                    </div>
                </div>`;
            })
            .join("")
        : '<div class="empty">No upcoming deadlines</div>';

    document.getElementById("deadlineList").innerHTML = html;
  },

  renderSubjectOverview() {
    const html =
      this.subjects.length > 0
        ? this.subjects
            .map(
              (s) =>
                `<div class="subject-item" style="border-color: ${s.color}">
                    <strong>${s.name}</strong>
                    <span class="priority-badge ${s.priority}">${s.priority}</span>
                </div>`,
            )
            .join("")
        : '<div class="empty">No subjects added</div>';

    document.getElementById("subjectOverview").innerHTML = html;
  },

  // Subjects
  renderSubjects() {
    const html =
      this.subjects.length > 0
        ? this.subjects
            .map(
              (s) =>
                `<div class="subject-item" style="border-color: ${s.color}">
                    <div class="actions">
                        <button onclick="app.editSubject('${s.id}')"><i class="fa-solid fa-pen-to-square"></i></button>
                        <button onclick="app.deleteSubject('${s.id}')"><i class="fa-solid fa-delete-left"></i></button>
                    </div>
                    <h3>${s.name}</h3>
                    ${s.code ? `<div style="color: #888; font-size: 14px;">${s.code}</div>` : ""}
                    ${s.notes ? `<div style="margin-top: 10px; font-size: 14px;">${s.notes}</div>` : ""}
                    <span class="priority-badge ${s.priority}">${s.priority}</span>
                </div>`,
            )
            .join("")
        : '<div class="empty">No subjects yet. Add one to get started!</div>';

    document.getElementById("subjectList").innerHTML = html;
  },

  saveSubject() {
    const id =
      document.getElementById("editSubjectId").value || Date.now().toString();
    const subject = {
      id,
      name: document.getElementById("subjectName").value,
      code: document.getElementById("subjectCode").value,
      color: document.getElementById("subjectColor").value,
      priority: document.getElementById("subjectPriority").value,
      notes: document.getElementById("subjectNotes").value,
    };

    const index = this.subjects.findIndex((s) => s.id === id);
    if (index >= 0) {
      this.subjects[index] = subject;
    } else {
      this.subjects.push(subject);
    }

    this.save("subjects");
    this.closeModal();
    this.renderSubjects();
    this.updateSubjectSelects();
    this.updateDashboard();
    this.toast("Subject saved!");
  },

  editSubject(id) {
    const subject = this.subjects.find((s) => s.id === id);
    if (!subject) return;

    document.getElementById("subjectTitle").textContent = "Edit Subject";
    document.getElementById("editSubjectId").value = subject.id;
    document.getElementById("subjectName").value = subject.name;
    document.getElementById("subjectCode").value = subject.code;
    document.getElementById("subjectColor").value = subject.color;
    document.getElementById("subjectPriority").value = subject.priority;
    document.getElementById("subjectNotes").value = subject.notes;

    this.openModal("subject");
  },

  deleteSubject(id) {
    if (
      !confirm(
        "Delete this subject? Related schedules and tasks will also be removed.",
      )
    )
      return;

    this.subjects = this.subjects.filter((s) => s.id !== id);
    this.schedules = this.schedules.filter((s) => s.subjectId !== id);
    this.tasks = this.tasks.filter((t) => t.subjectId !== id);

    this.save("subjects");
    this.save("schedules");
    this.save("tasks");

    this.renderAll();
    this.updateDashboard();
    this.toast("Subject deleted");
  },

  // Schedule
  renderSchedule() {
    if (this.currentView === "daily") {
      this.renderDailySchedule();
    } else {
      this.renderWeeklySchedule();
    }
  },

  renderDailySchedule() {
    const dateStr = this.currentDate.toISOString().split("T")[0];
    const sessions = this.schedules.filter((s) => s.date === dateStr);

    const html =
      sessions.length > 0
        ? sessions
            .map((s) => {
              const subj = this.subjects.find((sub) => sub.id === s.subjectId);
              return `<div class="schedule-item" style="border-color: ${subj?.color || "#6366f1"}">
                    <div>
                        <h4>${subj?.name || "Unknown Subject"}</h4>
                        <div>${s.startTime} - ${s.endTime}</div>
                        ${s.topic ? `<div style="color: #888;">${s.topic}</div>` : ""}
                    </div>
                    <div class="actions">
                        <button onclick="app.editSchedule('${s.id}')"><i class="fa-solid fa-pen-to-square"></i></button>
                        <button onclick="app.deleteSchedule('${s.id}')"><i class="fa-solid fa-delete-left"></i></button>
                    </div>
                </div>`;
            })
            .join("")
        : '<div class="empty">No sessions scheduled for this day</div>';

    document.getElementById("dailySchedule").innerHTML = html;
  },

  renderWeeklySchedule() {
    const days = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];

    let html =
      '<div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 10px;">';

    days.forEach((day) => {
      const daySessions = this.schedules.filter(
        (s) => s.day && s.day.toLowerCase() === day.toLowerCase(),
      );

      html += `<div>
                <h4 style="text-align: center; margin-bottom: 10px;">${day}</h4>`;

      daySessions.forEach((s) => {
        const subj = this.subjects.find((sub) => sub.id === s.subjectId);
        html += `<div class="schedule-item" style="border-color: ${subj?.color || "#6366f1"}; cursor: pointer;" 
                         onclick="app.editSchedule('${s.id}')">
                    <div style="font-size: 13px;">
                        <strong>${subj?.name || "Unknown"}</strong><br>
                        ${s.startTime}
                    </div>
                </div>`;
      });

      html += "</div>";
    });

    html += "</div>";
    document.getElementById("weeklySchedule").innerHTML = html;
  },

  saveSchedule() {
    const id =
      document.getElementById("editScheduleId").value || Date.now().toString();
    const schedule = {
      id,
      subjectId: document.getElementById("scheduleSubject").value,
      date: document.getElementById("scheduleDate").value,
      day: document.getElementById("scheduleDay").value,
      startTime: document.getElementById("scheduleStart").value,
      endTime: document.getElementById("scheduleEnd").value,
      topic: document.getElementById("scheduleTopic").value,
    };

    const index = this.schedules.findIndex((s) => s.id === id);
    if (index >= 0) {
      this.schedules[index] = schedule;
    } else {
      this.schedules.push(schedule);
    }

    this.save("schedules");
    this.closeModal();
    this.renderSchedule();
    this.updateDashboard();
    this.toast("Session saved!");
  },

  editSchedule(id) {
    const schedule = this.schedules.find((s) => s.id === id);
    if (!schedule) return;

    document.getElementById("scheduleTitle").textContent = "Edit Session";
    document.getElementById("editScheduleId").value = schedule.id;
    document.getElementById("scheduleSubject").value = schedule.subjectId;
    document.getElementById("scheduleDate").value = schedule.date;
    document.getElementById("scheduleDay").value = schedule.day;
    document.getElementById("scheduleStart").value = schedule.startTime;
    document.getElementById("scheduleEnd").value = schedule.endTime;
    document.getElementById("scheduleTopic").value = schedule.topic;

    this.openModal("schedule");
  },

  deleteSchedule(id) {
    if (!confirm("Delete this session?")) return;

    this.schedules = this.schedules.filter((s) => s.id !== id);
    this.save("schedules");
    this.renderSchedule();
    this.updateDashboard();
    this.toast("Session deleted");
  },

  changeDay(delta) {
    this.currentDate = new Date(
      this.currentDate.getTime() + delta * 24 * 60 * 60 * 1000,
    );
    document.getElementById("dateInput").valueAsDate = this.currentDate;
    this.renderSchedule();
  },

  // Tasks
  renderTasks() {
    let filtered = this.tasks;

    if (this.currentFilter === "pending") {
      filtered = this.tasks.filter((t) => !t.completed);
    } else if (this.currentFilter === "completed") {
      filtered = this.tasks.filter((t) => t.completed);
    } else if (this.currentFilter === "overdue") {
      filtered = this.tasks.filter(
        (t) => !t.completed && new Date(t.deadline) < new Date(),
      );
    }

    const html =
      filtered.length > 0
        ? filtered
            .map((t) => {
              const subj = this.subjects.find((s) => s.id === t.subjectId);
              const days = Math.ceil(
                (new Date(t.deadline) - new Date()) / (1000 * 60 * 60 * 24),
              );

              return `<div class="task-item ${t.completed ? "completed" : ""}">
                    <input type="checkbox" ${t.completed ? "checked" : ""} 
                           onchange="app.toggleTask('${t.id}')">
                    <div class="task-content">
                        <h4>${t.title}</h4>
                        <div class="task-meta">
                            ${subj?.name || "Unknown"} • ${t.type} • 
                            <span class="priority-badge ${t.priority}">${t.priority}</span>
                            ${
                              !t.completed && days <= 7
                                ? `<span class="deadline-badge ${days < 0 ? "urgent" : days <= 3 ? "urgent" : "soon"}">
                                    ${days < 0 ? "Overdue" : days === 0 ? "Today" : days === 1 ? "Tomorrow" : days + " days"}
                                </span>`
                                : ""
                            }
                        </div>
                        ${t.description ? `<div style="margin-top: 5px; font-size: 14px;">${t.description}</div>` : ""}
                        <div style="margin-top: 5px; font-size: 13px; color: #888;">Due: ${t.deadline}</div>
                    </div>
                    <div class="actions">
                        <button onclick="app.editTask('${t.id}')"><i class="fa-solid fa-pen-to-square"></i></button>
                        <button onclick="app.deleteTask('${t.id}')"><i class="fa-solid fa-delete-left"></i></button>
                    </div>
                </div>`;
            })
            .join("")
        : '<div class="empty">No tasks found</div>';

    document.getElementById("taskList").innerHTML = html;
  },

  saveTask() {
    const id =
      document.getElementById("editTaskId").value || Date.now().toString();
    const task = {
      id,
      title: document.getElementById("taskName").value,
      subjectId: document.getElementById("taskSubject").value,
      type: document.getElementById("taskType").value,
      deadline: document.getElementById("taskDeadline").value,
      priority: document.getElementById("taskPriority").value,
      description: document.getElementById("taskDesc").value,
      completed: false,
    };

    const index = this.tasks.findIndex((t) => t.id === id);
    if (index >= 0) {
      task.completed = this.tasks[index].completed;
      this.tasks[index] = task;
    } else {
      this.tasks.push(task);
    }

    this.save("tasks");
    this.closeModal();
    this.renderTasks();
    this.updateDashboard();
    this.toast("Task saved!");
  },

  editTask(id) {
    const task = this.tasks.find((t) => t.id === id);
    if (!task) return;

    document.getElementById("taskTitle").textContent = "Edit Task";
    document.getElementById("editTaskId").value = task.id;
    document.getElementById("taskName").value = task.title;
    document.getElementById("taskSubject").value = task.subjectId;
    document.getElementById("taskType").value = task.type;
    document.getElementById("taskDeadline").value = task.deadline;
    document.getElementById("taskPriority").value = task.priority;
    document.getElementById("taskDesc").value = task.description;

    this.openModal("task");
  },

  deleteTask(id) {
    if (!confirm("Delete this task?")) return;

    this.tasks = this.tasks.filter((t) => t.id !== id);
    this.save("tasks");
    this.renderTasks();
    this.updateDashboard();
    this.toast("Task deleted");
  },

  toggleTask(id) {
    const task = this.tasks.find((t) => t.id === id);
    if (task) {
      task.completed = !task.completed;
      this.save("tasks");
      this.renderTasks();
      this.updateDashboard();
    }
  },

  // Helpers
  updateSubjectSelects() {
    const options = this.subjects
      .map((s) => `<option value="${s.id}">${s.name}</option>`)
      .join("");

    document.getElementById("scheduleSubject").innerHTML =
      '<option value="">Select Subject</option>' + options;
    document.getElementById("taskSubject").innerHTML =
      '<option value="">Select Subject</option>' + options;
  },

  openModal(type) {
    // Reset forms
    document.getElementById("subjectForm").reset();
    document.getElementById("scheduleForm").reset();
    document.getElementById("taskForm").reset();

    document.getElementById("editSubjectId").value = "";
    document.getElementById("editScheduleId").value = "";
    document.getElementById("editTaskId").value = "";

    document.getElementById("subjectTitle").textContent = "Add Subject";
    document.getElementById("scheduleTitle").textContent = "Add Session";
    document.getElementById("taskTitle").textContent = "Add Task";

    if (type === "schedule") {
      document.getElementById("scheduleDate").value = this.currentDate
        .toISOString()
        .split("T")[0];
    }

    document.getElementById(type + "Modal").classList.add("active");
  },

  closeModal() {
    document
      .querySelectorAll(".modal")
      .forEach((m) => m.classList.remove("active"));
  },

  toast(msg) {
    const toast = document.getElementById("toast");
    toast.textContent = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2000);
  },

  // Charts (basic implementation)
  renderCharts() {
    // Destroy existing charts if they exist
    if (window.timeChartInstance) window.timeChartInstance.destroy();
    if (window.taskChartInstance) window.taskChartInstance.destroy();
    if (window.weekChartInstance) window.weekChartInstance.destroy();

    // Time by Subject Chart
    const subjectNames = this.subjects.map((s) => s.name);
    const subjectHours = this.subjects.map(
      () => Math.floor(Math.random() * 20) + 5,
    );
    const subjectColors = this.subjects.map((s) => s.color);

    const timeCtx = document.getElementById("timeChart").getContext("2d");
    window.timeChartInstance = new Chart(timeCtx, {
      type: "bar",
      data: {
        labels: subjectNames.length > 0 ? subjectNames : ["No Data"],
        datasets: [
          {
            label: "Hours Studied",
            data: subjectHours.length > 0 ? subjectHours : [0],
            backgroundColor:
              subjectColors.length > 0 ? subjectColors : ["#ddd"],
            borderRadius: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false },
        },
      },
    });

    // Task Completion Chart
    const completedTasks = this.tasks.filter((t) => t.completed).length;
    const pendingTasks = this.tasks.length - completedTasks;

    const taskCtx = document.getElementById("taskChart").getContext("2d");
    window.taskChartInstance = new Chart(taskCtx, {
      type: "doughnut",
      data: {
        labels: ["Completed", "Pending"],
        datasets: [
          {
            data:
              this.tasks.length > 0 ? [completedTasks, pendingTasks] : [1, 1],
            backgroundColor: ["#10b981", "#f59e0b"],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
      },
    });

    // Weekly Hours Chart
    const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const weekHours = weekDays.map(() => Math.floor(Math.random() * 8) + 1);

    const weekCtx = document.getElementById("weekChart").getContext("2d");
    window.weekChartInstance = new Chart(weekCtx, {
      type: "line",
      data: {
        labels: weekDays,
        datasets: [
          {
            label: "Study Hours",
            data: weekHours,
            borderColor: "#2563eb",
            backgroundColor: "rgba(37, 99, 235, 0.1)",
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false },
        },
      },
    });

    // Insights
    const insights =
      this.subjects.length > 0
        ? `<div style="font-size: 16px; line-height: 1.8;">
               📚 You have ${this.subjects.length} subject${this.subjects.length !== 1 ? "s" : ""}<br>
               ✓ ${this.tasks.filter((t) => t.completed).length} / ${this.tasks.length} tasks completed<br>
               📅 ${this.schedules.length} session${this.schedules.length !== 1 ? "s" : ""} scheduled<br>
               🎯 ${completedTasks > 0 ? Math.round((completedTasks / this.tasks.length) * 100) : 0}% completion rate</div>`
        : '<div style="color: #888;">Add subjects and tasks to see insights</div>';

    document.getElementById("insights").innerHTML = insights;
  },

  // Export data
  exportData() {
    const data = {
      subjects: this.subjects,
      schedules: this.schedules,
      tasks: this.tasks,
      settings: this.settings,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "study-planner-backup.json";
    a.click();

    this.toast("Data exported!");
  },

  // Reset all data
  resetData() {
    if (!confirm("Are you sure? This will delete all your data!")) return;

    this.subjects = [];
    this.schedules = [];
    this.tasks = [];

    this.save("subjects");
    this.save("schedules");
    this.save("tasks");

    this.renderAll();
    this.updateDashboard();
    this.toast("All data reset");
  },
};

// Start the app when page loads
document.addEventListener("DOMContentLoaded", () => app.init());

// Close modals when clicking outside
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("modal")) {
    app.closeModal();
  }
});
