// Variables globales para Kanban
let tasks = [];
let currentKanbanDate = new Date();

// Inicializar fecha en el modal de añadir tarea
document.addEventListener("DOMContentLoaded", function () {
  setCurrentDateInTaskForm();
  loadAndRenderTasks();
});

function setCurrentDateInTaskForm() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  document.getElementById("taskDate").value = `${year}-${month}-${day}`;
}

// Funciones para el Kanban
function toggleKanban() {
  const kanbanContainer = document.getElementById("kanbanContainer");
  kanbanContainer.classList.toggle("hidden");
  updateKanbanDate();
  renderTasks();
}

function closeKanban() {
  document.getElementById("kanbanContainer").classList.add("hidden");
}

function showAddTaskForm(column) {
  document.getElementById("taskColumn").value = column;
  document.getElementById("addTaskModal").classList.remove("hidden");
  document.getElementById("addTaskOverlay").classList.remove("hidden");
  setCurrentDateInTaskForm();
}

function closeAddTaskModal() {
  document.getElementById("addTaskModal").classList.add("hidden");
  document.getElementById("addTaskOverlay").classList.add("hidden");
}

function changeKanbanDay(offset) {
  currentKanbanDate.setDate(currentKanbanDate.getDate() + offset);
  updateKanbanDate();
  renderTasks();
}

function updateKanbanDate() {
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  const dateStr = currentKanbanDate.toLocaleDateString("es-ES", options);
  document.getElementById("kanbanDate").textContent = `Tareas para ${dateStr}`;
}

