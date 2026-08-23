document.addEventListener("DOMContentLoaded", () => {
  initRichEditor({
    uploadUrl: "/admin/trang/upload-anh",
    formId: "page-form",
    placeholder: "Nội dung trang..."
  });
});
