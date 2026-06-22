import React, { useState, useMemo, useRef } from "react";

/* ============================================================================
   CHENEVAL ADVISORY — AI Use Case Governance Assessment
   App shell: Cheneval branding.  Report output: Loreto Normanhurst branding.
   ----------------------------------------------------------------------------
   EDIT BRANDS HERE. Drop in real logo image URLs where noted.
============================================================================ */
const CHENEVAL = {
  name: "CHENEVAL",
  sub: "ADVISORY",
  tagline: "AI & Technology Advisory",
  domain: "chenevaladvisory.com",
  navy: "#0E2240",
  gold: "#C5A572",
  char: "#1A1A1A",
  off: "#F5F2EC",
  slate: "#5A6473",
};

const LORETO = {
  name: "Loreto Normanhurst",
  monogram: "IN",
  navy: "#1F2A56",
  ink: "#222733",
  rule: "#C9CEDB",
  values: "Verity · Justice · Sincerity · Freedom · Felicity",
};

const STATUS = {
  low: { label: "Low", color: "#2E7D5B" },
  moderate: { label: "Moderate", color: "#C58A1B" },
  high: { label: "High", color: "#B23B3B" },
  not_assessed: { label: "Not assessed", color: "#8A93A6" },
};

/* ============================================================================ */
const PROFILE_FIELDS = [
  { id: "useCase", label: "Use case name", type: "text",
    help: "What you'd call this. e.g. “Year 9 essay feedback assistant”.", placeholder: "Name this AI use case" },
  { id: "description", label: "What does it do?", type: "textarea",
    help: "One or two lines: what the tool does and why you'd use it.", placeholder: "Briefly describe the tool and its purpose" },
  { id: "owner", label: "Accountable owner", type: "text",
    help: "A named person who owns this — not a team. This goes on the report.", placeholder: "Full name and role" },
  { id: "primaryUsers", label: "Primary users", type: "select",
    help: "Who actually uses or is affected by it. This shapes which risks apply.",
    options: ["Staff only", "Students 16+", "Students under 16", "Parents & community", "Mixed"] },
  { id: "functionArea", label: "Function area", type: "select",
    help: "Where it sits in the school.",
    options: ["Teaching & learning", "Assessment", "Admin & operations", "Comms & marketing", "HR & recruitment", "Wellbeing & pastoral"] },
  { id: "tool", label: "AI tool & vendor", type: "text",
    help: "The product and who makes it. e.g. “ChatGPT Edu (OpenAI)”.", placeholder: "Tool and vendor" },
  { id: "toolStatus", label: "Tool status", type: "select",
    help: "Is this already approved at Loreto, or new? New or self-sourced tools get closer scrutiny.",
    options: ["Approved / known Loreto tool", "New or trial", "Built in-house"] },
  { id: "data", label: "Data involved", type: "multi",
    help: "Tick everything the tool could touch.",
    options: ["None / de-identified", "Names only", "Student records", "Health / wellbeing", "Behavioural", "Biometric", "Staff records", "Other"] },
  { id: "decision", label: "Decision it supports", type: "text",
    help: "What does a person do with the output?", placeholder: "e.g. “Drafts feedback a teacher reviews and edits”" },
];