// Funciones para la gestión de tareas
async function loadTasks() {
  try {
    const response = await fetch(
      `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/data/tasks.json?t=${Date.now()}`
    );
    if (!response.ok) {
      if (response.status === 404) return []; // Si el archivo no existe, devolver array vacío
      throw new Error(
        `Error al cargar las tareas: ${response.status} - ${response.statusText}`
      );
    }

    const loadedTasks = await response.json();
    // Procesar tareas y asegurar que tengan todos los campos necesarios
    const processedTasks = loadedTasks.map((task) => ({
      id:
        task.id ||
        `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: task.name,
      subject: task.subject,
      startTime: task.startTime || null,
      endTime: task.endTime || null,
      date: task.date,
      status: task.status || "todo",
      highPriority: task.highPriority || false,
      created: task.created || new Date().toISOString(),
    }));

    tasks = processedTasks;
    return processedTasks;
  } catch (error) {
    console.error("Error al cargar tareas:", error);
    return [];
  }
}

async function loadAndRenderTasks() {
  await loadTasks();
  renderTasks();
}

function renderTasks() {
  const todoContainer = document.getElementById("todoTasks");
  const inProgressContainer = document.getElementById("inProgressTasks");
  const completedContainer = document.getElementById("completedTasks");

  // Limpiar contenedores
  todoContainer.innerHTML = "";
  inProgressContainer.innerHTML = "";
  completedContainer.innerHTML = "";

  // Filtrar tareas para el día actual en el Kanban
  const currentDateStr = `${currentKanbanDate.getFullYear()}-${String(
    currentKanbanDate.getMonth() + 1
  ).padStart(2, "0")}-${String(currentKanbanDate.getDate()).padStart(2, "0")}`;

  const filteredTasks = tasks.filter((task) => task.date === currentDateStr);

  // Renderizar tareas filtradas según su estado
  filteredTasks.forEach((task) => {
    const taskElement = createTaskElement(task);

    if (task.status === "todo") {
      todoContainer.appendChild(taskElement);
    } else if (task.status === "inprogress") {
      inProgressContainer.appendChild(taskElement);
    } else if (task.status === "completed") {
      completedContainer.appendChild(taskElement);
    }
  });
}

function createTaskElement(task) {
  const taskElement = document.createElement("div");
  taskElement.className = `p-3 rounded-lg shadow-sm border-l-4 ${
    task.highPriority ? "border-red-500 bg-red-50" : "border-gray-300 bg-white"
  } flex justify-between items-start`;
  taskElement.setAttribute("data-task-id", task.id);

  // Contenido de la tarea
  const contentDiv = document.createElement("div");
  contentDiv.className = "flex-1";

  // Nombre de la tarea
  const nameElement = document.createElement("p");
  nameElement.className = "font-medium";
  nameElement.textContent = task.name;
  contentDiv.appendChild(nameElement);

  // Asignatura (si existe)
  if (task.subject && task.subject !== "null") {
    const subjectElement = document.createElement("p");
    subjectElement.className = "text-sm text-gray-600";
    subjectElement.textContent = task.subject;
    contentDiv.appendChild(subjectElement);
  }

  // Horario (si existe)
  if (task.startTime && task.endTime) {
    const timeElement = document.createElement("p");
    timeElement.className = "text-xs text-gray-500 mt-1";
    timeElement.textContent = `${task.startTime} - ${task.endTime}`;
    contentDiv.appendChild(timeElement);
  }

  taskElement.appendChild(contentDiv);

  // Botones de acción
  const actionsDiv = document.createElement("div");
  actionsDiv.className = "flex flex-col space-y-1";

  // Botones para mover entre columnas
  if (task.status !== "todo") {
    const moveLeftBtn = document.createElement("button");
    moveLeftBtn.className =
      "text-xs px-1 bg-gray-200 hover:bg-gray-300 rounded";
    moveLeftBtn.textContent = "←";
    moveLeftBtn.onclick = (e) => {
      e.stopPropagation();
      moveTask(task.id, "left");
    };
    actionsDiv.appendChild(moveLeftBtn);
  }

  if (task.status !== "completed") {
    const moveRightBtn = document.createElement("button");
    moveRightBtn.className =
      "text-xs px-1 bg-gray-200 hover:bg-gray-300 rounded";
    moveRightBtn.textContent = "→";
    moveRightBtn.onclick = (e) => {
      e.stopPropagation();
      moveTask(task.id, "right");
    };
    actionsDiv.appendChild(moveRightBtn);
  }

  // Botón para eliminar
  const deleteBtn = document.createElement("button");
  deleteBtn.className =
    "text-xs px-1 bg-red-200 hover:bg-red-300 rounded text-red-700";
  deleteBtn.textContent = "X";
  deleteBtn.onclick = (e) => {
    e.stopPropagation();
    deleteTask(task.id);
  };
  actionsDiv.appendChild(deleteBtn);

  taskElement.appendChild(actionsDiv);

  return taskElement;
}

function addNewTask() {
  const nameInput = document.getElementById("taskName");
  const name = nameInput.value.trim();

  if (!name) {
    alert("El nombre de la tarea es obligatorio");
    return;
  }

  const subject = document.getElementById("taskSubject").value;
  const startTime = document.getElementById("startTime").value;
  const endTime = document.getElementById("endTime").value;
  const date = document.getElementById("taskDate").value;
  const highPriority = document.getElementById("highPriority").checked;
  const status = document.getElementById("taskColumn").value;

  const newTask = {
    id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    subject,
    startTime,
    endTime,
    date,
    status,
    highPriority,
    created: new Date().toISOString(),
  };

  tasks.push(newTask);

  renderTasks();
  closeAddTaskModal();

  // Limpiar el formulario
  nameInput.value = "";
  document.getElementById("taskSubject").value = "null";
  document.getElementById("startTime").value = "";
  document.getElementById("endTime").value = "";
  document.getElementById("highPriority").checked = false;
}

function moveTask(taskId, direction) {
  const taskIndex = tasks.findIndex((t) => t.id === taskId);
  if (taskIndex === -1) return;

  const task = tasks[taskIndex];
  const statuses = ["todo", "inprogress", "completed"];
  const currentStatusIndex = statuses.indexOf(task.status);

  if (direction === "left" && currentStatusIndex > 0) {
    task.status = statuses[currentStatusIndex - 1];
  } else if (
    direction === "right" &&
    currentStatusIndex < statuses.length - 1
  ) {
    task.status = statuses[currentStatusIndex + 1];
  }

  renderTasks();
}

function deleteTask(taskId) {
  if (confirm("¿Estás seguro de que quieres eliminar esta tarea?")) {
    const taskIndex = tasks.findIndex((t) => t.id === taskId);
    if (taskIndex !== -1) {
      tasks.splice(taskIndex, 1);

      renderTasks();
    }
  }
}

// Añadir estilo para el botón flotante Kanban
document.addEventListener("DOMContentLoaded", function () {
  const styleElement = document.createElement("style");
  styleElement.textContent = `
      .floating-button3 {
        position: fixed;
        bottom: 120px;
        right: 20px;
        z-index: 100;
      }
    `;
  document.head.appendChild(styleElement);
});

// Variables globales
const REPO_OWNER = "PJP27"; // This can be changed dynamically if needed
const REPO_NAME = "organizacion";
let githubToken = ""; // Only used for write operations
const FILE_PATH = "data/exams.json";
let exams = []; // Guardar los exámenes localmente
let calendar; // Instancia del calendario mensual

// Inicializar flatpickr
flatpickr("#datePicker", {
  dateFormat: "Y-m-d",
});

// Función para alternar la visibilidad del gestor de exámenes
function toggleTaskManager() {
  const taskManagerContainer = document.getElementById("taskManagerContainer");
  const taskManagerOverlay = document.getElementById("taskManagerOverlay");
  const credentialsForm = document.getElementById("credentialsForm");
  const taskManager = document.getElementById("taskManager");

  // Mostrar el contenedor y el overlay
  taskManagerContainer.classList.remove("hidden");
  taskManagerOverlay.classList.remove("hidden");

  // Mostrar el formulario de credenciales, ocultar el formulario de exámenes
  credentialsForm.classList.remove("hidden");
  taskManager.classList.add("hidden");
}

// Función para cerrar el gestor de exámenes
function closeTaskManager() {
  const taskManagerContainer = document.getElementById("taskManagerContainer");
  const taskManagerOverlay = document.getElementById("taskManagerOverlay");
  taskManagerContainer.classList.add("hidden");
  taskManagerOverlay.classList.add("hidden");
}

// Función para guardar credenciales (solo para modificaciones)
function setCredentials() {
  githubToken = document.getElementById("githubToken").value.trim();

  // Ocultar formulario de credenciales y mostrar el gestor de tareas
  document.getElementById("credentialsForm").classList.add("hidden");
  document.getElementById("taskManager").classList.remove("hidden");
}

async function requestTokenAndLoadExams() {
  githubToken = prompt("Por favor, introduce tu token de GitHub:");
  if (!githubToken) {
    alert("Es necesario un token para acceder al repositorio.");
    return;
  }
  try {
    const loadedExams = await loadExams();
    renderCalendar(loadedExams);
  } catch (error) {
    console.error("Error al cargar los exámenes:", error);
    alert(
      "No se pudieron cargar los exámenes. Verifica tu token y vuelve a intentarlo."
    );
  }
}

// Cargar exámenes desde GitHub sin necesidad de token
async function loadExams() {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`,
      {
        headers: {
          Authorization: `token ${githubToken}`, // Autenticación con el token
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Error al cargar los exámenes: ${response.status} - ${response.statusText}`
      );
    }

    const fileData = await response.json();
    const fileContent = atob(fileData.content); // Decodificar contenido base64
    const loadedExams = JSON.parse(fileContent);

    // Procesar exámenes (agregar ID y timestamps si faltan)
    const processedExams = loadedExams.map((exam) => ({
      ...exam,
      id: exam.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      created: exam.created || new Date().toISOString(),
    }));

    exams = processedExams; // Actualizar la lista global de exámenes
    return processedExams;
  } catch (error) {
    console.error("Error al cargar exámenes:", error);
    throw error;
  }
}

// Función para añadir un examen (requiere token)
function addExam() {
  if (!githubToken) {
    alert("Por favor, introduce un token de GitHub para añadir exámenes.");
    return;
  }
  const subject = document.getElementById("subjectSelect").value;
  const examName = document.getElementById("examInput").value.trim();
  const examDate = document.getElementById("datePicker").value;

  // Get reminder time from the select element
  const reminderTime = parseInt(
    document.getElementById("reminderTimeSelect").value
  );

  if (!subject || !examName || !examDate) {
    alert("Por favor, complete todos los campos.");
    return;
  }

  const newExam = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    subject: subject,
    examName: examName,
    examDate: examDate,
    created: new Date().toISOString(),
    reminderTime: reminderTime,
  };

  exams.push(newExam);
  renderCalendar(exams);

  // Clear input fields
  document.getElementById("subjectSelect").value = "";
  document.getElementById("examInput").value = "";
  document.getElementById("datePicker").value = "";
  document.getElementById("reminderTimeSelect").value = "0"; // Reset to default
}

// Función para guardar cambios en GitHub (requiere token)
async function saveChanges() {
  if (!githubToken) {
    alert("Por favor, introduce un token de GitHub para guardar cambios.");
    return;
  }
  try {
    // Obtener SHA actual del archivo (si existe)
    let currentSHA;
    try {
      const shaResponse = await fetch(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/data/tasks.json`,
        { headers: { Authorization: `token ${githubToken}` } }
      );
      if (shaResponse.ok) {
        const fileData = await shaResponse.json();
        currentSHA = fileData.sha;
      }
    } catch (error) {
      console.log(
        "El archivo tasks.json no existe o no se pudo obtener el SHA"
      );
    }

    // Preparar el contenido para subir
    const content = btoa(
      unescape(encodeURIComponent(JSON.stringify(tasks, null, 2)))
    );

    // Configurar el método y body según si el archivo existe o no
    const method = currentSHA ? "PUT" : "PUT";
    const body = JSON.stringify({
      message: "Update tasks",
      content,
      sha: currentSHA,
    });

    // Realizar la solicitud
    const response = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/data/tasks.json`,
      {
        method,
        headers: {
          Authorization: `token ${githubToken}`,
          "Content-Type": "application/json",
        },
        body,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error al guardar tareas: ${errorData.message}`);
    }

    console.log("Tareas guardadas exitosamente");
    alert("¡Cambios guardados exitosamente en GitHub!");
  } catch (error) {
    console.error("Error al guardar tareas:", error);
    alert(`No se pudieron guardar las tareas: ${error.message}`);
  }
}

// Función de reintento para guardar exámenes (requiere token)
async function retryExamSave(examsToSave, maxRetries) {
  if (!githubToken) {
    throw new Error("Se requiere un token de GitHub para guardar cambios.");
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const currentSHA = await getFileSHA();
      const content = btoa(
        unescape(encodeURIComponent(JSON.stringify(examsToSave)))
      );

      const response = await fetch(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`,
        {
          method: "PUT",
          headers: {
            Authorization: `token ${githubToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: `Update exams (Attempt ${attempt})`,
            content,
            sha: currentSHA,
          }),
        }
      );

      if (response.ok) {
        console.log("Exámenes guardados exitosamente en GitHub.");
        await loadAndRenderExams();
        return true;
      }

      const errorData = await response.json();
      if (response.status === 409) {
        console.warn(
          `Conflicto en el intento ${attempt}. Refrescando exámenes...`
        );
        const latestExams = await loadExams();
        exams = mergeExams(latestExams, examsToSave);

        if (attempt === maxRetries) {
          throw new Error(
            "No se pudo resolver el conflicto después de varios intentos"
          );
        }

        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      } else {
        throw new Error(`Error al guardar: ${errorData.message}`);
      }
    } catch (error) {
      console.error(`Intento ${attempt} fallido:`, error);
      if (attempt === maxRetries) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }
  return false;
}

