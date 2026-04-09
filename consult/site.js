(function () {
  const body = document.body;
  const menuToggle = document.getElementById("menu-toggle");
  const navPanel = document.getElementById("nav-panel");
  const inquiryForms = Array.from(document.querySelectorAll(".js-inquiry-form"));
  const lang = body.dataset.lang || "en";
  const formMessages = {
    invalid: {
      zh: "请至少填写姓名、邮箱和留言内容。",
      en: "Please provide your name, email address, and message.",
    },
    network: {
      zh: "提交失败。请稍后再试，或直接邮件联系 htxia0413@gmail.com。",
      en: "Submission failed. Please try again later or email htxia0413@gmail.com directly.",
    },
    sending: {
      zh: "正在发送咨询内容...",
      en: "Sending your inquiry...",
    },
    storedOnly: {
      zh: "表单已保存，但邮件投递暂未完成。请优先直接联系 htxia0413@gmail.com。",
      en: "Your inquiry was saved, but email delivery did not complete. Please contact htxia0413@gmail.com directly.",
    },
    success: {
      zh: "提交成功，咨询内容已发送到 htxia0413@gmail.com。",
      en: "Your inquiry has been sent to htxia0413@gmail.com.",
    },
  };

  if (menuToggle && navPanel) {
    menuToggle.addEventListener("click", () => {
      const isOpen = navPanel.classList.toggle("open");
      menuToggle.setAttribute("aria-expanded", String(isOpen));
    });

    Array.from(document.querySelectorAll(".nav-links a, .footer-links a")).forEach(
      (link) => {
        link.addEventListener("click", () => {
          navPanel.classList.remove("open");
          menuToggle.setAttribute("aria-expanded", "false");
        });
      },
    );

    document.addEventListener("click", (event) => {
      if (!navPanel.contains(event.target) && event.target !== menuToggle) {
        navPanel.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  inquiryForms.forEach((form) => {
    const statusEl = form.querySelector(".form-status");
    const submitButton = form.querySelector('button[type="submit"]');

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const formData = new FormData(form);
      const payload = Object.fromEntries(formData.entries());
      payload.lang = lang;
      payload.page = form.dataset.page || window.location.pathname;

      if (!payload.name || !payload.email || !payload.message) {
        if (statusEl) {
          statusEl.textContent = formMessages.invalid[lang];
        }
        return;
      }

      if (statusEl) {
        statusEl.textContent = formMessages.sending[lang];
      }

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.setAttribute("aria-busy", "true");
      }

      try {
        const response = await fetch("/api/inquiry", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        const result = await response.json().catch(() => ({}));

        if (!response.ok || !result.ok) {
          throw new Error(result.error || "request_failed");
        }

        if (statusEl) {
          statusEl.textContent = result.delivered
            ? formMessages.success[lang]
            : formMessages.storedOnly[lang];
        }

        form.reset();
      } catch (error) {
        if (statusEl) {
          statusEl.textContent = formMessages.network[lang];
        }
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.removeAttribute("aria-busy");
        }
      }
    });
  });
})();
