let currentUser = null;
let notifiedReminders = [];
let tasks = [];
let taskChart = null;
const alarmSound = document.getElementById("alarmSound");

document.addEventListener("DOMContentLoaded", () => {
  console.log("Task Manager initializing...");
  const savedUser = localStorage.getItem("currentUser");
  const savedTheme = localStorage.getItem("theme") || "dark";
  document.body.classList.toggle("light-theme", savedTheme === "light");
  if (savedUser) {
    console.log("User found:", savedUser);
    currentUser = savedUser;
    showDashboard();
    document.getElementById("userDisplay").textContent = currentUser;
    loadTasks();
    checkTasks();
  } else {
    console.log("No user found, showing auth");
    showAuth();
  }
  if (Notification.permission !== "granted") {
    Notification.requestPermission().then((permission) => {
      console.log("Notification permission:", permission);
    });
  }
  setupDragAndDrop();
  setInterval(checkTasks, 30000);
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("service-worker.js")
      .then((reg) => console.log("Service Worker registered", reg))
      .catch((err) => console.error("Service Worker error:", err));
  }
});

function toggleTheme() {
  document.body.classList.toggle("light-theme");
  localStorage.setItem(
    "theme",
    document.body.classList.contains("light-theme") ? "light" : "dark"
  );
  if (taskChart) updateAnalytics();
}

function showAuth() {
  document.getElementById("authContainer").style.display = "flex";
  document.getElementById("dashboard").style.display = "none";
  document.getElementById("dashboardSection").style.display = "none";
  document.getElementById("tasksSection").style.display = "none";
  document.getElementById("weeklySchedule").style.display = "none";
}

function showDashboard() {
  document.getElementById("authContainer").style.display = "none";
  document.getElementById("dashboard").style.display = "flex";
  showDashboardSection();
}

function showDashboardSection() {
  document.getElementById("dashboardSection").style.display = "block";
  document.getElementById("tasksSection").style.display = "none";
  document.getElementById("weeklySchedule").style.display = "none";
  document.getElementById("headerTitle").innerHTML =
    '<i class="fas fa-tachometer-alt"></i> Dashboard';
  document.getElementById("sortBy").style.display = "none";
  updateAnalytics();
  renderRecentTasks();
}

function showTasksSection() {
  document.getElementById("dashboardSection").style.display = "none";
  document.getElementById("tasksSection").style.display = "block";
  document.getElementById("weeklySchedule").style.display = "none";
  document.getElementById("headerTitle").innerHTML =
    '<i class="fas fa-clipboard-list"></i> Tasks';
  document.getElementById("sortBy").style.display = "inline-block";
  renderTasks(tasks);
}

function showWeeklySchedule() {
  document.getElementById("dashboardSection").style.display = "none";
  document.getElementById("tasksSection").style.display = "none";
  document.getElementById("weeklySchedule").style.display = "block";
  document.getElementById("headerTitle").innerHTML =
    '<i class="fas fa-calendar-alt"></i> Weekly Schedule';
  document.getElementById("sortBy").style.display = "none";
  renderWeeklyTasks();
}

function closeWeeklySchedule() {
  document.getElementById("weeklySchedule").style.display = "none";
  showDashboardSection();
}

function toggleAuthMode() {
  const title = document.getElementById("authTitle");
  const button = document.getElementById("authButton");
  const toggleText = document.querySelector(".toggle-auth");
  const authMessage = document.getElementById("authMessage");
  if (title.textContent === "Login") {
    title.textContent = "Sign Up";
    button.innerHTML = '<i class="fas fa-user-plus"></i> Sign Up';
    toggleText.textContent = "Already have an account? Login";
  } else {
    title.textContent = "Login";
    button.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
    toggleText.textContent = "Don't have an account? Sign Up";
  }
  authMessage.style.display = "none";
}

