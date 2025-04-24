let currentUser = null;
let notifiedReminders = [];
let tasks = [];
let taskChart = null;
const alarmSound = document.getElementById("alarmSound");

// Initialize app
document.addEventListener("DOMContentLoaded", () => {
  console.log(
    "Task Manager initializing... Version: 2025-04-24-v8 (App Name, Recent Tasks, Larger Notifications)"
  );
  console.log("Checking DOM elements...");
  const dashboardSection = document.getElementById("dashboardSection");
  const tasksSection = document.getElementById("tasksSection");
  const weeklySchedule = document.getElementById("weeklySchedule");
  const recentTasks = document.getElementById("recentTasks");
  console.log("Dashboard Section:", dashboardSection ? "Found" : "Missing");
  console.log("Tasks Section:", tasksSection ? "Found" : "Missing");
  console.log("Weekly Schedule:", weeklySchedule ? "Found" : "Missing");
  console.log("Recent Tasks:", recentTasks ? "Found" : "Missing");
  const savedUser = localStorage.getItem("currentUser");
  const savedTheme = localStorage.getItem("theme") || "dark";
  document.body.classList.toggle("light-theme", savedTheme === "light");
  if (savedUser) {
    console.log("User found, loading dashboard for:", savedUser);
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
    Notification.requestPermission();
  }
  setupDragAndDrop();
  setInterval(checkTasks, 60000);
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("service-worker.js")
      .then((reg) => console.log("Service Worker registered", reg))
      .catch((err) => console.error("Service Worker registration failed", err));
  }
});

// Toggle theme
function toggleTheme() {
  document.body.classList.toggle("light-theme");
  localStorage.setItem(
    "theme",
    document.body.classList.contains("light-theme") ? "light" : "dark"
  );
  if (taskChart) {
    updateAnalytics();
  }
}

// Show auth section
function showAuth() {
  try {
    document.getElementById("authContainer").style.display = "flex";
    document.getElementById("dashboard").style.display = "none";
    document.getElementById("dashboardSection").style.display = "none";
    document.getElementById("tasksSection").style.display = "none";
    document.getElementById("weeklySchedule").style.display = "none";
  } catch (error) {
    console.error("Error in showAuth:", error);
  }
}

// Show dashboard
function showDashboard() {
  try {
    document.getElementById("authContainer").style.display = "none";
    document.getElementById("dashboard").style.display = "flex";
    showDashboardSection();
  } catch (error) {
    console.error("Error in showDashboard:", error);
  }
}

// Show dashboard section (analytics)
function showDashboardSection() {
  try {
    document.getElementById("dashboardSection").style.display = "block";
    document.getElementById("tasksSection").style.display = "none";
    document.getElementById("weeklySchedule").style.display = "none";
    document.getElementById("headerTitle").textContent = "Dashboard";
    document.getElementById("sortBy").style.display = "none";
    updateAnalytics();
    renderRecentTasks();
  } catch (error) {
    console.error("Error in showDashboardSection:", error);
  }
}

// Show tasks section
function showTasksSection() {
  try {
    document.getElementById("dashboardSection").style.display = "none";
    document.getElementById("tasksSection").style.display = "block";
    document.getElementById("weeklySchedule").style.display = "none";
    document.getElementById("headerTitle").textContent = "Tasks";
    document.getElementById("sortBy").style.display = "inline-block";
    renderTasks(tasks);
  } catch (error) {
    console.error("Error in showTasksSection:", error);
  }
}

// Show weekly schedule
function showWeeklySchedule() {
  try {
    const weeklySchedule = document.getElementById("weeklySchedule");
    if (!weeklySchedule) {
      console.error("Weekly schedule not found");
      return;
    }
    document.getElementById("dashboardSection").style.display = "none";
    document.getElementById("tasksSection").style.display = "none";
    weeklySchedule.style.display = "block";
    document.getElementById("headerTitle").textContent = "Weekly Schedule";
    document.getElementById("sortBy").style.display = "none";
    renderWeeklyTasks();
  } catch (error) {
    console.error("Error in showWeeklySchedule:", error);
  }
}

