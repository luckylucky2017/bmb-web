document.addEventListener("DOMContentLoaded", () => {
  const menuToggle = document.getElementById("menu-toggle");
  const mobileMenu = document.getElementById("mobile-menu");
  const iconOpen = document.getElementById("icon-open");
  const iconClose = document.getElementById("icon-close");
  menuToggle?.addEventListener("click", () => {
    mobileMenu.classList.toggle("hidden");
    iconOpen.classList.toggle("hidden");
    iconClose.classList.toggle("hidden");
  });

  // Call picker: when a trigger has two hotline numbers, ask which one to
  // dial instead of silently calling only the primary number.
  const picker = document.getElementById("call-picker");
  const optionsBox = document.getElementById("call-picker-options");
  const closeBtn = document.getElementById("call-picker-close");

  function buildOption(label, tel) {
    const a = document.createElement("a");
    a.href = `tel:${tel}`;
    a.className =
      "flex items-center gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-brand-300 hover:bg-brand-50";

    const icon = document.createElement("span");
    icon.className = "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600";
    icon.textContent = "📞";

    const textWrap = document.createElement("span");
    textWrap.className = "leading-tight";

    const labelEl = document.createElement("span");
    labelEl.className = "block text-xs text-slate-400";
    labelEl.textContent = label;

    const numberEl = document.createElement("span");
    numberEl.className = "block text-base font-bold text-slate-900";
    numberEl.textContent = tel;

    textWrap.append(labelEl, numberEl);
    a.append(icon, textWrap);
    return a;
  }

  function openPicker(tel, tel2) {
    if (!picker || !optionsBox) return;
    optionsBox.innerHTML = "";
    optionsBox.append(buildOption("Số 1", tel), buildOption("Số 2", tel2));
    picker.classList.remove("hidden");
    picker.classList.add("flex");
  }

  function closePicker() {
    if (!picker) return;
    picker.classList.add("hidden");
    picker.classList.remove("flex");
  }

  document.querySelectorAll(".js-call-trigger").forEach((el) => {
    el.addEventListener("click", () => {
      const tel = el.getAttribute("data-tel") || "";
      const tel2 = el.getAttribute("data-tel2") || "";
      if (tel2) {
        openPicker(tel, tel2);
      } else if (tel) {
        window.location.href = `tel:${tel}`;
      }
    });
  });

  closeBtn?.addEventListener("click", closePicker);
  picker?.addEventListener("click", (e) => {
    if (e.target === picker) closePicker();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closePicker();
  });
});
