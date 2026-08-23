document.addEventListener("DOMContentLoaded", () => {
  initRichEditor({
    uploadUrl: "/admin/san-pham/upload-anh",
    formId: "product-form",
    placeholder: "Mô tả chi tiết sản phẩm..."
  });
});