// Close weekly schedule
function closeWeeklySchedule() {
  try {
    document.getElementById("weeklySchedule").style.display = "none";
    showDashboardSection();
  } catch (error) {
    console.error("Error in closeWeeklySchedule:", error);
  }
}

// Toggle between login and signup
function toggleAuthMode() {
  try {
    const title = document.getElementById("authTitle");
    const button = document.getElementById("authButton");
    const toggleText = document.querySelector(".toggle-auth");
    if (title.textContent === "Login") {
      title.textContent = "Sign Up";
      button.textContent = "Sign Up";
      toggleText.textContent = "Already have an account? Login";
    } else {
      title.textContent = "Login";
      button.textContent = "Login";
      toggleText.textContent = "Don't have an account? Sign Up";
    }
  } catch (error) {
    console.error("Error in toggleAuthMode:", error);
  }
}

// Handle login/signup
function handleAuth() {
  try {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const isLogin =
      document.getElementById("authTitle").textContent === "Login";
    const spinner = document.getElementById("authSpinner");
    let users = JSON.parse(localStorage.getItem("users")) || {};

    if (!username || !password) {
      alert("Please enter both username and password.");
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
          alert("Invalid username or password.");
        }
      } else {
        if (users[username]) {
          alert("Username already exists.");
        } else {
          users[username] = { password };
          localStorage.setItem("users", JSON.stringify(users));
          currentUser = username;
          localStorage.setItem("currentUser", currentUser);
          showDashboard();
          document.getElementById("userDisplay").textContent = currentUser;
          loadTasks();
          checkTasks();
        }
      }
      spinner.style.display = "none";
    }, 500);
  } catch (error) {
    console.error("Error in handleAuth:", error);
  }
}

// Logout
function logout() {
  try {
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
    document.getElementById("authButton").textContent = "Login";
    document.querySelector(".toggle-auth").textContent =
      "Don't have an account? Sign Up";
  } catch (error) {
    console.error("Error in logout:", error);
  }
}

// Load tasks
function loadTasks() {
  try {
    tasks = JSON.parse(localStorage.getItem(`tasks_${currentUser}`)) || [];
    renderTasks(tasks);
    renderWeeklyTasks();
    renderRecentTasks();
    updateAnalytics();
  } catch (error) {
    console.error("Error in loadTasks:", error);
  }
}

// Render tasks
function renderTasks(tasksToRender) {
  try {
    const taskList = document.getElementById("taskList");
    taskList.innerHTML = "";
    tasksToRender.forEach((task) => {
      const li = document.createElement("li");
      li.className = `task-item ${task.completed ? "completed" : ""}`;
      li.draggable = true;
      li.dataset.id = task.id;
      li.innerHTML = `
                <span>${task.description} - ${new Date(
        task.time
      ).toLocaleString()} (Notify ${task.notifyBefore} min before, Priority: ${
        task.priority
      }, Category: ${task.category}${
        task.dayOfWeek ? ", Day: " + task.dayOfWeek : ""
      })</span>
                <div class="actions">
                    <button class="complete" onclick="toggleComplete('${
                      task.id
                    }')"><i class="fas fa-check"></i></button>
                    <button class="snooze" onclick="snoozeTask('${
                      task.id
                    }')"><i class="fas fa-clock"></i></button>
                    <button class="delete" onclick="deleteTask('${
                      task.id
                    }')"><i class="fas fa-trash"></i></button>
                </div>
            `;
      taskList.appendChild(li);
    });
  } catch (error) {
    console.error("Error in renderTasks:", error);
  }
}