// Función para obtener SHA del archivo (requiere token)
async function getFileSHA() {
  if (!githubToken) {
    throw new Error("Se requiere un token de GitHub para obtener el SHA.");
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`,
      { headers: { Authorization: `token ${githubToken}` } }
    );

    if (!response.ok) throw new Error(`Error al obtener SHA del archivo`);

    return (await response.json()).sha;
  } catch (error) {
    console.error("Error SHA");
  }
}

// Resto de las funciones (renderCalendar, renderWeeklyCalendar, etc.) permanecen igual

// Cargar y renderizar exámenes al cargar la página
document.addEventListener("DOMContentLoaded", () => {
  // Cargar exámenes sin necesidad de credenciales
  loadAndRenderExams();
});

// Función para cargar y renderizar exámenes
async function loadAndRenderExams() {
  try {
    const loadedExams = await loadExams();
    renderCalendar(loadedExams);
  } catch (error) {
    console.error("Error al cargar y renderizar exámenes:", error);
  }
}

// Función para fusionar exámenes
function mergeExams(remoteExams, localExams) {
  const examMap = new Map();

  remoteExams.forEach((exam) => {
    examMap.set(
      exam.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      exam
    );
  });

  localExams.forEach((localExam) => {
    const existingExam = examMap.get(localExam.id);
    if (
      !existingExam ||
      new Date(localExam.created) > new Date(existingExam.created)
    ) {
      examMap.set(localExam.id, localExam);
    }
  });

  return Array.from(examMap.values()).sort(
    (a, b) => new Date(a.created) - new Date(b.created)
  );
}
// Cargar exámenes desde GitHub
async function loadExams() {
  try {
    const response = await fetch(
      `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/${FILE_PATH}?t=${Date.now()}`
    );
    if (!response.ok) {
      if (response.status === 404) return [];
      throw new Error(
        `Error al cargar los exámenes: ${response.status} - ${response.statusText}`
      );
    }
    const loadedExams = await response.json(); // Ensure each exam has an ID and created timestamp
    const processedExams = loadedExams.map((exam) => ({
      ...exam,
      id: exam.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      created: exam.created || new Date().toISOString(),
    }));
    exams = processedExams; // Update global exams
    return processedExams;
  } catch (error) {
    console.error("Error al cargar exámenes:", error);
    throw error;
  }
}
// Obtener SHA del archivo desde GitHub
async function getFileSHA() {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`,
      { headers: { Authorization: `token ${githubToken}` } }
    );
    if (!response.ok) throw new Error(`Error al obtener SHA del archivo`);
    return (await response.json()).sha;
  } catch (error) {
    console.error("Error SHA");
  }
}
// Renderizar exámenes en el calendario mensual

