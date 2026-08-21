document.addEventListener("DOMContentLoaded", () => {
  const editorEl = document.getElementById("editor");
  if (!editorEl || typeof Quill === "undefined") return;

  const quill = new Quill("#editor", {
    theme: "snow",
    modules: { toolbar: "#editor-toolbar" },
    placeholder: "Nội dung bài viết..."
  });
  const contentInput = document.getElementById("content-input");
  if (contentInput.value) {
    quill.root.innerHTML = contentInput.value;
  }
  quill.on("text-change", () => {
    contentInput.value = quill.root.innerHTML;
  });
  document.getElementById("post-form")?.addEventListener("submit", () => {
    contentInput.value = quill.root.innerHTML;
  });
});
