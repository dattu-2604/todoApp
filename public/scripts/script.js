const apiUrl = "/api/tasks";
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();
let editingTaskId = null; // Global variable to track the task being edited

async function generateCalendar(year, month) {
  const calendarDays = document.getElementById("calendar-days");
  const monthYear = document.getElementById("month-year");

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  calendarDays.innerHTML =
    "<div>SUN</div><div>MON</div><div>TUE</div><div>WED</div><div>THU</div><div>FRI</div><div>SAT</div>";
  for (let i = 0; i < firstDay; i++) {
    calendarDays.innerHTML += "<div></div>";
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;
    calendarDays.innerHTML += `<div onclick="showTasks('${date}')">${day}</div>`;
  }

  const monthName = monthNames[month];
  monthYear.textContent = `${monthName}, ${year}`;

  // Update global state
  currentYear = year;
  currentMonth = month;
}

async function showTasks(date) {
  const tasksList = document.getElementById("tasks");

  try {
    // Fetch tasks from the API
    const response = await fetch(`${apiUrl}?date=${date}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch tasks: ${response.statusText}`);
    }
    const tasks = await response.json();

    // Format the date
    const formattedDate = formatDate(new Date(date));

    // Update tasks list
    tasksList.innerHTML = `<h3>Tasks for ${formattedDate}</h3>
        <ul class="list-group">`;

    tasks.forEach((task) => {
      tasksList.innerHTML += `
          <li class="list-group-item d-flex justify-content-between align-items-center">
            ${task.description}
            <div>
              <button onclick="editTask(${task.id}, '${task.description}')" class="btn btn-secondary btn-sm ml-2">Edit</button>
              <button onclick="deleteTask(${task.id})" class="btn btn-danger btn-sm ml-2">Delete</button>
            </div>
          </li>`;
    });

    tasksList.innerHTML += `</ul>`;

    // Set date in task form
    document.getElementById("task-date").value = date;
  } catch (error) {
    console.error("Error fetching tasks:", error);
  }
}

// Helper function to format the date
function formatDate(date) {
  const options = { day: "2-digit", month: "long", year: "numeric" };
  return date.toLocaleDateString("en-GB", options);
}

async function addTask(event) {
  event.preventDefault(); // Prevent the form from submitting the default way

  const date = document.getElementById("task-date").value;
  const taskDescription = document.getElementById("task-desc").value;

  if (!date || !taskDescription) {
    Toastify({
      text: "Please enter both date and description.",
      backgroundColor: "linear-gradient(to right, #ff5f6d, #ffc371)",
      duration: 3000,
    }).showToast();
    return;
  }

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ date, description: taskDescription }), // Convert to JSON string
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to add task: ${errorText}`);
    }

    showTasks(date); // Refresh tasks list for the selected date
    document.getElementById("task-form").reset(); // Clear the form
    resetForm(); // Reset form title and button text

    Toastify({
      text: "Task added successfully!",
      backgroundColor: "linear-gradient(to right, #00b09b, #96c93d)",
      duration: 3000,
    }).showToast();
  } catch (error) {
    console.error("Error:", error);
    Toastify({
      text: error.message,
      backgroundColor: "linear-gradient(to right, #ff5f6d, #ffc371)",
      duration: 3000,
    }).showToast();
  }
}

async function updateTask(event) {
  event.preventDefault(); // Prevent the form from submitting the default way

  const date = document.getElementById("task-date").value;
  const taskDescription = document.getElementById("task-desc").value;

  if (!date || !taskDescription) {
    Toastify({
      text: "Please enter both date and description.",
      backgroundColor: "linear-gradient(to right, #ff5f6d, #ffc371)",
      duration: 3000,
    }).showToast();
    return;
  }

  try {
    const response = await fetch(`${apiUrl}/${editingTaskId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ date, description: taskDescription }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update task: ${errorText}`);
    }

    showTasks(date); // Refresh tasks list for the selected date
    document.getElementById("task-form").reset(); // Clear the form
    resetForm(); // Reset form title and button text
    editingTaskId = null; // Clear the task ID

    Toastify({
      text: "Task updated successfully!",
      backgroundColor: "linear-gradient(to right, #00b09b, #96c93d)",
      duration: 3000,
    }).showToast();
  } catch (error) {
    console.error("Error:", error);
    Toastify({
      text: error.message,
      backgroundColor: "linear-gradient(to right, #ff5f6d, #ffc371)",
      duration: 3000,
    }).showToast();
  }
}

function editTask(taskId, description) {
  document.getElementById("task-desc").value = description;
  const submitButton = document.getElementById("form-submit-btn");
  document.getElementById("form-title").textContent = "Edit Task"; // Change form title
  submitButton.textContent = "Update Task"; // Change button text
  submitButton.removeEventListener("click", addTask); // Remove the existing handler
  submitButton.addEventListener("click", updateTask); // Add the update handler
  editingTaskId = taskId; // Set the current task ID for updates
}

async function deleteTask(taskId) {
  const date = document.getElementById("task-date").value;

  try {
    const response = await fetch(`${apiUrl}/${taskId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to delete task: ${errorText}`);
    }

    showTasks(date); // Refresh tasks list for the selected date

    Toastify({
      text: "Task deleted successfully!",
      backgroundColor: "linear-gradient(to right, #00b09b, #96c93d)",
      duration: 3000,
    }).showToast();
  } catch (error) {
    console.error("Error:", error);
    Toastify({
      text: error.message,
      backgroundColor: "linear-gradient(to right, #ff5f6d, #ffc371)",
      duration: 3000,
    }).showToast();
  }
}

function resetForm() {
  document.getElementById("form-title").textContent = "Add Task"; // Reset title
  const submitButton = document.getElementById("form-submit-btn");
  submitButton.textContent = "Add Task"; // Reset button text
  submitButton.removeEventListener("click", updateTask); // Remove the update handler
  submitButton.addEventListener("click", addTask); // Re-add the add task handler
}

function prevMonth() {
  if (currentMonth === 0) {
    generateCalendar(currentYear - 1, 11);
  } else {
    generateCalendar(currentYear, currentMonth - 1);
  }
}

function nextMonth() {
  if (currentMonth === 11) {
    generateCalendar(currentYear + 1, 0);
  } else {
    generateCalendar(currentYear, currentMonth + 1);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  generateCalendar(currentYear, currentMonth).then(() => {
    const today = new Date();
    const todayDate = `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    showTasks(todayDate); // Show tasks for today
  });

  // Set up form submission handler
  const form = document.getElementById("task-form");
  form.addEventListener("submit", (event) => {
    if (editingTaskId) {
      updateTask(event); // Use update function if editing
    } else {
      addTask(event); // Use add function if adding
    }
  });
});