function isStudyEvent(examName) {
  return /estudiar/i.test(examName); // Utilizamos regex con flag 'i' para que sea case-insensitive
}

// Modificar la función renderCalendar para aplicar el borde azul oscuro en lugar de rojo
function renderCalendar(exams) {
  const subjectColors = {
    Religion: "#FF6B6B", // Rojo suave
    Matematicas: "#25a6da", // Turquesa
    Fisica: "#766ec5", // Azul claro
    Lengua: "#e61919", // Amarillo dorado
    Historia: "#008000", // Verde
    Filosofia: "#b8b814", // Verde pastel
    Tecnologia: "#FF8ED4", // Rosa
    Frances: "#FF9FF3", // Rosa claro
  };

  // Add CSS for thick exam border and past events
  const style = document.createElement("style");
  style.textContent = `
    .fc-event.exam-event {
      border-width: 2.5px !important;
      border-color: #FF0000 !important;
    }
    .fc-event.study-event {
      border-width: 2.5px !important;
      border-color: #000080 !important; /* Azul oscuro */
    }
    .fc-event.study-reminder-for-study {
      border-width: 2.5px !important;
      border-color: #00BFFF !important; /* Celeste/Azul claro */
    }
    
    .fc-event.past-event {
      opacity: 0.5 !important;
      color: black !important;
    }
  `;
  document.head.appendChild(style);

  // Function to convert hex to RGBA with 80% opacity
  function hexToRgba(hex, opacity = 0.3) {
    // Remove the hash at the beginning if it's there
    hex = hex.replace("#", "");

    // Parse the hex color
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Return RGBA string
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  // Study reminder days for each subject
  const studyReminderDays = {
    Religion: 0,
    Matematicas: 2,
    Fisica: 3,
    Lengua: 4,
    Historia: 5,
    Filosofia: 5,
    Tecnologia: 2,
    Frances: 1,
  };

  // Function to check if an event is in the past
  function isPastEvent(eventDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    const eventDateObj = new Date(eventDate);
    return eventDateObj < today;
  }

  // Function to generate study reminder events
  function generateStudyReminders(exams) {
    return exams.flatMap((exam) => {
      // Use reminderTime from the exam object instead of hardcoded values
      const reminderDays = exam.reminderTime || 0;

      // Skip if no study reminder days
      if (reminderDays === 0) return [];

      // Check if this is a study event (has "Estudiar" in the name)
      const isStudy = isStudyEvent(exam.examName);

      // Generate multiple study reminder events
      const reminderEvents = [];
      const originalColor = subjectColors[exam.subject] || "#3788d8";
      const reducedOpacityColor = isPastEvent(exam.examDate)
        ? hexToRgba(originalColor, 0.1)
        : hexToRgba(originalColor);

      for (let i = 1; i <= reminderDays; i++) {
        const reminderDate = new Date(exam.examDate);
        reminderDate.setDate(reminderDate.getDate() - i);

        reminderEvents.push({
          title: `Estudiar ${exam.subject}`,
          start: reminderDate.toISOString().split("T")[0],
          end: reminderDate.toISOString().split("T")[0],
          allDay: true,
          backgroundColor: reducedOpacityColor,
          borderColor: isStudy ? "#00BFFF" : "#000080", // Celeste para eventos de estudio, azul oscuro para exámenes
          textColor: isPastEvent(reminderDate.toISOString().split("T")[0])
            ? "black"
            : "black",
          className: isPastEvent(reminderDate.toISOString().split("T")[0])
            ? [
                isStudy ? "study-reminder-for-study" : "study-reminder",
                "past-event",
              ]
            : isStudy
            ? "study-reminder-for-study"
            : "study-reminder",
        });
      }

      return reminderEvents;
    });
  }

  if (!calendar) {
    // Initialize calendar only once
    const calendarEl = document.getElementById("calendar");
    calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: "dayGridMonth",
      locale: "es",
      firstDay: 1,
      headerToolbar: {
        left: "prev,next",
        center: "title",
        right: "",
      },
      visibleRange: function (currentDate) {
        const start = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          1
        );
        const end = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() + 2,
          0
        );
        return { start: start, end: end };
      },
      events: [],
      eventClick: function (info) {
        info.jsEvent.preventDefault();
        showExamDetails(info);
      },
    });
    calendar.render();

    // First add study reminder events
    generateStudyReminders(exams).forEach((reminderEvent) => {
      calendar.addEvent(reminderEvent);
    });

    // Then add exam events
    exams.forEach((exam) => {
      const isStudy = isStudyEvent(exam.examName);
      calendar.addEvent({
        title: `${exam.examName}`,
        start: exam.examDate,
        end: exam.examDate,
        allDay: true,
        backgroundColor: isPastEvent(exam.examDate)
          ? hexToRgba(subjectColors[exam.subject] || "#3788d8", 0.1)
          : subjectColors[exam.subject] || "#3788d8",
        borderColor: isStudy ? "#000080" : "#FF0000", // Azul oscuro para eventos de estudio, rojo para exámenes
        textColor: isPastEvent(exam.examDate) ? "black" : undefined,
        className: isPastEvent(exam.examDate)
          ? [isStudy ? "study-event" : "exam-event", "past-event"]
          : isStudy
          ? "study-event"
          : "exam-event",
      });
    });
  } else {
    // If calendar is already initialized, clear existing events
    calendar.getEvents().forEach((event) => event.remove());

    // First add study reminder events
    generateStudyReminders(exams).forEach((reminderEvent) => {
      calendar.addEvent(reminderEvent);
    });

    // Then add exam events
    exams.forEach((exam) => {
      const isStudy = isStudyEvent(exam.examName);
      calendar.addEvent({
        title: `${exam.examName}`,
        start: exam.examDate,
        end: exam.examDate,
        allDay: true,
        backgroundColor: isPastEvent(exam.examDate)
          ? hexToRgba(subjectColors[exam.subject] || "#3788d8", 0.1)
          : subjectColors[exam.subject] || "#3788d8",
        borderColor: isStudy ? "#000080" : "#FF0000", // Azul oscuro para eventos de estudio, rojo para exámenes
        textColor: isPastEvent(exam.examDate) ? "black" : undefined,
        className: isPastEvent(exam.examDate)
          ? [isStudy ? "study-event" : "exam-event", "past-event"]
          : isStudy
          ? "study-event"
          : "exam-event",
      });
    });
  }
}