/* ============================================================================ */
const PILLARS = [
  {
    id: "teaching", name: "Teaching & Learning",
    intro: "Whether the AI supports human learning and judgment — or quietly does the thinking that's the point.",
    questions: [
      { id: "tl1", prompt: "What role does the AI play in the core task?",
        help: "The framework expects AI to support and extend learning and professional judgment, not replace it.",
        options: [
          { label: "Supports the human, who reviews all output", weight: 0 },
          { label: "Does significant work, checked sometimes", weight: 1, mitigation: "Add a consistent human review step before output is used." },
          { label: "Automates the task with little human review", weight: 2, mitigation: "Insert a human-in-the-loop who reviews and is accountable for the output." },
        ] },
      { id: "tl2", prompt: "Could it remove effort that's actually where the value is?",
        help: "“Desirable difficulty” matters. The OECD warns AI can mask learning gaps by doing the cognitive work for the user.",
        options: [
          { label: "No — it removes busywork only", weight: 0 },
          { label: "Possibly, for some tasks", weight: 1, mitigation: "Identify which tasks must stay human and design the tool around them." },
          { label: "Yes — it does the thinking that's the point", weight: 2, mitigation: "Redesign the use so the learner/staff member still does the core cognitive work." },
        ] },
      { id: "tl3", prompt: "Is there evidence or a pilot plan that it improves outcomes — not just saves time?",
        help: "Time saved isn't value added. A small measured pilot de-risks the whole rollout.",
        options: [
          { label: "Yes — evidence, or a pilot with success measures", weight: 0 },
          { label: "A rationale, but no way to measure it", weight: 1, mitigation: "Define one success measure and run a 4–6 week pilot before scaling." },
          { label: "No — adopting on the assumption it helps", weight: 2, mitigation: "Run a small measured pilot with a clear success metric before any rollout." },
        ] },
    ],
  },
  {
    id: "wellbeing", name: "Human & Social Wellbeing",
    intro: "The tool's effect on wellbeing, relationships, and the duty of care owed to students — heightened for boarders.",
    questions: [
      { id: "hw1", prompt: "Could it reduce meaningful human interaction or relationships central to the setting?",
        help: "Education at Loreto is relational. Watch for tools that displace pastoral or teaching relationships.",
        options: [
          { label: "No", weight: 0 },
          { label: "Minor / peripheral", weight: 1, mitigation: "Confirm the human relationship stays primary and the tool stays supplementary." },
          { label: "Yes — replaces a relational or pastoral function", weight: 2, mitigation: "Keep the relational function human; limit the tool to support tasks around it." },
        ] },
      { id: "hw2", prompt: "Could it affect wellbeing, create dependency, or feel like surveillance?", gate: true, naEligible: true,
        help: "Always-on companions, monitoring, and engagement-maximising design carry wellbeing risk — especially for minors and boarders.",
        options: [
          { label: "No foreseeable impact", weight: 0 },
          { label: "Possible, manageable", weight: 1, mitigation: "Document safeguards and a review point for wellbeing impact." },
          { label: "Yes — plausible wellbeing or safety risk", weight: 2, mitigation: "Refer to the Director of Pastoral Care before proceeding; document safeguards.",
            policyFlags: [{ policy: "Child Protection Policy (Apr 2025) · Statement of Commitment to Child Safety", severity: "hard_stop",
              message: "Reportable conduct includes behaviour causing significant emotional or psychological harm to a child. Monitoring or wellbeing-affecting AI engages the School's paramount duty of care — heightened for boarders." }] },
        ] },
      { id: "hw3", prompt: "Is there a non-AI alternative for anyone who opts out?", naEligible: true,
        help: "Engagement with AI isn't universal; some families have principled reasons to decline.",
        options: [
          { label: "Yes — an alternative exists", weight: 0 },
          { label: "Not considered", weight: 1, mitigation: "Provide an equivalent non-AI pathway for those who opt out." },
          { label: "No — participation is effectively compulsory", weight: 2, mitigation: "Add a genuine non-AI alternative before launch." },
        ] },
    ],
  },
  {
    id: "transparency", name: "Transparency",
    intro: "Whether the people affected know AI is involved, and whether its outputs can be understood and explained.",
    questions: [
      { id: "tr1", prompt: "Will affected people (students, parents, staff) know AI is being used, and how?",
        help: "Loreto's framework values openness and transparency about AI use.",
        options: [
          { label: "Yes — clearly disclosed", weight: 0 },
          { label: "Partially / only on request", weight: 1, mitigation: "Add a clear, proactive disclosure to those affected." },
          { label: "No / not planned", weight: 2, mitigation: "Disclose AI use to affected people before go-live." },
        ] },
      { id: "tr2", prompt: "Can you explain how the tool reaches its output, at a level your audience can follow?",
        help: "A plain-English explanation builds trust and is increasingly expected.",
        options: [
          { label: "Yes", weight: 0 },
          { label: "Roughly", weight: 1, mitigation: "Document a plain-English explanation for staff and families." },
          { label: "No — it's a black box", weight: 2, mitigation: "Obtain a clear explanation from the vendor before relying on outputs." },
        ] },
      { id: "tr3", prompt: "Is AI involved in any decision about a person (grading, ranking, flagging, hiring)?", gate: true,
        help: "Decisions about people carry the highest governance and legal exposure. A human decision-maker must stay in the loop.",
        options: [
          { label: "No", weight: 0 },
          { label: "Yes — as input, with a human making the decision", weight: 1, mitigation: "Document that the human is the decision-maker and can override the AI." },
          { label: "Yes — automated or near-automated", weight: 2, mitigation: "Insert a human decision-maker and a documented review path.",
            policyFlags: [{ policy: "Behaviour Management Policy (Apr 2025) · Complaints Policy (Apr 2025)", severity: "hard_stop",
              message: "Serious decisions about students require procedural fairness and rest on the Principal's discretion. People must be able to raise a decision with a human. An automated decision conflicts with both." }] },
        ] },
    ],
  },
  {
    id: "fairness", name: "Fairness",
    intro: "Whether the tool treats all students equitably — including EAL/D, students with disability, and cultural groups.",
    questions: [
      { id: "fa1", prompt: "Could outputs disadvantage particular groups (EAL/D, disability, socioeconomic, cultural)?",
        help: "Loreto commits particular attention to its most vulnerable students.",
        options: [
          { label: "Assessed — no significant concern", weight: 0 },
          { label: "Possible — not yet assessed", weight: 1, mitigation: "Check outputs across student groups before scaling.",
            policyFlags: [{ policy: "Statement of Commitment to Child Safety (Apr 2025)", severity: "flag",
              message: "The School commits particular attention to vulnerable students — Aboriginal and Torres Strait Islander, culturally/linguistically diverse, and students with disability." }] },
          { label: "Likely, or known bias risk", weight: 2, mitigation: "Address the bias risk and re-check before any use with students.",
            policyFlags: [{ policy: "Statement of Commitment to Child Safety (Apr 2025)", severity: "flag",
              message: "A tool that disadvantages vulnerable student groups cuts against the School's child-safety and inclusion commitments." }] },
        ] },
      { id: "fa2", prompt: "Is access equitable, or does it advantage those who already have resources/skills?",
        help: "Consider device access, home internet, and digital confidence across the cohort.",
        options: [
          { label: "Equitable access ensured", weight: 0 },
          { label: "Some gaps", weight: 1, mitigation: "Close the access gap or provide an alternative for affected students." },
          { label: "Significant access gap", weight: 2, mitigation: "Resolve the access gap before rollout." },
        ] },
      { id: "fa3", prompt: "Where relevant, have Aboriginal and Torres Strait Islander perspectives and cultural safety been considered?", naEligible: true,
        help: "Use N/A only where there's genuinely no cultural dimension.",
        options: [
          { label: "Yes — considered", weight: 0 },
          { label: "Not yet considered", weight: 1, mitigation: "Consider cultural safety and Indigenous data considerations." },
          { label: "Relevant and overlooked", weight: 2, mitigation: "Address cultural safety and Indigenous Cultural & IP considerations before proceeding." },
        ] },
    ],
  },
  {
    id: "accountability", name: "Accountability",
    intro: "Who owns it, who monitors it, and whether a human stays responsible for what it does.",
    questions: [
      { id: "ac1", prompt: "Is there a named person responsible for this AI use?", gate: true,
        help: "“Everyone” owning it means no one does. This is the most common governance gap.",
        options: [
          { label: "Yes — named owner with oversight", weight: 0 },
          { label: "Informal / unclear owner", weight: 1, mitigation: "Confirm and record a single accountable owner." },
          { label: "No one owns it", weight: 2, mitigation: "Assign a named accountable owner before launch and record them." },
        ] },
      { id: "ac2", prompt: "Is there a process to monitor it and intervene if it goes wrong?",
        help: "A defined review point makes problems visible early.",
        options: [
          { label: "Yes — defined review cadence", weight: 0 },
          { label: "Ad hoc", weight: 1, mitigation: "Set a defined review cadence and an escalation path." },
          { label: "None", weight: 2, mitigation: "Establish monitoring and an intervention process before use." },
        ] },
      { id: "ac3", prompt: "Does it comply with relevant policy, with a human able to review a decision?",
        help: "At Loreto, serious decisions follow procedural fairness and the Principal's discretion.",
        options: [
          { label: "Yes — checked, human review exists", weight: 0 },
          { label: "Partially / unsure", weight: 1, mitigation: "Confirm policy alignment and that a human can review any decision." },
          { label: "No, or it conflicts", weight: 2, mitigation: "Resolve the policy conflict and ensure human review before proceeding.",
            policyFlags: [{ policy: "Complaints Policy (Apr 2025) · Behaviour Management Policy (Apr 2025)", severity: "flag",
              message: "The School provides a human complaints pathway and procedural fairness. A decision a person can't raise with a human undermines that process." }] },
        ] },
    ],
  },
  {
    id: "privacy", name: "Privacy, Security & Safety",
    intro: "What data the tool touches, where it goes, and whether consent and protection are in place.",
    questions: [
      { id: "pr1", prompt: "What personal data does it collect or process?",
        help: "Loreto is bound by the Privacy Act and the NSW Health Records Act. Health and counselling data carry extra protection.",
        options: [
          { label: "None / de-identified only", weight: 0 },
          { label: "Limited, low-sensitivity personal info", weight: 1, mitigation: "Minimise data and confirm it's handled within approved systems." },
          { label: "Sensitive data (records, health, behavioural, biometric)", weight: 2, mitigation: "Keep sensitive, health and pastoral data out of AI tools unless expressly approved.",
            policyFlags: [{ policy: "Privacy Policy (Oct 2025) · NSW Health Records Act · Child Protection Policy", severity: "hard_stop",
              message: "Health and counselling data is doubly protected, and child-protection records must be kept secure and accessed only by the Principal/delegate. Feeding either into an AI tool conflicts." }] },
        ] },
      { id: "pr2", prompt: "Where is data stored, and is it used to train the vendor's models?", gate: true, naEligible: true,
        help: "N/A only if no personal data is involved. Loreto permits approved overseas cloud (e.g. Microsoft 365) — but not training on its data.",
        options: [
          { label: "AU-hosted or approved cloud; excluded from training", weight: 0 },
          { label: "Unclear, or offshore but compliant", weight: 1, mitigation: "Confirm in writing where data goes and that it's excluded from training." },
          { label: "Used for training / unknown / unacceptable terms", weight: 2, mitigation: "Choose an edu-tier product that contractually excludes your data from model training.",
            policyFlags: [{ policy: "Privacy Policy (Oct 2025) — AI systems & overseas storage", severity: "hard_stop",
              message: "Loreto permits third-party AI to store or access data to provide the service — not to train the vendor's models. Training is a secondary use beyond the stated purpose." }] },
        ] },
      { id: "pr3", prompt: "Is consent & notification handled correctly (parental consent for minors where required)?", gate: true, naEligible: true,
        help: "N/A only for staff-only / adult-user tools. For under-16s, treat consent as a hard requirement.",
        options: [
          { label: "Yes — in place", weight: 0 },
          { label: "Partial", weight: 1, mitigation: "Complete consent and notification before go-live." },
          { label: "No", weight: 2, mitigation: "Put parental consent and notification in place before any use with students.",
            policyFlags: [{ policy: "Standard Collection Notice (Apr 2024) · Privacy Policy (Oct 2025)", severity: "hard_stop",
              message: "The Collection Notice families received (Apr 2024) predates the AI update — so families may not have been notified of AI use. Confirm consent/notification, especially for minors." }] },
        ] },
      { id: "pr4", prompt: "Has the vendor been security-assessed (e.g. Safer Technologies for Schools / ST4S)?", naEligible: true,
        help: "N/A only if built fully in-house with no third-party AI vendor.",
        options: [
          { label: "Yes — passed", weight: 0 },
          { label: "In progress", weight: 1, mitigation: "Complete the security assessment before full rollout." },
          { label: "No assessment", weight: 2, mitigation: "Run a vendor security assessment before any use with personal data." },
        ] },
    ],
  },
];

