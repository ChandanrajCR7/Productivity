// Smart Study Planner - Main JavaScript File
// ============================================

// Data Storage Keys
const STORAGE_KEYS = {
    SUBJECTS: 'studyPlanner_subjects',
    SCHEDULES: 'studyPlanner_schedules',
    TASKS: 'studyPlanner_tasks',
    SETTINGS: 'studyPlanner_settings',
    THEME: 'studyPlanner_theme'
};

// Global State
let subjects = [];
let schedules = [];
let tasks = [];
let settings = {
    deadlineReminders: true,
    sessionReminders: true
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    loadFromLocalStorage();
    initializeUI();
    setupEventListeners();
    updateDashboard();
    setCurrentDate();
    checkReminders();
    
    // Check for reminders every minute
    setInterval(checkReminders, 60000);
});

// ============================================
// LocalStorage Functions
// ============================================

function loadFromLocalStorage() {
    try {
        // Load subjects
        const savedSubjects = localStorage.getItem(STORAGE_KEYS.SUBJECTS);
        subjects = savedSubjects ? JSON.parse(savedSubjects) : [];
        
        // Load schedules
        const savedSchedules = localStorage.getItem(STORAGE_KEYS.SCHEDULES);
        schedules = savedSchedules ? JSON.parse(savedSchedules) : [];
        
        // Load tasks
        const savedTasks = localStorage.getItem(STORAGE_KEYS.TASKS);
        tasks = savedTasks ? JSON.parse(savedTasks) : [];
        
        // Load settings
        const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        if (savedSettings) {
            settings = JSON.parse(savedSettings);
        }
        
        // Load theme
        const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
        if (savedTheme) {
            document.body.setAttribute('data-theme', savedTheme);
            updateThemeButtons(savedTheme);
        } else {
            document.body.setAttribute('data-theme', 'dark');
        }
        
        console.log('Data loaded from LocalStorage successfully');
    } catch (error) {
        console.error('Error loading from LocalStorage:', error);
        showToast('Error loading saved data', 'error');
    }
}

function saveToLocalStorage(type) {
    try {
        switch(type) {
            case 'subjects':
                localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(subjects));
                break;
            case 'schedules':
                localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(schedules));
                break;
            case 'tasks':
                localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
                break;
            case 'settings':
                localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
                break;
            case 'theme':
                const theme = document.body.getAttribute('data-theme');
                localStorage.setItem(STORAGE_KEYS.THEME, theme);
                break;
        }
        console.log(`${type} saved to LocalStorage`);
    } catch (error) {
        console.error(`Error saving ${type} to LocalStorage:`, error);
        showToast('Error saving data', 'error');
    }
}

// ============================================
// UI Initialization
// ============================================

function initializeUI() {
    renderSubjects();
    renderSchedule();
    renderTasks();
    updateAnalytics();
    
    // Set settings checkboxes
    document.getElementById('deadlineReminders').checked = settings.deadlineReminders;
    document.getElementById('sessionReminders').checked = settings.sessionReminders;
}

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const section = item.getAttribute('data-section');
            navigateToSection(section);
        });
    });
    
    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    
    // Theme buttons in settings
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.getAttribute('data-theme');
            setTheme(theme);
        });
    });
    
    // Schedule view tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.getAttribute('data-view');
            switchScheduleView(view);
        });
    });
    
    // Task filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.getAttribute('data-filter');
            filterTasks(filter);
        });
    });
    
    // Forms
    document.getElementById('subjectForm').addEventListener('submit', handleSubjectSubmit);
    document.getElementById('scheduleForm').addEventListener('submit', handleScheduleSubmit);
    document.getElementById('taskForm').addEventListener('submit', handleTaskSubmit);
    
    // Date input
    document.getElementById('scheduleDate').addEventListener('change', (e) => {
        renderDailySchedule(e.target.value);
    });
    
    // Settings
    document.getElementById('deadlineReminders').addEventListener('change', (e) => {
        settings.deadlineReminders = e.target.checked;
        saveToLocalStorage('settings');
    });
    
    document.getElementById('sessionReminders').addEventListener('change', (e) => {
        settings.sessionReminders = e.target.checked;
        saveToLocalStorage('settings');
    });
}

// ============================================
// Navigation
// ============================================

