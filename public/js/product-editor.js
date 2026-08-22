document.addEventListener("DOMContentLoaded", () => {
  const targetEl = document.getElementById("description-editor");
  if (!targetEl || typeof tinymce === "undefined") return;

  const UPLOAD_URL = "/admin/san-pham/upload-anh";
  const EDITOR_ID = "description-editor";

  function syncHiddenInput(editor) {
    document.getElementById("description-input").value = editor.getContent();
  }

  tinymce.init({
    selector: "#" + EDITOR_ID,
    inline: true,
    fixed_toolbar_container_target: document.getElementById("description-toolbar-mount"),
    toolbar_location: "top",
    toolbar_sticky: false,
    toolbar_mode: "wrap",
    entity_encoding: "raw",
    convert_urls: false,
    menubar: false,
    statusbar: false,
    branding: false,
    placeholder: "Mô tả chi tiết sản phẩm...",
    plugins: "advlist autolink lists link image charmap searchreplace visualblocks code fullscreen media table wordcount",
    toolbar:
      "undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | " +
      "forecolor backcolor | alignleft aligncenter alignright alignjustify | " +
      "bullist numlist outdent indent | blockquote table link image media | removeformat code | fullscreen",
    block_formats: "Đoạn văn=p; Tiêu đề 1=h1; Tiêu đề 2=h2; Tiêu đề 3=h3; Tiêu đề 4=h4; Trích dẫn=blockquote",
    paste_data_images: true,
    automatic_uploads: true,
    images_upload_handler: (blobInfo) =>
      new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append("image", blobInfo.blob(), blobInfo.filename());
        fetch(UPLOAD_URL, { method: "POST", body: formData })
          .then((res) => {
            if (!res.ok) return res.json().then((data) => Promise.reject(data.error || "upload failed"));
            return res.json();
          })
          .then((data) => resolve(data.url))
          .catch(() => reject("Tải ảnh lên thất bại. Chỉ chấp nhận jpg, png, webp, gif."));
      }),
    setup: (editor) => {
      editor.on("change input undo redo blur", () => syncHiddenInput(editor));
    }
  });

  document.getElementById("product-form")?.addEventListener("submit", () => {
    const editor = tinymce.get(EDITOR_ID);
    if (editor) syncHiddenInput(editor);
  });
});