function handleAuth() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  const isLogin = document.getElementById("authTitle").textContent === "Login";
  const spinner = document.getElementById("authSpinner");
  const authMessage = document.getElementById("authMessage");
  let users = JSON.parse(localStorage.getItem("users")) || {};

  authMessage.style.display = "none";
  if (!username || !password) {
    authMessage.textContent = "Please enter both username and password.";
    authMessage.className = "auth-message error";
    authMessage.style.display = "block";
    return;
  }

  spinner.style.display = "block";
  setTimeout(() => {
    if (isLogin) {
      if (users[username] && users[username].password === password) {
        currentUser = username;
        localStorage.setItem("currentUser", currentUser);
        showDashboard();
        document.getElementById("userDisplay").textContent = currentUser;
        loadTasks();
        checkTasks();
      } else {
        authMessage.textContent = "Invalid username or password.";
        authMessage.className = "auth-message error";
        authMessage.style.display = "block";
      }
    } else {
      if (users[username]) {
        authMessage.textContent = "Username already exists.";
        authMessage.className = "auth-message error";
        authMessage.style.display = "block";
      } else {
        users[username] = { password };
        localStorage.setItem("users", JSON.stringify(users));
        authMessage.textContent = "Account created successfully";
        authMessage.className = "auth-message success";
        authMessage.style.display = "block";
        document.getElementById("authTitle").textContent = "Login";
        document.getElementById("authButton").innerHTML =
          '<i class="fas fa-sign-in-alt"></i> Login';
        document.querySelector(".toggle-auth").textContent =
          "Don't have an account? Sign Up";
        document.getElementById("username").value = "";
        document.getElementById("password").value = "";
      }
    }
    spinner.style.display = "none";
  }, 500);
}

function logout() {
  localStorage.removeItem("currentUser");
  currentUser = null;
  notifiedReminders = [];
  tasks = [];
  if (taskChart) {
    taskChart.destroy();
    taskChart = null;
  }
  showAuth();
  document.getElementById("username").value = "";
  document.getElementById("password").value = "";
  document.getElementById("authTitle").textContent = "Login";
  document.getElementById("authButton").innerHTML =
    '<i class="fas fa-sign-in-alt"></i> Login';
  document.querySelector(".toggle-auth").textContent =
    "Don't have an account? Sign Up";
}

function loadTasks() {
  tasks = JSON.parse(localStorage.getItem(`tasks_${currentUser}`)) || [];
  notifiedReminders =
    JSON.parse(localStorage.getItem(`notifiedReminders_${currentUser}`)) || [];
  console.log("Loaded tasks:", tasks);
  renderTasks(tasks);
  renderWeeklyTasks();
  renderRecentTasks();
  updateAnalytics();
}

function renderTasks(tasksToRender) {
  const taskList = document.getElementById("taskList");
  taskList.innerHTML = "";
  tasksToRender.forEach((task) => {
    const li = document.createElement("li");
    li.className = `task-item ${task.completed ? "completed" : ""}`;
    li.draggable = true;
    li.dataset.id = task.id;
    li.innerHTML = `
      <span><i class="fas fa-tasks"></i> ${task.description} - ${new Date(
      task.time
    ).toLocaleString()} (Priority: ${task.priority}, Category: ${
      task.category
    }${task.dayOfWeek ? ", Day: " + task.dayOfWeek : ""})</span>
      <div class="actions">
        <button class="complete" onclick="toggleComplete('${
          task.id
        }')" title="Complete Task"><i class="fas fa-check"></i></button>
        <button class="snooze" onclick="snoozeTask('${
          task.id
        }')" title="Snooze Task"><i class="fas fa-clock"></i></button>
        <button class="delete" onclick="deleteTask('${
          task.id
        }')" title="Delete Task"><i class="fas fa-trash"></i></button>
      </div>
    `;
    taskList.appendChild(li);
  });
}

