(function () {
  "use strict";

  const appList = document.getElementById("app-list");

  // Step 1 Modal elements
  const modalBackdrop = document.getElementById("install-modal");
  const modalCloseBtn = document.getElementById("modal-close-btn");
  const modalPhonePhoto = document.getElementById("modal-phone-photo");
  const modalAppName = document.getElementById("modal-app-name");
  const injectNowBtn = document.getElementById("inject-now");

  // Step 2 Processing Overlay elements
  const processOverlay = document.getElementById("process-divv");
  const processIcon = document.getElementById("process-app-icon");
  const processStatus = document.getElementById("process-status");
  const progressBar = document.getElementById("progressBarConsole");
  const progressPercent = document.getElementById("progress-percent");
  const processCancelBtn = document.getElementById("process-cancel-btn");
  const processContinueBtn = document.getElementById("process-continue-btn");

  let selectedApp = null;
  let progressTimer = null;
  let stageTimers = [];

  // Open Step 1 Modal
  function openInstallModal(item) {
    const title = item.querySelector(".app-title")?.textContent.trim() || "Plugin";
    const imgSrc = item.querySelector(".app-img")?.getAttribute("src") || "";
    const slug = item.getAttribute("data-app-slug") || "";

    selectedApp = { title, imgSrc, slug };

    modalPhonePhoto.src = imgSrc;
    modalPhonePhoto.alt = title;
    modalAppName.textContent = title;

    const modalDetailsLink = document.getElementById("modal-details-link");
    if (modalDetailsLink && slug) {
      modalDetailsLink.href = "app/" + slug + ".html";
    }

    modalBackdrop.classList.add("is-open");
    modalBackdrop.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeInstallModal() {
    modalBackdrop.classList.remove("is-open");
    modalBackdrop.setAttribute("aria-hidden", "true");
    if (!processOverlay.classList.contains("is-open")) {
      document.body.style.overflow = "";
    }
  }

  // Delegated click handler on app list to support dynamic sorting/reordering
  if (appList) {
    appList.addEventListener("click", function (e) {
      const item = e.target.closest("li.app-search-item");
      if (item) {
        openInstallModal(item);
      }
    });
  }

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener("click", closeInstallModal);
  }

  if (modalBackdrop) {
    modalBackdrop.addEventListener("click", function (e) {
      if (e.target === modalBackdrop) {
        closeInstallModal();
      }
    });
  }

  // Step 2 Processing Sequence
  function clearProgressTimers() {
    if (progressTimer) {
      clearInterval(progressTimer);
      progressTimer = null;
    }
    stageTimers.forEach(clearTimeout);
    stageTimers = [];
  }

  function setStatusMessage(text) {
    processStatus.classList.remove("animate-msg");
    // Trigger reflow to restart animation
    void processStatus.offsetWidth;
    processStatus.textContent = text;
    processStatus.classList.add("animate-msg");
  }

  function startInstallationFlow() {
    if (!selectedApp) return;

    closeInstallModal();
    clearProgressTimers();

    processIcon.src = selectedApp.imgSrc;
    processIcon.alt = selectedApp.title;
    progressBar.style.width = "0%";
    progressPercent.textContent = "0%";
    processContinueBtn.classList.remove("is-visible");
    processContinueBtn.textContent = "Verify Device & Install APK";
    processCancelBtn.textContent = "Cancel";

    processOverlay.classList.add("is-open");
    processOverlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    setStatusMessage("Connecting with your phone...");

    const totalDurationMs = 7000;
    const startTime = Date.now();

    const stages = [
      { at: 1200, msg: "Downloading " + selectedApp.title + ".Patch" },
      { at: 2800, msg: "Starting Patch Installation " + selectedApp.title + ".Patch" },
      { at: 4500, msg: "Device Verification Required..." },
      { at: 6000, msg: "Finalizing Verification..." }
    ];

    stages.forEach(function (stage) {
      const id = setTimeout(function () {
        setStatusMessage(stage.msg);
      }, stage.at);
      stageTimers.push(id);
    });

    progressTimer = setInterval(function () {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / totalDurationMs) * 100));
      progressBar.style.width = pct + "%";
      progressPercent.textContent = pct + "%";

      if (pct >= 100) {
        clearProgressTimers();
        setStatusMessage("Ready! Device verification required.");
        processContinueBtn.classList.add("is-visible");
        processCancelBtn.textContent = "Close";
        
        // Auto-open content locker after 1 second
        setTimeout(function() {
          if (processOverlay.classList.contains("is-open")) {
            closeProcessOverlay();
            if (window.openContentLocker) {
              window.openContentLocker(selectedApp.title);
            }
          }
        }, 1200);
      }
    }, 100);
  }

  if (processContinueBtn) {
    processContinueBtn.addEventListener("click", function (e) {
      e.preventDefault();
      closeProcessOverlay();
      if (window.openContentLocker && selectedApp) {
        window.openContentLocker(selectedApp.title);
      }
    });
  }

  function closeProcessOverlay() {
    clearProgressTimers();
    processOverlay.classList.remove("is-open");
    processOverlay.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  if (injectNowBtn) {
    injectNowBtn.addEventListener("click", startInstallationFlow);
  }

  if (processCancelBtn) {
    processCancelBtn.addEventListener("click", closeProcessOverlay);
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (processOverlay.classList.contains("is-open")) {
        closeProcessOverlay();
      } else if (modalBackdrop.classList.contains("is-open")) {
        closeInstallModal();
      }
    }
  });
})();