function navigateToSection(sectionName) {
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-section') === sectionName) {
            item.classList.add('active');
        }
    });
    
    // Show active section
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionName).classList.add('active');
    
    // Refresh section-specific data
    if (sectionName === 'analytics') {
        updateAnalytics();
    }
}

// ============================================
// Theme Functions
// ============================================

function toggleTheme() {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
}

function setTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    updateThemeButtons(theme);
    saveToLocalStorage('theme');
}

function updateThemeButtons(theme) {
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-theme') === theme) {
            btn.classList.add('active');
        }
    });
}

// ============================================
// Subject Management
// ============================================

function openSubjectModal(subjectId = null) {
    const modal = document.getElementById('subjectModal');
    const form = document.getElementById('subjectForm');
    const title = document.getElementById('subjectModalTitle');
    
    form.reset();
    
    if (subjectId) {
        const subject = subjects.find(s => s.id === subjectId);
        if (subject) {
            title.textContent = 'Edit Subject';
            document.getElementById('subjectId').value = subject.id;
            document.getElementById('subjectName').value = subject.name;
            document.getElementById('subjectCode').value = subject.code || '';
            document.getElementById('subjectColor').value = subject.color;
            document.getElementById('subjectPriority').value = subject.priority;
            document.getElementById('subjectNotes').value = subject.notes || '';
        }
    } else {
        title.textContent = 'Add Subject';
        document.getElementById('subjectId').value = '';
    }
    
    modal.classList.add('active');
}

function closeSubjectModal() {
    document.getElementById('subjectModal').classList.remove('active');
}

function handleSubjectSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('subjectId').value;
    const name = document.getElementById('subjectName').value.trim();
    const code = document.getElementById('subjectCode').value.trim();
    const color = document.getElementById('subjectColor').value;
    const priority = document.getElementById('subjectPriority').value;
    const notes = document.getElementById('subjectNotes').value.trim();
    
    if (!name) {
        showToast('Please enter a subject name', 'error');
        return;
    }
    
    if (id) {
        // Edit existing subject
        const index = subjects.findIndex(s => s.id === id);
        if (index !== -1) {
            subjects[index] = { ...subjects[index], name, code, color, priority, notes, updatedAt: new Date().toISOString() };
            showToast('Subject updated successfully', 'success');
        }
    } else {
        // Add new subject
        const newSubject = {
            id: generateId(),
            name,
            code,
            color,
            priority,
            notes,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        subjects.push(newSubject);
        showToast('Subject added successfully', 'success');
    }
    
    saveToLocalStorage('subjects');
    renderSubjects();
    updateDashboard();
    updateSubjectSelects();
    closeSubjectModal();
}

function deleteSubject(subjectId) {
    if (confirm('Are you sure you want to delete this subject? All related schedules and tasks will also be removed.')) {
        subjects = subjects.filter(s => s.id !== subjectId);
        schedules = schedules.filter(sch => sch.subjectId !== subjectId);
        tasks = tasks.filter(t => t.subjectId !== subjectId);
        
        saveToLocalStorage('subjects');
        saveToLocalStorage('schedules');
        saveToLocalStorage('tasks');
        
        renderSubjects();
        renderSchedule();
        renderTasks();
        updateDashboard();
        updateSubjectSelects();
        
        showToast('Subject deleted successfully', 'success');
    }
}

