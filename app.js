const data = window.PROMPT_DATA || [];

const categoryCards = document.querySelector("#categoryCards");
const optionCards = document.querySelector("#optionCards");
const optionHint = document.querySelector("#optionHint");
const searchInput = document.querySelector("#searchInput");
const subjectInput = document.querySelector("#subjectInput");
const targetInput = document.querySelector("#targetInput");
const platformSelect = document.querySelector("#platformSelect");
const ratioSelect = document.querySelector("#ratioSelect");
const copyInput = document.querySelector("#copyInput");
const styleInput = document.querySelector("#styleInput");
const extraInput = document.querySelector("#extraInput");
const imageInput = document.querySelector("#imageInput");
const imagePreview = document.querySelector("#imagePreview");
const imageHelp = document.querySelector("#imageHelp");
const selectedCategoryText = document.querySelector("#selectedCategoryText");
const outputTitle = document.querySelector("#outputTitle");
const ratioBadge = document.querySelector("#ratioBadge");
const imageBadge = document.querySelector("#imageBadge");
const nextSteps = document.querySelector("#nextSteps");
const outputPrompt = document.querySelector("#outputPrompt");
const copyButton = document.querySelector("#copyButton");
const resetButton = document.querySelector("#resetButton");
const copyStatus = document.querySelector("#copyStatus");

let selectedCategory = "";
let selectedId = "";
let currentImageName = "";

const ratioOptions = [
  "沿用建議比例",
  "1:1 方形",
  "4:5 直式",
  "9:16 直式",
  "16:9 橫式",
  "3:4 直式",
  "自訂比例"
];

function categories() {
  return [...new Set(data.map((item) => item.category))];
}

function itemsForCategory() {
  const keyword = searchInput.value.trim().toLowerCase();
  return data.filter((item) => {
    const matchCategory = !selectedCategory || item.category === selectedCategory;
    const text = `${item.category} ${item.title} ${item.prompt}`.toLowerCase();
    return matchCategory && (!keyword || text.includes(keyword));
  });
}

function categorySummary(category) {
  const count = data.filter((item) => item.category === category).length;
  const labels = data
    .filter((item) => item.category === category)
    .slice(0, 3)
    .map((item) => item.title)
    .join("、");
  return `${count} 種內容，例如：${labels}`;
}

function renderCategories() {
  categoryCards.innerHTML = "";
  for (const category of categories()) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "category-card";
    button.classList.toggle("is-active", category === selectedCategory);
    button.innerHTML = `<strong>${category}</strong><span>${categorySummary(category)}</span>`;
    button.addEventListener("click", () => {
      selectedCategory = category;
      const first = data.find((item) => item.category === category);
      selectedId = first ? first.id : "";
      renderAll();
    });
    categoryCards.append(button);
  }
}

function renderOptions() {
  const items = itemsForCategory();
  optionCards.innerHTML = "";
  optionHint.textContent = selectedCategory ? `目前顯示 ${items.length} 個可產出內容。` : "請先選擇一個分類。";

  if (!items.some((item) => item.id === selectedId)) {
    selectedId = items[0] ? items[0].id : "";
  }

  for (const item of items) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "option-card";
    button.classList.toggle("is-active", item.id === selectedId);
    const fields = item.fields ? ` · 可替換：${item.fields}` : "";
    button.innerHTML = `<strong>${item.number}. ${item.title}</strong><span>${item.ratio}${item.needsImage ? " · 建議參考圖" : ""}${fields}</span>`;
    button.addEventListener("click", () => {
      selectedId = item.id;
      renderAll();
    });
    optionCards.append(button);
  }
}

function selectedItem() {
  return data.find((item) => item.id === selectedId) || itemsForCategory()[0] || data[0];
}

function renderRatioOptions(item) {
  const current = ratioSelect.value || "沿用建議比例";
  ratioSelect.innerHTML = "";
  for (const ratio of ratioOptions) {
    const option = document.createElement("option");
    option.value = ratio;
    option.textContent = ratio === "沿用建議比例" ? `沿用建議比例：${item.ratio}` : ratio;
    ratioSelect.append(option);
  }
  ratioSelect.value = ratioOptions.includes(current) ? current : "沿用建議比例";
}

function chosenRatio(item) {
  return ratioSelect.value === "沿用建議比例" ? item.ratio : ratioSelect.value;
}

function nonEmpty(label, value) {
  const text = value.trim();
  return text ? `${label}：${text}` : "";
}