// Renderizar el calendario semanal

function toggleExamList() {
  const container = document.getElementById("examListContainer");
  container.classList.toggle("hidden");
  renderExamList();
}

function closeExamList() {
  document.getElementById("examListContainer").classList.add("hidden");
}

function renderExamList() {
  // Get tab containers
  const currentExamsContainer = document.getElementById("currentExamList");
  const pastExamsContainer = document.getElementById("pastExamList");
  // Clear previous content
  currentExamsContainer.innerHTML = "";
  pastExamsContainer.innerHTML = "";
  // Get current date
  const currentDate = new Date();
  // Sort exams by date (earliest to latest)
  const sortedExams = exams.sort((a, b) => {
    const dateA = new Date(a.examDate);
    const dateB = new Date(b.examDate);
    return dateA - dateB;
  });
  // Separate current and past exams
  const currentExams = sortedExams.filter((exam) => {
    const examDate = new Date(exam.examDate);
    return examDate >= currentDate;
  });
  const pastExams = sortedExams.filter((exam) => {
    const examDate = new Date(exam.examDate);
    return examDate < currentDate;
  });
  // Render current exams
  currentExams.forEach((exam, index) => {
    const listItem = document.createElement("li");
    listItem.classList.add(
      "flex",
      "justify-between",
      "items-center",
      "bg-gray-100",
      "p-2",
      "rounded",
      "mb-2"
    );

    // Calculate days until exam
    const examDate = new Date(exam.examDate);
    const timeDiff = examDate.getTime() - currentDate.getTime();
    const daysUntilExam = Math.ceil(timeDiff / (1000 * 3600 * 24));

    listItem.innerHTML = `
            <span>${exam.subject} - ${exam.examName} (${exam.examDate})
                - Quedan ${daysUntilExam} días
            </span>
            <div>
                <button onclick="editReminderTime(${exams.indexOf(
                  exam
                )})" class="bg-blue-500 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs mr-2">
                    Editar Recordatorio
                </button>
                <button onclick="deleteExam(${exams.indexOf(
                  exam
                )})" class="bg-red-500 hover:bg-red-700 text-white px-2 py-1 rounded text-xs">
                    Eliminar
                </button>
            </div>
        `;
    currentExamsContainer.appendChild(listItem);
  });
  // Render past exams
  pastExams.forEach((exam, index) => {
    const listItem = document.createElement("li");
    listItem.classList.add(
      "flex",
      "justify-between",
      "items-center",
      "bg-gray-200",
      "p-2",
      "rounded",
      "mb-2",
      "opacity-70"
    );
    listItem.innerHTML = `
            <span>${exam.subject} - ${exam.examName} (${exam.examDate})
                - Completado
            </span>
            <div>
                <button onclick="deleteExam(${exams.indexOf(
                  exam
                )})" class="bg-red-500 hover:bg-red-700 text-white px-2 py-1 rounded text-xs">
                    Eliminar
                </button>
            </div>
        `;
    pastExamsContainer.appendChild(listItem);
  });
  // Update tab labels with count
  document.getElementById(
    "currentExamsTab"
  ).textContent = `Exámenes Actuales (${currentExams.length})`;
  document.getElementById(
    "pastExamsTab"
  ).textContent = `Exámenes Pasados (${pastExams.length})`;
}
// Function to switch tabs
function switchTab(tabName) {
  const currentExamsTab = document.getElementById("currentExamsTabContent");
  const pastExamsTab = document.getElementById("pastExamsTabContent");
  const currentExamsTabButton = document.getElementById("currentExamsTab");
  const pastExamsTabButton = document.getElementById("pastExamsTab");

  if (tabName === "current") {
    currentExamsTab.classList.remove("hidden");
    pastExamsTab.classList.add("hidden");
    currentExamsTabButton.classList.add("bg-blue-500", "text-white");
    pastExamsTabButton.classList.remove("bg-blue-500", "text-white");
  } else {
    currentExamsTab.classList.add("hidden");
    pastExamsTab.classList.remove("hidden");
    currentExamsTabButton.classList.remove("bg-blue-500", "text-white");
    pastExamsTabButton.classList.add("bg-blue-500", "text-white");
  }
}