// Render weekly tasks
function renderWeeklyTasks() {
  try {
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
                    <span>${task.description} at ${new Date(
            task.time
          ).toLocaleTimeString()}</span>
                    <div class="actions">
                        <button class="complete" onclick="toggleComplete('${
                          task.id
                        }')"><i class="fas fa-check"></i></button>
                        <button class="delete" onclick="deleteTask('${
                          task.id
                        }')"><i class="fas fa-trash"></i></button>
                    </div>
                `;
          list.appendChild(li);
        });
    });
  } catch (error) {
    console.error("Error in renderWeeklyTasks:", error);
  }
}

// Render recent tasks on dashboard
function renderRecentTasks() {
  try {
    const recentTasksList = document.getElementById("recentTasks");
    recentTasksList.innerHTML = "";
    const recentTasks = [...tasks]
      .sort((a, b) => new Date(b.created) - new Date(a.created))
      .slice(0, 5);
    recentTasks.forEach((task) => {
      const li = document.createElement("li");
      li.className = `task-item ${task.completed ? "completed" : ""}`;
      li.innerHTML = `
                <span>${task.description} - ${new Date(
        task.time
      ).toLocaleString()}${
        task.dayOfWeek ? " (" + task.dayOfWeek + ")" : ""
      }</span>
                <div class="actions">
                    <button class="complete" onclick="toggleComplete('${
                      task.id
                    }')"><i class="fas fa-check"></i></button>
                    <button class="delete" onclick="deleteTask('${
                      task.id
                    }')"><i class="fas fa-trash"></i></button>
                </div>
            `;
      recentTasksList.appendChild(li);
    });
  } catch (error) {
    console.error("Error in renderRecentTasks:", error);
  }
}

// Add a task (main form)
function addTask() {
  try {
    if (!currentUser) return;
    const description = document.getElementById("taskInput").value.trim();
    const time = document.getElementById("taskTime").value;
    const notifyBefore = parseInt(
      document.getElementById("notifyBefore").value
    );
    const priority = document.getElementById("priority").value;
    const category = document.getElementById("category").value;
    const recurrence = document.getElementById("recurrence").value;
    const taskTime = new Date(time);
    const now = new Date();

    if (
      !description ||
      !time ||
      isNaN(notifyBefore) ||
      notifyBefore < 1 ||
      !priority ||
      !category ||
      !recurrence
    ) {
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
      notifyBefore,
      priority,
      category,
      recurrence,
      completed: false,
      created: new Date().toISOString(),
      reminders: [
        { id: crypto.randomUUID(), time: taskTime.toISOString(), notifyBefore },
      ],
    };
    tasks.push(task);
    localStorage.setItem(`tasks_${currentUser}`, JSON.stringify(tasks));
    renderTasks(tasks);
    renderWeeklyTasks();
    renderRecentTasks();
    updateAnalytics();
    clearTaskForm();
  } catch (error) {
    console.error("Error in addTask:", error);
  }
}

// Add a weekly task
function addWeeklyTask(day) {
  try {
    if (!currentUser) return;
    const taskInput = document
      .getElementById(`${day.toLowerCase()}Task`)
      ?.value.trim();
    const timeInput = document.getElementById(
      `${day.toLowerCase()}Time`
    )?.value;

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
      notifyBefore: 10,
      priority: "medium",
      category: "Others",
      recurrence: "none",
      completed: false,
      created: new Date().toISOString(),
      dayOfWeek: day,
      reminders: [
        {
          id: crypto.randomUUID(),
          time: taskDate.toISOString(),
          notifyBefore: 10,
        },
      ],
    };
    tasks.push(task);
    localStorage.setItem(`tasks_${currentUser}`, JSON.stringify(tasks));
    renderTasks(tasks);
    renderWeeklyTasks();
    renderRecentTasks();
    updateAnalytics();
    document.getElementById(`${day.toLowerCase()}Task`).value = "";
    document.getElementById(`${day.toLowerCase()}Time`).value = "";
  } catch (error) {
    console.error(`Error in addWeeklyTask for ${day}:`, error);
  }
}

// Clear task form
function clearTaskForm() {
  try {
    document.getElementById("taskInput").value = "";
    document.getElementById("taskTime").value = "";
    document.getElementById("notifyBefore").value = "";
    document.getElementById("priority").value = "";
    document.getElementById("category").value = "";
    document.getElementById("recurrence").value = "";
  } catch (error) {
    console.error("Error in clearTaskForm:", error);
  }
}

// Delete a task
function deleteTask(id) {
  try {
    if (!currentUser) return;
    tasks = tasks.filter((task) => task.id !== id);
    localStorage.setItem(`tasks_${currentUser}`, JSON.stringify(tasks));
    notifiedReminders = notifiedReminders.filter(
      (reminderId) =>
        !tasks.some((task) => task.reminders.some((r) => r.id === reminderId))
    );
    renderTasks(tasks);
    renderWeeklyTasks();
    renderRecentTasks();
    updateAnalytics();
  } catch (error) {
    console.error("Error in deleteTask:", error);
  }
}

// Toggle task completion
function toggleComplete(id) {
  try {
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
    renderTasks(tasks);
    renderWeeklyTasks();
    renderRecentTasks();
    updateAnalytics();
  } catch (error) {
    console.error("Error in toggleComplete:", error);
  }
}

// Snooze task
function snoozeTask(id) {
  try {
    tasks = tasks.map((task) => {
      if (task.id === id) {
        const newTime = new Date(new Date(task.time).getTime() + 15 * 60000);
        task.time = newTime.toISOString();
        task.reminders.push({
          id: crypto.randomUUID(),
          time: newTime.toISOString(),
          notifyBefore: task.notifyBefore,
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
    renderTasks(tasks);
    renderWeeklyTasks();
    renderRecentTasks();
  } catch (error) {
    console.error("Error in snoozeTask:", error);
  }
}

// Handle recurring tasks
function handleRecurrence(task) {
  try {
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
    newTask.time = newTime.toISOString();
    newTask.reminders = [
      {
        id: crypto.randomUUID(),
        time: newTime.toISOString(),
        notifyBefore: task.notifyBefore,
      },
    ];
    tasks.push(newTask);
    localStorage.setItem(`tasks_${currentUser}`, JSON.stringify(tasks));
  } catch (error) {
    console.error("Error in handleRecurrence:", error);
  }
}

// Check tasks for notifications
function checkTasks() {
  try {
    if (!currentUser) return;
    const now = new Date().toISOString();
    tasks.forEach((task) => {
      if (task.completed) return;
      task.reminders.forEach((reminder) => {
        if (notifiedReminders.includes(reminder.id)) return;
        const taskTime = new Date(reminder.time);
        const timeDiff = (taskTime - new Date(now)) / 60000;
        console.log(
          `Checking task: ${task.description}, Reminder ID: ${
            reminder.id
          }, Time: ${taskTime.toISOString()}, Notify Before: ${
            reminder.notifyBefore
          }, Time Diff: ${timeDiff}`
        );
        if (timeDiff > 0 && timeDiff <= reminder.notifyBefore) {
          console.log(`Triggering notification for task: ${task.description}`);
          alarmSound.play().catch((error) => {
            console.error("Error playing alarm:", error);
            const alertMessage = `Task "${
              task.description
            }" is due at ${taskTime.toLocaleString()}!`;
            const style = `font-size: 18px; padding: 20px; border-radius: 8px; background: #bb86fc; color: #fff;`;
            const alertBox = document.createElement("div");
            alertBox.style.cssText = style;
            alertBox.textContent = alertMessage;
            document.body.appendChild(alertBox);
            setTimeout(() => alertBox.remove(), 5000);
          });
          if (Notification.permission === "granted") {
            new Notification("Task Reminder", {
              body: `Task "${
                task.description
              }" is due at ${taskTime.toLocaleString()}!`,
              icon: "https://via.placeholder.com/64",
              badge: "https://via.placeholder.com/32",
              data: { fontSize: "18px" },
            });
          }
          notifiedReminders.push(reminder.id);
        }
      });
    });
  } catch (error) {
    console.error("Error in checkTasks:", error);
  }
}

