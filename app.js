const data = window.PROMPT_DATA || [];

const categorySelect = document.querySelector("#categorySelect");
const promptSelect = document.querySelector("#promptSelect");
const searchInput = document.querySelector("#searchInput");
const categoryText = document.querySelector("#categoryText");
const titleText = document.querySelector("#titleText");
const ratioBadge = document.querySelector("#ratioBadge");
const imageBadge = document.querySelector("#imageBadge");
const fieldInputs = document.querySelector("#fieldInputs");
const outputPrompt = document.querySelector("#outputPrompt");
const includeImageNote = document.querySelector("#includeImageNote");
const includeQualityNote = document.querySelector("#includeQualityNote");
const imageInput = document.querySelector("#imageInput");
const imagePreview = document.querySelector("#imagePreview");
const copyButton = document.querySelector("#copyButton");
const resetButton = document.querySelector("#resetButton");
const copyStatus = document.querySelector("#copyStatus");
const filterButtons = Array.from(document.querySelectorAll("[data-filter]"));

let activeFilter = "all";
let currentImageName = "";

function uniqueCategories() {
  return [...new Set(data.map((item) => item.category))];
}

function ratioGroup(item) {
  if (item.ratio.includes("16:9")) return "wide";
  if (item.ratio.includes("9:16") || item.ratio.includes("3:4") || item.ratio.includes("4:5")) return "vertical";
  return "square";
}

function filteredItems() {
  const category = categorySelect.value;
  const keyword = searchInput.value.trim().toLowerCase();

  return data.filter((item) => {
    const matchesCategory = !category || item.category === category;
    const haystack = `${item.category} ${item.title} ${item.prompt}`.toLowerCase();
    const matchesSearch = !keyword || haystack.includes(keyword);
    const matchesFilter =
      activeFilter === "all" ||
      (activeFilter === "image" && item.needsImage) ||
      ratioGroup(item) === activeFilter;

    return matchesCategory && matchesSearch && matchesFilter;
  });
}

function fillCategories() {
  categorySelect.innerHTML = "";
  const allOption = document.createElement("option");
  allOption.value = "";
  allOption.textContent = "全部分類";
  categorySelect.append(allOption);

  for (const category of uniqueCategories()) {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categorySelect.append(option);
  }
}

function fillPrompts(keepId) {
  const items = filteredItems();
  promptSelect.innerHTML = "";

  for (const item of items) {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = `${item.number}. ${item.title}`;
    promptSelect.append(option);
  }

  if (keepId && items.some((item) => item.id === keepId)) {
    promptSelect.value = keepId;
  } else if (items.length) {
    promptSelect.value = items[0].id;
  }

  if (!items.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "沒有符合的提示詞";
    promptSelect.append(option);
  }

  renderSelected();
}

function selectedItem() {
  const items = filteredItems();
  return items.find((item) => item.id === promptSelect.value) || items[0] || data[0];
}

function renderFields(item) {
  fieldInputs.innerHTML = "";
  for (const field of item.fields) {
    const wrapper = document.createElement("div");
    wrapper.className = "field-item";

    const label = document.createElement("label");
    label.textContent = field;

    const input = document.createElement("input");
    input.className = "text-input";
    input.type = "text";
    input.placeholder = `輸入${field}`;
    input.dataset.field = field;
    input.addEventListener("input", renderPrompt);

    wrapper.append(label, input);
    fieldInputs.append(wrapper);
  }
}

function fieldValues() {
  return Array.from(fieldInputs.querySelectorAll("input")).filter((input) => input.value.trim());
}

function applyFieldValues(prompt) {
  let result = prompt;
  for (const input of fieldValues()) {
    const key = input.dataset.field;
    const value = input.value.trim();
    const bracketPattern = new RegExp(`【${escapeRegExp(key)}】`, "g");
    result = result.replace(bracketPattern, value);
  }
  return result;
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function renderPrompt() {
  const item = selectedItem();
  if (!item) return;

  const lines = [];
  lines.push(`生成圖片：${item.title}`);
  lines.push(`分類：${item.category}`);
  lines.push(`建議比例：${item.ratio}`);

  if (includeImageNote.checked && (item.needsImage || currentImageName)) {
    const name = currentImageName || "請先上傳參考圖片";
    lines.push(`參考圖片：${name}`);
  }

  lines.push("");
  lines.push(applyFieldValues(item.prompt));

  if (includeQualityNote.checked) {
    lines.push("");
    lines.push("輸出要求：高解析度、構圖清楚、細節完整、文字清晰可讀，避免亂碼、變形、多餘物件與偏離原提示詞。");
  }

  outputPrompt.value = lines.join("\n");
}

function renderSelected() {
  const item = selectedItem();
  if (!item) return;

  if (promptSelect.value !== item.id) promptSelect.value = item.id;
  categoryText.textContent = item.category;
  titleText.textContent = `${item.number}. ${item.title}`;
  ratioBadge.textContent = item.ratio;
  imageBadge.textContent = item.needsImage ? "建議上傳參考圖" : "可直接生成";
  imageBadge.classList.toggle("is-warning", item.needsImage);
  renderFields(item);
  renderPrompt();
}

function handleImageUpload() {
  const file = imageInput.files && imageInput.files[0];
  imagePreview.innerHTML = "";

  if (!file) {
    currentImageName = "";
    imagePreview.innerHTML = "<span>尚未選擇圖片</span>";
    renderPrompt();
    return;
  }

  currentImageName = file.name;
  const image = document.createElement("img");
  image.alt = "參考圖片預覽";
  image.src = URL.createObjectURL(file);
  imagePreview.append(image);
  renderPrompt();
}

async function copyPrompt() {
  try {
    await navigator.clipboard.writeText(outputPrompt.value);
    copyStatus.textContent = "已複製";
  } catch {
    outputPrompt.select();
    document.execCommand("copy");
    copyStatus.textContent = "已複製";
  }

  window.setTimeout(() => {
    copyStatus.textContent = "";
  }, 1800);
}

function resetFields() {
  for (const input of fieldInputs.querySelectorAll("input")) {
    input.value = "";
  }
  renderPrompt();
}

function setFilter(filter) {
  activeFilter = filter;
  for (const button of filterButtons) {
    button.classList.toggle("is-active", button.dataset.filter === filter);
  }
  fillPrompts();
}

categorySelect.addEventListener("change", () => fillPrompts());
promptSelect.addEventListener("change", renderSelected);
searchInput.addEventListener("input", () => fillPrompts(promptSelect.value));
includeImageNote.addEventListener("change", renderPrompt);
includeQualityNote.addEventListener("change", renderPrompt);
imageInput.addEventListener("change", handleImageUpload);
copyButton.addEventListener("click", copyPrompt);
resetButton.addEventListener("click", resetFields);
filterButtons.forEach((button) => {
  button.addEventListener("click", () => setFilter(button.dataset.filter));
});

fillCategories();
setFilter("all");