const ALL_QUESTIONS = PILLARS.flatMap((p) => p.questions.map((q) => ({ ...q, pillarId: p.id, pillarName: p.name })));

/* ============================================================================ */
function bandFor(avg) {
  if (avg == null) return "not_assessed";
  if (avg <= 0.66) return "low";
  if (avg <= 1.33) return "moderate";
  return "high";
}

function computeResults(profile, answers) {
  const pillars = PILLARS.map((p) => {
    const scored = p.questions.map((q) => answers[q.id]).filter((a) => a && a.type === "scored");
    const avg = scored.length ? scored.reduce((s, a) => s + a.weight, 0) / scored.length : null;
    return { id: p.id, name: p.name, band: bandFor(avg) };
  });

  const allScored = ALL_QUESTIONS.map((q) => answers[q.id]).filter((a) => a && a.type === "scored");
  const overallAvg = allScored.length ? allScored.reduce((s, a) => s + a.weight, 0) / allScored.length : null;
  const overallBand = bandFor(overallAvg);

  const flagged = [], investigate = [], naList = [], policyFlags = [];
  let gateRed = false, gateAmber = false, hardStop = false;

  ALL_QUESTIONS.forEach((q) => {
    const a = answers[q.id];
    if (!a) return;
    if (a.type === "investigate") { investigate.push({ pillar: q.pillarName, prompt: q.prompt }); return; }
    if (a.type === "na") { naList.push({ pillar: q.pillarName, prompt: q.prompt }); return; }
    if (a.weight >= 1) {
      flagged.push({ pillar: q.pillarName, prompt: q.prompt, answer: a.label, mitigation: a.mitigation, severity: a.weight });
      if (q.gate && a.weight === 2) gateRed = true;
      if (q.gate && a.weight === 1) gateAmber = true;
    }
    if (a.policyFlags) a.policyFlags.forEach((f) => {
      policyFlags.push({ ...f, pillar: q.pillarName, prompt: q.prompt, answer: a.label });
      if (f.severity === "hard_stop") hardStop = true;
    });
  });

  if (profile.toolStatus === "New or trial") {
    policyFlags.push({
      policy: "Privacy Policy (Oct 2025) — sanctioned AI envelope", severity: "flag",
      pillar: "Project profile", prompt: "Tool status", answer: "New or trial",
      message: "This tool sits outside Loreto's approved AI envelope. New or self-sourced tools warrant closer scrutiny and IT/governance sign-off before handling personal data.",
    });
  }

  const hasInvestigate = investigate.length > 0;
  let recommendation;
  if (hardStop || gateRed || overallBand === "high") recommendation = "hold";
  else if (overallBand === "moderate" || gateAmber || hasInvestigate || flagged.length > 0 || policyFlags.length > 0) recommendation = "conditions";
  else recommendation = "proceed";

  return { pillars, overallBand, recommendation, flagged, investigate, naList, policyFlags };
}

const REC = {
  proceed: { tag: "Proceed", color: "#2E7D5B", line: "This use case looks well-managed. Keep the documented record and hold the named owner accountable." },
  conditions: { tag: "Proceed with conditions", color: "#C58A1B", line: "This can go ahead once the conditions and open items below are addressed." },
  hold: { tag: "Hold & escalate", color: "#B23B3B", line: "This needs governance review before proceeding. The items below must be resolved or escalated." },
};