// Sort tasks
function sortTasks() {
  try {
    const sortBy = document.getElementById("sortBy").value;
    const sortedTasks = [...tasks].sort((a, b) => {
      if (sortBy === "priority") {
        const priorities = { high: 3, medium: 2, low: 1 };
        return priorities[b.priority] - priorities[a.priority];
      }
      if (sortBy === "created")
        return new Date(a.created) - new Date(b.created);
    });
    renderTasks(sortedTasks);
  } catch (error) {
    console.error("Error in sortTasks:", error);
  }
}

// Update analytics
function updateAnalytics() {
  try {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((task) => task.completed).length;
    const completionPercentage =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Update progress bar
    const progressBar = document.getElementById("progressBar");
    const progressText = document.getElementById("progressText");
    if (progressBar && progressText) {
      progressBar.style.width = `${completionPercentage}%`;
      progressText.textContent = `${completionPercentage}% Complete`;
    } else {
      console.error("Progress bar elements not found");
    }

    // Update pie chart
    const ctx = document.getElementById("taskChart").getContext("2d");
    const isLightTheme = document.body.classList.contains("light-theme");
    const backgroundColors = isLightTheme
      ? ["#4caf50", "#f44336"]
      : ["#03dac6", "#cf6679"];
    const borderColor = isLightTheme ? "#333" : "#e0e0e0";

    if (taskChart) {
      taskChart.destroy();
    }

    taskChart = new Chart(ctx, {
      type: "pie",
      data: {
        labels: ["Completed Tasks", "Pending Tasks"],
        datasets: [
          {
            data: [completedTasks, totalTasks - completedTasks],
            backgroundColor: backgroundColors,
            borderColor: borderColor,
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "top",
            labels: {
              color: isLightTheme ? "#333" : "#e0e0e0",
            },
          },
          title: {
            display: true,
            text: "Task Status Distribution",
            color: isLightTheme ? "#333" : "#e0e0e0",
          },
        },
      },
    });
  } catch (error) {
    console.error("Error in updateAnalytics:", error);
  }
}

