(function () {
  const body = document.body;
  const html = document.documentElement;
  const langSwitch = document.getElementById("lang-switch");
  const menuToggle = document.getElementById("menu-toggle");
  const navPanel = document.getElementById("nav-panel");
  const navGroups = Array.from(document.querySelectorAll(".nav-group"));
  const consultLinks = Array.from(document.querySelectorAll(".js-consult-link"));
  const revealItems = Array.from(document.querySelectorAll(".reveal"));
  const inquiryForms = Array.from(document.querySelectorAll(".js-inquiry-form"));
  const baguaModules = Array.from(document.querySelectorAll(".js-bagua"));
  const titleText = {
    zh: body.dataset.titleZh || document.title,
    en: body.dataset.titleEn || document.title,
  };
  const fieldPlaceholders = {
    email: {
      zh: "请输入邮箱地址",
      en: "Email address",
    },
    message: {
      zh: "请简要说明合作、活动或咨询需求",
      en: "Briefly describe your collaboration, event, or advisory needs",
    },
    name: {
      zh: "请输入姓名",
      en: "Your name",
    },
    organization: {
      zh: "请输入机构或公司名称",
      en: "Institution or organization",
    },
    phone: {
      zh: "可填写电话或微信",
      en: "Phone or WeChat",
    },
    subject: {
      zh: "请填写项目主题",
      en: "Project subject",
    },
    timeline: {
      zh: "例如：4月中旬前需要方案",
      en: "Example: proposal needed before mid-April",
    },
  };
  const topicLabels = {
    zh: [
      "学术合作",
      "活动与讲座",
      "出版栏目",
      "Fellowship 计划",
      "咨询服务",
    ],
    en: [
      "Academic Collaboration",
      "Events and Lectures",
      "Publications",
      "Fellowship",
      "Consulting",
    ],
  };
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
      zh: "表单已保存到服务器，但邮件投递暂未完成。请优先直接联系 htxia0413@gmail.com。",
      en: "Your inquiry was saved on the server, but email delivery did not complete. Please contact htxia0413@gmail.com directly.",
    },
    success: {
      zh: "提交成功，咨询内容已发送到 htxia0413@gmail.com。",
      en: "Your inquiry has been sent to htxia0413@gmail.com.",
    },
  };

  function updatePlaceholders(lang) {
    Object.entries(fieldPlaceholders).forEach(([name, copy]) => {
      document.querySelectorAll(`[name="${name}"]`).forEach((field) => {
        field.placeholder = copy[lang];
      });
    });
  }

  function updateTopicText(lang) {
    document.querySelectorAll('select[name="topic"]').forEach((select) => {
      Array.from(select.options).forEach((option, index) => {
        if (topicLabels[lang][index]) {
          option.textContent = topicLabels[lang][index];
        }
      });
    });
  }

  function setLanguage(lang) {
    body.dataset.lang = lang;
    html.lang = lang === "zh" ? "zh-CN" : "en";
    document.title = titleText[lang];
    updatePlaceholders(lang);
    updateTopicText(lang);

    consultLinks.forEach((link) => {
      link.href =
        lang === "zh"
          ? "../consult/zh/index.html"
          : "../consult/en/index.html";
    });

    if (langSwitch) {
      langSwitch.textContent = lang === "zh" ? "EN" : "中文";
      langSwitch.setAttribute(
        "aria-label",
        lang === "zh" ? "Switch to English" : "切换到中文",
      );
    }

    try {
      localStorage.setItem("center-language", lang);
    } catch (error) {
      // Ignore storage failures.
    }
  }

  if (langSwitch) {
    langSwitch.addEventListener("click", () => {
      const nextLang = body.dataset.lang === "zh" ? "en" : "zh";
      setLanguage(nextLang);
    });
  }

  if (menuToggle && navPanel) {
    function closeNavGroups() {
      navGroups.forEach((group) => {
        group.classList.remove("open");
        const toggle = group.querySelector("[data-nav-toggle]");
        if (toggle) {
          toggle.setAttribute("aria-expanded", "false");
        }
      });
    }

    menuToggle.addEventListener("click", () => {
      closeNavGroups();
      const isOpen = navPanel.classList.toggle("open");
      menuToggle.setAttribute("aria-expanded", String(isOpen));
    });

    navGroups.forEach((group) => {
      const toggle = group.querySelector("[data-nav-toggle]");

      if (!toggle) {
        return;
      }

      toggle.addEventListener("click", (event) => {
        event.preventDefault();

        const willOpen = !group.classList.contains("open");
        closeNavGroups();
        group.classList.toggle("open", willOpen);
        toggle.setAttribute("aria-expanded", String(willOpen));
      });
    });

    Array.from(
      document.querySelectorAll(
        ".nav-links a, .footer-nav a, .footer-links a, .nav-cta",
      ),
    ).forEach((link) => {
      link.addEventListener("click", () => {
        closeNavGroups();
        navPanel.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
      });
    });

    document.addEventListener("click", (event) => {
      if (!navPanel.contains(event.target) && event.target !== menuToggle) {
        closeNavGroups();
        navPanel.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 860) {
        closeNavGroups();
        navPanel.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  baguaModules.forEach((module) => {
    const inputs = Array.from(module.querySelectorAll("[data-bagua-input]"));
    const triggers = Array.from(
      module.querySelectorAll("[data-bagua-trigger]"),
    );
    const panels = Array.from(module.querySelectorAll("[data-bagua-panel]"));
    const detailPanel = module.querySelector(".bagua-detail");
    const defaultKey =
      module.dataset.baguaDefault || triggers[0]?.dataset.baguaTrigger;

    if (!triggers.length || !panels.length || !defaultKey) {
      return;
    }

    function activateBagua(key, options = {}) {
      const shouldScroll = Boolean(options.scrollToPanel);
      const matchedInput = inputs.find((input) => input.dataset.baguaInput === key);

      if (matchedInput) {
        matchedInput.checked = true;
      }

      triggers.forEach((trigger) => {
        const isActive = trigger.dataset.baguaTrigger === key;
        trigger.classList.toggle("is-active", isActive);
        trigger.setAttribute("aria-pressed", String(isActive));
      });

      panels.forEach((panel) => {
        const isActive = panel.dataset.baguaPanel === key;
        panel.classList.toggle("is-active", isActive);
      });

      if (
        shouldScroll &&
        detailPanel &&
        window.matchMedia("(max-width: 760px)").matches
      ) {
        window.requestAnimationFrame(() => {
          detailPanel.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        });
      }
    }

    triggers.forEach((trigger) => {
      trigger.addEventListener("mouseenter", () => {
        activateBagua(trigger.dataset.baguaTrigger);
      });

      trigger.addEventListener("focus", () => {
        activateBagua(trigger.dataset.baguaTrigger);
      });

      trigger.addEventListener("click", (event) => {
        event.preventDefault();
        activateBagua(trigger.dataset.baguaTrigger, {
          scrollToPanel: true,
        });
      });

      trigger.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          activateBagua(trigger.dataset.baguaTrigger, {
            scrollToPanel: true,
          });
        }
      });
    });

    inputs.forEach((input) => {
      input.addEventListener("change", () => {
        activateBagua(input.dataset.baguaInput);
      });
    });

    activateBagua(defaultKey);
  });

  inquiryForms.forEach((form) => {
    const statusEl = form.querySelector(".form-status");
    const submitButton = form.querySelector('button[type="submit"]');

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const lang = body.dataset.lang || "zh";
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
          body: JSON.stringify(payload),
          headers: {
            "Content-Type": "application/json",
          },
          method: "POST",
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
        updatePlaceholders(lang);
        updateTopicText(lang);
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

  if (revealItems.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      { threshold: 0.12 },
    );

    revealItems.forEach((item) => observer.observe(item));
  }

  let initialLang = null;

  try {
    initialLang = localStorage.getItem("center-language");
  } catch (error) {
    initialLang = null;
  }

  if (!initialLang) {
    initialLang = /^zh/i.test(navigator.language) ? "zh" : "en";
  }

  setLanguage(initialLang);
})();