function renderSubjects() {
    const container = document.getElementById('subjectsList');
    
    if (subjects.length === 0) {
        container.innerHTML = `
            <div class="empty-state-large">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
                <h3>No Subjects Yet</h3>
                <p>Start by adding your first subject to organize your study plan</p>
                <button class="btn-primary" onclick="openSubjectModal()">Add Your First Subject</button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = subjects.map(subject => `
        <div class="subject-card" style="--subject-color: ${subject.color}">
            <div class="subject-header">
                <div class="subject-info">
                    <h3>${escapeHtml(subject.name)}</h3>
                    ${subject.code ? `<span class="subject-code">${escapeHtml(subject.code)}</span>` : ''}
                </div>
                <div class="subject-actions">
                    <button onclick="openSubjectModal('${subject.id}')" aria-label="Edit subject">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                    <button onclick="deleteSubject('${subject.id}')" aria-label="Delete subject">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                    </button>
                </div>
            </div>
            ${subject.notes ? `<p class="subject-notes">${escapeHtml(subject.notes)}</p>` : ''}
            <div class="subject-footer">
                <span class="priority-badge ${subject.priority}">${subject.priority.toUpperCase()}</span>
                <span style="color: ${subject.color}; font-weight: 600;">●</span>
            </div>
        </div>
    `).join('');
    
    updateSubjectSelects();
}

function updateSubjectSelects() {
    const scheduleSelect = document.getElementById('scheduleSubject');
    const taskSelect = document.getElementById('taskSubject');
    
    const options = subjects.map(s => 
        `<option value="${s.id}">${escapeHtml(s.name)}</option>`
    ).join('');
    
    const defaultOption = '<option value="">Select a subject</option>';
    
    scheduleSelect.innerHTML = defaultOption + options;
    taskSelect.innerHTML = defaultOption + options;
}

// ============================================
// Schedule Management
// ============================================

function openScheduleModal(scheduleId = null) {
    const modal = document.getElementById('scheduleModal');
    const form = document.getElementById('scheduleForm');
    const title = document.getElementById('scheduleModalTitle');
    
    form.reset();
    
    if (scheduleId) {
        const schedule = schedules.find(s => s.id === scheduleId);
        if (schedule) {
            title.textContent = 'Edit Study Session';
            document.getElementById('scheduleId').value = schedule.id;
            document.getElementById('scheduleSubject').value = schedule.subjectId;
            document.getElementById('scheduleDate2').value = schedule.date;
            document.getElementById('scheduleDay').value = schedule.day || '';
            document.getElementById('scheduleStartTime').value = schedule.startTime;
            document.getElementById('scheduleEndTime').value = schedule.endTime;
            document.getElementById('scheduleTopic').value = schedule.topic || '';
        }
    } else {
        title.textContent = 'Add Study Session';
        document.getElementById('scheduleId').value = '';
        document.getElementById('scheduleDate2').value = getTodayDate();
    }
    
    modal.classList.add('active');
}

function closeScheduleModal() {
    document.getElementById('scheduleModal').classList.remove('active');
}

function handleScheduleSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('scheduleId').value;
    const subjectId = document.getElementById('scheduleSubject').value;
    const date = document.getElementById('scheduleDate2').value;
    const day = document.getElementById('scheduleDay').value;
    const startTime = document.getElementById('scheduleStartTime').value;
    const endTime = document.getElementById('scheduleEndTime').value;
    const topic = document.getElementById('scheduleTopic').value.trim();
    
    if (!subjectId || !date || !startTime || !endTime) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    // Validate time
    if (startTime >= endTime) {
        showToast('End time must be after start time', 'error');
        return;
    }
    
    // Check for conflicts
    const conflict = checkScheduleConflict(date, startTime, endTime, id);
    if (conflict) {
        showToast('Time conflict with existing session', 'error');
        return;
    }
    
    if (id) {
        // Edit existing schedule
        const index = schedules.findIndex(s => s.id === id);
        if (index !== -1) {
            schedules[index] = { 
                ...schedules[index], 
                subjectId, 
                date, 
                day, 
                startTime, 
                endTime, 
                topic,
                updatedAt: new Date().toISOString() 
            };
            showToast('Session updated successfully', 'success');
        }
    } else {
        // Add new schedule
        const newSchedule = {
            id: generateId(),
            subjectId,
            date,
            day,
            startTime,
            endTime,
            topic,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        schedules.push(newSchedule);
        showToast('Session added successfully', 'success');
    }
    
    saveToLocalStorage('schedules');
    renderSchedule();
    updateDashboard();
    closeScheduleModal();
}

function checkScheduleConflict(date, startTime, endTime, excludeId = null) {
    return schedules.some(schedule => {
        if (excludeId && schedule.id === excludeId) return false;
        if (schedule.date !== date) return false;
        
        // Check if times overlap
        return (startTime < schedule.endTime && endTime > schedule.startTime);
    });
}

function deleteSchedule(scheduleId) {
    if (confirm('Are you sure you want to delete this session?')) {
        schedules = schedules.filter(s => s.id !== scheduleId);
        saveToLocalStorage('schedules');
        renderSchedule();
        updateDashboard();
        showToast('Session deleted successfully', 'success');
    }
}

function renderSchedule() {
    const currentDate = document.getElementById('scheduleDate').value || getTodayDate();
    document.getElementById('scheduleDate').value = currentDate;
    renderDailySchedule(currentDate);
    renderWeeklySchedule();
}

function renderDailySchedule(date) {
    const container = document.getElementById('dailyTimeline');
    const daySessions = schedules.filter(s => s.date === date).sort((a, b) => 
        a.startTime.localeCompare(b.startTime)
    );
    
    if (daySessions.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <p>No sessions scheduled for this day</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = daySessions.map(session => {
        const subject = subjects.find(s => s.id === session.subjectId);
        if (!subject) return '';
        
        return `
            <div class="timeline-item" style="border-left-color: ${subject.color}">
                <div class="timeline-time">${formatTime(session.startTime)} - ${formatTime(session.endTime)}</div>
                <div class="timeline-content">
                    <h4>${escapeHtml(subject.name)}</h4>
                    ${session.topic ? `<p class="timeline-topic">${escapeHtml(session.topic)}</p>` : ''}
                </div>
                <div class="timeline-actions">
                    <button onclick="openScheduleModal('${session.id}')" aria-label="Edit session">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                    <button onclick="deleteSchedule('${session.id}')" aria-label="Delete session">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function renderWeeklySchedule() {
    const container = document.getElementById('weeklyGrid');
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const hours = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'];
    
    let html = '<div class="week-header"></div>';
    days.forEach(day => {
        html += `<div class="week-header">${day}</div>`;
    });
    
    hours.forEach(hour => {
        html += `<div class="week-time">${hour}</div>`;
        days.forEach(day => {
            const daySessions = schedules.filter(s => 
                s.day && s.day.toLowerCase() === day.toLowerCase()
            );
            
            let cellContent = '';
            daySessions.forEach(session => {
                const subject = subjects.find(s => s.id === session.subjectId);
                if (subject) {
                    cellContent += `
                        <div class="week-cell-session" style="background: ${subject.color}" 
                             onclick="openScheduleModal('${session.id}')">
                            ${escapeHtml(subject.name)}<br>
                            ${formatTime(session.startTime)}
                        </div>
                    `;
                }
            });
            
            html += `<div class="week-cell">${cellContent}</div>`;
        });
    });
    
    container.innerHTML = html;
}

function switchScheduleView(view) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-view') === view) {
            btn.classList.add('active');
        }
    });
    
    document.querySelectorAll('.schedule-view').forEach(v => {
        v.classList.remove('active');
    });
    
    if (view === 'daily') {
        document.getElementById('dailyView').classList.add('active');
    } else {
        document.getElementById('weeklyView').classList.add('active');
    }
}