/* ============================================================================ */
const css = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Lato:wght@400;500;700;900&display=swap');
* { box-sizing: border-box; }
.ch-app { font-family: 'Lato', system-ui, sans-serif; color: ${CHENEVAL.char}; background: ${CHENEVAL.off}; min-height: 100vh; line-height: 1.55; }
.ch-wrap { max-width: 880px; margin: 0 auto; padding: 0 24px; }
.ch-bar { background: ${CHENEVAL.navy}; padding: 22px 0 18px; }
.ch-bar .ch-wrap { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; }
.ch-mark .name { font-family: 'Cormorant Garamond', serif; font-weight: 600; font-size: 30px; letter-spacing: 7px; color: ${CHENEVAL.off}; line-height: 1; }
.ch-mark .sub { font-size: 11px; letter-spacing: 6px; color: ${CHENEVAL.gold}; font-weight: 500; margin-top: 4px; }
.ch-bar .ctx { color: #AEB7C7; font-size: 12px; letter-spacing: 1px; text-align: right; line-height: 1.4; }
.ch-bar .ctx b { color: ${CHENEVAL.off}; font-weight: 700; }
.ch-prog { background: ${CHENEVAL.navy}; padding: 0 0 16px; }
.ch-prog .ch-wrap { display: flex; align-items: center; gap: 14px; }
.ch-prog .track { flex: 1; height: 3px; background: #24395A; border-radius: 2px; overflow: hidden; }
.ch-prog .fill { height: 100%; background: ${CHENEVAL.gold}; transition: width .35s ease; }
.ch-prog .lbl { color: #AEB7C7; font-size: 11px; letter-spacing: 1px; white-space: nowrap; }
.ch-card { background: #fff; border: 1px solid #E7E2D6; border-radius: 4px; padding: 30px; margin: 26px 0; }
.ch-eyebrow { font-size: 11px; letter-spacing: 3px; color: ${CHENEVAL.gold}; font-weight: 700; text-transform: uppercase; }
h1.ch-h { font-family: 'Cormorant Garamond', serif; font-weight: 600; color: ${CHENEVAL.navy}; font-size: 40px; line-height: 1.1; margin: 10px 0 6px; }
h2.ch-h { font-family: 'Cormorant Garamond', serif; font-weight: 600; color: ${CHENEVAL.navy}; font-size: 30px; margin: 4px 0 6px; }
.ch-lead { color: ${CHENEVAL.slate}; font-size: 16px; }
.ch-gold-rule { width: 46px; height: 2px; background: ${CHENEVAL.gold}; margin: 16px 0; }
.ch-intro p { margin: 14px 0; }
.ch-intro h3 { font-size: 13px; letter-spacing: 1.5px; text-transform: uppercase; color: ${CHENEVAL.navy}; margin: 26px 0 10px; }
.ch-list { margin: 0; padding: 0; list-style: none; }
.ch-list li { position: relative; padding: 6px 0 6px 22px; color: ${CHENEVAL.char}; }
.ch-list li:before { content: ""; position: absolute; left: 0; top: 14px; width: 7px; height: 7px; background: ${CHENEVAL.gold}; border-radius: 50%; }
.ch-field { margin: 20px 0; }
.ch-field label { display: block; font-weight: 700; color: ${CHENEVAL.navy}; font-size: 15px; }
.ch-field .fhelp { color: ${CHENEVAL.slate}; font-size: 13px; margin: 3px 0 9px; }
.ch-input, .ch-textarea, .ch-select { width: 100%; border: 1px solid #CFCABA; border-radius: 3px; padding: 11px 13px; font-family: inherit; font-size: 15px; color: ${CHENEVAL.char}; background: #fff; }
.ch-textarea { min-height: 78px; resize: vertical; }
.ch-input:focus, .ch-textarea:focus, .ch-select:focus { outline: 2px solid ${CHENEVAL.gold}; outline-offset: 1px; border-color: ${CHENEVAL.gold}; }
.ch-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.ch-chip { border: 1px solid #CFCABA; background: #fff; border-radius: 999px; padding: 8px 14px; font-size: 13px; cursor: pointer; color: ${CHENEVAL.char}; font-family: inherit; }
.ch-chip.on { background: ${CHENEVAL.navy}; color: #fff; border-color: ${CHENEVAL.navy}; }
.ch-chip:focus-visible { outline: 2px solid ${CHENEVAL.gold}; }
.ch-pillar-head { display: flex; align-items: baseline; gap: 12px; }
.ch-pillar-num { font-family: 'Cormorant Garamond', serif; font-size: 30px; color: ${CHENEVAL.gold}; font-weight: 700; }
.ch-q { margin: 26px 0; padding-top: 22px; border-top: 1px solid #ECE7DB; }
.ch-q.first { border-top: 0; padding-top: 4px; }
.ch-q .qp { font-weight: 700; color: ${CHENEVAL.navy}; font-size: 16px; display: flex; gap: 8px; }
.ch-gate { font-size: 10px; letter-spacing: 1px; background: #FBEEDB; color: #9A6B12; border: 1px solid #E9D2A6; padding: 2px 7px; border-radius: 3px; font-weight: 700; white-space: nowrap; align-self: center; }
.ch-q .qhelp { color: ${CHENEVAL.slate}; font-size: 13.5px; margin: 5px 0 12px; }
.ch-opts { display: grid; gap: 8px; }
.ch-opt { text-align: left; border: 1px solid #D6D1C2; background: #fff; border-radius: 4px; padding: 12px 14px; font-family: inherit; font-size: 14.5px; cursor: pointer; color: ${CHENEVAL.char}; display: flex; align-items: center; gap: 11px; }
.ch-opt:hover { border-color: ${CHENEVAL.gold}; }
.ch-opt:focus-visible { outline: 2px solid ${CHENEVAL.gold}; }
.ch-opt .dot { width: 14px; height: 14px; border-radius: 50%; border: 2px solid #B9B3A2; flex: 0 0 auto; }
.ch-opt.on { border-color: ${CHENEVAL.navy}; background: #FBFAF6; box-shadow: inset 0 0 0 1px ${CHENEVAL.navy}; }
.ch-opt.on .dot { border-color: ${CHENEVAL.navy}; background: ${CHENEVAL.navy}; }
.ch-opt.alt { font-size: 13.5px; color: ${CHENEVAL.slate}; }
.ch-opt.alt.on { color: ${CHENEVAL.navy}; }
.ch-nav { display: flex; justify-content: space-between; gap: 12px; margin: 8px 0 50px; align-items: flex-end; }
.ch-btn { font-family: inherit; font-size: 14px; font-weight: 700; letter-spacing: .5px; padding: 13px 26px; border-radius: 3px; cursor: pointer; border: 1px solid transparent; }
.ch-btn.primary { background: ${CHENEVAL.navy}; color: #fff; }
.ch-btn.primary:hover { background: #16335A; }
.ch-btn.primary:disabled { background: #9AA3B2; cursor: not-allowed; }
.ch-btn.ghost { background: transparent; color: ${CHENEVAL.navy}; border-color: #C7C1B1; }
.ch-btn.gold { background: ${CHENEVAL.gold}; color: ${CHENEVAL.navy}; }
.ch-btn.gold:hover { background: #B8975F; }
.ch-btn:focus-visible { outline: 2px solid ${CHENEVAL.gold}; outline-offset: 2px; }
.ch-hint { color: ${CHENEVAL.slate}; font-size: 12.5px; }
.lr { background: #fff; border: 1px solid ${LORETO.rule}; border-radius: 4px; overflow: hidden; margin: 26px 0; }
.lr-band { background: ${LORETO.navy}; color: #fff; padding: 24px 30px; display: flex; align-items: center; gap: 16px; }
.lr-mono { width: 46px; height: 46px; border: 2px solid #fff; display: flex; align-items: center; justify-content: center; font-family: 'Cormorant Garamond', serif; font-weight: 700; font-size: 22px; letter-spacing: 1px; flex: 0 0 auto; }
.lr-band .nm { font-family: 'Cormorant Garamond', serif; font-size: 25px; font-weight: 600; line-height: 1.1; }
.lr-band .ti { font-size: 11px; letter-spacing: 2px; color: #C3CAE0; margin-top: 3px; text-transform: uppercase; }
.lr-body { padding: 28px 30px; color: ${LORETO.ink}; }
.lr-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; border: 1px solid ${LORETO.rule}; border-radius: 3px; padding: 14px 18px; margin-bottom: 22px; }
.lr-meta div { font-size: 13px; }
.lr-meta b { color: ${LORETO.navy}; display: block; font-size: 11px; letter-spacing: .5px; text-transform: uppercase; }
.lr-rec { border-left: 4px solid; padding: 14px 18px; border-radius: 0 3px 3px 0; margin-bottom: 24px; background: #FAFBFD; }
.lr-rec .rt { font-family: 'Cormorant Garamond', serif; font-size: 26px; font-weight: 700; }
.lr-h { font-family: 'Cormorant Garamond', serif; color: ${LORETO.navy}; font-size: 21px; font-weight: 600; margin: 26px 0 12px; padding-bottom: 6px; border-bottom: 2px solid ${LORETO.navy}; }
.lr-bars { display: grid; gap: 9px; }
.lr-bar { display: grid; grid-template-columns: 180px 1fr 84px; align-items: center; gap: 12px; font-size: 13px; }
.lr-bar .tr { height: 9px; background: #EDEFF4; border-radius: 5px; overflow: hidden; }
.lr-bar .fl { height: 100%; border-radius: 5px; }
.lr-bar .bl { font-size: 11px; font-weight: 700; text-align: right; letter-spacing: .5px; }
.lr-item { border: 1px solid ${LORETO.rule}; border-radius: 3px; padding: 12px 15px; margin: 9px 0; }
.lr-item .ip { font-size: 11px; letter-spacing: .5px; text-transform: uppercase; color: ${LORETO.navy}; font-weight: 700; }
.lr-item .ia { font-weight: 700; margin: 3px 0; font-size: 14px; }
.lr-item .im { font-size: 13px; color: #4A5160; }
.lr-policy { border: 1px solid #E5C9C9; background: #FCF6F6; border-radius: 3px; padding: 12px 15px; margin: 9px 0; }
.lr-policy .pp { font-size: 12px; font-weight: 700; color: #8B2F2F; }
.lr-policy .pm { font-size: 13px; color: #4A5160; margin-top: 3px; }
.lr-policy .pq { font-size: 12px; color: #6A7180; margin-top: 5px; font-style: italic; }
.lr-check { list-style: none; padding: 0; margin: 0; }
.lr-check li { padding: 7px 0 7px 26px; position: relative; font-size: 14px; border-bottom: 1px solid #EEF0F4; }
.lr-check li:before { content: "\\2610"; position: absolute; left: 4px; top: 6px; color: ${LORETO.navy}; }
.lr-foot { border-top: 2px solid ${LORETO.navy}; margin-top: 26px; padding-top: 14px; font-size: 11px; color: #6A7180; }
.lr-foot .vals { font-family: 'Cormorant Garamond', serif; color: ${LORETO.navy}; font-size: 14px; letter-spacing: 1px; }
@media (max-width: 620px) {
  h1.ch-h { font-size: 32px; }
  .lr-meta { grid-template-columns: 1fr; }
  .lr-bar { grid-template-columns: 110px 1fr 64px; gap: 8px; }
  .ch-bar .ctx { display: none; }
}
@media print { .ch-bar, .ch-prog, .ch-nav, .no-print { display: none !important; } .ch-app { background: #fff; } .lr { border: none; margin: 0; } }
`;

/* ============================================================================ */
function esc(s) { return String(s == null ? "" : s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c])); }

function generateReportHTML(profile, results, dateStr) {
  const rec = REC[results.recommendation];
  const meta = [
    ["Use case", profile.useCase], ["Accountable owner", profile.owner],
    ["Primary users", profile.primaryUsers], ["Function area", profile.functionArea],
    ["Tool & vendor", profile.tool], ["Assessed", dateStr],
  ];
  const bars = results.pillars.map((p) => {
    const st = STATUS[p.band];
    const pct = p.band === "not_assessed" ? 0 : p.band === "low" ? 33 : p.band === "moderate" ? 66 : 100;
    return `<div class="lr-bar"><span>${esc(p.name)}</span><span class="tr"><span class="fl" style="width:${pct}%;background:${st.color}"></span></span><span class="bl" style="color:${st.color}">${st.label}</span></div>`;
  }).join("");
  const flagged = results.flagged.length ? results.flagged.map((f) =>
    `<div class="lr-item"><div class="ip">${esc(f.pillar)}</div><div class="ia">${esc(f.answer)}</div><div class="im"><b>Fix:</b> ${esc(f.mitigation || "Review with the owner.")}</div></div>`).join("")
    : `<p style="font-size:13px;color:#4A5160">No specific risks flagged.</p>`;
  const policies = results.policyFlags.length ? `<h2 class="lr-h">Policy flags — Loreto Normanhurst</h2>` + results.policyFlags.map((p) =>
    `<div class="lr-policy"><div class="pp">${esc(p.policy)}${p.severity === "hard_stop" ? " · requires sign-off" : ""}</div><div class="pm">${esc(p.message)}</div><div class="pq">Triggered by: ${esc(p.answer)} (${esc(p.pillar)})</div></div>`).join("") : "";
  const investigate = results.investigate.length ? `<h2 class="lr-h">Open items to investigate</h2><ul class="lr-check">` +
    results.investigate.map((i) => `<li>${esc(i.prompt)} <span style="color:#8A93A6">(${esc(i.pillar)})</span></li>`).join("") + `</ul>` : "";
  const conditions = [...results.flagged.map((f) => f.mitigation), ...(results.investigate.length ? ["Resolve the open items listed above."] : [])].filter(Boolean);
  const condBlock = results.recommendation !== "proceed" && conditions.length
    ? `<h2 class="lr-h">Conditions to proceed</h2><ul class="lr-check">${conditions.map((m) => `<li>${esc(m)}</li>`).join("")}</ul>` : "";
  const naNote = results.naList.length ? ` Marked not applicable: ${results.naList.map((n) => esc(n.prompt)).join("; ")}.` : "";

  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>AI Governance Assessment — ${esc(profile.useCase || "Use case")}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Lato:wght@400;700&display=swap');
body{font-family:'Lato',system-ui,sans-serif;color:${LORETO.ink};margin:0;background:#EEF0F4;padding:24px}
.lr{max-width:820px;margin:0 auto;background:#fff;border-radius:4px;overflow:hidden;box-shadow:0 2px 14px rgba(0,0,0,.08)}
.lr-band{background:${LORETO.navy};color:#fff;padding:24px 30px;display:flex;align-items:center;gap:16px}
.lr-mono{width:46px;height:46px;border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',serif;font-weight:700;font-size:22px;flex:0 0 auto}
.lr-band .nm{font-family:'Cormorant Garamond',serif;font-size:25px;font-weight:600;line-height:1.1}
.lr-band .ti{font-size:11px;letter-spacing:2px;color:#C3CAE0;margin-top:3px;text-transform:uppercase}
.lr-body{padding:28px 30px}
.lr-meta{display:grid;grid-template-columns:1fr 1fr;gap:8px 24px;border:1px solid ${LORETO.rule};border-radius:3px;padding:14px 18px;margin-bottom:22px}
.lr-meta div{font-size:13px}.lr-meta b{color:${LORETO.navy};display:block;font-size:11px;letter-spacing:.5px;text-transform:uppercase}
.lr-rec{border-left:4px solid ${rec.color};padding:14px 18px;border-radius:0 3px 3px 0;margin-bottom:24px;background:#FAFBFD}
.lr-rec .rt{font-family:'Cormorant Garamond',serif;font-size:26px;font-weight:700;color:${rec.color}}
.lr-h{font-family:'Cormorant Garamond',serif;color:${LORETO.navy};font-size:21px;font-weight:600;margin:26px 0 12px;padding-bottom:6px;border-bottom:2px solid ${LORETO.navy}}
.lr-bar{display:grid;grid-template-columns:180px 1fr 84px;align-items:center;gap:12px;font-size:13px;margin:9px 0}
.lr-bar .tr{height:9px;background:#EDEFF4;border-radius:5px;overflow:hidden}.lr-bar .fl{height:100%;border-radius:5px}
.lr-bar .bl{font-size:11px;font-weight:700;text-align:right}
.lr-item{border:1px solid ${LORETO.rule};border-radius:3px;padding:12px 15px;margin:9px 0}
.lr-item .ip{font-size:11px;letter-spacing:.5px;text-transform:uppercase;color:${LORETO.navy};font-weight:700}
.lr-item .ia{font-weight:700;margin:3px 0;font-size:14px}.lr-item .im{font-size:13px;color:#4A5160}
.lr-policy{border:1px solid #E5C9C9;background:#FCF6F6;border-radius:3px;padding:12px 15px;margin:9px 0}
.lr-policy .pp{font-size:12px;font-weight:700;color:#8B2F2F}.lr-policy .pm{font-size:13px;color:#4A5160;margin-top:3px}
.lr-policy .pq{font-size:12px;color:#6A7180;margin-top:5px;font-style:italic}
.lr-check{list-style:none;padding:0;margin:0}.lr-check li{padding:7px 0 7px 26px;position:relative;font-size:14px;border-bottom:1px solid #EEF0F4}
.lr-check li:before{content:"\\2610";position:absolute;left:4px;top:6px;color:${LORETO.navy}}
.lr-foot{border-top:2px solid ${LORETO.navy};margin-top:26px;padding-top:14px;font-size:11px;color:#6A7180}
.lr-foot .vals{font-family:'Cormorant Garamond',serif;color:${LORETO.navy};font-size:14px;letter-spacing:1px}
@media(max-width:600px){.lr-meta{grid-template-columns:1fr}.lr-bar{grid-template-columns:110px 1fr 64px}}
</style></head><body>
<div class="lr">
  <div class="lr-band"><div class="lr-mono">${esc(LORETO.monogram)}</div><div><div class="nm">${esc(LORETO.name)}</div><div class="ti">AI Use Case Governance Assessment</div></div></div>
  <div class="lr-body">
    <div class="lr-meta">${meta.map(([k, v]) => `<div><b>${esc(k)}</b>${esc(v || "—")}</div>`).join("")}</div>
    <div class="lr-rec"><div class="rt">${esc(rec.tag)}</div><div style="font-size:14px;color:#4A5160;margin-top:4px">${esc(rec.line)}</div></div>
    <h2 class="lr-h">Risk profile</h2><div>${bars}</div>
    <h2 class="lr-h">Flagged risks &amp; fixes</h2>${flagged}
    ${policies}
    ${investigate}
    ${condBlock}
    <div class="lr-foot"><div class="vals">${esc(LORETO.values)}</div>
    <p style="margin:10px 0 0">Generated by ${esc(CHENEVAL.name)} ${esc(CHENEVAL.sub)} · ${esc(dateStr)}. This assessment supports decision-making and does not replace formal legal, privacy, or governance sign-off.${esc(naNote)}</p></div>
  </div>
</div></body></html>`;
}

/* ============================================================================ */
export default function App() {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState({ data: [] });
  const [answers, setAnswers] = useState({});
  const topRef = useRef(null);

  const totalSteps = 2 + PILLARS.length;
  const goTo = (n) => { setStep(n); requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })); };

  const results = useMemo(() => computeResults(profile, answers), [profile, answers]);

  const setAns = (q, opt, type) => {
    setAnswers((prev) => ({
      ...prev,
      [q.id]: type === "investigate" ? { type: "investigate", label: "Needs investigation" }
        : type === "na" ? { type: "na", label: "Not applicable" }
        : { type: "scored", weight: opt.weight, label: opt.label, mitigation: opt.mitigation, policyFlags: opt.policyFlags },
    }));
  };

  const profileValid = profile.useCase && profile.owner && profile.primaryUsers && profile.tool;
  const currentPillar = step >= 2 && step < 2 + PILLARS.length ? PILLARS[step - 2] : null;
  const pillarComplete = currentPillar ? currentPillar.questions.every((q) => answers[q.id]) : true;

  const download = () => {
    const dateStr = new Date().toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" });
    const html = generateReportHTML(profile, results, dateStr);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Loreto-AI-Assessment-${(profile.useCase || "report").replace(/[^a-z0-9]+/gi, "-")}.html`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

  const progressPct = step === 0 ? 4 : Math.round((step / totalSteps) * 100);

  return (
    <div className="ch-app">
      <style>{css}</style>

      <div className="ch-bar" ref={topRef}>
        <div className="ch-wrap">
          <div className="ch-mark">
            <div className="name">{CHENEVAL.name}</div>
            <div className="sub">{CHENEVAL.sub}</div>
          </div>
          <div className="ctx">PREPARED FOR<br /><b>{LORETO.name}</b></div>
        </div>
      </div>

      {step < 2 + PILLARS.length && (
        <div className="ch-prog">
          <div className="ch-wrap">
            <div className="track"><div className="fill" style={{ width: `${progressPct}%` }} /></div>
            <div className="lbl">{step === 0 ? "Overview" : step === 1 ? "Step 1 · Project profile" : `Step ${step} · ${currentPillar?.name}`}</div>
          </div>
        </div>
      )}

      <div className="ch-wrap">
        {step === 0 && (
          <div className="ch-card ch-intro">
            <div className="ch-eyebrow">{CHENEVAL.name} {CHENEVAL.sub} · {CHENEVAL.tagline}</div>
            <h1 className="ch-h">AI Use Case Governance Assessment</h1>
            <p className="ch-lead">A short, structured way to check an AI tool or use case before it's adopted — mapped to the Australian Framework for Generative AI in Schools and to Loreto Normanhurst's own policies.</p>
            <div className="ch-gold-rule" />
            <p><b>Why it's here.</b> AI risk is what stalls good ideas. This isn't a gate to slow you down — it surfaces what to check, shows where the risks sit, and gives you a documented, defensible record to attach to a decision. The goal is to help you say yes safely.</p>
            <h3>Before you begin</h3>
            <ul className="ch-list">
              <li>Have a specific use case in mind — one tool, one purpose.</li>
              <li>Name an accountable owner (a person, not a team).</li>
              <li>Know roughly what data it touches and which tool or vendor is involved.</li>
              <li>Answer for how the tool will <i>actually</i> be used — not how you hope it'll be used.</li>
              <li>Set aside about 10–15 minutes.</li>
            </ul>
            <h3>How the scoring works</h3>
            <p>Most questions offer three answers, scored low to high risk. Two extra options matter:</p>
            <ul className="ch-list">
              <li><b>Needs investigation</b> — if you genuinely don't know. It won't count against your score; it's logged as a follow-up. This is a thinking tool, not a test.</li>
              <li><b>N/A</b> — on some questions, where the topic truly doesn't apply.</li>
            </ul>
            <p>Some questions are <b>critical gates</b>: a high-risk answer there means the use case can't be cleared without review, however well it scores elsewhere.</p>
            <h3>What you'll get</h3>
            <p>An on-screen report you can download, in Loreto Normanhurst branding, with an overall rating, a clear recommendation, a risk profile across six areas, specific risks with suggested fixes, and any flags against Loreto's policies.</p>
            <div className="ch-nav" style={{ marginTop: 30 }}>
              <span />
              <button className="ch-btn primary" onClick={() => goTo(1)}>Begin assessment →</button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="ch-card">
            <div className="ch-eyebrow">Step 1 of {1 + PILLARS.length}</div>
            <h2 className="ch-h">Project profile</h2>
            <p className="ch-lead">There are no wrong answers here — this shapes which risks the tool checks for.</p>
            <div className="ch-gold-rule" />
            {PROFILE_FIELDS.map((f) => (
              <div className="ch-field" key={f.id}>
                <label htmlFor={f.id}>{f.label}</label>
                <div className="fhelp">{f.help}</div>
                {f.type === "text" && <input id={f.id} className="ch-input" placeholder={f.placeholder} value={profile[f.id] || ""} onChange={(e) => setProfile({ ...profile, [f.id]: e.target.value })} />}
                {f.type === "textarea" && <textarea id={f.id} className="ch-textarea" placeholder={f.placeholder} value={profile[f.id] || ""} onChange={(e) => setProfile({ ...profile, [f.id]: e.target.value })} />}
                {f.type === "select" && (
                  <select id={f.id} className="ch-select" value={profile[f.id] || ""} onChange={(e) => setProfile({ ...profile, [f.id]: e.target.value })}>
                    <option value="">Select…</option>
                    {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                )}
                {f.type === "multi" && (
                  <>
                    <div className="ch-chips">
                      {f.options.map((o) => {
                        const on = (profile[f.id] || []).includes(o);
                        return <button key={o} type="button" className={`ch-chip ${on ? "on" : ""}`}
                          onClick={() => setProfile({ ...profile, [f.id]: on ? (profile[f.id] || []).filter((x) => x !== o) : [...(profile[f.id] || []), o] })}>{o}</button>;
                      })}
                    </div>
                    {(profile[f.id] || []).includes("Other") && (
                      <input className="ch-input" style={{ marginTop: 10 }} placeholder="Describe the other data involved"
                        value={profile[f.id + "Other"] || ""} onChange={(e) => setProfile({ ...profile, [f.id + "Other"]: e.target.value })} />
                    )}
                  </>
                )}
              </div>
            ))}
            <div className="ch-nav">
              <button className="ch-btn ghost" onClick={() => goTo(0)}>← Back</button>
              <div style={{ textAlign: "right" }}>
                {!profileValid && <div className="ch-hint" style={{ marginBottom: 8 }}>Add a use case name, owner, primary users and tool to continue.</div>}
                <button className="ch-btn primary" disabled={!profileValid} onClick={() => goTo(2)}>Continue →</button>
              </div>
            </div>
          </div>
        )}

        {currentPillar && (
          <div className="ch-card">
            <div className="ch-eyebrow">Area {step - 1} of {PILLARS.length}</div>
            <div className="ch-pillar-head">
              <span className="ch-pillar-num">{String(step - 1).padStart(2, "0")}</span>
              <h2 className="ch-h" style={{ margin: 0 }}>{currentPillar.name}</h2>
            </div>
            <p className="ch-lead" style={{ marginTop: 8 }}>{currentPillar.intro}</p>
            <div className="ch-gold-rule" />
            {currentPillar.questions.map((q, qi) => {
              const a = answers[q.id];
              return (
                <div className={`ch-q ${qi === 0 ? "first" : ""}`} key={q.id}>
                  <div className="qp"><span>{q.prompt}</span>{q.gate && <span className="ch-gate">CRITICAL GATE</span>}</div>
                  <div className="qhelp">{q.help}</div>
                  <div className="ch-opts">
                    {q.options.map((opt) => {
                      const on = a && a.type === "scored" && a.label === opt.label;
                      return <button key={opt.label} className={`ch-opt ${on ? "on" : ""}`} onClick={() => setAns(q, opt, "scored")}><span className="dot" />{opt.label}</button>;
                    })}
                    <button className={`ch-opt alt ${a && a.type === "investigate" ? "on" : ""}`} onClick={() => setAns(q, null, "investigate")}><span className="dot" />Needs investigation</button>
                    {q.naEligible && <button className={`ch-opt alt ${a && a.type === "na" ? "on" : ""}`} onClick={() => setAns(q, null, "na")}><span className="dot" />N/A — doesn't apply</button>}
                  </div>
                </div>
              );
            })}
            <div className="ch-nav">
              <button className="ch-btn ghost" onClick={() => goTo(step - 1)}>← Back</button>
              <div style={{ textAlign: "right" }}>
                {!pillarComplete && <div className="ch-hint" style={{ marginBottom: 8 }}>Answer every question to continue.</div>}
                <button className="ch-btn primary" disabled={!pillarComplete} onClick={() => goTo(step + 1)}>
                  {step + 1 < 2 + PILLARS.length ? "Continue →" : "Generate report →"}
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 2 + PILLARS.length && (
          <ReportView profile={profile} results={results} onDownload={download} onPrint={() => window.print()} onRestart={() => { setAnswers({}); setProfile({ data: [] }); goTo(0); }} />
        )}
      </div>
    </div>
  );
}

/* ============================================================================ */
function ReportView({ profile, results, onDownload, onPrint, onRestart }) {
  const rec = REC[results.recommendation];
  const dateStr = new Date().toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" });
  const meta = [
    ["Use case", profile.useCase], ["Accountable owner", profile.owner],
    ["Primary users", profile.primaryUsers], ["Function area", profile.functionArea],
    ["Tool & vendor", profile.tool], ["Assessed", dateStr],
  ];
  const conditions = [...results.flagged.map((f) => f.mitigation), ...(results.investigate.length ? ["Resolve the open items listed below."] : [])].filter(Boolean);

  return (
    <>
      <div className="ch-card no-print" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div className="ch-eyebrow">Assessment complete</div>
          <h2 className="ch-h" style={{ margin: "4px 0 0", fontSize: 28 }}>Your report</h2>
          <p className="ch-hint" style={{ marginTop: 4 }}>Review below, then download or print to PDF for your governance record.</p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="ch-btn gold" onClick={onDownload}>Download report</button>
          <button className="ch-btn ghost" onClick={onPrint}>Print / Save as PDF</button>
          <button className="ch-btn ghost" onClick={onRestart}>New assessment</button>
        </div>
      </div>

      <div className="lr">
        <div className="lr-band">
          <div className="lr-mono">{LORETO.monogram}</div>
          <div>
            <div className="nm">{LORETO.name}</div>
            <div className="ti">AI Use Case Governance Assessment</div>
          </div>
        </div>
        <div className="lr-body">
          <div className="lr-meta">{meta.map(([k, v]) => <div key={k}><b>{k}</b>{v || "—"}</div>)}</div>

          <div className="lr-rec" style={{ borderColor: rec.color }}>
            <div className="rt" style={{ color: rec.color }}>{rec.tag}</div>
            <div style={{ fontSize: 14, color: "#4A5160", marginTop: 4 }}>{rec.line}</div>
          </div>

          <h2 className="lr-h">Risk profile</h2>
          <div className="lr-bars">
            {results.pillars.map((p) => {
              const st = STATUS[p.band];
              const pct = p.band === "not_assessed" ? 0 : p.band === "low" ? 33 : p.band === "moderate" ? 66 : 100;
              return (
                <div className="lr-bar" key={p.id}>
                  <span>{p.name}</span>
                  <span className="tr"><span className="fl" style={{ width: `${pct}%`, background: st.color }} /></span>
                  <span className="bl" style={{ color: st.color }}>{st.label}</span>
                </div>
              );
            })}
          </div>

          <h2 className="lr-h">Flagged risks &amp; fixes</h2>
          {results.flagged.length ? results.flagged.map((f, i) => (
            <div className="lr-item" key={i}>
              <div className="ip">{f.pillar}</div>
              <div className="ia">{f.answer}</div>
              <div className="im"><b>Fix:</b> {f.mitigation || "Review with the owner."}</div>
            </div>
          )) : <p style={{ fontSize: 13, color: "#4A5160" }}>No specific risks flagged.</p>}

          {results.policyFlags.length > 0 && (
            <>
              <h2 className="lr-h">Policy flags — Loreto Normanhurst</h2>
              {results.policyFlags.map((p, i) => (
                <div className="lr-policy" key={i}>
                  <div className="pp">{p.policy}{p.severity === "hard_stop" ? " · requires sign-off" : ""}</div>
                  <div className="pm">{p.message}</div>
                  <div className="pq">Triggered by: {p.answer} ({p.pillar})</div>
                </div>
              ))}
            </>
          )}

          {results.investigate.length > 0 && (
            <>
              <h2 className="lr-h">Open items to investigate</h2>
              <ul className="lr-check">{results.investigate.map((i, k) => <li key={k}>{i.prompt} <span style={{ color: "#8A93A6" }}>({i.pillar})</span></li>)}</ul>
            </>
          )}

          {results.recommendation !== "proceed" && conditions.length > 0 && (
            <>
              <h2 className="lr-h">Conditions to proceed</h2>
              <ul className="lr-check">{conditions.map((c, i) => <li key={i}>{c}</li>)}</ul>
            </>
          )}

          <div className="lr-foot">
            <div className="vals">{LORETO.values}</div>
            <p style={{ margin: "10px 0 0" }}>
              Generated by {CHENEVAL.name} {CHENEVAL.sub} · {dateStr}. This assessment supports decision-making and does not replace formal legal, privacy, or governance sign-off.
              {results.naList.length > 0 && ` Marked not applicable: ${results.naList.map((n) => n.prompt).join("; ")}.`}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