function renderWeeklyTasks() {
  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  days.forEach((day) => {
    const list = document.getElementById(`${day.toLowerCase()}Tasks`);
    list.innerHTML = "";
    tasks
      .filter((task) => task.dayOfWeek === day && !task.completed)
      .forEach((task) => {
        const li = document.createElement("li");
        li.innerHTML = `
          <span><i class="fas fa-calendar-alt"></i> ${
            task.description
          } at ${new Date(task.time).toLocaleTimeString()}</span>
          <div class="actions">
            <button class="complete" onclick="toggleComplete('${
              task.id
            }')" title="Complete Task"><i class="fas fa-check"></i></button>
            <button class="delete" onclick="deleteTask('${
              task.id
            }')" title="Delete Task"><i class="fas fa-trash"></i></button>
          </div>
        `;
        list.appendChild(li);
      });
  });
}

function renderRecentTasks() {
  const recentTasksList = document.getElementById("recentTasks");
  recentTasksList.innerHTML = "";
  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.created) - new Date(a.created))
    .slice(0, 5);
  recentTasks.forEach((task) => {
    const li = document.createElement("li");
    li.className = `task-item ${task.completed ? "completed" : ""}`;
    li.innerHTML = `
      <span><i class="fas fa-history"></i> ${task.description} - ${new Date(
      task.time
    ).toLocaleString()}${
      task.dayOfWeek ? " (" + task.dayOfWeek + ")" : ""
    }</span>
      <div class="actions">
        <button class="complete" onclick="toggleComplete('${
          task.id
        }')" title="Complete Task"><i class="fas fa-check"></i></button>
        <button class="delete" onclick="deleteTask('${
          task.id
        }')" title="Delete Task"><i class="fas fa-trash"></i></button>
      </div>
    `;
    recentTasksList.appendChild(li);
  });
}

function addTask() {
  if (!currentUser) return;
  const description = document.getElementById("taskInput").value.trim();
  const time = document.getElementById("taskTime").value;
  const priority = document.getElementById("priority").value;
  const category = document.getElementById("category").value;
  const recurrence = document.getElementById("recurrence").value;
  const taskTime = new Date(time);
  const now = new Date();

  if (!description || !time || !priority || !category || !recurrence) {
    alert("Please fill all task fields correctly.");
    return;
  }
  if (taskTime <= now) {
    alert("Task time must be in the future.");
    return;
  }

  const task = {
    id: crypto.randomUUID(),
    description,
    time: taskTime.toISOString(),
    priority,
    category,
    recurrence,
    completed: false,
    created: new Date().toISOString(),
    reminders: [{ id: crypto.randomUUID(), time: taskTime.toISOString() }],
  };
  tasks.push(task);
  localStorage.setItem(`tasks_${currentUser}`, JSON.stringify(tasks));
  renderTasks(tasks);
  renderWeeklyTasks();
  renderRecentTasks();
  updateAnalytics();
  clearTaskForm();
}

function addWeeklyTask(day) {
  if (!currentUser) return;
  const taskInput = document
    .getElementById(`${day.toLowerCase()}Task`)
    ?.value.trim();
  const timeInput = document.getElementById(`${day.toLowerCase()}Time`)?.value;

  if (!taskInput || !timeInput) {
    alert(`Please enter task and time for ${day}.`);
    return;
  }

  const [hours, minutes] = timeInput.split(":").map(Number);
  const now = new Date();
  const taskDate = new Date();
  const dayIndex = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ].indexOf(day);
  taskDate.setDate(
    taskDate.getDate() + ((dayIndex + 7 - taskDate.getDay()) % 7)
  );
  taskDate.setHours(hours, minutes, 0, 0);

  if (taskDate <= now) {
    taskDate.setDate(taskDate.getDate() + 7);
  }

  const task = {
    id: crypto.randomUUID(),
    description: taskInput,
    time: taskDate.toISOString(),
    priority: "medium",
    category: "Others",
    recurrence: "none",
    completed: false,
    created: new Date().toISOString(),
    dayOfWeek: day,
    reminders: [{ id: crypto.randomUUID(), time: taskDate.toISOString() }],
  };
  tasks.push(task);
  localStorage.setItem(`tasks_${currentUser}`, JSON.stringify(tasks));
  renderTasks(tasks);
  renderWeeklyTasks();
  renderRecentTasks();
  updateAnalytics();
  document.getElementById(`${day.toLowerCase()}Task`).value = "";
  document.getElementById(`${day.toLowerCase()}Time`).value = "";
}

