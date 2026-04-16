(function () {
  "use strict";

  var defaults = {
    recipientName: "你",
    senderName: "我",
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

  function burstSpark(count) {
    var icons = ["✨", "🌟", "💖", "🍀"];
    var pieces = count || 10;
    for (var i = 0; i < pieces; i += 1) {
      var item = document.createElement("span");
      item.className = "float-item";
      item.style.left = 8 + Math.random() * 84 + "%";
      item.style.animationDelay = Math.random() * 0.2 + "s";
      item.textContent = icons[Math.floor(Math.random() * icons.length)];
      cardEl.appendChild(item);
      item.addEventListener("animationend", function (event) {
        event.target.remove();
      });
    }
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
      burstSpark(4);

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
      setHint("连续点击，给她攒满好运值。", false);
    } else {
      renderChoiceScene(scene);
      if (sceneId !== "ending") {
        setHint("小彩蛋：悄悄点标题几次试试看。", false);
      }
    }

    if (sceneId === "ending") {
      burstSpark(20);
      setHint("可以点“再收一波好运”，也可以直接发给她。", true);
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
