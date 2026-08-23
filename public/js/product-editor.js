document.addEventListener("DOMContentLoaded", () => {
  const targetEl = document.getElementById("description-editor");
  if (!targetEl || typeof tinymce === "undefined") return;

  const UPLOAD_URL = "/admin/san-pham/upload-anh";
  const EDITOR_ID = "description-editor";
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

  function syncHiddenInput(editor) {
    document.getElementById("description-input").value = editor.getContent();
  }

  function uploadImage(file) {
    const formData = new FormData();
    formData.append("image", file);
    return fetch(UPLOAD_URL, { method: "POST", body: formData }).then((res) => {
      if (!res.ok) return res.json().then((data) => Promise.reject(data.error || "upload failed"));
      return res.json().then((data) => data.url);
    });
  }

  // Dropping or pasting an image mid-paragraph is meant to illustrate a
  // point inline with the text, not interrupt it — so unlike the toolbar's
  // "Insert Image" dialog (which inserts a plain, full-size image someone
  // can align manually via the picture's own toolbar), these two paths
  // default to a left-floated, text-wrapped image automatically.
  function wrappedImageHtml(url) {
    return `<img src="${url}" style="float:left;max-width:45%;margin:4px 16px 8px 0;" />`;
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
    plugins: "advlist autolink lists link image charmap searchreplace visualblocks code fullscreen media table wordcount quickbars",
    toolbar:
      "undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | " +
      "forecolor backcolor | alignleft aligncenter alignright alignjustify | " +
      "bullist numlist outdent indent | blockquote table link image media | removeformat code | fullscreen",
    block_formats: "Đoạn văn=p; Tiêu đề 1=h1; Tiêu đề 2=h2; Tiêu đề 3=h3; Tiêu đề 4=h4; Trích dẫn=blockquote",
    // Clicking an image or video shows a floating toolbar right there with
    // alignment buttons, for changing the wrap side/removing it afterwards.
    quickbars_image_toolbar: "alignleft aligncenter alignright | imageoptions",
    quickbars_selection_toolbar: "bold italic | quicklink",
    image_advtab: true,
    // Image paste is handled entirely by our own 'paste' listener below
    // (so it can apply the float-wrap default) — turning this off stops
    // TinyMCE's built-in paste handling from racing it and double-inserting.
    paste_data_images: false,
    images_upload_handler: (blobInfo) =>
      uploadImage(blobInfo.blob()).catch(() => Promise.reject("Tải ảnh lên thất bại. Chỉ chấp nhận jpg, png, webp, gif.")),
    setup: (editor) => {
      editor.on("change input undo redo blur", () => syncHiddenInput(editor));

      editor.on("drop", (e) => {
        const files = e.dataTransfer && e.dataTransfer.files;
        const file = files && files[0];
        if (!file || !ALLOWED_TYPES.includes(file.type)) return; // let TinyMCE's default handling deal with non-image drops
        e.preventDefault();
        e.stopImmediatePropagation();

        const pointRange =
          document.caretRangeFromPoint
            ? document.caretRangeFromPoint(e.clientX, e.clientY)
            : document.caretPositionFromPoint
            ? (() => {
                const pos = document.caretPositionFromPoint(e.clientX, e.clientY);
                if (!pos) return null;
                const r = document.createRange();
                r.setStart(pos.offsetNode, pos.offset);
                return r;
              })()
            : null;

        uploadImage(file)
          .then((url) => {
            editor.undoManager.transact(() => {
              if (pointRange) editor.selection.setRng(pointRange);
              editor.selection.setContent(wrappedImageHtml(url));
            });
            syncHiddenInput(editor);
          })
          .catch(() => alert("Tải ảnh lên thất bại. Chỉ chấp nhận jpg, png, webp, gif."));
      });

      editor.on("paste", (e) => {
        const items = e.clipboardData && e.clipboardData.items;
        if (!items) return;
        const imageItem = Array.from(items).find((item) => item.type && ALLOWED_TYPES.includes(item.type));
        if (!imageItem) return; // let TinyMCE handle normal text/HTML paste
        e.preventDefault();
        const file = imageItem.getAsFile();
        if (!file) return;

        uploadImage(file)
          .then((url) => {
            editor.undoManager.transact(() => {
              editor.selection.setContent(wrappedImageHtml(url));
            });
            syncHiddenInput(editor);
          })
          .catch(() => alert("Tải ảnh lên thất bại. Chỉ chấp nhận jpg, png, webp, gif."));
      });
    }
  });

  document.getElementById("product-form")?.addEventListener("submit", () => {
    const editor = tinymce.get(EDITOR_ID);
    if (editor) syncHiddenInput(editor);
  });
});
