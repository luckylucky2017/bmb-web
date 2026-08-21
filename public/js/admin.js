document.addEventListener("DOMContentLoaded", () => {
  const sidebarToggle = document.getElementById("sidebar-toggle");
  const sidebar = document.getElementById("admin-sidebar");
  const sidebarBackdrop = document.getElementById("sidebar-backdrop");
  function toggleSidebar() {
    sidebar.classList.toggle("-translate-x-full");
    sidebarBackdrop.classList.toggle("hidden");
  }
  sidebarToggle?.addEventListener("click", toggleSidebar);
  sidebarBackdrop?.addEventListener("click", toggleSidebar);

  document.querySelectorAll("[data-confirm]").forEach((form) => {
    form.addEventListener("submit", (e) => {
      if (!confirm(form.getAttribute("data-confirm"))) e.preventDefault();
    });
  });
});