// Setup drag-and-drop
function setupDragAndDrop() {
  try {
    const taskList = document.getElementById("taskList");
    taskList.addEventListener("dragstart", (e) => {
      if (e.target.classList.contains("task-item")) {
        e.target.classList.add("dragging");
        e.dataTransfer.setData("text/plain", e.target.dataset.id);
      }
    });
    taskList.addEventListener("dragend", (e) => {
      e.target.classList.remove("dragging");
    });
    taskList.addEventListener("dragover", (e) => {
      e.preventDefault();
      const afterElement = getDragAfterElement(taskList, e.clientY);
      const draggable = document.querySelector(".dragging");
      if (afterElement == null) {
        taskList.appendChild(draggable);
      } else {
        taskList.insertBefore(draggable, afterElement);
      }
    });
    taskList.addEventListener("drop", (e) => {
      e.preventDefault();
      const id = e.dataTransfer.getData("text/plain");
      const newOrder = Array.from(taskList.children).map(
        (item) => item.dataset.id
      );
      const newTasks = newOrder.map((id) =>
        tasks.find((task) => task.id === id)
      );
      tasks = newTasks;
      localStorage.setItem(`tasks_${currentUser}`, JSON.stringify(tasks));
    });
  } catch (error) {
    console.error("Error in setupDragAndDrop:", error);
  }
}

// Helper function to get the element after which to drop
function getDragAfterElement(container, y) {
  try {
    const draggableElements = [
      ...container.querySelectorAll(".task-item:not(.dragging)"),
    ];
    return draggableElements.reduce(
      (closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
          return { offset: offset, element: child };
        }
        return closest;
      },
      { offset: Number.NEGATIVE_INFINITY }
    ).element;
  } catch (error) {
    console.error("Error in getDragAfterElement:", error);
    return null;
  }
}