function changeDate(days) {
    const dateInput = document.getElementById('scheduleDate');
    const currentDate = new Date(dateInput.value);
    currentDate.setDate(currentDate.getDate() + days);
    const newDate = currentDate.toISOString().split('T')[0];
    dateInput.value = newDate;
    renderDailySchedule(newDate);
}

// ============================================
// Task Management
// ============================================

function openTaskModal(taskId = null) {
    const modal = document.getElementById('taskModal');
    const form = document.getElementById('taskForm');
    const title = document.getElementById('taskModalTitle');
    
    form.reset();
    
    if (taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            title.textContent = 'Edit Task';
            document.getElementById('taskId').value = task.id;
            document.getElementById('taskTitle').value = task.title;
            document.getElementById('taskSubject').value = task.subjectId;
            document.getElementById('taskType').value = task.type;
            document.getElementById('taskDeadline').value = task.deadline;
            document.getElementById('taskPriority').value = task.priority;
            document.getElementById('taskDescription').value = task.description || '';
        }
    } else {
        title.textContent = 'Add Task';
        document.getElementById('taskId').value = '';
    }
    
    modal.classList.add('active');
}

function closeTaskModal() {
    document.getElementById('taskModal').classList.remove('active');
}

function handleTaskSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('taskId').value;
    const title = document.getElementById('taskTitle').value.trim();
    const subjectId = document.getElementById('taskSubject').value;
    const type = document.getElementById('taskType').value;
    const deadline = document.getElementById('taskDeadline').value;
    const priority = document.getElementById('taskPriority').value;
    const description = document.getElementById('taskDescription').value.trim();
    
    if (!title || !subjectId || !type || !deadline || !priority) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    if (id) {
        // Edit existing task
        const index = tasks.findIndex(t => t.id === id);
        if (index !== -1) {
            tasks[index] = { 
                ...tasks[index], 
                title, 
                subjectId, 
                type, 
                deadline, 
                priority, 
                description,
                updatedAt: new Date().toISOString() 
            };
            showToast('Task updated successfully', 'success');
        }
    } else {
        // Add new task
        const newTask = {
            id: generateId(),
            title,
            subjectId,
            type,
            deadline,
            priority,
            description,
            completed: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        tasks.push(newTask);
        showToast('Task added successfully', 'success');
    }
    
    saveToLocalStorage('tasks');
    renderTasks();
    updateDashboard();
    closeTaskModal();
}

