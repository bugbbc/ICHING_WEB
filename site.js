(function () {
  const body = document.body;
  const html = document.documentElement;
  const langSwitch = document.getElementById("lang-switch");
  const menuToggle = document.getElementById("menu-toggle");
  const navPanel = document.getElementById("nav-panel");
  const navGroups = Array.from(document.querySelectorAll(".nav-group"));
  const consultLinks = Array.from(document.querySelectorAll(".js-consult-link"));
  const pageLinks = Array.from(document.querySelectorAll("a[href]"));
  const revealItems = Array.from(document.querySelectorAll(".reveal"));
  const inquiryForms = Array.from(document.querySelectorAll(".js-inquiry-form"));
  const baguaModules = Array.from(document.querySelectorAll(".js-bagua"));
  const CONSULT_URLS = {
    zh: "https://ichingciv.com/zh/index.html",
    en: "https://ichingciv.com/en/index.html",
  };
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
  const topicLookup = {
    zh: {
      research: "学术合作",
      event: "活动与讲座",
      publication: "出版栏目",
      fellowship: "Fellowship 计划",
      consulting: "咨询服务",
    },
    en: {
      research: "Academic Collaboration",
      event: "Events and Lectures",
      publication: "Publications",
      fellowship: "Fellowship",
      consulting: "Consulting",
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
      zh: "已为你生成邮件草稿。请在邮件客户端中附加 PDF、DOC、DOCX 等文件后发送至 ",
      en: "A draft email has been prepared. You can attach PDF, DOC, or DOCX files in your mail client before sending to ",
    },
    fallback: {
      zh: "如果未自动打开邮件客户端，请直接写信至 ",
      en: "If your email client did not open automatically, send your message directly to ",
    },
  };

  function buildMailDraft(payload, lang, recipient) {
    const topic = payload.topic || "";
    const topicLabel =
      topicLookup[lang][topic] ||
      payload.topic ||
      (lang === "zh" ? "学术联系" : "Academic Contact");
    const subject =
      lang === "zh"
        ? `学术来信｜${topicLabel}｜${payload.name}`
        : `Academic Inquiry | ${topicLabel} | ${payload.name}`;
    const lines =
      lang === "zh"
        ? [
            "您好，",
            "",
            "以下是通过网站整理的联系信息：",
            "",
            `姓名：${payload.name}`,
            `邮箱：${payload.email}`,
            `机构 / 公司：${payload.organization || "-"}`,
            `联系主题：${topicLabel}`,
            `来源页面：${payload.page || window.location.pathname}`,
            "",
            "留言内容：",
            payload.message,
            "",
            "如有论文、邀请函、项目说明或其他材料，我会在此邮件中附加 PDF、DOC、DOCX 等文件。",
          ]
        : [
            "Hello,",
            "",
            "The following message was prepared from the website:",
            "",
            `Name: ${payload.name}`,
            `Email: ${payload.email}`,
            `Institution / Organization: ${payload.organization || "-"}`,
            `Inquiry Type: ${topicLabel}`,
            `Source Page: ${payload.page || window.location.pathname}`,
            "",
            "Message:",
            payload.message,
            "",
            "I may attach manuscript files, invitations, project briefs, or other supporting documents in PDF, DOC, or DOCX format to this email.",
          ];

    return `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
  }

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

  function updateLanguageParamInUrl(lang) {
    const url = new URL(window.location.href);
    if (lang === "zh") {
      url.searchParams.set("lang", "zh");
    } else {
      url.searchParams.delete("lang");
    }
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  }

  function isInternalPageLink(link) {
    const rawHref = link.getAttribute("href");
    if (
      !rawHref ||
      rawHref.startsWith("#") ||
      rawHref.startsWith("mailto:") ||
      rawHref.startsWith("tel:")
    ) {
      return false;
    }

    const url = new URL(rawHref, window.location.href);
    if (url.origin !== window.location.origin) {
      return false;
    }

    return url.pathname.endsWith(".html") || url.pathname === "/";
  }

  function updateInternalPageLinks(lang) {
    pageLinks.forEach((link) => {
      if (!isInternalPageLink(link)) {
        return;
      }

      const url = new URL(link.getAttribute("href"), window.location.href);
      if (lang === "zh") {
        url.searchParams.set("lang", "zh");
      } else {
        url.searchParams.delete("lang");
      }

      link.setAttribute("href", `${url.pathname}${url.search}${url.hash}`);
    });
  }

  function setLanguage(lang) {
    body.dataset.lang = lang;
    html.lang = lang === "zh" ? "zh-CN" : "en";
    document.title = titleText[lang];
    updatePlaceholders(lang);
    updateTopicText(lang);

    consultLinks.forEach((link) => {
      link.href = lang === "zh" ? CONSULT_URLS.zh : CONSULT_URLS.en;
    });

    updateLanguageParamInUrl(lang);
    updateInternalPageLinks(lang);

    if (langSwitch) {
      langSwitch.textContent = lang === "zh" ? "EN" : "中文";
      langSwitch.setAttribute(
        "aria-label",
        lang === "zh" ? "Switch to English" : "切换到中文",
      );
    }
  }

  function getInitialLanguage() {
    const url = new URL(window.location.href);
    const langParam = url.searchParams.get("lang");
    if (langParam === "zh" || langParam === "en") {
      return langParam;
    }

    return "en";
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

  function renderFuxiExplorer() {
    const mount = document.querySelector(".js-fuxi-explorer");
    const detail = document.querySelector("[data-fuxi-detail]");
    if (!mount) {
      return;
    }

    mount.innerHTML = "";

    if (!window.d3) {
      mount.innerHTML =
        '<p class="explorer-empty">Explorer dependency is unavailable.</p>';
      return;
    }

    const d3 = window.d3;
    const detailName = detail?.querySelector("[data-fuxi-name]");
    const detailCopy = detail?.querySelector("[data-fuxi-copy]");
    const detailStructure = detail?.querySelector("[data-fuxi-structure]");
    const detailBits = detail?.querySelector("[data-fuxi-bits]");

    const trigrams = [
      { bits: "000", key: "kun", zh: "坤", en: "Kun", imageZh: "地", imageEn: "Earth" },
      { bits: "001", key: "zhen", zh: "震", en: "Zhen", imageZh: "雷", imageEn: "Thunder" },
      { bits: "010", key: "kan", zh: "坎", en: "Kan", imageZh: "水", imageEn: "Water" },
      { bits: "011", key: "dui", zh: "兑", en: "Dui", imageZh: "泽", imageEn: "Lake" },
      { bits: "100", key: "gen", zh: "艮", en: "Gen", imageZh: "山", imageEn: "Mountain" },
      { bits: "101", key: "li", zh: "离", en: "Li", imageZh: "火", imageEn: "Fire" },
      { bits: "110", key: "xun", zh: "巽", en: "Xun", imageZh: "风", imageEn: "Wind" },
      { bits: "111", key: "qian", zh: "乾", en: "Qian", imageZh: "天", imageEn: "Heaven" },
    ];

    const hexNameByPair = {
      "qian-qian": "乾",
      "qian-xun": "小畜",
      "qian-li": "同人",
      "qian-gen": "大畜",
      "qian-dui": "履",
      "qian-kan": "需",
      "qian-zhen": "大壮",
      "qian-kun": "泰",
      "xun-qian": "姤",
      "xun-xun": "巽",
      "xun-li": "家人",
      "xun-gen": "渐",
      "xun-dui": "中孚",
      "xun-kan": "涣",
      "xun-zhen": "益",
      "xun-kun": "观",
      "li-qian": "大有",
      "li-xun": "鼎",
      "li-li": "离",
      "li-gen": "旅",
      "li-dui": "睽",
      "li-kan": "未济",
      "li-zhen": "丰",
      "li-kun": "晋",
      "gen-qian": "遯",
      "gen-xun": "蛊",
      "gen-li": "贲",
      "gen-gen": "艮",
      "gen-dui": "咸",
      "gen-kan": "蒙",
      "gen-zhen": "小过",
      "gen-kun": "谦",
      "dui-qian": "夬",
      "dui-xun": "大过",
      "dui-li": "革",
      "dui-gen": "损",
      "dui-dui": "兑",
      "dui-kan": "节",
      "dui-zhen": "归妹",
      "dui-kun": "临",
      "kan-qian": "讼",
      "kan-xun": "井",
      "kan-li": "既济",
      "kan-gen": "蹇",
      "kan-dui": "困",
      "kan-kan": "坎",
      "kan-zhen": "解",
      "kan-kun": "师",
      "zhen-qian": "无妄",
      "zhen-xun": "恒",
      "zhen-li": "噬嗑",
      "zhen-gen": "颐",
      "zhen-dui": "随",
      "zhen-kan": "屯",
      "zhen-zhen": "震",
      "zhen-kun": "豫",
      "kun-qian": "否",
      "kun-xun": "升",
      "kun-li": "明夷",
      "kun-gen": "剥",
      "kun-dui": "萃",
      "kun-kan": "比",
      "kun-zhen": "复",
      "kun-kun": "坤",
    };

    const hexagrams = d3.range(64).map((decimal) => {
      const bits = decimal.toString(2).padStart(6, "0");
      const upperBits = bits.slice(0, 3);
      const lowerBits = bits.slice(3);
      const upper = trigrams[parseInt(upperBits, 2)];
      const lower = trigrams[parseInt(lowerBits, 2)];
      const pairKey = `${upper.key}-${lower.key}`;
      const nameZh = hexNameByPair[pairKey] || `卦${decimal}`;

      return {
        decimal,
        bits,
        upper,
        lower,
        nameZh,
        nameEn: `${upper.en} over ${lower.en}`,
      };
    });

    const byDecimal = new Map(hexagrams.map((item) => [item.decimal, item]));

    const width = 1120;
    const height = 1120;
    const center = width / 2;
    const squareSize = 430;
    const squareX = center - squareSize / 2;
    const squareY = center - squareSize / 2;
    const cellSize = squareSize / 8;
    const circleRadius = 470;
    const labelRadius = 534;

    const svg = d3
      .select(mount)
      .append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("role", "img")
      .attr("aria-label", "Fu Xi 64-hexagram square-round explorer");

    svg
      .append("circle")
      .attr("class", "fuxi-frame-circle")
      .attr("cx", center)
      .attr("cy", center)
      .attr("r", circleRadius + 18);

    svg
      .append("circle")
      .attr("class", "fuxi-frame-inner")
      .attr("cx", center)
      .attr("cy", center)
      .attr("r", 330);

    svg
      .append("rect")
      .attr("class", "fuxi-square-frame")
      .attr("x", squareX)
      .attr("y", squareY)
      .attr("width", squareSize)
      .attr("height", squareSize)
      .attr("rx", 14)
      .attr("ry", 14);

    const taiji = svg.append("g").attr("transform", `translate(${center},${center})`);
    taiji.append("circle").attr("r", 96).attr("fill", "#fffaf2").attr("stroke", "rgba(18,38,58,0.22)");
    taiji
      .append("path")
      .attr(
        "d",
        "M 0 -96 A 48 48 0 0 1 0 0 A 48 48 0 0 0 0 96 A 96 96 0 0 1 0 -96",
      )
      .attr("fill", "#11283d");
    taiji.append("circle").attr("cx", 0).attr("cy", -48).attr("r", 12).attr("fill", "#fffaf2");
    taiji.append("circle").attr("cx", 0).attr("cy", 48).attr("r", 12).attr("fill", "#11283d");

    function drawHexLines(node, bits, options) {
      const {
        startX,
        startY,
        lineWidth,
        lineGap,
        lineSpacing,
      } = options;

      bits.split("").forEach((bit, index) => {
        const y = startY + index * lineSpacing;
        if (bit === "1") {
          node
            .append("line")
            .attr("class", "fuxi-line")
            .attr("x1", startX)
            .attr("x2", startX + lineWidth)
            .attr("y1", y)
            .attr("y2", y);
          return;
        }

        const half = (lineWidth - lineGap) / 2;
        node
          .append("line")
          .attr("class", "fuxi-line")
          .attr("x1", startX)
          .attr("x2", startX + half)
          .attr("y1", y)
          .attr("y2", y);

        node
          .append("line")
          .attr("class", "fuxi-line")
          .attr("x1", startX + half + lineGap)
          .attr("x2", startX + lineWidth)
          .attr("y1", y)
          .attr("y2", y);
      });
    }

    const squareNodes = svg
      .append("g")
      .selectAll("g")
      .data(hexagrams)
      .enter()
      .append("g")
      .attr("class", "fuxi-square-node")
      .attr("data-dec", (d) => d.decimal)
      .attr("role", "button")
      .attr("tabindex", 0)
      .attr("aria-label", (d) => `Decimal ${d.decimal}, binary ${d.bits}`)
      .attr("transform", (d) => {
        const col = d.decimal % 8;
        const row = Math.floor(d.decimal / 8);
        const x = squareX + col * cellSize + cellSize / 2;
        const y = squareY + row * cellSize + cellSize / 2;
        return `translate(${x},${y})`;
      });

    squareNodes
      .append("rect")
      .attr("class", "fuxi-card")
      .attr("x", -21)
      .attr("y", -25)
      .attr("width", 42)
      .attr("height", 36);

    squareNodes.each(function bindSquareLines(d) {
      const node = d3.select(this);
      drawHexLines(node, d.bits, {
        startX: -13,
        startY: -20,
        lineWidth: 26,
        lineGap: 4.5,
        lineSpacing: 5.8,
      });
    });

    squareNodes
      .append("text")
      .attr("class", "fuxi-binary")
      .attr("x", 0)
      .attr("y", 22)
      .text((d) => d.bits);

    squareNodes
      .append("rect")
      .attr("class", "fuxi-hit")
      .attr("x", -24)
      .attr("y", -28)
      .attr("width", 48)
      .attr("height", 56);

    const circleNodes = svg
      .append("g")
      .selectAll("g")
      .data(hexagrams)
      .enter()
      .append("g")
      .attr("class", "fuxi-circle-node")
      .attr("data-dec", (d) => d.decimal)
      .attr("role", "button")
      .attr("tabindex", 0)
      .attr("aria-label", (d) => `Decimal ${d.decimal}, binary ${d.bits}`)
      .attr("transform", (d) => {
        const angle = -Math.PI / 2 - (Math.PI * 2 * d.decimal) / 64;
        const x = center + Math.cos(angle) * circleRadius;
        const y = center + Math.sin(angle) * circleRadius;
        return `translate(${x},${y})`;
      });

    circleNodes
      .append("rect")
      .attr("class", "fuxi-card")
      .attr("x", -11)
      .attr("y", -14)
      .attr("width", 22)
      .attr("height", 18);

    circleNodes.each(function bindCircleLines(d) {
      const node = d3.select(this);
      drawHexLines(node, d.bits, {
        startX: -7.5,
        startY: -11.2,
        lineWidth: 15,
        lineGap: 2.4,
        lineSpacing: 2.8,
      });
    });

    circleNodes
      .append("rect")
      .attr("class", "fuxi-hit")
      .attr("x", -14)
      .attr("y", -17)
      .attr("width", 28)
      .attr("height", 24);

    svg
      .append("g")
      .selectAll("text")
      .data(hexagrams)
      .enter()
      .append("text")
      .attr("class", "fuxi-decimal")
      .attr("x", (d) => {
        const angle = -Math.PI / 2 - (Math.PI * 2 * d.decimal) / 64;
        return center + Math.cos(angle) * labelRadius;
      })
      .attr("y", (d) => {
        const angle = -Math.PI / 2 - (Math.PI * 2 * d.decimal) / 64;
        return center + Math.sin(angle) * labelRadius + 3.5;
      })
      .text((d) => d.decimal);

    function setActive(decimal) {
      const selected = byDecimal.get(decimal);
      if (!selected) {
        return;
      }

      squareNodes.classed("is-active", (d) => d.decimal === decimal);
      circleNodes.classed("is-active", (d) => d.decimal === decimal);

      if (detailName) {
        detailName.innerHTML = `<span class="lang-zh">${selected.nameZh}</span><span class="lang-en">${selected.nameEn}</span>`;
      }

      if (detailCopy) {
        detailCopy.innerHTML = `<span class="lang-zh">${selected.nameZh}卦在本映射中对应二进制 ${selected.bits}，十进制 ${selected.decimal}。上卦为${selected.upper.zh}，下卦为${selected.lower.zh}，读取顺序严格为自上而下。</span><span class="lang-en">${selected.nameEn} maps to binary ${selected.bits} and decimal ${selected.decimal} under this system. Its upper trigram is ${selected.upper.en} and its lower trigram is ${selected.lower.en}, with bits read strictly from top to bottom.</span>`;
      }

      if (detailStructure) {
        detailStructure.innerHTML = `<span class="lang-zh">上卦 ${selected.upper.bits}（${selected.upper.zh}，${selected.upper.imageZh}）｜下卦 ${selected.lower.bits}（${selected.lower.zh}，${selected.lower.imageZh}）</span><span class="lang-en">Upper trigram ${selected.upper.bits} (${selected.upper.en}, ${selected.upper.imageEn}) | Lower trigram ${selected.lower.bits} (${selected.lower.en}, ${selected.lower.imageEn})</span>`;
      }

      if (detailBits) {
        detailBits.innerHTML = `${selected.bits}<small>DEC ${selected.decimal}</small>`;
      }
    }

    function bindExplorerEvents(selection) {
      selection.on("mouseenter", (_, d) => {
        setActive(d.decimal);
      });

      selection.on("focus", (_, d) => {
        setActive(d.decimal);
      });

      selection.on("click", (event, d) => {
        event.preventDefault();
        setActive(d.decimal);
      });

      selection.on("keydown", (event, d) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          setActive(d.decimal);
        }
      });
    }

    bindExplorerEvents(squareNodes);
    bindExplorerEvents(circleNodes);
    setActive(0);
  }

  renderFuxiExplorer();

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

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const lang = body.dataset.lang || "zh";
      const formData = new FormData(form);
      const payload = Object.fromEntries(formData.entries());
      payload.lang = lang;
      payload.page = form.dataset.page || window.location.pathname;
      const recipient = form.dataset.recipient || "info@ichingciv.org";

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
      updatePlaceholders(lang);
      updateTopicText(lang);

      if (submitButton) {
        submitButton.disabled = false;
        submitButton.removeAttribute("aria-busy");
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

  setLanguage(getInitialLanguage());
})();
