(function () {
  const body = document.body;
  const menuToggle = document.getElementById("menu-toggle");
  const navPanel = document.getElementById("nav-panel");
  const inquiryForms = Array.from(document.querySelectorAll(".js-inquiry-form"));
  const lang = body.dataset.lang || "en";
  const topicLabels = {
    zh: {
      consulting: "综合咨询",
      health: "健康",
      education: "教育",
      relationship: "关系",
      law: "法律文化",
    },
    en: {
      consulting: "General Consulting",
      health: "Health",
      education: "Education",
      relationship: "Relationship",
      law: "Law / Mediation Culture",
    },
  };
  const formMessages = {
    invalid: {
      zh: "请至少填写姓名、邮箱和留言内容。",
      en: "Please provide your name, email address, and message.",
    },
    preparing: {
      zh: "正在准备邮件草稿...",
      en: "Preparing your email draft...",
    },
    ready: {
      zh: "已为你生成邮件草稿。请在邮件客户端中附加 PDF、DOC、DOCX 或其他项目文件后发送至 ",
      en: "A draft email has been prepared. You can attach PDF, DOC, DOCX, or other project files in your mail client before sending to ",
    },
    fallback: {
      zh: "如果未自动打开邮件客户端，请直接写信至 ",
      en: "If your email client did not open automatically, send your message directly to ",
    },
  };

  function buildMailDraft(payload, currentLang, recipient) {
    const topicLabel =
      topicLabels[currentLang][payload.topic] ||
      (currentLang === "zh" ? "综合咨询" : "General Consulting");
    const subject =
      currentLang === "zh"
        ? `商业咨询｜${topicLabel}｜${payload.name}`
        : `Consultation Inquiry | ${topicLabel} | ${payload.name}`;
    const lines =
      currentLang === "zh"
        ? [
            "您好，",
            "",
            "以下是通过商业站整理的咨询信息：",
            "",
            `姓名：${payload.name}`,
            `邮箱：${payload.email}`,
            `机构 / 公司：${payload.organization || "-"}`,
            `咨询板块：${topicLabel}`,
            `来源页面：${payload.page || window.location.pathname}`,
            "",
            "留言内容：",
            payload.message,
            "",
            "如有方案、简报、合同、日程或其他材料，我会在此邮件中附加 PDF、DOC、DOCX 等文件。",
          ]
        : [
            "Hello,",
            "",
            "The following consultation request was prepared from the business site:",
            "",
            `Name: ${payload.name}`,
            `Email: ${payload.email}`,
            `Institution / Organization: ${payload.organization || "-"}`,
            `Consulting Area: ${topicLabel}`,
            `Source Page: ${payload.page || window.location.pathname}`,
            "",
            "Message:",
            payload.message,
            "",
            "I may attach project briefs, schedules, agreements, or other supporting documents in PDF, DOC, or DOCX format to this email.",
          ];

    return `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
  }

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

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const formData = new FormData(form);
      const payload = Object.fromEntries(formData.entries());
      payload.lang = lang;
      payload.page = form.dataset.page || window.location.pathname;
      const recipient = form.dataset.recipient || "consult@ichingciv.com";

      if (!payload.name || !payload.email || !payload.message) {
        if (statusEl) {
          statusEl.textContent = formMessages.invalid[lang];
        }
        return;
      }

      if (statusEl) {
        statusEl.textContent = formMessages.preparing[lang];
      }

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.setAttribute("aria-busy", "true");
      }

      const mailtoUrl = buildMailDraft(payload, lang, recipient);
      window.location.href = mailtoUrl;

      if (statusEl) {
        statusEl.textContent =
          formMessages.ready[lang] +
          recipient +
          " " +
          formMessages.fallback[lang] +
          recipient +
          (lang === "zh" ? "。" : ".");
      }

      form.reset();

      if (submitButton) {
        submitButton.disabled = false;
        submitButton.removeAttribute("aria-busy");
      }
    });
  });
})();
