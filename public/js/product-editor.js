document.addEventListener("DOMContentLoaded", () => {
  const editorEl = document.getElementById("description-editor");
  if (!editorEl || typeof Quill === "undefined") return;

  const UPLOAD_URL = "/admin/san-pham/upload-anh";
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

  const quill = new Quill("#description-editor", {
    theme: "snow",
    modules: { toolbar: "#description-toolbar" },
    placeholder: "Mô tả chi tiết sản phẩm..."
  });

  const contentInput = document.getElementById("description-input");
  if (contentInput.value) {
    quill.root.innerHTML = contentInput.value;
  }
  quill.on("text-change", () => {
    contentInput.value = quill.root.innerHTML;
  });
  document.getElementById("product-form")?.addEventListener("submit", () => {
    contentInput.value = quill.root.innerHTML;
  });

  async function uploadImage(file) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      alert("Chỉ chấp nhận ảnh jpg, png, webp hoặc gif.");
      return null;
    }
    const formData = new FormData();
    formData.append("image", file);
    const res = await fetch(UPLOAD_URL, { method: "POST", body: formData });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Tải ảnh lên thất bại.");
      return null;
    }
    const data = await res.json();
    return data.url;
  }

  async function insertImageAtCursor(file) {
    const range = quill.getSelection(true);
    const placeholderIndex = range ? range.index : quill.getLength();
    const url = await uploadImage(file);
    if (url) {
      quill.insertEmbed(placeholderIndex, "image", url, "user");
      quill.setSelection(placeholderIndex + 1, 0);
    }
  }

  // Toolbar image button: opens a file picker and uploads the chosen image.
  quill.getModule("toolbar").addHandler("image", () => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", ALLOWED_TYPES.join(","));
    input.addEventListener("change", () => {
      const file = input.files[0];
      if (file) insertImageAtCursor(file);
    });
    input.click();
  });

  // Paste an image directly (e.g. Ctrl+V a screenshot) instead of embedding it as base64.
  quill.root.addEventListener("paste", (e) => {
    const items = e.clipboardData && e.clipboardData.items;
    if (!items) return;
    for (const item of items) {
      if (item.type && item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) insertImageAtCursor(file);
        return;
      }
    }
  });

  // Drag-and-drop an image file into the editor.
  quill.root.addEventListener("drop", (e) => {
    const files = e.dataTransfer && e.dataTransfer.files;
    if (!files || !files.length) return;
    const file = files[0];
    if (file.type && file.type.startsWith("image/")) {
      e.preventDefault();
      insertImageAtCursor(file);
    }
  });
});
