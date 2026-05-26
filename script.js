const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const sectionIds = [
  "intro",
  "campionario",
  "classica",
  "metodi",
  "operazioni",
  "assiomatica",
  "differenza",
  "condizionata",
  "bayes",
  "bernoulli",
  "quiz",
];

const fmt = new Intl.NumberFormat("it-IT", { maximumFractionDigits: 2 });
const pct = (value) => `${fmt.format(value * 100)}%`;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const numberValue = (id, fallback = 0) => {
  const value = Number($(id).value);
  return Number.isFinite(value) ? value : fallback;
};

function scrollToSection(delta) {
  const center = window.scrollY + window.innerHeight / 2;
  const positions = sectionIds.map((id) => {
    const element = document.getElementById(id);
    return { id, top: element.offsetTop };
  });
  let current = 0;
  positions.forEach((position, index) => {
    if (position.top <= center) current = index;
  });
  const next = clamp(current + delta, 0, sectionIds.length - 1);
  document.getElementById(sectionIds[next]).scrollIntoView({ behavior: "smooth", block: "start" });
}

function updateProgress() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const percent = max <= 0 ? 0 : (window.scrollY / max) * 100;
  $("#progressBar").style.width = `${percent}%`;
}

function setupNavigation() {
  $("#prevSection").addEventListener("click", () => scrollToSection(-1));
  $("#nextSection").addEventListener("click", () => scrollToSection(1));

  window.addEventListener("scroll", updateProgress, { passive: true });
  updateProgress();

  document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight" || event.key === "PageDown") scrollToSection(1);
    if (event.key === "ArrowLeft" || event.key === "PageUp") scrollToSection(-1);
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        $$(".nav a").forEach((link) => {
          link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`);
        });
      });
    },
    { rootMargin: "-35% 0px -55% 0px", threshold: 0.01 },
  );

  sectionIds.forEach((id) => observer.observe(document.getElementById(id)));
}

function setupPresentationButton() {
  const button = $("#presentButton");
  button.addEventListener("click", async () => {
    if (!document.fullscreenElement && document.fullscreenEnabled) {
      await document.documentElement.requestFullscreen();
    } else if (document.fullscreenElement) {
      await document.exitFullscreen();
    }
    document.body.classList.toggle("presentation", Boolean(document.fullscreenElement));
  });

  document.addEventListener("fullscreenchange", () => {
    const active = Boolean(document.fullscreenElement);
    document.body.classList.toggle("presentation", active);
    button.lastChild.textContent = active ? " Esci" : " Presenta";
  });
}

const pipMap = {
  1: [5],
  2: [1, 9],
  3: [1, 5, 9],
  4: [1, 3, 7, 9],
  5: [1, 3, 5, 7, 9],
  6: [1, 3, 4, 6, 7, 9],
};

function renderDie(element, value) {
  element.innerHTML = "";
  pipMap[value].forEach((position) => {
    const pip = document.createElement("span");
    pip.className = `pip p${position}`;
    element.appendChild(pip);
  });
}

function setupCampionario() {
  const dieOutcomes = $("#dieOutcomes");
  for (let i = 1; i <= 6; i += 1) {
    const item = document.createElement("span");
    item.textContent = i;
    dieOutcomes.appendChild(item);
  }

  const updateDie = (value) => {
    renderDie($("#dieFace"), value);
    $("#dieResult").textContent = value;
    $("#evenResult").textContent = value % 2 === 0 ? "verificato" : "non verificato";
    $$("#dieOutcomes span").forEach((item) => {
      const itemValue = Number(item.textContent);
      item.classList.toggle("active", itemValue === value);
      item.classList.toggle("match", itemValue % 2 === 0);
    });
  };

  $("#rollDie").addEventListener("click", () => updateDie(1 + Math.floor(Math.random() * 6)));
  updateDie(1);

  const outcomes = ["TT", "TC", "CT", "CC"];
  outcomes.forEach((outcome) => {
    const item = document.createElement("span");
    item.textContent = outcome;
    $("#coinOutcomes").appendChild(item);
  });

  const updateCoins = (outcome) => {
    const coins = outcome.split("");
    $$("#coinRow span").forEach((coin, index) => {
      coin.textContent = coins[index];
    });
    $$("#coinOutcomes span").forEach((item) => {
      const text = item.textContent;
      const heads = text.split("").filter((coin) => coin === "T").length;
      item.classList.toggle("active", text === outcome);
      item.classList.toggle("match", heads === 1);
    });
  };

  $("#flipCoins").addEventListener("click", () => updateCoins(outcomes[Math.floor(Math.random() * outcomes.length)]));
  updateCoins("TC");
}

function setupClassicalProbability() {
  const updateClassic = () => {
    const fav = Math.max(0, numberValue("#favInput"));
    const total = Math.max(1, numberValue("#totalInput", 1));
    const validFav = Math.min(fav, total);
    const warning = fav > total ? " (ho limitato i favorevoli al totale)" : "";
    $("#classicOutput").textContent = `${validFav} / ${total} = ${pct(validFav / total)}${warning}`;
  };

  ["#favInput", "#totalInput"].forEach((selector) => $(selector).addEventListener("input", updateClassic));
  updateClassic();
}

function setupSmartphones() {
  const grid = $("#deviceGrid");
  for (let i = 0; i < 100; i += 1) {
    grid.appendChild(document.createElement("span"));
  }

  const updatePhones = () => {
    const battery = numberValue("#batteryDefects");
    const defects = clamp(battery, 0, 100);
    $$("#deviceGrid span").forEach((item, index) => {
      item.classList.toggle("defect", index < defects);
    });
    $("#phonePill").textContent = `${pct((100 - defects) / 100)} ok`;
  };

  $("#batteryDefects").addEventListener("input", updatePhones);
  updatePhones();
}

function setupOperations() {
  const updateVenn = () => {
    const a = Math.max(0, numberValue("#vennA"));
    const b = Math.max(0, numberValue("#vennB"));
    const both = clamp(numberValue("#vennBoth"), 0, Math.min(a, b));
    const union = a + b - both;
    $("#unionPill").textContent = union === 32 && a === 26 && b === 12 && both === 6 ? "32 / 52" : `${union} casi`;
    $("#vennOutput").textContent = `${a} + ${b} - ${both} = ${union} casi favorevoli`;
  };

  ["#vennA", "#vennB", "#vennBoth"].forEach((selector) => $(selector).addEventListener("input", updateVenn));
  updateVenn();

  const ballGrid = $("#ballGrid");
  for (let value = 1; value <= 20; value += 1) {
    const ball = document.createElement("span");
    const multipleOf3 = value % 3 === 0;
    const multipleOf4 = value % 4 === 0;
    ball.textContent = value;
    ball.classList.toggle("active", multipleOf3 || multipleOf4);
    ball.classList.toggle("both", multipleOf3 && multipleOf4);
    ballGrid.appendChild(ball);
  }
}

function setupConditional() {
  const updateStudents = () => {
    const classTotal = Math.max(1, numberValue("#classTotal", 1));
    const classMales = clamp(numberValue("#classMales"), 0, classTotal);
    const schoolTotal = Math.max(1, numberValue("#schoolTotal", 1));
    const schoolMales = clamp(numberValue("#schoolMales"), 0, schoolTotal);
    const probability = classMales / classTotal;
    $("#studentPill").textContent = `${classMales} / ${classTotal}`;
    $("#studentOutput").textContent =
      `P(M | 4aB) = (${classMales}/${schoolMales || 1} x ${schoolMales}/${schoolTotal}) / (${classTotal}/${schoolTotal}) = ${classMales} / ${classTotal} = ${pct(probability)}`;
  };

  ["#schoolTotal", "#schoolMales", "#classTotal", "#classMales"].forEach((selector) =>
    $(selector).addEventListener("input", updateStudents),
  );
  updateStudents();

  const updateTwoDice = (a = 1, b = 1) => {
    renderDie($("#dieOne"), a);
    renderDie($("#dieTwo"), b);
    $("#doubleSix").textContent = a === 6 && b === 6 ? "uscito" : "non uscito";
  };

  $("#rollTwoDice").addEventListener("click", () => {
    updateTwoDice(1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6));
  });
  updateTwoDice();
}

function setupBayes() {
  const updateBayes = () => {
    const prevalence = numberValue("#prevalence") / 100;
    const sensitivity = numberValue("#sensitivity") / 100;
    const falsePositive = numberValue("#falsePositive") / 100;
    const truePositive = prevalence * sensitivity;
    const falsePositiveShare = (1 - prevalence) * falsePositive;
    const totalPositive = truePositive + falsePositiveShare;
    const posterior = totalPositive === 0 ? 0 : truePositive / totalPositive;

    $("#prevalenceLabel").textContent = pct(prevalence);
    $("#sensitivityLabel").textContent = pct(sensitivity);
    $("#falsePositiveLabel").textContent = pct(falsePositive);
    $("#bayesPill").textContent = pct(posterior);
    $("#bayesOutput").textContent =
      `P(dopato | positivo) = ${fmt.format(truePositive)} / ${fmt.format(totalPositive)} = ${pct(posterior)}`;

    const trueWidth = totalPositive === 0 ? 0 : (truePositive / totalPositive) * 100;
    const falseWidth = totalPositive === 0 ? 0 : (falsePositiveShare / totalPositive) * 100;
    $("#truePositiveBar").style.width = `${Math.max(2, trueWidth)}%`;
    $("#falsePositiveBar").style.width = `${Math.max(2, falseWidth)}%`;
  };

  ["#prevalence", "#sensitivity", "#falsePositive"].forEach((selector) =>
    $(selector).addEventListener("input", updateBayes),
  );
  updateBayes();
}

function combination(n, k) {
  if (k < 0 || k > n) return 0;
  const usefulK = Math.min(k, n - k);
  let result = 1;
  for (let i = 1; i <= usefulK; i += 1) {
    result = (result * (n - usefulK + i)) / i;
  }
  return result;
}

function bernoulli(n, k, p) {
  return combination(n, k) * p ** k * (1 - p) ** (n - k);
}

function setupBernoulli() {
  const updateBernoulli = () => {
    const n = numberValue("#bernN");
    const kInput = $("#bernK");
    kInput.max = n;
    if (Number(kInput.value) > n) kInput.value = n;
    const k = numberValue("#bernK");
    const p = numberValue("#bernP") / 100;
    const q = 1 - p;
    const c = combination(n, k);
    const result = bernoulli(n, k, p);

    $("#bernNLabel").textContent = n;
    $("#bernKLabel").textContent = k;
    $("#bernPLabel").textContent = pct(p);
    $("#bernoulliPill").textContent = pct(result);
    $("#bernoulliOutput").textContent =
      `C(${n},${k}) x ${fmt.format(p)}^${k} x ${fmt.format(q)}^${n - k} = ${pct(result)}`;

    const chart = $("#bernChart");
    chart.innerHTML = "";
    const values = Array.from({ length: n + 1 }, (_, index) => bernoulli(n, index, p));
    const max = Math.max(...values);
    values.forEach((value, index) => {
      const barButton = document.createElement("button");
      barButton.type = "button";
      barButton.classList.toggle("active", index === k);
      barButton.setAttribute("aria-label", `Scegli k uguale a ${index}`);
      barButton.addEventListener("click", () => {
        kInput.value = index;
        updateBernoulli();
      });

      const bar = document.createElement("span");
      bar.style.height = `${Math.max(4, (value / max) * 145)}px`;
      barButton.append(bar, document.createTextNode(index));
      chart.appendChild(barButton);
    });
  };

  ["#bernN", "#bernK", "#bernP"].forEach((selector) => $(selector).addEventListener("input", updateBernoulli));
  updateBernoulli();
}

const quizQuestions = [
  {
    question: "Nel lancio di un dado, qual è lo spazio campionario?",
    answers: ["{1,2,3,4,5,6}", "{pari, dispari}", "{2,4,6}"],
    correct: 0,
    feedback: "Esatto: Ω contiene tutti gli esiti elementari possibili.",
  },
  {
    question: "Se 5 smartphone su 100 sono difettosi, qual è P(funzionante)?",
    answers: ["5%", "95%", "50%"],
    correct: 1,
    feedback: "Si usa l'evento contrario: 1 - 5/100 = 95%.",
  },
  {
    question: "Carte rosse 26, figure 12, figure rosse 6. Quanti casi in A ∪ B?",
    answers: ["44", "38", "32"],
    correct: 2,
    feedback: "Somma logica: 26 + 12 - 6 = 32.",
  },
  {
    question: "Nell'urna 1-20, multipli di 3 oppure di 4: qual è la probabilità?",
    answers: ["10/20", "11/20", "1/20"],
    correct: 0,
    feedback: "I casi sono 6 + 5 - 1 = 10, quindi 10/20 = 50%.",
  },
  {
    question: "80 usano Instagram, 60 TikTok, 50 entrambi. Quanti usano solo TikTok?",
    answers: ["10", "50", "60"],
    correct: 0,
    feedback: "Togli l'intersezione: 60 - 50 = 10.",
  },
  {
    question: "In 4aB ci sono 24 studenti, 13 maschi. Quanto vale P(M | 4aB)?",
    answers: ["13/24", "24/650", "225/650"],
    correct: 0,
    feedback: "Sapendo che lo studente è in 4aB, l'universo diventa la classe: 13 su 24.",
  },
  {
    question: "Nella definizione frequentista, che cosa rappresenta k in Fr(E)=k/n?",
    answers: ["Il numero di prove totali", "Il numero di volte in cui E si verifica", "La vincita della scommessa"],
    correct: 1,
    feedback: "k conta quante volte l'evento E si verifica nelle prove osservate.",
  },
  {
    question: "Nella definizione soggettiva, qual è la formula usata?",
    answers: ["P(E)=p/V", "P(E)=k/n", "P(E)=P(A)+P(B)"],
    correct: 0,
    feedback: "La probabilità soggettiva confronta la somma pagata p con la vincita V.",
  },
  {
    question: "Quale affermazione appartiene alla definizione assiomatica?",
    answers: ["P(E) può essere negativa", "P(Ω)=1", "P(Ω)=0"],
    correct: 1,
    feedback: "L'intero spazio campionario è l'evento certo, quindi ha probabilità 1.",
  },
  {
    question: "Nel test anti-doping del testo, il risultato finale è circa...",
    answers: ["90%", "26,8%", "5%"],
    correct: 1,
    feedback: "Bayes corregge l'intuizione: i falsi positivi pesano molto perché i dopati sono pochi.",
  },
  {
    question: "Tiri liberi: n=5, k=3, p=0,8. La probabilità è...",
    answers: ["20,48%", "80%", "3/5"],
    correct: 0,
    feedback: "C(5,3) x 0,8^3 x 0,2^2 = 20,48%.",
  },
];

const quizState = {
  index: 0,
  score: 0,
  answered: 0,
};

function updateScore() {
  $("#scoreText").textContent = `Punteggio: ${quizState.score} / ${quizState.answered}`;
}

function renderQuiz() {
  const panel = $("#quizPanel");
  panel.innerHTML = "";

  if (quizState.index >= quizQuestions.length) {
    const percentage = quizState.score / quizQuestions.length;
    const title = document.createElement("p");
    title.className = "quiz-question";
    title.textContent = percentage >= 0.8 ? "Ottimo: presentazione da voto alto." : "Ripassa due formule e la chiudi molto meglio.";

    const text = document.createElement("p");
    text.textContent = `Hai risposto correttamente a ${quizState.score} domande su ${quizQuestions.length}.`;

    const restart = document.createElement("button");
    restart.className = "small-button";
    restart.textContent = "Ricomincia";
    restart.addEventListener("click", resetQuiz);

    panel.append(title, text, restart);
    return;
  }

  const current = quizQuestions[quizState.index];
  const question = document.createElement("p");
  question.className = "quiz-question";
  question.textContent = `${quizState.index + 1}. ${current.question}`;

  const answers = document.createElement("div");
  answers.className = "answers";

  const feedback = document.createElement("div");
  feedback.className = "quiz-feedback";

  const next = document.createElement("button");
  next.className = "small-button";
  next.textContent = quizState.index === quizQuestions.length - 1 ? "Chiudi quiz" : "Prossima";
  next.disabled = true;

  current.answers.forEach((answer, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = answer;
    button.addEventListener("click", () => {
      if (next.disabled === false) return;
      const correct = index === current.correct;
      button.classList.add(correct ? "correct" : "wrong");
      answers.children[current.correct].classList.add("correct");
      $$(".answers button", panel).forEach((item) => {
        item.disabled = true;
      });
      quizState.answered += 1;
      if (correct) quizState.score += 1;
      feedback.textContent = current.feedback;
      next.disabled = false;
      updateScore();
    });
    answers.appendChild(button);
  });

  next.addEventListener("click", () => {
    quizState.index += 1;
    renderQuiz();
  });

  panel.append(question, answers, feedback, next);
}

function resetQuiz() {
  quizState.index = 0;
  quizState.score = 0;
  quizState.answered = 0;
  updateScore();
  renderQuiz();
}

function setupQuiz() {
  $("#resetQuiz").addEventListener("click", resetQuiz);
  updateScore();
  renderQuiz();
}

setupNavigation();
setupPresentationButton();
setupCampionario();
setupClassicalProbability();
setupSmartphones();
setupOperations();
setupConditional();
setupBayes();
setupBernoulli();
setupQuiz();