function clearTaskForm() {
  document.getElementById("taskInput").value = "";
  document.getElementById("taskTime").value = "";
  document.getElementById("priority").value = "";
  document.getElementById("category").value = "";
  document.getElementById("recurrence").value = "";
}

function deleteTask(id) {
  if (!currentUser) return;
  tasks = tasks.filter((task) => task.id !== id);
  localStorage.setItem(`tasks_${currentUser}`, JSON.stringify(tasks));
  notifiedReminders = notifiedReminders.filter(
    (reminderId) =>
      !tasks.some((task) => task.reminders.some((r) => r.id === reminderId))
  );
  localStorage.setItem(
    `notifiedReminders_${currentUser}`,
    JSON.stringify(notifiedReminders)
  );
  renderTasks(tasks);
  renderWeeklyTasks();
  renderRecentTasks();
  updateAnalytics();
}

function toggleComplete(id) {
  if (!currentUser) return;
  tasks = tasks.map((task) => {
    if (task.id === id) {
      task.completed = !task.completed;
      if (task.completed) {
        task.reminders.forEach((reminder) => {
          notifiedReminders = notifiedReminders.filter(
            (id) => id !== reminder.id
          );
        });
        handleRecurrence(task);
      }
    }
    return task;
  });
  localStorage.setItem(`tasks_${currentUser}`, JSON.stringify(tasks));
  localStorage.setItem(
    `notifiedReminders_${currentUser}`,
    JSON.stringify(notifiedReminders)
  );
  renderTasks(tasks);
  renderWeeklyTasks();
  renderRecentTasks();
  updateAnalytics();
}

function snoozeTask(id) {
  tasks = tasks.map((task) => {
    if (task.id === id) {
      const newTime = new Date(new Date(task.time).getTime() + 15 * 60000);
      task.time = newTime.toISOString();
      task.reminders.push({
        id: crypto.randomUUID(),
        time: newTime.toISOString(),
      });
      task.reminders.forEach((reminder) => {
        notifiedReminders = notifiedReminders.filter(
          (id) => id !== reminder.id
        );
      });
    }
    return task;
  });
  localStorage.setItem(`tasks_${currentUser}`, JSON.stringify(tasks));
  localStorage.setItem(
    `notifiedReminders_${currentUser}`,
    JSON.stringify(notifiedReminders)
  );
  renderTasks(tasks);
  renderWeeklyTasks();
  renderRecentTasks();
}

function handleRecurrence(task) {
  if (task.recurrence === "none" || !task.completed) return;
  const newTask = { ...task, completed: false, id: crypto.randomUUID() };
  const oldTime = new Date(task.time);
  let newTime;
  switch (task.recurrence) {
    case "daily":
      newTime = new Date(oldTime.setDate(oldTime.getDate() + 1));
      break;
    case "weekly":
      newTime = new Date(oldTime.setDate(oldTime.getDate() + 7));
      break;
    case "monthly":
      newTime = new Date(oldTime.setMonth(oldTime.getMonth() + 1));
      break;
  }
  if (newTime) {
    newTask.time = newTime.toISOString();
    newTask.reminders = [
      { id: crypto.randomUUID(), time: newTime.toISOString() },
    ];
    newTask.created = new Date().toISOString();
    tasks.push(newTask);
    localStorage.setItem(`tasks_${currentUser}`, JSON.stringify(tasks));
  }
}