// New function to edit reminder time
function editReminderTime(index) {
  const exam = exams[index];
  const newReminderTime = parseInt(
    prompt(
      `Actualmente tienes ${
        exam.reminderTime || 0
      } días de recordatorio. ¿Cuántos días quieres ahora?`,
      exam.reminderTime || "3"
    )
  );

  if (!isNaN(newReminderTime)) {
    exam.reminderTime = newReminderTime;
    renderExamList();
    renderCalendar(exams);
  }
}

function deleteExam(index) {
  exams.splice(index, 1);
  renderExamList();
}

function showExamDetails(eventInfo) {
  // Crear el modal
  const modal = document.createElement("div");
  modal.id = "examDetailsModal";
  modal.className =
    "fixed inset-0 bg-black bg-opacity-50 z-[1000] flex items-center justify-center";

  // Encontrar los detalles del examen
  const title = eventInfo.event.title;
  const subjectMatch = title.match(/^(.*): (.*)/);
  const currentDate = new Date();

  // Función para calcular días restantes
  const calculateDaysRemaining = (examDate) => {
    const examDateObj = new Date(examDate);
    const timeDiff = examDateObj.getTime() - currentDate.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  };

  let modalContent;

  if (subjectMatch) {
    // Si es un formato de asignatura: examen
    const subject = subjectMatch[1];
    const examName = subjectMatch[2];

    const matchingExam = exams.find(
      (exam) => exam.subject === subject && exam.examName === examName
    );

    // Contenido para un examen específico
    modalContent = `
          <div class="bg-white rounded-lg p-8 max-w-md w-full relative text-center">
            <button id="closeExamDetailsModal" class="absolute top-4 right-4 text-gray-600 hover:text-gray-900 text-3xl">
              &times;
            </button>
            <div id="examDetailsContent" class="space-y-4">
              <h2 class="text-4xl font-bold mb-4 text-blue-700">
                ${title}
              </h2>
              ${
                matchingExam
                  ? `
                <div class="text-xl">
                  <p class="text-gray-700"><strong>Asignatura:</strong> ${
                    matchingExam.subject
                  }</p>
                  <p class="text-gray-700"><strong>Fecha:</strong> ${
                    matchingExam.examDate
                  }</p>
                  <p class="text-gray-700"><strong>Quedan:</strong> ${calculateDaysRemaining(
                    matchingExam.examDate
                  )} días</p>
                </div>
              `
                  : ""
              }
            </div>
          </div>
        `;
  } else {
    // Si es solo el nombre del examen (sin asignatura)
    const matchingExam = exams.find((exam) => exam.examName === title);

    if (matchingExam) {
      // Contenido para un examen específico sin asignatura
      modalContent = `
            <div class="bg-white rounded-lg p-8 max-w-md w-full relative text-center">
              <button id="closeExamDetailsModal" class="absolute top-4 right-4 text-gray-600 hover:text-gray-900 text-3xl">
                &times;
              </button>
              <div id="examDetailsContent" class="space-y-4">
                <h2 class="text-4xl font-bold mb-4 text-blue-700">
                  ${title}
                </h2>
                <div class="text-xl">
                  <p class="text-gray-700"><strong>Asignatura:</strong> ${
                    matchingExam.subject
                  }</p>
                  <p class="text-gray-700"><strong>Fecha:</strong> ${
                    matchingExam.examDate
                  }</p>
                  <p class="text-gray-700"><strong>Quedan:</strong> ${calculateDaysRemaining(
                    matchingExam.examDate
                  )} días</p>
                </div>
              </div>
            </div>
          `;
    } else {
      // Si no se encuentra el examen, mostrar asignaturas
      const subject = title;

      // Sort exams by upcoming dates
      const sortedSubjectExams = exams
        .filter((exam) => exam.subject === subject)
        .sort((a, b) => {
          const dateA = new Date(a.examDate);
          const dateB = new Date(b.examDate);

          // First, prioritize future exams
          const aIsFuture = dateA >= currentDate;
          const bIsFuture = dateB >= currentDate;

          if (aIsFuture && !bIsFuture) return -1;
          if (!aIsFuture && bIsFuture) return 1;

          // If both are future or both are past, sort by date
          return dateA - dateB;
        });

      // Contenido para una asignatura
      modalContent = `
            <div class="bg-white rounded-lg p-8 max-w-md w-full relative text-center">
              <button id="closeExamDetailsModal" class="absolute top-4 right-4 text-gray-600 hover:text-gray-900 text-3xl">
                &times;
              </button>
              <div id="examDetailsContent" class="space-y-4">
                <h2 class="text-4xl font-bold mb-4 text-blue-700">
                  ${subject}
                </h2>
                <div class="text-xl">
                  <h3 class="font-semibold mb-2">Próximos Exámenes:</h3>
                  ${
                    sortedSubjectExams.length > 0
                      ? `
                    <ul class="space-y-2">
                      ${sortedSubjectExams
                        .map(
                          (exam) => `
                        <li class="bg-gray-100 p-2 rounded ${
                          new Date(exam.examDate) < currentDate
                            ? "opacity-50"
                            : ""
                        }">
                          <strong>${exam.examName}</strong>
                          <p class="text-gray-600">Fecha: ${exam.examDate}</p>
                          <p class="text-gray-600">Quedan: ${calculateDaysRemaining(
                            exam.examDate
                          )} días</p>
                        </li>
                      `
                        )
                        .join("")}
                    </ul>
                  `
                      : '<p class="text-gray-500">No hay exámenes programados para esta asignatura.</p>'
                  }
                </div>
              </div>
            </div>
          `;
    }
  }

  // Añadir contenido al modal
  modal.innerHTML = modalContent;
  document.body.appendChild(modal);

  // Añadir evento de cierre
  document
    .getElementById("closeExamDetailsModal")
    .addEventListener("click", () => {
      document.body.removeChild(modal);
    });

  // Añadir cierre del modal al hacer clic fuera
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });
}

// Cargar y renderizar exámenes al cargar la página
document.addEventListener("DOMContentLoaded", () => {
  // Comprobar si ya hay credenciales guardadas
  if (githubToken) {
    loadAndRenderExams();
  }
});

window.onload = function () {
  $(".fc-toolbar.fc-header-toolbar").addClass("row col-lg-12");
};

// add the responsive classes when navigating with calendar buttons
$(document).on("click", ".fc-button", function (e) {
  $(".fc-toolbar.fc-header-toolbar").addClass("row col-lg-12");
});