function toggleTaskCompletion(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        task.updatedAt = new Date().toISOString();
        saveToLocalStorage('tasks');
        renderTasks();
        updateDashboard();
        showToast(task.completed ? 'Task completed!' : 'Task reopened', 'success');
    }
}

function deleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
        tasks = tasks.filter(t => t.id !== taskId);
        saveToLocalStorage('tasks');
        renderTasks();
        updateDashboard();
        showToast('Task deleted successfully', 'success');
    }
}

function renderTasks(filter = 'all') {
    const container = document.getElementById('tasksList');
    
    let filteredTasks = tasks;
    const today = getTodayDate();
    
    switch(filter) {
        case 'pending':
            filteredTasks = tasks.filter(t => !t.completed);
            break;
        case 'completed':
            filteredTasks = tasks.filter(t => t.completed);
            break;
        case 'overdue':
            filteredTasks = tasks.filter(t => !t.completed && t.deadline < today);
            break;
    }
    
    if (filteredTasks.length === 0) {
        container.innerHTML = `
            <div class="empty-state-large">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M9 11l3 3L22 4"/>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                </svg>
                <h3>No Tasks Found</h3>
                <p>${filter === 'all' ? 'Add tasks to keep track of your assignments and exams' : 'No tasks match this filter'}</p>
                ${filter === 'all' ? '<button class="btn-primary" onclick="openTaskModal()">Add Your First Task</button>' : ''}
            </div>
        `;
        return;
    }
    
    // Sort tasks by deadline
    filteredTasks.sort((a, b) => a.deadline.localeCompare(b.deadline));
    
    container.innerHTML = filteredTasks.map(task => {
        const subject = subjects.find(s => s.id === task.subjectId);
        if (!subject) return '';
        
        const daysUntil = getDaysUntilDate(task.deadline);
        let deadlineBadge = 'normal';
        if (daysUntil < 0) deadlineBadge = 'urgent';
        else if (daysUntil <= 3) deadlineBadge = 'soon';
        
        return `
            <div class="task-card ${task.completed ? 'completed' : ''}">
                <div class="task-checkbox ${task.completed ? 'checked' : ''}" 
                     onclick="toggleTaskCompletion('${task.id}')">
                </div>
                <div class="task-content">
                    <div class="task-header">
                        <div>
                            <h3 class="task-title">${escapeHtml(task.title)}</h3>
                            <div class="task-meta">
                                <span class="task-subject" style="color: ${subject.color}">
                                    ${escapeHtml(subject.name)}
                                </span>
                                <span class="task-type">${escapeHtml(task.type)}</span>
                                <span class="priority-badge ${task.priority}">${task.priority.toUpperCase()}</span>
                                ${!task.completed ? `<span class="deadline-badge ${deadlineBadge}">
                                    ${daysUntil < 0 ? 'Overdue' : daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days`}
                                </span>` : ''}
                            </div>
                        </div>
                        <div class="task-actions">
                            <button onclick="openTaskModal('${task.id}')" aria-label="Edit task">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                </svg>
                            </button>
                            <button onclick="deleteTask('${task.id}')" aria-label="Delete task">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <polyline points="3 6 5 6 21 6"/>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                    ${task.description ? `<p class="task-description">${escapeHtml(task.description)}</p>` : ''}
                    <p class="task-deadline-info">Due: ${formatDate(task.deadline)}</p>
                </div>
            </div>
        `;
    }).join('');
}

function filterTasks(filter) {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-filter') === filter) {
            btn.classList.add('active');
        }
    });
    
    renderTasks(filter);
}

// ============================================
// Dashboard
// ============================================

function updateDashboard() {
    // Update stats
    document.getElementById('totalSubjects').textContent = subjects.length;
    document.getElementById('totalTasks').textContent = tasks.filter(t => !t.completed).length;
    
    // Calculate study hours this week
    const weekStart = getWeekStartDate();
    const weekEnd = getWeekEndDate();
    const weekSchedules = schedules.filter(s => s.date >= weekStart && s.date <= weekEnd);
    const totalMinutes = weekSchedules.reduce((sum, schedule) => {
        const start = parseTime(schedule.startTime);
        const end = parseTime(schedule.endTime);
        return sum + (end - start);
    }, 0);
    document.getElementById('studyHours').textContent = `${Math.round(totalMinutes / 60)}h`;
    
    // Calculate completion rate
    const completionRate = tasks.length > 0 
        ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100)
        : 0;
    document.getElementById('completionRate').textContent = `${completionRate}%`;
    
    // Update today's schedule
    renderTodaySchedule();
    
    // Update upcoming deadlines
    renderUpcomingDeadlines();
    
    // Update priority overview
    renderPriorityOverview();
}

function renderTodaySchedule() {
    const container = document.getElementById('todaySchedule');
    const today = getTodayDate();
    const todaySessions = schedules.filter(s => s.date === today).sort((a, b) => 
        a.startTime.localeCompare(b.startTime)
    );
    
    if (todaySessions.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <p>No sessions scheduled for today</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = todaySessions.map(session => {
        const subject = subjects.find(s => s.id === session.subjectId);
        if (!subject) return '';
        
        return `
            <div class="schedule-item" style="border-left-color: ${subject.color}">
                <div class="schedule-item-header">
                    <h4>${escapeHtml(subject.name)}</h4>
                    <span class="schedule-time">${formatTime(session.startTime)} - ${formatTime(session.endTime)}</span>
                </div>
                ${session.topic ? `<p class="schedule-topic">${escapeHtml(session.topic)}</p>` : ''}
            </div>
        `;
    }).join('');
}

function renderUpcomingDeadlines() {
    const container = document.getElementById('upcomingDeadlines');
    const today = getTodayDate();
    const upcomingTasks = tasks
        .filter(t => !t.completed && t.deadline >= today)
        .sort((a, b) => a.deadline.localeCompare(b.deadline))
        .slice(0, 5);
    
    if (upcomingTasks.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                </svg>
                <p>No upcoming deadlines</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = upcomingTasks.map(task => {
        const subject = subjects.find(s => s.id === task.subjectId);
        if (!subject) return '';
        
        const daysUntil = getDaysUntilDate(task.deadline);
        let badgeClass = 'normal';
        if (daysUntil <= 1) badgeClass = 'urgent';
        else if (daysUntil <= 3) badgeClass = 'soon';
        
        return `
            <div class="deadline-item" style="border-left-color: ${subject.color}">
                <div class="deadline-item-header">
                    <div>
                        <h4>${escapeHtml(task.title)}</h4>
                        <p style="color: ${subject.color}; font-size: 0.875rem; margin-top: 0.25rem;">
                            ${escapeHtml(subject.name)}
                        </p>
                    </div>
                    <span class="deadline-badge ${badgeClass}">
                        ${daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days`}
                    </span>
                </div>
            </div>
        `;
    }).join('');
}

function renderPriorityOverview() {
    const container = document.getElementById('priorityOverview');
    
    if (subjects.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
                <p>Add subjects to see priority overview</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = subjects.map(subject => `
        <div class="priority-item" style="border-left: 4px solid ${subject.color}">
            <h4>${escapeHtml(subject.name)}</h4>
            <span class="priority-badge ${subject.priority}">${subject.priority.toUpperCase()}</span>
        </div>
    `).join('');
}

// ============================================
// Analytics
// ============================================

function updateAnalytics() {
    renderCharts();
    renderPerformanceList();
    renderInsights();
}

function renderCharts() {
    // This is a simplified version. In production, you'd use a charting library
    // For now, we'll just show text-based analytics
    
    const studyTimeChart = document.getElementById('studyTimeChart');
    const completionChart = document.getElementById('completionChart');
    const weeklyChart = document.getElementById('weeklyChart');
    
    // Clear existing content
    studyTimeChart.innerHTML = '';
    completionChart.innerHTML = '';
    weeklyChart.innerHTML = '';
    
    // Add placeholder text
    studyTimeChart.parentElement.innerHTML = `
        <h3>Study Time Distribution</h3>
        <div style="padding: 2rem; text-align: center; color: var(--text-secondary);">
            <p>Chart visualization would appear here</p>
            <p style="font-size: 0.875rem; margin-top: 0.5rem;">Total sessions: ${schedules.length}</p>
        </div>
    `;
    
    const completedTasks = tasks.filter(t => t.completed).length;
    const totalTasks = tasks.length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    completionChart.parentElement.innerHTML = `
        <h3>Task Completion Rate</h3>
        <div style="padding: 2rem; text-align: center;">
            <div style="font-size: 3rem; font-weight: 700; color: var(--accent-primary);">${completionRate}%</div>
            <p style="color: var(--text-secondary); margin-top: 0.5rem;">${completedTasks} of ${totalTasks} tasks completed</p>
        </div>
    `;
    
    weeklyChart.parentElement.innerHTML = `
        <h3>Weekly Study Hours</h3>
        <div style="padding: 2rem; text-align: center; color: var(--text-secondary);">
            <p>Weekly trends chart would appear here</p>
        </div>
    `;
}

function renderPerformanceList() {
    const container = document.getElementById('performanceList');
    
    if (subjects.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>No data available yet</p>
            </div>
        `;
        return;
    }
    
    const subjectPerformance = subjects.map(subject => {
        const subjectTasks = tasks.filter(t => t.subjectId === subject.id);
        const completedTasks = subjectTasks.filter(t => t.completed).length;
        const score = subjectTasks.length > 0 
            ? Math.round((completedTasks / subjectTasks.length) * 100)
            : 0;
        
        return {
            name: subject.name,
            score: score,
            color: subject.color
        };
    });
    
    container.innerHTML = subjectPerformance.map(perf => `
        <div class="performance-item">
            <span class="performance-subject">${escapeHtml(perf.name)}</span>
            <div class="performance-bar">
                <div class="performance-fill" style="width: ${perf.score}%; background: ${perf.color}"></div>
            </div>
            <span class="performance-score">${perf.score}%</span>
        </div>
    `).join('');
}

function renderInsights() {
    const container = document.getElementById('insightsList');
    const insights = [];
    
    // Generate insights
    const overdueTasks = tasks.filter(t => !t.completed && t.deadline < getTodayDate()).length;
    if (overdueTasks > 0) {
        insights.push({
            icon: '⚠️',
            text: `You have ${overdueTasks} overdue task${overdueTasks > 1 ? 's' : ''}. Consider reviewing your priorities.`
        });
    }
    
    const upcomingDeadlines = tasks.filter(t => {
        const days = getDaysUntilDate(t.deadline);
        return !t.completed && days <= 3 && days >= 0;
    }).length;
    if (upcomingDeadlines > 0) {
        insights.push({
            icon: '🎯',
            text: `${upcomingDeadlines} deadline${upcomingDeadlines > 1 ? 's' : ''} coming up in the next 3 days. Stay focused!`
        });
    }
    
    const highPrioritySubjects = subjects.filter(s => s.priority === 'high').length;
    if (highPrioritySubjects > 0) {
        insights.push({
            icon: '⭐',
            text: `You have ${highPrioritySubjects} high-priority subject${highPrioritySubjects > 1 ? 's' : ''}. Allocate more study time accordingly.`
        });
    }
    
    const completionRate = tasks.length > 0 
        ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100)
        : 0;
    if (completionRate >= 80) {
        insights.push({
            icon: '🎉',
            text: `Excellent work! You've completed ${completionRate}% of your tasks. Keep up the momentum!`
        });
    }
    
    if (insights.length === 0) {
        insights.push({
            icon: '💡',
            text: 'Add more subjects and tasks to get personalized insights about your study habits.'
        });
    }
    
    container.innerHTML = insights.map(insight => `
        <div class="insight-item">
            <span class="insight-icon">${insight.icon}</span>
            <p>${insight.text}</p>
        </div>
    `).join('');
}

