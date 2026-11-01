window.__ModuleLoader__.load({
	id: "dsh-workbench",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
// The Loader never fetches a sibling stylesheet, so this one ships inside
// the factory and installs on first evaluation.
{
  const css = "/* Workbench page: a centred column with its head row and the card grid. */\n\n._page_1j7x2_3 {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  gap: 24px;\n  box-sizing: border-box;\n  height: 100%;\n  overflow: auto;\n  padding: 0 clamp(24px, 4vw, 48px) 48px;\n  color: var(--dsw-alias-label-primary);\n}\n\n._page_1j7x2_3 > * {\n  width: 100%;\n  max-width: 1200px;\n}\n\n._pageHead_1j7x2_20 {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 16px;\n  box-sizing: border-box;\n  /* The page's top inset lives here so the strip above the content drags the window. */\n  padding-top: 28px;\n}\n\n[data-platform='darwin'] ._pageHead_1j7x2_20 {\n  padding-top: calc(28px + var(--dsh-frame-top-clearance, 0px));\n}\n\n._pageTitle_1j7x2_34 {\n  margin: 0;\n  font-size: 24px;\n  font-weight: 600;\n  line-height: 32px;\n  letter-spacing: -0.01em;\n}\n\n._pageIntro_1j7x2_42 {\n  margin: 6px 0 0;\n  font-size: 13px;\n  line-height: 20px;\n  color: var(--dsw-alias-label-secondary);\n}\n\n._notice_1j7x2_49 {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  font-size: 12px;\n  line-height: 18px;\n  color: var(--dsw-alias-label-secondary);\n}\n\n._empty_1j7x2_58 {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  gap: 8px;\n  padding: 64px 16px;\n  text-align: center;\n}\n\n._emptyTitle_1j7x2_67 {\n  margin: 0;\n  font-size: 15px;\n  font-weight: 500;\n  line-height: 22px;\n}\n\n._emptyBody_1j7x2_74 {\n  margin: 0;\n  font-size: 13px;\n  line-height: 20px;\n  color: var(--dsw-alias-label-secondary);\n}\n\n._grid_1j7x2_81 {\n  display: grid;\n  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));\n  gap: 24px;\n  align-content: start;\n}\n\n/* A cell is a one-track grid so whatever it holds fills it on both axes. A flex\n   container would size the child to its content along the main axis, which left the\n   cards narrow and the columns wide.\n   \n   The track is stated rather than left implicit: an implicit `auto` track sizes itself\n   from the item's content, so the creation tile — whose only content is a mark and a\n   short word — collapsed into a narrow column while the cards beside it stayed wide. */\n._cell_1j7x2_95 {\n  display: grid;\n  grid-template-columns: minmax(0, 1fr);\n  min-width: 0;\n}\n\n._createRoot_1j7x2_101 {\n  display: flex;\n  flex: 1 1 auto;\n  min-width: 0;\n}\n\n/* The creation entry is a grid tile, so it reads as the place cards come from\n   rather than as a toolbar action detached from the grid. */\n\n/* Same frame as a card, drawn as an outline: it belongs in the row of cards without\n   claiming to be one of them. */\n._createTile_1j7x2_112 {\n  display: flex;\n  flex: 1 1 auto;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  gap: 12px;\n  box-sizing: border-box;\n  width: 100%;\n  min-height: 168px;\n  padding: 16px 18px;\n  border: 1px dashed var(--dsw-alias-border-l1);\n  border-radius: 12px;\n  background: transparent;\n  color: var(--dsw-alias-label-secondary);\n  cursor: pointer;\n  font-size: 13px;\n  transition: border-color 0.15s ease, background 0.15s ease, color 0.15s ease,\n    transform 0.15s ease;\n}\n\n._createTile_1j7x2_112:hover {\n  border-color: var(--dsw-alias-brand-primary);\n  border-style: solid;\n  background: var(--dsw-alias-bg-layer-2);\n  color: var(--dsw-alias-label-primary);\n  transform: translateY(-1px);\n}\n\n/* The mark is what turns the tile from \"empty slot\" into \"entry\". Without it the\n   dashed box reads as something that failed to load. It is the size and shape of the\n   monogram every card carries, which is what makes the tile read as a peer of the cards\n   rather than as a hole in the grid. */\n._createMark_1j7x2_145 {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  width: 28px;\n  height: 28px;\n  border-radius: 9px;\n  /* Mixed from the label colour, not filled with a layer token: the light theme's layers\n     are all the same white as the tile, which would leave the mark with no shape. */\n  background: color-mix(in srgb, var(--dsw-alias-label-primary) 6%, transparent);\n  font-size: 16px;\n  line-height: 1;\n  color: var(--dsw-alias-label-tertiary);\n  transition: background 0.15s ease, color 0.15s ease;\n}\n\n._createTile_1j7x2_112:hover ._createMark_1j7x2_145 {\n  background: color-mix(in srgb, var(--dsw-alias-brand-primary) 10%, transparent);\n  color: var(--dsw-alias-brand-primary);\n}\n\n._createTile_1j7x2_112:focus-visible {\n  outline: 2px solid var(--dsw-alias-brand-primary);\n  outline-offset: 1px;\n}\n\n@media (max-width: 720px) {\n  ._grid_1j7x2_81 {\n    grid-template-columns: 1fr;\n  }\n}\n/* Skill card content. The frame and the reorder/removal controls belong to the\n   shared shell, so this sheet styles only the body and the card's own actions. */\n\n._template_48mz2_4 {\n  display: block;\n}\n\n._body_48mz2_8 {\n  display: flex;\n  flex-direction: column;\n  min-width: 0;\n}\n\n/* The face's way into configuration, as a quiet pill rather than a bare word: at rest it\n   is a control with an edge, and the grid stops reading as three titles with a stray\n   \"配置\" floating at the end of each. */\n._cardActions_48mz2_17 {\n  display: inline-flex;\n  gap: 4px;\n}\n\n/* The tint is mixed from the label colour rather than taken from a layer token: in the\n   light theme every layer token is the same white as the card, so a control filled with\n   one would have no edge at all. */\n._cardActions_48mz2_17 button {\n  height: 24px;\n  padding: 0 9px;\n  border-radius: 6px;\n  font-size: 12px;\n  font-weight: 500;\n  color: var(--dsw-alias-label-secondary);\n  background: color-mix(in srgb, var(--dsw-alias-label-primary) 5%, transparent);\n  transition: background 0.15s ease, color 0.15s ease;\n}\n\n._cardActions_48mz2_17 button:hover {\n  background: color-mix(in srgb, var(--dsw-alias-label-primary) 9%, transparent);\n  color: var(--dsw-alias-label-primary);\n}\n\n/* What the face fills its frame with: the line the last run produced, and the two facts\n   a glance at the grid wants. Both are secondary; the card's name is the only primary\n   thing on it. */\n._faceBody_48mz2_44 {\n  display: flex;\n  flex-direction: column;\n  gap: 6px;\n  min-width: 0;\n  /* Fills the shell's body slot so the footer can be pushed to the bottom: the run\n     count then sits on one line across the whole grid, whether the card's summary ran\n     to two lines or to none. */\n  height: 100%;\n}\n\n._faceSummary_48mz2_55 {\n  display: -webkit-box;\n  margin: 2px 0 0;\n  overflow: hidden;\n  -webkit-box-orient: vertical;\n  -webkit-line-clamp: 2;\n  font-size: 13px;\n  line-height: 20px;\n  color: var(--dsw-alias-label-secondary);\n}\n\n/* An invitation is not a summary: it sits a level quieter than the text a run produced. */\n._faceSummary_48mz2_55[data-face-summary='empty'] {\n  color: var(--dsw-alias-label-tertiary);\n}\n\n/* Tabular figures keep the times in one column across the grid. */\n._faceFoot_48mz2_72 {\n  margin: auto 0 0;\n  font-size: 11px;\n  line-height: 16px;\n  font-variant-numeric: tabular-nums;\n  color: var(--dsw-alias-label-tertiary);\n}\n\n/* One full-panel view: the card's result or its configuration, in the whole\n   display column rather than a grid cell. */\n\n._pageView_48mz2_83 {\n  display: flex;\n  flex-direction: column;\n  /* One step of rhythm between the zones — head, composer, document, its actions, the\n     trace — so the document does not read as stuck to the composer above it. */\n  gap: 18px;\n  width: 100%;\n  min-width: 0;\n}\n\n/* The head every full-panel view opens with, in tiers: the way back, then the title\n   with its own controls, then the facts about the view.\n\n   The crumb used to sit inline before the title, so the heading started one button's\n   width in from the page's left edge while every row of the list under it started at\n   that edge: two left margins on one page, and the list appeared to hang out to the left\n   of the title it belongs to. Above the title, the crumb reads as a margin note and the\n   title, the meta, and the rows all share one left edge. */\n._pageHead_48mz2_101 {\n  /* Pinned: these views grow with the document under them, and the way back and the card's\n     name used to scroll out of sight within one long report. The scrollport is the workbench\n     panel, which is this head's ancestor. */\n  position: sticky;\n  top: 0;\n  z-index: 2;\n  display: flex;\n  flex-direction: column;\n  gap: 4px;\n  min-width: 0;\n  /* The head is opaque because the document scrolls under it, and the hairline is what\n     separates the two once it is pinned. */\n  padding: 4px 0 10px;\n  background: var(--dsw-alias-bg-base);\n  border-bottom: 1px solid var(--dsw-alias-border-l1);\n}\n\n._pageHeadBar_48mz2_119 {\n  display: flex;\n  align-items: center;\n  /* Cancels the button's own inset so the chevron's edge, not its padding, lands on the\n     page's left edge. */\n  margin-left: -6px;\n}\n\n._pageHeadTitle_48mz2_127 {\n  margin: 0;\n  flex: 1 1 auto;\n  min-width: 0;\n  font-size: 20px;\n  font-weight: 600;\n  line-height: 28px;\n  letter-spacing: -0.01em;\n  overflow-wrap: anywhere;\n}\n\n\n/* The facts under the title, separated by a middot: three values set in the same grey\n   with nothing between them read as one sentence, and the eye cannot tell where the\n   count ends and the moment begins. */\n._pageHeadMeta_48mz2_142 {\n  display: flex;\n  align-items: center;\n  flex-wrap: wrap;\n  min-width: 0;\n  color: var(--dsw-alias-label-secondary);\n  font-size: 12px;\n  line-height: 18px;\n}\n\n._pageHeadMeta_48mz2_142 > * + *::before {\n  content: '·';\n  margin: 0 8px;\n  color: var(--dsw-alias-label-caption);\n}\n\n/* The skill a card runs: a chip, because it is a name rather than part of a sentence.\n\n   The separator above is drawn by a pseudo element on the item, and on a chip that lands\n   *inside* the box: the dot sat against the chip's own left padding, with the box starting\n   flush against the word before it. A box is its own separator, so it takes a margin on\n   that side instead. */\n._pageHeadChip_48mz2_164 {\n  flex: none;\n  padding: 1px 7px;\n  border-radius: 6px;\n  background: color-mix(in srgb, var(--dsw-alias-label-primary) 5%, transparent);\n  color: var(--dsw-alias-label-secondary);\n  font-size: 11px;\n  line-height: 16px;\n}\n\n._pageHeadMeta_48mz2_142 > ._pageHeadChip_48mz2_164::before {\n  content: none;\n}\n\n._pageHeadMeta_48mz2_142 > ._pageHeadChip_48mz2_164:not(:first-child) {\n  margin-left: 10px;\n}\n\n._runProblem_48mz2_182 {\n  margin: 0;\n  padding: 8px 10px;\n  border: 1px solid var(--dsw-alias-brand-primary);\n  border-radius: var(--dsw-radius-sm);\n  color: var(--dsw-alias-label-primary);\n  font-size: 12px;\n  line-height: 18px;\n}\n\n/* The run's output section: the trace beneath the result.\n *\n * No box. It was a tinted slab with a hairline, and next to the act dock — the same tint,\n * the same radius, the same weight — the two read as one banded form under the document, so\n * neither the place to write nor the record of how the document was made stood out. The\n * dock took the surface for writing; this keeps none and is what it is: one line of history\n * under the place that acts, with the trace folded behind it. */\n\n/* The run's activity stream: one row per entry — a tool call, a span of the model's own\n   words, or the marker — read top to bottom. The rows wear the conversation's run-record\n   chrome: a leading icon, a title, a 2x2 separator, and a one-line summary that expands,\n   so a long trace reads like the chat it came from rather than a log dump.\n\n   The list is not bounded: like the conversation's own run record, it grows with its\n   content and the page scrolls, so a long reasoning span opens to its full text rather\n   than a narrow frame. */\n._runTraceList_48mz2_208 {\n  display: flex;\n  flex-direction: column;\n  min-width: 0;\n}\n\n._activityList_48mz2_214 {\n  display: flex;\n  flex-direction: column;\n  gap: 2px;\n  margin: 4px 0 0;\n  padding: 0;\n  list-style: none;\n}\n\n._activityItem_48mz2_223 {\n  display: block;\n  min-width: 0;\n}\n\n/* The tool's own name, unshrunk: it is the column a reader scans. */\n._activityToolRow_48mz2_229 {\n  min-width: 0;\n}\n\n/* One trace row's shared chrome: the conversation DisclosureRow keeps its own 24px header\n   with the secondary tier; the workbench only sizes the pieces it supplies. */\n._activityRow_48mz2_235 {\n  min-width: 0;\n}\n\n._activityTitle_48mz2_239 {\n  font-weight: 400;\n}\n\n/* The 2x2 separator between the title and the collapsed summary, matching the\n   conversation's run rows. */\n._activitySep_48mz2_245 {\n  flex: none;\n  width: 2px;\n  height: 2px;\n  margin: 0 8px;\n  border-radius: 1px;\n  background: var(--dsw-alias-label-caption);\n}\n\n/* The one-line collapsed summary: secondary tier, ellipsized, filling the row. */\n._activitySummary_48mz2_255 {\n  flex: 1 1 auto;\n  min-width: 0;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  font-size: var(--dsh-content-font-size-secondary, 13px);\n  line-height: calc(24px + var(--dsh-content-font-delta, 0px));\n}\n\n/* The expanded body under a row: the full stored text, wrapped, at the secondary tier. */\n._activityBody_48mz2_266 {\n  display: flex;\n  flex-direction: column;\n  gap: 4px;\n  min-width: 0;\n  padding: 4px 0 4px 22px;\n}\n\n._activityBodyLabel_48mz2_274 {\n  color: var(--dsw-alias-label-tertiary);\n  font-size: var(--dsh-content-font-size-secondary, 13px);\n  line-height: calc(20px + var(--dsh-content-font-delta-secondary, 0px));\n}\n\n._activityBodyText_48mz2_280 {\n  min-width: 0;\n  overflow-wrap: anywhere;\n  color: var(--dsw-alias-label-secondary);\n  font-size: var(--dsh-content-font-size-secondary, 13px);\n  line-height: calc(20px + var(--dsh-content-font-delta-secondary, 0px));\n}\n\n/* The model thinking: a disclosure row like the conversation's, set apart from the calls\n   because it is what the card is *reasoning*, not what it is doing. */\n._activityReasoning_48mz2_290 {\n  min-width: 0;\n}\n\n/* The model speaking to the user: plain narration, no chrome — it is the reply, not a\n   step. Reads like an assistant message in the conversation. */\n._activityNarration_48mz2_296 {\n  min-width: 0;\n  margin: 0;\n  color: var(--dsw-alias-label-secondary);\n  font-size: var(--dsh-content-font-size, 14px);\n  line-height: calc(22px + var(--dsh-content-font-delta, 0px));\n  overflow-wrap: anywhere;\n}\n\n/* A bounded trace's own row. Set apart from the calls because it is not one. */\n._activityTruncated_48mz2_306 {\n  color: var(--dsw-alias-label-tertiary);\n  font-size: var(--dsh-content-font-size-secondary, 13px);\n  line-height: calc(20px + var(--dsh-content-font-delta-secondary, 0px));\n}\n\n/* The settled turn-process header above a trace, matching the conversation's Turn process\n   row: a full-width button with the outcome word and a chevron that folds the whole stream. */\n/* No rule of its own any more: the block's edge is the boundary, and the header is the\n   block's first line. It carries a step count because 已完成 alone gave no reason to open\n   it — the summary said how the run ended and nothing about what was inside. */\n/* A chip, not a bar. Full width put the chevron a page away from the words it folds, which\n   is the one thing on the line nobody could connect to it; sized to its own text, the\n   outcome, the count and the chevron read as one control and its hover area agrees with\n   what it looks like. The negative start padding is only so the chip's own inset does not\n   push its text off the document's left edge. */\n._turnProcess_48mz2_322 {\n  display: inline-flex;\n  align-items: center;\n  gap: 5px;\n  width: auto;\n  max-width: 100%;\n  margin-left: -4px;\n  padding: 3px 8px 3px 4px;\n  border: none;\n  border-radius: 6px;\n  background: none;\n  color: var(--dsw-alias-label-secondary);\n  font: inherit;\n  font-size: 12px;\n  font-weight: 500;\n  cursor: pointer;\n  text-align: left;\n  transition: color 100ms ease, background 100ms ease;\n}\n\n._turnProcess_48mz2_322:hover {\n  background: color-mix(in srgb, var(--dsw-alias-label-primary) 5%, transparent);\n  color: var(--dsw-alias-label-primary);\n}\n\n/* The outcome at a glance, before the word is read: a quiet dot for a settled run and the\n   warning colour for one that failed or was stopped. */\n._turnProcessDot_48mz2_349 {\n  flex: none;\n  width: 6px;\n  height: 6px;\n  border-radius: 50%;\n  background: color-mix(in srgb, var(--dsw-alias-label-primary) 24%, transparent);\n}\n\n._turnProcess_48mz2_322[data-turn-process=\"failed\"] ._turnProcessDot_48mz2_349 {\n  background: var(--dsw-alias-state-warn-label);\n}\n\n._turnProcessLabel_48mz2_361 {\n  min-width: 0;\n  overflow: hidden;\n  font-size: inherit;\n  line-height: 18px;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n/* How many entries the fold hides, in the colour of a count rather than of the outcome. */\n._turnProcessSteps_48mz2_371 {\n  flex: none;\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 11px;\n  font-weight: 400;\n  font-variant-numeric: tabular-nums;\n}\n\n/* Right after the count: the chevron belongs to the words it folds. */\n._turnProcessChevron_48mz2_380 {\n  flex: none;\n  width: 14px;\n  height: 14px;\n  color: inherit;\n  transition: transform 100ms ease;\n}\n\n._turnProcess_48mz2_322[data-open] ._turnProcessChevron_48mz2_380 {\n  transform: rotate(180deg);\n}\n\n@media (prefers-reduced-motion: reduce) {\n  ._turnProcess_48mz2_322,\n  ._turnProcessChevron_48mz2_380 {\n    transition: none;\n  }\n}\n\n/* The card's rendered document sits in its own frame. Without a border the template's\n   content reads as the page's own. Nothing inside it is styled here: the document is\n   the user's, inside its own shadow root.\n\n   The boundary rests on the padding alone: this surface carried a heading row with a\n   hairline under it until the product owner removed that row as noise, and what keeps\n   the rendered document — which brings its own shadow and radius — off the border is\n   now the 12px gutter around it. Lowering it would leave the document flush. */\n._resultSurface_48mz2_407 {\n  display: flex;\n  flex-direction: column;\n  padding: 12px;\n  border: 1px solid var(--dsw-alias-border-l1);\n  border-radius: var(--dsw-radius-md);\n  min-width: 0;\n}\n\n/* The result's own editor, which takes the surface's content slot where the rendered\n   document was. Gaps rather than margins: the status line, the field, the refusals and the\n   two controls are one column of four things. */\n._resultEditor_48mz2_419 {\n  display: flex;\n  flex-direction: column;\n  gap: 10px;\n  min-width: 0;\n}\n\n/* The page's one place to act: three quiet controls where the document they change ends, and\n   the revision log under them. It was a selector plus a dock with a field in it; choosing a\n   way of changing the result now opens a dialog, so there is nothing to write here and\n   nothing to frame.\n\n   The row is the shape the chat's own message actions have: icons with their labels, quiet at\n   rest, one tinted pill under the pointer. Its controls are the page's only way to act on\n   what is above them, so they stay readable rather than waiting for a hover — hiding them\n   would leave a page that looks like it cannot do anything. */\n._actBlock_48mz2_435 {\n  display: flex;\n  flex-direction: column;\n  gap: 8px;\n  min-width: 0;\n}\n\n._actRow_48mz2_442 {\n  display: flex;\n  flex-wrap: wrap;\n  align-items: center;\n  gap: 2px;\n  margin-left: -8px;\n  min-width: 0;\n}\n\n/* The run's fold sits on the same line as the ways of changing the result, and it is not one\n   of them: it says how the run behind the result ended and opens its steps. So it keeps the\n   gap the actions have between them on its left and its own padding on its right, rather\n   than hanging off the row at the page's edge the way it did when it headed a section. */\n._actRow_48mz2_442 ._turnProcess_48mz2_322 {\n  margin-left: 6px;\n}\n\n._actAction_48mz2_459 {\n  display: inline-flex;\n  align-items: center;\n  gap: 5px;\n  padding: 4px 8px;\n  border: 0;\n  border-radius: var(--dsw-radius-sm);\n  background: transparent;\n  color: var(--dsw-alias-label-secondary);\n  font-family: var(--dsw-font-family);\n  font-size: 12px;\n  font-weight: 500;\n  line-height: 18px;\n  cursor: pointer;\n  transition: background 100ms ease, color 100ms ease;\n}\n\n._actAction_48mz2_459:hover {\n  background: color-mix(in srgb, var(--dsw-alias-label-primary) 5%, transparent);\n  color: var(--dsw-alias-label-primary);\n}\n\n._actAction_48mz2_459:focus-visible {\n  outline: 2px solid var(--dsw-alias-brand-primary);\n  outline-offset: 1px;\n}\n\n/* A way of changing the result that this one cannot offer — nothing to revise, or a run\n   already holding the card — reads as unavailable rather than disappearing, so the row keeps\n   the same length whichever state the page is in. */\n._actAction_48mz2_459:disabled {\n  color: var(--dsw-alias-label-caption);\n  cursor: not-allowed;\n}\n\n._actAction_48mz2_459:disabled:hover {\n  background: transparent;\n  color: var(--dsw-alias-label-caption);\n}\n\n/* The dialog a sentence is written in. Portalled to the body by `PromptDialog`, so these\n   classes are not nested under anything the page controls. */\n._dialogOverlay_48mz2_501 {\n  position: fixed;\n  inset: 0;\n  z-index: 60;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  padding: 24px;\n  background: color-mix(in srgb, var(--dsw-alias-label-primary) 28%, transparent);\n}\n\n._dialogPanel_48mz2_512 {\n  display: flex;\n  flex-direction: column;\n  gap: 10px;\n  box-sizing: border-box;\n  width: min(560px, 100%);\n  max-height: calc(100vh - 48px);\n  padding: 18px 18px 16px;\n  border: 1px solid var(--dsw-alias-border-l2);\n  border-radius: var(--dsw-radius-panel);\n  background: var(--dsw-alias-bg-layer-1);\n  box-shadow: 0 24px 48px -20px color-mix(in srgb, var(--dsw-alias-label-primary) 45%, transparent);\n  overflow: hidden;\n}\n\n/* Keyboard users land on the panel when it holds no field; the field takes the caret itself. */\n._dialogPanel_48mz2_512:focus-visible {\n  outline: none;\n}\n\n._dialogHead_48mz2_532 {\n  display: flex;\n  align-items: flex-start;\n  gap: 8px;\n  min-width: 0;\n}\n\n._dialogTitle_48mz2_539 {\n  flex: 1 1 auto;\n  margin: 0;\n  color: var(--dsw-alias-label-primary);\n  font-size: 15px;\n  font-weight: 600;\n  line-height: 22px;\n  min-width: 0;\n}\n\n._dialogClose_48mz2_549 {\n  flex: none;\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  width: 24px;\n  height: 24px;\n  margin: -2px -2px 0 0;\n  padding: 0;\n  border: 0;\n  border-radius: 6px;\n  background: transparent;\n  color: var(--dsw-alias-label-tertiary);\n  cursor: pointer;\n}\n\n._dialogClose_48mz2_549:hover {\n  background: color-mix(in srgb, var(--dsw-alias-label-primary) 6%, transparent);\n  color: var(--dsw-alias-label-primary);\n}\n\n._dialogClose_48mz2_549:focus-visible {\n  outline: 2px solid var(--dsw-alias-brand-primary);\n  outline-offset: 1px;\n}\n\n._dialogHint_48mz2_575 {\n  margin: 0;\n  color: var(--dsw-alias-label-secondary);\n  font-size: 12px;\n  line-height: 18px;\n}\n\n/* A refusal, inside the dialog rather than beside the page: the form was submitted and the\n   Host would not take it, which is the same sentence the run bar states in its own layout.\n   It is the error colour, not the hint's grey, because it is about the press and not the\n   form. */\n._dialogProblem_48mz2_586 {\n  margin: 0;\n  color: var(--dsw-alias-state-error-primary);\n  font-size: 12px;\n  line-height: 18px;\n}\n\n/* The form's own surface: unlike the row, this *is* written into, so it carries the frame the\n   block used to. Taller than the bar's field because the dialog exists to give a sentence\n   room. */\n._dialogField_48mz2_596 {\n  box-sizing: border-box;\n  width: 100%;\n  min-height: 96px;\n  max-height: 40vh;\n  padding: 10px 12px;\n  border: 1px solid var(--dsw-alias-border-secondary);\n  border-radius: var(--dsw-radius-md);\n  background: var(--dsw-specific-input-major);\n  color: var(--dsw-alias-label-primary);\n  font-family: var(--dsw-font-family);\n  font-size: 13px;\n  line-height: 20px;\n  resize: none;\n  overflow-y: auto;\n}\n\n._dialogField_48mz2_596::placeholder {\n  color: var(--dsw-alias-label-tertiary);\n}\n\n._dialogField_48mz2_596:disabled {\n  color: var(--dsw-alias-label-tertiary);\n  cursor: not-allowed;\n}\n\n._dialogField_48mz2_596:focus-visible {\n  border-color: color-mix(in srgb, var(--dsw-alias-label-primary) 30%, transparent);\n  outline: 2px solid color-mix(in srgb, var(--dsw-alias-brand-primary) 22%, transparent);\n  outline-offset: 1px;\n}\n\n/* The two ways out, at the end the form submits from. */\n._dialogFoot_48mz2_629 {\n  display: flex;\n  justify-content: flex-end;\n  gap: 8px;\n  padding-top: 2px;\n}\n\n/* The instructions this card was recently given, offered back as chips in the run dialog.\n   A shortcut for the common case — the same ask again, with a small edit — so a click refills\n   the field rather than starting a run. */\n._runChips_48mz2_639 {\n  display: flex;\n  flex-wrap: wrap;\n  align-items: center;\n  gap: 6px;\n  min-width: 0;\n}\n\n._runChipsLabel_48mz2_647 {\n  flex: none;\n  color: var(--dsw-alias-label-caption);\n  font-size: 12px;\n  line-height: 18px;\n}\n\n._runChip_48mz2_639 {\n  max-width: 220px;\n  padding: 2px 8px;\n  border: 1px solid var(--dsw-alias-border-l2);\n  border-radius: 999px;\n  background: none;\n  color: var(--dsw-alias-label-secondary);\n  font-family: var(--dsw-font-family);\n  font-size: 12px;\n  line-height: 16px;\n  white-space: nowrap;\n  text-overflow: ellipsis;\n  overflow: hidden;\n  cursor: pointer;\n}\n\n._runChip_48mz2_639:hover {\n  border-color: var(--dsw-alias-border-l3);\n  color: var(--dsw-alias-label-primary);\n}\n\n._runChip_48mz2_639:focus-visible {\n  outline: 2px solid var(--dsw-alias-brand-primary);\n  outline-offset: 1px;\n}\n\n/* A refusal of the last revision, stated where the ask was made. */\n._composerProblem_48mz2_681 {\n  margin: 0;\n  color: var(--dsw-alias-state-error-primary);\n  font-size: 12px;\n  line-height: 18px;\n}\n\n/* The log reads as a conversation: the instruction, then when it was applied. */\n._refineLog_48mz2_689 {\n  display: flex;\n  flex-direction: column;\n  gap: 6px;\n  min-width: 0;\n}\n\n/* The log's header: how many revisions it holds, and the one step back they allow. */\n._refineLogHead_48mz2_697 {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  min-width: 0;\n}\n\n._refineLogTitle_48mz2_704 {\n  flex: 1 1 auto;\n  min-width: 0;\n  margin: 0;\n  color: var(--dsw-alias-label-secondary);\n  font-size: 12px;\n  font-weight: 500;\n  line-height: 18px;\n}\n\n._refineLogList_48mz2_714 {\n  display: flex;\n  flex-direction: column;\n  gap: 4px;\n  margin: 0;\n  padding: 0;\n  list-style: none;\n}\n\n/* One entry is a sentence and its moment, in that order. The row used to be a flex line\n   with the time pushed to the far edge, which put the two facts at opposite ends of a\n   full-width row and made the time look like a column of its own. */\n._refineLogItem_48mz2_726 {\n  font-size: 12px;\n  line-height: 18px;\n}\n\n._refineLogInstruction_48mz2_731 {\n  color: var(--dsw-alias-label-primary);\n  overflow-wrap: anywhere;\n}\n\n._refineLogTime_48mz2_736 {\n  margin-left: 6px;\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 11px;\n  font-variant-numeric: tabular-nums;\n  white-space: nowrap;\n}\n\n/* The block's last line, and the only place that says how long any of it lives. */\n._refineLogNote_48mz2_745 {\n  margin: 0;\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 11px;\n  line-height: 16px;\n}\n\n._notice_48mz2_752 {\n  display: flex;\n  flex-direction: column;\n  gap: 4px;\n  padding: 4px 0;\n}\n\n._noticeTitle_48mz2_759 {\n  margin: 0;\n  color: var(--dsw-alias-label-primary);\n  font-size: 13px;\n  font-weight: 500;\n}\n\n._noticeBody_48mz2_766 {\n  margin: 0;\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 12px;\n  line-height: 1.5;\n}\n\n/* The editor opens in place of the body, so it inherits the card's width. */\n\n._settings_48mz2_775 {\n  display: flex;\n  flex-direction: column;\n  min-width: 0;\n}\n\n/* One group of the configuration page: a heading, its controls, and a hairline above\n   every group but the first. Groups rather than nested cards — a card inside the\n   page's own surface reads as a second frame around the same thing. */\n._section_48mz2_784 {\n  display: flex;\n  flex-direction: column;\n  gap: 10px;\n  min-width: 0;\n  padding: 18px 0;\n}\n\n/* A group's first line: its name, and whatever belongs to the group as a whole — the\n   template's three actions, the preview's caption. The controls used to sit inside the\n   sentence about the region and the byte count, where an underlined 添加动作 read as one\n   more fact instead of the one thing on the line a user could press. */\n._sectionHead_48mz2_796 {\n  display: flex;\n  align-items: center;\n  flex-wrap: wrap;\n  gap: 12px;\n  min-width: 0;\n}\n\n._sectionTools_48mz2_804 {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  margin-left: auto;\n  min-width: 0;\n}\n\n/* Not flush against the head: the head is pinned and carries a hairline, and a section\n   title one line under it reads as part of the head rather than as the first group. */\n._section_48mz2_784:first-child {\n  padding-top: 18px;\n}\n\n._section_48mz2_784 + ._section_48mz2_784 {\n  border-top: 1px solid var(--dsw-alias-border-l1);\n}\n\n._sectionTitle_48mz2_822 {\n  margin: 0;\n  color: var(--dsw-alias-label-primary);\n  font-size: 13px;\n  font-weight: 600;\n  line-height: 20px;\n}\n\n/* Four fields, laid out as two rows of two. One row of four crowded every label against\n   the next control and pushed the last field past the page's edge; a grid makes the shape\n   explicit instead of leaving it to how the labels happen to wrap, and each cell is wide\n   enough for a long name or a full path. */\n._fieldGrid_48mz2_834 {\n  display: grid;\n  grid-template-columns: repeat(2, minmax(0, 1fr));\n  gap: 16px 24px;\n  min-width: 0;\n}\n\n/* Narrower than two comfortable fields, one per row: half a phone's width per field is\n   worse than a longer page. */\n@media (max-width: 640px) {\n  ._fieldGrid_48mz2_834 {\n    grid-template-columns: minmax(0, 1fr);\n  }\n}\n\n._field_48mz2_834 {\n  display: flex;\n  flex-direction: column;\n  min-width: 0;\n  gap: 6px;\n}\n\n/* The model field has two states that are text rather than a control: a route the card\n   cannot offer, and no route at all. Both occupy the place the picker would, at the same\n   height, so the row does not jump between the three states. */\n._fieldValue_48mz2_859 {\n  margin: 0;\n  box-sizing: border-box;\n  display: flex;\n  align-items: center;\n  height: 32px;\n  padding: 0 8px;\n  border: 1px solid var(--dsw-alias-border-l2);\n  border-radius: var(--dsw-radius-sm);\n  background: var(--dsw-alias-bg-layer-1);\n  color: var(--dsw-alias-label-secondary);\n  font-size: 13px;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n._fieldLabel_48mz2_876 {\n  margin: 0;\n  color: var(--dsw-alias-label-secondary);\n  font-size: 12px;\n}\n\n/* The workspace value and the button that changes it share one row: the value is the\n   widest thing in the field, and the button reads as the action on it. */\n._workspaceRow_48mz2_884 {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  min-width: 0;\n}\n\n/* Two lines in the space one control occupies: the leaf name is what the user scans, and\n   the full path underneath is the exact directory. It matches `.fieldValue`'s border and\n   background so the four fields of this group read as one set, but it is taller because it\n   carries two lines. */\n/* One line, like every other control in the grid: the leaf name on the left, the exact\n   path flushing right. Two lines made this cell taller than its neighbour, so no two rows\n   of the group ever lined up — and the row's whole purpose is that they do. */\n._workspaceValue_48mz2_898 {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 10px;\n  box-sizing: border-box;\n  flex: 1 1 auto;\n  min-width: 0;\n  height: 32px;\n  padding: 0 8px;\n  border: 1px solid var(--dsw-alias-border-l2);\n  border-radius: var(--dsw-radius-sm);\n  background: var(--dsw-alias-bg-layer-1);\n  overflow: hidden;\n}\n\n/* A path that is no longer a directory is stated by the value itself, in the same warn\n   colour the template's own warnings use: the field is a fact about the card, not an\n   alert to dismiss. */\n._workspaceValueInvalid_48mz2_917 {\n  border-color: var(--dsw-alias-state-warn-label);\n}\n\n._workspaceLeaf_48mz2_921 {\n  flex: none;\n  max-width: 62%;\n  color: var(--dsw-alias-label-primary);\n  font-size: 13px;\n  line-height: 18px;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n/* Tertiary and small: the exact path, always readable, never competing with the name. */\n._workspacePath_48mz2_933 {\n  flex: 1 1 auto;\n  min-width: 0;\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 11px;\n  line-height: 14px;\n  text-align: right;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n/* A field's own note: what is wrong with this value, or why the control beside it cannot\n   be used. Under the value, because that is what it is about. */\n._fieldNote_48mz2_947 {\n  margin: 0;\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 11px;\n  line-height: 16px;\n}\n\n/* The page's controls are one size and one surface: a form whose fields are 28px tall\n   reads as a settings list from a denser app, and a name field the height of a table row\n   is not obviously a place you can type. */\n._select_48mz2_957,\n._editor_48mz2_958 {\n  border: 1px solid var(--dsw-alias-border-l2);\n  border-radius: var(--dsw-radius-sm);\n  background: var(--dsw-alias-bg-layer-1);\n  color: var(--dsw-alias-label-primary);\n  font-family: var(--dsw-font-family);\n  font-size: 13px;\n}\n\n._select_48mz2_957 {\n  box-sizing: border-box;\n  height: 32px;\n  padding: 0 8px;\n}\n\n/* Tall enough to hold a page of template on a laptop window without pushing the save bar\n   half way up the screen, and still growing on a large one.\n\n   The height comes from the pane's stated row; the field fills it and, with the content\n   taller than the box, scrolls inside it. `min-height: 0` is what lets a text area shrink\n   into a row instead of pushing the row open to fit its text. */\n._editor_48mz2_958 {\n  min-height: 0;\n  padding: 6px;\n  font-family: monospace;\n  /* Not resizable: dragging the handle wrote a height on the field, the pane's row stayed as\n     stated and clipped it, so the handle was a control that broke the layout it sat in. */\n  resize: none;\n}\n\n/* The editor's status rail, at the foot of the pane: where the region is, what the\n   template declares, and how much of the size budget it uses. These are readings of the\n   text above them, so they belong under it — a line of facts above a code block reads as\n   a caption for the section, and it took a whole row away from the editor. */\n._editorStatus_48mz2_992 {\n  grid-column: 1 / -1;\n  display: flex;\n  align-items: center;\n  flex-wrap: wrap;\n  gap: 2px 10px;\n  box-sizing: border-box;\n  padding: 5px 10px;\n  border-top: 1px solid var(--dsw-alias-border-l1);\n  background: color-mix(in srgb, var(--dsw-alias-label-primary) 2%, transparent);\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 11px;\n  line-height: 16px;\n}\n\n/* Pushed to the rail's far end: it is about the whole file, not about the region's range. */\n._editorStatusDirty_48mz2_1008 {\n  margin-left: auto;\n  color: var(--dsw-alias-label-secondary);\n}\n\n/* A template with no region cannot run at all, so the whole line turns into the\n   warning rather than one clause of it. */\n._editorStatusMissing_48mz2_1015 {\n  color: var(--dsw-alias-state-warn-label);\n}\n\n/* Above 85% of the byte budget the count is the fact that matters. */\n._editorStatusWarn_48mz2_1020 {\n  color: var(--dsw-alias-state-warn-label);\n}\n\n/* The template read as structure. Same metrics as the field it replaces, so switching\n   between the two does not move the text a line up or down, and the same tinted number\n   column, so the two views read as one pane. */\n._foldView_48mz2_1027 {\n  grid-column: 1 / -1;\n  /* Fills the pane's stated row, like the field it replaces: the two presentations have to be\n     the same size to read as one pane, and a view that grows with its document is a page. */\n  min-height: 0;\n  padding: 6px 0;\n  overflow: auto;\n  font-family: ui-monospace, \"Cascadia Mono\", Consolas, \"Courier New\", monospace;\n  font-size: 12px;\n  line-height: 18px;\n  /* The scrollbar a long document brings must not narrow the code mid-read. */\n  scrollbar-gutter: stable;\n}\n\n._foldRow_48mz2_1041 {\n  display: flex;\n  align-items: flex-start;\n  min-width: max-content;\n}\n\n/* Fills the rest of the row so the row's hover tint covers the whole width, while the\n   count stays against the text it belongs to instead of at the far edge of a long pane. */\n._foldRow_48mz2_1041::after {\n  content: '';\n  flex: 1 1 auto;\n}\n\n._foldRow_48mz2_1041:hover {\n  background: color-mix(in srgb, var(--dsw-alias-label-primary) 3%, transparent);\n}\n\n/* The number column, the caret, and the text are three buttons in one row. Nothing here is\n   a tab stop: the row's job is to hand a line to the field, and the field is a keyboard\n   control on its own. */\n._foldNumber_48mz2_1061,\n._foldCaret_48mz2_1062,\n._foldText_48mz2_1063 {\n  margin: 0;\n  border: 0;\n  background: transparent;\n  font: inherit;\n  line-height: inherit;\n  cursor: pointer;\n}\n\n._foldNumber_48mz2_1061 {\n  flex: none;\n  width: 44px;\n  padding: 0 8px;\n  border-right: 1px solid var(--dsw-alias-border-l1);\n  background: color-mix(in srgb, var(--dsw-alias-label-primary) 3%, transparent);\n  color: var(--dsw-alias-label-tertiary);\n  text-align: right;\n  user-select: none;\n}\n\n._foldCaret_48mz2_1062,\n._foldCaretBlank_48mz2_1084 {\n  flex: none;\n  width: 18px;\n  padding: 0;\n  color: var(--dsw-alias-label-secondary);\n  text-align: center;\n  user-select: none;\n}\n\n._foldText_48mz2_1063 {\n  flex: 0 0 auto;\n  padding: 0 10px 0 0;\n  color: var(--dsw-alias-label-primary);\n  text-align: left;\n  white-space: pre;\n}\n\n/* What one folded line stands for: the size of what is hidden, so a fold that swallowed\n   the whole stylesheet cannot be mistaken for a fold that hid three lines. */\n._foldCount_48mz2_1103 {\n  flex: none;\n  padding: 0 12px 0 6px;\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 11px;\n  white-space: nowrap;\n}\n\n/* Gutter and text on the first row, the status rail under both of them. The gutter and\n   the text must share font, size, line height and vertical padding, or the numbers stop\n   lining up with the lines they label.\n\n   The first row's height is stated rather than divided. `minmax(0, 1fr)` inside a grid that\n   is as tall as its own content has nothing to divide, so the row grew to the code's full\n   height: a three-hundred-line template made a five-thousand-pixel field, the page scrolled\n   instead of the field, and a jump selected a line that was nowhere on screen. A stated row\n   makes the field and the gutter the scrollers, and keeps the page a page. */\n._editorPane_48mz2_1120 {\n  display: grid;\n  grid-template-columns: auto minmax(0, 1fr);\n  grid-template-rows: clamp(280px, 44vh, 560px) auto;\n  border: 1px solid var(--dsw-alias-border-l2);\n  border-radius: var(--dsw-radius-md);\n  background: var(--dsw-alias-bg-layer-1);\n  overflow: hidden;\n}\n\n/* The gutter. Its lines are separate elements so one band can be drawn across the\n   region's lines and a second, subtler one across the action block. Font, size, line\n   height and vertical padding are restated on the lines themselves, because a band\n   that changes any of them pulls the numbers off the text they label. */\n._gutter_48mz2_1134 {\n  margin: 0;\n  padding: 6px 0;\n  border-right: 1px solid var(--dsw-alias-border-l1);\n  /* A tint rather than a layer token: both layer tokens are the same white in this theme,\n     which left the numbers floating in the code with nothing separating them. */\n  background: color-mix(in srgb, var(--dsw-alias-label-primary) 3%, transparent);\n  color: var(--dsw-alias-label-tertiary);\n  font-family: monospace;\n  font-size: 12px;\n  line-height: 18px;\n  text-align: right;\n  /* Scrolling happens in the text area; the gutter follows it in code. */\n  overflow: hidden;\n  user-select: none;\n}\n\n/* One numbered line, which is also its own click target. The transparent left border\n   is what keeps every number in one column once a banded line adds a coloured border\n   of the same width. */\n._gutterLine_48mz2_1154 {\n  display: block;\n  width: 100%;\n  margin: 0;\n  padding: 0 8px;\n  border: 0;\n  border-left: 2px solid transparent;\n  background: none;\n  color: inherit;\n  font: inherit;\n  line-height: inherit;\n  text-align: right;\n  cursor: pointer;\n}\n\n._gutterLine_48mz2_1154:hover {\n  color: var(--dsw-alias-label-primary);\n}\n\n/* The region a child fills: the two marker lines and everything between them. */\n._gutterLineRegion_48mz2_1174 {\n  background: color-mix(in srgb, var(--dsw-alias-brand-primary) 12%, transparent);\n  border-left-color: var(--dsw-alias-brand-primary);\n  color: var(--dsw-alias-label-primary);\n}\n\n/* The action declaration block, drawn more faintly so the two bands stay\n   distinguishable in a template that has both. */\n._gutterLineActions_48mz2_1182 {\n  background: color-mix(in srgb, var(--dsw-alias-label-tertiary) 14%, transparent);\n  border-left-color: var(--dsw-alias-label-tertiary);\n}\n\n._editorPane_48mz2_1120 ._editor_48mz2_958 {\n  border: 0;\n  border-radius: 0;\n  background: transparent;\n  font-size: 12px;\n  line-height: 18px;\n  padding: 6px 8px;\n  /* A number labels a row only while one line of the file is one row on screen: a wrapped\n     line pushed every number under it onto its neighbour's line, and indentation read as\n     ragged because the glyphs were not on a grid. Long lines scroll sideways instead, in a\n     stack that is monospaced on every Windows without the shell's default font deciding. */\n  white-space: pre;\n  overflow-wrap: normal;\n  /* Both axes are stated: a long file scrolls inside the field, and a jump moves that scroll.\n     Leaving the vertical axis to be inferred from the horizontal one made the pane's own\n     scroller a candidate for a jump, and a jump that scrolls the wrong box looks like a jump\n     that did nothing. */\n  overflow-x: auto;\n  overflow-y: auto;\n  tab-size: 2;\n  font-family: ui-monospace, \"Cascadia Mono\", Consolas, \"Courier New\", monospace;\n  /* The scrollbar that appears with a long file must not narrow the text mid-edit. */\n  scrollbar-gutter: stable;\n}\n\n._editorPane_48mz2_1120 ._editor_48mz2_958:focus-visible {\n  border: 0;\n  outline: none;\n}\n\n._editorPane_48mz2_1120:focus-within {\n  border-color: var(--dsw-alias-brand-primary);\n}\n\n._editor_48mz2_958:focus-visible,\n._select_48mz2_957:focus-visible {\n  border-color: var(--dsw-alias-brand-primary);\n  outline: none;\n}\n\n._violations_48mz2_1227 {\n  margin: 0;\n  padding-left: 18px;\n  color: var(--dsw-alias-label-primary);\n  font-size: 12px;\n  line-height: 1.6;\n}\n\n/* A violation is a jump target: clicking it puts the caret on the construct it names.\n   It keeps the list's own type and colour so the list still reads as a list. */\n._violationJump_48mz2_1237 {\n  padding: 0;\n  border: 0;\n  background: none;\n  color: inherit;\n  font: inherit;\n  text-align: left;\n  text-decoration: underline;\n  text-decoration-style: dotted;\n  cursor: pointer;\n}\n\n._violationJump_48mz2_1237:hover,\n._violationJump_48mz2_1237:focus-visible {\n  color: var(--dsw-alias-label-primary);\n  text-decoration-style: solid;\n}\n\n/* The preview's own surface, inset from the page. What is inside is the user's\n   document in a shadow root, so only this frame is styled here. */\n._previewSurface_48mz2_1257 {\n  display: flex;\n  flex-direction: column;\n  gap: 8px;\n  box-sizing: border-box;\n  min-width: 0;\n  /* As tall as the editor opposite, so the two panes end on one line instead of one\n     stopping halfway down the other. */\n  flex: 1 1 auto;\n  min-height: 240px;\n  padding: 10px;\n  border: 1px solid var(--dsw-alias-border-l1);\n  border-radius: var(--dsw-radius-md);\n  background: color-mix(in srgb, var(--dsw-alias-label-primary) 2%, transparent);\n}\n\n._previewLabel_48mz2_1273 {\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 11px;\n  line-height: 16px;\n}\n\n/* The well the document is drawn in: white on the tinted frame, so the user's own card\n   reads as the document and the frame reads as the page around it. Dashed while there is\n   nothing in it to look at. */\n._preview_48mz2_1257 {\n  flex: 1 1 auto;\n  box-sizing: border-box;\n  min-height: 0;\n  padding: 8px;\n  border: 1px dashed var(--dsw-alias-border-l2);\n  border-radius: var(--dsw-radius-sm);\n  background: var(--dsw-alias-bg-layer-1);\n  overflow: auto;\n}\n\n._settingsActions_48mz2_1293 {\n  display: flex;\n  gap: 6px;\n}\n\n/* The declaration builder: a small form that writes one line into the template. */\n\n._actionBuilder_48mz2_1300 {\n  display: flex;\n  flex-direction: column;\n  gap: 10px;\n  box-sizing: border-box;\n  padding: 12px;\n  border: 1px solid var(--dsw-alias-border-l1);\n  border-radius: var(--dsw-radius-sm);\n  background: var(--dsw-alias-bg-layer-2);\n}\n\n._builderRow_48mz2_1311 {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 16px;\n  min-width: 0;\n}\n\n._builderField_48mz2_1318 {\n  display: flex;\n  flex: 1 1 160px;\n  flex-direction: column;\n  gap: 6px;\n  min-width: 0;\n}\n\n/* The key's grammar, and the reason the confirm button is disabled. It is a line of\n   text rather than a tooltip because it has to be readable while typing. */\n._hint_48mz2_1328 {\n  margin: 0;\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 11px;\n  line-height: 16px;\n}\n\n._hintError_48mz2_1335 {\n  color: var(--dsw-alias-state-error-primary);\n}\n\n/* The page's footer, pinned to the bottom of the scroll container: saving must not\n   depend on scrolling past a preview that can be arbitrarily tall.\n\n   Sticky insets resolve against the scrollport's *content* edge, so `bottom: 0` pinned\n   this bar one page-padding up (48px, from the panel's own `.page`) — and the template's\n   lines kept scrolling through the strip underneath it, which read as the bar cutting the\n   editor in half. The negative inset puts the reference back on the padding's outer edge,\n   which is the window's own bottom. */\n._configFooter_48mz2_1347 {\n  position: sticky;\n  bottom: -48px;\n  z-index: 1;\n  display: flex;\n  flex-direction: column;\n  gap: 6px;\n  box-sizing: border-box;\n  margin-top: 8px;\n  padding: 12px 0 14px;\n  border-top: 1px solid var(--dsw-alias-border-l1);\n  background: var(--dsw-alias-bg-base);\n  /* A hairline alone left the panes' last lines looking cut rather than covered: the bar\n     and the page are the same white, so the bar has to cast something to read as a bar. */\n  box-shadow: 0 -12px 20px -18px color-mix(in srgb, var(--dsw-alias-label-primary) 55%, transparent);\n}\n\n/* What the save button would keep, stated beside it. */\n._footerHint_48mz2_1365 {\n  margin-left: 4px;\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 11px;\n  line-height: 16px;\n}\n\n._footerActions_48mz2_1372 {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n}\n\n._footerSpacer_48mz2_1378 {\n  flex: 1 1 auto;\n}\n\n/* What the second press will do, stated where the press happens. */\n._deletePrompt_48mz2_1383 {\n  color: var(--dsw-alias-state-error-primary);\n  font-size: 11px;\n  line-height: 16px;\n}\n\n/* Both selectors carry two classes so the colour wins over the shared Button's own\n   `color` and `:hover` rules whatever order the two stylesheets load in. */\n._footerActions_48mz2_1372 ._deleteCard_48mz2_1391 {\n  color: var(--dsw-alias-state-error-primary);\n}\n\n._footerActions_48mz2_1372 ._deleteCard_48mz2_1391:hover:not(:disabled) {\n  background: var(--dsw-alias-interactive-bg-hover-danger);\n  color: var(--dsw-alias-state-error-primary);\n}\n\n/* A write the controller refused used to leave the page looking untouched. */\n._writeFailure_48mz2_1401 {\n  margin: 0;\n  color: var(--dsw-alias-state-error-primary);\n  font-size: 12px;\n  line-height: 18px;\n}\n\n/* The in-place confirmation panel, which takes the card's display area the way the\n   editor does. */\n\n._actionPanel_48mz2_1411 {\n  display: flex;\n  flex-direction: column;\n  gap: 10px;\n  padding: 10px;\n  border: 1px solid var(--dsw-alias-border-l1);\n  border-radius: var(--dsw-radius-sm);\n}\n\n._actionFacts_48mz2_1420 {\n  display: grid;\n  grid-template-columns: max-content 1fr;\n  gap: 6px 12px;\n  margin: 0;\n  font-size: 12px;\n}\n\n._actionFacts_48mz2_1420 dt {\n  color: var(--dsw-alias-label-secondary);\n}\n\n._actionFacts_48mz2_1420 dd {\n  margin: 0;\n  min-width: 0;\n  overflow-wrap: anywhere;\n}\n\n/* The payload whole: scrollable, never truncated, never collapsed. It is the one thing\n   standing between a model-authored row and the run that receives it. */\n._actionPayload_48mz2_1440 {\n  max-height: 240px;\n  margin: 0;\n  padding: 8px;\n  border: 1px solid var(--dsw-alias-border-l1);\n  border-radius: var(--dsw-radius-sm);\n  background: var(--dsw-alias-bg-layer-2);\n  overflow: auto;\n  font-family: monospace;\n  font-size: 12px;\n  white-space: pre-wrap;\n  overflow-wrap: anywhere;\n}\n\n/* A bare run's one line: whether it is still going, and how it ended. */\n\n._bareRun_48mz2_1456 {\n  margin: 0;\n  color: var(--dsw-alias-label-primary);\n  font-size: 12px;\n  line-height: 18px;\n  overflow-wrap: anywhere;\n}\n\n._bareRun_48mz2_1456[data-bare-run='settled'] {\n  color: var(--dsw-alias-label-secondary);\n}\n\n/* Editing and previewing are one task seen twice. Wide enough, both fit and the tabs are\n   pointless; narrower, stacking them pushes whichever is second below the fold, so the\n   tabs choose. The breakpoint is where two readable panes stop fitting, not a device. */\n._panes_48mz2_1471 {\n  display: grid;\n  grid-template-columns: minmax(0, 1fr);\n  gap: 16px;\n  /* Stretch, so the preview column takes its height from the editor beside it instead of\n     from a number that had to be kept in step with the editor's. */\n  align-items: stretch;\n  /* The document is a different kind of thing from the facts above it, and whitespace\n     alone did not say so — the same hairline the head uses separates the two. */\n  padding-top: 20px;\n  border-top: 1px solid var(--dsw-alias-border-l1);\n}\n\n/* A grid child defaults to min-width auto, which lets the editor's content widen the\n   column instead of scrolling inside it. */\n._panes_48mz2_1471 > ._section_48mz2_784 {\n  min-width: 0;\n  /* The row carries the space above it now. */\n  padding-top: 0;\n}\n\n/* Two panes are two columns of one row, not a stack: the hairline that separates a\n   section from the one above it left a stray line across the preview column alone and\n   pushed its heading down by a pixel. */\n._panes_48mz2_1471 > ._section_48mz2_784 + ._section_48mz2_784 {\n  border-top: 0;\n}\n\n/* Tinted, like the result page's own selector: both layer tokens are the same white in\n   this theme, so a strip drawn in one of them had no strip in it at all. */\n._paneTabs_48mz2_1501 {\n  display: flex;\n  gap: 2px;\n  padding: 2px;\n  border-radius: var(--dsw-radius-sm);\n  background: color-mix(in srgb, var(--dsw-alias-label-primary) 5%, transparent);\n}\n\n._paneTab_48mz2_1501 {\n  flex: 1 1 auto;\n  padding: 4px 10px;\n  border: 0;\n  border-radius: 6px;\n  background: transparent;\n  color: var(--dsw-alias-label-secondary);\n  cursor: pointer;\n  font-size: 12px;\n  line-height: 18px;\n}\n\n._paneTab_48mz2_1501[aria-selected='true'] {\n  background: var(--dsw-alias-bg-layer-1);\n  color: var(--dsw-alias-label-primary);\n  font-weight: 500;\n  box-shadow: 0 1px 2px color-mix(in srgb, var(--dsw-alias-label-primary) 10%, transparent);\n}\n\n._paneTab_48mz2_1501:focus-visible {\n  outline: 2px solid var(--dsw-alias-brand-primary);\n  outline-offset: 1px;\n}\n\n@media (min-width: 1100px) {\n  ._panes_48mz2_1471 {\n    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);\n    gap: 24px;\n  }\n\n  /* Both panes are visible, so a tab strip would only repeat their headings. */\n  ._paneTabs_48mz2_1501 {\n    display: none;\n  }\n}\n\n@media (max-width: 1099px) {\n  /* The selected tab already names the pane, so the heading would say it twice. */\n  ._panes_48mz2_1471 ._sectionTitle_48mz2_822 {\n    display: none;\n  }\n\n  ._panes_48mz2_1471[data-pane='edit'] > ._section_48mz2_784:nth-of-type(2),\n  ._panes_48mz2_1471[data-pane='preview'] > ._section_48mz2_784:nth-of-type(1) {\n    display: none;\n  }\n}\n\n/* The run-history page: its heading, the count line, the empty state, and the runs.\n\n   The list is read as days: one heading per day, rows under it, a hairline between rows.\n   A row is two lines of its own — what the run produced, then the facts that tell it\n   apart from its neighbours — with the outcome opposite, so a reader scanning for a run\n   lands on content rather than on seven identical completion words. */\n\n._runsHeadText_48mz2_1564 {\n  display: flex;\n  flex-direction: column;\n  gap: 2px;\n  flex: 1 1 auto;\n  min-width: 0;\n}\n\n._runsHeadTitle_48mz2_1572 {\n  margin: 0;\n  font-size: 18px;\n  font-weight: 600;\n  line-height: 26px;\n  overflow-wrap: anywhere;\n}\n\n._runsHeadMeta_48mz2_1580 {\n  display: flex;\n  flex-wrap: wrap;\n  align-items: baseline;\n  gap: 8px;\n  margin: 0;\n  min-width: 0;\n}\n\n._runHistoryCount_48mz2_1589 {\n  margin: 0;\n  color: var(--dsw-alias-label-secondary);\n  font-size: 12px;\n  line-height: 18px;\n}\n\n._runHistoryEmpty_48mz2_1596 {\n  margin: 0;\n  padding: 32px 12px;\n  border: 1px dashed var(--dsw-alias-border-l2);\n  border-radius: var(--dsw-radius-sm);\n  color: var(--dsw-alias-label-secondary);\n  font-size: 13px;\n  line-height: 20px;\n  text-align: center;\n}\n\n._runHistoryList_48mz2_1607 {\n  display: flex;\n  flex-direction: column;\n  gap: 14px;\n  min-width: 0;\n}\n\n._runHistoryGroup_48mz2_1614 {\n  display: flex;\n  flex-direction: column;\n  gap: 4px;\n  min-width: 0;\n}\n\n/* The day a group of rows completed on. It is a caption, not a title: the rows below it\n   are what the page is about, and a heavier heading would make the list read as days.\n\n   It sticks to the top of the list while its own group scrolls past, because a long\n   history is read one day at a time and the rows themselves carry only a clock: without\n   the caption on screen, \"22:47\" is a time on no particular day. */\n._runHistoryDay_48mz2_1627 {\n  position: sticky;\n  top: 0;\n  z-index: 1;\n  margin: 0;\n  padding: 5px 10px 6px;\n  background: var(--dsw-alias-bg-base);\n  color: var(--dsw-alias-label-caption);\n  font-size: 11px;\n  font-weight: 500;\n  line-height: 16px;\n  letter-spacing: 0.04em;\n}\n\n._runHistoryItems_48mz2_1641 {\n  margin: 0;\n  padding: 0;\n  list-style: none;\n  min-width: 0;\n}\n\n._runHistoryItem_48mz2_1641 {\n  min-width: 0;\n}\n\n/* Rows separate by a hairline rather than by their own borders: seven outlined boxes\n   read as seven unrelated cards, while one column of rows reads as one day's work. */\n._runHistoryItem_48mz2_1641 + ._runHistoryItem_48mz2_1641 {\n  border-top: 1px solid var(--dsw-alias-border-l1);\n}\n\n/* The row is a container rather than the button itself: a run in flight carries a stop\n   control of its own, and a button inside a button is not a thing a browser can draw. */\n._runHistoryRow_48mz2_1660 {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  width: 100%;\n  min-width: 0;\n  margin: 0;\n  padding: 10px;\n  border-radius: var(--dsw-radius-sm);\n}\n\n._runHistoryRow_48mz2_1660:hover {\n  background: var(--dsw-alias-bg-fill-hover);\n}\n\n._runHistoryOpen_48mz2_1675 {\n  position: relative;\n  display: flex;\n  align-items: center;\n  gap: 12px;\n  flex: 1 1 auto;\n  min-width: 0;\n  margin: 0;\n  padding: 0;\n  border: 0;\n  background: none;\n  color: inherit;\n  font: inherit;\n  text-align: left;\n  cursor: pointer;\n}\n\n/* A run that did not finish earns a mark on the row's edge.\n\n   Seven rows of one card are mostly the same shape, and the one that failed differs\n   only in a small word on the far right: the eye scanning the titles had nothing to\n   catch on. The bar is that catch, and it is drawn inside the row's padding so that no\n   row's text moves — the list keeps one left edge, marked rows included. */\n._runHistoryOpen_48mz2_1675::before {\n  content: '';\n  position: absolute;\n  /* On the row's own left edge, one row's padding away from the text: far enough that it\n     reads as a margin mark rather than as part of the first glyph. */\n  left: -10px;\n  top: 50%;\n  width: 2px;\n  height: 18px;\n  margin-top: -9px;\n  border-radius: 1px;\n  background: transparent;\n}\n\n._runHistoryOpen_48mz2_1675[data-run-outcome='aborted']::before {\n  background: var(--dsw-alias-state-warn-label);\n}\n\n._runHistoryOpen_48mz2_1675[data-run-outcome='error']::before,\n._runHistoryOpen_48mz2_1675[data-run-outcome='failed']::before {\n  background: var(--dsw-alias-state-error-primary);\n}\n\n._runHistoryOpen_48mz2_1675[data-run-outcome='running']::before {\n  background: var(--dsw-alias-link);\n}\n\n/* The stop control is quiet until it is wanted: it sits beside the outcome it ends, and\n   only the row of a run in flight has one. */\n._runHistoryStop_48mz2_1727 {\n  flex: none;\n  margin: 0;\n  padding: 2px 8px;\n  border: 1px solid var(--dsw-alias-border-secondary);\n  border-radius: var(--dsw-radius-sm);\n  background: none;\n  color: var(--dsw-alias-label-secondary);\n  font: inherit;\n  font-size: 11px;\n  line-height: 16px;\n  cursor: pointer;\n}\n\n._runHistoryStop_48mz2_1727:hover {\n  color: var(--dsw-alias-label-primary);\n  border-color: var(--dsw-alias-border-primary);\n}\n\n._runHistoryBody_48mz2_1746 {\n  display: flex;\n  flex-direction: column;\n  gap: 1px;\n  flex: 1 1 auto;\n  min-width: 0;\n}\n\n/* The run's content is the row's title: the only line at reading weight, and the only\n   one allowed to be the first thing the eye lands on. */\n._runHistoryTitle_48mz2_1756 {\n  min-width: 0;\n  color: var(--dsw-alias-label-primary);\n  font-size: 14px;\n  font-weight: 500;\n  line-height: 21px;\n  /* One line: a two-line clamp let one long title stand taller than its neighbours and\n     made the rhythm of the list ragged. */\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n/* A run that stored nothing still owns the row's first line. Without it the row was a\n   lone grey meta line, which read as a row that had failed to load rather than a run that\n   had nothing to say. */\n._runHistoryTitle_48mz2_1756[data-empty='true'] {\n  font-weight: 400;\n  color: var(--dsw-alias-label-tertiary);\n}\n\n._runHistoryMeta_48mz2_1777 {\n  display: flex;\n  align-items: baseline;\n  min-width: 0;\n  flex-wrap: wrap;\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 11px;\n  line-height: 16px;\n}\n\n/* The same middot the page head uses between its facts, for the same reason: a clock, a\n   model id, and an ordinal set in one grey with only space between them read as one\n   string. */\n._runHistoryMeta_48mz2_1777 > * + *::before {\n  content: '·';\n  margin: 0 6px;\n  color: var(--dsw-alias-label-caption);\n}\n\n/* The clock is the one fact on this line a reader compares across rows, so it is a step\n   above the model id and the ordinal, in figures that line up column-wise. */\n._runHistoryTime_48mz2_1798 {\n  color: var(--dsw-alias-label-secondary);\n  font-size: 12px;\n  font-variant-numeric: tabular-nums;\n  white-space: nowrap;\n}\n\n._runHistoryModel_48mz2_1805 {\n  /* Wide enough for a real model id — `GLM-FLASH-LATEST` — so the truncation lands on a\n     name that is actually long rather than on the one this workbench runs. */\n  max-width: 24ch;\n  color: var(--dsw-alias-label-tertiary);\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n._runHistoryOrdinal_48mz2_1815,\n._runHistoryEdited_48mz2_1816 {\n  flex: none;\n  color: var(--dsw-alias-label-tertiary);\n  white-space: nowrap;\n}\n\n/* What the run was asked for: one line under the row's own meta, because two runs of one\n   card differ by this and a wrapped quote would make every row's height depend on how much\n   was typed. The full text is on the result page that opens from the row. */\n._runHistoryInstruction_48mz2_1825 {\n  display: block;\n  max-width: 100%;\n  color: var(--dsw-alias-label-secondary);\n  font-size: 11px;\n  line-height: 16px;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n._runHistorySide_48mz2_1836 {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  flex: none;\n}\n\n/* The outcome is a quiet dot and a word. Only a run that did not complete earns a\n   hearing: a wall of neutral \"已完成\" would compete with the titles it sits beside.\n\n   Right-aligned in a column of its own width, so the dots and the words line up down the\n   right edge instead of starting wherever each word's length puts them. */\n._runHistoryOutcome_48mz2_1848 {\n  display: inline-flex;\n  align-items: center;\n  justify-content: flex-end;\n  gap: 5px;\n  min-width: 4em;\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 11px;\n  line-height: 16px;\n  white-space: nowrap;\n}\n\n._runHistoryDot_48mz2_1860 {\n  width: 6px;\n  height: 6px;\n  flex: none;\n  border-radius: 50%;\n  background: currentColor;\n}\n\n._runHistoryRow_48mz2_1660 [data-run-outcome='aborted'] ._runHistoryOutcome_48mz2_1848 {\n  color: var(--dsw-alias-state-warn-label);\n}\n\n._runHistoryRow_48mz2_1660 [data-run-outcome='error'] ._runHistoryOutcome_48mz2_1848,\n._runHistoryRow_48mz2_1660 [data-run-outcome='failed'] ._runHistoryOutcome_48mz2_1848 {\n  color: var(--dsw-alias-state-error-primary);\n}\n\n._runHistoryRow_48mz2_1660 [data-run-outcome='running'] ._runHistoryOutcome_48mz2_1848 {\n  color: var(--dsw-alias-link);\n}\n\n._runHistoryRow_48mz2_1660 [data-run-outcome='running'] ._runHistoryDot_48mz2_1860 {\n  animation: _runHistoryPulse_48mz2_1 1.4s ease-in-out infinite;\n}\n\n@keyframes _runHistoryPulse_48mz2_1 {\n  0%, 100% { opacity: 1; }\n  50% { opacity: 0.25; }\n}\n\n@media (prefers-reduced-motion: reduce) {\n  ._runHistoryRow_48mz2_1660[data-run-outcome='running'] ._runHistoryDot_48mz2_1860 {\n    animation: none;\n  }\n}\n\n/* The way in, quiet at rest and nudged on hover: the whole row is the control, and this\n   only has to say which direction it goes. */\n._runHistoryChevron_48mz2_1898 {\n  display: inline-flex;\n  flex: none;\n  color: var(--dsw-alias-label-caption);\n  line-height: 1;\n  transition: color 0.15s ease, transform 0.15s ease;\n}\n\n._runHistoryRow_48mz2_1660:hover ._runHistoryChevron_48mz2_1898,\n._runHistoryOpen_48mz2_1675:focus-visible ._runHistoryChevron_48mz2_1898 {\n  color: var(--dsw-alias-label-secondary);\n  transform: translateX(2px);\n}/* Workbench card shell: the frame every card renders inside. */\n\n._card_13mto_3 {\n  display: flex;\n  flex-direction: column;\n  gap: 10px;\n  box-sizing: border-box;\n  height: 100%;\n  /* A card is an index entry, not a panel: with the name, the meta line, and the body\n     it carries it does not need the height an empty cell used to ask for, and the\n     shorter frame is what stops three cards from reading as three blanks. */\n  min-height: 168px;\n  padding: 16px 18px;\n  border: 1px solid var(--dsw-alias-border-l1);\n  border-radius: 12px;\n  background: var(--dsw-alias-bg-layer-1);\n  transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;\n}\n\n._spanWide_13mto_20 {\n  grid-column: span 2;\n}\n\n/* A card that opens something in full. The region is focusable, so it carries the\n   pointer and focus affordances a button would; it cannot BE a button, because the\n   card hosts its own controls in the head action area. */\n._activatable_13mto_27 {\n  cursor: pointer;\n}\n\n._activatable_13mto_27:hover {\n  border-color: var(--dsw-alias-brand-primary);\n  /* A lift, not a colour change: the card already changes border on hover, and the\n     shadow is what reads as \"this opens something\" before the pointer arrives. */\n  box-shadow: 0 6px 16px -6px rgb(0 0 0 / 18%);\n  transform: translateY(-1px);\n}\n\n._activatable_13mto_27:focus-visible {\n  outline: 2px solid var(--dsw-alias-brand-primary);\n  outline-offset: 1px;\n}\n\n._spanTall_13mto_44 {\n  grid-row: span 2;\n}\n\n._spanLarge_13mto_48 {\n  grid-column: span 2;\n  grid-row: span 2;\n}\n\n._head_13mto_53 {\n  display: flex;\n  flex-direction: column;\n  gap: 6px;\n  min-width: 0;\n}\n\n/* The card's monogram: the first character of the user's own name for the card, on a\n   tint that is stable per card.\n   \n   Three cards of one workbench differ only in their titles, and a title is read rather\n   than seen — so the grid needed one mark each that the eye can pick out before the\n   text is read. The hue comes from the card id (see the shell), never from the name: a\n   card keeps its colour when it is renamed. Tints are mixed from a single hue so the\n   mark works in both themes without a second set of tokens. */\n._mark_13mto_68 {\n  flex: none;\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  width: 28px;\n  height: 28px;\n  border-radius: 9px;\n  background: color-mix(in srgb, hsl(var(--wb-hue, 250) 68% 52%) 16%, transparent);\n  color: color-mix(in srgb, hsl(var(--wb-hue, 250) 66% 42%) 78%, var(--dsw-alias-label-primary));\n  font-size: 13px;\n  font-weight: 600;\n  line-height: 1;\n  user-select: none;\n}\n\n/* The title, the status, and the card's own controls share one line. Centring that\n   line is what puts them on a single baseline: the three boxes have different\n   heights, so top-aligning them left the status text and the button labels at\n   different offsets from the title. The subtitle sits below this line rather than\n   inside it, so a wrapping subtitle cannot drag the controls out of place. */\n._headRow_13mto_89 {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  min-width: 0;\n}\n\n._title_13mto_96 {\n  margin: 0;\n  flex: 1 1 auto;\n  min-width: 0;\n  font-size: 15px;\n  font-weight: 600;\n  line-height: 22px;\n  overflow-wrap: anywhere;\n}\n\n/* Everything the card states about itself that is not its name: the skill it runs and\n   the run it last finished. One row under the title, in the secondary colour, so the\n   title keeps the whole width and the facts line up across the grid. */\n._meta_13mto_109 {\n  display: flex;\n  align-items: center;\n  flex-wrap: wrap;\n  gap: 4px 10px;\n  min-width: 0;\n}\n\n/* The skill name is a chip rather than a second line of grey text: it is a fact about\n   the card, not a subtitle of its name, and the chip is what separates the two levels. */\n._subtitle_13mto_119 {\n  display: inline-block;\n  align-self: flex-start;\n  max-width: 100%;\n  padding: 1px 8px;\n  border-radius: 6px;\n  background: var(--dsw-alias-bg-layer-2);\n  font-size: 11px;\n  line-height: 18px;\n  color: var(--dsw-alias-label-secondary);\n  overflow-wrap: anywhere;\n}\n\n._status_13mto_132 {\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n  flex: none;\n  font-size: 12px;\n  line-height: 18px;\n  color: var(--dsw-alias-label-secondary);\n}\n\n._headActions_13mto_142 {\n  display: inline-flex;\n  align-items: center;\n  gap: 4px;\n  flex: none;\n}\n\n._iconButton_13mto_149 {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  width: 24px;\n  height: 24px;\n  padding: 0;\n  border: 0;\n  border-radius: 6px;\n  background: transparent;\n  color: var(--dsw-alias-label-secondary);\n  cursor: pointer;\n  opacity: 0;\n}\n\n/* The card's own controls and the host's icon controls are hidden until the card is\n   hovered or focused: at rest the title is the only thing on the line. */\n._card_13mto_3:hover ._iconButton_13mto_149,\n._card_13mto_3:focus-within ._iconButton_13mto_149 {\n  opacity: 1;\n}\n\n._iconButton_13mto_149:hover {\n  background: var(--dsw-alias-bg-layer-2);\n  color: var(--dsw-alias-label-primary);\n}\n\n._iconButton_13mto_149:focus-visible {\n  outline: 2px solid var(--dsw-alias-brand-primary);\n  outline-offset: 1px;\n}\n\n/* The reorder handle reveals with the other icon controls and sits in the tertiary\n   colour, so it reads as an affordance rather than as a peer of the card's own\n   actions. Hovering it brings it back to the primary label colour, and because it is\n   inside the card, focusing it from the keyboard reveals it too. */\n._handle_13mto_185 {\n  color: var(--dsw-alias-label-tertiary);\n  cursor: grab;\n  touch-action: none;\n}\n\n._handle_13mto_185:active {\n  cursor: grabbing;\n}\n\n._body_13mto_195 {\n  flex: 1 1 auto;\n  min-height: 0;\n  font-size: 13px;\n  line-height: 20px;\n  color: var(--dsw-alias-label-secondary);\n}\n\n._failure_13mto_203 {\n  display: flex;\n  flex-direction: column;\n  align-items: flex-start;\n  gap: 8px;\n  color: var(--dsw-alias-label-secondary);\n}\n\n._dragging_13mto_211 {\n  opacity: 0.6;\n}\n/*$vite$:1*/";
  if (typeof document !== 'undefined' && document.querySelector("style[data-plugin-css=\"dsh-workbench\"]") === null) {
    const tag = document.createElement('style');
    tag.dataset.pluginCss = "dsh-workbench";
    tag.textContent = css;
    document.head.appendChild(tag);
  }
}
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let _deepseek_ai_dsh_client_store = require("@deepseek-ai/dsh-client-store");
		let _deepseek_ai_dsh_client_ui_slots = require("@deepseek-ai/dsh-client-ui-slots");
		let react = require("react");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let react_jsx_runtime = require("react/jsx-runtime");
		let react_dom = require("react-dom");
		let react_dom_client = require("react-dom/client");
		//#region src/client/workbench-panel.ts
		/** Sidebar row id, shared with the main-slot key it opens. A product-reserved key. */
		var WORKBENCH_PANEL_ID = "workbench";
		//#endregion
		//#region src/layout-contract.ts
		/**
		* Wire contract shared by the workbench's Host and Client halves: the private
		* layout route, its payload schemas, and the limits both sides enforce. The
		* module carries no runtime dependency so the browser bundle can inline it.
		* @module dsh-workbench/layout-contract
		*/
		/** Private same-origin route serving the workbench card layout. */
		var WORKBENCH_LAYOUT_PATH = "/api/workbench/layout";
		/** Card identity: namespaced lowercase slug, also the storage record key. */
		var WORKBENCH_CARD_ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/;
		/** First position value; the client multiplies by {@link WORKBENCH_POSITION_STEP} when it renumbers. */
		var WORKBENCH_POSITION_BASE = 1024;
		/**
		* Whether a value is a usable card identity.
		* @param value - candidate identity.
		* @returns whether the value is a namespaced slug within the length limit.
		*/
		function isWorkbenchCardId(value) {
			return value.length > 0 && value.length <= 64 && WORKBENCH_CARD_ID_PATTERN.test(value);
		}
		//#endregion
		//#region src/client/layout-api.ts
		/** Queue depth above which the oldest waiting change is dropped. */
		var MAX_QUEUED_WRITES$1 = 8;
		/** Backoff before the single retry of a transport failure. */
		var RETRY_DELAY_MS = 200;
		/**
		* Build the layout API.
		* @param options - transport and delay seams.
		* @returns the read/write face.
		*/
		function createWorkbenchLayoutApi(options = {}) {
			const fetcher = options.fetcher ?? ((input, init) => globalThis.fetch(input, init));
			const delay = options.delay ?? ((ms) => new Promise((resolve) => {
				setTimeout(resolve, ms);
			}));
			let tail = Promise.resolve({
				status: "failed",
				reason: "no write was issued"
			});
			let queued = 0;
			const send = async (patch) => {
				const attempt = async () => {
					let response;
					try {
						response = await fetcher(WORKBENCH_LAYOUT_PATH, {
							method: "PATCH",
							credentials: "same-origin",
							redirect: "error",
							cache: "no-store",
							headers: {
								"Accept": "application/json",
								"Content-Type": "application/json"
							},
							body: JSON.stringify(patch)
						});
					} catch (error) {
						return {
							status: "failed",
							reason: `layout request failed: ${messageOf$1(error)}`
						};
					}
					if (response.status === 409) {
						const snapshot = await readSnapshot(response);
						return snapshot === void 0 ? {
							status: "failed",
							reason: "conflict response was not readable"
						} : {
							status: "conflict",
							snapshot
						};
					}
					if (!response.ok) return {
						status: "failed",
						reason: `layout route answered ${String(response.status)}`
					};
					const snapshot = await readSnapshot(response);
					return snapshot === void 0 ? {
						status: "failed",
						reason: "layout response did not match the contract"
					} : {
						status: "ok",
						snapshot
					};
				};
				const first = await attempt();
				if (first.status === "failed" && first.reason.startsWith("layout request failed")) {
					await delay(RETRY_DELAY_MS);
					return await attempt();
				}
				return first;
			};
			return {
				async read(signal) {
					let response;
					try {
						response = await fetcher(WORKBENCH_LAYOUT_PATH, {
							method: "GET",
							credentials: "same-origin",
							redirect: "error",
							cache: "no-store",
							headers: { "Accept": "application/json" },
							...signal === void 0 ? {} : { signal }
						});
					} catch (error) {
						return {
							status: "unavailable",
							reason: `layout request failed: ${messageOf$1(error)}`
						};
					}
					if (!response.ok) return {
						status: "unavailable",
						reason: `layout route answered ${String(response.status)}`
					};
					const snapshot = await readSnapshot(response);
					return snapshot === void 0 ? {
						status: "unavailable",
						reason: "layout response did not match the contract"
					} : {
						status: "ok",
						snapshot
					};
				},
				async write(patch) {
					if (queued >= MAX_QUEUED_WRITES$1) return {
						status: "failed",
						reason: "too many pending layout changes"
					};
					queued += 1;
					const result = tail.then(() => send(patch)).finally(() => {
						queued -= 1;
					});
					tail = result;
					return await result;
				}
			};
		}
		/**
		* Parse one layout response body.
		* @param response - response to read.
		* @returns the snapshot, or undefined when the body is not this contract.
		*/
		async function readSnapshot(response) {
			let body;
			try {
				body = await response.json();
			} catch {
				return;
			}
			return parseSnapshot$1(body);
		}
		/**
		* Validate one snapshot body.
		* @param value - decoded body.
		* @returns the snapshot, or undefined when a field is outside the contract.
		*/
		function parseSnapshot$1(value) {
			if (typeof value !== "object" || value === null || Array.isArray(value)) return void 0;
			const body = value;
			if (body.apiVersion !== 1) return void 0;
			if (typeof body.revision !== "string") return void 0;
			if (!Array.isArray(body.entries) || body.entries.length > 256) return void 0;
			const entries = [];
			for (const raw of body.entries) {
				if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return void 0;
				const entry = raw;
				if (typeof entry.id !== "string" || !isWorkbenchCardId(entry.id)) return void 0;
				if (entry.position !== void 0 && (typeof entry.position !== "number" || !Number.isFinite(entry.position) || entry.position < 0)) return void 0;
				entries.push({
					id: entry.id,
					...entry.position === void 0 ? {} : { position: entry.position }
				});
			}
			return {
				revision: body.revision,
				entries
			};
		}
		/**
		* Render one failure for a log line or a notice.
		* @param error - the failure.
		* @returns a readable message.
		*/
		function messageOf$1(error) {
			return error instanceof Error ? error.message : String(error);
		}
		//#endregion
		//#region src/client/locales.ts
		/**
		* `workbench` locale dictionaries: the sidebar row, the panel page, the card
		* shell, the result and configuration pages, the creation tile, and the
		* accessibility announcements.
		* @module dsh-workbench/client/locales
		*/
		/** Chinese dictionary. */
		var zh = {
			panel: "工作台",
			title: "工作台",
			subtitle: "把 Git、Agent 与测试状态收在一页",
			refreshAll: "刷新",
			dragHandle: "拖动调整位置",
			announceMoved: "{title} 已移动到第 {index} 位",
			writeFailed: "布局未能保存",
			mergedElsewhere: "另一个窗口也改动了布局，已合并",
			cardFailed: "这张卡片暂时不可用",
			statusIdle: "空闲",
			statusOngoing: "进行中",
			statusDone: "完成",
			statusWarning: "注意",
			statusError: "失败",
			skillCardTitle: "技能卡",
			skillCardRun: "运行",
			skillCardCancel: "取消",
			skillCardLoading: "正在读取",
			skillCardLoadingBody: "正在读取这张卡的配置与上次结果。",
			skillCardNoTemplateTitle: "还没有模板",
			skillCardNoTemplateBody: "这张卡需要你为所选 skill 写一段 HTML 模板才能运行。",
			skillCardNotRunTitle: "尚未运行",
			skillCardNotRunBody: "点「运行」让这个 skill 执行一次。",
			skillCardResultFailedTitle: "这次运行没有产出内容",
			skillCardResultTimeoutTitle: "这次运行超时了",
			skillCardProblemNotConfigured: "还没有选择 skill",
			skillCardProblemNoTemplate: "这个 skill 还没有模板",
			skillCardProblemNoSession: "没有可用的会话",
			skillCardProblemSkillMissing: "这个 skill 已经不可用",
			skillCardProblemProvider: "当前的子代理后端不支持结构化输出",
			skillCardProblemContract: "输出契约不合法",
			skillCardProblemTemplateInvalid: "模板不合法",
			skillCardProblemRunning: "已经有一个运行在进行",
			skillCardProblemRunFailed: "这次运行没有产出可用的结果",
			skillCardProblemRunTimeout: "这次运行超过了时限，被宿主中止了；可以再跑一次",
			skillCardProblemRunUnavailable: "当前 harness 不能运行卡片：卡片运行需要提供 startActivation（0.2.1-alpha.2 / beta 通道）或 start（0.2.0-rc.2 / 稳定通道）之一，已安装的 harness 两个都没有提供",
			skillCardProblemWorkspaceMissing: "这张卡还没有选择工作目录，先选一个目录再运行",
			skillCardProblemWorkspaceInvalid: "工作目录不存在或不是文件夹",
			skillCardWorkspace: "工作目录",
			skillCardWorkspaceNotSet: "未选择",
			skillCardChooseDirectory: "选择目录",
			skillCardWorkspacePickerUnavailable: "这个环境没有目录选择器，无法选择工作目录",
			skillCardProblemTooLarge: "模板超出体积上限",
			skillCardProblemUnavailable: "暂时读不到这张卡的状态",
			skillCardProblemGeneric: "这张卡暂时不可用",
			skillCardSettings: "配置",
			skillCardSelectSkill: "选择 skill",
			skillCardSelectPlaceholder: "未选择",
			skillCardCatalogLoading: "正在读取 skill 列表…",
			skillCardCatalogFailed: "读不到 skill 列表",
			skillCardCatalogEmpty: "这个会话没有可用的 skill",
			skillCardNoSession: "读不到已安装的 skill：应用里还没有活的会话。先打开一个会话，再回来选 skill。",
			skillCardTemplateLabel: "模板",
			skillCardTemplateSizeUnit: "字节",
			skillCardTemplateDirty: "有未保存的改动",
			skillCardRegionRange: "区间 {start}–{end}",
			skillCardRegionMissing: "区间缺失",
			skillCardActionsCount: "动作声明 {count} 条",
			skillCardInsertMarkers: "插入标记",
			skillCardInsertSkeleton: "插入骨架",
			skillCardTemplateJump: "跳转到模板",
			skillCardTemplateFoldView: "折叠视图",
			skillCardTemplateEditView: "编辑",
			skillCardFoldLines: "… {count} 行",
			skillCardFoldCollapse: "收起 {name}",
			skillCardFoldExpand: "展开 {name}",
			skillCardSkeletonHeading: "任务",
			skillCardSkeletonWhat: "在这里生成要显示的内容：一行一个条目，字段按这张卡要展示的东西来定。",
			skillCardSkeletonExample: "需要按钮时写在同一行里（动作键取上方 dsh-actions 块里声明过的键）：<li>CP-2025-001 登录模块联调 <button type=\"button\" data-dsh-action=\"finish\" data-dsh-row='{\"task_number\":\"CP-2025-001\"}'>完成</button></li>",
			skillCardSkeletonQuote: "data-dsh-row 用单引号包住，值里的单引号必须写成 &#39;，否则属性会断开、这次点击会被拒绝。",
			skillCardAddAction: "添加动作",
			skillCardActionKey: "动作键",
			skillCardActionKeyHint: "字母、数字、下划线或短横线，1–32 个字符",
			skillCardActionKeyTaken: "这个动作键已经被声明过了",
			skillCardActionKind: "类型",
			skillCardActionKindCard: "卡片",
			skillCardActionKindSkill: "skill",
			skillCardActionTarget: "目标",
			skillCardActionNoCards: "还没有可以指向的卡片。先建一张卡片，再回来添加这个动作。",
			skillCardActionCardTargetMissing: "动作 {key} 指向的卡片不存在：{name}",
			skillCardActionSkillTargetMissing: "动作 {key} 指向的 skill 不存在或不能被调用：{name}",
			skillCardSectionBasics: "基本信息",
			skillCardPreviewSample: "骨架预览，区间尚未填充",
			skillCardPreviewLive: "按当前模板渲染",
			skillCardDeleteConfirm: "确认删除",
			skillCardDeleteConfirmPrompt: "删除后无法撤销，确认删除这张卡片？",
			skillCardTemplatePlaceholder: "用 HTML 写这张卡的样子，用 <!-- template-begin --> 与 <!-- template-end --> 标出要填数据的位置，并在注释里写明填写要求",
			skillCardPreview: "预览",
			skillCardSave: "保存",
			skillCardClose: "关闭",
			skillCardViolationScript: "区间内容里不允许 script 标签",
			skillCardViolationEvent: "不允许事件属性",
			skillCardViolationUrl: "不允许这种 URL 协议",
			skillCardViolationExternal: "不允许会联网加载的元素",
			skillCardViolationCss: "不允许外部 CSS 引用",
			skillCardViolationRegionMissing: "模板缺少 template-begin / template-end 标记",
			skillCardViolationRegionUnclosed: "区间标记没有成对出现",
			skillCardViolationRegionRepeated: "只支持一对区间标记",
			skillCardViolationPlaceholder: "占位符语法已移除，请改用区间标记，并在注释里写明填写要求",
			skillCardViolationActionDuplicate: "动作声明只能有一处",
			skillCardViolationActionKey: "动作键不合法（字母、数字、下划线、短横线，1–32 字符）",
			skillCardViolationActionKeyRepeated: "这个动作键被声明了两次",
			skillCardViolationActionTarget: "动作目标必须写成 card \"名称\" 或 skill \"名称\"",
			skillCardViolationActionInsideRegion: "动作声明不能写在区间内——区间每次运行都会被重写",
			skillCardPermissionLabel: "权限模式",
			skillCardPermissionReadOnly: "仅可查看",
			skillCardPermissionWorkspaceWrite: "工作区内修改",
			skillCardPermissionFullAccess: "完全权限",
			skillCardPermissionWarning: "完全权限：工作目录不再限制写入，这个 skill 可以修改工作目录以外的文件。",
			skillCardProblemPermissionUnavailable: "这张卡要求的权限模式无法应用，运行已拒绝",
			skillCardInstructionLabel: "运行指令",
			skillCardInstructionNone: "不需要",
			skillCardInstructionOptional: "可选",
			skillCardInstructionRequired: "必须",
			skillCardInstructionNote: "运行时是否要先写一句指令。选「必须」时，没有指令不会开始运行。",
			skillCardProblemInstructionMissing: "这张卡需要一句指令才能运行",
			skillCardBack: "返回",
			skillCardCardName: "卡片名称",
			skillCardModel: "模型",
			skillCardModelUnavailable: "没有可用的模型，这张卡暂时不能运行",
			skillCardProblemModelUnavailable: "这张卡指定的模型已经不可用",
			skillCardNamePlaceholder: "给这张卡起个名字",
			createCard: "创建卡片",
			createCardCancel: "取消",
			cardTypeSkill: "技能卡片",
			cardTypeTest: "测试卡片",
			cardTypeMemory: "记忆卡片",
			skillCardDelete: "删除卡片",
			removeCard: "删除卡片",
			runStatusRunning: "运行中",
			skillCardResultEdit: "编辑",
			resultEditLabel: "结果内容",
			resultEditPlaceholder: "这里是这段区间的 HTML：改完保存，它就是这张卡的结果",
			resultEditEmpty: "结果为空，没有可保存的内容。这张卡可以再运行一次，也可以在这里直接填入区间 HTML。",
			resultEditTooLarge: "内容有 {bytes} 字节，超过 {max} 字节上限，未保存。",
			runElapsed: "用时",
			runActivityTruncated: "之前还有 {dropped} 条已省略",
			runActivityReasoning: "思考",
			runActivityArgument: "参数",
			runActivityCompleted: "已完成",
			runActivityStopped: "已停止",
			runActivityFailed: "已失败",
			runActivitySteps: "{count} 步",
			runHistoryTitle: "运行记录",
			runHistoryCount: "共 {count} 次运行",
			runHistoryEmpty: "这张卡还没有运行过，回到卡片列表，在卡片上点「运行」跑第一次。",
			runHistoryEdited: "已编辑",
			runHistoryNoContent: "本次没有产出内容",
			runHistoryDayToday: "今天",
			runHistoryDayYesterday: "昨天",
			runHistoryOrdinal: "第 {n} 次",
			runHistoryLatest: "最近 {time}",
			runHistoryRunning: "运行中",
			runHistoryInstruction: "指令：{text}",
			runInstructionPlaceholderRequired: "这次要做什么？",
			runInstructionPlaceholderOptional: "补充一句指令，留空直接运行",
			runInstructionRequired: "这个技能需要一句指令才能运行",
			runInstructionRecent: "最近用过",
			runInstructionField: "运行指令",
			skillCardRunningBody: "技能正在执行，完成后结果会显示在这里。",
			resultChangeLabel: "这份结果的操作",
			resultReviseMode: "修改",
			resultFreshMode: "运行",
			promptReviseHint: "只改这一份结果，源文件不动。写完按 Enter 提交。",
			promptFreshHint: "按当前工作区从头跑一遍，会新增一次运行记录。",
			runPromptTitle: "运行这张卡",
			promptClose: "关闭",
			refinePlaceholder: "说明要改哪里，例如「按时间倒序」",
			refineAction: "重新生成",
			refineStop: "停止",
			refineLogCount: "修改记录 · {count} 次",
			refineSessionOnly: "修改记录与上一版只保留在本次会话里，重新加载就没了。",
			refineUndo: "回到上一版",
			actionPanelTitle: "确认这次执行",
			actionFieldTarget: "目标",
			actionFieldSkill: "将运行的 skill",
			actionFieldPayload: "参数",
			actionTargetCard: "卡片：{name}",
			actionTargetSkill: "skill：{name}",
			actionConfirm: "确认",
			actionCancel: "取消",
			actionCandidates: "可选：{names}",
			actionProblemMissingAction: "按钮没有带动作键，已拒绝执行",
			actionProblemMissingPayload: "这一行没有携带数据，将把当前卡片的内容传给目标",
			actionProblemMalformedPayload: "这一行的数据读不出来，已拒绝执行",
			actionProblemOversizedPayload: "这一行的数据超出体积上限，已拒绝执行",
			actionProblemUnknownAction: "模板没有声明这个动作键，已拒绝执行",
			actionProblemCardMissing: "找不到这个名称对应的卡片",
			actionProblemCardAmbiguous: "有多张同名卡片，无法确定目标",
			actionProblemSkillMissing: "找不到这个名称对应的 skill",
			actionProblemBusy: "目标卡片正在运行，等它结束再试",
			actionProblemUnavailable: "目标现在不能运行",
			bareRunRunning: "正在执行 skill {skill}",
			bareRunDone: "skill 执行完成",
			bareRunFailed: "skill 执行失败",
			documentProblemForbidden: "浏览器拒绝了这次读取",
			documentProblemPath: "这个路径不能用",
			documentProblemCard: "这张卡片已经不存在了",
			documentProblemNoWorkspace: "这张卡片还没有设置目录",
			documentProblemOutside: "这个路径不在卡片的目录里",
			documentProblemNotFound: "这个文件或目录已经不在了",
			documentProblemNotDirectory: "这个路径不是目录",
			documentProblemNotFile: "这个路径不是文件",
			documentProblemNotText: "这个文件不是文本，无法显示",
			documentProblemTooLarge: "这个文件太大，无法显示",
			documentProblemUnreachable: "读不到卡片目录",
			documentProblemUnreadable: "读取结果无法识别",
			documentCopy: "复制",
			documentCopied: "已复制",
			documentFootnotes: "脚注"
		};
		/** English dictionary; the annotation keeps both dictionaries on one key set. */
		var en = {
			panel: "Workbench",
			title: "Workbench",
			subtitle: "Git, agent, and test status on one page",
			refreshAll: "Refresh",
			dragHandle: "Drag to reorder",
			announceMoved: "{title} moved to position {index}",
			writeFailed: "The layout could not be saved",
			mergedElsewhere: "Another window changed the layout too; the two were merged",
			cardFailed: "This card is unavailable right now",
			statusIdle: "Idle",
			statusOngoing: "Running",
			statusDone: "Done",
			statusWarning: "Attention",
			statusError: "Failed",
			skillCardTitle: "Skill card",
			skillCardRun: "Run",
			skillCardCancel: "Cancel",
			skillCardLoading: "Loading",
			skillCardLoadingBody: "Reading this card’s configuration and last result.",
			skillCardNoTemplateTitle: "No template yet",
			skillCardNoTemplateBody: "This card needs an HTML template for the selected skill before it can run.",
			skillCardNotRunTitle: "Not run yet",
			skillCardNotRunBody: "Run to let the skill execute once.",
			skillCardResultFailedTitle: "This run produced no content",
			skillCardResultTimeoutTitle: "This run timed out",
			skillCardProblemNotConfigured: "No skill selected yet",
			skillCardProblemNoTemplate: "This skill has no template",
			skillCardProblemNoSession: "No session is available",
			skillCardProblemSkillMissing: "That skill is no longer available",
			skillCardProblemProvider: "The configured subagent backend cannot return structured output",
			skillCardProblemContract: "The output contract is not valid",
			skillCardProblemTemplateInvalid: "The template is not valid",
			skillCardProblemRunning: "Another run is already in flight",
			skillCardProblemRunFailed: "The run produced no usable result",
			skillCardProblemRunTimeout: "This run passed its time limit and the host stopped it; running it again is the next step",
			skillCardProblemRunUnavailable: "This harness cannot run cards: a card run needs one of startActivation (0.2.1-alpha.2, the beta channel) or start (0.2.0-rc.2, the stable channel), and the installed harness provides neither",
			skillCardProblemWorkspaceMissing: "No workspace directory is selected for this card; choose one before running",
			skillCardProblemWorkspaceInvalid: "The workspace directory does not exist or is not a folder",
			skillCardWorkspace: "Workspace",
			skillCardWorkspaceNotSet: "Not selected",
			skillCardChooseDirectory: "Choose directory",
			skillCardWorkspacePickerUnavailable: "This environment has no directory picker, so a workspace cannot be chosen",
			skillCardProblemTooLarge: "The template is above the size limit",
			skillCardProblemUnavailable: "This card’s state cannot be read right now",
			skillCardProblemGeneric: "This card is unavailable right now",
			skillCardSettings: "Configure",
			skillCardSelectSkill: "Skill",
			skillCardSelectPlaceholder: "Not selected",
			skillCardCatalogLoading: "Reading the skill list…",
			skillCardCatalogFailed: "The skill list could not be read",
			skillCardCatalogEmpty: "This session has no invocable skills",
			skillCardNoSession: "Cannot read the installed skills: no session is live yet. Open one, then pick a skill.",
			skillCardTemplateLabel: "Template",
			skillCardTemplateSizeUnit: "bytes",
			skillCardTemplateDirty: "unsaved changes",
			skillCardRegionRange: "region {start}–{end}",
			skillCardRegionMissing: "no region",
			skillCardActionsCount: "{count} actions",
			skillCardInsertMarkers: "insert markers",
			skillCardInsertSkeleton: "insert skeleton",
			skillCardTemplateJump: "Jump to template",
			skillCardTemplateFoldView: "Fold view",
			skillCardTemplateEditView: "Edit",
			skillCardFoldLines: "… {count} lines",
			skillCardFoldCollapse: "Fold {name}",
			skillCardFoldExpand: "Unfold {name}",
			skillCardSkeletonHeading: "Tasks",
			skillCardSkeletonWhat: "Generate what this card should show here: one entry per row, with the fields this card needs.",
			skillCardSkeletonExample: "A row that needs a button carries it inline (the key comes from the dsh-actions block above): <li>CP-2025-001 Sign-in flow <button type=\"button\" data-dsh-action=\"finish\" data-dsh-row='{\"task_number\":\"CP-2025-001\"}'>Finish</button></li>",
			skillCardSkeletonQuote: "data-dsh-row is wrapped in single quotes, so a quote inside a value must be written &#39;; otherwise the attribute breaks and the click is refused.",
			skillCardAddAction: "Add action",
			skillCardActionKey: "Action key",
			skillCardActionKeyHint: "letters, digits, underscores or dashes, 1–32 characters",
			skillCardActionKeyTaken: "That action key is already declared",
			skillCardActionKind: "Type",
			skillCardActionKindCard: "Card",
			skillCardActionKindSkill: "Skill",
			skillCardActionTarget: "Target",
			skillCardActionNoCards: "There is no other card to point at yet. Create one, then add this action.",
			skillCardActionCardTargetMissing: "Action {key} points at a card that does not exist: {name}",
			skillCardActionSkillTargetMissing: "Action {key} points at a skill that is not installed or cannot be invoked: {name}",
			skillCardSectionBasics: "Basics",
			skillCardPreviewSample: "Skeleton preview, the region is not filled yet",
			skillCardPreviewLive: "Rendered from the current template",
			skillCardDeleteConfirm: "Confirm delete",
			skillCardDeleteConfirmPrompt: "This cannot be undone. Delete this card?",
			skillCardTemplatePlaceholder: "Write this card’s HTML, marking the data region with <!-- template-begin --> and <!-- template-end -->, and say what to fill in the comments",
			skillCardPreview: "Preview",
			skillCardSave: "Save",
			skillCardClose: "Close",
			skillCardViolationScript: "script elements are not allowed inside the region",
			skillCardViolationEvent: "event attributes are not allowed",
			skillCardViolationUrl: "that URL scheme is not allowed",
			skillCardViolationExternal: "elements that load over the network are not allowed",
			skillCardViolationCss: "external CSS references are not allowed",
			skillCardViolationRegionMissing: "the template has no template-begin / template-end markers",
			skillCardViolationRegionUnclosed: "the region markers are not a pair",
			skillCardViolationRegionRepeated: "only one pair of region markers is supported",
			skillCardViolationPlaceholder: "placeholder syntax was removed; use region markers and say what to fill in the comments",
			skillCardViolationActionDuplicate: "a template may declare its actions only once",
			skillCardViolationActionKey: "an action key must be 1–32 letters, digits, underscores or dashes",
			skillCardViolationActionKeyRepeated: "that action key is declared twice",
			skillCardViolationActionTarget: "an action target must read card \"name\" or skill \"name\"",
			skillCardViolationActionInsideRegion: "declare actions outside the region: the region is rewritten on every run",
			skillCardPermissionLabel: "Permission",
			skillCardPermissionReadOnly: "Read Only",
			skillCardPermissionWorkspaceWrite: "Workspace Write",
			skillCardPermissionFullAccess: "Full access",
			skillCardPermissionWarning: "Full access: the workspace no longer limits writes, so this skill can change files outside it.",
			skillCardProblemPermissionUnavailable: "This card’s permission mode could not be applied, so the run was refused",
			skillCardInstructionLabel: "Run instruction",
			skillCardInstructionNone: "Not needed",
			skillCardInstructionOptional: "Optional",
			skillCardInstructionRequired: "Required",
			skillCardInstructionNote: "Whether a run needs a sentence first. On Required, a run will not start without one.",
			skillCardProblemInstructionMissing: "This card needs an instruction before it can run",
			skillCardBack: "Back",
			skillCardCardName: "Card name",
			skillCardModel: "Model",
			skillCardModelUnavailable: "No model is available, so this card cannot run",
			skillCardProblemModelUnavailable: "The model this card names is no longer available",
			skillCardNamePlaceholder: "Name this card",
			createCard: "Create card",
			createCardCancel: "Cancel",
			cardTypeSkill: "Skill card",
			cardTypeTest: "Test card",
			cardTypeMemory: "Memory card",
			skillCardDelete: "Delete card",
			removeCard: "Delete card",
			runStatusRunning: "Running",
			skillCardResultEdit: "Edit",
			resultEditLabel: "Result content",
			resultEditPlaceholder: "The region’s HTML: saving it becomes this card’s result",
			resultEditEmpty: "The result is empty, so there is nothing to save. Run this card again, or type the region HTML here.",
			resultEditTooLarge: "The content is {bytes} bytes, over the {max}-byte limit, so nothing was saved.",
			runElapsed: "Elapsed",
			runActivityTruncated: "{dropped} earlier entries omitted",
			runActivityReasoning: "Thinking",
			runActivityArgument: "Arguments",
			runActivityCompleted: "Completed",
			runActivityStopped: "Stopped",
			runActivitySteps: "{count} steps",
			runActivityFailed: "Failed",
			runHistoryTitle: "Run history",
			runHistoryCount: "{count} runs",
			runHistoryEmpty: "This card has not run yet. Go back to the cards and run it from its own control.",
			runHistoryEdited: "Edited",
			runHistoryNoContent: "This run produced nothing",
			runHistoryDayToday: "Today",
			runHistoryDayYesterday: "Yesterday",
			runHistoryOrdinal: "Run {n}",
			runHistoryLatest: "latest {time}",
			runHistoryRunning: "Running",
			runHistoryInstruction: "Instruction: {text}",
			runInstructionPlaceholderRequired: "What should this run do?",
			runInstructionPlaceholderOptional: "Add an instruction, or leave it empty to run",
			runInstructionRequired: "This skill needs an instruction before it can run",
			runInstructionRecent: "Recent",
			runInstructionField: "Run instruction",
			skillCardRunningBody: "The skill is executing. Its result appears here when it finishes.",
			resultChangeLabel: "What you can do with this result",
			resultReviseMode: "Modify",
			resultFreshMode: "Run",
			promptReviseHint: "Changes only this result; the source files stay as they are. Enter submits.",
			promptFreshHint: "Runs the card again on the current workspace, as a new run in its history.",
			runPromptTitle: "Run this card",
			promptClose: "Close",
			refinePlaceholder: "Say what to change, e.g. “newest first”",
			refineAction: "Regenerate",
			refineStop: "Stop",
			refineLogCount: "Revision log · {count}",
			refineSessionOnly: "The revision log and the previous version are kept only for this session; a reload clears them.",
			refineUndo: "Back to previous",
			actionPanelTitle: "Confirm this run",
			actionFieldTarget: "Target",
			actionFieldSkill: "Skill that will run",
			actionFieldPayload: "Parameters",
			actionTargetCard: "Card: {name}",
			actionTargetSkill: "Skill: {name}",
			actionConfirm: "Confirm",
			actionCancel: "Cancel",
			actionCandidates: "Choices: {names}",
			actionProblemMissingAction: "The button carried no action key, so nothing ran",
			actionProblemMissingPayload: "This row carried no data; the current card’s content goes to the target instead",
			actionProblemMalformedPayload: "This row’s data could not be read whole, so nothing ran",
			actionProblemOversizedPayload: "This row’s data is over the size limit, so nothing ran",
			actionProblemUnknownAction: "The template does not declare this action key, so nothing ran",
			actionProblemCardMissing: "No card has that name",
			actionProblemCardAmbiguous: "More than one card has that name, so the target is ambiguous",
			actionProblemSkillMissing: "No installed skill has that name",
			actionProblemBusy: "The target card is already running; try again when it finishes",
			actionProblemUnavailable: "That target cannot run right now",
			bareRunRunning: "Running skill {skill}",
			bareRunDone: "The skill finished",
			bareRunFailed: "The skill failed",
			documentProblemForbidden: "The browser refused this read",
			documentProblemPath: "That path cannot be used",
			documentProblemCard: "This card no longer exists",
			documentProblemNoWorkspace: "This card has no directory yet",
			documentProblemOutside: "That path is outside the card’s directory",
			documentProblemNotFound: "That file or directory is gone",
			documentProblemNotDirectory: "That path is not a directory",
			documentProblemNotFile: "That path is not a file",
			documentProblemNotText: "That file is not text, so it cannot be shown",
			documentProblemTooLarge: "That file is too large to show",
			documentProblemUnreachable: "The card’s directory cannot be reached",
			documentProblemUnreadable: "The answer could not be read",
			documentCopy: "Copy",
			documentCopied: "Copied",
			documentFootnotes: "Footnotes"
		};
		//#endregion
		//#region src/skill-card-contract.ts
		/** Private same-origin route serving the skill card's configuration and results. */
		var WORKBENCH_SKILL_CARD_PATH = "/api/workbench/skill-card";
		/** Session-scoped skill catalog route. */
		var WORKBENCH_SKILL_CARD_CATALOG_PATH = `${WORKBENCH_SKILL_CARD_PATH}/catalog`;
		/** Run control route: `POST` starts, `GET` polls, `DELETE` cancels. */
		var WORKBENCH_SKILL_CARD_RUN_PATH = `${WORKBENCH_SKILL_CARD_PATH}/run`;
		/**
		* Stored-result edit route: `PUT` replaces one card's region HTML by hand.
		*
		* A route of its own rather than a fourth method on the run route: editing a result is
		* not a run. It spends no model call, it has no phase to poll, and bending the run route
		* into it would make every run precondition answer for an operation that does not run
		* anything.
		*/
		var WORKBENCH_SKILL_CARD_RESULT_PATH = `${WORKBENCH_SKILL_CARD_PATH}/result`;
		/**
		* Directory-check route: `GET path=…` answers whether one directory can be a workspace.
		*
		* One narrow read rather than a filesystem bridge: the client needs existence, kind, and
		* writability for exactly one path, which is the card's own workspace. Answers exist
		* because a run is gated on them: a card whose directory was moved has to be stopped
		* before it starts, not after it fails.
		*/
		var WORKBENCH_SKILL_CARD_DIRECTORY_PATH = `${WORKBENCH_SKILL_CARD_PATH}/directory`;
		/**
		* Document route: `GET cardId=…&path=…` lists one directory or reads one text file.
		*
		* The one route a card's own script calls. A template cannot read a filesystem — a page has
		* no such API — so the documents a run wrote are read here, by the Host, through a read that
		* is confined to the card's own workspace directory and refuses anything that is not text.
		* `path` is relative to that directory (or absolute, and then it has to resolve inside it);
		* an empty `path` names the directory itself.
		*/
		var WORKBENCH_SKILL_CARD_FILES_PATH = `${WORKBENCH_SKILL_CARD_PATH}/files`;
		/** Maximum bytes of one template. */
		var WORKBENCH_TEMPLATE_MAX_BYTES = 32768;
		/** Maximum bytes of one stored result, counted over the structured value and the text output. */
		var WORKBENCH_RESULT_MAX_BYTES = 65536;
		/**
		* Name of the comment that opens the region a child fills.
		*
		* A template is a whole document: styles and headings say how the result looks but
		* nothing about what to report. The markers delimit the part that does, and the
		* comments inside that part are the instruction.
		*/
		var WORKBENCH_REGION_BEGIN = "template-begin";
		/** Name of the comment that closes the region a child fills. */
		var WORKBENCH_REGION_END = "template-end";
		/**
		* Build the pattern matching one region marker comment.
		*
		* A fresh pattern per call: a shared global regex carries `lastIndex` between callers.
		* @param name - marker name, without the comment delimiters.
		* @returns the pattern.
		*/
		function regionMarkerPattern(name) {
			return new RegExp(`<!--\\s*${name}\\s*-->`, "g");
		}
		/**
		* The output contract every run asks its child for.
		*
		* One property: the child returns the filled region as HTML rather than a set of named
		* values, because the template's own comments say what to produce. There is no field
		* list left to validate against, so nothing about the result can fail on shape.
		*/
		var WORKBENCH_OUTPUT_SCHEMA = {
			type: "object",
			properties: { html: { type: "string" } },
			required: ["html"],
			additionalProperties: true
		};
		/**
		* Attribute carrying the action key on a button a child authored.
		*
		* The key names a declaration the template holds, never a card or skill directly: the
		* child may choose which declared target a row uses, but it cannot invent one.
		*/
		var WORKBENCH_ACTION_ATTRIBUTE = "data-dsh-action";
		/** Attribute carrying that row's raw fields, as JSON, on the same button. */
		var WORKBENCH_PAYLOAD_ATTRIBUTE = "data-dsh-row";
		/** Action key grammar, the same shape as an MCP server name. */
		var WORKBENCH_ACTION_KEY_PATTERN = /^[A-Za-z0-9_-]{1,32}$/;
		/**
		* Marker opening the block where a template declares its action targets.
		*
		* The declaration lives in the template, outside the filled region, because the region
		* is rewritten by the child on every run. A target the child could author would be a
		* target the child could invent.
		*/
		var WORKBENCH_ACTIONS_MARKER = "dsh-actions";
		/**
		* Skill name grammar, matching the skill registry's own rule exactly: kebab
		* case, with no leading, trailing, or repeated hyphen.
		*/
		var WORKBENCH_SKILL_NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
		/**
		* Whether a value is a usable card name.
		*
		* Whitespace is not part of the name, and a name that is only whitespace is no
		* name at all: the card falls back to its registered label instead.
		* @param value - candidate name.
		* @returns whether the value holds visible text within the length limit.
		*/
		function isWorkbenchCardName(value) {
			return value.trim().length > 0 && value.length <= 60;
		}
		/**
		* Whether a value addresses a registered skill.
		* @param value - candidate skill name.
		* @returns whether the value is a kebab-case name within the length limit.
		*/
		function isWorkbenchSkillName(value) {
			return value.length > 0 && value.length <= 64 && WORKBENCH_SKILL_NAME_PATTERN.test(value);
		}
		/**
		* Whether a value is a usable card route.
		* @param value - candidate value.
		* @returns whether it holds two non-empty ids.
		*/
		function isWorkbenchCardModel(value) {
			if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
			const provider = Reflect.get(value, "provider");
			const model = Reflect.get(value, "model");
			return typeof provider === "string" && provider.length > 0 && typeof model === "string" && model.length > 0;
		}
		/** A drive-qualified Windows path: `C:\…`, `C:/…`, and the bare drive root. */
		var WINDOWS_ABSOLUTE_PATH = /^[A-Za-z]:[\\/]/;
		/** A UNC share: `\\server\share`, or the forward-slash spelling of the same thing. */
		var UNC_ABSOLUTE_PATH = /^[\\/]{2}[^\\/]/;
		/** A POSIX absolute path, including the root itself. */
		var POSIX_ABSOLUTE_PATH = /^\//;
		/**
		* Whether a value can be stored as a card's workspace path.
		*
		* The full absolute path is the whole of the value — never a workspace id — because the
		* product decision is "whatever directory the user picks", which need not be a registered
		* workspace at all. A relative path is refused rather than resolved against something:
		* resolved against the session it would be a different directory per run, and resolved
		* against the Host it would be a directory the user never saw.
		* @param value - candidate path, as a picker reported it.
		* @returns whether it is an absolute path within the length limit.
		*/
		function isWorkbenchWorkspacePath(value) {
			if (value.length === 0 || value.length > 4096) return false;
			if (value.includes("\0")) return false;
			return WINDOWS_ABSOLUTE_PATH.test(value) || UNC_ABSOLUTE_PATH.test(value) || POSIX_ABSOLUTE_PATH.test(value);
		}
		/**
		* How much instruction one card's runs need before they can start.
		*
		* A property of the skill rather than of a run: some skills work on their own — a
		* directory reader, a status board — and some only make sense once told what to act on.
		* Declaring it lets the card ask before it starts instead of running on an empty ask, and
		* lets a card that needs nothing stay uncluttered.
		*/
		var WORKBENCH_INSTRUCTION_MODES = [
			"none",
			"optional",
			"required"
		];
		/**
		* Whether a value is an instruction mode a card may store.
		* @param value - candidate value, read from storage or from a request body.
		* @returns whether it is one of {@link WORKBENCH_INSTRUCTION_MODES}.
		*/
		function isWorkbenchInstructionMode(value) {
			return typeof value === "string" && WORKBENCH_INSTRUCTION_MODES.includes(value);
		}
		/**
		* Resolve the mode one card actually uses.
		*
		* The single place unset becomes a mode, for the same reason the sandbox mode has one: the
		* settings page displays it, the run bar renders it, and the runner enforces it, so all
		* three read the same answer.
		* @param stored - the mode the card stores, when it stores one.
		* @returns the stored mode, or {@link WORKBENCH_DEFAULT_INSTRUCTION_MODE}.
		*/
		function effectiveWorkbenchInstructionMode(stored) {
			return stored ?? "none";
		}
		/**
		* Whether a value is a usable card workspace.
		* @param value - candidate value.
		* @returns whether it holds one absolute directory path.
		*/
		function isWorkbenchCardWorkspace(value) {
			if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
			const path = Reflect.get(value, "path");
			return typeof path === "string" && isWorkbenchWorkspacePath(path);
		}
		/**
		* Every permission mode a card may run under.
		*
		* The upstream sandbox vocabulary, repeated here because this module carries no runtime
		* dependency. A mode added upstream that this list does not know is refused at the schema
		* and at the route rather than stored and later ignored.
		*/
		var WORKBENCH_SANDBOX_MODES = [
			"read-only",
			"workspace-write",
			"danger-full-access"
		];
		/**
		* Whether a value is a mode a card may store.
		* @param value - candidate value, read from storage or from a request body.
		* @returns whether it is one of {@link WORKBENCH_SANDBOX_MODES}.
		*/
		function isWorkbenchSandboxMode(value) {
			return typeof value === "string" && WORKBENCH_SANDBOX_MODES.includes(value);
		}
		/**
		* Resolve the mode one run actually uses.
		*
		* This is the single place unset becomes a mode. The configuration page displays it, the
		* runner applies it and the card-agent cache keys on it, so all three read the same answer
		* instead of each defaulting differently.
		* @param stored - the mode the card stores, when it stores one.
		* @returns the stored mode, or {@link WORKBENCH_DEFAULT_SANDBOX_MODE}.
		*/
		function effectiveWorkbenchSandboxMode(stored) {
			return stored ?? "workspace-write";
		}
		//#endregion
		//#region src/client/skill-card/api.ts
		/** Queue depth above which the oldest waiting change is dropped. */
		var MAX_QUEUED_WRITES = 8;
		/** The four phases the wire may report. */
		var RUN_PHASES = [
			"idle",
			"running",
			"settled",
			"cancelled"
		];
		/**
		* Build the skill card API.
		* @param options - transport seam.
		* @returns the read/write face.
		*/
		function createWorkbenchSkillCardApi(options = {}) {
			const fetcher = options.fetcher ?? ((input, init) => globalThis.fetch(input, init));
			let tail = Promise.resolve({
				status: "failed",
				reason: "no write was issued"
			});
			let queued = 0;
			const readError = async (response) => {
				return errorMessageOf(await readJson$1(response)) ?? `skill card route answered ${String(response.status)}`;
			};
			return {
				async read(signal) {
					let response;
					try {
						response = await fetcher(WORKBENCH_SKILL_CARD_PATH, {
							method: "GET",
							credentials: "same-origin",
							redirect: "error",
							cache: "no-store",
							headers: { "Accept": "application/json" },
							...signal === void 0 ? {} : { signal }
						});
					} catch (error) {
						return {
							status: "unavailable",
							reason: `skill card request failed: ${messageOf(error)}`
						};
					}
					if (!response.ok) return {
						status: "unavailable",
						reason: await readError(response)
					};
					const snapshot = parseSnapshot(await readJson$1(response));
					return snapshot === void 0 ? {
						status: "unavailable",
						reason: "skill card response did not match the contract"
					} : {
						status: "ok",
						snapshot
					};
				},
				async write(patch) {
					if (queued >= MAX_QUEUED_WRITES) return {
						status: "failed",
						reason: "too many pending skill card changes"
					};
					queued += 1;
					const send = async () => {
						let response;
						try {
							response = await fetcher(WORKBENCH_SKILL_CARD_PATH, {
								method: "PATCH",
								credentials: "same-origin",
								redirect: "error",
								cache: "no-store",
								headers: {
									"Accept": "application/json",
									"Content-Type": "application/json"
								},
								body: JSON.stringify(patch)
							});
						} catch (error) {
							return {
								status: "failed",
								reason: `skill card request failed: ${messageOf(error)}`
							};
						}
						if (response.status === 409) {
							const snapshot = parseSnapshot(await readJson$1(response));
							return snapshot === void 0 ? {
								status: "failed",
								reason: "conflict response was not readable"
							} : {
								status: "conflict",
								snapshot
							};
						}
						if (!response.ok) return {
							status: "failed",
							reason: await readError(response)
						};
						const snapshot = parseSnapshot(await readJson$1(response));
						return snapshot === void 0 ? {
							status: "failed",
							reason: "skill card response did not match the contract"
						} : {
							status: "ok",
							snapshot
						};
					};
					const result = tail.then(send).finally(() => {
						queued -= 1;
					});
					tail = result;
					return await result;
				},
				async catalog(sessionId, signal) {
					const query = sessionId === void 0 ? "" : `?sessionId=${encodeURIComponent(sessionId)}`;
					let response;
					try {
						response = await fetcher(`${WORKBENCH_SKILL_CARD_CATALOG_PATH}${query}`, {
							method: "GET",
							credentials: "same-origin",
							redirect: "error",
							cache: "no-store",
							headers: { "Accept": "application/json" },
							...signal === void 0 ? {} : { signal }
						});
					} catch (error) {
						return {
							status: "failed",
							code: "unavailable",
							message: `skill card request failed: ${messageOf(error)}`
						};
					}
					const body = await readJson$1(response);
					if (!response.ok) {
						const error = errorOf(body);
						return error === void 0 ? {
							status: "failed",
							code: "unavailable",
							message: `skill card route answered ${String(response.status)}`
						} : {
							status: "failed",
							code: error.code,
							message: error.message
						};
					}
					const entries = parseCatalog(body);
					return entries === void 0 ? {
						status: "failed",
						code: "unavailable",
						message: "catalog response did not match the contract"
					} : {
						status: "ok",
						entries
					};
				},
				async poll(cardId, signal) {
					let response;
					try {
						response = await fetcher(`${WORKBENCH_SKILL_CARD_RUN_PATH}?cardId=${encodeURIComponent(cardId)}`, {
							method: "GET",
							credentials: "same-origin",
							redirect: "error",
							cache: "no-store",
							headers: { "Accept": "application/json" },
							...signal === void 0 ? {} : { signal }
						});
					} catch (error) {
						return {
							status: "unavailable",
							reason: `skill card request failed: ${messageOf(error)}`
						};
					}
					if (response.status === 404) return { status: "missing" };
					if (!response.ok) return {
						status: "unavailable",
						reason: await readError(response)
					};
					const body = await readJson$1(response);
					const state = parseRunResponse(body);
					if (state === void 0) return {
						status: "unavailable",
						reason: "run response did not match the contract"
					};
					return {
						status: "ok",
						state,
						states: parseRunStates(body, state)
					};
				},
				async start(request) {
					let response;
					try {
						response = await fetcher(WORKBENCH_SKILL_CARD_RUN_PATH, {
							method: "POST",
							credentials: "same-origin",
							redirect: "error",
							cache: "no-store",
							headers: {
								"Accept": "application/json",
								"Content-Type": "application/json"
							},
							body: JSON.stringify(request)
						});
					} catch (error) {
						return {
							status: "unavailable",
							reason: `skill card request failed: ${messageOf(error)}`
						};
					}
					const body = await readJson$1(response);
					if (response.ok) {
						const state = parseRunResponse(body);
						return state === void 0 ? {
							status: "unavailable",
							reason: "run response did not match the contract"
						} : {
							status: "ok",
							state
						};
					}
					const error = errorOf(body);
					return error === void 0 ? {
						status: "unavailable",
						reason: `skill card route answered ${String(response.status)}`
					} : {
						status: "rejected",
						code: error.code,
						message: error.message
					};
				},
				async cancel(cardId, runId) {
					const query = runId === void 0 ? `?cardId=${encodeURIComponent(cardId)}` : `?cardId=${encodeURIComponent(cardId)}&runId=${encodeURIComponent(runId)}`;
					try {
						await fetcher(`${WORKBENCH_SKILL_CARD_RUN_PATH}${query}`, {
							method: "DELETE",
							credentials: "same-origin",
							redirect: "error",
							cache: "no-store",
							headers: { "Accept": "application/json" }
						});
					} catch (error) {
						console.warn("skill card cancel failed:", messageOf(error));
					}
				},
				async saveResult(cardId, runId, html) {
					let response;
					try {
						response = await fetcher(WORKBENCH_SKILL_CARD_RESULT_PATH, {
							method: "PUT",
							credentials: "same-origin",
							redirect: "error",
							cache: "no-store",
							headers: {
								"Accept": "application/json",
								"Content-Type": "application/json"
							},
							body: JSON.stringify({
								cardId,
								runId,
								html
							})
						});
					} catch (error) {
						return {
							status: "unavailable",
							reason: `skill card request failed: ${messageOf(error)}`
						};
					}
					const body = await readJson$1(response);
					if (response.ok) {
						const stored = parseResultEdit(body);
						return stored === void 0 ? {
							status: "unavailable",
							reason: "result response did not match the contract"
						} : {
							status: "ok",
							revision: stored.revision,
							result: stored.result
						};
					}
					const error = errorOf(body);
					return error === void 0 ? {
						status: "unavailable",
						reason: `skill card route answered ${String(response.status)}`
					} : {
						status: "rejected",
						code: error.code,
						message: error.message
					};
				},
				async statDirectory(path, signal) {
					const query = `?path=${encodeURIComponent(path)}`;
					let response;
					try {
						response = await fetcher(`${WORKBENCH_SKILL_CARD_DIRECTORY_PATH}${query}`, {
							method: "GET",
							credentials: "same-origin",
							redirect: "error",
							cache: "no-store",
							headers: { "Accept": "application/json" },
							...signal === void 0 ? {} : { signal }
						});
					} catch (error) {
						return {
							status: "unavailable",
							reason: `skill card request failed: ${messageOf(error)}`
						};
					}
					const body = await readJson$1(response);
					if (!response.ok) return {
						status: "unavailable",
						reason: errorOf(body)?.message ?? `skill card route answered ${String(response.status)}`
					};
					const stat = parseDirectoryStat(body);
					return stat === void 0 ? {
						status: "unavailable",
						reason: "directory response did not match the contract"
					} : {
						status: "ok",
						stat
					};
				}
			};
		}
		/**
		* Read one response body as JSON.
		* @param response - the response.
		* @returns the decoded value, or undefined when it is not JSON.
		*/
		async function readJson$1(response) {
			try {
				return await response.json();
			} catch {
				return;
			}
		}
		/**
		* Read the error body of one response.
		* @param body - the decoded body.
		* @returns the error fields, or undefined when the body is not an error.
		*/
		function errorOf(body) {
			if (typeof body !== "object" || body === null) return void 0;
			const error = body.error;
			if (typeof error !== "object" || error === null) return void 0;
			const fields = error;
			if (typeof fields.code !== "string" || typeof fields.message !== "string") return void 0;
			return {
				code: fields.code,
				message: fields.message
			};
		}
		/**
		* Read the message of one error body.
		* @param body - the decoded body.
		* @returns the message, or undefined when the body is not an error.
		*/
		function errorMessageOf(body) {
			return errorOf(body)?.message;
		}
		/**
		* Whether a decoded value is an absent or usable session id.
		*
		* Shared by the two records that carry one so the rule cannot drift between the snapshot
		* read and the hand-edit response: absent is every record written before the field
		* existed, and a present value has to be a non-empty string.
		* @param value - the decoded field.
		* @returns whether it is absent, or a usable session id.
		*/
		function isOptionalSessionId(value) {
			return value === void 0 || typeof value === "string" && value.length > 0;
		}
		/**
		* Validate one configuration snapshot body.
		* @param value - decoded body.
		* @returns the snapshot, or undefined when a field is outside the contract.
		*/
		function parseSnapshot(value) {
			if (typeof value !== "object" || value === null) return void 0;
			const body = value;
			if (body.apiVersion !== 1) return void 0;
			if (typeof body.revision !== "string") return void 0;
			if (!Array.isArray(body.cards) || !Array.isArray(body.results)) return void 0;
			const capabilities = body.capabilities === void 0 ? void 0 : parseCapabilities(body.capabilities);
			if (body.capabilities !== void 0 && capabilities === void 0) return void 0;
			const cards = [];
			for (const raw of body.cards) {
				if (typeof raw !== "object" || raw === null) return void 0;
				const entry = raw;
				if (typeof entry.cardId !== "string" || !isWorkbenchCardId(entry.cardId)) return void 0;
				if (entry.name !== void 0 && (typeof entry.name !== "string" || !isWorkbenchCardName(entry.name))) return;
				if (entry.skill !== void 0 && (typeof entry.skill !== "string" || !isWorkbenchSkillName(entry.skill))) return;
				const model = entry.model;
				if (model !== void 0 && !isWorkbenchCardModel(model)) return void 0;
				const workspace = entry.workspace;
				if (workspace !== void 0 && !isWorkbenchCardWorkspace(workspace)) return void 0;
				const permission = entry.permission;
				if (permission !== void 0 && !isWorkbenchSandboxMode(permission)) return void 0;
				const instructionMode = entry.instructionMode;
				if (instructionMode !== void 0 && !isWorkbenchInstructionMode(instructionMode)) return void 0;
				if (!Array.isArray(entry.templateSkills) || entry.templateSkills.some((name) => typeof name !== "string")) return;
				if (entry.template !== void 0 && typeof entry.template !== "string") return void 0;
				cards.push({
					cardId: entry.cardId,
					...entry.name === void 0 ? {} : { name: entry.name },
					...entry.skill === void 0 ? {} : { skill: entry.skill },
					...model === void 0 ? {} : { model },
					...workspace === void 0 ? {} : { workspace: { path: workspace.path } },
					...permission === void 0 ? {} : { permission },
					...instructionMode === void 0 ? {} : { instructionMode },
					templateSkills: entry.templateSkills,
					...entry.template === void 0 ? {} : { template: entry.template }
				});
			}
			const results = [];
			for (const raw of body.results) {
				if (typeof raw !== "object" || raw === null) return void 0;
				const entry = raw;
				if (typeof entry.runId !== "string" || entry.runId.length === 0) return void 0;
				if (typeof entry.cardId !== "string" || !isWorkbenchCardId(entry.cardId)) return void 0;
				if (!isOptionalSessionId(entry.sessionId)) return void 0;
				if (typeof entry.skill !== "string" || typeof entry.executedAt !== "number" || typeof entry.stopReason !== "string") return;
				if (entry.model !== void 0 && !isWorkbenchCardModel(entry.model)) return void 0;
				results.push({
					...raw,
					runId: entry.runId,
					cardId: entry.cardId
				});
			}
			return {
				cards,
				results,
				revision: body.revision,
				...capabilities === void 0 ? {} : { capabilities }
			};
		}
		/**
		* Validate the run capability the Host recorded.
		* @param value - the decoded `capabilities` field.
		* @returns the capability, or undefined when it is outside the contract.
		*/
		function parseCapabilities(value) {
			if (typeof value !== "object" || value === null || Array.isArray(value)) return void 0;
			const body = value;
			if (typeof body.startActivation !== "boolean" && typeof body.start !== "boolean") return void 0;
			return {
				startActivation: body.startActivation === true,
				start: body.start === true
			};
		}
		/**
		* Validate one directory-check body.
		*
		* The three answers are read as booleans rather than passed through: the field decides
		* whether the run control opens from them, and a missing one would read as `false` by
		* accident — a card that can never run for no stated reason.
		* @param value - decoded body.
		* @returns the three facts, or undefined when a field is outside the contract.
		*/
		function parseDirectoryStat(value) {
			if (typeof value !== "object" || value === null) return void 0;
			const body = value;
			if (body.apiVersion !== 1) return void 0;
			if (typeof body.path !== "string") return void 0;
			if (typeof body.exists !== "boolean" || typeof body.isDirectory !== "boolean") return void 0;
			if (typeof body.writable !== "boolean") return void 0;
			return {
				exists: body.exists,
				isDirectory: body.isDirectory,
				writable: body.writable
			};
		}
		/**
		* Validate one catalog response body.
		* @param value - decoded body.
		* @returns the entries, or undefined when a field is outside the contract.
		*/
		function parseCatalog(value) {
			if (typeof value !== "object" || value === null) return void 0;
			const body = value;
			if (body.apiVersion !== 1) return void 0;
			if (!Array.isArray(body.skills)) return void 0;
			const entries = [];
			for (const raw of body.skills) {
				if (typeof raw !== "object" || raw === null) return void 0;
				const entry = raw;
				if (typeof entry.name !== "string" || !isWorkbenchSkillName(entry.name)) return void 0;
				if (typeof entry.description !== "string" || typeof entry.userInvocable !== "boolean") return void 0;
				if (entry.whenToUse !== void 0 && typeof entry.whenToUse !== "string") return void 0;
				entries.push({
					name: entry.name,
					description: entry.description,
					...entry.whenToUse === void 0 ? {} : { whenToUse: entry.whenToUse },
					userInvocable: entry.userInvocable
				});
			}
			return entries;
		}
		/**
		* Validate one result-edit response body.
		* @param value - decoded body.
		* @returns the revision and record, or undefined when a field is outside the contract.
		*/
		function parseResultEdit(value) {
			if (typeof value !== "object" || value === null) return void 0;
			const body = value;
			if (body.apiVersion !== 1) return void 0;
			if (typeof body.revision !== "string") return void 0;
			if (typeof body.result !== "object" || body.result === null) return void 0;
			const raw = body.result;
			if (typeof raw.runId !== "string" || raw.runId.length === 0) return void 0;
			if (typeof raw.cardId !== "string" || !isWorkbenchCardId(raw.cardId)) return void 0;
			if (!isOptionalSessionId(raw.sessionId)) return void 0;
			if (typeof raw.skill !== "string" || typeof raw.executedAt !== "number" || typeof raw.stopReason !== "string") return;
			if (raw.model !== void 0 && !isWorkbenchCardModel(raw.model)) return void 0;
			if (raw.editedAt !== void 0 && (typeof raw.editedAt !== "number" || !Number.isFinite(raw.editedAt))) return;
			return {
				revision: body.revision,
				result: {
					...body.result,
					runId: raw.runId,
					cardId: raw.cardId
				}
			};
		}
		/**
		* Validate one run-state response body.
		* @param value - decoded body.
		* @returns the state, or undefined when a field is outside the contract.
		*/
		function parseRunResponse(value) {
			if (typeof value !== "object" || value === null) return void 0;
			const body = value;
			if (body.apiVersion !== 1) return void 0;
			return parseRunState(body.state);
		}
		/**
		* Validate one run state.
		* @param value - the decoded state, with no envelope around it.
		* @returns the state, or undefined when a field is outside the contract.
		*/
		function parseRunState(value) {
			if (typeof value !== "object" || value === null) return void 0;
			const state = value;
			if (typeof state.cardId !== "string" || !isWorkbenchCardId(state.cardId)) return void 0;
			if (!RUN_PHASES.includes(state.phase)) return void 0;
			if (typeof state.retried !== "boolean") return void 0;
			if (state.runId !== void 0 && typeof state.runId !== "string") return void 0;
			return value;
		}
		/**
		* Read the run list a state response carries.
		*
		* The list is optional on the wire, and a Host that predates concurrent runs sends none —
		* so an absent or unusable list is read as the one state the response always carried
		* rather than as a malformed answer. A state the contract refuses is dropped from the
		* list, for the same reason: one bad entry must not cost the page the runs it can read.
		* @param value - the decoded response body.
		* @param state - the newest state, already validated.
		* @returns the list, never empty.
		*/
		function parseRunStates(value, state) {
			if (typeof value !== "object" || value === null) return [state];
			const listed = value.states;
			if (!Array.isArray(listed)) return [state];
			const states = listed.map((entry) => parseRunState(entry)).filter((entry) => entry !== void 0);
			return states.length === 0 ? [state] : states;
		}
		/**
		* Render one failure for a log line.
		* @param error - the failure.
		* @returns a readable message.
		*/
		function messageOf(error) {
			return error instanceof Error ? error.message : String(error);
		}
		//#endregion
		//#region src/client/skill-card/model.ts
		/** The view of a directory this client cannot reach at all. */
		var NO_MODEL_DIRECTORY = {
			available: false,
			status: "idle",
			current: null,
			groups: []
		};
		/**
		* Resolve the field from the card's stored route and the directory's answer.
		*
		* `stored` wins over the session's selection everywhere: a card that names a model runs
		* on that model, and the session's own choice is only the default a card without one
		* displays.
		* @param stored - the route this card stores, when it has one.
		* @param directory - what the model directory answered.
		* @returns the field state.
		*/
		function resolveModelField(stored, directory) {
			if (directory.available && (directory.status === "ready" || directory.status === "selecting") && firstModel(directory.groups) !== void 0) {
				const selected = stored ?? directory.current ?? firstModel(directory.groups);
				if (selected !== void 0) return {
					kind: "ready",
					groups: withSelected(directory.groups, selected),
					selected
				};
			}
			const known = stored ?? directory.current;
			if (known === null || known === void 0) return { kind: "unavailable" };
			const name = nameOf(directory.groups, known);
			return {
				kind: "fixed",
				model: known,
				...name === void 0 ? {} : { name }
			};
		}
		/**
		* Encode one route as a select option's value.
		*
		* A JSON pair rather than a `"provider/model"` string for the same reason the route is
		* stored as a pair: an option value must be decodable without guessing where the provider
		* ends.
		* @param model - the route.
		* @returns the option value.
		*/
		function modelKey(model) {
			return JSON.stringify([model.provider, model.model]);
		}
		/**
		* Decode one select option's value.
		* @param value - the option value.
		* @returns the route, or undefined when the value was not produced by {@link modelKey}.
		*/
		function parseModelKey(value) {
			let decoded;
			try {
				decoded = JSON.parse(value);
			} catch {
				return;
			}
			if (!Array.isArray(decoded) || decoded.length !== 2) return void 0;
			const [provider, model] = decoded;
			const candidate = {
				provider,
				model
			};
			return isWorkbenchCardModel(candidate) ? candidate : void 0;
		}
		/**
		* Build the seat over a resolver that may arrive after the pages exist.
		*
		* The resolver is read through a getter rather than captured, because the service is
		* injected scoped: a composition without it leaves the getter answering undefined for the
		* whole session, which reads as "no model known" rather than as a missing plugin.
		* @param resolver - getter for the resolver, or undefined while none is registered.
		* @returns the seat.
		*/
		function createModelSeat(resolver) {
			return {
				read(sessionId) {
					const directory = directoryFor(resolver(), sessionId);
					if (directory === void 0) return NO_MODEL_DIRECTORY;
					const state = directory.store.getSnapshot();
					if (state.status === "idle") askForCatalog(directory);
					return {
						available: true,
						status: state.status,
						current: state.current === null ? null : {
							provider: state.current.provider,
							model: state.current.model
						},
						groups: state.groups.map((group) => ({
							id: group.id,
							name: group.name,
							models: group.models.map((model) => ({
								id: model.id,
								name: model.name
							}))
						}))
					};
				},
				subscribe(sessionId, listener) {
					const directory = directoryFor(resolver(), sessionId);
					if (directory === void 0) return () => {};
					const stop = directory.store.subscribe(listener);
					askForCatalog(directory);
					return stop;
				}
			};
		}
		/**
		* Ask one directory for its catalog.
		*
		* The rejection is dropped on purpose: the shared load writes its failure to the store, and that
		* snapshot is the only report of it.
		* @param directory - the directory to ask.
		*/
		function askForCatalog(directory) {
			directory.load().catch(() => {});
		}
		/**
		* Resolve one session's directory.
		* @param resolver - the resolver, when one is registered.
		* @param sessionId - the session, when a run would have one.
		* @returns the directory, or undefined when there is none to read.
		*/
		function directoryFor(resolver, sessionId) {
			if (resolver === void 0 || sessionId === void 0) return void 0;
			try {
				return resolver.directoryFor(sessionId);
			} catch {
				return;
			}
		}
		/**
		* Read the first model any group offers.
		* @param groups - the directory's groups.
		* @returns that model's route, or undefined when no group offers one.
		*/
		function firstModel(groups) {
			for (const group of groups) {
				const model = group.models[0];
				if (model !== void 0) return {
					provider: group.id,
					model: model.id
				};
			}
		}
		/**
		* Read the display name one group lists for a route.
		* @param groups - the directory's groups.
		* @param model - the route.
		* @returns the name, or undefined when no group lists it.
		*/
		function nameOf(groups, model) {
			return groups.find((group) => group.id === model.provider)?.models.find((entry) => entry.id === model.model)?.name;
		}
		/**
		* Ensure a picker's options include the route it has selected.
		*
		* A select whose value matches no option renders blank, which would contradict "a card
		* always shows a concrete model". The route is added to its provider's group — or to a
		* group of its own when even the provider is gone — under its own id, because no display
		* name is known for a model the catalog does not list.
		* @param groups - the directory's groups.
		* @param selected - the route the field shows.
		* @returns groups that include it.
		*/
		function withSelected(groups, selected) {
			if (groups.some((group) => group.id === selected.provider && group.models.some((model) => model.id === selected.model))) return groups;
			const option = {
				id: selected.model,
				name: selected.model
			};
			const index = groups.findIndex((group) => group.id === selected.provider);
			if (index < 0) return [...groups, {
				id: selected.provider,
				name: selected.provider,
				models: [option]
			}];
			return groups.map((group, at) => at === index ? {
				...group,
				models: [...group.models, option]
			} : group);
		}
		//#endregion
		//#region src/client/skill-card/workspace-picker.ts
		/**
		* Asking the user for a directory, on whichever platform this page is running.
		*
		* Two sources, and the desktop one comes first. On Windows the Desktop plugin publishes a
		* picker on the window ({@link WorkbenchDesktopPickerWindow}) and installs a same-origin
		* route behind it; everywhere else the workspace UI's own `pickDirectory()` is the picker,
		* which is the same call the app's own browse panel makes there. There is deliberately no
		* third path: the product owner rejected free-text paths, and a text field would let a card
		* name a directory no chooser ever confirmed.
		*
		* Nothing here throws. A route that is absent, refused, or answered with junk is reported
		* as "no picker", so the page states a disabled control instead of an error boundary.
		* @module dsh-workbench/client/skill-card/workspace-picker
		*/
		/**
		* Read the Desktop plugin's picker off the window, when it published one.
		* @param target - the object to read; the global scope by default.
		* @returns the picker, or undefined when this page has none.
		*/
		function readDesktopPicker(target = globalThis) {
			if (typeof target !== "object" || target === null) return void 0;
			const candidate = target.__DSH_DESKTOP_PICK_DIRECTORY__;
			return typeof candidate === "function" ? candidate : void 0;
		}
		/**
		* Build the picker over sources that may arrive after the page exists.
		*
		* The sources are read through a getter rather than captured, because the workspace UI is
		* injected scoped: a composition without it answers "no picker" for the whole session,
		* which reads as a disabled control rather than as a missing plugin.
		* @param sources - getter for the sources, read on every call.
		* @returns the picker.
		*/
		function createWorkspacePicker(sources) {
			const chosen = () => {
				const available = sources();
				return available.native ?? available.workspace;
			};
			return {
				available: () => chosen() !== void 0,
				async pick() {
					const pick = chosen();
					if (pick === void 0) return {
						status: "unavailable",
						reason: "this page has no directory picker"
					};
					let path;
					try {
						path = await pick();
					} catch (error) {
						return {
							status: "unavailable",
							reason: error instanceof Error ? error.message : String(error)
						};
					}
					if (path === null) return { status: "cancelled" };
					if (!isWorkbenchWorkspacePath(path)) return {
						status: "unavailable",
						reason: `the picker returned ${JSON.stringify(path)}, which is not an absolute directory path`
					};
					return {
						status: "picked",
						path
					};
				}
			};
		}
		var workbench_module_default = {
			page: "_page_1j7x2_3",
			pageHead: "_pageHead_1j7x2_20",
			pageTitle: "_pageTitle_1j7x2_34",
			pageIntro: "_pageIntro_1j7x2_42",
			notice: "_notice_1j7x2_49",
			empty: "_empty_1j7x2_58",
			emptyTitle: "_emptyTitle_1j7x2_67",
			emptyBody: "_emptyBody_1j7x2_74",
			grid: "_grid_1j7x2_81",
			cell: "_cell_1j7x2_95",
			createRoot: "_createRoot_1j7x2_101",
			createTile: "_createTile_1j7x2_112",
			createMark: "_createMark_1j7x2_145"
		};
		//#endregion
		//#region src/client/WorkbenchCardGrid.tsx
		/**
		* The workbench card grid: lays the visible cards out, owns the reorder
		* session, and routes each entry through the `workbench.card` shell.
		*
		* The grid reads no card data: each entry renders itself, and the panel's
		* owner props tell it where the entry sits.
		* @module dsh-workbench/client/WorkbenchCardGrid
		*/
		/** Context the grid provides to the shells it renders. */
		var WorkbenchReorderContext = (0, react.createContext)(null);
		/**
		* Render the grid and own the drag session.
		* @param props - view, actions, the entry renderer, announcement text, and notice.
		* @returns the grid element with its live region.
		*/
		function WorkbenchCardGrid({ view, actions, renderEntry, announce, notice, trailing, onCardsChanged }) {
			const [dragId, setDragId] = (0, react.useState)(null);
			const [overIndex, setOverIndex] = (0, react.useState)(null);
			const [announcement, setAnnouncement] = (0, react.useState)("");
			const gridRef = (0, react.useRef)(null);
			const visibleIds = view.visibleIds;
			(0, react.useEffect)(() => {
				if (dragId !== null && !visibleIds.includes(dragId)) {
					setDragId(null);
					actions.setDragging(null);
				}
			}, [
				actions,
				dragId,
				visibleIds
			]);
			const resolveOverIndex = (0, react.useCallback)((x, y) => {
				const grid = gridRef.current;
				if (grid === null || typeof document === "undefined") return null;
				const card = document.elementFromPoint(x, y)?.closest("[data-card-id]");
				if (card === null || card === void 0 || !grid.contains(card)) return null;
				const id = card.getAttribute("data-card-id");
				if (id === null) return null;
				const index = visibleIds.indexOf(id);
				return index === -1 ? null : index;
			}, [visibleIds]);
			const end = (0, react.useCallback)((commit) => {
				const id = dragId;
				const index = overIndex;
				setDragId(null);
				setOverIndex(null);
				actions.setDragging(null);
				if (!commit || id === null || index === null) return;
				const from = visibleIds.indexOf(id);
				if (from === -1 || from === index) return;
				actions.reorder(id, index);
				setAnnouncement(announce(id, index + 1));
			}, [
				actions,
				announce,
				dragId,
				overIndex,
				visibleIds
			]);
			const reorder = (0, react.useMemo)(() => ({
				reorderable: visibleIds.length > 1,
				dragging: dragId !== null,
				begin: (id) => {
					setDragId(id);
					setOverIndex(visibleIds.indexOf(id));
					actions.setDragging(id);
				},
				end,
				moveBy: (id, delta) => {
					const from = visibleIds.indexOf(id);
					if (from === -1) return;
					const to = Math.max(0, Math.min(from + delta, visibleIds.length - 1));
					if (to === from) return;
					actions.moveBy(id, delta);
					setAnnouncement(announce(id, to + 1));
				}
			}), [
				actions,
				announce,
				dragId,
				end,
				visibleIds
			]);
			const handlePointerDown = (event) => {
				const target = event.target;
				if (!(target instanceof Element)) return;
				const handle = target.closest("[data-workbench-drag-handle]");
				if (handle === null) return;
				const id = handle.getAttribute("data-workbench-drag-handle");
				if (id === null) return;
				event.preventDefault();
				gridRef.current?.setPointerCapture(event.pointerId);
				reorder.begin(id);
			};
			const handlePointerMove = (event) => {
				if (dragId === null) return;
				const index = resolveOverIndex(event.clientX, event.clientY);
				if (index !== null && index !== overIndex) setOverIndex(index);
			};
			const handlePointerUp = (event) => {
				if (dragId === null) return;
				gridRef.current?.releasePointerCapture(event.pointerId);
				end(true);
			};
			const handleKeyDown = (event) => {
				if (event.key === "Escape" && dragId !== null) {
					event.preventDefault();
					end(false);
				}
			};
			const owner = {
				visibleIds,
				draggingId: dragId,
				onCardsChanged
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(WorkbenchReorderContext.Provider, {
				value: reorder,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					ref: gridRef,
					className: workbench_module_default.grid,
					"data-workbench-grid": "",
					...dragId === null ? {} : { "data-dragging": "" },
					onPointerDown: handlePointerDown,
					onPointerMove: handlePointerMove,
					onPointerUp: handlePointerUp,
					onPointerCancel: () => {
						end(false);
					},
					onKeyDown: handleKeyDown,
					children: [visibleIds.map((id) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: workbench_module_default.cell,
						"data-workbench-cell": id,
						children: renderEntry(id, {
							...owner,
							cardId: id
						})
					}, id)), trailing === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: workbench_module_default.cell,
						"data-workbench-cell": "create",
						children: trailing
					})]
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
					className: workbench_module_default.notice,
					role: "status",
					"aria-live": "polite",
					children: notice ?? announcement
				})]
			});
		}
		/**
		* Read the grid's reorder session from inside a card shell.
		* @returns the reorder session, or null when the shell renders outside the grid.
		*/
		function useWorkbenchReorder() {
			return (0, react.useContext)(WorkbenchReorderContext);
		}
		//#endregion
		//#region src/client/skill-card/policy.ts
		/**
		* Elements that would fetch or embed something from outside the card.
		*
		* A card is offline and must not become a tracking pixel, so these are refused
		* outright rather than only when they carry a remote URL.
		*/
		var EXTERNAL_ELEMENTS = /* @__PURE__ */ new Set([
			"img",
			"iframe",
			"object",
			"embed",
			"link",
			"video",
			"audio",
			"source",
			"track",
			"image",
			"use"
		]);
		/** Attributes whose value is a URL and therefore has to pass the scheme check. */
		var URL_ATTRIBUTES = /* @__PURE__ */ new Set([
			"href",
			"src",
			"srcset",
			"action",
			"formaction",
			"poster",
			"data",
			"cite",
			"background",
			"xlink:href"
		]);
		/** URL schemes a template may not use. */
		var UNSAFE_URL = /^\s*(?:javascript|vbscript|data:text\/html)/i;
		/**
		* A CSS reference that would load something from outside the card.
		*
		* A fragment reference (`url(#id)`) stays allowed: it points inside the same
		* document, which is how an inline SVG filter or gradient is addressed.
		*/
		var EXTERNAL_CSS = /@import|url\(\s*(?!['"]?#)/i;
		/**
		* Why one element is refused.
		* @param element - the element to judge.
		* @param scope - which half of the document it sits in; a template's own script is allowed.
		* @returns the reason, or undefined when the element is allowed.
		*/
		function forbiddenElementReason(element, scope = "region") {
			const tag = element.tagName.toLowerCase();
			if (tag === "script") {
				if (scope === "template") return element.hasAttribute("src") ? "external-element" : void 0;
				return "script";
			}
			if (tag === "input") return (element.getAttribute("type") ?? "").toLowerCase() === "image" ? "external-element" : void 0;
			return EXTERNAL_ELEMENTS.has(tag) ? "external-element" : void 0;
		}
		/**
		* Why one attribute is refused.
		* @param name - attribute name.
		* @param value - attribute value.
		* @returns the reason, or undefined when the attribute is allowed.
		*/
		function forbiddenAttributeReason(name, value) {
			const lower = name.toLowerCase();
			if (lower.startsWith("on")) return "event-attribute";
			if (URL_ATTRIBUTES.has(lower) && UNSAFE_URL.test(value)) return "unsafe-url";
			if (lower === "style" && EXTERNAL_CSS.test(value)) return "external-css";
		}
		/**
		* Whether one CSS source loads something from outside the card.
		* @param text - the CSS source.
		* @returns whether it carries an external reference.
		*/
		function hasExternalCss(text) {
			return EXTERNAL_CSS.test(text);
		}
		//#endregion
		//#region src/client/skill-card/template.ts
		/**
		* What one card template says, and whether it can run at all.
		*
		* A template is one document with one marked region. The region is what a child agent
		* fills; everything around it is kept exactly as written, and the comments inside it
		* carry the instruction. The analyser therefore answers two questions only: is there
		* exactly one usable region, and does the document carry anything it must not.
		* @module dsh-workbench/client/skill-card/template
		*/
		/**
		* Parse template source into an inert fragment.
		*
		* A `template` element's content is inert: scripts do not run and referenced
		* resources do not load, which is what makes it safe to inspect arbitrary text.
		* Comments survive parsing, which matters because they are the instruction.
		* @param html - template source.
		* @returns the parsed content.
		*/
		function parseTemplate(html) {
			const template = document.createElement("template");
			template.innerHTML = html;
			return template.content;
		}
		/**
		* Scan one template for its region markers.
		* @param text - the template text.
		* @returns what the markers say.
		*/
		function scanRegion(text) {
			const opens = [...text.matchAll(regionMarkerPattern(WORKBENCH_REGION_BEGIN))];
			const closes = [...text.matchAll(regionMarkerPattern(WORKBENCH_REGION_END))];
			if (opens.length === 0 && closes.length === 0) return { kind: "missing" };
			if (opens.length > 1 || closes.length > 1) {
				const extra = opens[1] ?? closes[1];
				return {
					kind: "repeated",
					...extra === void 0 ? {} : { offset: extra.index }
				};
			}
			const open = opens[0];
			const close = closes[0];
			if (open === void 0 || close === void 0) {
				const present = open ?? close;
				return present === void 0 ? { kind: "missing" } : {
					kind: "unclosed",
					token: present[0],
					offset: present.index
				};
			}
			const start = open.index + open[0].length;
			const end = close.index;
			if (end < start) return {
				kind: "unclosed",
				token: close[0],
				offset: close.index
			};
			return {
				kind: "ok",
				region: {
					start,
					end
				}
			};
		}
		/**
		* Locate the region a child fills.
		* @param text - the template text.
		* @returns its bounds, or undefined when there is not exactly one usable region.
		*/
		function findRegion(text) {
			const scan = scanRegion(text);
			return scan.kind === "ok" ? scan.region : void 0;
		}
		/**
		* Analyse one template.
		* @param html - the user's HTML.
		* @returns the region it declares, the targets it declares, and every reason it cannot run.
		*/
		function analyzeTemplate(html) {
			const scan = scanRegion(html);
			const region = scan.kind === "ok" ? scan.region : void 0;
			const violations = [];
			if (scan.kind === "missing") violations.push({
				code: "region-missing",
				location: "document"
			});
			if (scan.kind === "unclosed") violations.push({
				code: "region-unclosed",
				location: "document",
				token: scan.token,
				offset: scan.offset
			});
			if (scan.kind === "repeated") violations.push({
				code: "region-repeated",
				location: "document",
				...scan.offset === void 0 ? {} : { offset: scan.offset }
			});
			const actions = analyzeActions(html, region, violations);
			const leftover = /\{\{[^{}]*\}\}/u.exec(html);
			if (leftover !== null) violations.push({
				code: "placeholder-syntax",
				location: "document",
				token: leftover[0],
				offset: leftover.index
			});
			violations.push(...contentViolations(html));
			return {
				region,
				actions,
				violations
			};
		}
		/**
		* Read the content-policy refusals one fragment carries, and nothing else.
		*
		* A separate entry point rather than a filter over {@link analyzeTemplate}: a stored
		* result's region fragment is not a document, so it has no region markers and no
		* declaration block to analyse, and reporting those as violations would refuse an edit
		* for syntax that does not apply to it. The five content-policy rules do apply — the
		* renderer strips those constructs silently, so a fragment that carried one would store
		* a value whose offending part never reaches the screen.
		* @param html - the region fragment.
		* @returns the refusals, outermost first.
		*/
		function analyzeFragment(html) {
			const found = [];
			walk(parseTemplate(html), "root", found, html.toLowerCase(), "region");
			return found;
		}
		/** One declaration line: `<key>: card "name"` or `<key>: skill "name"`. */
		var ACTION_LINE = /^(\S+)\s*:\s*(card|skill)\s+"([^"]*)"$/u;
		/**
		* Read every declaration block in one template.
		* @param text - the template text.
		* @returns the blocks, outermost first.
		*/
		function scanActions(text) {
			const pattern = new RegExp(`<!--\\s*${WORKBENCH_ACTIONS_MARKER}\\b([\\s\\S]*?)-->`, "g");
			return [...text.matchAll(pattern)].map((match) => {
				const body = match[1] ?? "";
				const end = match.index + match[0].length;
				return {
					body,
					start: match.index,
					end,
					bodyStart: end - 3 - body.length
				};
			});
		}
		/**
		* Locate the action-declaration block in one template.
		*
		* The editor draws this block as a second band in the gutter, so the range is
		* exposed separately from the analysis: a template may be refused for its
		* declarations and still be worth drawing.
		* @param text - the template text.
		* @returns the first block's character range, or undefined when there is none.
		*/
		function findActionsBlock(text) {
			const block = scanActions(text)[0];
			return block === void 0 ? void 0 : {
				start: block.start,
				end: block.end
			};
		}
		/**
		* Parse and validate the targets one template declares.
		*
		* A declaration sits outside the filled region on purpose: the region is rewritten on
		* every run, so a declaration written inside it survives exactly until the first run.
		* @param text - the template text.
		* @param region - the region it declares, when it has one.
		* @param violations - the accumulator.
		* @returns the usable declarations, in declaration order.
		*/
		function analyzeActions(text, region, violations) {
			const blocks = scanActions(text);
			if (blocks.length === 0) return [];
			if (blocks.length > 1) {
				violations.push({
					code: "action-declaration-duplicate",
					location: "document",
					offset: blocks[1]?.start
				});
				return [];
			}
			const block = blocks[0];
			if (block === void 0) return [];
			if (region !== void 0 && block.start >= region.start && block.end <= region.end) {
				violations.push({
					code: "actions-inside-region",
					location: "document",
					offset: block.start
				});
				return [];
			}
			const declarations = [];
			const seen = /* @__PURE__ */ new Set();
			let cursor = block.bodyStart;
			for (const line of block.body.split("\n")) {
				const lineStart = cursor;
				cursor += line.length + 1;
				const trimmed = line.trim();
				if (trimmed === "" || trimmed.startsWith("#")) continue;
				const offset = lineStart + (line.length - line.trimStart().length);
				const match = ACTION_LINE.exec(trimmed);
				if (match === null) {
					violations.push({
						code: "action-target-invalid",
						location: "document",
						token: trimmed,
						offset
					});
					continue;
				}
				const key = match[1] ?? "";
				const kind = match[2] ?? "";
				const name = match[3] ?? "";
				if (!WORKBENCH_ACTION_KEY_PATTERN.test(key)) {
					violations.push({
						code: "action-key-invalid",
						location: "document",
						token: key,
						offset
					});
					continue;
				}
				if (seen.has(key)) {
					violations.push({
						code: "action-key-repeated",
						location: "document",
						token: key,
						offset
					});
					continue;
				}
				const limit = kind === "card" ? 60 : 64;
				if (name === "" || Array.from(name).length > limit) {
					violations.push({
						code: "action-target-invalid",
						location: "document",
						token: trimmed,
						offset
					});
					continue;
				}
				seen.add(key);
				const target = kind === "card" ? {
					kind: "card",
					name
				} : {
					kind: "skill",
					name
				};
				declarations.push({
					key,
					target
				});
			}
			return declarations;
		}
		/**
		* Read every content-policy violation one document carries.
		* @param html - the template text.
		* @returns the violations, outermost first.
		*/
		function contentViolations(html) {
			const found = [];
			walk(parseTemplate(html), "root", found, html.toLowerCase(), "template");
			return found;
		}
		/**
		* Approximate where an element sits in the source text.
		*
		* A parsed DOM carries no source spans, so this is the first `<tag` in the text.
		* That is a real position — good enough to put the caret on the right line — but
		* it is the first element of that kind, which need not be the one being reported.
		* @param lowerHtml - the template text, lowercased.
		* @param tag - the element's lowercased tag name.
		* @returns the index of the first `<tag`, or undefined when the text has none.
		*/
		function approximateTagOffset(lowerHtml, tag) {
			const index = lowerHtml.indexOf(`<${tag}`);
			return index < 0 ? void 0 : index;
		}
		/**
		* Report forbidden elements and attributes throughout one node.
		* @param node - the node to inspect.
		* @param path - the path to its parent, for the report.
		* @param found - the accumulator.
		* @param lowerHtml - the template text, lowercased, for approximate positions.
		* @param scope - which half of the document is being judged.
		*/
		function walk(node, path, found, lowerHtml, scope) {
			for (const child of [...node.childNodes]) {
				if (child.nodeType !== Node.ELEMENT_NODE) continue;
				const element = child;
				const tag = element.tagName.toLowerCase();
				const here = `${path} > ${tag}`;
				const offset = approximateTagOffset(lowerHtml, tag);
				const at = offset === void 0 ? {} : { offset };
				const reason = forbiddenElementReason(element, scope);
				if (reason !== void 0) {
					found.push({
						code: reason,
						location: here,
						token: tag,
						...at
					});
					continue;
				}
				for (const attribute of [...element.attributes]) {
					const why = forbiddenAttributeReason(attribute.name, attribute.value);
					if (why !== void 0) found.push({
						code: why,
						location: here,
						token: attribute.name,
						...at
					});
				}
				if (tag === "style" && hasExternalCss(element.textContent ?? "")) found.push({
					code: "external-css",
					location: here,
					token: "style",
					...at
				});
				walk(element, here, found, lowerHtml, scope);
			}
		}
		//#endregion
		//#region src/client/skill-card/render.ts
		/**
		* Turn one stored result into the document a card shows.
		*
		* A template is a whole document whose skeleton stays exactly as the user wrote it; the
		* marked region is the only part a child agent authors. So the region's HTML is spliced
		* into the raw template text and the assembled document is cleaned once, here.
		*
		* The cleaning is load-bearing rather than a backstop now: the fragment came from a
		* model, which read the template, the skill, and whatever the skill's tools returned.
		* @module dsh-workbench/client/skill-card/render
		*/
		/**
		* Read one clicked button's action and payload.
		*
		* The order is the contract: size, then JSON, then shape, then key. A payload that
		* breaks any step refuses the whole click, because a partially-read payload would make
		* the confirmed parameters and the executed parameters two different things.
		* @param element - the element that carries the action attributes.
		* @returns the action, or why it cannot be used.
		*/
		function readActionEvent(element) {
			const raw = element.getAttribute(WORKBENCH_PAYLOAD_ATTRIBUTE);
			if (raw === null) return {
				kind: "invalid",
				reason: "missing-payload",
				key: (element.getAttribute("data-dsh-action") ?? "").trim()
			};
			if (new TextEncoder().encode(raw).length > 8192) return {
				kind: "invalid",
				reason: "oversized-payload"
			};
			let parsed;
			try {
				parsed = JSON.parse(raw);
			} catch {
				return {
					kind: "invalid",
					reason: "malformed-payload"
				};
			}
			if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {
				kind: "invalid",
				reason: "malformed-payload"
			};
			const key = (element.getAttribute("data-dsh-action") ?? "").trim();
			if (!WORKBENCH_ACTION_KEY_PATTERN.test(key)) return {
				kind: "invalid",
				reason: "missing-action"
			};
			return {
				kind: "action",
				key,
				payload: parsed
			};
		}
		/**
		* Read the HTML one stored result carries.
		* @param value - the result's structured value.
		* @returns the HTML, or undefined when the value carries none — including a result
		* stored by a build that filled named values instead of a region.
		*/
		function resultHtml(value) {
			if (typeof value !== "object" || value === null || Array.isArray(value)) return void 0;
			const html = value.html;
			return typeof html === "string" && html.trim() !== "" ? html : void 0;
		}
		/** A line that is only an identifier — a task number, a defect key, a bare number. */
		var IDENTIFIER_LINE = /^(?:[A-Za-z]{1,4}[-_]?)?\d{5,}$/;
		var BLOCK_BOUNDARY = /<\/(p|h[1-6]|div|li|tr|blockquote|pre|ul|ol|table|section|article|header|footer)>/gi;
		/**
		* The visible text of one document, block boundaries as line breaks.
		*
		* The payload a button carries to another card when it has no row of its own: the target
		* reads the source card's content, not its markup — a child that received the HTML
		* would have to pick prose out of tags. The whole document is what the user is looking
		* at, so nothing is truncated; consecutive blank lines fold to one, and each line's
		* leading whitespace is dropped.
		* @param html - a complete document, or a region fragment; either cleans the same way.
		* @returns the visible text, or an empty string when the browser refuses the markup.
		*/
		function documentText(html) {
			try {
				const host = document.createElement("div");
				host.innerHTML = html.replace(BLOCK_BOUNDARY, "$&\n");
				for (const stray of [...host.querySelectorAll("style, script")]) stray.remove();
				const cleaned = [];
				let previousBlank = false;
				for (const line of (host.textContent ?? "").split("\n")) {
					const part = line.replace(/\s+/g, " ").trim();
					const blank = part === "";
					if (blank && previousBlank) continue;
					cleaned.push(part);
					previousBlank = blank;
				}
				return cleaned.join("\n").trim();
			} catch {
				return "";
			}
		}
		/**
		* The one line a run-history row shows as that run's content.
		*
		* The first visible line is not always the content: a generated document frequently opens
		* with its subject's identifier, so seven runs of one task each preview "T202610223746"
		* and the list reads as seven copies of one row. A marked summary — an element carrying
		* `data-dsh-summary` — wins, then the first heading, then the first line that is not an
		* identifier alone, and only then an identifier, because a row with something to say
		* always says it before falling back to a number.
		* @param html - the region HTML a stored result carries.
		* @returns the headline, truncated, or undefined when the fragment is all markup.
		*/
		function resultHeadline(html) {
			const candidates = [];
			try {
				const host = document.createElement("div");
				host.innerHTML = html;
				const markedText = singleLine(host.querySelector("[data-dsh-summary]")?.textContent ?? "");
				if (markedText !== "") candidates.push(markedText);
				else {
					const headingText = singleLine(host.querySelector("h1, h2, h3, h4")?.textContent ?? "");
					if (headingText !== "") candidates.push(headingText);
				}
			} catch {
				return;
			}
			for (const line of documentText(html).split("\n")) {
				const part = singleLine(line);
				if (part !== "") candidates.push(part);
			}
			const line = candidates.find((part) => !IDENTIFIER_LINE.test(part.replace(/[\s:：]/g, ""))) ?? candidates[0];
			if (line === void 0) return void 0;
			const points = Array.from(line);
			return points.length <= 120 ? line : `${points.slice(0, 120).join("")}…`;
		}
		/**
		* Fold one run of text onto a single line.
		* @param text - text that may carry newlines or runs of spaces.
		* @returns the collapsed line.
		*/
		function singleLine(text) {
			return text.replace(/\s+/g, " ").trim();
		}
		/**
		* Splice one result's HTML into its template's region.
		* @param template - the template as stored.
		* @param html - the region content the result carries.
		* @returns the document to render; the template unchanged when it has no region.
		*/
		function filledTemplate(template, html) {
			const region = findRegion(template);
			if (region === void 0) return template;
			return template.slice(0, region.start) + withoutScripts(html) + template.slice(region.end);
		}
		/**
		* Remove the script elements one region fragment carries.
		*
		* The region is model-authored on every run, so a script in it is text a language model
		* wrote — refused here as well as by the analyser, because a stored result can reach the
		* screen without passing the editor that would have refused it. The template's own script is
		* untouched: it is outside the region, so it is not in this string.
		* @param html - the region fragment.
		* @returns the fragment with its scripts removed.
		*/
		function withoutScripts(html) {
			const fragment = parseTemplate(html);
			for (const script of [...fragment.querySelectorAll("script")]) script.remove();
			const host = document.createElement("template");
			host.content.append(fragment);
			return host.innerHTML;
		}
		/**
		* Global the binding is published on while one document's scripts run.
		*
		* A global because a script element can only be given code, not a closure. The wrapper below
		* reads it synchronously at the moment the element runs, which is before the next document
		* renders, so no two documents can see each other's binding.
		*/
		var BINDING_GLOBAL = "__dshWorkbenchDocumentBinding__";
		/**
		* Wrap one script's source so it receives its binding as a parameter.
		*
		* A parameter rather than a global lookup inside the script: the callbacks a script registers
		* outlive the render, and one that read the global later would read whatever the next
		* document published there.
		* @param source - the script as the template wrote it.
		* @returns the source to hand the element.
		*/
		function bindDocumentScript(source) {
			return [
				`(function (dsh) {`,
				source,
				``,
				`})(globalThis.${BINDING_GLOBAL});`
			].join("\n");
		}
		/**
		* Render one document into a shadow root.
		*
		* The document is parsed inert, its scripts taken out, its forbidden constructs stripped, and
		* the rest adopted into the root. Only then are the scripts re-created and appended: a script
		* element that is inserted by the parser never runs, so running the template's code means
		* building a second element for it — which is also where the binding is attached.
		* @param root - the shadow root to fill; its previous children are replaced.
		* @param html - the complete document.
		* @param runtime - the card identity and binding factory; absent runs the document with no
		* binding, which is what a preview outside a card does.
		*/
		function renderTemplate(root, html, runtime) {
			const content = parseTemplate(html);
			const scripts = takeScripts(content);
			stripForbidden(content, "template");
			root.replaceChildren(content);
			if (scripts.length > 0) runScripts(root, scripts, runtime);
		}
		/**
		* Take the inline script elements out of one parsed document, in document order.
		*
		* Every script leaves the tree: the ones that carry their code are returned to be re-created
		* (a parsed one never runs), and the ones that name a URL are dropped.
		* @param node - the parsed document's fragment.
		* @returns what the allowed scripts carried.
		*/
		function takeScripts(node) {
			const found = [];
			for (const script of [...node.querySelectorAll("script")]) {
				if (script.hasAttribute("src")) {
					script.remove();
					continue;
				}
				found.push({
					type: script.getAttribute("type") ?? "",
					source: script.textContent ?? ""
				});
				script.remove();
			}
			return found;
		}
		/**
		* Re-create and run one document's scripts.
		*
		* The binding is published only for the synchronous span in which the elements are appended,
		* and the wrapper hands it to the script as an argument, so an asynchronous callback keeps the
		* card's own binding. A script that carried its code elsewhere was stripped with the rest of
		* the forbidden constructs and never reaches here.
		* @param root - the root the document was rendered into.
		* @param scripts - the scripts, in document order.
		* @param runtime - the card identity and binding factory.
		*/
		function runScripts(root, scripts, runtime) {
			const binding = runtime?.bind({
				cardId: runtime.cardId,
				...runtime.runId === void 0 ? {} : { runId: runtime.runId },
				root,
				host: root.host
			});
			const scope = globalThis;
			if (binding === void 0) {
				for (const script of scripts) appendScript(root, script, false);
				return;
			}
			scope[BINDING_GLOBAL] = binding;
			try {
				for (const script of scripts) appendScript(root, script, true);
			} finally {
				Reflect.deleteProperty(scope, BINDING_GLOBAL);
			}
		}
		/**
		* Append one script element, which is what makes its code run.
		* @param root - the root to append into.
		* @param script - the type and source it carried.
		* @param bound - whether it is handed the document's binding.
		*/
		function appendScript(root, script, bound) {
			const element = document.createElement("script");
			if (script.type !== "") element.setAttribute("type", script.type);
			element.textContent = bound ? bindDocumentScript(script.source) : script.source;
			root.append(element);
		}
		/**
		* Remove anything the document must not carry.
		*
		* Saving refuses these in a template, so removing them here covers the other source: a
		* fragment a model authored, which can carry a construct into the document that no
		* template ever held. The scope is what decides whether the document's own script is such a
		* construct: a template's is the user's code and stays, a region's has already been removed.
		* @param node - the node to clean.
		* @param scope - which half of the document this node came from.
		*/
		function stripForbidden(node, scope) {
			for (const child of [...node.childNodes]) {
				if (child.nodeType !== Node.ELEMENT_NODE) continue;
				const element = child;
				if (element.tagName.toLowerCase() === "style" && hasExternalCss(element.textContent ?? "")) {
					element.remove();
					continue;
				}
				if (forbiddenElementReason(element, scope) !== void 0) {
					element.remove();
					continue;
				}
				for (const attribute of [...element.attributes]) if (forbiddenAttributeReason(attribute.name, attribute.value) !== void 0) element.removeAttribute(attribute.name);
				stripForbidden(element, scope);
			}
		}
		//#endregion
		//#region src/client/skill-card/ShadowHtml.tsx
		/**
		* Shadow-root host for one rendered card document.
		*
		* The host element sits in the ordinary tree, so the card keeps its place in the
		* grid, while the document renders inside a shadow root where its styles cannot
		* reach the rest of the application.
		*
		* Clicks arrive here rather than on the buttons themselves: the document is rebuilt on
		* every run, so a listener bound to a button would be gone the second time. The host
		* element outlives the content, which makes it the only stable place to listen.
		* @module dsh-workbench/client/skill-card/ShadowHtml
		*/
		/**
		* Render one document inside a shadow root and observe its actions.
		* @param props - the document, the host class, the action handler, and the document runtime.
		* @returns the host element.
		*/
		function ShadowHtml({ html, className, onAction, cardId, runId, documents }) {
			const host = (0, react.useRef)(null);
			(0, react.useEffect)(() => {
				const element = host.current;
				if (element === null) return;
				renderTemplate(element.shadowRoot ?? element.attachShadow({ mode: "open" }), html, cardId === void 0 || documents === void 0 ? void 0 : {
					cardId,
					...runId === void 0 ? {} : { runId },
					bind: documents
				});
			}, [
				html,
				cardId,
				runId,
				documents
			]);
			(0, react.useEffect)(() => {
				const element = host.current;
				if (element === null || onAction === void 0) return;
				const onClick = (event) => {
					const first = event.composedPath()[0];
					if (!(first instanceof Element)) return;
					const button = first.closest(`[${WORKBENCH_ACTION_ATTRIBUTE}]`);
					if (button === null) return;
					onAction(readActionEvent(button));
				};
				element.addEventListener("click", onClick);
				return () => {
					element.removeEventListener("click", onClick);
				};
			}, [onAction]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				ref: host,
				className
			});
		}
		//#endregion
		//#region src/client/skill-card/actions.ts
		/**
		* Resolve one clicked key against the template's declarations and the live catalog.
		*
		* The order is the contract, because the user sees only the first failure: an unknown
		* key is reported before a missing target, and a missing target before a busy one.
		* @param declarations - the targets the template declares.
		* @param lookup - cards and skills as of this click.
		* @param key - the action key the button carried.
		* @param payload - that row's raw fields.
		* @returns the resolved target, or why it cannot run.
		*/
		function resolveAction(declarations, lookup, key, payload) {
			const declaration = declarations.find((item) => item.key === key);
			if (declaration === void 0) return {
				kind: "failed",
				key,
				code: "unknown-action",
				candidates: []
			};
			if (declaration.target.kind === "card") return resolveCard(declaration.target, lookup, key, payload);
			return resolveSkill(declaration.target, lookup, key, payload);
		}
		/**
		* Resolve a card target by name.
		* @param target - the declared target.
		* @param lookup - the current view.
		* @param key - the clicked key.
		* @param payload - the row's fields.
		* @returns the resolution.
		*/
		function resolveCard(target, lookup, key, payload) {
			const named = lookup.cards.filter((card) => card.name === target.name);
			if (named.length === 0) return {
				kind: "failed",
				key,
				code: "target-card-missing",
				candidates: lookup.cards.map((card) => card.name)
			};
			if (named.length > 1) return {
				kind: "failed",
				key,
				code: "target-card-ambiguous",
				candidates: named.map((card) => card.name)
			};
			const card = named[0];
			if (card === void 0) return {
				kind: "failed",
				key,
				code: "target-card-missing",
				candidates: []
			};
			return {
				kind: "resolved",
				key,
				target: {
					kind: "card",
					name: target.name
				},
				reference: card.cardId,
				payload
			};
		}
		/**
		* Resolve a skill target by name.
		* @param target - the declared target.
		* @param lookup - the current view.
		* @param key - the clicked key.
		* @param payload - the row's fields.
		* @returns the resolution.
		*/
		function resolveSkill(target, lookup, key, payload) {
			if (!lookup.skills.includes(target.name)) return {
				kind: "failed",
				key,
				code: "target-skill-missing",
				candidates: lookup.skills
			};
			return {
				kind: "resolved",
				key,
				target: {
					kind: "skill",
					name: target.name
				},
				reference: target.name,
				payload
			};
		}
		//#endregion
		//#region src/client/skill-card/run-start.ts
		/**
		* Starting one card's run from outside that card.
		*
		* A card's controller only exists while that card's page is mounted, but a run can be
		* triggered from a different card's button. This module is that path: one function,
		* plain data in and out, so the trigger does not depend on the target card's component
		* — or on any component at all — being mounted.
		* @module dsh-workbench/client/skill-card/run-start
		*/
		/**
		* Start a run for any stored card.
		*
		* The route is the existing one, and the contract is the one every card run uses: a
		* card run fills its template's region, so it always asks for `{ html }`. Nothing here
		* checks whether the card is free — the Host refuses a concurrent run and its refusal
		* is reported as it stands, which is the documented way this race is handled.
		*
		* The session, when the caller has one, is named only as the skill definition's scope: a
		* custom skill was registered against the session the card was configured in, and a fresh
		* run session does not carry it. The run itself still executes in a fresh session the Host
		* creates, so it never joins — or leaves its traffic in — the conversation the user is
		* having.
		* @param api - transport. Taken here rather than bound to a controller, so this works
		* for a card that is nowhere on screen.
		* @param cardId - the card to run.
		* @param scopeSessionId - the session whose scope resolves the skill definition; undefined
		* resolves through the run's own fresh agent (the global and project layers).
		* @param ask - what else travels with the run: the clicked row, and the instruction the user
		* wrote for it. Both optional and independent — a run may act on a row, on a sentence, on
		* both, or on neither.
		* @returns the accepted run state, or the Host's own refusal.
		*/
		async function startCardRun(api, cardId, scopeSessionId, ask = {}) {
			const { payload, instruction } = ask;
			const trimmed = instruction?.trim();
			return await api.start({
				cardId,
				...scopeSessionId === void 0 ? {} : { scopeSessionId },
				mode: { kind: "card" },
				...payload === void 0 ? {} : { payload },
				...trimmed === void 0 || trimmed === "" ? {} : { instruction: trimmed },
				outputSchema: WORKBENCH_OUTPUT_SCHEMA
			});
		}
		/**
		* Ask any stored card to revise a result it already produced.
		*
		* The same shape as {@link startCardRun} with the refine mode in place of the card
		* mode, plus the one session the Host does need named: the session the revised result was
		* produced in, which the run executes in and continues. Unlike execution, the skill
		* definition is not resolved there — a custom skill was registered against the user's
		* live session, so that session is named separately as {@link scopeSessionId}, exactly as
		* a card run names it. The template and the contract are not the client's to state, and
		* the previous HTML travels verbatim so the child revises the pixels the user is looking
		* at. Both request shapes live here so the mode union is constructed in one module.
		* @param api - transport.
		* @param cardId - the card whose result is being revised.
		* @param sessionId - the session recorded on the result being revised; undefined when the
		* record carries none, which the Host refuses rather than running somewhere else.
		* @param scopeSessionId - the session whose scope resolves the skill definition; absent
		* resolves through the run's own agent.
		* @param instruction - what to change, as the user wrote it.
		* @param previous - the region HTML the revision starts from.
		* @returns the accepted run state, or the Host's own refusal.
		*/
		async function startCardRefine(api, cardId, sessionId, scopeSessionId, instruction, previous) {
			return await api.start({
				cardId,
				...sessionId === void 0 ? {} : { sessionId },
				...scopeSessionId === void 0 ? {} : { scopeSessionId },
				mode: {
					kind: "refine",
					instruction,
					previous
				},
				outputSchema: WORKBENCH_OUTPUT_SCHEMA
			});
		}
		//#endregion
		//#region src/client/skill-card/workspace.ts
		/**
		* The answer when nothing could be read at all.
		*
		* A check that never answered is treated as "nothing is there" rather than as a fourth
		* state: an unconfirmed directory is one a card may not run in, and inventing a "checking"
		* state would let the run control open on a path nobody verified.
		*/
		var NO_DIRECTORY_STAT = {
			exists: false,
			isDirectory: false,
			writable: false
		};
		/**
		* The last segment of a directory path, for the field's primary value.
		*
		* Display only: the stored value is the full path and the run uses it as it is, so this
		* never round-trips into storage or into a request. Trailing separators are dropped first,
		* because a path is often written both ways and `Personal-Workbench/` must not read as an
		* empty name.
		* @param path - an absolute directory path, as stored.
		* @returns the last segment; a drive root and a filesystem root are handled below.
		*/
		function workspaceLeaf$1(path) {
			const trimmed = path.replace(/[\\/]+$/u, "");
			if (trimmed === "") return path;
			if (/^[A-Za-z]:$/u.test(trimmed)) return `${trimmed}${path.charAt(trimmed.length)}`;
			const cut = Math.max(trimmed.lastIndexOf("/"), trimmed.lastIndexOf("\\"));
			return trimmed.slice(cut + 1);
		}
		/**
		* Resolve the field from the card's stored directory and the Host's answer about it.
		* @param stored - the directory this card stores, when it has one.
		* @param stat - what the Host answered about it; undefined while no answer has arrived.
		* @returns the field state.
		*/
		function resolveWorkspaceField(stored, stat) {
			if (stored === void 0) return { kind: "missing" };
			const leaf = workspaceLeaf$1(stored.path);
			if (stat === void 0) return {
				kind: "invalid",
				path: stored.path,
				leaf,
				checked: false
			};
			if (!stat.exists || !stat.isDirectory) return {
				kind: "invalid",
				path: stored.path,
				leaf,
				checked: true
			};
			return {
				kind: "ready",
				path: stored.path,
				leaf
			};
		}
		//#endregion
		//#region src/client/skill-card/controller.ts
		/**
		* Skill card state: what one card shows and what it can do.
		*
		* The card never talks to the Host directly; it renders this view and calls these
		* actions. Failures travel as codes so the component localizes them, with the
		* Host's own text kept as secondary detail.
		*
		* Two of the states here are deliberately transient and never stored: the action
		* waiting for confirmation, and a bare run's progress. A reload loses both, which is
		* what makes a skill target's result a property of the screen rather than of the card.
		*
		* The refinement state — the revision log and the one version kept for a step back —
		* is transient for the same reason: the stored result stays the only durable thing,
		* and a reload starts the conversation over.
		* @module dsh-workbench/client/skill-card/controller
		*/
		/** How often a running card asks the Host for its state. */
		var POLL_INTERVAL_MS = 1e3;
		/**
		* Drive one skill card.
		* @param options - transport, card identity, session, and the panel's own callbacks.
		* @returns the card's view and actions.
		*/
		function useSkillCard(options) {
			const { api, cardId, session, pickerSession, withCatalog = false, models, workspacePicker, cardTitle = defaultCardTitle, openCard, watchRun = false } = options;
			const sessionId = session();
			const modelSessionId = pickerSession === void 0 ? sessionId : pickerSession();
			const [config, setConfig] = (0, react.useState)({ kind: "loading" });
			/**
			* The runs this page knows about, newest first.
			*
			* A list rather than one state because a card may have several runs in flight: the
			* history draws a row per run, and the page's own subject is picked out of the list
			* below. The newest entry is what a single-run reader would have called "the run".
			*/
			const [liveRuns, setLiveRuns] = (0, react.useState)([]);
			const [problem, setProblem] = (0, react.useState)(void 0);
			const [pendingAction, setPendingAction] = (0, react.useState)(void 0);
			const [actionProblem, setActionProblem] = (0, react.useState)(void 0);
			const [bareRun, setBareRun] = (0, react.useState)(void 0);
			const [refinements, setRefinements] = (0, react.useState)([]);
			const [previousResult, setPreviousResult] = (0, react.useState)(void 0);
			const [resultOverride, setResultOverride] = (0, react.useState)(void 0);
			const [refineProblem, setRefineProblem] = (0, react.useState)(void 0);
			const refinement = (0, react.useRef)(void 0);
			/**
			* Record what a settled refinement run means for the surface.
			*
			* Called wherever a run state turns terminal — the start response and every poll —
			* so a refinement answered before the first poll is recorded exactly like one
			* answered by it.
			* @param state - the run state just read.
			*/
			const settleRefinement = (0, react.useCallback)((state) => {
				const intent = refinement.current;
				if (intent === void 0) return;
				if (state.phase !== "settled" && state.phase !== "cancelled") return;
				const id = runIdOf(state);
				if (intent.runId !== void 0 && id !== void 0 && intent.runId !== id) return;
				refinement.current = void 0;
				if (state.phase === "cancelled" || state.failure !== void 0 || state.failureCode !== void 0) {
					setResultOverride(intent.prior);
					setRefineProblem({
						code: state.failureCode ?? "run-failed",
						...state.failure === void 0 ? {} : { detail: state.failure }
					});
					return;
				}
				setPreviousResult(intent.prior);
				setRefinements((entries) => [...entries, {
					instruction: intent.instruction,
					at: Date.now()
				}]);
				setResultOverride(void 0);
			}, []);
			const [catalog, setCatalog] = (0, react.useState)([]);
			const [catalogStatus, setCatalogStatus] = (0, react.useState)("idle");
			const [catalogFailure, setCatalogFailure] = (0, react.useState)(void 0);
			const [directory, setDirectory] = (0, react.useState)(NO_MODEL_DIRECTORY);
			const [pickerRefused, setPickerRefused] = (0, react.useState)(false);
			(0, react.useEffect)(() => {
				if (models === void 0) return;
				const read = () => {
					setDirectory(models.read(modelSessionId));
				};
				read();
				return models.subscribe(modelSessionId, read);
			}, [models, modelSessionId]);
			(0, react.useEffect)(() => {
				if (!withCatalog) return;
				setCatalogStatus("loading");
				api.catalog(sessionId).then((result) => {
					if (result.status === "ok") {
						setCatalog(result.entries);
						setCatalogStatus("ready");
						setCatalogFailure(void 0);
						return;
					}
					setCatalogStatus("failed");
					setCatalogFailure(asErrorCode(result.code));
				});
			}, [
				api,
				sessionId,
				withCatalog
			]);
			const refresh = (0, react.useCallback)(() => {
				setResultOverride(void 0);
				api.read().then((result) => {
					if (result.status === "ok") {
						setConfig({
							kind: "ready",
							snapshot: result.snapshot
						});
						setProblem(void 0);
						return;
					}
					setConfig({
						kind: "unavailable",
						reason: result.reason
					});
				});
			}, [api]);
			(0, react.useEffect)(() => {
				refresh();
			}, [refresh]);
			(0, react.useEffect)(() => {
				if (!watchRun) return;
				api.poll(cardId).then((result) => {
					if (result.status !== "ok") return;
					const states = result.states ?? [result.state];
					if (!states.some((state) => state.phase === "running")) return;
					setLiveRuns(states);
				});
			}, [
				api,
				cardId,
				watchRun
			]);
			const anyRunning = liveRuns.some((state) => state.phase === "running");
			(0, react.useEffect)(() => {
				if (!anyRunning) return;
				let stopped = false;
				const timer = setInterval(() => {
					api.poll(cardId).then((result) => {
						if (stopped) return;
						if (result.status === "ok") {
							const states = result.states ?? [result.state];
							for (const state of states) settleRefinement(state);
							setLiveRuns(states);
							if (states.some((state) => state.phase === "settled" || state.phase === "cancelled")) refresh();
							return;
						}
						if (result.status === "missing") setLiveRuns([]);
					});
				}, POLL_INTERVAL_MS);
				return () => {
					stopped = true;
					clearInterval(timer);
				};
			}, [
				api,
				cardId,
				anyRunning,
				refresh,
				settleRefinement
			]);
			const bareRunning = bareRun?.phase === "running";
			(0, react.useEffect)(() => {
				if (!bareRunning || bareRun === void 0) return;
				const skill = bareRun.skill;
				let stopped = false;
				const timer = setInterval(() => {
					api.poll(cardId).then((result) => {
						if (stopped || result.status !== "ok") return;
						const state = result.state;
						if (state.phase === "idle" || state.phase === "running") return;
						const ok = state.phase === "settled" && state.failure === void 0;
						const diagnostic = state.failure ?? state.result?.diagnostic;
						setBareRun({
							phase: "settled",
							skill,
							ok,
							...diagnostic === void 0 ? {} : { diagnostic }
						});
					});
				}, POLL_INTERVAL_MS);
				return () => {
					stopped = true;
					clearInterval(timer);
				};
			}, [
				api,
				cardId,
				bareRun,
				bareRunning
			]);
			const card = config.kind === "ready" ? config.snapshot.cards.find((entry) => entry.cardId === cardId) : void 0;
			const stored = config.kind === "ready" ? options.runId === void 0 ? config.snapshot.results.find((entry) => entry.cardId === cardId) : config.snapshot.results.find((entry) => entry.cardId === cardId && entry.runId === options.runId) : void 0;
			const run = options.runId === void 0 ? liveRuns[0] : liveRuns.find((state) => runIdOf(state) === options.runId);
			const running = liveRuns.filter((state) => state.phase === "running");
			const liveRunRecords = liveRuns.flatMap((state) => {
				const runId = runIdOf(state);
				if (runId === void 0 || state.startedAt === void 0) return [];
				if (state.result !== void 0) return [state.result];
				return [{
					runId,
					skill: card?.skill ?? "",
					executedAt: state.startedAt,
					...state.instruction === void 0 ? {} : { instruction: state.instruction },
					stopReason: state.phase === "cancelled" ? "aborted" : "running"
				}];
			});
			const runs = config.kind === "ready" ? (() => {
				const stored = config.snapshot.results.filter((entry) => entry.cardId === cardId).sort((left, right) => right.executedAt - left.executedAt);
				return [...liveRunRecords.filter((record) => !stored.some((entry) => entry.runId === record.runId)), ...stored].sort((left, right) => right.executedAt - left.executedAt);
			})() : liveRunRecords;
			const recentInstructions = recentInstructionsOf(runs);
			const modelField = (0, react.useMemo)(() => resolveModelField(card?.model, directory), [card?.model, directory]);
			const [workspaceCheck, setWorkspaceCheck] = (0, react.useState)(void 0);
			const workspacePath = card?.workspace?.path;
			(0, react.useEffect)(() => {
				if (workspacePath === void 0) return;
				let live = true;
				api.statDirectory(workspacePath).then((outcome) => {
					if (!live) return;
					setWorkspaceCheck({
						path: workspacePath,
						stat: outcome.status === "ok" ? outcome.stat : NO_DIRECTORY_STAT
					});
				});
				return () => {
					live = false;
				};
			}, [api, workspacePath]);
			const workspaceStat = workspacePath !== void 0 && workspaceCheck?.path === workspacePath ? workspaceCheck.stat : void 0;
			const workspaceField = (0, react.useMemo)(() => resolveWorkspaceField(card?.workspace, workspaceStat), [card?.workspace, workspaceStat]);
			const canChooseWorkspace = !pickerRefused && workspacePicker !== void 0 && workspacePicker.available();
			const runUnavailable = (0, react.useMemo)(() => config.kind === "ready" && config.snapshot.capabilities?.startActivation === false && config.snapshot.capabilities.start === false ? { code: "run-unavailable" } : void 0, [config]);
			const named = options.runId !== void 0 && stored !== void 0;
			const result = resultOverride ?? (named ? stored : run?.result ?? stored);
			const previous = (0, react.useMemo)(() => {
				if (previousResult === void 0) return void 0;
				const html = resultHtml(previousResult.structured);
				return html === void 0 ? void 0 : {
					html,
					at: previousResult.executedAt
				};
			}, [previousResult]);
			const start = (0, react.useCallback)((instruction) => {
				refinement.current = void 0;
				setResultOverride(void 0);
				setPreviousResult(void 0);
				setRefineProblem(void 0);
				const refused = workspaceRefusal(workspaceField);
				if (refused !== void 0) {
					setProblem(refused);
					return;
				}
				if (card?.skill === void 0) {
					setProblem({
						code: "not-configured",
						detail: ""
					});
					return;
				}
				const template = card.template;
				if (template === void 0) {
					setProblem({
						code: "template-missing",
						detail: ""
					});
					return;
				}
				const first = analyzeTemplate(template).violations[0];
				if (first !== void 0) {
					setProblem({
						code: "template-invalid",
						detail: first.location
					});
					return;
				}
				startCardRun(api, cardId, session(), instruction === void 0 ? {} : { instruction }).then((outcome) => {
					if (outcome.status === "ok") {
						publishRun(outcome.state);
						setProblem(void 0);
						if (outcome.state.phase === "settled" || outcome.state.phase === "cancelled") refresh();
						return;
					}
					setProblem(outcome.status === "rejected" ? {
						code: asErrorCode(outcome.code),
						detail: outcome.message
					} : {
						code: "unavailable",
						detail: outcome.reason
					});
				});
			}, [
				api,
				cardId,
				refresh,
				card?.skill,
				card?.template,
				workspaceField,
				session
			]);
			/**
			* Add one run to the page's list, replacing the entry with the same id.
			*
			* A start answer and a poll answer are the same run, and a card may have several: the
			* entry is replaced in place so the newest run's row does not appear twice.
			* @param state - the run the host just reported.
			*/
			const publishRun = (0, react.useCallback)((state) => {
				setLiveRuns((list) => [state, ...list.filter((entry) => runIdOf(entry) !== runIdOf(state))]);
			}, []);
			/**
			* Stop what the page is about.
			*
			* A page opened on one run stops that run alone, which is the answer the row that opened
			* it implies. The latest-result page names no run, so its control stops every run the
			* card has in flight — that page's row list is the card's whole activity.
			*/
			const cancel = (0, react.useCallback)(() => {
				api.cancel(cardId, options.runId);
			}, [
				api,
				cardId,
				options.runId
			]);
			/**
			* Stop one named run.
			* @param runId - the run to stop, as its history row names it.
			*/
			const cancelRun = (0, react.useCallback)((runId) => {
				api.cancel(cardId, runId);
			}, [api, cardId]);
			const refine = (0, react.useCallback)((instruction) => {
				const text = instruction.trim();
				if (text === "") return;
				const refineSession = result?.sessionId;
				const refused = workspaceRefusal(workspaceField);
				if (refused !== void 0) {
					setRefineProblem(refused);
					return;
				}
				if (card?.skill === void 0) {
					setProblem({
						code: "not-configured",
						detail: ""
					});
					return;
				}
				if (card.template === void 0) {
					setProblem({
						code: "template-missing",
						detail: ""
					});
					return;
				}
				const priorHtml = resultHtml(result?.structured);
				if (priorHtml === void 0) {
					setRefineProblem({
						code: "run-failed",
						detail: ""
					});
					return;
				}
				setRefineProblem(void 0);
				setProblem(void 0);
				setResultOverride(result);
				refinement.current = {
					instruction: text,
					prior: result,
					priorHtml
				};
				startCardRefine(api, cardId, refineSession, session(), text, priorHtml).then((outcome) => {
					if (outcome.status !== "ok") {
						refinement.current = void 0;
						setRefineProblem(refineStartProblem(outcome));
						return;
					}
					const runId = runIdOf(outcome.state);
					const intent = refinement.current;
					if (intent !== void 0 && runId !== void 0) refinement.current = {
						...intent,
						runId
					};
					setLiveRuns((list) => [outcome.state, ...list.filter((entry) => runIdOf(entry) !== runId)]);
					settleRefinement(outcome.state);
				});
			}, [
				api,
				card?.skill,
				card?.template,
				cardId,
				result,
				session,
				settleRefinement,
				workspaceField
			]);
			const undoRefine = (0, react.useCallback)(() => {
				const kept = previousResult;
				if (kept === void 0) return;
				setResultOverride(kept);
				setPreviousResult(void 0);
				setRefineProblem(void 0);
			}, [previousResult]);
			const saveResultEdit = (0, react.useCallback)(async (html) => {
				if (html.trim() === "") return false;
				const targetRunId = result?.runId;
				if (targetRunId === void 0) return false;
				const prior = result;
				const outcome = await api.saveResult(cardId, targetRunId, html);
				if (outcome.status !== "ok") {
					setProblem(outcome.status === "rejected" ? {
						code: asErrorCode(outcome.code),
						detail: outcome.message
					} : {
						code: "unavailable",
						detail: outcome.reason
					});
					return false;
				}
				setConfig((state) => {
					if (state.kind !== "ready") return state;
					return {
						kind: "ready",
						snapshot: {
							...state.snapshot,
							revision: outcome.revision,
							results: replaceResult(state.snapshot.results, outcome.result)
						}
					};
				});
				if (prior !== void 0) setPreviousResult(prior);
				setResultOverride(void 0);
				setRefineProblem(void 0);
				setProblem(void 0);
				return true;
			}, [
				api,
				cardId,
				result
			]);
			const revision = config.kind === "ready" ? config.snapshot.revision : void 0;
			const applyWrite = (0, react.useCallback)((result) => {
				if (result.status === "failed") {
					setProblem({
						code: "unavailable",
						detail: result.reason
					});
					return;
				}
				setConfig({
					kind: "ready",
					snapshot: result.snapshot
				});
				setProblem(result.status === "conflict" ? { code: "conflict" } : void 0);
			}, []);
			const chooseSkill = (0, react.useCallback)((skill) => {
				if (revision === void 0) return;
				api.write({
					baseRevision: revision,
					cardId,
					skill
				}).then(applyWrite);
			}, [
				api,
				applyWrite,
				cardId,
				revision
			]);
			const chooseModel = (0, react.useCallback)((model) => {
				if (revision === void 0) return;
				api.write({
					baseRevision: revision,
					cardId,
					model
				}).then(applyWrite);
			}, [
				api,
				applyWrite,
				cardId,
				revision
			]);
			const chooseWorkspace = (0, react.useCallback)(() => {
				if (workspacePicker === void 0) {
					setPickerRefused(true);
					return;
				}
				workspacePicker.pick().then((picked) => {
					if (picked.status === "cancelled") return;
					if (picked.status === "unavailable") {
						setPickerRefused(true);
						return;
					}
					const send = (baseRevision) => {
						api.write({
							baseRevision,
							cardId,
							workspace: { path: picked.path }
						}).then(applyWrite);
					};
					if (revision !== void 0) {
						send(revision);
						return;
					}
					api.read().then((outcome) => {
						if (outcome.status !== "ok") {
							setProblem({
								code: "unavailable",
								detail: outcome.reason
							});
							return;
						}
						send(outcome.snapshot.revision);
					});
				});
			}, [
				api,
				applyWrite,
				cardId,
				revision,
				workspacePicker
			]);
			const choosePermission = (0, react.useCallback)((mode) => {
				if (revision === void 0) return;
				api.write({
					baseRevision: revision,
					cardId,
					permission: mode
				}).then(applyWrite);
			}, [
				api,
				applyWrite,
				cardId,
				revision
			]);
			const chooseInstructionMode = (0, react.useCallback)((mode) => {
				if (revision === void 0) return;
				api.write({
					baseRevision: revision,
					cardId,
					instructionMode: mode
				}).then(applyWrite);
			}, [
				api,
				applyWrite,
				cardId,
				revision
			]);
			const saveTemplate = (0, react.useCallback)((template, name) => {
				const skill = card?.skill;
				if (revision === void 0 || skill === void 0) return;
				const patch = {
					cardId,
					skill,
					template: {
						skill,
						html: template
					},
					name: name.trim() === "" ? null : name
				};
				const send = (baseRevision, retried) => {
					api.write({
						...patch,
						baseRevision
					}).then((result) => {
						if (result.status !== "conflict") {
							applyWrite(result);
							return;
						}
						if (retried) {
							applyWrite(result);
							return;
						}
						send(result.snapshot.revision, true);
					});
				};
				send(revision, false);
			}, [
				api,
				applyWrite,
				cardId,
				revision,
				card?.skill
			]);
			const rename = (0, react.useCallback)((name) => {
				const patch = {
					cardId,
					name: name.trim() === "" ? null : name
				};
				const send = (baseRevision, retried) => {
					api.write({
						...patch,
						baseRevision
					}).then((result) => {
						if (result.status !== "conflict") {
							applyWrite(result);
							return;
						}
						if (retried) {
							applyWrite(result);
							return;
						}
						send(result.snapshot.revision, true);
					});
				};
				if (revision !== void 0) {
					send(revision, false);
					return;
				}
				api.read().then((outcome) => {
					if (outcome.status !== "ok") {
						setProblem({
							code: "unavailable",
							detail: ""
						});
						return;
					}
					send(outcome.snapshot.revision, false);
				});
			}, [
				api,
				applyWrite,
				cardId,
				revision
			]);
			const remove = (0, react.useCallback)(async () => {
				if (revision === void 0) return;
				applyWrite(await api.write({
					baseRevision: revision,
					cardId,
					remove: true
				}));
			}, [
				api,
				applyWrite,
				cardId,
				revision
			]);
			const resolveClick = (0, react.useCallback)(async (key, payload) => {
				setActionProblem(void 0);
				const live = session();
				const [found, catalogRead] = await Promise.all([api.read(), api.catalog(live)]);
				if (found.status !== "ok") {
					setPendingAction(void 0);
					setActionProblem({
						code: "target-unavailable",
						candidates: [],
						detail: found.reason
					});
					return;
				}
				const snapshot = found.snapshot;
				const template = snapshot.cards.find((entry) => entry.cardId === cardId)?.template;
				if (template === void 0) {
					setPendingAction(void 0);
					setActionProblem({
						code: "target-unavailable",
						candidates: []
					});
					return;
				}
				const declarations = analyzeTemplate(template).actions;
				if (declarations.find((item) => item.key === key)?.target.kind === "skill" && catalogRead.status !== "ok") {
					setPendingAction(void 0);
					setActionProblem({
						code: "target-unavailable",
						candidates: [],
						detail: catalogRead.message
					});
					return;
				}
				const effectivePayload = payload ?? { content: (() => {
					const latest = [...snapshot.results].filter((entry) => entry.cardId === cardId).sort((left, right) => right.executedAt - left.executedAt)[0];
					const region = latest === void 0 ? void 0 : resultHtml(latest.structured);
					return documentText(region === void 0 ? template : filledTemplate(template, region));
				})() };
				const resolution = resolveAction(declarations, {
					cards: snapshot.cards.map((entry) => ({
						cardId: entry.cardId,
						name: cardTitle(entry.cardId, entry.name)
					})),
					skills: catalogRead.status === "ok" ? catalogRead.entries.filter((entry) => entry.userInvocable).map((entry) => entry.name) : []
				}, key, effectivePayload);
				if (resolution.kind === "failed") {
					setPendingAction(void 0);
					setActionProblem({
						code: resolution.code,
						candidates: resolution.candidates
					});
					return;
				}
				const skill = resolution.target.kind === "card" ? snapshot.cards.find((entry) => entry.cardId === resolution.reference)?.skill : resolution.target.name;
				if (skill === void 0) {
					setPendingAction(void 0);
					setActionProblem({
						code: "target-unavailable",
						candidates: []
					});
					return;
				}
				const runnerCardId = resolution.target.kind === "card" ? resolution.reference : cardId;
				const runnerCard = snapshot.cards.find((entry) => entry.cardId === runnerCardId);
				const stat = runnerCard?.workspace === void 0 ? void 0 : await api.statDirectory(runnerCard.workspace.path);
				const field = resolveWorkspaceField(runnerCard?.workspace, stat === void 0 ? void 0 : stat.status === "ok" ? stat.stat : NO_DIRECTORY_STAT);
				if (field.kind !== "ready") {
					setPendingAction(void 0);
					setActionProblem(field.kind === "missing" ? {
						code: "target-workspace-missing",
						candidates: []
					} : {
						code: "target-workspace-invalid",
						candidates: [],
						detail: field.path
					});
					return;
				}
				setPendingAction({
					key: resolution.key,
					target: resolution.target,
					reference: resolution.reference,
					skill,
					payload: resolution.payload
				});
			}, [
				api,
				cardId,
				cardTitle,
				session
			]);
			const click = (0, react.useCallback)((event) => {
				setPendingAction(void 0);
				if (event.kind === "invalid") {
					if (event.reason === "missing-payload") {
						if (!WORKBENCH_ACTION_KEY_PATTERN.test(event.key)) {
							setActionProblem({
								code: "missing-action",
								candidates: []
							});
							return;
						}
						resolveClick(event.key, void 0);
						return;
					}
					setActionProblem({
						code: event.reason,
						candidates: []
					});
					return;
				}
				resolveClick(event.key, event.payload);
			}, [resolveClick]);
			const confirmAction = (0, react.useCallback)(() => {
				const pending = pendingAction;
				if (pending === void 0) return;
				setPendingAction(void 0);
				setActionProblem(void 0);
				if (pending.target.kind === "card") {
					startCardRun(api, pending.reference, session(), { payload: pending.payload }).then((outcome) => {
						if (outcome.status !== "ok") {
							setActionProblem(startProblem(outcome));
							return;
						}
						openCard?.(pending.reference, "result");
					});
					return;
				}
				const refused = workspaceRefusal(workspaceField);
				if (refused !== void 0) {
					setActionProblem({
						code: refused.code === "workspace-missing" ? "target-workspace-missing" : "target-workspace-invalid",
						candidates: [],
						...refused.detail === void 0 || refused.detail === "" ? {} : { detail: refused.detail }
					});
					return;
				}
				api.start({
					cardId,
					mode: {
						kind: "bare",
						skill: pending.skill
					},
					payload: pending.payload
				}).then((outcome) => {
					if (outcome.status !== "ok") {
						setActionProblem(startProblem(outcome));
						return;
					}
					setBareRun({
						phase: "running",
						skill: pending.skill,
						startedAt: outcome.state.startedAt ?? Date.now()
					});
				});
			}, [
				api,
				cardId,
				openCard,
				pendingAction,
				workspaceField,
				session
			]);
			const cancelAction = (0, react.useCallback)(() => {
				setPendingAction(void 0);
			}, []);
			const actions = (0, react.useMemo)(() => ({
				run: start,
				cancel,
				cancelRun,
				refine,
				undoRefine,
				saveResultEdit,
				refresh,
				chooseSkill,
				chooseModel,
				chooseWorkspace,
				choosePermission,
				chooseInstructionMode,
				saveTemplate,
				rename,
				remove,
				click,
				confirmAction,
				cancelAction
			}), [
				start,
				cancel,
				cancelRun,
				refine,
				undoRefine,
				saveResultEdit,
				refresh,
				chooseSkill,
				chooseModel,
				chooseWorkspace,
				choosePermission,
				chooseInstructionMode,
				saveTemplate,
				rename,
				remove,
				click,
				confirmAction,
				cancelAction
			]);
			const problemOfRun = run?.failureCode === void 0 ? void 0 : {
				code: run.failureCode,
				...run.failure === void 0 ? {} : { detail: run.failure }
			};
			const effective = problem ?? problemOfRun ?? (config.kind === "unavailable" ? {
				code: "unavailable",
				detail: config.reason
			} : void 0);
			return {
				view: (0, react.useMemo)(() => ({
					status: config.kind === "loading" ? "loading" : config.kind === "ready" ? "ready" : "unavailable",
					...card?.name === void 0 ? {} : { name: card.name },
					...card?.skill === void 0 ? {} : { skill: card.skill },
					...card?.template === void 0 ? {} : { template: card.template },
					...result === void 0 ? {} : { result },
					...options.runId === void 0 ? {} : { runId: options.runId },
					runs,
					...run === void 0 ? {} : { run },
					...refinement.current !== void 0 && running.some((state) => runIdOf(state) === refinement.current?.runId) ? { refining: true } : {},
					...effective === void 0 ? {} : { problem: effective },
					...runUnavailable === void 0 ? {} : { runUnavailable },
					...pendingAction === void 0 ? {} : { pendingAction },
					...actionProblem === void 0 ? {} : { actionProblem },
					...bareRun === void 0 ? {} : { bareRun },
					refinements,
					previous,
					...refineProblem === void 0 ? {} : { refineProblem },
					runnable: runUnavailable === void 0 && card?.skill !== void 0 && card.template !== void 0 && modelField.kind !== "unavailable" && workspaceField.kind === "ready",
					modelField,
					workspaceField,
					permission: effectiveWorkbenchSandboxMode(card?.permission),
					instructionMode: effectiveWorkbenchInstructionMode(card?.instructionMode),
					recentInstructions,
					canChooseWorkspace,
					catalog,
					catalogStatus,
					catalogFailure,
					cardTitles: config.kind === "ready" ? config.snapshot.cards.map((entry) => cardTitle(entry.cardId, entry.name)) : []
				}), [
					config,
					run,
					problem,
					card?.name,
					card?.skill,
					card?.template,
					modelField,
					workspaceField,
					card?.permission,
					card?.instructionMode,
					recentInstructions,
					canChooseWorkspace,
					result,
					runs,
					options.runId,
					catalog,
					catalogStatus,
					catalogFailure,
					pendingAction,
					actionProblem,
					bareRun,
					refinements,
					previous,
					refineProblem,
					cardTitle,
					runUnavailable
				]),
				actions
			};
		}
		/**
		* Read the last few instructions a card's runs carried, newest first.
		*
		* Distinct by exact text, because a repeat that differs by one character is a different
		* ask; blank instructions are skipped, so a card whose runs carried none offers no chips.
		* @param runs - the card's history, newest first.
		* @returns at most {@link WORKBENCH_RECENT_INSTRUCTIONS} instructions.
		*/
		function recentInstructionsOf(runs) {
			const out = [];
			for (const record of runs) {
				const instruction = record.instruction?.trim();
				if (instruction === void 0 || instruction === "") continue;
				if (out.includes(instruction)) continue;
				out.push(instruction);
				if (out.length === 3) break;
			}
			return out;
		}
		/**
		* Read the title one card face shows, when nothing else supplies that rule.
		* @param cardId - the card.
		* @param name - its stored name, when it has one.
		* @returns the name, or the card id it falls back to.
		*/
		function defaultCardTitle(cardId, name) {
			return name ?? cardId;
		}
		/**
		* Read the identity of one run state.
		*
		* The state carries its own id, and a Host that predates concurrent runs sends none — its
		* first run of a card was named by its start time, which is the fallback here. That is the
		* same rule the live row and the stored record agree on, so a row and its record meet.
		* @param state - the run state as read from the Host.
		* @returns the id, or undefined when the state names no start at all.
		*/
		function runIdOf(state) {
			return state.runId ?? (state.startedAt === void 0 ? void 0 : String(state.startedAt));
		}
		/**
		* Put one written result into a snapshot's result list.
		*
		* The edit targets one run, so the matching record is the card/run pair the Host just
		* stored — never another of the card's runs, and never appended as if the card gained a
		* run the edit did not create. Ordering follows the snapshot's own rule: cards ascending,
		* one card's runs newest first.
		* @param results - the snapshot's results, ascending by card id, runs newest first.
		* @param written - the record the Host just stored.
		* @returns a new list holding that record.
		*/
		function replaceResult(results, written) {
			const index = results.findIndex((entry) => entry.cardId === written.cardId && entry.runId === written.runId);
			return (index === -1 ? [...results, written] : results.map((entry, at) => at === index ? written : entry)).sort((left, right) => left.cardId < right.cardId ? -1 : left.cardId > right.cardId ? 1 : right.executedAt - left.executedAt);
		}
		/**
		* Read one workspace field as the refusal a run reports.
		*
		* One function for every entry point, so the header control, a refinement, and a template
		* button cannot disagree about whether the card has somewhere to run.
		* @param field - the resolved field.
		* @returns the problem to report, or undefined when the directory is confirmed.
		*/
		function workspaceRefusal(field) {
			if (field.kind === "ready") return void 0;
			return field.kind === "missing" ? {
				code: "workspace-missing",
				detail: ""
			} : {
				code: "workspace-invalid",
				detail: field.path
			};
		}
		/**
		* Read one refused start as an action problem.
		*
		* A run at the concurrency limit is the one refusal with a name of its own: it is the
		* Host's own answer about how much the deployment will run at once, and it refuses
		* rather than queueing, which is exactly what is reported.
		* @param outcome - the refusal, which is never an accepted run.
		* @returns the problem to report on the card the user is looking at.
		*/
		function startProblem(outcome) {
			const detail = outcome.status === "rejected" ? outcome.message : outcome.reason;
			return {
				code: outcome.status === "rejected" && outcome.code === "run-in-progress" ? "target-busy" : "target-unavailable",
				candidates: [],
				...detail === "" ? {} : { detail }
			};
		}
		/**
		* Read one refused refine start as the failure the composer shows.
		*
		* A concurrent run is the one refusal with a name of its own, exactly as it is for a
		* plain run; the difference is only where the answer lands — under the composer, since
		* that is where the ask came from.
		* @param outcome - the refusal, which is never an accepted run.
		* @returns the problem to report under the composer.
		*/
		function refineStartProblem(outcome) {
			if (outcome.status === "rejected") return {
				code: asErrorCode(outcome.code),
				detail: outcome.message
			};
			return {
				code: "unavailable",
				detail: outcome.reason
			};
		}
		/**
		* Codes this client localizes.
		*
		* A record rather than a list, so adding a code to the contract fails compilation
		* here until it is listed.
		*/
		var LOCALIZED_CODES = {
			unauthorized: true,
			forbidden: true,
			"invalid-request": true,
			"too-large": true,
			conflict: true,
			"not-found": true,
			"storage-failure": true,
			"run-failed": true,
			"run-timeout": true,
			"not-configured": true,
			"session-not-live": true,
			"skill-not-found": true,
			"template-missing": true,
			"catalog-failed": true,
			"provider-unavailable": true,
			"model-unavailable": true,
			"schema-rejected": true,
			"run-in-progress": true,
			"run-unavailable": true,
			"workspace-missing": true,
			"workspace-invalid": true,
			"permission-unavailable": true,
			"instruction-missing": true
		};
		/**
		* Read one refused-start code as a localizable failure code.
		* @param code - the code the Host reported.
		* @returns the code when this client knows it, otherwise `unavailable`.
		*/
		function asErrorCode(code) {
			return Object.hasOwn(LOCALIZED_CODES, code) ? code : "unavailable";
		}
		var skill_card_module_default = {
			template: "_template_48mz2_4",
			body: "_body_48mz2_8",
			cardActions: "_cardActions_48mz2_17",
			faceBody: "_faceBody_48mz2_44",
			faceSummary: "_faceSummary_48mz2_55",
			faceFoot: "_faceFoot_48mz2_72",
			pageView: "_pageView_48mz2_83",
			pageHead: "_pageHead_48mz2_101",
			pageHeadBar: "_pageHeadBar_48mz2_119",
			pageHeadTitle: "_pageHeadTitle_48mz2_127",
			pageHeadMeta: "_pageHeadMeta_48mz2_142",
			pageHeadChip: "_pageHeadChip_48mz2_164",
			runProblem: "_runProblem_48mz2_182",
			runTraceList: "_runTraceList_48mz2_208",
			activityList: "_activityList_48mz2_214",
			activityItem: "_activityItem_48mz2_223",
			activityToolRow: "_activityToolRow_48mz2_229",
			activityRow: "_activityRow_48mz2_235",
			activityTitle: "_activityTitle_48mz2_239",
			activitySep: "_activitySep_48mz2_245",
			activitySummary: "_activitySummary_48mz2_255",
			activityBody: "_activityBody_48mz2_266",
			activityBodyLabel: "_activityBodyLabel_48mz2_274",
			activityBodyText: "_activityBodyText_48mz2_280",
			activityReasoning: "_activityReasoning_48mz2_290",
			activityNarration: "_activityNarration_48mz2_296",
			activityTruncated: "_activityTruncated_48mz2_306",
			turnProcess: "_turnProcess_48mz2_322",
			turnProcessDot: "_turnProcessDot_48mz2_349",
			turnProcessLabel: "_turnProcessLabel_48mz2_361",
			turnProcessSteps: "_turnProcessSteps_48mz2_371",
			turnProcessChevron: "_turnProcessChevron_48mz2_380",
			resultSurface: "_resultSurface_48mz2_407",
			resultEditor: "_resultEditor_48mz2_419",
			actBlock: "_actBlock_48mz2_435",
			actRow: "_actRow_48mz2_442",
			actAction: "_actAction_48mz2_459",
			dialogOverlay: "_dialogOverlay_48mz2_501",
			dialogPanel: "_dialogPanel_48mz2_512",
			dialogHead: "_dialogHead_48mz2_532",
			dialogTitle: "_dialogTitle_48mz2_539",
			dialogClose: "_dialogClose_48mz2_549",
			dialogHint: "_dialogHint_48mz2_575",
			dialogProblem: "_dialogProblem_48mz2_586",
			dialogField: "_dialogField_48mz2_596",
			dialogFoot: "_dialogFoot_48mz2_629",
			runChips: "_runChips_48mz2_639",
			runChipsLabel: "_runChipsLabel_48mz2_647",
			runChip: "_runChip_48mz2_639",
			composerProblem: "_composerProblem_48mz2_681",
			refineLog: "_refineLog_48mz2_689",
			refineLogHead: "_refineLogHead_48mz2_697",
			refineLogTitle: "_refineLogTitle_48mz2_704",
			refineLogList: "_refineLogList_48mz2_714",
			refineLogItem: "_refineLogItem_48mz2_726",
			refineLogInstruction: "_refineLogInstruction_48mz2_731",
			refineLogTime: "_refineLogTime_48mz2_736",
			refineLogNote: "_refineLogNote_48mz2_745",
			notice: "_notice_48mz2_752",
			noticeTitle: "_noticeTitle_48mz2_759",
			noticeBody: "_noticeBody_48mz2_766",
			settings: "_settings_48mz2_775",
			section: "_section_48mz2_784",
			sectionHead: "_sectionHead_48mz2_796",
			sectionTools: "_sectionTools_48mz2_804",
			sectionTitle: "_sectionTitle_48mz2_822",
			fieldGrid: "_fieldGrid_48mz2_834",
			field: "_field_48mz2_834",
			fieldValue: "_fieldValue_48mz2_859",
			fieldLabel: "_fieldLabel_48mz2_876",
			workspaceRow: "_workspaceRow_48mz2_884",
			workspaceValue: "_workspaceValue_48mz2_898",
			workspaceValueInvalid: "_workspaceValueInvalid_48mz2_917",
			workspaceLeaf: "_workspaceLeaf_48mz2_921",
			workspacePath: "_workspacePath_48mz2_933",
			fieldNote: "_fieldNote_48mz2_947",
			select: "_select_48mz2_957",
			editor: "_editor_48mz2_958",
			editorStatus: "_editorStatus_48mz2_992",
			editorStatusDirty: "_editorStatusDirty_48mz2_1008",
			editorStatusMissing: "_editorStatusMissing_48mz2_1015",
			editorStatusWarn: "_editorStatusWarn_48mz2_1020",
			foldView: "_foldView_48mz2_1027",
			foldRow: "_foldRow_48mz2_1041",
			foldNumber: "_foldNumber_48mz2_1061",
			foldCaret: "_foldCaret_48mz2_1062",
			foldText: "_foldText_48mz2_1063",
			foldCaretBlank: "_foldCaretBlank_48mz2_1084",
			foldCount: "_foldCount_48mz2_1103",
			editorPane: "_editorPane_48mz2_1120",
			gutter: "_gutter_48mz2_1134",
			gutterLine: "_gutterLine_48mz2_1154",
			gutterLineRegion: "_gutterLineRegion_48mz2_1174",
			gutterLineActions: "_gutterLineActions_48mz2_1182",
			violations: "_violations_48mz2_1227",
			violationJump: "_violationJump_48mz2_1237",
			previewSurface: "_previewSurface_48mz2_1257",
			previewLabel: "_previewLabel_48mz2_1273",
			preview: "_preview_48mz2_1257",
			settingsActions: "_settingsActions_48mz2_1293",
			actionBuilder: "_actionBuilder_48mz2_1300",
			builderRow: "_builderRow_48mz2_1311",
			builderField: "_builderField_48mz2_1318",
			hint: "_hint_48mz2_1328",
			hintError: "_hintError_48mz2_1335",
			configFooter: "_configFooter_48mz2_1347",
			footerHint: "_footerHint_48mz2_1365",
			footerActions: "_footerActions_48mz2_1372",
			footerSpacer: "_footerSpacer_48mz2_1378",
			deletePrompt: "_deletePrompt_48mz2_1383",
			deleteCard: "_deleteCard_48mz2_1391",
			writeFailure: "_writeFailure_48mz2_1401",
			actionPanel: "_actionPanel_48mz2_1411",
			actionFacts: "_actionFacts_48mz2_1420",
			actionPayload: "_actionPayload_48mz2_1440",
			bareRun: "_bareRun_48mz2_1456",
			panes: "_panes_48mz2_1471",
			paneTabs: "_paneTabs_48mz2_1501",
			paneTab: "_paneTab_48mz2_1501",
			runsHeadText: "_runsHeadText_48mz2_1564",
			runsHeadTitle: "_runsHeadTitle_48mz2_1572",
			runsHeadMeta: "_runsHeadMeta_48mz2_1580",
			runHistoryCount: "_runHistoryCount_48mz2_1589",
			runHistoryEmpty: "_runHistoryEmpty_48mz2_1596",
			runHistoryList: "_runHistoryList_48mz2_1607",
			runHistoryGroup: "_runHistoryGroup_48mz2_1614",
			runHistoryDay: "_runHistoryDay_48mz2_1627",
			runHistoryItems: "_runHistoryItems_48mz2_1641",
			runHistoryItem: "_runHistoryItem_48mz2_1641",
			runHistoryRow: "_runHistoryRow_48mz2_1660",
			runHistoryOpen: "_runHistoryOpen_48mz2_1675",
			runHistoryStop: "_runHistoryStop_48mz2_1727",
			runHistoryBody: "_runHistoryBody_48mz2_1746",
			runHistoryTitle: "_runHistoryTitle_48mz2_1756",
			runHistoryMeta: "_runHistoryMeta_48mz2_1777",
			runHistoryTime: "_runHistoryTime_48mz2_1798",
			runHistoryModel: "_runHistoryModel_48mz2_1805",
			runHistoryOrdinal: "_runHistoryOrdinal_48mz2_1815",
			runHistoryEdited: "_runHistoryEdited_48mz2_1816",
			runHistoryInstruction: "_runHistoryInstruction_48mz2_1825",
			runHistorySide: "_runHistorySide_48mz2_1836",
			runHistoryOutcome: "_runHistoryOutcome_48mz2_1848",
			runHistoryDot: "_runHistoryDot_48mz2_1860",
			runHistoryPulse: "_runHistoryPulse_48mz2_1",
			runHistoryChevron: "_runHistoryChevron_48mz2_1898"
		};
		//#endregion
		//#region src/client/skill-card/PromptDialog.tsx
		/**
		* A modal form, over the whole window, for the sentences a result is changed with.
		*
		* The product has no dialog primitive, so the one this page needs is here: a panel portalled
		* to `document.body` rather than rendered in place, because the page lives inside whatever
		* scroll container and stacking context the shell gave its slot, and a `position: fixed`
		* element inside a transformed ancestor is positioned against that ancestor instead of the
		* window.
		*
		* What a dialog owes the keyboard is not decoration: Escape closes it, Tab stays inside it,
		* opening it puts the caret where the writing goes, and closing it returns focus to the
		* control that opened it. The backdrop closes on a click, and only on the backdrop itself —
		* a mousedown that started inside the panel and ended on the overlay is a select-drag, not a
		* dismissal.
		* @module dsh-workbench/client/skill-card/PromptDialog
		*/
		/**
		* Render the dialog over the page.
		* @param props - the copy, the two ways out, and the form.
		* @returns the dialog, portalled to the document body.
		*/
		function PromptDialog({ title, hint, submitLabel, submitDisabled = false, cancelLabel, closeLabel, problem, busy = false, onCancel, onSubmit, children }) {
			const titleId = (0, react.useId)();
			const hintId = (0, react.useId)();
			const panel = (0, react.useRef)(null);
			(0, react.useEffect)(() => {
				const onKeyDown = (event) => {
					if (event.key !== "Escape") return;
					event.preventDefault();
					event.stopPropagation();
					onCancel();
				};
				document.addEventListener("keydown", onKeyDown, true);
				return () => {
					document.removeEventListener("keydown", onKeyDown, true);
				};
			}, [onCancel]);
			(0, react.useLayoutEffect)(() => {
				const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
				(panel.current?.querySelector("[data-prompt-focus]") ?? panel.current)?.focus();
				return () => {
					opener?.focus();
				};
			}, []);
			const trapTab = (event) => {
				if (event.key !== "Tab") return;
				const root = panel.current;
				if (root === null) return;
				const focusable = [...root.querySelectorAll("button, textarea, input, [tabindex]:not([tabindex=\"-1\"])")].filter((element) => !element.hasAttribute("disabled") && element.tabIndex >= 0);
				if (focusable.length === 0) return;
				const first = focusable[0];
				const last = focusable[focusable.length - 1];
				if (event.shiftKey && document.activeElement === first) {
					event.preventDefault();
					last.focus();
					return;
				}
				if (!event.shiftKey && document.activeElement === last) {
					event.preventDefault();
					first.focus();
				}
			};
			if (typeof document === "undefined") return null;
			return (0, react_dom.createPortal)(/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: skill_card_module_default.dialogOverlay,
				"data-prompt-dialog": "",
				onKeyDown: trapTab,
				onMouseDown: (event) => {
					if (event.target === event.currentTarget) onCancel();
				},
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					ref: panel,
					className: skill_card_module_default.dialogPanel,
					role: "dialog",
					"aria-modal": "true",
					"aria-labelledby": titleId,
					"aria-describedby": hint === void 0 ? void 0 : hintId,
					tabIndex: -1,
					"data-prompt-panel": busy ? "busy" : "",
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: skill_card_module_default.dialogHead,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
								className: skill_card_module_default.dialogTitle,
								id: titleId,
								children: title
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: skill_card_module_default.dialogClose,
								"aria-label": closeLabel,
								onClick: onCancel,
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCloseOutlineMedium, { size: 16 })
							})]
						}),
						hint === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: skill_card_module_default.dialogHint,
							id: hintId,
							children: hint
						}),
						children,
						problem === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: skill_card_module_default.dialogProblem,
							role: "alert",
							"data-prompt-problem": "",
							children: problem
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: skill_card_module_default.dialogFoot,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
								variant: "ghost",
								size: "md",
								onClick: onCancel,
								children: cancelLabel
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
								variant: "primary",
								size: "md",
								disabled: submitDisabled || busy,
								onClick: onSubmit,
								children: submitLabel
							})]
						})
					]
				})
			}), document.body);
		}
		//#endregion
		//#region src/client/skill-card/CardRun.tsx
		/**
		* Starting a card's run, from the card itself.
		*
		* A run used to start from a bar on the card's own page: an input and a button above the
		* history, where the history is what the page is for. Starting a run is an action *on* a
		* card — the grid is where the cards are — so the control lives on the card's face, and the
		* sentence a run may need is written in a dialog. Nothing on the card's page starts a run any
		* more; the page reads the history, and a run in flight is stopped from its own row there.
		*
		* The dialog is the same one the result page opens for 从头跑: `RunPrompt`, here rather than in
		* the pages module so the face (which renders inside a grid cell) does not have to import a
		* page to start something.
		* @module dsh-workbench/client/skill-card/CardRun
		*/
		/** Rows the run dialog's field shows before it scrolls. */
		var RUN_FIELD_MAX_ROWS = 3;
		/** Prefix of the session-scoped draft key, one per card. */
		var DRAFT_PREFIX = "dsh-workbench:instruction:";
		/**
		* Read one card's unsent instruction back.
		*
		* A draft rather than a stored value: it belongs to the dialog the user left, and a card's
		* next run should not inherit a sentence left behind hours ago. Session storage rather than
		* memory because the face that opens the dialog and the page that shows the result are
		* separate mounts — a half-written ask would otherwise be dropped by looking at something.
		* @param cardId - the card whose draft is read.
		* @returns the draft, or an empty string when none was kept or storage is unavailable.
		*/
		function readDraft(cardId) {
			try {
				return globalThis.sessionStorage?.getItem(`${DRAFT_PREFIX}${cardId}`) ?? "";
			} catch {
				return "";
			}
		}
		/**
		* Keep or clear one card's unsent instruction.
		* @param cardId - the card whose draft is written.
		* @param text - the draft; an empty string clears it.
		*/
		function writeDraft(cardId, text) {
			try {
				if (text === "") globalThis.sessionStorage?.removeItem(`${DRAFT_PREFIX}${cardId}`);
				else globalThis.sessionStorage?.setItem(`${DRAFT_PREFIX}${cardId}`, text);
			} catch {}
		}
		/**
		* The field a sentence is written into: one line grown to what it holds.
		*
		* Shared by every dialog a sentence is written in, because the two are the same field around
		* two different forms. What a dialog changes is only when Enter sends: in a dialog the dialog
		* *is* the form, so a bare Enter sends and Shift+Enter is the newline.
		* @param props - the text, its placeholder, and how Enter behaves.
		* @returns the field.
		*/
		function InstructionField({ value, onChange, placeholder, ariaLabel, rows, disabled = false, className, submitOn, onSubmit, focus = false }) {
			const field = (0, react.useRef)(null);
			(0, react.useLayoutEffect)(() => {
				const element = field.current;
				if (element === null) return;
				element.style.height = "auto";
				if (element.scrollHeight > 0) element.style.height = `${String(element.scrollHeight)}px`;
			}, [value]);
			(0, react.useLayoutEffect)(() => {
				if (focus) field.current?.focus();
			}, [focus]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
				ref: field,
				className,
				rows,
				value,
				placeholder,
				"aria-label": ariaLabel,
				disabled,
				"data-prompt-focus": focus ? "" : void 0,
				onChange: (event) => {
					onChange(event.target.value);
				},
				onKeyDown: (event) => {
					if (event.key !== "Enter") return;
					if (event.nativeEvent.isComposing) return;
					if (event.metaKey || event.ctrlKey) {
						event.preventDefault();
						onSubmit();
						return;
					}
					if (event.shiftKey) return;
					if (submitOn === "modifier" && value.includes("\n")) return;
					event.preventDefault();
					onSubmit();
				}
			});
		}
		/**
		* The instructions this card was recently given, offered back as chips.
		*
		* A shortcut for the common case — the same ask again, with a small edit — so a click refills
		* the field rather than starting anything.
		* @param props - the recent asks and what a click does with one.
		* @returns the chips, or nothing when this card has no history.
		*/
		function InstructionChips({ recent, t, onPick }) {
			if (recent.length === 0) return null;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: skill_card_module_default.runChips,
				"data-run-instruction-recent": "",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: skill_card_module_default.runChipsLabel,
					children: t("runInstructionRecent")
				}), recent.map((instruction) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
					type: "button",
					className: skill_card_module_default.runChip,
					onClick: () => {
						onPick(instruction);
					},
					"data-run-instruction-chip": "",
					children: instruction
				}, instruction))]
			});
		}
		/**
		* The dialog a run's instruction is written in, for a card that takes one.
		*
		* A card whose skill takes no instruction never opens this: the run starts from its face, and
		* a dialog over a form with nothing in it would be a question with no answer.
		* @param props - the card, the mode, the recent asks, and the two ways out.
		* @returns the dialog.
		*/
		function RunPrompt({ cardId, title, mode, recent, t, disabled, onRun, onCancel }) {
			const [text, setText] = (0, react.useState)(() => readDraft(cardId));
			const [refused, setRefused] = (0, react.useState)(false);
			const empty = text.trim() === "";
			const submit = () => {
				if (disabled) return;
				if (empty && mode === "required") {
					setRefused(true);
					return;
				}
				setText("");
				writeDraft(cardId, "");
				onRun(empty ? "" : text);
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(PromptDialog, {
				title,
				hint: t("promptFreshHint"),
				submitLabel: t("skillCardRun"),
				cancelLabel: t("skillCardCancel"),
				closeLabel: t("promptClose"),
				problem: refused ? t("runInstructionRequired") : void 0,
				busy: disabled,
				onCancel,
				onSubmit: submit,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(InstructionField, {
					className: skill_card_module_default.dialogField,
					value: text,
					onChange: (next) => {
						setText(next);
						writeDraft(cardId, next);
						if (refused && next.trim() !== "") setRefused(false);
					},
					rows: Math.min(RUN_FIELD_MAX_ROWS, Math.max(2, text.split("\n").length)),
					placeholder: t(mode === "required" ? "runInstructionPlaceholderRequired" : "runInstructionPlaceholderOptional"),
					ariaLabel: t("runInstructionField"),
					submitOn: "enter",
					onSubmit: submit,
					focus: true
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(InstructionChips, {
					recent,
					t,
					onPick: (instruction) => {
						setText(instruction);
						writeDraft(cardId, instruction);
						setRefused(false);
					}
				})]
			});
		}
		/**
		* The run control on a card's face.
		*
		* One control, three readings. A card that takes no instruction runs on the press; a card that
		* takes one opens the dialog to ask for it; and while this card's own run is in flight the
		* control is that run's stop, because the grid is where the user pressed the thing that
		* started it and the card's page has no run control at all. A card that cannot run is closed
		* rather than pressable-and-silent, and its face already says why.
		* @param props - the card's view, its actions, and the translator.
		* @returns the control, and the dialog when it is open.
		*/
		function CardRunButton({ cardId, view, actions, t }) {
			const [asking, setAsking] = (0, react.useState)(false);
			const running = view.run?.phase === "running";
			const disabled = !view.runnable;
			if (running) return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(_deepseek_ai_dsh_client_ui_primitives.Button, {
				variant: "ghost",
				size: "sm",
				"data-card-run": "stop",
				onClick: () => {
					actions.cancel();
				},
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCloseOutlineMedium, { size: 14 }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("skillCardCancel") })]
			});
			const press = () => {
				if (disabled) return;
				if (view.instructionMode === "none") actions.run();
				else setAsking(true);
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)(_deepseek_ai_dsh_client_ui_primitives.Button, {
				variant: "ghost",
				size: "sm",
				"data-card-run": "start",
				disabled,
				onClick: press,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconPlayOutlineRegular, { size: 14 }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("skillCardRun") })]
			}), asking && view.instructionMode !== "none" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(RunPrompt, {
				cardId,
				title: t("runPromptTitle"),
				mode: view.instructionMode,
				recent: view.recentInstructions,
				t,
				disabled,
				onRun: (instruction) => {
					setAsking(false);
					actions.run(instruction);
				},
				onCancel: () => {
					setAsking(false);
				}
			}) : null] });
		}
		//#endregion
		//#region src/client/skill-card/clock.ts
		/**
		* Clock readings one card shows about its runs.
		*
		* Every formatter here is written by hand rather than through `toLocaleTimeString` or
		* `toLocaleDateString`: these strings are scanned in columns — a list of run rows, a
		* card's own latest-run line — and a locale that renders a 12-hour clock or reorders a
		* date would change the shape the column is read as.
		*
		* The module exists because two surfaces need the same readings: the result page's run
		* history and the card face. A card face that said "最近 22:47" about a run from last
		* week would be a lie of omission, so both read the same rule from here.
		* @module dsh-workbench/client/skill-card/clock
		*/
		/**
		* Format one moment as a 24-hour clock time with seconds.
		* @param at - milliseconds since the epoch.
		* @returns `HH:MM:SS` in the browser's own time zone.
		*/
		function clockText(at) {
			const date = new Date(at);
			return [
				date.getHours(),
				date.getMinutes(),
				date.getSeconds()
			].map((part) => String(part).padStart(2, "0")).join(":");
		}
		/**
		* The day one moment falls on, as a key the history groups by.
		* @param at - milliseconds since the epoch.
		* @returns `YYYY-MM-DD` in the browser's own time zone.
		*/
		function dayKey(at) {
			const date = new Date(at);
			const pad = (part) => String(part).padStart(2, "0");
			return `${String(date.getFullYear())}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
		}
		/**
		* The clock reading one history row shows.
		*
		* The date belongs to the group's heading, so a row carries only the minute its run
		* completed.
		* @param at - milliseconds since the epoch.
		* @returns `HH:MM` in the browser's own time zone.
		*/
		function runClockText(at) {
			const date = new Date(at);
			const pad = (part) => String(part).padStart(2, "0");
			return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
		}
		/**
		* The moment a card names as its latest run.
		*
		* Today's run needs only its clock, while any earlier run carries its day, because
		* "最近 22:47" about a run from last week would be a lie of omission.
		* @param at - the newest run's completion moment.
		* @returns `HH:MM` for today, `YYYY-MM-DD HH:MM` otherwise.
		*/
		function latestRunText(at) {
			return dayKey(at) === dayKey(Date.now()) ? runClockText(at) : `${dayKey(at)} ${runClockText(at)}`;
		}
		//#endregion
		//#region src/client/skill-card/ActivityTrace.tsx
		/**
		* The run activity stream: what the child did, while it is doing it and after.
		*
		* Three things live here and they belong together. The trace list is one rendering used
		* twice — under a running card, and inside 运行详情 — so the stream a user watches and the
		* record they open afterwards cannot drift apart. The clock is local: 用时 is computed from
		* `startedAt` on this component's own timer, never from the value a poll happened to carry,
		* because a poll is a snapshot of the Host and 用时 is a fact about the browser's clock. And
		* the running notice keeps the card's previous static sentence for a run that has recorded
		* nothing yet, so the card never shows an empty frame.
		*
		* The rows match the conversation's run record: each tool call and each reasoning span is a
		* disclosure row with a leading icon, a title, and a one-line summary that expands to the
		* full stored text — the same chrome `ui-chat` gives a Tool row and a Reasoning row. The
		* model's reply text stays a plain body, like an assistant message in the conversation,
		* because it is the reply rather than a step of the work. A settled trace opens under a
		* turn-process header (已完成 / 已停止 / 已失败) that folds the whole stream, mirroring the
		* conversation's Turn process header.
		*
		* Nothing here redacts or truncates. Both happened on the Host, before the entry was stored
		* or sent: a client-side filter would leave the raw argument in the wire payload, which is
		* the one place it must not be.
		* @module dsh-workbench/client/skill-card/ActivityTrace
		*/
		/** How often the local 用时 clock re-reads the wall clock. */
		var ELAPSED_TICK_MS = 1e3;
		/**
		* Format one duration as a clock reading.
		*
		* Hours are dropped while the run is under one: a card run that is still going is measured
		* in minutes, and a fixed `00:00:07` puts two leading zeros in front of the only digits
		* that matter.
		* @param milliseconds - elapsed time; negative values read as zero.
		* @returns `mm:ss`, or `h:mm:ss` once an hour has passed.
		*/
		function elapsedText(milliseconds) {
			const total = Math.max(0, Math.floor(milliseconds / 1e3));
			const seconds = String(total % 60).padStart(2, "0");
			const minutes = Math.floor(total / 60) % 60;
			const hours = Math.floor(total / 3600);
			if (hours === 0) return `${String(minutes).padStart(2, "0")}:${seconds}`;
			return `${String(hours)}:${String(minutes).padStart(2, "0")}:${seconds}`;
		}
		/**
		* Track how long ago a run started, on a local timer.
		*
		* The interval exists so the reading advances even when no poll lands: a run whose Host has
		* stopped answering still shows its own elapsed time, and a second of silence does not look
		* like a stopped clock. `startedAt` absent means there is no run to measure.
		* @param startedAt - start of the run, milliseconds since the epoch.
		* @returns elapsed milliseconds, recomputed once per second.
		*/
		function useElapsedMs(startedAt) {
			const [now, setNow] = (0, react.useState)(() => Date.now());
			(0, react.useEffect)(() => {
				if (startedAt === void 0) return;
				setNow(Date.now());
				const timer = setInterval(() => {
					setNow(Date.now());
				}, ELAPSED_TICK_MS);
				return () => {
					clearInterval(timer);
				};
			}, [startedAt]);
			return startedAt === void 0 ? 0 : Math.max(0, now - startedAt);
		}
		/**
		* The leading icon for one tool activity, by the same categories the conversation uses.
		*
		* The mapping is name-based and open-ended: unknown tools get the generic sparkle, the
		* same fallback `ui-chat` gives to uncategorized calls.
		* @param tool - the wire tool name.
		* @returns the 14px glyph for the category, or the generic tool glyph.
		*/
		function toolIcon(tool) {
			if (tool === "read") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconBrowseOutlineRegular, { size: 14 });
			if (tool === "read_image") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconBrowseOutlineRegular, { size: 14 });
			if (tool === "grep" || tool === "glob" || tool.endsWith("_inspect")) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconSearchOutlineRegular, { size: 14 });
			if (tool === "write") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconEditOutlineRegular, { size: 14 });
			if (tool === "edit" || tool === "apply_patch") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconEditOutlineRegular, { size: 14 });
			if (tool === "bash" || tool === "pwsh" || tool === "exec_command" || tool === "write_stdin" || tool.startsWith("terminal_")) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconApiOutlineRegular, { size: 14 });
			if (tool === "run_code") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCodeOutlineRegular, { size: 14 });
			if (tool === "web_search") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconGlobeOutlineRegular, { size: 14 });
			if (tool === "web_fetch") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconBrowseOutlineRegular, { size: 14 });
			if (tool === "subagent" || tool.startsWith("subagent_")) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconAgentPresetOutlineRegular, { size: 14 });
			if (tool === "todo_write" || tool === "create_goal" || tool === "update_goal" || tool === "get_goal") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconPlanOutlineRegular, { size: 14 });
			if (tool === "ask_user_question" || tool === "request_user_input") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconQuestionOutlineRegular, { size: 14 });
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconSparkleRegular, { size: 14 });
		}
		/**
		* The first line of a span, for the collapsed summary of a row.
		*
		* The stored trace does not carry a streaming flag, so the summary is the plain first line
		* in every state: a collapsed row previews the span's opening, and the full text is one
		* click away.
		* @param text - the full span.
		* @returns its first line.
		*/
		function firstLine(text) {
			const newline = text.indexOf("\n");
			return newline === -1 ? text : text.slice(0, newline);
		}
		/**
		* The entries the fold shows and counts.
		*
		* The schema-emission call is not a step of the visible work (see
		* {@link WORKBENCH_ACTIVITY_STRUCTURED_OUTPUT_TOOL}). It is skipped on read as well as on
		* record, so a trace stored before the builder filtered it stops showing — and stops
		* counting, which is why the fold is counted from this list rather than from the stored one.
		* @param trace - entries as the Host recorded them.
		* @returns the entries a reader is meant to see.
		*/
		function visibleTrace(trace) {
			return trace.filter((entry) => !(entry.kind === "tool" && entry.tool === "structured_output"));
		}
		/**
		* The control that folds a settled run's steps.
		*
		* Separate from the list it folds because the two sit in different places: the control is
		* one more thing on the line of controls under the result, where the reader is deciding what
		* to do next, and the steps open under that line when asked for.
		* @param props - the entries, the verdict, the fold state, the toggle, and the translator.
		* @returns the control.
		*/
		function RunTraceToggle({ trace, settled, open, onToggle, t }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(TurnProcessHeader, {
				stopReason: settled.stopReason,
				failed: settled.failure !== void 0,
				steps: visibleTrace(trace).length,
				open,
				onToggle,
				t
			});
		}
		/**
		* Render one activity trace as an ordered list of disclosure rows.
		*
		* One row per entry, oldest first, in the order the child produced them: a tool call
		* (category icon, tool name, one-line argument summary, full argument on expand; already
		* redacted and already cut on the Host, with the ellipsis that says so), the model's own
		* reasoning (think icon, one-line summary, full text on expand), its reply text as a plain
		* body, and the truncation marker as a row of its own, because a bounded trace that stayed
		* silent would read as a complete one.
		* @param props - the entries and the translator.
		* @returns the list.
		*/
		function RunTraceList({ trace, t }) {
			const visible = visibleTrace(trace);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ol", {
				className: skill_card_module_default.activityList,
				"data-run-trace-body": "",
				children: visible.map((entry, index) => {
					if (entry.kind === "tool") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("li", {
						className: skill_card_module_default.activityItem,
						"data-activity-kind": "tool",
						"data-activity-tool": entry.tool,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ToolRow, {
							entry,
							t
						})
					}, `${String(index)}-tool`);
					if (entry.kind === "truncated") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("li", {
						className: skill_card_module_default.activityItem,
						"data-activity-kind": "truncated",
						"data-activity-dropped": String(entry.dropped),
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: skill_card_module_default.activityTruncated,
							children: t("runActivityTruncated", { dropped: entry.dropped })
						})
					}, `${String(index)}-truncated`);
					return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("li", {
						className: skill_card_module_default.activityItem,
						"data-activity-kind": entry.kind,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(NarrationRow, {
							entry,
							t
						})
					}, `${String(index)}-${entry.kind}`);
				})
			});
		}
		/**
		* Render a trace with its fold: the control, and the steps under it when it is open.
		*
		* The running notice's shape, and the one the result page used before its control moved onto
		* the line of controls under the result.
		* @param props - the entries, the optional settled header, and the translator.
		* @returns the list.
		*/
		function ActivityTrace({ trace, settled, t }) {
			const [folded, setFolded] = (0, react.useState)(settled !== void 0);
			const open = !folded;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: skill_card_module_default.runTraceList,
				"data-run-activity": "",
				children: [settled === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(RunTraceToggle, {
					trace,
					settled,
					open,
					onToggle: () => {
						setFolded((value) => !value);
					},
					t
				}), open ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(RunTraceList, {
					trace,
					t
				}) : null]
			});
		}
		/**
		* Render the settled turn-process header above the trace.
		*
		* Reads like the conversation's Turn process row — a dot, the outcome word, how many steps
		* the fold holds, and a chevron that folds the whole stream — but sized to its own text
		* rather than to the page, because nothing else is on that line and a full-width bar put the
		* chevron where no one could connect it to the words. Duration is deliberately absent: the
		* stored record has no start time, and a fabricated reading would be worse than none.
		* @param props - the outcome, fold state, toggle, and translator.
		* @returns the header button.
		*/
		function TurnProcessHeader({ stopReason, failed, steps, open, onToggle, t }) {
			const label = failed ? t("runActivityFailed") : stopReason === "aborted" ? t("runActivityStopped") : stopReason === "error" || stopReason === "failed" ? t("runActivityFailed") : t("runActivityCompleted");
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
				type: "button",
				className: skill_card_module_default.turnProcess,
				"data-run-trace": "",
				"data-turn-process": failed ? "failed" : stopReason,
				"data-open": open || void 0,
				"aria-expanded": open,
				onClick: onToggle,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: skill_card_module_default.turnProcessDot,
						"aria-hidden": true
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: skill_card_module_default.turnProcessLabel,
						children: label
					}),
					steps === 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: skill_card_module_default.turnProcessSteps,
						children: `· ${t("runActivitySteps", { count: steps })}`
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronDownOutlineRegular, { className: skill_card_module_default.turnProcessChevron })
				]
			});
		}
		/**
		* One tool call as a disclosure row, matching the conversation's Tool row.
		*
		* Collapsed: category icon, tool name, and the first line of the argument. Expanded: the
		* whole stored argument under the 参数 label, so a long argument the Host already bounded
		* stays reachable without widening the row.
		* @param props - the entry and the translator.
		* @returns the tool disclosure.
		*/
		function ToolRow({ entry, t }) {
			const [expanded, setExpanded] = (0, react.useState)(false);
			const summary = firstLine(entry.argument);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: skill_card_module_default.activityToolRow,
				"data-activity-expanded": expanded ? "true" : void 0,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.DisclosureRow, {
					rowClassName: skill_card_module_default.activityRow,
					titleClassName: skill_card_module_default.activityTitle,
					icon: toolIcon(entry.tool),
					title: entry.tool,
					expandable: true,
					expandOnRowClick: true,
					open: expanded,
					onToggle: () => {
						setExpanded((value) => !value);
					},
					collapsedContent: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: skill_card_module_default.activitySep,
						"data-shimmer-decoration": true,
						"aria-hidden": true
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: skill_card_module_default.activitySummary,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.TextShimmer, { children: summary })
					})] }),
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: skill_card_module_default.activityBody,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: skill_card_module_default.activityBodyLabel,
							children: t("runActivityArgument")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: skill_card_module_default.activityBodyText,
							children: entry.argument
						})]
					})
				})
			});
		}
		/**
		* One span of the model's own words.
		*
		* Reasoning folds like the conversation's think row: think icon, one-line summary, full
		* text on expand. Reply text renders as a plain body — it is the model's answer, not a
		* step of the work, so it reads fully like an assistant message.
		* @param props - the entry and the translator.
		* @returns the reasoning disclosure or the plain reply body.
		*/
		function NarrationRow({ entry, t }) {
			const [expanded, setExpanded] = (0, react.useState)(false);
			if (entry.kind === "text") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				className: skill_card_module_default.activityNarration,
				children: entry.text
			});
			const summary = firstLine(entry.text);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: skill_card_module_default.activityReasoning,
				"data-activity-expanded": expanded ? "true" : void 0,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.DisclosureRow, {
					rowClassName: skill_card_module_default.activityRow,
					titleClassName: skill_card_module_default.activityTitle,
					icon: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconThinkOutlineRegular, { size: 14 }),
					title: t("runActivityReasoning"),
					expandable: true,
					expandOnRowClick: true,
					open: expanded,
					onToggle: () => {
						setExpanded((value) => !value);
					},
					collapsedContent: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: skill_card_module_default.activitySep,
						"data-shimmer-decoration": true,
						"aria-hidden": true
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: skill_card_module_default.activitySummary,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.TextShimmer, { children: summary })
					})] }),
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: skill_card_module_default.activityBody,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: skill_card_module_default.activityBodyText,
							children: entry.text
						})
					})
				})
			});
		}
		/**
		* Render the card's content while a run is in flight.
		*
		* The trace when there is one, and the card's own previous sentence when there is not: a run
		* whose first tool has not been called yet has nothing to list, and an empty list under a
		* running title would read as a broken stream.
		* @param props - the run and the translator.
		* @returns the notice.
		*/
		function RunningNotice({ run, t }) {
			const elapsed = useElapsedMs(run.startedAt);
			const trace = run.activity ?? [];
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: skill_card_module_default.notice,
				"data-run-stream": "",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("p", {
					className: skill_card_module_default.noticeTitle,
					children: [t("runStatusRunning"), run.startedAt === void 0 ? null : ` · ${t("runElapsed")} ${elapsedText(elapsed)}`]
				}), trace.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
					className: skill_card_module_default.noticeBody,
					children: t("skillCardRunningBody")
				}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ActivityTrace, {
					trace,
					t
				})]
			});
		}
		//#endregion
		//#region src/client/skill-card/SkillCard.tsx
		/**
		* The skill card: one HTML template the user wrote, filled with the value a child
		* agent produced.
		*
		* The card owns no frame. It hands the shared shell its presentation facts and
		* supplies its content through the shell's body slot.
		* @module dsh-workbench/client/skill-card/SkillCard
		*/
		/** Identity of the one skill card. */
		var SKILL_CARD_ID = "skill-card";
		/**
		* Read the title one card face shows.
		*
		* Kept next to the face that applies it, because an action declaration addresses a
		* card by the name the user sees: resolving that name has to fall back exactly the
		* same way, or a declaration pointing at a nameless card would never resolve.
		* @param stored - the stored card record.
		* @param stored.cardId - the card's identity.
		* @param stored.name - the user's name for it, when one is stored.
		* @param t - translator, for the default card's own label.
		* @returns the visible title.
		*/
		function cardFaceTitle(stored, t) {
			return stored.name ?? (stored.cardId === "skill-card" ? t("skillCardTitle") : stored.cardId);
		}
		/**
		* Where one card stands, as the face's status dot reports it.
		*
		* A run in flight outranks everything: the card is working, whatever its last record says.
		* With nothing running, the newest stored run is the verdict — and a run that ended
		* without usable content is an error rather than a success, which is the distinction the
		* record's own `failure` carries (see `run-timeout`).
		* @param view - what the card currently shows.
		* @returns the state the shared shell paints.
		*/
		function cardFaceStanding(view) {
			if (view.run?.phase === "running") return "ongoing";
			const latest = view.runs[0];
			if (latest === void 0) return "idle";
			return latest.failure === void 0 ? "done" : "error";
		}
		/**
		* Render the skill card.
		* @param props - owner props, shell render share, transport, session lookup, and `t`.
		* @returns the card element.
		*/
		function SkillCard(props) {
			const { t, api, runSessionId, openCard, renderFactorySlot, visibleIds, cardId, onCardsChanged } = props;
			const reorder = useWorkbenchReorder();
			const { view, actions } = useSkillCard({
				api,
				cardId,
				session: runSessionId
			});
			const actionsSlot = (0, react.useMemo)(() => () => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: skill_card_module_default.cardActions,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(CardRunButton, {
					cardId,
					view,
					actions,
					t
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
					variant: "ghost",
					size: "sm",
					onClick: () => {
						openCard(cardId, "config");
					},
					children: t("skillCardSettings")
				})]
			}), [
				actions,
				cardId,
				openCard,
				t,
				view
			]);
			const latest = view.runs[0];
			const result = view.result;
			const headline = (0, react.useMemo)(() => result === void 0 ? void 0 : resultHeadline(resultHtml(result) ?? ""), [result]);
			const bodySlot = (0, react.useMemo)(() => () => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: skill_card_module_default.faceBody,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
					className: skill_card_module_default.faceSummary,
					"data-face-summary": headline === void 0 ? "empty" : "text",
					children: headline ?? t("skillCardNotRunBody")
				}), latest === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
					className: skill_card_module_default.faceFoot,
					children: t("runHistoryCount", { count: view.runs.length })
				})]
			}), [
				headline,
				latest,
				t,
				view.runs.length
			]);
			const state = cardFaceStanding(view);
			const statusText = state === "ongoing" ? t("statusOngoing") : latest === void 0 ? t("skillCardNotRunTitle") : latestRunText(latest.executedAt);
			return renderFactorySlot("workbench.card", {
				id: cardId,
				title: cardFaceTitle({
					cardId,
					name: view.name
				}, t),
				...view.skill === void 0 ? {} : { subtitle: view.skill },
				state,
				status: statusText,
				...view.problem === void 0 ? {} : { failure: t(problemKey(view.problem.code)) },
				onActivate: () => {
					openCard(cardId, "runs");
				},
				onRemove: () => {
					actions.remove().then(onCardsChanged);
				},
				reorderable: reorder?.reorderable ?? false,
				position: Math.max(1, visibleIds.indexOf(cardId) + 1),
				total: Math.max(1, visibleIds.length)
			}, { slots: {
				actions: actionsSlot,
				body: bodySlot
			} });
		}
		/**
		* Render the card's content.
		*
		* The permission note is not here: the result page carries it as a footnote beneath
		* everything, because it is a statement about the page rather than part of the document
		* the card renders.
		* @param props - the view, `t`, and the click outlet.
		* @returns the body element.
		*/
		function SkillCardBody({ view, cardId, t, onAction, documents }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: skill_card_module_default.body,
				children: cardContent(view, cardId, t, onAction, documents)
			});
		}
		/**
		* Render whichever content the card currently has.
		* @param view - the card view.
		* @param cardId - the card the body belongs to.
		* @param t - translator.
		* @param onAction - click outlet for buttons the document carries.
		* @param documents - binding factory for the rendered document's own script.
		* @returns the content element.
		*/
		function cardContent(view, cardId, t, onAction, documents) {
			if (view.status === "loading") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Notice, {
				title: t("skillCardLoading"),
				body: t("skillCardLoadingBody")
			});
			if (view.template === void 0) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Notice, {
				title: t("skillCardNoTemplateTitle"),
				body: t("skillCardNoTemplateBody")
			});
			const subjectIsTheRun = view.run?.startedAt === void 0 || view.runId === void 0 || view.result === void 0 || view.result?.runId === String(view.run.startedAt);
			if (view.run?.phase === "running" && view.refining !== true && subjectIsTheRun) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(RunningNotice, {
				run: view.run,
				t
			});
			const sameRun = view.result !== void 0 && view.run?.result?.runId === view.result.runId;
			const failure = view.result?.failure ?? (sameRun ? view.run?.failure : void 0);
			const failureCode = view.result?.failureCode ?? (sameRun ? view.run?.failureCode : void 0);
			if (view.result === void 0) return failure === void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Notice, {
				title: t("skillCardNotRunTitle"),
				body: t("skillCardNotRunBody")
			}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Notice, {
				title: failureTitle(failureCode, t),
				body: failure
			});
			const filled = resultHtml(view.result.structured);
			if (filled === void 0) {
				if (failure !== void 0) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Notice, {
					title: failureTitle(failureCode, t),
					body: failure
				});
				return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Notice, {
					title: t("skillCardNotRunTitle"),
					body: t("skillCardNotRunBody")
				});
			}
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ShadowHtml, {
				html: filledTemplate(view.template, filled),
				className: skill_card_module_default.template,
				onAction,
				cardId,
				runId: view.result.runId,
				documents
			});
		}
		/**
		* Choose the heading of a card that has no content to show because a run failed.
		*
		* A deadline gets its own words: it is not a fault and saying "failed" would send the user
		* looking for one. Any other code reads as the plain failure it is.
		* @param code - the failure code stored on the record, when one was stored.
		* @param t - translator.
		* @returns the heading.
		*/
		function failureTitle(code, t) {
			return code === "run-timeout" ? t("skillCardResultTimeoutTitle") : t("skillCardResultFailedTitle");
		}
		/** One empty-state block. */
		function Notice({ title, body }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: skill_card_module_default.notice,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
					className: skill_card_module_default.noticeTitle,
					children: title
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
					className: skill_card_module_default.noticeBody,
					children: body
				})]
			});
		}
		/**
		* Choose the status line for a higher-priority fact.
		* @param code - the failure code.
		* @returns the locale key. Exhaustive over the code union.
		*/
		function problemKey(code) {
			return PROBLEM_KEYS[code];
		}
		/**
		* Locale key for every failure the card can report.
		*
		* A record rather than a lookup with a fallback, so a new failure code fails
		* compilation here until it has copy.
		*/
		var PROBLEM_KEYS = {
			"not-configured": "skillCardProblemNotConfigured",
			"template-missing": "skillCardProblemNoTemplate",
			"session-not-live": "skillCardProblemNoSession",
			"skill-not-found": "skillCardProblemSkillMissing",
			"provider-unavailable": "skillCardProblemProvider",
			"model-unavailable": "skillCardProblemModelUnavailable",
			"schema-rejected": "skillCardProblemContract",
			"template-invalid": "skillCardProblemTemplateInvalid",
			"run-in-progress": "skillCardProblemRunning",
			"run-failed": "skillCardProblemRunFailed",
			"run-timeout": "skillCardProblemRunTimeout",
			"run-unavailable": "skillCardProblemRunUnavailable",
			"workspace-missing": "skillCardProblemWorkspaceMissing",
			"workspace-invalid": "skillCardProblemWorkspaceInvalid",
			"permission-unavailable": "skillCardProblemPermissionUnavailable",
			"instruction-missing": "skillCardProblemInstructionMissing",
			"too-large": "skillCardProblemTooLarge",
			"unavailable": "skillCardProblemUnavailable",
			"unauthorized": "skillCardProblemGeneric",
			"forbidden": "skillCardProblemGeneric",
			"invalid-request": "skillCardProblemGeneric",
			"conflict": "skillCardProblemGeneric",
			"not-found": "skillCardProblemGeneric",
			"storage-failure": "skillCardProblemGeneric",
			"catalog-failed": "skillCardProblemGeneric"
		};
		//#endregion
		//#region src/client/skill-card/picker-session.ts
		/**
		* Track the session the main view holds.
		*
		* The held answer wins while it exists, so a session the user opened after the panel
		* appeared is still found; the remembered one answers while the panel has the main column
		* to itself. An addressed subagent is never a picker session: those sessions expose no
		* model selection of their own.
		* @param list - the client session list.
		* @returns the tracker.
		*/
		function createPickerSession(list) {
			let remembered;
			const held = () => {
				const snapshot = list.getSnapshot();
				for (const id of snapshot.ids) {
					const row = snapshot.byId[id];
					if (row === void 0 || row.origin === "subagent") continue;
					if ((row.retainedBy?.mainView ?? 0) > 0) return id;
				}
			};
			const observe = () => {
				const current = held();
				if (current !== void 0) remembered = current;
			};
			observe();
			list.subscribe(observe);
			return { current: () => held() ?? remembered };
		}
		//#endregion
		//#region src/client/skill-card/documents.ts
		/**
		* The binding a card document's own script receives, and the one read it exists for.
		*
		* A template is the user's HTML, and its script is the user's code: that code runs when the
		* card renders. What it cannot do is reach the filesystem, because a page has no such API —
		* so the two questions a document reader asks ("what is in this directory", "what does this
		* file say") are answered through the Host's document route, and the Markdown those files
		* hold is rendered with the application's own renderer.
		*
		* Both halves are deliberately small: three functions a template author can learn from one
		* example, and no general bridge to the page or the Host.
		* @module dsh-workbench/client/skill-card/documents
		*/
		/**
		* One failure a document read reported, as the script sees it.
		*
		* An Error rather than a result object, because the script that asks is ordinary code writing
		* `try`/`catch`: a rejection it can catch is the shape it already knows.
		*/
		var WorkbenchDocumentError = class extends Error {
			code;
			/**
			* @param code - the route's failure code.
			* @param message - the sentence to show.
			*/
			constructor(code, message) {
				super(message);
				this.code = code;
				this.name = "WorkbenchDocumentError";
			}
		};
		/**
		* Build the binder the renderer hands each document's script.
		* @param options - translator and transport seam.
		* @returns the binder.
		*/
		function createWorkbenchDocumentBinder(options) {
			const fetcher = options.fetcher ?? ((input, init) => globalThis.fetch(input, init));
			const t = options.t;
			const labels = markdownLabels(t);
			return (input) => {
				const files = {
					list: async (path) => await requestListing(fetcher, input.cardId, path, t),
					read: async (path) => await requestText(fetcher, input.cardId, path, t)
				};
				return {
					cardId: input.cardId,
					...input.runId === void 0 ? {} : { runId: input.runId },
					root: input.root,
					host: input.host,
					files,
					markdown: { render: async (element, text) => {
						renderMarkdown(element, text, labels);
					} }
				};
			};
		}
		/**
		* Ask the Host for one directory listing.
		* @param fetcher - transport.
		* @param cardId - the card whose workspace is being read.
		* @param path - path within it, empty for the workspace itself.
		* @param t - translator, for a failure sentence.
		* @returns the listing.
		* @throws {WorkbenchDocumentError} when the route refuses or cannot answer.
		*/
		async function requestListing(fetcher, cardId, path, t) {
			const listing = parseListing(await requestDocument(fetcher, cardId, path, t));
			if (listing === void 0) throw new WorkbenchDocumentError("unreachable", t("documentProblemUnreadable"));
			return listing;
		}
		/**
		* Ask the Host for one file's text.
		* @param fetcher - transport.
		* @param cardId - the card whose workspace is being read.
		* @param path - the file's path within it.
		* @param t - translator, for a failure sentence.
		* @returns the text and size.
		* @throws {WorkbenchDocumentError} when the route refuses or cannot answer.
		*/
		async function requestText(fetcher, cardId, path, t) {
			const file = parseText(await requestDocument(fetcher, cardId, path, t));
			if (file === void 0) throw new WorkbenchDocumentError("unreachable", t("documentProblemUnreadable"));
			return file;
		}
		/**
		* Send one document request and return its decoded body.
		* @param fetcher - transport.
		* @param cardId - the card whose workspace is being read.
		* @param path - the path to read.
		* @param t - translator, for a failure sentence.
		* @returns the decoded body.
		* @throws {WorkbenchDocumentError} for a refused or unreadable answer.
		*/
		async function requestDocument(fetcher, cardId, path, t) {
			const query = `?cardId=${encodeURIComponent(cardId)}&path=${encodeURIComponent(path)}`;
			let response;
			try {
				response = await fetcher(`${WORKBENCH_SKILL_CARD_FILES_PATH}${query}`, {
					method: "GET",
					credentials: "same-origin",
					redirect: "error",
					cache: "no-store",
					headers: { "Accept": "application/json" }
				});
			} catch (error) {
				throw new WorkbenchDocumentError("unreachable", `${t("documentProblemUnreachable")}${error instanceof Error ? ` · ${error.message}` : ""}`);
			}
			const body = await readJson(response);
			if (response.ok) return body;
			const failure = failureOf(body);
			const code = failure?.code;
			const key = code === void 0 || !(code in ERROR_KEYS) ? "documentProblemUnreachable" : ERROR_KEYS[code];
			throw new WorkbenchDocumentError(code ?? "unreachable", key === void 0 ? t("documentProblemUnreachable") : failure?.message === void 0 ? t(key) : `${t(key)} · ${failure.message}`);
		}
		/**
		* Locale key for every failure the document route reports.
		*
		* A record rather than a lookup with a fallback, so a code added to the wire fails compilation
		* here until it has copy.
		*/
		var ERROR_KEYS = {
			"unauthorized": "documentProblemForbidden",
			"forbidden": "documentProblemForbidden",
			"invalid-request": "documentProblemPath",
			"invalid-card": "documentProblemCard",
			"no-workspace": "documentProblemNoWorkspace",
			"outside-workspace": "documentProblemOutside",
			"not-found": "documentProblemNotFound",
			"not-directory": "documentProblemNotDirectory",
			"not-file": "documentProblemNotFile",
			"not-text": "documentProblemNotText",
			"too-large": "documentProblemTooLarge"
		};
		/**
		* Read one response body as JSON.
		* @param response - the response.
		* @returns the decoded value, or undefined when it is not JSON.
		*/
		async function readJson(response) {
			try {
				return await response.json();
			} catch {
				return;
			}
		}
		/**
		* Read the error fields of one body.
		* @param body - the decoded body.
		* @returns the code and message, or undefined when the body is not an error.
		*/
		function failureOf(body) {
			if (typeof body !== "object" || body === null) return void 0;
			const error = body.error;
			if (typeof error !== "object" || error === null) return void 0;
			const fields = error;
			return {
				...typeof fields.code === "string" ? { code: fields.code } : {},
				...typeof fields.message === "string" ? { message: fields.message } : {}
			};
		}
		/**
		* Validate one listing body.
		* @param value - the decoded body.
		* @returns the listing, or undefined when a field is outside the contract.
		*/
		function parseListing(value) {
			if (typeof value !== "object" || value === null) return void 0;
			const body = value;
			if (body.apiVersion !== 1 || body.kind !== "directory") return void 0;
			if (typeof body.path !== "string" || !Array.isArray(body.entries)) return void 0;
			if (typeof body.truncated !== "boolean") return void 0;
			const entries = [];
			for (const raw of body.entries) {
				if (typeof raw !== "object" || raw === null) return void 0;
				const entry = raw;
				if (typeof entry.name !== "string" || typeof entry.path !== "string") return void 0;
				if (entry.type !== "directory" && entry.type !== "file" && entry.type !== "other") return void 0;
				if (entry.size !== void 0 && typeof entry.size !== "number") return void 0;
				entries.push({
					name: entry.name,
					path: entry.path,
					type: entry.type,
					...entry.size === void 0 ? {} : { size: entry.size }
				});
			}
			return {
				path: body.path,
				entries,
				truncated: body.truncated
			};
		}
		/**
		* Validate one file body.
		* @param value - the decoded body.
		* @returns the file, or undefined when a field is outside the contract.
		*/
		function parseText(value) {
			if (typeof value !== "object" || value === null) return void 0;
			const body = value;
			if (body.apiVersion !== 1 || body.kind !== "file") return void 0;
			if (typeof body.path !== "string" || typeof body.text !== "string") return void 0;
			if (typeof body.bytes !== "number") return void 0;
			return {
				path: body.path,
				text: body.text,
				bytes: body.bytes
			};
		}
		/** Copy the application's Markdown chrome needs, built once per translator. */
		var LABEL_CACHE = /* @__PURE__ */ new WeakMap();
		/**
		* The Markdown chrome labels for one translator.
		* @param t - translator.
		* @returns reference-stable labels, which the renderer caches by identity.
		*/
		function markdownLabels(t) {
			const cached = LABEL_CACHE.get(t);
			if (cached !== void 0) return cached;
			const labels = {
				code: {
					copyLabel: t("documentCopy"),
					copiedLabel: t("documentCopied")
				},
				footnotes: t("documentFootnotes")
			};
			LABEL_CACHE.set(t, labels);
			return labels;
		}
		/** React roots already mounted for one element of a rendered document. */
		var MOUNTED = /* @__PURE__ */ new WeakMap();
		/**
		* Render one Markdown document into an element of a card's own tree.
		*
		* The application's Markdown stylesheet is compiled against elements in the light DOM, so the
		* text is rendered inside a shadow root of its own and that root adopts the page's stylesheets:
		* the document then reads exactly as the assistant's messages do, while the containing card's
		* own CSS stays outside it. A page whose stylesheets cannot be read (an engine without
		* constructable stylesheets) still shows the document, unstyled rather than not at all.
		* @param element - the element to fill; it is emptied of the previous document.
		* @param text - the Markdown source.
		* @param labels - localized chrome.
		*/
		function renderMarkdown(element, text, labels) {
			if (_deepseek_ai_dsh_client_ui_primitives.MarkdownText === void 0 || _deepseek_ai_dsh_client_ui_primitives.MarkdownText === null) {
				element.textContent = text;
				return;
			}
			const inner = element.shadowRoot ?? element.attachShadow({ mode: "open" });
			adoptApplicationStyles(inner);
			let mount = inner.querySelector("[data-workbench-markdown]");
			if (!(mount instanceof HTMLElement)) {
				mount = document.createElement("div");
				mount.setAttribute("data-workbench-markdown", "");
				inner.append(mount);
			}
			const root = MOUNTED.get(mount) ?? (0, react_dom_client.createRoot)(mount);
			MOUNTED.set(mount, root);
			root.render((0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.MarkdownText, {
				text,
				labels
			}));
		}
		/** The page's stylesheets, compiled once and shared by every rendered document. */
		var applicationSheet;
		/**
		* Adopt the page's stylesheets into one shadow root.
		*
		* Copied once into one constructed sheet rather than per document: the sheet object is shared,
		* so the copy and the parse happen on the first document a card renders. A stylesheet the
		* browser will not let this origin read (a cross-origin link) is skipped rather than failing
		* the render, because the Markdown still has to appear.
		* @param root - the shadow root to style.
		*/
		function adoptApplicationStyles(root) {
			const current = root.adoptedStyleSheets;
			if (current === void 0 || current.length > 0) return;
			const sheet = applicationStyles();
			if (sheet === void 0) return;
			root.adoptedStyleSheets = [sheet];
		}
		/**
		* Build the shared sheet from the page's own CSS.
		* @returns the sheet, or undefined when the page's styles cannot be read here.
		*/
		function applicationStyles() {
			if (applicationSheet !== void 0) return applicationSheet;
			if (typeof CSSStyleSheet !== "function" || !("replaceSync" in CSSStyleSheet.prototype)) return void 0;
			const parts = [];
			for (const sheet of [...document.styleSheets]) try {
				for (const rule of [...sheet.cssRules]) parts.push(rule.cssText);
			} catch {}
			if (parts.length === 0) return void 0;
			const constructed = new CSSStyleSheet();
			constructed.replaceSync(parts.join("\n"));
			applicationSheet = constructed;
			return constructed;
		}
		//#endregion
		//#region src/client/skill-card/session.ts
		/**
		* Pick the session a card's catalog read should go through.
		*
		* A session the main view still holds wins, because that is the one the user is
		* working in. The rest are ranked by recency.
		*
		* A blank session is an ordinary candidate. "Blank" means no messages yet, which
		* says nothing about whether the catalog can be read through it: a freshly opened session
		* has a live agent, and the Host answers a catalog read with the global layer when no
		* session can supply a scope. The picker must not pre-empt that judgement, because
		* excluding blank sessions leaves a first-run user with no candidate at all.
		* @param ids - session list order.
		* @param byId - rows addressed by id.
		* @returns the chosen session id, or undefined when none qualifies.
		*/
		function pickRunSession(ids, byId) {
			let best;
			let bestRank = -1;
			let bestAt = Number.NEGATIVE_INFINITY;
			for (const id of ids) {
				const row = byId[id];
				if (row === void 0 || row.origin === "subagent") continue;
				const rank = (row.retainedBy?.mainView ?? 0) > 0 ? 1 : 0;
				if (best !== void 0 && (rank < bestRank || rank === bestRank && row.updatedAt <= bestAt)) continue;
				best = id;
				bestRank = rank;
				bestAt = row.updatedAt;
			}
			return best;
		}
		//#endregion
		//#region src/client/layout-store.ts
		/**
		* Workbench layout store and the pure ordering rules it applies.
		*
		* The store owns viewing state only: which order the user arranged and which
		* card is mid-drag. The durable copy lives on the Host, so the store never
		* persists and never talks to the network — the controller in `index.ts` reads
		* it and sends the patches it produces.
		* @module dsh-workbench/client/layout-store
		*/
		/**
		* Merge the ledger's default order with the user's arrangement.
		*
		* Arranged cards keep their stored position. A card with no record is placed
		* against the default order rather than appended: it lands immediately after
		* the last already-placed card that the ledger declares before it. That keeps
		* a freshly installed card near the position its author declared instead of at
		* the end.
		* @param cards - card facts from the slot ledger.
		* @param layout - stored arrangement.
		* @returns card ids in display order.
		*/
		function resolveWorkbenchOrder(cards, layout) {
			const byDefault = [...cards].sort((left, right) => left.order - right.order || (left.id < right.id ? -1 : left.id > right.id ? 1 : 0));
			const defaultIndex = new Map(byDefault.map((card, index) => [card.id, index]));
			const arranged = [];
			const unarranged = [];
			for (const card of byDefault) if (layout.get(card.id)?.position === void 0) unarranged.push(card.id);
			else arranged.push(card.id);
			arranged.sort((left, right) => (layout.get(left)?.position ?? 0) - (layout.get(right)?.position ?? 0) || (defaultIndex.get(left) ?? 0) - (defaultIndex.get(right) ?? 0));
			const visible = [];
			let placed = 0;
			for (const id of unarranged) {
				const index = defaultIndex.get(id) ?? 0;
				while (placed < arranged.length && (defaultIndex.get(arranged[placed]) ?? 0) < index) {
					visible.push(arranged[placed]);
					placed += 1;
				}
				visible.push(id);
			}
			while (placed < arranged.length) {
				visible.push(arranged[placed]);
				placed += 1;
			}
			return { visible };
		}
		/**
		* Order records so the stored positions match one display sequence.
		* @param visible - visible card ids in display order.
		* @returns patch entries with fresh, widely spaced positions.
		*/
		function renumberEntries(visible) {
			return visible.map((id, index) => ({
				id,
				position: WORKBENCH_POSITION_BASE * 2 ** index
			}));
		}
		/**
		* Plan a move of one visible card to another index.
		*
		* A move between two neighbours uses the midpoint of their positions, which
		* touches exactly one record. When that midpoint would sit closer than
		* {@link WORKBENCH_POSITION_EPSILON} to a neighbour, the whole visible
		* sequence is renumbered in the same patch instead.
		* @param visible - current visible order.
		* @param layout - current arrangement.
		* @param id - card being moved.
		* @param toIndex - target index within the visible order.
		* @returns the patch entries plus the resulting visible order.
		*/
		function planWorkbenchMove(visible, layout, id, toIndex) {
			if (visible.indexOf(id) === -1) return {
				entries: [],
				visible
			};
			const rest = visible.filter((candidate) => candidate !== id);
			const bounded = Math.max(0, Math.min(toIndex, rest.length));
			const next = [
				...rest.slice(0, bounded),
				id,
				...rest.slice(bounded)
			];
			if (next.join("\0") === visible.join("\0")) return {
				entries: [],
				visible
			};
			const before = bounded === 0 ? void 0 : rest[bounded - 1];
			const after = bounded >= rest.length ? void 0 : rest[bounded];
			const lower = before === void 0 ? void 0 : layout.get(before)?.position;
			const upper = after === void 0 ? void 0 : layout.get(after)?.position;
			if (!(lower !== void 0 || upper !== void 0)) return {
				entries: [{
					id,
					position: WORKBENCH_POSITION_BASE
				}],
				visible: next
			};
			if (lower === void 0 || upper === void 0) {
				const anchor = lower ?? upper;
				return {
					entries: [{
						id,
						position: Math.max(0, lower === void 0 ? anchor - WORKBENCH_POSITION_BASE / 2 : anchor + WORKBENCH_POSITION_BASE)
					}],
					visible: next
				};
			}
			if (upper - lower < 2e-6) return {
				entries: renumberEntries(next),
				visible: next
			};
			return {
				entries: [{
					id,
					position: (lower + upper) / 2
				}],
				visible: next
			};
		}
		/**
		* Project a Host snapshot onto a layout map.
		*
		* A stored document that still carries a removed field (for example a `hidden`
		* left by an older build) is read as a plain record, so the card comes back
		* visible; there is no migration step, the field is simply ignored.
		* @param snapshot - snapshot returned by the layout route.
		* @returns records keyed by card id.
		*/
		function layoutFromSnapshot(snapshot) {
			const layout = /* @__PURE__ */ new Map();
			for (const entry of snapshot.entries) layout.set(entry.id, { ...entry.position === void 0 ? {} : { position: entry.position } });
			return layout;
		}
		(0, _deepseek_ai_dsh_client_store.defineStore)({
			init: () => ({
				cards: [],
				layout: /* @__PURE__ */ new Map(),
				drag: null,
				write: { phase: "idle" },
				load: { phase: "loading" }
			}),
			actions: {
				setCards: (draft, cards) => {
					draft.cards = cards;
				},
				applySnapshot: (draft, snapshot) => {
					draft.layout = layoutFromSnapshot(snapshot);
				},
				setLayout: (draft, layout) => {
					draft.layout = layout;
				},
				beginDrag: (draft, id) => {
					draft.drag = {
						id,
						overIndex: -1
					};
				},
				updateDrag: (draft, overIndex) => {
					if (draft.drag !== null) draft.drag = {
						id: draft.drag.id,
						overIndex
					};
				},
				endDrag: (draft) => {
					draft.drag = null;
				},
				setWrite: (draft, status) => {
					draft.write = status;
				},
				setLoad: (draft, phase) => {
					draft.load = { phase };
				}
			}
		});
		//#endregion
		//#region src/client/layout-controller.ts
		/**
		* The workbench's layout controller: one place that owns the applied layout,
		* the optimistic updates, and the round trip to the Host.
		*
		* Keeping it out of the components leaves the page free of transport concerns
		* and lets a test drive ordering and failure handling without a DOM.
		* @module dsh-workbench/client/layout-controller
		*/
		var EMPTY_LAYOUT = {
			records: /* @__PURE__ */ new Map(),
			revision: ""
		};
		/**
		* Drive the layout of one workbench page.
		* @param cards - card facts from the slot ledger.
		* @param api - layout transport.
		* @param active - whether the workbench panel is currently selected.
		* @returns the view plus its operations.
		*/
		function useWorkbenchLayout(cards, api, active) {
			const [applied, setApplied] = (0, react.useState)(EMPTY_LAYOUT);
			const [draggingId, setDraggingId] = (0, react.useState)(null);
			const [load, setLoad] = (0, react.useState)("loading");
			const [write, setWrite] = (0, react.useState)({ phase: "idle" });
			const requested = (0, react.useRef)(false);
			const order = (0, react.useMemo)(() => resolveWorkbenchOrder(cards, applied.records), [cards, applied.records]);
			const refresh = (0, react.useCallback)(() => {
				api.read().then((result) => {
					if (result.status === "unavailable") {
						setLoad("unavailable");
						return;
					}
					setApplied({
						records: layoutFromSnapshot(result.snapshot),
						revision: result.snapshot.revision
					});
					setLoad("ready");
				});
			}, [api]);
			(0, react.useEffect)(() => {
				if (!active || requested.current) return;
				requested.current = true;
				refresh();
			}, [active, refresh]);
			const send = (0, react.useCallback)((entries, next) => {
				setWrite({ phase: "pending" });
				api.write({
					baseRevision: next.revision,
					entries
				}).then((result) => {
					if (result.status === "ok") {
						setApplied({
							records: layoutFromSnapshot(result.snapshot),
							revision: result.snapshot.revision
						});
						setWrite({ phase: "idle" });
						return;
					}
					if (result.status === "conflict") {
						setApplied({
							records: layoutFromSnapshot(result.snapshot),
							revision: result.snapshot.revision
						});
						setWrite({
							phase: "failed",
							message: "merged"
						});
						return;
					}
					setWrite({
						phase: "failed",
						message: result.reason
					});
				});
			}, [api]);
			const commit = (0, react.useCallback)((records, entries) => {
				const next = {
					records,
					revision: applied.revision
				};
				setApplied(next);
				send(entries, next);
			}, [applied.revision, send]);
			const reorder = (0, react.useCallback)((id, toIndex) => {
				const plan = planWorkbenchMove(order.visible, applied.records, id, toIndex);
				if (plan.entries.length === 0) return;
				const records = new Map(applied.records);
				for (const entry of plan.entries) records.set(entry.id, { ...entry.position === void 0 ? {} : { position: entry.position } });
				commit(records, plan.entries);
			}, [
				applied.records,
				commit,
				order.visible
			]);
			const moveBy = (0, react.useCallback)((id, delta) => {
				const from = order.visible.indexOf(id);
				if (from === -1) return;
				const to = Math.max(0, Math.min(from + delta, order.visible.length - 1));
				if (to !== from) reorder(id, to);
			}, [order.visible, reorder]);
			const reset = (0, react.useCallback)(() => {
				const ids = [...applied.records.keys()];
				if (ids.length === 0) return;
				commit(/* @__PURE__ */ new Map(), ids.map((id) => ({ id })));
			}, [applied.records, commit]);
			return {
				view: {
					visibleIds: order.visible,
					draggingId,
					load,
					write
				},
				actions: {
					reorder,
					moveBy,
					reset,
					refresh,
					setDragging: setDraggingId
				}
			};
		}
		//#endregion
		//#region src/client/WorkbenchCreateCard.tsx
		/**
		* The "create card" entry at the end of the card grid.
		*
		* It is a grid tile like any card, because creating one belongs where the cards
		* are. Choosing a type is the whole interaction: a card appears next to this tile
		* and the user configures it there, which keeps this entry a single decision rather
		* than a form.
		*
		* A type that is not implemented yet is still listed and is offered as disabled.
		* Hiding it would leave the user guessing whether the product has it at all.
		* @module dsh-workbench/client/WorkbenchCreateCard
		*/
		/**
		* Render the creation entry.
		* @param props - the types, the create callback, and localized labels.
		* @returns the tile.
		*/
		function WorkbenchCreateCard({ types, onCreate, label, unavailableLabel }) {
			const [menuOpen, setMenuOpen] = (0, react.useState)(false);
			const items = types.map((type) => ({
				id: type.id,
				label: type.enabled ? type.label : `${type.label} · ${unavailableLabel}`,
				disabled: !type.enabled
			}));
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: workbench_module_default.createRoot,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Menu, {
					open: menuOpen,
					items,
					onSelect: (id) => {
						setMenuOpen(false);
						onCreate(id);
					},
					onClose: () => {
						setMenuOpen(false);
					},
					anchor: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
						type: "button",
						className: workbench_module_default.createTile,
						"aria-haspopup": "menu",
						"aria-expanded": menuOpen,
						onClick: () => {
							setMenuOpen((previous) => !previous);
						},
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: workbench_module_default.createMark,
							"aria-hidden": "true",
							children: "＋"
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: label })]
					})
				})
			});
		}
		//#endregion
		//#region src/client/skill-card/permission.ts
		/**
		* Locale key for each mode's label.
		*
		* A record rather than a lookup with a fallback: a mode added to the contract fails
		* compilation here until both dictionaries have copy for it.
		*/
		var PERMISSION_LABEL_KEYS = {
			"read-only": "skillCardPermissionReadOnly",
			"workspace-write": "skillCardPermissionWorkspaceWrite",
			"danger-full-access": "skillCardPermissionFullAccess"
		};
		/**
		* Read the locale key naming one permission mode.
		* @param mode - the mode to name.
		* @returns the dictionary key holding its label.
		*/
		function permissionLabelKey(mode) {
			return PERMISSION_LABEL_KEYS[mode];
		}
		/**
		* Locale key for each instruction mode's label.
		*
		* Exhaustive for the same reason as the permissions above: a mode added to the contract
		* fails compilation here until both dictionaries name it.
		*/
		var INSTRUCTION_LABEL_KEYS = {
			none: "skillCardInstructionNone",
			optional: "skillCardInstructionOptional",
			required: "skillCardInstructionRequired"
		};
		/**
		* Read the locale key naming one instruction mode.
		* @param mode - the mode to name.
		* @returns the dictionary key holding its label.
		*/
		function instructionLabelKey(mode) {
			return INSTRUCTION_LABEL_KEYS[mode];
		}
		/**
		* Count the line a character offset falls on.
		* @param text - the text.
		* @param offset - a character offset within it.
		* @returns the zero-based line index.
		*/
		function lineIndexAt(text, offset) {
			const limit = Math.min(offset, text.length);
			let line = 0;
			for (let index = 0; index < limit; index += 1) if (text.charAt(index) === "\n") line += 1;
			return line;
		}
		/**
		* Bound the text of one line, without its terminating newline.
		* @param text - the text.
		* @param line - zero-based line index.
		* @returns the line's first character and the one past its last, both clamped.
		*/
		function lineBounds(text, line) {
			let start = 0;
			for (let index = 0; index < line; index += 1) {
				const next = text.indexOf("\n", start);
				if (next < 0) return {
					start: text.length,
					end: text.length
				};
				start = next + 1;
			}
			const stop = text.indexOf("\n", start);
			return {
				start,
				end: stop < 0 ? text.length : stop
			};
		}
		/**
		* Indent or outdent the lines a selection covers.
		*
		* Line-wise when the selection spans lines, so a whole block moves together; a bare caret
		* inserts at the cursor instead of rewriting its line.
		*
		* Returning undefined rather than an unchanged edit is deliberate: an outdent with nothing
		* to remove must not touch the text, or the caller's undo history grows a no-op step.
		* @param text - the whole text.
		* @param selectionStart - caret position, or the start of the selection.
		* @param selectionEnd - one past the end of the selection.
		* @param outdent - whether to remove one level instead of adding one.
		* @returns the edit to apply, or undefined when there is nothing to do.
		*/
		function indentBlock(text, selectionStart, selectionEnd, outdent) {
			if (!text.slice(selectionStart, selectionEnd).includes("\n")) {
				if (outdent) {
					const before = text.slice(0, selectionStart);
					const trimmed = before.replace(/ {1,2}$/u, "");
					const removed = before.length - trimmed.length;
					if (removed === 0) return void 0;
					const caret = selectionStart - removed;
					return {
						text: `${trimmed}${text.slice(selectionEnd)}`,
						start: caret,
						end: caret
					};
				}
				const caret = selectionStart + 2;
				return {
					text: `${text.slice(0, selectionStart)}  ${text.slice(selectionEnd)}`,
					start: caret,
					end: caret
				};
			}
			const lineStart = text.lastIndexOf("\n", selectionStart - 1) + 1;
			const covered = text.slice(lineStart, selectionEnd);
			const rewritten = covered.split("\n").map((line) => outdent ? line.replace(/^ {1,2}/u, "") : `  ${line}`).join("\n");
			return {
				text: `${text.slice(0, lineStart)}${rewritten}${text.slice(selectionEnd)}`,
				start: lineStart,
				end: selectionEnd + rewritten.length - covered.length
			};
		}
		//#endregion
		//#region src/client/skill-card/violation-copy.ts
		/**
		* Locale key for every content-policy code.
		*
		* A record rather than a lookup with a fallback, so a new code fails compilation here
		* until both dictionaries carry its copy.
		*/
		var CONTENT_VIOLATION_KEYS = {
			"script": "skillCardViolationScript",
			"event-attribute": "skillCardViolationEvent",
			"unsafe-url": "skillCardViolationUrl",
			"external-element": "skillCardViolationExternal",
			"external-css": "skillCardViolationCss"
		};
		//#endregion
		//#region src/client/skill-card/SkillCardResultEditor.tsx
		/**
		* The result's own editor: the filled region HTML, written by hand.
		*
		* A run's output is not always right, and the fix is sometimes two characters rather than
		* another model call. This editor edits the one fragment a result carries — not the
		* template document, which is a different thing stored under a different key — and saves
		* it as the card's result.
		*
		* It opens in place of the rendered document, inside the result surface, for the same
		* reason the configuration editor does: the shared primitives expose no dialog, and a
		* second overlay mechanism would be a second thing to get wrong. It answers the same
		* keystrokes as the template editor because a writer in an HTML box expects them; it
		* carries none of that editor's document-only affordances (region bands, declaration
		* builder, skeleton), because a fragment has no region markers and declares nothing.
		* @module dsh-workbench/client/skill-card/SkillCardResultEditor
		*/
		/** Group digits the way the size readout shows them: `12,480`, not `12480`. */
		var COUNT_FORMAT$1 = new Intl.NumberFormat("en-US");
		/**
		* Render the result editor.
		* @param props - the starting HTML, `t`, and the two decisions.
		* @returns the editor element.
		*/
		function SkillCardResultEditor(props) {
			const { html, t, onSave, onCancel } = props;
			const [draft, setDraft] = (0, react.useState)(html);
			const [saving, setSaving] = (0, react.useState)(false);
			const gutter = (0, react.useRef)(null);
			const editor = (0, react.useRef)(null);
			const escaped = (0, react.useRef)(false);
			const violations = (0, react.useMemo)(() => analyzeFragment(draft), [draft]);
			const bytes = new TextEncoder().encode(draft).length;
			const overBudget = bytes > WORKBENCH_RESULT_MAX_BYTES;
			const empty = draft.trim() === "";
			const dirty = draft !== html;
			const saveable = dirty && !empty && !overBudget && violations.length === 0;
			/** Which single refusal the alert line states, or undefined when nothing blocks. */
			const refusal = empty ? "empty" : overBudget ? "too-large" : void 0;
			const refusalText = refusal === "empty" ? t("resultEditEmpty") : refusal === "too-large" ? t("resultEditTooLarge", {
				bytes: COUNT_FORMAT$1.format(bytes),
				max: COUNT_FORMAT$1.format(WORKBENCH_RESULT_MAX_BYTES)
			}) : "";
			const gutterLines = (0, react.useMemo)(() => draft.split("\n").map((_, index) => index + 1), [draft]);
			/**
			* Indent or outdent the lines the caret covers.
			* @param outdent - whether to remove one level instead of adding one.
			*/
			const editIndent = (outdent) => {
				const element = editor.current;
				if (element === null) return;
				const edit = indentBlock(element.value, element.selectionStart, element.selectionEnd, outdent);
				if (edit === void 0) return;
				setDraft(edit.text);
				queueMicrotask(() => {
					element.setSelectionRange(edit.start, edit.end);
				});
			};
			/**
			* Select a character range of the draft and bring it into view.
			* @param start - first character to select.
			* @param end - one past the last character to select.
			*/
			const revealRange = (start, end) => {
				const element = editor.current;
				if (element === null) return;
				const from = Math.min(Math.max(start, 0), draft.length);
				const to = Math.min(Math.max(end, from), draft.length);
				element.focus();
				element.setSelectionRange(from, to);
				const top = lineIndexAt(draft, from) * 18 - element.clientHeight / 2 + 9;
				element.scrollTop = Math.max(0, top);
				if (gutter.current !== null) gutter.current.scrollTop = element.scrollTop;
			};
			/**
			* Select one whole line, for a click on its number.
			* @param line - zero-based line index.
			*/
			const selectLine = (line) => {
				const bounds = lineBounds(draft, line);
				revealRange(bounds.start, bounds.end);
			};
			/**
			* Jump to one reported refusal.
			* @param violation - the refusal the user clicked.
			*/
			const revealViolation = (violation) => {
				const offset = violation.offset;
				if (offset === void 0) return;
				revealRange(offset, offset + (violation.token?.length ?? 1));
			};
			/** Store the draft, obeying the same gate as the button. */
			const submit = () => {
				if (!saveable || saving) return;
				setSaving(true);
				onSave(draft).finally(() => {
					setSaving(false);
				});
			};
			/**
			* Keep Tab and Shift+Tab inside the editor as indentation, and claim Ctrl/Cmd+S.
			* @param event - the key event from the field.
			*/
			const handleEditorKey = (event) => {
				if ((event.ctrlKey || event.metaKey) && event.key === "s") {
					event.preventDefault();
					submit();
					return;
				}
				if (event.key === "Escape") {
					escaped.current = true;
					return;
				}
				if (event.key !== "Tab") {
					escaped.current = false;
					return;
				}
				if (escaped.current) {
					escaped.current = false;
					return;
				}
				event.preventDefault();
				editIndent(event.shiftKey);
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: skill_card_module_default.resultEditor,
				"data-result-editor": "",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: skill_card_module_default.editorStatus,
						"data-result-edit-status": "",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							className: overBudget ? skill_card_module_default.editorStatusWarn : void 0,
							children: [
								COUNT_FORMAT$1.format(bytes),
								" / ",
								COUNT_FORMAT$1.format(WORKBENCH_RESULT_MAX_BYTES),
								" ",
								t("skillCardTemplateSizeUnit")
							]
						}), dirty ? ` · ${t("skillCardTemplateDirty")}` : ""]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: skill_card_module_default.editorPane,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("pre", {
							ref: gutter,
							className: skill_card_module_default.gutter,
							"aria-hidden": "true",
							children: gutterLines.map((line) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								tabIndex: -1,
								className: skill_card_module_default.gutterLine,
								onMouseDown: (event) => {
									event.preventDefault();
								},
								onClick: () => {
									selectLine(line - 1);
								},
								children: line
							}, line))
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
							ref: editor,
							className: skill_card_module_default.editor,
							value: draft,
							spellCheck: false,
							"aria-label": t("resultEditLabel"),
							placeholder: t("resultEditPlaceholder"),
							onChange: (event) => {
								setDraft(event.target.value);
							},
							onKeyDown: (event) => {
								handleEditorKey(event);
							},
							onScroll: (event) => {
								if (gutter.current !== null) gutter.current.scrollTop = event.currentTarget.scrollTop;
							}
						})]
					}),
					violations.length === 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", {
						className: skill_card_module_default.violations,
						"data-result-edit-violations": "",
						children: violations.map((violation, index) => {
							const label = `${t(CONTENT_VIOLATION_KEYS[violation.code])} · ${violation.location}`;
							return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("li", { children: violation.offset === void 0 ? label : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: skill_card_module_default.violationJump,
								onClick: () => {
									revealViolation(violation);
								},
								children: label
							}) }, `${violation.code}-${String(index)}`);
						})
					}),
					refusal === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: skill_card_module_default.writeFailure,
						role: "alert",
						"data-result-edit-refusal": refusal,
						children: refusalText
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: skill_card_module_default.settingsActions,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							variant: "primary",
							size: "sm",
							disabled: !saveable || saving,
							onClick: submit,
							children: t("skillCardSave")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							variant: "ghost",
							size: "sm",
							onClick: onCancel,
							children: t("actionCancel")
						})]
					})
				]
			});
		}
		//#endregion
		//#region node_modules/clsx/dist/clsx.mjs
		function r(e) {
			var t, f, n = "";
			if ("string" == typeof e || "number" == typeof e) n += e;
			else if ("object" == typeof e) if (Array.isArray(e)) {
				var o = e.length;
				for (t = 0; t < o; t++) e[t] && (f = r(e[t])) && (n && (n += " "), n += f);
			} else for (f in e) e[f] && (n && (n += " "), n += f);
			return n;
		}
		function clsx() {
			for (var e, t, f = 0, n = "", o = arguments.length; f < o; f++) (e = arguments[f]) && (t = r(e)) && (n && (n += " "), n += t);
			return n;
		}
		//#endregion
		//#region src/client/skill-card/ActionDeclarationPanel.tsx
		/**
		* The action-declaration builder: pick a key, a kind, and a target, and the editor
		* writes the line.
		*
		* The declaration block is the one place in a template where exact syntax is
		* memorised rather than seen: a key that does not match what the model emits, or a
		* `card` typed as `cards`, renders a card that looks right and refuses every click.
		* The panel removes the memorising, and refuses the two mistakes that are otherwise
		* only discovered in the analyser's list — a malformed key and a key declared twice.
		* @module dsh-workbench/client/skill-card/ActionDeclarationPanel
		*/
		/**
		* Render the declaration builder.
		* @param props - the choices available, the keys taken, and the two decisions.
		* @returns the panel.
		*/
		function ActionDeclarationPanel(props) {
			const { t, cardTitles, skillNames, catalogStatus, takenKeys, onInsert, onClose } = props;
			const base = (0, react.useId)();
			const keyId = `${base}-key`;
			const kindId = `${base}-kind`;
			const targetId = `${base}-target`;
			const captionId = `${base}-caption`;
			const [key, setKey] = (0, react.useState)("");
			const [kind, setKind] = (0, react.useState)("card");
			const [chosen, setChosen] = (0, react.useState)({
				card: cardTitles[0] ?? "",
				skill: skillNames[0] ?? ""
			});
			const trimmed = key.trim();
			const malformed = !WORKBENCH_ACTION_KEY_PATTERN.test(trimmed);
			const taken = !malformed && takenKeys.includes(trimmed);
			const target = chosen[kind];
			const options = kind === "card" ? cardTitles : skillNames;
			const confirmable = !malformed && !taken && target !== "";
			const caption = trimmed === "" ? t("skillCardActionKeyHint") : malformed ? t("skillCardViolationActionKey") : taken ? t("skillCardActionKeyTaken") : t("skillCardActionKeyHint");
			const confirm = () => {
				if (!confirmable) return;
				onInsert(trimmed, kind === "card" ? {
					kind: "card",
					name: target
				} : {
					kind: "skill",
					name: target
				});
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: skill_card_module_default.actionBuilder,
				role: "group",
				"aria-label": t("skillCardAddAction"),
				onKeyDown: (event) => {
					if (event.key !== "Escape") return;
					onClose();
				},
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: skill_card_module_default.builderRow,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: skill_card_module_default.builderField,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
										className: skill_card_module_default.fieldLabel,
										htmlFor: keyId,
										children: t("skillCardActionKey")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										id: keyId,
										className: skill_card_module_default.select,
										type: "text",
										value: key,
										spellCheck: false,
										autoFocus: true,
										"aria-describedby": captionId,
										onChange: (event) => {
											setKey(event.target.value);
										},
										onKeyDown: (event) => {
											if (event.key !== "Enter") return;
											event.preventDefault();
											confirm();
										}
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
										id: captionId,
										className: clsx(skill_card_module_default.hint, malformed || taken ? skill_card_module_default.hintError : void 0),
										"data-action-key-caption": "",
										children: caption
									})
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: skill_card_module_default.builderField,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
									className: skill_card_module_default.fieldLabel,
									htmlFor: kindId,
									children: t("skillCardActionKind")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
									id: kindId,
									className: skill_card_module_default.select,
									value: kind,
									onChange: (event) => {
										setKind(event.target.value === "skill" ? "skill" : "card");
									},
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
										value: "card",
										children: t("skillCardActionKindCard")
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
										value: "skill",
										children: t("skillCardActionKindSkill")
									})]
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: skill_card_module_default.builderField,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
									className: skill_card_module_default.fieldLabel,
									htmlFor: targetId,
									children: t("skillCardActionTarget")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
									id: targetId,
									className: skill_card_module_default.select,
									value: target,
									onChange: (event) => {
										const next = event.target.value;
										setChosen((previous) => kind === "card" ? {
											...previous,
											card: next
										} : {
											...previous,
											skill: next
										});
									},
									children: [options.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
										value: "",
										children: t("skillCardSelectPlaceholder")
									}) : null, options.map((name) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
										value: name,
										children: name
									}, name))]
								})]
							})
						]
					}),
					options.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: skill_card_module_default.hint,
						children: t(emptyTargetKey(kind, catalogStatus))
					}) : null,
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: skill_card_module_default.settingsActions,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							variant: "primary",
							size: "sm",
							disabled: !confirmable,
							onClick: confirm,
							children: t("actionConfirm")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							variant: "ghost",
							size: "sm",
							onClick: onClose,
							children: t("actionCancel")
						})]
					})
				]
			});
		}
		/**
		* Name the reason a target picker holds nothing.
		* @param kind - which list is empty.
		* @param status - whether the skill list could be read.
		* @returns the locale key for the explanation.
		*/
		function emptyTargetKey(kind, status) {
			if (kind === "card") return "skillCardActionNoCards";
			if (status === "ready") return "skillCardCatalogEmpty";
			if (status === "failed") return "skillCardCatalogFailed";
			return "skillCardCatalogLoading";
		}
		//#endregion
		//#region src/client/skill-card/declarations.ts
		/**
		* Where one action declaration goes in a template, and how its line is written.
		*
		* The declaration block is the one part of a document the user cannot discover by
		* looking at the result: a wrong key, or `card` misspelled, renders a perfectly good
		* card that refuses every click. The editor therefore writes the line from choices,
		* and these two operations are what it writes with — kept out of the component so the
		* insertion can be asserted without a DOM.
		* @module dsh-workbench/client/skill-card/declarations
		*/
		/** The indent a declaration line carries, matching the rest of a written document. */
		var DECLARATION_INDENT = "  ";
		/** The block's opening marker, without its closing delimiter. */
		var BLOCK_OPEN = `<!-- ${WORKBENCH_ACTIONS_MARKER}`;
		/** The block's closing delimiter. A new line is inserted immediately before it. */
		var BLOCK_CLOSE = "-->";
		/**
		* Write one declaration line.
		* @param key - the action key a button will carry.
		* @param target - what that key resolves to.
		* @returns the line, exactly as the analyser reads it back.
		*/
		function declarationLine(key, target) {
			return `${key}: ${target.kind} "${target.name}"`;
		}
		/**
		* Insert one declaration line into a document.
		*
		* Only the line is written: an existing block keeps every line it already holds,
		* byte for byte. A template with no block gets one, placed so the analyser cannot
		* mistake it for a declaration written inside the region.
		* @param text - the template as the user has it.
		* @param line - the declaration line, from {@link declarationLine}.
		* @returns the rewritten document and the offset of the inserted line.
		*/
		function insertDeclaration(text, line) {
			const block = findActionsBlock(text);
			if (block !== void 0) {
				const blockLineStart = text.lastIndexOf("\n", block.start - 1) + 1;
				const lead = text.slice(blockLineStart, block.start);
				const aligned = /^[\t ]*$/u.test(lead);
				const indent = aligned ? lead : "";
				const from = aligned ? blockLineStart : block.start;
				const entries = text.slice(block.start + BLOCK_OPEN.length, block.end - 3).split("\n").map((entry) => entry.trim()).filter((entry) => entry !== "");
				entries.push(line);
				const rewritten = [
					`${indent}${BLOCK_OPEN}`,
					...entries.map((entry) => `${indent}${DECLARATION_INDENT}${entry}`),
					`${indent}${BLOCK_CLOSE}`
				].join("\n");
				const inserted = `${indent}${DECLARATION_INDENT}${line}`;
				return {
					text: `${text.slice(0, from)}${rewritten}${text.slice(block.end)}`,
					lineStart: from + rewritten.lastIndexOf(inserted)
				};
			}
			const at = regionMarkerPattern("template-begin").exec(text)?.index ?? text.length;
			const indent = indentOf(text, at);
			const openLine = `${indent}${BLOCK_OPEN}`;
			return insertAt(text, at, `${openLine}\n${indent}${DECLARATION_INDENT}${line}\n${indent}${BLOCK_CLOSE}`, openLine.length + 1);
		}
		/**
		* Read the leading whitespace of the line an offset starts on.
		*
		* A declaration is indented one level deeper than the marker that opens its block, so
		* a block written inside a document keeps its own indentation instead of jumping to
		* the left margin.
		* @param text - the document.
		* @param at - the offset whose line indent is wanted.
		* @returns the line's leading whitespace, or an empty string when it has none.
		*/
		function indentOf(text, at) {
			const lineStart = text.lastIndexOf("\n", at - 1) + 1;
			const lead = text.slice(lineStart, at);
			return /^[\t ]*$/u.test(lead) ? lead : "";
		}
		/**
		* Splice one run of text into a document at an offset, keeping it on lines of its own.
		*
		* A block may be written on one line (`<!-- dsh-actions a: card "A" -->`), so both
		* sides of the splice are checked: a declaration that shared a line with the marker
		* would still parse, but it would read as if the marker had eaten it.
		* @param text - the document.
		* @param at - the offset to splice at.
		* @param body - the text to insert.
		* @param innerOffset - how far into `body` the reported line begins.
		* @returns the rewritten document and the offset of that line.
		*/
		function insertAt(text, at, body, innerOffset) {
			const before = text.slice(0, at);
			const after = text.slice(at);
			const lead = before === "" || before.endsWith("\n") ? "" : "\n";
			return {
				text: `${before}${`${lead}${body}${after === "" || after.startsWith("\n") ? "" : "\n"}`}${after}`,
				lineStart: at + lead.length + innerOffset
			};
		}
		//#endregion
		//#region src/client/skill-card/skeleton.ts
		/**
		* The starter document the editor writes into an empty template.
		*
		* An empty box teaches nothing: the product depends on two comments — the region a
		* child fills, and the block that declares what a button may address — and neither can
		* be guessed from a blank textarea. The skeleton is therefore a small but complete
		* document that demonstrates both, and it must pass the analyser with no violations:
		* a starter that opens on a validation error is worse than an empty box.
		* @module dsh-workbench/client/skill-card/skeleton
		*/
		/** The declaration block, empty until the user adds the first target. */
		var ACTIONS_BLOCK = `<!-- ${WORKBENCH_ACTIONS_MARKER} -->`;
		/** The region a child fills, each marker on a line of its own. */
		var REGION_BEGIN = `<!-- ${WORKBENCH_REGION_BEGIN} -->`;
		var REGION_END = `<!-- ${WORKBENCH_REGION_END} -->`;
		/**
		* Build the skeleton.
		*
		* The prose is translated because it is an instruction the user reads and a child
		* agent follows; the markup around it is not, because it is the example.
		* @param t - translator.
		* @returns the document, ready to be stored and analysed.
		*/
		function templateSkeleton(t) {
			return [
				"<!DOCTYPE html>",
				"<html>",
				"  <head>",
				"    <meta charset=\"utf-8\">",
				"    <style>",
				"      body { margin: 0; font-family: system-ui, sans-serif; font-size: 13px; }",
				"      h1 { margin: 0 0 8px; font-size: 16px; font-weight: 600; }",
				"      ul { margin: 0; padding-left: 18px; }",
				"      li { padding: 4px 0; }",
				"      button { padding: 2px 8px; border: 1px solid #c8c8c8; border-radius: 6px; background: transparent; cursor: pointer; }",
				"    </style>",
				"  </head>",
				"  <body>",
				`    ${ACTIONS_BLOCK}`,
				`    <h1>${t("skillCardSkeletonHeading")}</h1>`,
				"    <ul>",
				`      ${REGION_BEGIN}`,
				"      <!--",
				`        ${t("skillCardSkeletonWhat")}`,
				`        ${t("skillCardSkeletonExample")}`,
				`        ${t("skillCardSkeletonQuote")}`,
				"      -->",
				`      ${REGION_END}`,
				"    </ul>",
				"  </body>",
				"</html>"
			].join("\n");
		}
		//#endregion
		//#region src/client/skill-card/template-outline.ts
		/**
		* One template's container elements, by line.
		*
		* A template is three or four hundred lines of markup whose shape is small: a head, a style
		* block, a body holding a handful of nested boxes, a script. Reading it top to bottom with
		* nothing but a scrollbar means holding that shape in your head while you look through it, so
		* the shape is derived here instead — once, purely, from the text — and the fold view is built
		* from it.
		*
		* This is not an HTML parser. It walks tags, not a tree, because the only questions asked of
		* it are "where does this block start and end on which line" and "what is it called", and
		* because a template is user-edited text that may be half-typed: the scanner has to answer
		* for a document with an unclosed `<div` rather than refuse it.
		* @module dsh-workbench/client/skill-card/template-outline
		*/
		/** Elements that never hold content, so they never fold. */
		var VOID_TAGS = /* @__PURE__ */ new Set([
			"area",
			"base",
			"br",
			"col",
			"embed",
			"hr",
			"img",
			"input",
			"link",
			"meta",
			"param",
			"source",
			"track",
			"wbr"
		]);
		/**
		* Elements whose content is text rather than markup.
		*
		* A `<` inside them is a character, not a tag: a CSS child selector and a JavaScript
		* comparison both look like an element to a tag scan, and both would open blocks that never
		* close. Their bodies are skipped to the matching end tag instead.
		*/
		var RAW_TAGS = /* @__PURE__ */ new Set([
			"style",
			"script",
			"pre",
			"textarea"
		]);
		/** Match one tag, its attributes, and its self-closing slash. */
		var TAG_PATTERN = /<(\/?)([a-zA-Z][\w:-]*)((?:"[^"]*"|'[^']*'|[^>"'])*?)(\/?)>/gu;
		/**
		* Blank out comments, keeping every offset and line break where it was.
		* @param text - the document.
		* @returns the document with comment bodies replaced by spaces.
		*/
		function maskComments(text) {
			let masked = "";
			let index = 0;
			while (index < text.length) {
				if (text.startsWith("<!--", index)) {
					const close = text.indexOf("-->", index + 4);
					const stop = close < 0 ? text.length : close + 3;
					masked += text.slice(index, stop).replace(/[^\n]/gu, " ");
					index = stop;
					continue;
				}
				masked += text.charAt(index);
				index += 1;
			}
			return masked;
		}
		/**
		* Name an element the way a list of blocks wants it named.
		* @param tag - lower-case tag name.
		* @param attributes - the opening tag's attribute text, verbatim.
		* @returns `<tag>`, or `<tag class="first-class">` when the element has one.
		*/
		function labelOf(tag, attributes) {
			const match = /(?:^|\s)(class|id)\s*=\s*(?:"([^"]*)"|'([^']*)')/u.exec(attributes);
			const value = (match?.[2] ?? match?.[3] ?? "").trim();
			if (match === null || value === "") return `<${tag}>`;
			const first = value.split(/\s+/u)[0] ?? "";
			const short = first.length > 24 ? `${first.slice(0, 24)}…` : first;
			return `<${tag} ${match[1] ?? "class"}="${short}">`;
		}
		/**
		* Read one template's container elements.
		*
		* Nesting is answered from a stack, so an element that never closes does not swallow the
		* rest of the document: it ends on its own line and the elements after it are still found.
		* @param text - the template source.
		* @returns every opening element, in document order.
		*/
		function outline(text) {
			const masked = maskComments(text);
			const starts = [0];
			for (let index = 0; index < masked.length; index += 1) if (masked.charAt(index) === "\n") starts.push(index + 1);
			/**
			* The line an offset falls on.
			* @param offset - character offset into the document.
			* @returns zero-based line index.
			*/
			const lineAt = (offset) => {
				let low = 0;
				let high = starts.length - 1;
				while (low < high) {
					const middle = Math.ceil((low + high) / 2);
					if ((starts[middle] ?? 0) <= offset) low = middle;
					else high = middle - 1;
				}
				return low;
			};
			const nodes = [];
			/** Nodes whose element is open, outermost first, as indexes into `nodes`. */
			const open = [];
			const lower = masked.toLowerCase();
			TAG_PATTERN.lastIndex = 0;
			for (let match = TAG_PATTERN.exec(masked); match !== null; match = TAG_PATTERN.exec(masked)) {
				const name = (match[2] ?? "").toLowerCase();
				const closing = match[1] === "/";
				const attributes = match[3] ?? "";
				const selfClosed = match[4] === "/";
				const line = lineAt(match.index);
				if (closing) {
					let at = -1;
					for (let slot = open.length - 1; slot >= 0; slot -= 1) {
						const index = open[slot];
						if (index !== void 0 && nodes[index]?.tag === name) {
							at = slot;
							break;
						}
					}
					if (at >= 0) {
						for (let slot = open.length - 1; slot >= at; slot -= 1) {
							const index = open[slot];
							const node = index === void 0 ? void 0 : nodes[index];
							if (index !== void 0 && node !== void 0) nodes[index] = {
								...node,
								endLine: line
							};
						}
						open.length = at;
					}
					continue;
				}
				if (selfClosed || VOID_TAGS.has(name)) continue;
				if (RAW_TAGS.has(name)) {
					const close = lower.indexOf(`</${name}`, TAG_PATTERN.lastIndex);
					const endLine = close < 0 ? line : lineAt(close);
					nodes.push({
						id: nodes.length,
						tag: name,
						label: labelOf(name, attributes),
						line,
						endLine,
						depth: open.length
					});
					if (close < 0) continue;
					TAG_PATTERN.lastIndex = close + name.length + 2;
					continue;
				}
				nodes.push({
					id: nodes.length,
					tag: name,
					label: labelOf(name, attributes),
					line,
					endLine: line,
					depth: open.length
				});
				open.push(nodes.length - 1);
			}
			return nodes;
		}
		/**
		* The blocks of one outline: the elements whose content spans at least two lines.
		* @param nodes - an outline.
		* @returns the foldable nodes, in document order.
		*/
		function foldableNodes(nodes) {
			return nodes.filter((node) => node.endLine > node.line);
		}
		/**
		* Lay one template out as rows, with folded blocks replaced by their opening line.
		* @param text - the template source.
		* @param nodes - its outline.
		* @param folded - the ids of the blocks that are folded.
		* @returns one row per visible line, in document order.
		*/
		function foldRows(text, nodes, folded) {
			const lines = text.split("\n");
			const starts = /* @__PURE__ */ new Map();
			for (const node of foldableNodes(nodes)) {
				const existing = starts.get(node.line);
				if (existing === void 0 || node.depth < existing.depth) starts.set(node.line, node);
			}
			const rows = [];
			let line = 0;
			while (line < lines.length) {
				const node = starts.get(line);
				const closed = node !== void 0 && folded.has(node.id) ? node.endLine - node.line : 0;
				rows.push({
					line,
					number: line + 1,
					text: lines[line] ?? "",
					node,
					closed
				});
				line = node !== void 0 && closed > 0 ? node.endLine + 1 : line + 1;
			}
			return rows;
		}
		//#endregion
		//#region src/client/skill-card/TemplateFold.tsx
		/**
		* One template read as structure rather than as source.
		*
		* The field beside this view is the only editor: this is the same text with each block's
		* inside hidden behind the line that opens it, so a three-hundred-line template can be read
		* as the dozen boxes it actually is. Every row is also a way back — a click hands the line
		* back to the field, selected — because folding is only half of what a long document needs;
		* the other half is arriving at the line you were looking for.
		* @module dsh-workbench/client/skill-card/TemplateFold
		*/
		/**
		* Render one template as foldable rows.
		* @param props - the text, its outline, the translator, and the way back.
		* @returns the fold view.
		*/
		function TemplateFold({ text, nodes, t, onReveal }) {
			const [folded, setFolded] = (0, react.useState)(() => /* @__PURE__ */ new Set());
			const rows = (0, react.useMemo)(() => foldRows(text, nodes, folded), [
				text,
				nodes,
				folded
			]);
			/**
			* Open or close one block.
			* @param id - the block's position in the outline.
			*/
			const toggle = (id) => {
				setFolded((current) => {
					const next = new Set(current);
					if (next.has(id)) next.delete(id);
					else next.add(id);
					return next;
				});
			};
			/** A control inside an `aria-hidden`-shaped list keeps focus where it was. */
			const keepFocus = (event) => {
				event.preventDefault();
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: skill_card_module_default.foldView,
				"data-template-fold": "",
				children: rows.map((row) => {
					const node = row.node;
					return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: skill_card_module_default.foldRow,
						"data-fold-line": row.number,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								tabIndex: -1,
								className: skill_card_module_default.foldNumber,
								onMouseDown: keepFocus,
								onClick: () => {
									onReveal(row.line);
								},
								children: row.number
							}),
							node === void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: skill_card_module_default.foldCaretBlank,
								"aria-hidden": "true"
							}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								tabIndex: -1,
								className: skill_card_module_default.foldCaret,
								"aria-expanded": row.closed === 0,
								"aria-label": t(row.closed === 0 ? "skillCardFoldCollapse" : "skillCardFoldExpand", { name: node.label }),
								onMouseDown: keepFocus,
								onClick: () => {
									toggle(node.id);
								},
								children: row.closed === 0 ? "▾" : "▸"
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								tabIndex: -1,
								className: skill_card_module_default.foldText,
								onMouseDown: keepFocus,
								onClick: () => {
									onReveal(row.line);
								},
								children: row.text === "" ? "\xA0" : row.text
							}),
							row.closed === 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: skill_card_module_default.foldCount,
								children: t("skillCardFoldLines", { count: String(row.closed) })
							})
						]
					}, row.line);
				})
			});
		}
		//#endregion
		//#region src/client/skill-card/SkillCardSettings.tsx
		/**
		* The skill card's editor: choose a skill, write the HTML, and preview it.
		*
		* It opens in place of the card body rather than in a modal: the shared
		* primitives expose no dialog, and inventing one here would put a second overlay
		* mechanism next to the application's own.
		*
		* The page it renders is three groups — the card's facts, the template, and the
		* preview — followed by a footer that stays in reach. They are groups rather than
		* nested cards: a card inside a card reads as a second frame, and the editor already
		* sits inside the page's own surface.
		* @module dsh-workbench/client/skill-card/SkillCardSettings
		*/
		/** The marker pair the insert control writes, each on its own line. */
		var REGION_MARKERS = {
			begin: `<!-- ${WORKBENCH_REGION_BEGIN} -->`,
			end: `<!-- ${WORKBENCH_REGION_END} -->`
		};
		/** Group digits the way the size readout shows them: `12,480`, not `12480`. */
		var COUNT_FORMAT = new Intl.NumberFormat("en-US");
		/**
		* Join the class names of one element.
		*
		* The CSS module is typed as an index signature, so every lookup may be undefined;
		* dropping the absent ones keeps a literal `undefined` out of the DOM.
		* @param names - candidate class names.
		* @returns the class attribute value.
		*/
		function classes(...names) {
			return names.filter((name) => name !== void 0).join(" ");
		}
		/**
		* Choose the classes of one gutter line.
		* @param kind - the band the line belongs to, when it belongs to one.
		* @returns the CSS module class names for that line.
		*/
		function gutterLineClass(kind) {
			if (kind === "region") return classes(skill_card_module_default.gutterLine, skill_card_module_default.gutterLineRegion);
			if (kind === "actions") return classes(skill_card_module_default.gutterLine, skill_card_module_default.gutterLineActions);
			return classes(skill_card_module_default.gutterLine);
		}
		/**
		* Render the card editor.
		*
		* The card remounts this component when the selected skill changes, so the draft
		* always starts from that skill's stored template.
		* @param props - the view, `t`, and the four actions.
		* @returns the editor element.
		*/
		function SkillCardSettings(props) {
			const { view, t, onChoose, onChooseModel, onChoosePermission, onChooseInstructionMode, onChooseWorkspace, onSave, onRename, onClose, onDelete } = props;
			const [draft, setDraft] = (0, react.useState)(view.template ?? "");
			const [name, setName] = (0, react.useState)(view.name ?? "");
			const [builderOpen, setBuilderOpen] = (0, react.useState)(false);
			const [deleteArmed, setDeleteArmed] = (0, react.useState)(false);
			const base = (0, react.useId)();
			const basicsId = `${base}-basics`;
			const nameId = `${base}-name`;
			const skillId = `${base}-skill`;
			const modelId = `${base}-model`;
			const permissionId = `${base}-permission`;
			const instructionId = `${base}-instruction`;
			const templateId = `${base}-template`;
			const previewId = `${base}-preview`;
			const analysis = (0, react.useMemo)(() => analyzeTemplate(draft), [draft]);
			const gutter = (0, react.useRef)(null);
			const editor = (0, react.useRef)(null);
			const escaped = (0, react.useRef)(false);
			const dirty = draft !== (view.template ?? "") || name !== (view.name ?? "");
			const [pane, setPane] = (0, react.useState)("edit");
			const [folded, setFolded] = (0, react.useState)(false);
			const pendingReveal = (0, react.useRef)(void 0);
			const saveable = analysis.violations.length === 0 && draft.length > 0 && view.skill !== void 0;
			const regionLines = (0, react.useMemo)(() => {
				const region = analysis.region;
				if (region === void 0) return void 0;
				return {
					start: lineIndexAt(draft, region.start) + 1,
					end: lineIndexAt(draft, region.end) + 1
				};
			}, [analysis, draft]);
			const regionEmpty = regionLines === void 0 || regionLines.end - regionLines.start <= 1;
			const gutterLines = (0, react.useMemo)(() => {
				const marks = /* @__PURE__ */ new Map();
				const actions = findActionsBlock(draft);
				if (actions !== void 0) {
					const first = lineIndexAt(draft, actions.start);
					const last = lineIndexAt(draft, actions.end);
					for (let line = first; line <= last; line += 1) marks.set(line, "actions");
				}
				if (regionLines !== void 0) for (let line = regionLines.start - 1; line <= regionLines.end - 1; line += 1) marks.set(line, "region");
				return draft.split("\n").map((_, index) => ({
					number: index + 1,
					kind: marks.get(index)
				}));
			}, [draft, regionLines]);
			const templateOutline = (0, react.useMemo)(() => outline(draft), [draft]);
			const options = (0, react.useMemo)(() => view.catalog.filter((entry) => entry.userInvocable), [view.catalog]);
			const skillNames = (0, react.useMemo)(() => options.map((entry) => entry.name), [options]);
			const missingTargets = (0, react.useMemo)(() => {
				if (view.status !== "ready") return [];
				const cards = new Set(view.cardTitles);
				const skills = view.catalogStatus === "ready" ? new Set(skillNames) : void 0;
				const found = [];
				for (const declaration of analysis.actions) {
					const target = declaration.target;
					if (target.kind === "card") {
						if (!cards.has(target.name)) found.push({
							key: declaration.key,
							kind: "card",
							name: target.name
						});
						continue;
					}
					if (skills !== void 0 && !skills.has(target.name)) found.push({
						key: declaration.key,
						kind: "skill",
						name: target.name
					});
				}
				return found;
			}, [
				analysis,
				skillNames,
				view.cardTitles,
				view.catalogStatus,
				view.status
			]);
			const bytes = new TextEncoder().encode(draft).length;
			const overBudget = bytes > WORKBENCH_TEMPLATE_MAX_BYTES * .85;
			/**
			* Indent or outdent the lines the caret covers.
			*
			* The arithmetic lives in `text-editing.ts` because the result editor answers the same
			* two keystrokes over a fragment; this function only applies it to the live field.
			* @param outdent - whether to remove one level instead of adding one.
			*/
			const editIndent = (outdent) => {
				const element = editor.current;
				if (element === null) return;
				const edit = indentBlock(element.value, element.selectionStart, element.selectionEnd, outdent);
				if (edit === void 0) return;
				setDraft(edit.text);
				queueMicrotask(() => {
					element.setSelectionRange(edit.start, edit.end);
				});
			};
			/**
			* Select a character range of one text and bring it into view.
			* @param start - first character to select.
			* @param end - one past the last character to select.
			* @param text - the text the offsets belong to; the draft by default, and the text
			* just written when the field has not rendered it yet.
			*/
			const revealRange = (start, end, text = draft) => {
				const element = editor.current;
				if (element === null) return;
				const from = Math.min(Math.max(start, 0), text.length);
				const to = Math.min(Math.max(end, from), text.length);
				element.focus();
				element.setSelectionRange(from, to);
				const line = lineIndexAt(text, from);
				const top = Math.max(0, (line - 2) * 18);
				element.scrollTop = top;
				if (gutter.current !== null) gutter.current.scrollTop = top;
				requestAnimationFrame(() => {
					if (editor.current !== element) return;
					element.scrollTop = top;
					if (element.scrollHeight <= element.clientHeight + 18) {
						const offset = element.getBoundingClientRect().top + line * 18;
						window.scrollBy({
							top: offset - 140,
							behavior: "auto"
						});
					}
					if (gutter.current !== null) gutter.current.scrollTop = element.scrollTop;
				});
			};
			/**
			* Jump to one reported violation.
			*
			* A violation with no offset has no position to jump to, so the list renders it as
			* text instead; this guard keeps that contract.
			* @param violation - the violation the user clicked.
			*/
			const revealViolation = (violation) => {
				const offset = violation.offset;
				if (offset === void 0) return;
				revealRange(offset, offset + (violation.token?.length ?? 1));
			};
			/**
			* Select one whole line, for a click on its number.
			* @param line - zero-based line index.
			*/
			const selectLine = (line) => {
				const bounds = lineBounds(draft, line);
				revealRange(bounds.start, bounds.end);
			};
			/**
			* Show one line in the field, coming back from the fold view when that is what is showing.
			*
			* A jump that only scrolled the fold view would leave the user in the read view they were
			* already in; the destination is a line of the document, so the document is what they land
			* in, with that line selected.
			* @param line - zero-based line index.
			*/
			const revealLine = (line) => {
				const bounds = lineBounds(draft, line);
				if (folded) {
					pendingReveal.current = bounds;
					setFolded(false);
					return;
				}
				revealRange(bounds.start, bounds.end);
			};
			(0, react.useEffect)(() => {
				const target = pendingReveal.current;
				if (target === void 0) return;
				pendingReveal.current = void 0;
				revealRange(target.start, target.end);
			});
			/**
			* Go to the template's region.
			*
			* The region is the only part of the file a user keeps coming back to: everything else is
			* the frame it sits in, and the fold view is how the frame is read. The marker's own line
			* is the destination rather than the content, so arriving shows the boundary being edited.
			*/
			const jumpToTemplate = () => {
				const region = findRegion(draft);
				if (region === void 0) return;
				revealLine(lineIndexAt(draft, region.start));
			};
			/**
			* Write the region marker pair around the caret.
			*
			* The template cannot run without a region, so the editor offers to write the only
			* thing missing rather than leaving the user to remember the comment syntax.
			*/
			const insertRegionMarkers = () => {
				const element = editor.current;
				const caret = element === null ? draft.length : element.selectionStart;
				const before = draft.slice(0, caret);
				const after = draft.slice(caret);
				const lead = before === "" || before.endsWith("\n") ? "" : "\n";
				const trail = after === "" || after.startsWith("\n") ? "" : "\n";
				const markers = `${REGION_MARKERS.begin}\n\n${REGION_MARKERS.end}`;
				setDraft(`${before}${lead}${markers}${trail}${after}`);
				const position = caret + lead.length + REGION_MARKERS.begin.length + 1;
				queueMicrotask(() => {
					if (element === null) return;
					element.focus();
					element.setSelectionRange(position, position);
				});
			};
			/**
			* Write the starter document into the empty editor.
			*
			* An empty textarea teaches nothing: the region markers and the declaration block
			* are both syntax a user cannot guess, and the skeleton shows them in place.
			*/
			const insertSkeleton = () => {
				const skeleton = templateSkeleton(t);
				setDraft(skeleton);
				const caret = findRegion(skeleton)?.start ?? 0;
				queueMicrotask(() => {
					revealRange(caret, caret, skeleton);
				});
			};
			/**
			* Write one declared action into the template.
			*
			* Only the new line is written; the panel closes only once it has been written, so a
			* refused insertion cannot look like a silent success.
			* @param key - the action key.
			* @param target - what that key resolves to.
			*/
			const applyDeclaration = (key, target) => {
				const insertion = insertDeclaration(draft, declarationLine(key, target));
				setDraft(insertion.text);
				setBuilderOpen(false);
				queueMicrotask(() => {
					revealRange(insertion.lineStart, insertion.lineStart, insertion.text);
				});
			};
			/**
			* Keep Tab and Shift+Tab inside the editor as indentation, and claim Ctrl/Cmd+S.
			* @param event - the key event from the template field.
			*/
			const handleEditorKey = (event) => {
				if ((event.ctrlKey || event.metaKey) && event.key === "s") {
					event.preventDefault();
					if (saveable) onSave(draft, name);
					return;
				}
				if (event.key === "Escape") {
					escaped.current = true;
					return;
				}
				if (event.key !== "Tab") {
					escaped.current = false;
					return;
				}
				if (escaped.current) {
					escaped.current = false;
					return;
				}
				event.preventDefault();
				editIndent(event.shiftKey);
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: skill_card_module_default.settings,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						className: skill_card_module_default.section,
						"aria-labelledby": basicsId,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
								className: skill_card_module_default.sectionTitle,
								id: basicsId,
								children: t("skillCardSectionBasics")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: skill_card_module_default.fieldGrid,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: skill_card_module_default.field,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
											className: skill_card_module_default.fieldLabel,
											htmlFor: nameId,
											children: t("skillCardCardName")
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											id: nameId,
											className: skill_card_module_default.select,
											type: "text",
											value: name,
											placeholder: t("skillCardNamePlaceholder"),
											onChange: (event) => {
												setName(event.target.value);
											},
											onBlur: () => {
												onRename(name);
											},
											onKeyDown: (event) => {
												if (event.key !== "Enter") return;
												event.preventDefault();
												onRename(name);
											}
										})]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: skill_card_module_default.field,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
											className: skill_card_module_default.fieldLabel,
											htmlFor: skillId,
											children: t("skillCardSelectSkill")
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
											id: skillId,
											className: skill_card_module_default.select,
											value: view.skill ?? "",
											disabled: view.catalogStatus !== "ready",
											onChange: (event) => {
												onChoose(event.target.value);
											},
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
												value: "",
												children: t("skillCardSelectPlaceholder")
											}), options.map((entry) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
												value: entry.name,
												children: entry.name
											}, entry.name))]
										})]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: skill_card_module_default.field,
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ModelField, {
											view,
											t,
											labelId: modelId,
											onChooseModel
										})
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: skill_card_module_default.field,
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(WorkspaceField, {
											view,
											t,
											onChooseWorkspace
										})
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: skill_card_module_default.field,
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
												className: skill_card_module_default.fieldLabel,
												htmlFor: permissionId,
												children: t("skillCardPermissionLabel")
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("select", {
												id: permissionId,
												className: skill_card_module_default.select,
												value: view.permission,
												"data-permission-select": "",
												onChange: (event) => {
													const chosen = event.target.value;
													if (!isWorkbenchSandboxMode(chosen)) return;
													onChoosePermission(chosen);
												},
												children: WORKBENCH_SANDBOX_MODES.map((mode) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
													value: mode,
													children: t(permissionLabelKey(mode))
												}, mode))
											}),
											view.permission === "danger-full-access" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
												className: skill_card_module_default.fieldNote,
												"data-permission-warning": "",
												children: t("skillCardPermissionWarning")
											}) : null
										]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: skill_card_module_default.field,
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
												className: skill_card_module_default.fieldLabel,
												htmlFor: instructionId,
												children: t("skillCardInstructionLabel")
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("select", {
												id: instructionId,
												className: skill_card_module_default.select,
												value: view.instructionMode,
												"data-instruction-select": "",
												onChange: (event) => {
													const chosen = event.target.value;
													if (!isWorkbenchInstructionMode(chosen)) return;
													onChooseInstructionMode(chosen);
												},
												children: WORKBENCH_INSTRUCTION_MODES.map((mode) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
													value: mode,
													children: t(instructionLabelKey(mode))
												}, mode))
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
												className: skill_card_module_default.fieldNote,
												children: t("skillCardInstructionNote")
											})
										]
									})
								]
							}),
							catalogNotice(view, options.length, t)
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: skill_card_module_default.panes,
						"data-pane": pane,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: skill_card_module_default.paneTabs,
								role: "tablist",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									role: "tab",
									className: skill_card_module_default.paneTab,
									"aria-selected": pane === "edit",
									onClick: () => {
										setPane("edit");
									},
									children: t("skillCardTemplateLabel")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									role: "tab",
									className: skill_card_module_default.paneTab,
									"aria-selected": pane === "preview",
									onClick: () => {
										setPane("preview");
									},
									children: t("skillCardPreview")
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
								className: skill_card_module_default.section,
								"aria-labelledby": templateId,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: skill_card_module_default.sectionHead,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
											className: skill_card_module_default.sectionTitle,
											id: templateId,
											children: t("skillCardTemplateLabel")
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: skill_card_module_default.sectionTools,
											children: [
												draft.trim() === "" ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [regionLines === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
													variant: "outline",
													size: "sm",
													"data-template-jump": "",
													onClick: jumpToTemplate,
													children: t("skillCardTemplateJump")
												}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
													variant: "outline",
													size: "sm",
													"aria-pressed": folded,
													onClick: () => {
														setFolded((value) => !value);
													},
													children: folded ? t("skillCardTemplateEditView") : t("skillCardTemplateFoldView")
												})] }),
												draft.trim() !== "" ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
													variant: "outline",
													size: "sm",
													onClick: insertSkeleton,
													children: t("skillCardInsertSkeleton")
												}),
												draft.trim() === "" || regionLines !== void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
													variant: "outline",
													size: "sm",
													onClick: insertRegionMarkers,
													children: t("skillCardInsertMarkers")
												}),
												builderOpen ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
													variant: "outline",
													size: "sm",
													onClick: () => {
														setBuilderOpen(true);
													},
													children: t("skillCardAddAction")
												})
											]
										})]
									}),
									missingTargets.length === 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", {
										className: skill_card_module_default.violations,
										"data-action-target-warnings": "",
										children: missingTargets.map((target) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("li", { children: t(target.kind === "card" ? "skillCardActionCardTargetMissing" : "skillCardActionSkillTargetMissing", {
											key: target.key,
											name: target.name
										}) }, `${target.kind}-${target.key}`))
									}),
									builderOpen ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ActionDeclarationPanel, {
										t,
										cardTitles: view.cardTitles,
										skillNames,
										catalogStatus: view.catalogStatus,
										takenKeys: analysis.actions.map((declaration) => declaration.key),
										onInsert: applyDeclaration,
										onClose: () => {
											setBuilderOpen(false);
										}
									}) : null,
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: skill_card_module_default.editorPane,
										children: [folded ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(TemplateFold, {
											text: draft,
											nodes: templateOutline,
											t,
											onReveal: revealLine
										}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("pre", {
											ref: gutter,
											className: skill_card_module_default.gutter,
											"aria-hidden": "true",
											children: gutterLines.map((line) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
												type: "button",
												tabIndex: -1,
												className: gutterLineClass(line.kind),
												onMouseDown: (event) => {
													event.preventDefault();
												},
												onClick: () => {
													selectLine(line.number - 1);
												},
												children: line.number
											}, line.number))
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
											ref: editor,
											className: skill_card_module_default.editor,
											value: draft,
											spellCheck: false,
											wrap: "off",
											"aria-label": t("skillCardTemplateLabel"),
											placeholder: t("skillCardTemplatePlaceholder"),
											onChange: (event) => {
												setDraft(event.target.value);
											},
											onKeyDown: (event) => {
												handleEditorKey(event);
											},
											onScroll: (event) => {
												if (gutter.current !== null) gutter.current.scrollTop = event.currentTarget.scrollTop;
											}
										})] }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: classes(skill_card_module_default.editorStatus, regionLines === void 0 ? skill_card_module_default.editorStatusMissing : void 0),
											"data-template-status": "",
											children: [
												regionLines === void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("skillCardRegionMissing") }) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("skillCardRegionRange", {
													start: String(regionLines.start),
													end: String(regionLines.end)
												}) }),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("skillCardActionsCount", { count: String(analysis.actions.length) }) }),
												/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
													className: overBudget ? skill_card_module_default.editorStatusWarn : void 0,
													children: [
														COUNT_FORMAT.format(bytes),
														" / ",
														COUNT_FORMAT.format(WORKBENCH_TEMPLATE_MAX_BYTES),
														" ",
														t("skillCardTemplateSizeUnit")
													]
												}),
												dirty ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													className: skill_card_module_default.editorStatusDirty,
													children: t("skillCardTemplateDirty")
												}) : null
											]
										})]
									}),
									analysis.violations.length === 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", {
										className: skill_card_module_default.violations,
										children: analysis.violations.map((violation, index) => {
											const label = `${t(violationKey(violation.code))} · ${violation.location}`;
											return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("li", { children: violation.offset === void 0 ? label : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
												type: "button",
												className: skill_card_module_default.violationJump,
												onClick: () => {
													revealViolation(violation);
												},
												children: label
											}) }, `${violation.code}-${String(index)}`);
										})
									})
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
								className: skill_card_module_default.section,
								"aria-labelledby": previewId,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: skill_card_module_default.sectionHead,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
										className: skill_card_module_default.sectionTitle,
										id: previewId,
										children: t("skillCardPreview")
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: skill_card_module_default.sectionTools,
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: skill_card_module_default.previewLabel,
											children: regionEmpty ? t("skillCardPreviewSample") : t("skillCardPreviewLive")
										})
									})]
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: skill_card_module_default.previewSurface,
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ShadowHtml, {
										html: draft,
										className: skill_card_module_default.preview
									})
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("footer", {
						className: skill_card_module_default.configFooter,
						onKeyDown: (event) => {
							if (!deleteArmed || event.key !== "Escape") return;
							setDeleteArmed(false);
						},
						children: [view.problem === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("p", {
							className: skill_card_module_default.writeFailure,
							role: "alert",
							children: [t(problemKey(view.problem.code)), view.problem.detail === void 0 || view.problem.detail === "" ? "" : ` · ${view.problem.detail}`]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: skill_card_module_default.footerActions,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
									variant: "primary",
									size: "sm",
									disabled: !saveable,
									onClick: () => {
										onSave(draft, name);
									},
									children: t("skillCardSave")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
									variant: "ghost",
									size: "sm",
									onClick: onClose,
									children: t("skillCardClose")
								}),
								dirty ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: skill_card_module_default.footerHint,
									children: t("skillCardTemplateDirty")
								}) : null,
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: skill_card_module_default.footerSpacer }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: skill_card_module_default.deletePrompt,
									"aria-live": "polite",
									children: deleteArmed ? t("skillCardDeleteConfirmPrompt") : ""
								}),
								deleteArmed ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
									variant: "ghost",
									size: "sm",
									className: skill_card_module_default.deleteCard,
									onClick: () => {
										onDelete();
									},
									children: t("skillCardDeleteConfirm")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
									variant: "ghost",
									size: "sm",
									onClick: () => {
										setDeleteArmed(false);
									},
									children: t("actionCancel")
								})] }) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
									variant: "ghost",
									size: "sm",
									className: skill_card_module_default.deleteCard,
									onClick: () => {
										setDeleteArmed(true);
									},
									children: t("skillCardDelete")
								})
							]
						})]
					})
				]
			});
		}
		/**
		* Render the model control for one card.
		*
		* Three states, and the picker is only one of them. A known route with no catalog behind
		* it is stated as the name the card will run on, and no route at all is stated as
		* unavailable — never as an empty picker, which would offer the user a choice that does
		* not exist. The run control elsewhere reads the same three states, so this field can
		* never say "unavailable" beside a live Run button.
		* @param props - the card view, the translator, the label id, and the field's actions.
		* @returns the field.
		*/
		function ModelField({ view, t, labelId, onChooseModel }) {
			const field = view.modelField;
			const label = field.kind === "ready" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
				className: skill_card_module_default.fieldLabel,
				htmlFor: labelId,
				children: t("skillCardModel")
			}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				className: skill_card_module_default.fieldLabel,
				children: t("skillCardModel")
			});
			if (field.kind === "ready") return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [label, /* @__PURE__ */ (0, react_jsx_runtime.jsx)("select", {
				id: labelId,
				className: skill_card_module_default.select,
				value: modelKey(field.selected),
				"data-model-select": "",
				onChange: (event) => {
					const chosen = parseModelKey(event.target.value);
					if (chosen === void 0) return;
					onChooseModel(chosen);
				},
				children: field.groups.map((group) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("optgroup", {
					label: group.name,
					children: group.models.map((model) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
						value: modelKey({
							provider: group.id,
							model: model.id
						}),
						children: model.name
					}, model.id))
				}, group.id))
			})] });
			if (field.kind === "fixed") return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [label, /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				className: skill_card_module_default.fieldValue,
				"data-model-fixed": "",
				children: field.name ?? field.model.model
			})] });
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [label, /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				className: skill_card_module_default.fieldValue,
				"data-model-unavailable": "",
				children: t("skillCardModelUnavailable")
			})] });
		}
		/**
		* Render the directory control for one card.
		*
		* Three states, and the label is never a `for` pointing at a control that does not exist.
		* The leaf name is the primary value because a path is a poor label to scan — except on a
		* drive root, which has no last segment. The full path sits beneath it in tertiary type so
		* the user can always see exactly which directory the card runs in, and a path that is no
		* longer a directory says so in place, beside the control that would fix it.
		* @param props - the card view, the translator, and the picker action.
		* @returns the field.
		*/
		function WorkspaceField({ view, t, onChooseWorkspace }) {
			const field = view.workspaceField;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
					className: skill_card_module_default.fieldLabel,
					children: t("skillCardWorkspace")
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: skill_card_module_default.workspaceRow,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: classes(skill_card_module_default.workspaceValue, field.kind === "invalid" ? skill_card_module_default.workspaceValueInvalid : void 0),
						"data-workspace-field": field.kind,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: skill_card_module_default.workspaceLeaf,
							"data-workspace-leaf": "",
							children: field.kind === "missing" ? t("skillCardWorkspaceNotSet") : field.leaf
						}), field.kind === "missing" ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: skill_card_module_default.workspacePath,
							"data-workspace-path": "",
							title: field.path,
							children: field.path
						})]
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
						variant: "ghost",
						size: "sm",
						disabled: !view.canChooseWorkspace,
						onClick: onChooseWorkspace,
						"data-workspace-pick": "",
						children: t("skillCardChooseDirectory")
					})]
				}),
				field.kind === "invalid" && field.checked ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
					className: skill_card_module_default.fieldNote,
					"data-workspace-invalid": "",
					children: t("skillCardProblemWorkspaceInvalid")
				}) : null,
				view.canChooseWorkspace ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
					className: skill_card_module_default.fieldNote,
					"data-workspace-picker-unavailable": "",
					children: t("skillCardWorkspacePickerUnavailable")
				})
			] });
		}
		/**
		* Say what the catalog is doing, when it is not quietly ready with options.
		* @param view - the card view.
		* @param optionCount - how many invocable skills the catalog holds.
		* @param t - translator.
		* @returns the notice, or null when there is nothing to say.
		*/
		function catalogNotice(view, optionCount, t) {
			if (view.catalogStatus === "loading" || view.catalogStatus === "idle") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				className: skill_card_module_default.noticeBody,
				children: t("skillCardCatalogLoading")
			});
			if (view.catalogStatus === "failed") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				className: skill_card_module_default.noticeBody,
				children: t(view.catalogFailure === "session-not-live" ? "skillCardNoSession" : "skillCardCatalogFailed")
			});
			if (view.catalogStatus === "ready" && optionCount === 0) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				className: skill_card_module_default.noticeBody,
				children: t("skillCardCatalogEmpty")
			});
			return null;
		}
		/**
		* Choose the message for one refusal.
		* @param code - the refusal code.
		* @returns the locale key. Exhaustive over the code union.
		*/
		function violationKey(code) {
			return VIOLATION_KEYS[code];
		}
		/**
		* Locale key for every refusal the analyser can report.
		*
		* A record rather than a lookup with a fallback, so a new refusal code fails
		* compilation here until it has copy. The five content-policy keys come from the shared
		* record because the result editor reports the same five over a fragment.
		*/
		var VIOLATION_KEYS = {
			...CONTENT_VIOLATION_KEYS,
			"region-missing": "skillCardViolationRegionMissing",
			"region-unclosed": "skillCardViolationRegionUnclosed",
			"region-repeated": "skillCardViolationRegionRepeated",
			"placeholder-syntax": "skillCardViolationPlaceholder",
			"action-declaration-duplicate": "skillCardViolationActionDuplicate",
			"action-key-invalid": "skillCardViolationActionKey",
			"action-key-repeated": "skillCardViolationActionKeyRepeated",
			"action-target-invalid": "skillCardViolationActionTarget",
			"actions-inside-region": "skillCardViolationActionInsideRegion"
		};
		//#endregion
		//#region src/client/skill-card/scroll-hold.ts
		/** The overflow values that make an element a scroller. */
		var SCROLLING = /^(auto|scroll|overlay)$/u;
		/**
		* The furthest a box can be scrolled.
		* @param box - the box.
		* @returns its maximum offset, never negative.
		*/
		function maxScroll(box) {
			return Math.max(0, box.scrollHeight - box.clientHeight);
		}
		/**
		* Find the box whose scroll position moves the given element.
		*
		* The workbench renders inside whatever shell container the product uses, and that container
		* — not the window — is what scrolls. Walking up from an element of the page finds it without
		* the page having to know which shell it is in.
		* @param element - any element of the page.
		* @returns the nearest scrolling ancestor, the document's own scrolling element as a
		* fallback, or the document element when nothing above the element scrolls.
		*/
		function scrollBoxOf(element) {
			const view = element?.ownerDocument.defaultView ?? null;
			if (view === null) return null;
			let node = element?.parentElement ?? null;
			while (node !== null) {
				if (SCROLLING.test(view.getComputedStyle(node).overflowY) && node.scrollHeight > node.clientHeight) return node;
				node = node.parentElement;
			}
			return element?.ownerDocument.scrollingElement ?? element?.ownerDocument.documentElement ?? null;
		}
		/**
		* Record where the reader is, and what they are looking at.
		* @param element - any element of the page, used to find the scrolling box.
		* @param anchor - the element whose place on screen should be kept, if it is on screen.
		* @returns the hold, or undefined when nothing scrolls.
		*/
		function holdScroll(element, anchor) {
			const box = scrollBoxOf(element);
			if (box === null) return void 0;
			const measured = anchor === null ? void 0 : anchor.getBoundingClientRect().top;
			return {
				box,
				offset: box.scrollTop,
				...measured === void 0 || Number.isNaN(measured) ? {} : { anchorTop: measured }
			};
		}
		/**
		* Where the box should be scrolled so the anchor sits where it did.
		*
		* Working from the anchor's own position rather than from the saved offset is what makes this
		* correct when the content above the anchor changed height while the view was away — an edit
		* that made the document taller must scroll further, not the same distance.
		* @param current - the box's offset now, after the browser clamped it.
		* @param anchorNow - the anchor's distance from the top of the window now.
		* @param anchorHeld - the same distance when the hold was taken.
		* @param limit - the box's maximum offset.
		* @returns the offset to write, inside the box's range.
		*/
		function anchoredOffset(current, anchorNow, anchorHeld, limit) {
			const wanted = current + (anchorNow - anchorHeld);
			return Math.min(Math.max(0, wanted), Math.max(0, limit));
		}
		/**
		* Put the reader back where the hold was taken.
		*
		* Written through the box rather than through `window`, and clamped: the browser's own clamp
		* ran while the page was short, so the offset that comes back may be larger than the current
		* content allows.
		*
		* The correction is computed from the offset the page was *found* at, not from whatever the
		* box holds now, so applying it twice is the same as applying it once. That matters because
		* the caller applies it again on the next frame — the document may still be growing — and a
		* second pass that added the anchor's movement to the already-restored offset would scroll
		* twice as far.
		* @param hold - the hold, when there was one.
		* @param anchor - the same element that was anchored, now that it is back on screen.
		* @param clamped - the offset the box was found at, when the caller has already read it.
		* @returns whether the anchor is now where the hold recorded it. False means this was not the
		* box that moves the page — the shell scrolls something this page could not find, or a box that
		* cannot reach that far — and the caller should ask the browser to bring the anchor into view
		* instead. The test is the anchor's own position rather than the box's offset, because a box
		* that never scrolls accepts any offset written to it and then stays at zero.
		*/
		function releaseScroll(hold, anchor, clamped) {
			if (hold === void 0) return false;
			const { box } = hold;
			const limit = maxScroll(box);
			const from = clamped ?? box.scrollTop;
			const measured = anchor === null || hold.anchorTop === void 0 ? void 0 : anchor.getBoundingClientRect().top;
			const target = measured === void 0 || Number.isNaN(measured) ? hold.offset : anchoredOffset(from, measured, hold.anchorTop, limit);
			box.scrollTop = Math.min(Math.max(0, target), limit);
			if (anchor === null) return true;
			if (hold.anchorTop === void 0) return false;
			const settled = anchor.getBoundingClientRect().top;
			return Number.isNaN(settled) || Math.abs(settled - hold.anchorTop) <= 1;
		}
		/**
		* Ask the browser to bring an element into view, whichever container actually scrolls it.
		*
		* The fallback for a page that could not find the box the shell scrolls: this works through
		* whatever ancestor — or portal — the element really lives in, and does nothing when it is
		* already on screen.
		* @param anchor - the element to bring into view.
		*/
		function revealAnchor(anchor) {
			if (anchor === null) return;
			if (typeof anchor.scrollIntoView !== "function") return;
			anchor.scrollIntoView({
				block: "nearest",
				inline: "nearest"
			});
		}
		//#endregion
		//#region src/client/skill-card/SkillCardPages.tsx
		/**
		* The two full-panel views one skill card opens into.
		*
		* A card is an index entry: its face carries the name, the skill, and the way into
		* configuration. The result and the configuration each take the whole display
		* column, because both are wider than a grid cell: the result is arbitrary HTML the
		* user authored, and the configuration is a name field, a skill picker, a template
		* editor, a field list, and a preview.
		*
		* Each page builds its own card controller rather than receiving one. That is what
		* makes the hook call legal: a page is mounted only while it is the current view,
		* so the controller runs only for the card on screen.
		* @module dsh-workbench/client/skill-card/SkillCardPages
		*/
		/**
		* The head the three full-panel views share.
		*
		* Tiered rather than one row. The way back sits above the title, so the title and
		* everything under it — the facts, the composer, the run history — begin on the page's
		* one left edge; inline, the back control indented the heading and every row below it
		* started somewhere else.
		* @param props - the way back, the title, and the view's facts.
		* @returns the head.
		*/
		function PageHead({ onBack, title, meta, t }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
				className: skill_card_module_default.pageHead,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: skill_card_module_default.pageHeadBar,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							variant: "ghost",
							size: "sm",
							icon: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronLeftOutlineRegular, {}),
							onClick: onBack,
							children: t("skillCardBack")
						})
					}),
					title === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
						className: skill_card_module_default.pageHeadTitle,
						children: title
					}),
					meta === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: skill_card_module_default.pageHeadMeta,
						children: meta
					})
				]
			});
		}
		/**
		* The heading one day's runs sit under.
		*
		* The two days a user is most likely to be reading get words; every other day is its own
		* date, because a list that says "10-25" for a run from last year says nothing.
		* @param at - any moment on that day.
		* @param t - translator.
		* @returns 今天, 昨天, or `YYYY-MM-DD`.
		*/
		function runDayLabel(at, t) {
			const key = dayKey(at);
			const now = Date.now();
			if (key === dayKey(now)) return t("runHistoryDayToday");
			if (key === dayKey(now - 864e5)) return t("runHistoryDayYesterday");
			return key;
		}
		/**
		* Split the newest-first run list into the days its rows completed on.
		* @param runs - the card's stored runs, newest first.
		* @returns one group per day, newest day first; a day with no run is absent.
		*/
		function groupRunsByDay(runs) {
			const groups = [];
			for (const run of runs) {
				const key = dayKey(run.executedAt);
				const last = groups[groups.length - 1];
				if (last === void 0 || last.key !== key) {
					groups.push({
						key,
						at: run.executedAt,
						runs: [run]
					});
					continue;
				}
				last.runs.push(run);
			}
			return groups;
		}
		/**
		* The outcome word one settled run shows in the history list.
		*
		* The same outcomes the turn-process header names, so the list and the detail never
		* disagree about what a run became.
		*
		* The record's own verdict comes first. A run the Host stopped at its deadline reports
		* `aborted` from the seam, which is true of the child and false of the run: nobody cancelled
		* it. The record carries the verdict the page can act on.
		* @param record - the stored record.
		* @param t - translator.
		* @returns the localized outcome word.
		*/
		function runOutcomeText(record, t) {
			const { stopReason } = record;
			return stopReason === "running" ? t("runHistoryRunning") : record.failure !== void 0 ? t("runActivityFailed") : stopReason === "aborted" ? t("runActivityStopped") : stopReason === "error" || stopReason === "failed" ? t("runActivityFailed") : t("runActivityCompleted");
		}
		/**
		* State one bare run's progress or verdict.
		*
		* Only the verdict travels, because there is nothing else to show: no structured value
		* and no output text are kept for a bare run.
		* @param bare - the bare run's state.
		* @param t - translator.
		* @returns the one line to show.
		*/
		function bareRunText(bare, t) {
			if (bare.phase === "running") return t("bareRunRunning", { skill: bare.skill });
			const head = bare.ok ? t("bareRunDone") : t("bareRunFailed");
			return bare.diagnostic === void 0 ? head : `${head} · ${bare.diagnostic}`;
		}
		/**
		* Render one action problem.
		* @param problem - what went wrong.
		* @param t - translator.
		* @returns the alert.
		*/
		function ActionProblemLine({ problem, t }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("p", {
				className: skill_card_module_default.runProblem,
				role: "alert",
				"data-action-problem": problem.code,
				children: [
					t(actionProblemKey(problem.code)),
					problem.detail === void 0 ? "" : ` · ${problem.detail}`,
					problem.candidates.length === 0 ? "" : ` · ${t("actionCandidates", { names: problem.candidates.join(", ") })}`
				]
			});
		}
		/**
		* Render the in-place confirmation panel.
		*
		* It replaces the card's display area rather than opening a dialog: the shared
		* primitives expose no dialog, and the editor already works the same way. The three
		* facts are fixed and ordered, and the payload is a text node — it came from a model,
		* and it is shown whole, because it is the only thing standing between that model's
		* data and the next run.
		* @param props - the pending action, the translator, and the two decisions.
		* @returns the panel.
		*/
		function ActionPanel({ pending, t, onConfirm, onCancel }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				className: skill_card_module_default.actionPanel,
				"aria-label": t("actionPanelTitle"),
				"data-action-panel": "",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("dl", {
					className: skill_card_module_default.actionFacts,
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("actionFieldTarget") }),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", {
							"data-action-field": "target",
							children: pending.target.kind === "card" ? t("actionTargetCard", { name: pending.target.name }) : t("actionTargetSkill", { name: pending.target.name })
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("actionFieldSkill") }),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", {
							"data-action-field": "skill",
							children: pending.skill
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("actionFieldPayload") }),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", {
							"data-action-field": "payload",
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("pre", {
								className: skill_card_module_default.actionPayload,
								children: JSON.stringify(pending.payload, null, 2)
							})
						})
					]
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: skill_card_module_default.settingsActions,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
						variant: "primary",
						size: "sm",
						onClick: onConfirm,
						"data-action-confirm": "",
						children: t("actionConfirm")
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
						variant: "ghost",
						size: "sm",
						onClick: onCancel,
						"data-action-cancel": "",
						children: t("actionCancel")
					})]
				})]
			});
		}
		/**
		* The selector's label for each way of changing the result.
		*
		* A record rather than a chain of comparisons, so a fourth way fails compilation here
		* until it has copy in both dictionaries.
		*/
		var CHANGE_LABELS = {
			revise: "resultReviseMode",
			fresh: "resultFreshMode",
			edit: "skillCardResultEdit"
		};
		/**
		* Render this session's revision log, and why the last revision was refused.
		*
		* It stays on the page rather than inside the dialog the ask is written in: the log is a
		* record of what the document already went through, and a reader deciding what to say next
		* wants to read it while the document is in front of them. It reads as a conversation — the
		* instruction, then when it was applied — because that is the order the two were said in.
		* @param props - the card view, the translator, and the one step back.
		* @returns the log, or nothing when this session has changed nothing.
		*/
		function RefineHistory({ view, t, onUndo }) {
			if (view.refineProblem === void 0 && view.refinements.length === 0 && view.previous === void 0) return null;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: skill_card_module_default.refineLog,
				"data-refine-log": "",
				children: [view.refineProblem === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("p", {
					className: skill_card_module_default.composerProblem,
					role: "alert",
					"data-refine-problem": view.refineProblem.code,
					children: [t(problemKey(view.refineProblem.code)), view.refineProblem.detail === void 0 || view.refineProblem.detail === "" ? "" : ` · ${view.refineProblem.detail}`]
				}), view.refinements.length === 0 && view.previous === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: skill_card_module_default.refineLogHead,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: skill_card_module_default.refineLogTitle,
							children: t("refineLogCount", { count: view.refinements.length })
						}), view.previous === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							variant: "ghost",
							size: "sm",
							onClick: onUndo,
							"data-refine-undo": "",
							children: t("refineUndo")
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("ol", {
						className: skill_card_module_default.refineLogList,
						children: view.refinements.map((entry, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", {
							className: skill_card_module_default.refineLogItem,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: skill_card_module_default.refineLogInstruction,
								children: entry.instruction
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: skill_card_module_default.refineLogTime,
								children: clockText(entry.at)
							})]
						}, `${String(entry.at)}-${String(index)}`))
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: skill_card_module_default.refineLogNote,
						children: t("refineSessionOnly")
					})
				] })]
			});
		}
		/**
		* The dialog a revision's sentence is written in.
		*
		* The block under the document offers the three ways of changing it as three quiet controls;
		* the two that need a sentence take it here, where there is room to write one and the
		* document stays behind the panel instead of the page jumping to make space for a field.
		* @param props - the translator, whether the card is busy, and the two ways out.
		* @returns the dialog.
		*/
		function RevisePrompt({ t, busy, onRefine, onCancel }) {
			const [instruction, setInstruction] = (0, react.useState)("");
			const empty = instruction.trim() === "";
			const submit = () => {
				if (empty || busy) return;
				onRefine(instruction);
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(PromptDialog, {
				title: t("resultReviseMode"),
				hint: t("promptReviseHint"),
				submitLabel: t("refineAction"),
				submitDisabled: empty,
				cancelLabel: t("skillCardCancel"),
				closeLabel: t("promptClose"),
				busy,
				onCancel,
				onSubmit: submit,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(InstructionField, {
					className: skill_card_module_default.dialogField,
					value: instruction,
					onChange: setInstruction,
					rows: Math.min(4, Math.max(2, instruction.split("\n").length)),
					placeholder: t("refinePlaceholder"),
					ariaLabel: t("refinePlaceholder"),
					submitOn: "enter",
					onSubmit: submit,
					focus: true
				})
			});
		}
		/**
		* Render the card's run history in the whole display column.
		*
		* Every card opens here first: the list names each run and its outcome, newest first,
		* and a row opens that run's result. No run starts from this page — starting one is an
		* action on the card, and the card's face in the grid carries it — but a run in flight is
		* stopped from its own row, because the row is what names it.
		* @param props - transport, card identity, session resolver, title fallback, back, and `t`.
		* @returns the run history page.
		*/
		function SkillCardRunsPage(props) {
			const { api, cardId, runSessionId, pickerSessionId, models, workspacePicker, fallbackTitle, onBack, openCard, t } = props;
			const cardTitle = (0, react.useCallback)((id, name) => cardFaceTitle({
				cardId: id,
				name
			}, t), [t]);
			const { view, actions } = useSkillCard({
				api,
				cardId,
				session: runSessionId,
				...pickerSessionId === void 0 ? {} : { pickerSession: pickerSessionId },
				models,
				workspacePicker,
				openCard,
				watchRun: true,
				cardTitle
			});
			const newest = view.runs[0];
			const ordinalOf = new Map(view.runs.map((run, index) => [run.runId, view.runs.length - index]));
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				className: skill_card_module_default.pageView,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(PageHead, {
						onBack,
						title: view.name ?? fallbackTitle,
						t,
						meta: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
							view.skill === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: skill_card_module_default.pageHeadChip,
								children: view.skill
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: skill_card_module_default.runHistoryCount,
								"data-run-history-count": "",
								children: t("runHistoryCount", { count: view.runs.length })
							}),
							newest === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: skill_card_module_default.runHistoryCount,
								children: t("runHistoryLatest", { time: latestRunText(newest.executedAt) })
							})
						] })
					}),
					view.modelField.kind === "unavailable" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: skill_card_module_default.runProblem,
						"data-run-model-unavailable": "",
						children: t("skillCardModelUnavailable")
					}) : null,
					view.workspaceField.kind === "missing" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: skill_card_module_default.runProblem,
						"data-run-workspace-missing": "",
						children: t(problemKey("workspace-missing"))
					}) : null,
					view.workspaceField.kind === "invalid" && view.workspaceField.checked ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("p", {
						className: skill_card_module_default.runProblem,
						"data-run-workspace-invalid": "",
						children: [t(problemKey("workspace-invalid")), ` · ${view.workspaceField.path}`]
					}) : null,
					view.runUnavailable === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: skill_card_module_default.runProblem,
						"data-run-unavailable": "",
						children: t(problemKey(view.runUnavailable.code))
					}),
					view.problem === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("p", {
						className: skill_card_module_default.runProblem,
						role: "alert",
						"data-run-problem": view.problem.code,
						children: [t(problemKey(view.problem.code)), view.problem.detail === "" ? "" : ` · ${view.problem.detail}`]
					}),
					view.bareRun === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: skill_card_module_default.bareRun,
						"data-bare-run": view.bareRun.phase,
						children: bareRunText(view.bareRun, t)
					}),
					view.runs.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: skill_card_module_default.runHistoryEmpty,
						"data-run-history-empty": "",
						children: t("runHistoryEmpty")
					}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: skill_card_module_default.runHistoryList,
						"data-run-history-list": "",
						children: groupRunsByDay(view.runs).map((group) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
							className: skill_card_module_default.runHistoryGroup,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: skill_card_module_default.runHistoryDay,
								"data-run-history-day": "",
								children: runDayLabel(group.at, t)
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ol", {
								className: skill_card_module_default.runHistoryItems,
								children: group.runs.map((run) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(RunHistoryRow, {
									run,
									ordinal: ordinalOf.get(run.runId) ?? 1,
									t,
									onOpen: () => {
										openCard(cardId, "result", run.runId);
									},
									...run.stopReason === "running" ? { onStop: () => {
										actions.cancelRun(run.runId);
									} } : {}
								}, run.runId))
							})]
						}, group.key))
					})
				]
			});
		}
		/**
		* One row of the run history: what the run produced, then the facts that tell it apart
		* from the runs around it, and its outcome on the right.
		*
		* The content comes first because that is what a reader scans for; the moment, the route,
		* and the run's place in the card's history are the second line, because they separate
		* two runs of one task from each other and nothing more. The outcome sits opposite as a
		* quiet dot and word — the list's rows are mostly the same outcome, so an equal-weight
		* word on every row would be seven copies of "已完成" competing with the seven titles.
		*
		* The row is a button because the whole row is the way in. Never disabled: a stored run
		* is read-only, and the row of a run in flight opens that run's live view.
		* @param props - the run, its ordinal, the translator, and the open action.
		* @returns the row.
		*/
		function RunHistoryRow({ run, ordinal, t, onOpen, onStop }) {
			const headline = resultHeadline(resultHtml(run.structured) ?? "");
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("li", {
				className: skill_card_module_default.runHistoryItem,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: skill_card_module_default.runHistoryRow,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
						type: "button",
						className: skill_card_module_default.runHistoryOpen,
						onClick: onOpen,
						"data-run-history-row": "",
						"data-run-outcome": run.stopReason,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							className: skill_card_module_default.runHistoryBody,
							children: [
								headline === void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: skill_card_module_default.runHistoryTitle,
									"data-empty": "true",
									"data-run-history-nothing": "",
									children: t("runHistoryNoContent")
								}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: skill_card_module_default.runHistoryTitle,
									"data-run-history-summary": "",
									children: headline
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									className: skill_card_module_default.runHistoryMeta,
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: skill_card_module_default.runHistoryTime,
											"data-run-history-time": "",
											children: runClockText(run.executedAt)
										}),
										run.model === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: skill_card_module_default.runHistoryModel,
											children: run.model.model
										}),
										ordinal <= 1 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: skill_card_module_default.runHistoryOrdinal,
											children: t("runHistoryOrdinal", { n: ordinal })
										}),
										run.editedAt === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: skill_card_module_default.runHistoryEdited,
											"data-run-history-edited": "",
											children: t("runHistoryEdited")
										})
									]
								}),
								run.instruction === void 0 || run.instruction === "" ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: skill_card_module_default.runHistoryInstruction,
									"data-run-history-instruction": "",
									children: t("runHistoryInstruction", { text: run.instruction })
								})
							]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							className: skill_card_module_default.runHistorySide,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: skill_card_module_default.runHistoryOutcome,
								"data-run-history-outcome": "",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: skill_card_module_default.runHistoryDot,
									"aria-hidden": "true"
								}), runOutcomeText(run, t)]
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: skill_card_module_default.runHistoryChevron,
								"aria-hidden": "true",
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronRightOutlineRegular, {})
							})]
						})]
					}), onStop === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: skill_card_module_default.runHistoryStop,
						onClick: onStop,
						"data-run-history-stop": "",
						children: t("refineStop")
					})]
				})
			});
		}
		/**
		* Render the card's result in the whole display column, with its run control.
		* @param props - transport, card identity, session resolver, title fallback, back, and `t`.
		* @returns the result page.
		*/
		function SkillCardResultPage(props) {
			const { api, cardId, runSessionId, pickerSessionId, models, workspacePicker, fallbackTitle, onBack, openCard, t, documents } = props;
			const cardTitle = (0, react.useCallback)((id, name) => cardFaceTitle({
				cardId: id,
				name
			}, t), [t]);
			const { view, actions } = useSkillCard({
				api,
				cardId,
				...props.runId === void 0 ? {} : { runId: props.runId },
				session: runSessionId,
				...pickerSessionId === void 0 ? {} : { pickerSession: pickerSessionId },
				models,
				workspacePicker,
				openCard,
				watchRun: true,
				cardTitle
			});
			const cardRunning = view.run?.phase === "running";
			const running = cardRunning && (view.run === void 0 || view.runId === void 0 || view.result === void 0 || view.result?.runId === runIdOf(view.run));
			const bareRunning = view.bareRun?.phase === "running";
			const busy = cardRunning || bareRunning;
			const refinable = resultHtml(view.result?.structured) !== void 0;
			const trace = view.result?.activity ?? [];
			const traceable = !busy && trace.length > 0;
			const [openTraceOf, setOpenTraceOf] = (0, react.useState)(void 0);
			const traceOpen = traceable && view.result !== void 0 && openTraceOf === view.result.runId;
			const [prompt, setPrompt] = (0, react.useState)(void 0);
			const editable = view.result !== void 0 && !busy;
			const [editing, setEditing] = (0, react.useState)(false);
			const pageRoot = (0, react.useRef)(null);
			const actBlock = (0, react.useRef)(null);
			const heldScroll = (0, react.useRef)(void 0);
			const openEditor = () => {
				heldScroll.current = holdScroll(pageRoot.current, actBlock.current);
				setEditing(true);
			};
			const wasEditing = (0, react.useRef)(editing);
			const restoreFrame = (0, react.useRef)(void 0);
			const restoreTimer = (0, react.useRef)(void 0);
			(0, react.useLayoutEffect)(() => {
				const exited = !editing && wasEditing.current;
				wasEditing.current = editing;
				if (!exited) return;
				const held = heldScroll.current;
				heldScroll.current = void 0;
				if (held === void 0) return;
				const clamped = held.box.scrollTop;
				const restore = () => {
					releaseScroll(held, actBlock.current, clamped);
					revealAnchor(actBlock.current);
				};
				let passes = 0;
				const pass = () => {
					restore();
					passes += 1;
					if (passes >= 3 || typeof requestAnimationFrame !== "function") return;
					restoreFrame.current = requestAnimationFrame(pass);
				};
				pass();
				restoreTimer.current = setTimeout(restore, 120);
			}, [editing]);
			(0, react.useLayoutEffect)(() => () => {
				if (restoreTimer.current !== void 0) {
					clearTimeout(restoreTimer.current);
					restoreTimer.current = void 0;
				}
				if (restoreFrame.current === void 0 || typeof cancelAnimationFrame !== "function") return;
				cancelAnimationFrame(restoreFrame.current);
				restoreFrame.current = void 0;
			}, [editing]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				className: skill_card_module_default.pageView,
				ref: pageRoot,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(PageHead, {
						onBack,
						title: view.name ?? fallbackTitle,
						t,
						meta: view.skill === void 0 ? void 0 : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: skill_card_module_default.pageHeadChip,
							children: view.skill
						})
					}),
					view.problem === void 0 || view.refineProblem !== void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("p", {
						className: skill_card_module_default.runProblem,
						role: "alert",
						"data-run-problem": view.problem.code,
						children: [t(problemKey(view.problem.code)), view.problem.detail === "" ? "" : ` · ${view.problem.detail}`]
					}),
					view.actionProblem === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ActionProblemLine, {
						problem: view.actionProblem,
						t
					}),
					view.bareRun === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: skill_card_module_default.bareRun,
						"data-bare-run": view.bareRun.phase,
						children: bareRunText(view.bareRun, t)
					}),
					view.pendingAction === void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(react_jsx_runtime.Fragment, { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("section", {
						className: skill_card_module_default.resultSurface,
						"data-result-surface": "",
						children: editing ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SkillCardResultEditor, {
							html: resultHtml(view.result?.structured) ?? "",
							t,
							onSave: async (html) => {
								if (await actions.saveResultEdit(html)) setEditing(false);
							},
							onCancel: () => {
								setEditing(false);
							}
						}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							"data-result-busy": running ? "true" : "false",
							"aria-busy": running ? true : void 0,
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SkillCardBody, {
								view,
								cardId,
								t,
								onAction: actions.click,
								documents
							})
						})
					}) }) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ActionPanel, {
						pending: view.pendingAction,
						t,
						onConfirm: actions.confirmAction,
						onCancel: actions.cancelAction
					}),
					editing ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						className: skill_card_module_default.actBlock,
						ref: actBlock,
						"data-result-composer": "",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: skill_card_module_default.actRow,
								role: "group",
								"aria-label": t("resultChangeLabel"),
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
										type: "button",
										className: skill_card_module_default.actAction,
										"data-change-mode": "revise",
										disabled: !refinable || busy,
										onClick: () => {
											setPrompt("revise");
										},
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconEditOutlineRegular, { size: 14 }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t(CHANGE_LABELS.revise) })]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
										type: "button",
										className: skill_card_module_default.actAction,
										"data-change-mode": "fresh",
										disabled: busy ? false : bareRunning || !view.runnable,
										onClick: () => {
											if (busy) {
												actions.cancel();
												return;
											}
											if (view.instructionMode === "none") actions.run();
											else setPrompt("fresh");
										},
										children: [busy ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCloseOutlineMedium, { size: 14 }) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconPlayOutlineRegular, { size: 14 }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t(busy ? "skillCardCancel" : CHANGE_LABELS.fresh) })]
									}),
									editable ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
										type: "button",
										className: skill_card_module_default.actAction,
										"data-change-mode": "edit",
										"data-result-edit-start": "",
										onClick: openEditor,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCodeOutlineRegular, { size: 14 }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t(CHANGE_LABELS.edit) })]
									}) : null,
									traceable && view.result !== void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(RunTraceToggle, {
										trace,
										settled: {
											stopReason: view.result.stopReason,
											...view.result.failure === void 0 ? {} : { failure: view.result.failure }
										},
										open: traceOpen,
										onToggle: () => {
											setOpenTraceOf(traceOpen ? void 0 : view.result?.runId);
										},
										t
									}) : null
								]
							}),
							traceOpen ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(RunTraceList, {
								trace,
								t
							}) : null,
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(RefineHistory, {
								view,
								t,
								onUndo: actions.undoRefine
							})
						]
					}),
					prompt === "revise" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(RevisePrompt, {
						t,
						busy,
						onRefine: (instruction) => {
							actions.refine(instruction);
							setPrompt(void 0);
						},
						onCancel: () => {
							setPrompt(void 0);
						}
					}) : null,
					prompt === "fresh" && view.instructionMode !== "none" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(RunPrompt, {
						cardId,
						title: t("resultFreshMode"),
						mode: view.instructionMode,
						recent: view.recentInstructions,
						t,
						disabled: bareRunning || !view.runnable,
						onRun: (instruction) => {
							actions.run(instruction);
							setPrompt(void 0);
						},
						onCancel: () => {
							setPrompt(void 0);
						}
					}) : null,
					view.modelField.kind === "unavailable" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: skill_card_module_default.runProblem,
						"data-run-model-unavailable": "",
						children: t("skillCardModelUnavailable")
					}) : null,
					view.workspaceField.kind === "missing" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: skill_card_module_default.runProblem,
						"data-run-workspace-missing": "",
						children: t(problemKey("workspace-missing"))
					}) : null,
					view.workspaceField.kind === "invalid" && view.workspaceField.checked ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("p", {
						className: skill_card_module_default.runProblem,
						"data-run-workspace-invalid": "",
						children: [t(problemKey("workspace-invalid")), ` · ${view.workspaceField.path}`]
					}) : null,
					view.runUnavailable === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: skill_card_module_default.runProblem,
						"data-run-unavailable": "",
						children: t(problemKey(view.runUnavailable.code))
					})
				]
			});
		}
		/**
		* Render the card's configuration in the whole display column.
		*
		* The head is the way back and nothing else. The card's name and skill were repeated
		* here *and* in the fields below, which made the page state the same two facts twice
		* and the head's copy the one that could not be edited. Removing the card lives in the
		* footer instead, apart from the controls a user presses without reading.
		* @param props - transport, card identity, session resolver, title fallback, back, and `t`.
		* @returns the configuration page.
		*/
		function SkillCardConfigPage(props) {
			const { api, cardId, runSessionId, pickerSessionId, models, workspacePicker, onBack, t } = props;
			const cardTitle = (0, react.useCallback)((id, name) => cardFaceTitle({
				cardId: id,
				name
			}, t), [t]);
			const { view, actions } = useSkillCard({
				api,
				cardId,
				session: runSessionId,
				...pickerSessionId === void 0 ? {} : { pickerSession: pickerSessionId },
				models,
				workspacePicker,
				withCatalog: true,
				cardTitle
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				className: skill_card_module_default.pageView,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(PageHead, {
					onBack,
					t,
					title: cardTitle(cardId, view.name),
					meta: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("skillCardSettings") }),
						view.skill === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: skill_card_module_default.pageHeadChip,
							children: view.skill
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t(permissionLabelKey(view.permission)) })
					] })
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SkillCardSettings, {
					view,
					t,
					onChoose: actions.chooseSkill,
					onChooseModel: actions.chooseModel,
					onChoosePermission: actions.choosePermission,
					onChooseInstructionMode: actions.chooseInstructionMode,
					onChooseWorkspace: actions.chooseWorkspace,
					onSave: actions.saveTemplate,
					onRename: actions.rename,
					onClose: onBack,
					onDelete: () => {
						actions.remove().then(onBack);
					}
				}, view.skill ?? "")]
			});
		}
		/**
		* Choose the message for one action failure.
		* @param code - the failure code.
		* @returns the locale key. Exhaustive over the code union.
		*/
		function actionProblemKey(code) {
			return ACTION_PROBLEM_KEYS[code];
		}
		/**
		* Locale key for every reason a clicked action cannot run.
		*
		* A record rather than a lookup with a fallback, so a new code fails compilation here
		* until it has copy in both dictionaries.
		*/
		var ACTION_PROBLEM_KEYS = {
			"missing-action": "actionProblemMissingAction",
			"missing-payload": "actionProblemMissingPayload",
			"malformed-payload": "actionProblemMalformedPayload",
			"oversized-payload": "actionProblemOversizedPayload",
			"unknown-action": "actionProblemUnknownAction",
			"target-card-missing": "actionProblemCardMissing",
			"target-card-ambiguous": "actionProblemCardAmbiguous",
			"target-skill-missing": "actionProblemSkillMissing",
			"target-busy": "actionProblemBusy",
			"target-unavailable": "actionProblemUnavailable",
			"target-workspace-missing": "skillCardProblemWorkspaceMissing",
			"target-workspace-invalid": "skillCardProblemWorkspaceInvalid"
		};
		//#endregion
		//#region src/client/WorkbenchPage.tsx
		/**
		* The workbench panel page: its head, the card grid, and the two empty states.
		*
		* The page owns the layout controller and hands the grid plain data, so the
		* grid stays a rendering surface and the card shells stay independent of it.
		* @module dsh-workbench/client/WorkbenchPage
		*/
		/** Owner where a user-created card instance sorts before any stored position. */
		var INSTANCE_ORDER_BASE = 1e4;
		/**
		* Card types the workbench offers.
		*
		* Only the skill card creates anything today; the other two are listed so the user
		* can see they are planned rather than absent.
		*/
		var CARD_TYPE_SKILL = "skill";
		var CARD_TYPE_TEST = "test";
		var CARD_TYPE_MEMORY = "memory";
		/**
		* Read the cards out of a stored snapshot.
		* @param cards - the snapshot's card records.
		* @returns one entry per stored card.
		*/
		function storedCardsFrom(cards) {
			return cards.map((card) => ({
				id: card.cardId,
				name: card.name
			}));
		}
		/**
		* Render the workbench page.
		* @param props - owner props, card render share, injected cards and transport, and `t`.
		* @returns the page element.
		*/
		function WorkbenchPage(props) {
			const { useCards, useSelection, api, skillCards, closeCard, openCard, renderSlot, t, usePanelInfo } = props;
			const cards = useCards((snapshot) => snapshot);
			const selection = useSelection((snapshot) => snapshot);
			const active = usePanelInfo((info) => info.activePanelId === "workbench");
			const [stored, setStored] = (0, react.useState)([]);
			const [revision, setRevision] = (0, react.useState)("");
			const tickets = (0, react.useRef)(0);
			const applySnapshot = (0, react.useCallback)((snapshot) => {
				tickets.current += 1;
				setRevision(snapshot.revision);
				setStored(storedCardsFrom(snapshot.cards));
			}, []);
			const reloadInstances = (0, react.useCallback)(() => {
				tickets.current += 1;
				const mine = tickets.current;
				skillCards.api.read().then((result) => {
					if (result.status !== "ok" || tickets.current !== mine) return;
					applySnapshot(result.snapshot);
				});
			}, [applySnapshot, skillCards.api]);
			(0, react.useEffect)(() => {
				reloadInstances();
			}, [reloadInstances, selection]);
			const facts = (0, react.useMemo)(() => {
				const registered = cards.filter((card) => card.id !== SKILL_CARD_ID);
				const extra = stored.map((instance, index) => ({
					id: instance.id,
					order: INSTANCE_ORDER_BASE + index,
					label: instance.name ?? instance.id
				}));
				return [...registered, ...extra];
			}, [cards, stored]);
			const createCard = (0, react.useCallback)((type) => {
				if (type !== CARD_TYPE_SKILL) return;
				const taken = new Set(facts.map((card) => card.id));
				let index = 1;
				while (taken.has(`${SKILL_CARD_ID}-${String(index)}`)) index += 1;
				const cardId = `${SKILL_CARD_ID}-${String(index)}`;
				skillCards.api.write({
					baseRevision: revision,
					cardId,
					name: `${t("cardTypeSkill")} ${String(index)}`
				}).then((result) => {
					if (result.status !== "ok") return;
					applySnapshot(result.snapshot);
				});
			}, [
				applySnapshot,
				facts,
				revision,
				skillCards.api,
				t
			]);
			const cardTypes = (0, react.useMemo)(() => [
				{
					id: CARD_TYPE_SKILL,
					label: t("cardTypeSkill"),
					enabled: true
				},
				{
					id: CARD_TYPE_TEST,
					label: t("cardTypeTest"),
					enabled: false
				},
				{
					id: CARD_TYPE_MEMORY,
					label: t("cardTypeMemory"),
					enabled: false
				}
			], [t]);
			const { view, actions } = useWorkbenchLayout(facts, api, active);
			const labelOf = (0, react.useMemo)(() => {
				const labels = new Map(facts.map((card) => [card.id, card.label]));
				return (id) => {
					const label = labels.get(id);
					return label === void 0 || label.length === 0 ? id : label;
				};
			}, [facts]);
			const notice = view.write.phase === "failed" ? `${t("writeFailed")}${view.write.message === void 0 ? "" : ` · ${view.write.message === "merged" ? t("mergedElsewhere") : view.write.message}`}` : void 0;
			const registered = (0, react.useMemo)(() => new Set(cards.map((card) => card.id)), [cards]);
			const renderEntry = (id, owner) => registered.has(id) ? renderSlot("workbench.cards", owner, { only: id }) : renderSlot("workbench.cards", {
				...owner,
				cardId: id
			}, { only: SKILL_CARD_ID });
			const content = selection === void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(WorkbenchCardGrid, {
				view,
				actions,
				renderEntry,
				announce: (id, index) => t("announceMoved", {
					title: labelOf(id),
					index
				}),
				notice,
				onCardsChanged: reloadInstances,
				trailing: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(WorkbenchCreateCard, {
					types: cardTypes,
					onCreate: createCard,
					label: t("createCard"),
					unavailableLabel: t("createCardCancel")
				})
			}) : (() => {
				const page = {
					api: skillCards.api,
					cardId: selection.cardId,
					...selection.runId === void 0 ? {} : { runId: selection.runId },
					runSessionId: skillCards.runSessionId,
					...skillCards.pickerSessionId === void 0 ? {} : { pickerSessionId: skillCards.pickerSessionId },
					models: skillCards.models,
					workspacePicker: skillCards.workspacePicker,
					fallbackTitle: labelOf(selection.cardId),
					openCard,
					t,
					...skillCards.documents === void 0 ? {} : { documents: skillCards.documents },
					onBack: selection.view === "result" ? () => openCard(selection.cardId, "runs") : closeCard
				};
				if (selection.view === "result") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SkillCardResultPage, { ...page });
				if (selection.view === "runs") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SkillCardRunsPage, { ...page });
				return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SkillCardConfigPage, { ...page });
			})();
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: workbench_module_default.page,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("header", {
					className: workbench_module_default.pageHead,
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h1", {
						className: workbench_module_default.pageTitle,
						children: t("title")
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: workbench_module_default.pageIntro,
						children: t("subtitle")
					})] })
				}), content]
			});
		}
		//#endregion
		//#region src/client/WorkbenchPanelIcon.tsx
		/**
		* Render the workbench glyph at the size the sidebar asks for.
		* @param props - the sidebar's icon share: requested edge and whether the panel is selected.
		* @returns the icon element.
		*/
		function WorkbenchPanelIcon({ size }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconGaugeOutlineRegular, { size });
		}
		var card_module_default = {
			card: "_card_13mto_3",
			spanWide: "_spanWide_13mto_20",
			activatable: "_activatable_13mto_27",
			spanTall: "_spanTall_13mto_44",
			spanLarge: "_spanLarge_13mto_48",
			head: "_head_13mto_53",
			mark: "_mark_13mto_68",
			headRow: "_headRow_13mto_89",
			title: "_title_13mto_96",
			meta: "_meta_13mto_109",
			subtitle: "_subtitle_13mto_119",
			status: "_status_13mto_132",
			headActions: "_headActions_13mto_142",
			iconButton: "_iconButton_13mto_149",
			handle: "_handle_13mto_185",
			body: "_body_13mto_195",
			failure: "_failure_13mto_203",
			dragging: "_dragging_13mto_211"
		};
		//#endregion
		//#region src/client/WorkbenchCardShell.tsx
		/**
		* The shell every workbench card renders inside.
		*
		* The shell owns the frame, the reorder handle, and the removal action, so
		* every card looks and behaves alike. The card supplies its presentation facts
		* as props and its body as a local slot component.
		*
		* Two of those facts are opt-in: the status dot is drawn from `state` and the
		* refresh control from `onRefresh`, so a card that passes neither renders
		* neither — the shipped card renders its run state on its own result page
		* instead of on the card face.
		*
		* {@link WorkbenchCardShell} is the registered factory: it resolves the
		* framework seats and delegates to {@link WorkbenchCardShellView}, which takes
		* plain data so a component spec can drive it without render machinery.
		* @module dsh-workbench/client/WorkbenchCardShell
		*/
		/** The shared state dot's semantics, keyed by the card's own state union. */
		var STATE_DOT = {
			idle: "idle",
			ongoing: "ongoing",
			done: "done",
			warning: "warning",
			error: "error"
		};
		/** Locale key holding each state's label. */
		var STATE_KEY = {
			idle: "statusIdle",
			ongoing: "statusOngoing",
			done: "statusDone",
			warning: "statusWarning",
			error: "statusError"
		};
		/** Grid footprint class per span; `standard` keeps the auto-fill cell. */
		var SPAN_CLASS = {
			standard: void 0,
			wide: card_module_default.spanWide,
			tall: card_module_default.spanTall,
			large: card_module_default.spanLarge
		};
		/** Body rendered when a card selects no body component. */
		var EmptyBody = () => null;
		/** Hues the monogram may take, spread around the wheel. */
		var MARK_HUES = [
			8,
			34,
			62,
			96,
			140,
			172,
			198,
			226,
			250,
			276,
			300,
			330
		];
		/**
		* The monogram a card carries on its face.
		*
		* The first character of the title the user gave it: one glyph is what the eye picks out
		* of a grid before any word is read. Taken by code point so a CJK or an emoji name yields
		* one character rather than half of a surrogate pair.
		* @param title - the card's visible title.
		* @returns the mark's text.
		*/
		function cardMark(title) {
			const first = Array.from(title.trim())[0];
			return first === void 0 ? "·" : first.toUpperCase();
		}
		/**
		* The hue this card's mark uses.
		*
		* Derived from the card's identity, not its name, so renaming a card does not recolour
		* it — the colour is how it is recognised before the title is read.
		* @param id - the card's identity.
		* @returns a hue in degrees.
		*/
		function cardMarkHue(id) {
			let hash = 0;
			for (const character of id) hash = (hash * 31 + (character.codePointAt(0) ?? 0)) % 1e5;
			return MARK_HUES[hash % MARK_HUES.length] ?? MARK_HUES[0];
		}
		/**
		* Carry the mark's hue into the stylesheet.
		* @param hue - the hue in degrees.
		* @returns an inline style holding the custom property the sheet reads.
		*/
		function markStyle(hue) {
			return { "--wb-hue": String(hue) };
		}
		/** Actions rendered when a card selects no actions component. */
		var EmptyActions = () => null;
		/**
		* Render one card inside the shared shell.
		* @param props - card presentation facts and host callbacks.
		* @returns the card element.
		*/
		function WorkbenchCardShellView({ id, title, subtitle, span = "standard", state, status, failure, position, reorderable, dragging, body, actions, onRefresh, onActivate, onRemove, onMoveBy, onCancelDrag, t }) {
			const titleId = `workbench-card-${id}`;
			const statusText = status ?? (state === void 0 ? void 0 : t(STATE_KEY[state]));
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("article", {
				className: clsx(card_module_default.card, SPAN_CLASS[span], onActivate !== void 0 && card_module_default.activatable),
				style: markStyle(cardMarkHue(id)),
				"aria-labelledby": titleId,
				"data-card-id": id,
				"data-card-position": String(position),
				"data-dragging": dragging ? "" : void 0,
				role: onActivate === void 0 ? void 0 : "button",
				tabIndex: onActivate === void 0 ? void 0 : 0,
				onClick: onActivate,
				onKeyDown: onActivate === void 0 ? void 0 : (event) => {
					if (event.target !== event.currentTarget) return;
					if (event.key !== "Enter" && event.key !== " ") return;
					event.preventDefault();
					onActivate();
				},
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
					className: card_module_default.head,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: card_module_default.headRow,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: card_module_default.mark,
								"aria-hidden": "true",
								children: cardMark(title)
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", {
								className: card_module_default.title,
								id: titleId,
								children: title
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: card_module_default.headActions,
								onClick: (event) => {
									event.stopPropagation();
								},
								children: [
									actions,
									onRefresh !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
										variant: "ghost",
										size: "sm",
										className: card_module_default.iconButton,
										"aria-label": t("refreshAll"),
										onClick: onRefresh,
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconRefreshOutlineMedium, { size: 14 })
									}),
									onRemove !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
										variant: "ghost",
										size: "sm",
										className: card_module_default.iconButton,
										"data-workbench-remove": id,
										"aria-label": t("removeCard"),
										onClick: onRemove,
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCloseOutlineMedium, { size: 14 })
									}),
									reorderable && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
										variant: "ghost",
										size: "sm",
										className: clsx(card_module_default.iconButton, card_module_default.handle),
										"data-workbench-drag-handle": id,
										"aria-label": t("dragHandle"),
										"aria-pressed": dragging,
										onKeyDown: (event) => {
											if (event.key === "ArrowUp") {
												event.preventDefault();
												onMoveBy(-1);
											}
											if (event.key === "ArrowDown") {
												event.preventDefault();
												onMoveBy(1);
											}
											if (event.key === "Escape") {
												event.preventDefault();
												onCancelDrag();
											}
										},
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronsUpDownOutlineRegular, { size: 14 })
									})
								]
							})
						]
					}), subtitle === void 0 && statusText === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: card_module_default.meta,
						children: [subtitle === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: card_module_default.subtitle,
							children: subtitle
						}), statusText === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							className: card_module_default.status,
							children: [state !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.StateDot, { state: STATE_DOT[state] }), statusText]
						})]
					})]
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: card_module_default.body,
					children: failure === void 0 ? body : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: card_module_default.failure,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("cardFailed") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: failure })]
					})
				})]
			});
		}
		/**
		* Render one card through the framework's seats.
		* @param props - card presentation facts, occurrence props, and the shell's seats.
		* @returns the card element.
		*/
		function WorkbenchCardShell({ id, title, subtitle, span, state, status, onRefresh, onActivate, onRemove, failure, reorderable, position, useFactorySlot, t }) {
			const Body = useFactorySlot("body", EmptyBody);
			const Actions = useFactorySlot("actions", EmptyActions);
			const reorder = useWorkbenchReorder();
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(WorkbenchCardShellView, {
				id,
				title,
				subtitle,
				span,
				state,
				status,
				failure,
				position,
				reorderable: reorderable && reorder !== null,
				dragging: reorder?.dragging ?? false,
				body: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Body, {}),
				actions: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Actions, {}),
				onRefresh,
				onActivate,
				onRemove,
				onMoveBy: (delta) => {
					reorder?.moveBy(id, delta);
				},
				onCancelDrag: () => {
					reorder?.end(false);
				},
				t: (key) => t(key)
			});
		}
		//#endregion
		//#region src/client/index.ts
		/** Locale namespace owned by this plugin. */
		var NS = "workbench";
		/** Services the sidebar row, the panel, the layout read, and the skill card depend on. */
		var inject = [
			"slots",
			"locale",
			"layout",
			"sessions"
		];
		/**
		* Register the workbench panel, its sidebar entry, and the card assembly.
		* @param ctx - the browser plugin context.
		*/
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "workbench: dictionaries");
			const t = ctx.locale.bind(NS);
			const cards = (0, _deepseek_ai_dsh_client_store.createSnapshotStore)([]);
			const documents = createWorkbenchDocumentBinder({ t });
			const api = createWorkbenchLayoutApi();
			const skillCardApi = createWorkbenchSkillCardApi();
			const modelResolver = { current: void 0 };
			const models = createModelSeat(() => modelResolver.current);
			ctx.inject(["modelDirectories"], (scoped) => {
				modelResolver.current = scoped.modelDirectories;
				scoped.effect(() => () => {
					modelResolver.current = void 0;
				}, "workbench: model directory");
			});
			const workspaceUi = { current: void 0 };
			ctx.inject(["uiWorkspace"], (scoped) => {
				workspaceUi.current = scoped.uiWorkspace;
				scoped.effect(() => () => {
					workspaceUi.current = void 0;
				}, "workbench: workspace picker");
			});
			const workspacePicker = createWorkspacePicker(() => {
				const native = readDesktopPicker();
				const workspace = workspaceUi.current;
				return {
					...native === void 0 ? {} : { native },
					...workspace === void 0 ? {} : { workspace: () => workspace.pickDirectory() }
				};
			});
			const sessionList = ctx.sessions.list;
			const runSessionId = () => {
				const snapshot = sessionList.getSnapshot();
				return pickRunSession(snapshot.ids, snapshot.byId);
			};
			const pickerSession = createPickerSession(sessionList);
			const pickerSessionId = () => pickerSession.current();
			const selection = (0, _deepseek_ai_dsh_client_store.createSnapshotStore)(void 0);
			const openCard = (cardId, view, runId) => {
				selection.set({
					cardId,
					view,
					...runId === void 0 ? {} : { runId }
				});
			};
			const closeCard = () => {
				selection.set(void 0);
			};
			ctx.effect(() => ctx.slots.registerFactory({
				name: "workbench.card",
				scope: "root",
				locale: NS,
				slots: {
					body: { scope: "root" },
					actions: { scope: "root" }
				}
			}, WorkbenchCardShell), "workbench: card assembly");
			const syncCards = () => {
				const next = ctx.slots.entriesOfSlot("workbench.cards").map((entry) => ({
					id: entry.options.id,
					order: entry.options.order ?? 0,
					label: (0, _deepseek_ai_dsh_client_ui_slots.resolveSlotLabel)(entry.options.label) ?? ""
				}));
				const previous = cards.getSnapshot();
				if (previous.length === next.length && previous.every((card, index) => card.id === next[index]?.id && card.order === next[index]?.order && card.label === next[index]?.label)) return;
				cards.set(next);
			};
			ctx.effect(() => ctx.slots.subscribe("workbench.cards", syncCards), "workbench: card entries");
			ctx.effect(() => ctx.locale.subscribe(syncCards), "workbench: card labels");
			ctx.effect(() => {
				syncCards();
				return () => {
					cards.set([]);
				};
			}, "workbench: initial card projection");
			ctx.slots.inject("main", () => ctx.slots.register({
				name: "main",
				key: WORKBENCH_PANEL_ID,
				locale: NS,
				children: { "workbench.cards": {
					kind: "list",
					scope: "root"
				} },
				inject: () => ({
					hooks: {
						cards,
						selection
					},
					api,
					skillCards: {
						api: skillCardApi,
						runSessionId,
						pickerSessionId,
						models,
						workspacePicker,
						documents
					},
					closeCard,
					openCard
				})
			}, WorkbenchPage));
			ctx.slots.inject("sidebar.panellist", () => ctx.slots.register({
				name: "sidebar.panellist",
				id: WORKBENCH_PANEL_ID,
				order: 100,
				label: () => t("panel"),
				locale: NS
			}, WorkbenchPanelIcon));
			ctx.slots.inject("workbench.cards", () => ctx.slots.register({
				name: "workbench.cards",
				id: SKILL_CARD_ID,
				order: 200,
				label: () => t("skillCardTitle"),
				locale: NS,
				inject: () => ({
					api: skillCardApi,
					runSessionId,
					openCard
				})
			}, SkillCard));
		}
		//#endregion
		exports.NS = NS;
		exports.WORKBENCH_PANEL_ID = WORKBENCH_PANEL_ID;
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
