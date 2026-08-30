const scenarioSelect = document.querySelector("#scenario-select");
const scenarioDescription = document.querySelector("#scenario-description");
const creditedStatus = document.querySelector("#credited-status");
const tradableStatus = document.querySelector("#tradable-status");
const transferStatus = document.querySelector("#transfer-status");
const evaluatedAt = document.querySelector("#evaluated-at");
const versions = document.querySelector("#versions");
const eta = document.querySelector("#eta");
const cost = document.querySelector("#cost");
const finality = document.querySelector("#finality");
const holdRisk = document.querySelector("#hold-risk");
const confidence = document.querySelector("#confidence");
const reasonCodes = document.querySelector("#reason-codes");
const evidenceList = document.querySelector("#evidence-list");
const routes = document.querySelector("#routes");
const normalizedInput = document.querySelector("#normalized-input");
const rawJson = document.querySelector("#raw-json");
const copyJson = document.querySelector("#copy-json");

const artifactUrl = (path) => new URL(path, window.location.href);
const format = (value) => String(value).replaceAll("_", " ");

const fetchJson = async (path) => {
  const response = await fetch(artifactUrl(path), { cache: "no-store" });
  if (!response.ok) throw new Error(`Unable to load ${path}: ${response.status}`);
  return response.json();
};

const listItem = (title, detail) => {
  const element = document.createElement("li");
  const strong = document.createElement("strong");
  strong.textContent = title;
  element.append(strong, document.createElement("br"), document.createTextNode(detail));
  return element;
};

const renderList = (container, items, renderItem) => {
  container.replaceChildren(...items.map((item) => renderItem(item)));
};

const renderReplay = (scenario, replay) => {
  scenarioDescription.textContent = scenario.description;
  creditedStatus.textContent = format(replay.creditedStatus);
  tradableStatus.textContent = format(replay.tradableStatus);
  transferStatus.textContent = format(replay.externallyTransferableStatus);
  evaluatedAt.textContent = replay.evaluatedAt;
  versions.textContent = `${replay.schemaVersion} / ${replay.policyVersion}`;
  eta.textContent = format(replay.eta);
  cost.textContent = format(replay.cost);
  finality.textContent = format(replay.finality);
  holdRisk.textContent = format(replay.holdRisk);
  confidence.textContent = replay.confidence.toFixed(2);

  renderList(reasonCodes, replay.reasonCodes, (reason) => listItem(reason.code, reason.message));
  renderList(evidenceList, replay.evidenceDates, (evidence) =>
    listItem(evidence.id, `as-of ${evidence.asOf}; expires ${evidence.expiresAt}; scope ${evidence.scope}; freshness ${evidence.freshness}`),
  );

  routes.textContent = JSON.stringify({
    rejectedRoutes: replay.rejectedRoutes,
    fallback: replay.fallback,
    evidenceValidationFailures: replay.evidenceValidationFailures,
  }, null, 2);
  normalizedInput.textContent = JSON.stringify(scenario.normalizedInput, null, 2);
  rawJson.textContent = JSON.stringify(replay, null, 2);
};

const [{ scenarios }, { replays }] = await Promise.all([
  fetchJson("api/v1/scenarios.json"),
  fetchJson("api/v1/replays.json"),
]);
const replaysByScenario = new Map(replays.map((replay) => [replay.scenarioId, replay]));

for (const scenario of scenarios) {
  const option = document.createElement("option");
  option.value = scenario.id;
  option.textContent = `${scenario.id} - ${scenario.description}`;
  scenarioSelect.append(option);
}

const selectScenario = () => {
  const scenario = scenarios.find(({ id }) => id === scenarioSelect.value);
  renderReplay(scenario, replaysByScenario.get(scenario.id));
};

scenarioSelect.addEventListener("change", selectScenario);
copyJson.addEventListener("click", async () => {
  await navigator.clipboard.writeText(rawJson.textContent);
  copyJson.textContent = "Copied";
  window.setTimeout(() => {
    copyJson.textContent = "Copy JSON";
  }, 1200);
});

scenarioSelect.value = scenarios[0].id;
selectScenario();