// ============================================
// Settings Functions
// ============================================

function exportData() {
    const data = {
        subjects,
        schedules,
        tasks,
        settings,
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `study-planner-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    showToast('Data exported successfully', 'success');
}

function confirmReset() {
    if (confirm('Are you sure you want to reset all data? This action cannot be undone.')) {
        if (confirm('This will delete all subjects, schedules, and tasks. Are you absolutely sure?')) {
            resetAllData();
        }
    }
}

function resetAllData() {
    subjects = [];
    schedules = [];
    tasks = [];
    
    localStorage.removeItem(STORAGE_KEYS.SUBJECTS);
    localStorage.removeItem(STORAGE_KEYS.SCHEDULES);
    localStorage.removeItem(STORAGE_KEYS.TASKS);
    
    initializeUI();
    updateDashboard();
    
    showToast('All data has been reset', 'success');
}

// ============================================
// Reminder System
// ============================================

function checkReminders() {
    if (!settings.deadlineReminders && !settings.sessionReminders) {
        return;
    }
    
    const now = new Date();
    const today = getTodayDate();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    // Check deadline reminders
    if (settings.deadlineReminders) {
        const urgentTasks = tasks.filter(t => {
            if (t.completed) return false;
            const daysUntil = getDaysUntilDate(t.deadline);
            return daysUntil === 0 || daysUntil === 1;
        });
        
        if (urgentTasks.length > 0 && now.getMinutes() === 0) {
            const message = urgentTasks.length === 1
                ? `Reminder: "${urgentTasks[0].title}" is due ${getDaysUntilDate(urgentTasks[0].deadline) === 0 ? 'today' : 'tomorrow'}!`
                : `You have ${urgentTasks.length} tasks due soon!`;
            showToast(message, 'warning');
        }
    }
    
    // Check session reminders
    if (settings.sessionReminders) {
        const upcomingSessions = schedules.filter(s => {
            if (s.date !== today) return false;
            const sessionTime = s.startTime.substring(0, 5);
            const timeDiff = parseTime(sessionTime) - parseTime(currentTime);
            return timeDiff > 0 && timeDiff <= 15; // 15 minutes before
        });
        
        if (upcomingSessions.length > 0) {
            const session = upcomingSessions[0];
            const subject = subjects.find(s => s.id === session.subjectId);
            if (subject) {
                showToast(`Upcoming session: ${subject.name} at ${formatTime(session.startTime)}`, 'warning');
            }
        }
    }
}

// ============================================
// Utility Functions
// ============================================

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function getTodayDate() {
    return new Date().toISOString().split('T')[0];
}

function getWeekStartDate() {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(now.setDate(diff)).toISOString().split('T')[0];
}

function getWeekEndDate() {
    const start = new Date(getWeekStartDate());
    start.setDate(start.getDate() + 6);
    return start.toISOString().split('T')[0];
}

function getDaysUntilDate(dateString) {
    const today = new Date(getTodayDate());
    const target = new Date(dateString);
    const diffTime = target - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function formatTime(timeString) {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
}

function parseTime(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
}

function setCurrentDate() {
    const dateElement = document.getElementById('currentDate');
    if (dateElement) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateElement.textContent = new Date().toLocaleDateString('en-US', options);
    }
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ============================================
// Global Functions (accessed by onclick)
// ============================================

window.navigateToSection = navigateToSection;
window.openSubjectModal = openSubjectModal;
window.closeSubjectModal = closeSubjectModal;
window.deleteSubject = deleteSubject;
window.openScheduleModal = openScheduleModal;
window.closeScheduleModal = closeScheduleModal;
window.deleteSchedule = deleteSchedule;
window.changeDate = changeDate;
window.openTaskModal = openTaskModal;
window.closeTaskModal = closeTaskModal;
window.toggleTaskCompletion = toggleTaskCompletion;
window.deleteTask = deleteTask;
window.exportData = exportData;
window.confirmReset = confirmReset;

console.log('Smart Study Planner initialized successfully!');
console.log('LocalStorage integration: Active');