function buildPrompt(item) {
  const lines = [];
  lines.push(`請生成圖片：${item.title}`);
  lines.push(`分類：${item.category}`);
  lines.push(`使用平台：${platformSelect.value}`);
  lines.push(`建議比例：${chosenRatio(item)}`);

  const specs = [
    nonEmpty("主題或目的", subjectInput.value),
    nonEmpty("品牌／人物／產品", targetInput.value),
    nonEmpty("畫面文字", copyInput.value),
    nonEmpty("風格偏好", styleInput.value),
    nonEmpty("補充需求", extraInput.value)
  ].filter(Boolean);

  if (item.needsImage || currentImageName) {
    specs.push(`參考圖片：${currentImageName || "請先上傳或準備參考圖片"}`);
  }

  if (specs.length) {
    lines.push("");
    lines.push("我的規格：");
    lines.push(...specs.map((line) => `- ${line}`));
  }

  lines.push("");
  lines.push("基礎提示詞：");
  lines.push(item.prompt);

  if (item.syntaxExample) {
    lines.push("");
    lines.push("整理文件語法示意：");
    lines.push(item.syntaxExample);
  }

  lines.push("");
  lines.push("整合要求：請依照我的規格調整，保留基礎提示詞與語法示意的重點。畫面需高解析度、構圖清楚、文字清晰可讀，避免亂碼、變形、多餘物件與過度裝飾。");
  return lines.join("\n");
}

function renderOutput() {
  const item = selectedItem();
  if (!item) return;

  selectedCategoryText.textContent = item.category;
  outputTitle.textContent = `${item.number}. ${item.title}`;
  ratioBadge.textContent = chosenRatio(item);
  imageBadge.textContent = item.needsImage ? "建議準備參考圖" : "可直接生成";
  imageBadge.classList.toggle("is-warning", item.needsImage);
  imageHelp.textContent = item.needsImage
    ? "這個內容通常需要參考照片。網站只會預覽，不會上傳或儲存圖片。"
    : "可選擇圖片當參考；不選也可以直接複製提示詞。";

  nextSteps.innerHTML = "";
  const steps = item.needsImage
    ? ["準備或上傳參考圖片。", "填寫主題、文字、風格等規格。", `打開 ${platformSelect.value}，先上傳圖片，再貼上提示詞。`, "送出生成後，依結果微調規格。"]
    : ["填寫主題、文字、風格等規格。", `打開 ${platformSelect.value}，貼上提示詞。`, "送出生成後，依結果微調規格。"];
  for (const step of steps) {
    const li = document.createElement("li");
    li.textContent = step;
    nextSteps.append(li);
  }

  outputPrompt.value = buildPrompt(item);
}

function renderAll() {
  const item = selectedItem();
  renderCategories();
  renderOptions();
  if (item) renderRatioOptions(item);
  renderOutput();
}

function handleImageUpload() {
  const file = imageInput.files && imageInput.files[0];
  imagePreview.innerHTML = "";
  if (!file) {
    currentImageName = "";
    imagePreview.innerHTML = "<span>尚未選擇圖片</span>";
    renderOutput();
    return;
  }

  currentImageName = file.name;
  const image = document.createElement("img");
  image.alt = "參考圖片預覽";
  image.src = URL.createObjectURL(file);
  imagePreview.append(image);
  renderOutput();
}

async function copyPrompt() {
  try {
    await navigator.clipboard.writeText(outputPrompt.value);
  } catch {
    outputPrompt.select();
    document.execCommand("copy");
  }
  copyStatus.textContent = "已複製";
  window.setTimeout(() => {
    copyStatus.textContent = "";
  }, 1800);
}

function resetSpecs() {
  subjectInput.value = "";
  targetInput.value = "";
  copyInput.value = "";
  styleInput.value = "";
  extraInput.value = "";
  ratioSelect.value = "沿用建議比例";
  renderOutput();
}

searchInput.addEventListener("input", () => {
  renderOptions();
  renderOutput();
});

for (const input of [subjectInput, targetInput, platformSelect, ratioSelect, copyInput, styleInput, extraInput]) {
  input.addEventListener("input", renderOutput);
  input.addEventListener("change", renderOutput);
}

imageInput.addEventListener("change", handleImageUpload);
copyButton.addEventListener("click", copyPrompt);
resetButton.addEventListener("click", resetSpecs);

selectedCategory = categories()[0] || "";
selectedId = data.find((item) => item.category === selectedCategory)?.id || data[0]?.id || "";
renderAll();
