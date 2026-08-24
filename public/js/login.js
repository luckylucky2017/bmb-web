document.addEventListener("DOMContentLoaded", () => {
  const refreshBtn = document.getElementById("captcha-refresh");
  const captchaBox = document.getElementById("captcha-box");
  refreshBtn?.addEventListener("click", () => {
    fetch("/admin/captcha-refresh")
      .then((res) => res.text())
      .then((svg) => {
        captchaBox.innerHTML = svg;
      });
  });
});
