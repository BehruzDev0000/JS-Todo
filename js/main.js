const elList = document.querySelector(".list");
const elForm = document.querySelector(".create-todo");
const elFilter = document.querySelector(".todo-filter");
const modalWrapper = document.querySelector(".modal-wrapper");
const modalInner = document.querySelector(".modal-inner");

const BASE_URL = "http://localhost:3000";

function showModal(open = false) {
  if (open) {
    modalWrapper.classList.remove("hidden");
  } else {
    modalWrapper.classList.add("hidden");
  }
}

function openDeleteModal(id) {
  modalInner.innerHTML = `
    <h3 class="text-2xl font-semibold text-center mb-4 text-gray-800">Delete Todo</h3>
    <p class="text-center text-gray-600 mb-6">Are you sure you want to delete this todo?</p>
    <div class="flex justify-center gap-4">
      <button class="cancel-btn px-6 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500">Cancel</button>
      <button class="confirm-delete-btn px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-600">Delete</button>
    </div>
  `;

  modalInner.querySelector(".cancel-btn").onclick = () => showModal(false);
  modalInner.querySelector(".confirm-delete-btn").onclick = async () => {
    await axios.delete(`${BASE_URL}/todos/${id}`);
    renderFunction(await getAllTodos(), elList);
    showModal(false);
  };

  showModal(true);
}

function openEditModal(id, content) {
  modalInner.innerHTML = `
    <h3 class="text-2xl font-semibold text-center mb-4 text-gray-800">Edit Todo</h3>
    <form class="edit-form flex flex-col gap-4">
      <input type="text" name="edit-todo" class="w-full px-4 py-2 border-2 border-slate-300 rounded-md outline-none focus:border-slate-400" value="${content}" required>
      <div class="flex justify-center gap-4">
        <button type="button" class="cancel-btn px-6 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500">Cancel</button>
        <button type="submit" class="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">Save</button>
      </div>
    </form>
  `;

  modalInner.querySelector(".cancel-btn").onclick = () => showModal(false);
  modalInner.querySelector(".edit-form").onsubmit = async (e) => {
    e.preventDefault();
    const newContent = e.target["edit-todo"].value.trim();
    if (!newContent) return;

    await axios.patch(`${BASE_URL}/todos/${id}`, { content: newContent });
    renderFunction(await getAllTodos(), elList);
    showModal(false);
  };

  showModal(true);
}

function renderFunction(arr, list) {
  list.innerHTML = "";

  arr.forEach((item, index) => {
    const elItem = document.createElement("li");
    elItem.className = "p-2 rounded-md border-2 border-[#c3c3c3] flex justify-between bg-slate-300 items-center";

    elItem.innerHTML = `
      <div class="flex items-center gap-4 flex-1 min-w-0">
        <button class="toggle-btn flex-shrink-0 w-[30px] h-[30px] rounded-full border-2 ${item.isCompleted ? "bg-green-500 border-green-500" : "bg-white border-gray-400"} flex items-center justify-center hover:scale-110 transition">${item.isCompleted ? '<span class="text-white text-xl font-bold">✓</span>' : ""}
        </button>
        <span class="todo-text ${item.isCompleted ? "text-gray-500 line-through" : "text-white"} text-[20px] overflow-hidden text-ellipsis whitespace-nowrap flex-1 cursor-pointer">
          ${item.content}
        </span>
      </div>
      <div class="flex items-center gap-[10px] flex-shrink-0">
        <button class="delete-btn bg-[#c3c3c3] px-3 py-3 rounded-full hover:bg-red-400 transition">
          <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
          </svg>
        </button>
        <button class="edit-btn bg-[#c3c3c3] px-3 py-3 rounded-full hover:bg-blue-400 transition">
          <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
          </svg>
        </button>
      </div>
    `;

    elItem.addEventListener("click", async (e) => {
      if (e.target.closest(".toggle-btn") || e.target.closest(".todo-text")) {
        await toggleTodo(item.id);
      }

      if (e.target.closest(".delete-btn")) {
        openDeleteModal(item.id);
      }

      if (e.target.closest(".edit-btn")) {
        openEditModal(item.id, item.content);
      }
    });

    list.appendChild(elItem);
  });
}

async function getAllTodos() {
  const res = await axios.get(`${BASE_URL}/todos`);
  return res.data;
}

async function toggleTodo(id) {
  const todos = await getAllTodos();
  const todo = todos.find((t) => t.id === id);
  if (todo) {
    await axios.patch(`${BASE_URL}/todos/${id}`, {
      isCompleted: !todo.isCompleted,
    });
    renderFunction(await getAllTodos(), elList);
  }
}

elForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const input = e.target.todos;
  const content = input.value.trim();
  if (!content) return;

  await axios.post(`${BASE_URL}/todos`, { content });
  input.value = "";
  renderFunction(await getAllTodos(), elList);
});

elFilter.addEventListener("change", async (e) => {
  const todos = await getAllTodos();
  let filtered;

  if (e.target.value === "all") filtered = todos;
  else if (e.target.value === "completed") filtered = todos.filter((t) => t.isCompleted);
  else filtered = todos.filter((t) => !t.isCompleted);

  renderFunction(filtered, elList);
});

modalWrapper.addEventListener("click", (e) => {
  if (e.target === modalWrapper) showModal(false);
});

getAllTodos().then((data) => renderFunction(data, elList));