function sortTasks() {
  const sortBy = document.getElementById("sortBy").value;
  let sortedTasks = [...tasks];
  if (sortBy === "priority") {
    const priorityOrder = { high: 1, medium: 2, low: 3 };
    sortedTasks.sort(
      (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
    );
  } else if (sortBy === "created") {
    sortedTasks.sort((a, b) => new Date(b.created) - new Date(a.created));
  }
  renderTasks(sortedTasks);
}

function updateAnalytics() {
  const ctx = document.getElementById("taskChart").getContext("2d");
  const completed = tasks.filter((task) => task.completed).length;
  const pending = tasks.length - completed;
  const total = tasks.length;
  const progress = total ? (completed / total) * 100 : 0;

  if (taskChart) taskChart.destroy();
  taskChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: [`Completed (${completed})`, `Pending (${pending})`],
      datasets: [
        {
          data: [completed, pending],
          backgroundColor: document.body.classList.contains("light-theme")
            ? ["#2563eb", "#93c5fd"]
            : ["#8b5cf6", "#c4b5fd"],
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom" },
        title: {
          display: true,
          text: `Task Status Distribution (Total: ${total})`,
          color: document.body.classList.contains("light-theme")
            ? "#2563eb"
            : "#8b5cf6",
          font: { size: 16, weight: "600" },
        },
      },
      cutout: "60%",
    },
  });

  document.getElementById("progressBar").style.width = `${progress}%`;
  document.getElementById("progressText").textContent = `${Math.round(
    progress
  )}% Complete`;
}

function checkTasks() {
  if (!currentUser) return;
  const now = new Date();
  tasks.forEach((task) => {
    task.reminders.forEach((reminder) => {
      const reminderTime = new Date(reminder.time);
      const timeDiff = (reminderTime - now) / 1000 / 60; // Minutes
      console.log(
        `Checking task: ${task.description}, Reminder ID: ${reminder.id}, Time Diff: ${timeDiff}`
      );
      if (
        timeDiff >= -0.5 &&
        timeDiff <= 0.5 &&
        !notifiedReminders.includes(reminder.id)
      ) {
        console.log(`Triggering notification for task: ${task.description}`);
        notifiedReminders.push(reminder.id);
        if (Notification.permission === "granted") {
          new Notification("Task Reminder", {
            body: `Task ${task.description} is due now!`,
            icon: "/assets/task-icon.svg",
            badge: "/assets/task-icon.svg",
            vibrate: [200, 100, 200],
          });
        } else {
          console.log("Notification permission not granted");
        }
        alarmSound.play().catch((err) => {
          console.error("Error playing alarm:", err);
          alert(`Task ${task.description} is due now!`);
        });
      }
    });
  });
  localStorage.setItem(
    `notifiedReminders_${currentUser}`,
    JSON.stringify(notifiedReminders)
  );
}

function setupDragAndDrop() {
  const taskList = document.getElementById("taskList");
  let draggedItem = null;

  taskList.addEventListener("dragstart", (e) => {
    draggedItem = e.target;
    setTimeout(() => {
      e.target.style.opacity = "0.5";
    }, 0);
  });

  taskList.addEventListener("dragend", (e) => {
    e.target.style.opacity = "1";
    draggedItem = null;
  });

  taskList.addEventListener("dragover", (e) => {
    e.preventDefault();
  });

  taskList.addEventListener("drop", (e) => {
    e.preventDefault();
    if (draggedItem && e.target.classList.contains("task-item")) {
      const allItems = [...taskList.querySelectorAll(".task-item")];
      const draggedIndex = allItems.indexOf(draggedItem);
      const targetIndex = allItems.indexOf(e.target);
      const draggedTask = tasks.splice(draggedIndex, 1)[0];
      tasks.splice(targetIndex, 0, draggedTask);
      localStorage.setItem(`tasks_${currentUser}`, JSON.stringify(tasks));
      renderTasks(tasks);
    }
  });
}
