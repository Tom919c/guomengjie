(function () {
  "use strict";

  var defaults = {
    recipientName: "豆豆同学",
    senderName: "陈权",
    examName: "考试",
    openingLine: "你正在一步一步接近想要的结果。",
    customWish: "愿你稳定发挥，考的都会，蒙的都对！",
    endingSignature: "我会一直为你加油。",
    hiddenMessage: "你比想象中更强大。"
  };

  var config = Object.assign({}, defaults, window.SURPRISE_CONFIG || {});
  var totalSteps = 4;
  var easterTapCount = 0;
  var easterUnlocked = false;
  var currentSceneId = "intro";

  var sceneTagEl = document.getElementById("sceneTag");
  var sceneTitleEl = document.getElementById("sceneTitle");
  var sceneTextEl = document.getElementById("sceneText");
  var progressWrapEl = document.getElementById("progressWrap");
  var actionAreaEl = document.getElementById("actionArea");
  var hintTextEl = document.getElementById("hintText");
  var restartBtn = document.getElementById("restartBtn");
  var cardEl = document.getElementById("card");
  var fxLayer = ensureFxLayer();

  var scenes = {
    intro: {
      step: 1,
      tag: "神秘信封",
      title: "给 {recipientName} 的考前惊喜",
      text: "距离{examName}越来越近啦。\n我想在你冲刺前，先塞给你一点点好运和勇气。",
      choices: [{ label: "拆开看看", next: "mood" }]
    },
    mood: {
      step: 1,
      tag: "状态确认",
      title: "今天你是什么状态？",
      text: "选一个最像你现在的按钮，我们继续往下走。",
      choices: [
        { label: "我有点紧张", next: "nervous" },
        { label: "我斗志拉满", next: "confident" }
      ]
    },
    nervous: {
      step: 2,
      tag: "温柔补给",
      title: "先抱抱紧张的你",
      text: "{openingLine}\n紧张不代表你不行，恰恰说明你真的很在乎这次机会。",
      choices: [{ label: "收到，我继续冲", next: "tapLuck" }]
    },
    confident: {
      step: 2,
      tag: "战力强化",
      title: "气势很好，继续保持",
      text: "这种专注和执行力真的很帅。\n把这个状态带进考场，结果会很漂亮。",
      choices: [{ label: "继续，点满好运", next: "tapLuck" }]
    },
    tapLuck: {
      step: 3,
      tag: "好运彩蛋",
      type: "tap",
      title: "点亮 5 颗好运星",
      text: "每点一次都算一次「会做 +1」。\n点满后就能解锁最终祝福。",
      tapTarget: 5,
      tapButtonText: "点亮一颗 ✨",
      next: "ending"
    },
    ending: {
      step: 4,
      tag: "终章祝福",
      title: "{recipientName}，你一定可以",
      text: "{customWish}\n\n{endingSignature}\n—— {senderName}",
      choices: [{ label: "再收一波好运", action: "spark" }]
    }
  };

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function fill(template) {
    return String(template || "").replace(/\{([a-zA-Z0-9_]+)\}/g, function (_, key) {
      return config[key] == null ? "" : String(config[key]);
    });
  }

  function formatText(template) {
    return escapeHtml(fill(template)).replace(/\n/g, "<br>");
  }

  function setHint(text, isHighlight) {
    hintTextEl.textContent = text;
    hintTextEl.classList.toggle("highlight", Boolean(isHighlight));
  }

  function renderProgress(step) {
    progressWrapEl.innerHTML = "";
    for (var i = 1; i <= totalSteps; i += 1) {
      var dot = document.createElement("span");
      dot.className = "progress-dot" + (i <= step ? " active" : "");
      progressWrapEl.appendChild(dot);
    }
  }

  function createButton(label, handler) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "choice-button";
    button.textContent = label;
    button.addEventListener("click", handler);
    return button;
  }

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function ensureFxLayer() {
    var layer = document.getElementById("fxLayer");
    if (!layer) {
      layer = document.createElement("div");
      layer.id = "fxLayer";
      layer.className = "fx-layer";
      document.body.appendChild(layer);
    }
    return layer;
  }

  function createSparkItem(options) {
    var item = document.createElement("span");
    item.className = "float-item";

    if (options.fullscreen) {
      item.classList.add("float-item--fullscreen");
    }
    if (Math.random() > 0.45) {
      item.classList.add("float-item--twinkle");
    }
    if (Math.random() > 0.82) {
      item.classList.add("float-item--soft");
    }
    if (Math.random() > 0.72) {
      item.classList.add("float-item--mega");
    }

    item.style.setProperty("--x", options.startX.toFixed(2) + "%");
    item.style.setProperty("--y", options.startY.toFixed(2) + "%");
    item.style.setProperty("--tx", options.tx.toFixed(1) + "px");
    item.style.setProperty("--ty", options.ty.toFixed(1) + "px");
    item.style.setProperty("--rotate", options.rotate.toFixed(1) + "deg");
    item.style.setProperty("--dur", Math.round(options.duration) + "ms");
    item.style.setProperty("--delay", Math.round(options.delay) + "ms");
    item.style.setProperty("--size", options.size.toFixed(1) + "px");
    item.style.setProperty("--scale", options.scale.toFixed(2));
    item.style.setProperty("--blur", options.blur.toFixed(2) + "px");
    item.style.setProperty("--glow", options.glow.toFixed(2));
    item.textContent = options.icons[Math.floor(Math.random() * options.icons.length)];
    item.addEventListener("animationend", function (event) {
      if (event.animationName !== "spark-flight") {
        return;
      }
      event.target.remove();
    });

    return item;
  }

  function burstSpark(count) {
    var icons = [
      "✨",
      "🌟",
      "💫",
      "⭐",
      "🌠",
      "💖",
      "💕",
      "💗",
      "💓",
      "💞",
      "💝",
      "🍀",
      "☘️",
      "🌸",
      "💐",
      "🌈",
      "🎈",
      "🎉",
      "🎊",
      "🪄",
      "🫧",
      "🦋",
      "🪽",
      "🎓",
      "📚",
      "📝",
      "🏅",
      "🏆",
      "🎯",
      "✅"
    ];
    var base = Math.max(8, Number(count) || 10);
    var localPieces = Math.min(42, Math.round(base * 1.9));
    var screenPieces = Math.min(130, Math.round(base * 3.6));
    var centerX = randomBetween(44, 56);
    var centerY = randomBetween(77, 84);
    var reducedMotion =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var localFragment = document.createDocumentFragment();
    var screenFragment = document.createDocumentFragment();

    cardEl.classList.remove("card-burst");
    // 触发重绘后重新加 class，确保连续点击也能看到脉冲光效
    void cardEl.offsetWidth;
    cardEl.classList.add("card-burst");
    setTimeout(function () {
      cardEl.classList.remove("card-burst");
    }, 460);

    for (var i = 0; i < localPieces; i += 1) {
      var angle = randomBetween(-150, -30) * (Math.PI / 180);
      var distance = randomBetween(120, 280) + base * 2.3;
      var driftX = Math.cos(angle) * distance + randomBetween(-16, 16);
      var driftY = Math.sin(angle) * distance;
      var size = randomBetween(18, 32);
      var duration = reducedMotion ? randomBetween(420, 760) : randomBetween(1000, 1850);
      var delay = randomBetween(0, 170);
      var endScale = randomBetween(1, 1.72);
      var spin = randomBetween(-48, 48);
      var blur = Math.random() > 0.8 ? randomBetween(0.6, 1.5) : 0;
      var glow = randomBetween(0.26, 0.56);
      localFragment.appendChild(
        createSparkItem({
          icons: icons,
          fullscreen: false,
          startX: centerX + randomBetween(-8, 8),
          startY: centerY + randomBetween(-4, 4),
          tx: driftX,
          ty: driftY,
          rotate: spin,
          duration: duration,
          delay: delay,
          size: size,
          scale: endScale,
          blur: blur,
          glow: glow
        })
      );
    }

    for (var j = 0; j < screenPieces; j += 1) {
      var startX = randomBetween(4, 96);
      var startY = randomBetween(68, 98);
      var screenAngle = randomBetween(-172, -8) * (Math.PI / 180);
      var screenDistance = randomBetween(220, 560) + base * 2.8;
      var screenX = Math.cos(screenAngle) * screenDistance + randomBetween(-24, 24);
      var screenY = Math.sin(screenAngle) * screenDistance;
      var screenSize = randomBetween(20, 38);
      var screenDuration = reducedMotion ? randomBetween(560, 980) : randomBetween(1200, 2400);
      var screenDelay = randomBetween(0, 260);
      var screenScale = randomBetween(1.05, 1.95);
      var screenRotate = randomBetween(-75, 75);
      var screenBlur = Math.random() > 0.74 ? randomBetween(0.4, 1.8) : 0;
      var screenGlow = randomBetween(0.3, 0.64);

      screenFragment.appendChild(
        createSparkItem({
          icons: icons,
          fullscreen: true,
          startX: startX,
          startY: startY,
          tx: screenX,
          ty: screenY,
          rotate: screenRotate,
          duration: screenDuration,
          delay: screenDelay,
          size: screenSize,
          scale: screenScale,
          blur: screenBlur,
          glow: screenGlow
        })
      );
    }

    cardEl.appendChild(localFragment);
    fxLayer.appendChild(screenFragment);
  }

  function handleAction(action) {
    if (action === "spark") {
      burstSpark(18);
      setHint("好运继续叠满，考场稳稳发挥！", true);
    }
  }

  function renderChoiceScene(scene) {
    scene.choices.forEach(function (choice) {
      var button = createButton(choice.label, function () {
        if (choice.next) {
          renderScene(choice.next);
          return;
        }
        if (choice.action) {
          handleAction(choice.action);
        }
      });
      actionAreaEl.appendChild(button);
    });
  }

  function renderTapScene(scene) {
    var target = Number(scene.tapTarget) || 5;
    var current = 0;

    var status = document.createElement("p");
    status.className = "tap-status";
    status.textContent = "好运值：0/" + target;
    actionAreaEl.appendChild(status);

    var tapButton = createButton(scene.tapButtonText || "点亮好运", function () {
      current += 1;
      status.textContent = "好运值：" + current + "/" + target;
      burstSpark(8);

      if (current < target) {
        return;
      }

      tapButton.disabled = true;
      tapButton.textContent = "好运已充满";
      setHint("已解锁终章，点击下方按钮查看你的专属祝福。", true);
      actionAreaEl.appendChild(
        createButton("开启最终祝福", function () {
          renderScene(scene.next);
        })
      );
    });

    actionAreaEl.appendChild(tapButton);
  }

  function renderScene(sceneId) {
    var scene = scenes[sceneId];
    if (!scene) {
      return;
    }

    currentSceneId = sceneId;
    sceneTagEl.textContent = fill(scene.tag) + " · 第" + scene.step + "/" + totalSteps + "幕";
    sceneTitleEl.textContent = fill(scene.title);
    sceneTextEl.innerHTML = formatText(scene.text);
    actionAreaEl.innerHTML = "";
    renderProgress(scene.step);

    if (scene.type === "tap") {
      renderTapScene(scene);
      setHint("连续点击，攒满好运值。", false);
    } else {
      renderChoiceScene(scene);
      if (sceneId !== "ending") {
        setHint("小彩蛋：悄悄点标题几次试试看。", false);
      }
    }

    if (sceneId === "ending") {
      burstSpark(20);
      setHint("可以点“再收一波好运”哦", true);
      restartBtn.hidden = false;
    } else {
      restartBtn.hidden = true;
    }
  }

  function resetStory() {
    easterTapCount = 0;
    renderScene("intro");
  }

  sceneTitleEl.addEventListener("click", function () {
    easterTapCount += 1;
    if (easterUnlocked || easterTapCount < 6) {
      return;
    }
    easterUnlocked = true;
    burstSpark(24);
    setHint(fill(config.hiddenMessage), true);
  });

  restartBtn.addEventListener("click", function () {
    if (currentSceneId === "ending") {
      resetStory();
    }
  });

  renderScene("intro");
})();
