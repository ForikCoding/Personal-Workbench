window.__ModuleLoader__.load({
	id: "dsh-workbench",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
// The Loader never fetches a sibling stylesheet, so this one ships inside
// the factory and installs on first evaluation.
{
  const css = "/* Workbench page: a centred column with its head row and the card grid. */\n\n._page_14mdo_3 {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  gap: 24px;\n  box-sizing: border-box;\n  height: 100%;\n  overflow: auto;\n  padding: 0 clamp(24px, 4vw, 48px) 48px;\n  color: var(--dsw-alias-label-primary);\n}\n\n._page_14mdo_3 > * {\n  width: 100%;\n  max-width: 1200px;\n}\n\n._pageHead_14mdo_20 {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 16px;\n  box-sizing: border-box;\n  /* The page's top inset lives here so the strip above the content drags the window. */\n  padding-top: 28px;\n}\n\n[data-platform='darwin'] ._pageHead_14mdo_20 {\n  padding-top: calc(28px + var(--dsh-frame-top-clearance, 0px));\n}\n\n._pageTitle_14mdo_34 {\n  margin: 0;\n  font-size: 24px;\n  font-weight: 600;\n  line-height: 32px;\n  letter-spacing: -0.01em;\n}\n\n._pageIntro_14mdo_42 {\n  margin: 6px 0 0;\n  font-size: 13px;\n  line-height: 20px;\n  color: var(--dsw-alias-label-secondary);\n}\n\n._notice_14mdo_49 {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  font-size: 12px;\n  line-height: 18px;\n  color: var(--dsw-alias-label-secondary);\n}\n\n._empty_14mdo_58 {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  gap: 8px;\n  padding: 64px 16px;\n  text-align: center;\n}\n\n._emptyTitle_14mdo_67 {\n  margin: 0;\n  font-size: 15px;\n  font-weight: 500;\n  line-height: 22px;\n}\n\n._emptyBody_14mdo_74 {\n  margin: 0;\n  font-size: 13px;\n  line-height: 20px;\n  color: var(--dsw-alias-label-secondary);\n}\n\n._grid_14mdo_81 {\n  display: grid;\n  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));\n  gap: 24px;\n  align-content: start;\n}\n\n/* A cell is a one-track grid so whatever it holds fills it on both axes. A flex\n   container would size the child to its content along the main axis, which left the\n   cards narrow and the columns wide. */\n._cell_14mdo_91 {\n  display: grid;\n  min-width: 0;\n}\n\n._createRoot_14mdo_96 {\n  display: flex;\n  flex: 1 1 auto;\n  min-width: 0;\n}\n\n/* The creation entry is a grid tile, so it reads as the place cards come from\n   rather than as a toolbar action detached from the grid. */\n\n._createTile_14mdo_105 {\n  display: flex;\n  flex: 1 1 auto;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  gap: 10px;\n  box-sizing: border-box;\n  width: 100%;\n  min-height: 180px;\n  padding: 16px 18px;\n  border: 1px dashed var(--dsw-alias-border-l1);\n  border-radius: 12px;\n  background: transparent;\n  color: var(--dsw-alias-label-secondary);\n  cursor: pointer;\n  font-size: 13px;\n  transition: border-color 0.15s ease, background 0.15s ease, color 0.15s ease;\n}\n\n._createTile_14mdo_105:hover {\n  border-color: var(--dsw-alias-brand-primary);\n  border-style: solid;\n  background: var(--dsw-alias-bg-layer-2);\n  color: var(--dsw-alias-label-primary);\n}\n\n/* The mark is what turns the tile from \"empty slot\" into \"entry\". Without it the\n   dashed box reads as something that failed to load. */\n._createMark_14mdo_134 {\n  font-size: 20px;\n  line-height: 1;\n  color: var(--dsw-alias-label-tertiary);\n}\n\n._createTile_14mdo_105:hover ._createMark_14mdo_134 {\n  color: var(--dsw-alias-brand-primary);\n}\n\n._createTile_14mdo_105:focus-visible {\n  outline: 2px solid var(--dsw-alias-brand-primary);\n  outline-offset: 1px;\n}\n\n@media (max-width: 720px) {\n  ._grid_14mdo_81 {\n    grid-template-columns: 1fr;\n  }\n}\n/* Skill card content. The frame and the reorder/removal controls belong to the\n   shared shell, so this sheet styles only the body and the card's own actions. */\n\n._template_1qy1p_4 {\n  display: block;\n}\n\n._body_1qy1p_8 {\n  display: flex;\n  flex-direction: column;\n  min-width: 0;\n}\n\n._cardActions_1qy1p_14 {\n  display: inline-flex;\n  gap: 4px;\n}\n\n/* One full-panel view: the card's result or its configuration, in the whole\n   display column rather than a grid cell. */\n\n._pageView_1qy1p_22 {\n  display: flex;\n  flex-direction: column;\n  gap: 16px;\n  width: 100%;\n  min-width: 0;\n}\n\n._pageViewHead_1qy1p_30 {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  min-width: 0;\n}\n\n._pageViewTitle_1qy1p_37 {\n  margin: 0;\n  flex: 1 1 auto;\n  min-width: 0;\n  font-size: 16px;\n  font-weight: 500;\n  line-height: 24px;\n  overflow-wrap: anywhere;\n}\n\n._pageViewSubtitle_1qy1p_47 {\n  flex: none;\n  color: var(--dsw-alias-label-secondary);\n  font-size: 12px;\n  line-height: 18px;\n}\n\n._runProblem_1qy1p_54 {\n  margin: 0;\n  padding: 8px 10px;\n  border: 1px solid var(--dsw-alias-brand-primary);\n  border-radius: var(--dsw-radius-sm);\n  color: var(--dsw-alias-label-primary);\n  font-size: 12px;\n  line-height: 18px;\n}\n\n/* The hairline that separates the run's debug detail from the result above it. */\n._runOutput_1qy1p_65 {\n  border-top: 1px solid var(--dsw-alias-border-l1);\n  padding-top: 8px;\n}\n\n._runOutputSummary_1qy1p_70 {\n  cursor: pointer;\n  color: var(--dsw-alias-label-secondary);\n  font-size: 12px;\n}\n\n._runOutputLabel_1qy1p_76 {\n  margin: 8px 0 4px;\n  color: var(--dsw-alias-label-secondary);\n  font-size: 12px;\n}\n\n._runFacts_1qy1p_82 {\n  display: grid;\n  grid-template-columns: max-content 1fr;\n  gap: 2px 12px;\n  margin: 8px 0 0;\n  font-size: 12px;\n}\n\n._runFacts_1qy1p_82 dt {\n  color: var(--dsw-alias-label-secondary);\n}\n\n._runFacts_1qy1p_82 dd {\n  margin: 0;\n  overflow-wrap: anywhere;\n}\n\n._runPre_1qy1p_99 {\n  max-height: 320px;\n  margin: 0;\n  padding: 8px;\n  border: 1px solid var(--dsw-alias-border-l1);\n  border-radius: var(--dsw-radius-sm);\n  background: var(--dsw-alias-bg-layer-2);\n  overflow: auto;\n  font-family: monospace;\n  font-size: 12px;\n  white-space: pre-wrap;\n  overflow-wrap: anywhere;\n}\n\n/* The region HTML as the run produced it: real newlines, and long lines scroll rather\n   than fold. A folded tag reads as several lines of a different tag. */\n._runPreHtml_1qy1p_115 {\n  max-height: 320px;\n  margin: 0;\n  padding: 8px;\n  border: 1px solid var(--dsw-alias-border-l1);\n  border-radius: var(--dsw-radius-sm);\n  background: var(--dsw-alias-bg-layer-2);\n  overflow: auto;\n  font-family: monospace;\n  font-size: 12px;\n  white-space: pre;\n}\n\n/* The card's rendered document sits in its own frame. Without a border the template's\n   content reads as the page's own. Nothing inside it is styled here: the document is\n   the user's, inside its own shadow root.\n\n   The boundary rests on the padding alone: this surface carried a heading row with a\n   hairline under it until the product owner removed that row as noise, and what keeps\n   the rendered document — which brings its own shadow and radius — off the border is\n   now the 12px gutter around it. Lowering it would leave the document flush. */\n._resultSurface_1qy1p_136 {\n  display: flex;\n  flex-direction: column;\n  padding: 12px;\n  border: 1px solid var(--dsw-alias-border-l1);\n  border-radius: var(--dsw-radius-md);\n  min-width: 0;\n}\n\n/* The result's own editor, which takes the surface's content slot where the rendered\n   document was. Gaps rather than margins: the status line, the field, the refusals and the\n   two controls are one column of four things. */\n._resultEditor_1qy1p_148 {\n  display: flex;\n  flex-direction: column;\n  gap: 10px;\n  min-width: 0;\n}\n\n/* Revising the result is a sentence about what is on screen, so the composer sits\n   directly under it: field and send on one line, the log of what was already asked\n   below. */\n._composer_1qy1p_158 {\n  display: flex;\n  flex-direction: column;\n  gap: 8px;\n  min-width: 0;\n}\n\n/* The field grows upwards from one row and the regenerating control sits beside it, so\n   the control has to stay at the bottom edge rather than float beside the middle of a\n   four-row field. The gap is what keeps a disabled control reading as \"nothing written\n   yet\" instead of as part of the field. */\n._composerRow_1qy1p_169 {\n  display: flex;\n  align-items: flex-end;\n  gap: 8px;\n  min-width: 0;\n}\n\n/* Copied from the DeepSeek Harness Desktop chat composer rather than chosen, because\n   this is the same kind of input as the conversation's: `min-height: 36px` and\n   `padding: 4px 8px 0 14px` are `skeleton/InputBar.module.css` `.input` in\n   `@deepseek-ai/dsh-client-ui-conversation`, the radius is that file's `.card` value\n   `--dsw-radius-panel`, and the type is the card's own inherited\n   `var(--dsh-content-font-size, 14px)` over\n   `calc(24px + var(--dsh-content-font-delta, 0px))`.\n   The bottom inset is the one value restated rather than copied: the chat field's bottom\n   space comes from the toolbar row beneath it, while this field ends on its own border,\n   so it repeats the top inset instead of sitting its last line on the edge. */\n._composerInput_1qy1p_186 {\n  /* The chat card's own stroke colour, so the field's edge is the same hairline the\n     elevation token draws around the conversation's composer. */\n  --dsw-elevation-stroke-color: var(--dsw-alias-border-l2);\n  flex: 1 1 auto;\n  box-sizing: border-box;\n  min-width: 0;\n  min-height: 36px;\n  /* Four rows of the same line box, plus its own insets and border. Past that the field\n     scrolls rather than growing. */\n  max-height: calc(4 * (24px + var(--dsh-content-font-delta, 0px)) + 10px);\n  padding: 4px 8px 4px 14px;\n  border: 0;\n  border-radius: var(--dsw-radius-panel);\n  background: var(--dsw-specific-input-major);\n  box-shadow: var(--dsw-elevation-soft);\n  color: var(--dsw-alias-label-primary);\n  font-family: var(--dsw-font-family);\n  font-size: var(--dsh-content-font-size, 14px);\n  line-height: calc(24px + var(--dsh-content-font-delta, 0px));\n  resize: none;\n  overflow-y: auto;\n}\n\n._composerInput_1qy1p_186::placeholder {\n  color: var(--dsw-alias-label-caption);\n}\n\n/* The chat composer's own disabled treatment: the text it holds stays readable but stops\n   looking like something that can be written into. */\n._composerInput_1qy1p_186:disabled {\n  color: var(--dsw-alias-label-tertiary);\n  cursor: not-allowed;\n}\n\n._composerInput_1qy1p_186:focus-visible {\n  outline: 2px solid var(--dsw-alias-brand-primary);\n  outline-offset: 1px;\n}\n\n/* A refusal of the last revision, stated where the ask was made. */\n._composerProblem_1qy1p_227 {\n  margin: 0;\n  color: var(--dsw-alias-state-error-primary);\n  font-size: 12px;\n  line-height: 18px;\n}\n\n/* The log reads as a conversation: the instruction, then when it was applied. */\n._refineLog_1qy1p_235 {\n  display: flex;\n  flex-direction: column;\n  gap: 6px;\n  min-width: 0;\n}\n\n/* The log's header: how many revisions it holds, and the one step back they allow. */\n._refineLogHead_1qy1p_243 {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  min-width: 0;\n}\n\n._refineLogTitle_1qy1p_250 {\n  flex: 1 1 auto;\n  min-width: 0;\n  margin: 0;\n  color: var(--dsw-alias-label-secondary);\n  font-size: 12px;\n  font-weight: 500;\n  line-height: 18px;\n}\n\n._refineLogList_1qy1p_260 {\n  display: flex;\n  flex-direction: column;\n  gap: 4px;\n  margin: 0;\n  padding: 0;\n  list-style: none;\n}\n\n/* One entry is a sentence and its moment, in that order. The row used to be a flex line\n   with the time pushed to the far edge, which put the two facts at opposite ends of a\n   full-width row and made the time look like a column of its own. */\n._refineLogItem_1qy1p_272 {\n  font-size: 12px;\n  line-height: 18px;\n}\n\n._refineLogInstruction_1qy1p_277 {\n  color: var(--dsw-alias-label-primary);\n  overflow-wrap: anywhere;\n}\n\n._refineLogTime_1qy1p_282 {\n  margin-left: 6px;\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 11px;\n  font-variant-numeric: tabular-nums;\n  white-space: nowrap;\n}\n\n/* The block's last line, and the only place that says how long any of it lives. */\n._refineLogNote_1qy1p_291 {\n  margin: 0;\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 11px;\n  line-height: 16px;\n}\n\n._notice_1qy1p_298 {\n  display: flex;\n  flex-direction: column;\n  gap: 4px;\n  padding: 4px 0;\n}\n\n._noticeTitle_1qy1p_305 {\n  margin: 0;\n  color: var(--dsw-alias-label-primary);\n  font-size: 13px;\n  font-weight: 500;\n}\n\n._noticeBody_1qy1p_312 {\n  margin: 0;\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 12px;\n  line-height: 1.5;\n}\n\n/* The editor opens in place of the body, so it inherits the card's width. */\n\n._settings_1qy1p_321 {\n  display: flex;\n  flex-direction: column;\n  min-width: 0;\n}\n\n/* One group of the configuration page: a heading, its controls, and a hairline above\n   every group but the first. Groups rather than nested cards — a card inside the\n   page's own surface reads as a second frame around the same thing. */\n._section_1qy1p_330 {\n  display: flex;\n  flex-direction: column;\n  gap: 10px;\n  min-width: 0;\n  padding: 20px 0;\n}\n\n._section_1qy1p_330:first-child {\n  padding-top: 0;\n}\n\n._section_1qy1p_330 + ._section_1qy1p_330 {\n  border-top: 1px solid var(--dsw-alias-border-l1);\n}\n\n._sectionTitle_1qy1p_346 {\n  margin: 0;\n  color: var(--dsw-alias-label-primary);\n  font-size: 13px;\n  font-weight: 600;\n  line-height: 20px;\n}\n\n/* Four fields, laid out as two rows of two. One row of four crowded every label against\n   the next control and pushed the last field past the page's edge; a grid makes the shape\n   explicit instead of leaving it to how the labels happen to wrap, and each cell is wide\n   enough for a long name or a full path. */\n._fieldGrid_1qy1p_358 {\n  display: grid;\n  grid-template-columns: repeat(2, minmax(0, 1fr));\n  gap: 16px 24px;\n  min-width: 0;\n}\n\n/* Narrower than two comfortable fields, one per row: half a phone's width per field is\n   worse than a longer page. */\n@media (max-width: 640px) {\n  ._fieldGrid_1qy1p_358 {\n    grid-template-columns: minmax(0, 1fr);\n  }\n}\n\n._field_1qy1p_358 {\n  display: flex;\n  flex-direction: column;\n  min-width: 0;\n  gap: 6px;\n}\n\n/* The model field has two states that are text rather than a control: a route the card\n   cannot offer, and no route at all. Both occupy the place the picker would, at the same\n   height, so the row does not jump between the three states. */\n._fieldValue_1qy1p_383 {\n  margin: 0;\n  display: flex;\n  align-items: center;\n  height: 28px;\n  padding: 0 6px;\n  border: 1px solid var(--dsw-alias-border-l1);\n  border-radius: var(--dsw-radius-sm);\n  background: var(--dsw-alias-bg-layer-1);\n  color: var(--dsw-alias-label-secondary);\n  font-size: 12px;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n._fieldLabel_1qy1p_399 {\n  margin: 0;\n  color: var(--dsw-alias-label-secondary);\n  font-size: 12px;\n}\n\n/* The workspace value and the button that changes it share one row: the value is the\n   widest thing in the field, and the button reads as the action on it. */\n._workspaceRow_1qy1p_407 {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  min-width: 0;\n}\n\n/* Two lines in the space one control occupies: the leaf name is what the user scans, and\n   the full path underneath is the exact directory. It matches `.fieldValue`'s border and\n   background so the four fields of this group read as one set, but it is taller because it\n   carries two lines. */\n._workspaceValue_1qy1p_418 {\n  display: flex;\n  flex-direction: column;\n  justify-content: center;\n  gap: 1px;\n  flex: 1 1 auto;\n  min-width: 0;\n  padding: 3px 6px;\n  border: 1px solid var(--dsw-alias-border-l1);\n  border-radius: var(--dsw-radius-sm);\n  background: var(--dsw-alias-bg-layer-1);\n  overflow: hidden;\n}\n\n/* A path that is no longer a directory is stated by the value itself, in the same warn\n   colour the template's own warnings use: the field is a fact about the card, not an\n   alert to dismiss. */\n._workspaceValueInvalid_1qy1p_435 {\n  border-color: var(--dsw-alias-state-warn-label);\n}\n\n._workspaceLeaf_1qy1p_439 {\n  color: var(--dsw-alias-label-primary);\n  font-size: 12px;\n  line-height: 16px;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n/* Tertiary and small: the exact path, always readable, never competing with the name. */\n._workspacePath_1qy1p_449 {\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 11px;\n  line-height: 14px;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n/* A field's own note: what is wrong with this value, or why the control beside it cannot\n   be used. Under the value, because that is what it is about. */\n._fieldNote_1qy1p_460 {\n  margin: 0;\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 11px;\n  line-height: 16px;\n}\n\n._select_1qy1p_467,\n._editor_1qy1p_468 {\n  border: 1px solid var(--dsw-alias-border-l1);\n  border-radius: var(--dsw-radius-sm);\n  background: var(--dsw-alias-bg-layer-1);\n  color: var(--dsw-alias-label-primary);\n  font-size: 12px;\n}\n\n._select_1qy1p_467 {\n  height: 28px;\n  padding: 0 6px;\n}\n\n._editor_1qy1p_468 {\n  min-height: 320px;\n  padding: 6px;\n  font-family: monospace;\n  resize: vertical;\n}\n\n/* The editor is the page's main work surface, so one line above it carries the three\n   facts a writer needs while typing: where the region is, what the template declares,\n   and how much of the size budget it uses. */\n._editorStatus_1qy1p_491 {\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 11px;\n  line-height: 16px;\n}\n\n/* A template with no region cannot run at all, so the whole line turns into the\n   warning rather than one clause of it. */\n._editorStatusMissing_1qy1p_499 {\n  color: var(--dsw-alias-state-warn-label);\n}\n\n/* Above 85% of the byte budget the count is the fact that matters. */\n._editorStatusWarn_1qy1p_504 {\n  color: var(--dsw-alias-state-warn-label);\n}\n\n/* The one control this line carries: writing the missing markers. It inherits the\n   line's type so it reads as part of the sentence. */\n._editorStatusAction_1qy1p_510 {\n  padding: 0;\n  border: 0;\n  background: none;\n  color: var(--dsw-alias-link);\n  font: inherit;\n  text-decoration: underline;\n  cursor: pointer;\n}\n\n/* Gutter plus text area in one row. The two must share font, size, line height and\n   vertical padding, or the numbers stop lining up with the lines they label. */\n._editorPane_1qy1p_522 {\n  display: grid;\n  grid-template-columns: auto minmax(0, 1fr);\n  border: 1px solid var(--dsw-alias-border-l1);\n  border-radius: var(--dsw-radius-sm);\n  background: var(--dsw-alias-bg-layer-1);\n  overflow: hidden;\n}\n\n/* The gutter. Its lines are separate elements so one band can be drawn across the\n   region's lines and a second, subtler one across the action block. Font, size, line\n   height and vertical padding are restated on the lines themselves, because a band\n   that changes any of them pulls the numbers off the text they label. */\n._gutter_1qy1p_535 {\n  margin: 0;\n  padding: 6px 0;\n  border-right: 1px solid var(--dsw-alias-border-l1);\n  background: var(--dsw-alias-bg-layer-2);\n  color: var(--dsw-alias-label-tertiary);\n  font-family: monospace;\n  font-size: 12px;\n  line-height: 18px;\n  text-align: right;\n  /* Scrolling happens in the text area; the gutter follows it in code. */\n  overflow: hidden;\n  user-select: none;\n}\n\n/* One numbered line, which is also its own click target. The transparent left border\n   is what keeps every number in one column once a banded line adds a coloured border\n   of the same width. */\n._gutterLine_1qy1p_553 {\n  display: block;\n  width: 100%;\n  margin: 0;\n  padding: 0 8px;\n  border: 0;\n  border-left: 2px solid transparent;\n  background: none;\n  color: inherit;\n  font: inherit;\n  line-height: inherit;\n  text-align: right;\n  cursor: pointer;\n}\n\n._gutterLine_1qy1p_553:hover {\n  color: var(--dsw-alias-label-primary);\n}\n\n/* The region a child fills: the two marker lines and everything between them. */\n._gutterLineRegion_1qy1p_573 {\n  background: color-mix(in srgb, var(--dsw-alias-brand-primary) 12%, transparent);\n  border-left-color: var(--dsw-alias-brand-primary);\n  color: var(--dsw-alias-label-primary);\n}\n\n/* The action declaration block, drawn more faintly so the two bands stay\n   distinguishable in a template that has both. */\n._gutterLineActions_1qy1p_581 {\n  background: color-mix(in srgb, var(--dsw-alias-label-tertiary) 14%, transparent);\n  border-left-color: var(--dsw-alias-label-tertiary);\n}\n\n._editorPane_1qy1p_522 ._editor_1qy1p_468 {\n  border: 0;\n  border-radius: 0;\n  background: transparent;\n  font-size: 12px;\n  line-height: 18px;\n  padding: 6px 8px;\n}\n\n._editorPane_1qy1p_522 ._editor_1qy1p_468:focus-visible {\n  border: 0;\n  outline: none;\n}\n\n._editorPane_1qy1p_522:focus-within {\n  border-color: var(--dsw-alias-brand-primary);\n}\n\n._editor_1qy1p_468:focus-visible,\n._select_1qy1p_467:focus-visible {\n  border-color: var(--dsw-alias-brand-primary);\n  outline: none;\n}\n\n._violations_1qy1p_610 {\n  margin: 0;\n  padding-left: 18px;\n  color: var(--dsw-alias-label-primary);\n  font-size: 12px;\n  line-height: 1.6;\n}\n\n/* A violation is a jump target: clicking it puts the caret on the construct it names.\n   It keeps the list's own type and colour so the list still reads as a list. */\n._violationJump_1qy1p_620 {\n  padding: 0;\n  border: 0;\n  background: none;\n  color: inherit;\n  font: inherit;\n  text-align: left;\n  text-decoration: underline;\n  text-decoration-style: dotted;\n  cursor: pointer;\n}\n\n._violationJump_1qy1p_620:hover,\n._violationJump_1qy1p_620:focus-visible {\n  color: var(--dsw-alias-label-primary);\n  text-decoration-style: solid;\n}\n\n/* The preview's own surface, inset from the page. What is inside is the user's\n   document in a shadow root, so only this frame is styled here. */\n._previewSurface_1qy1p_640 {\n  display: flex;\n  flex-direction: column;\n  gap: 8px;\n  box-sizing: border-box;\n  min-width: 0;\n  padding: 12px;\n  border: 1px solid var(--dsw-alias-border-l1);\n  border-radius: var(--dsw-radius-md);\n  background: var(--dsw-alias-bg-layer-1);\n}\n\n._previewLabel_1qy1p_652 {\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 11px;\n  line-height: 16px;\n}\n\n._preview_1qy1p_640 {\n  border: 1px dashed var(--dsw-alias-border-l1);\n  border-radius: var(--dsw-radius-sm);\n  padding: 6px;\n}\n\n._settingsActions_1qy1p_664 {\n  display: flex;\n  gap: 6px;\n}\n\n/* The declaration builder: a small form that writes one line into the template. */\n\n._actionBuilder_1qy1p_671 {\n  display: flex;\n  flex-direction: column;\n  gap: 10px;\n  box-sizing: border-box;\n  padding: 12px;\n  border: 1px solid var(--dsw-alias-border-l1);\n  border-radius: var(--dsw-radius-sm);\n  background: var(--dsw-alias-bg-layer-2);\n}\n\n._builderRow_1qy1p_682 {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 16px;\n  min-width: 0;\n}\n\n._builderField_1qy1p_689 {\n  display: flex;\n  flex: 1 1 160px;\n  flex-direction: column;\n  gap: 6px;\n  min-width: 0;\n}\n\n/* The key's grammar, and the reason the confirm button is disabled. It is a line of\n   text rather than a tooltip because it has to be readable while typing. */\n._hint_1qy1p_699 {\n  margin: 0;\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 11px;\n  line-height: 16px;\n}\n\n._hintError_1qy1p_706 {\n  color: var(--dsw-alias-state-error-primary);\n}\n\n/* The page's footer, pinned to the bottom of the scroll container: saving must not\n   depend on scrolling past a preview that can be arbitrarily tall. */\n._configFooter_1qy1p_712 {\n  position: sticky;\n  bottom: 0;\n  z-index: 1;\n  display: flex;\n  flex-direction: column;\n  gap: 6px;\n  box-sizing: border-box;\n  margin-top: 4px;\n  padding: 12px 0 16px;\n  border-top: 1px solid var(--dsw-alias-border-l1);\n  background: var(--dsw-alias-bg-base);\n}\n\n._footerActions_1qy1p_726 {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n}\n\n._footerSpacer_1qy1p_732 {\n  flex: 1 1 auto;\n}\n\n/* What the second press will do, stated where the press happens. */\n._deletePrompt_1qy1p_737 {\n  color: var(--dsw-alias-state-error-primary);\n  font-size: 11px;\n  line-height: 16px;\n}\n\n/* Both selectors carry two classes so the colour wins over the shared Button's own\n   `color` and `:hover` rules whatever order the two stylesheets load in. */\n._footerActions_1qy1p_726 ._deleteCard_1qy1p_745 {\n  color: var(--dsw-alias-state-error-primary);\n}\n\n._footerActions_1qy1p_726 ._deleteCard_1qy1p_745:hover:not(:disabled) {\n  background: var(--dsw-alias-interactive-bg-hover-danger);\n  color: var(--dsw-alias-state-error-primary);\n}\n\n/* A write the controller refused used to leave the page looking untouched. */\n._writeFailure_1qy1p_755 {\n  margin: 0;\n  color: var(--dsw-alias-state-error-primary);\n  font-size: 12px;\n  line-height: 18px;\n}\n\n/* The permission note, demoted to a footnote: it is a statement about the page, not\n   part of the document the card renders, and it stands beneath everything. */\n._permission_1qy1p_764 {\n  margin: 0;\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 11px;\n  line-height: 16px;\n}\n\n/* The in-place confirmation panel, which takes the card's display area the way the\n   editor does. */\n\n._actionPanel_1qy1p_774 {\n  display: flex;\n  flex-direction: column;\n  gap: 10px;\n  padding: 10px;\n  border: 1px solid var(--dsw-alias-border-l1);\n  border-radius: var(--dsw-radius-sm);\n}\n\n._actionFacts_1qy1p_783 {\n  display: grid;\n  grid-template-columns: max-content 1fr;\n  gap: 6px 12px;\n  margin: 0;\n  font-size: 12px;\n}\n\n._actionFacts_1qy1p_783 dt {\n  color: var(--dsw-alias-label-secondary);\n}\n\n._actionFacts_1qy1p_783 dd {\n  margin: 0;\n  min-width: 0;\n  overflow-wrap: anywhere;\n}\n\n/* The payload whole: scrollable, never truncated, never collapsed. It is the one thing\n   standing between a model-authored row and the run that receives it. */\n._actionPayload_1qy1p_803 {\n  max-height: 240px;\n  margin: 0;\n  padding: 8px;\n  border: 1px solid var(--dsw-alias-border-l1);\n  border-radius: var(--dsw-radius-sm);\n  background: var(--dsw-alias-bg-layer-2);\n  overflow: auto;\n  font-family: monospace;\n  font-size: 12px;\n  white-space: pre-wrap;\n  overflow-wrap: anywhere;\n}\n\n/* A bare run's one line: whether it is still going, and how it ended. */\n\n._bareRun_1qy1p_819 {\n  margin: 0;\n  color: var(--dsw-alias-label-primary);\n  font-size: 12px;\n  line-height: 18px;\n  overflow-wrap: anywhere;\n}\n\n._bareRun_1qy1p_819[data-bare-run='settled'] {\n  color: var(--dsw-alias-label-secondary);\n}\n\n/* Editing and previewing are one task seen twice. Wide enough, both fit and the tabs are\n   pointless; narrower, stacking them pushes whichever is second below the fold, so the\n   tabs choose. The breakpoint is where two readable panes stop fitting, not a device. */\n._panes_1qy1p_834 {\n  display: grid;\n  grid-template-columns: minmax(0, 1fr);\n  gap: 16px;\n  align-items: start;\n}\n\n/* A grid child defaults to min-width auto, which lets the editor's content widen the\n   column instead of scrolling inside it. */\n._panes_1qy1p_834 > ._section_1qy1p_330 {\n  min-width: 0;\n}\n\n._paneTabs_1qy1p_847 {\n  display: flex;\n  gap: 4px;\n  padding: 3px;\n  border-radius: var(--dsw-radius-sm);\n  background: var(--dsw-alias-bg-layer-2);\n}\n\n._paneTab_1qy1p_847 {\n  flex: 1 1 auto;\n  padding: 5px 10px;\n  border: 0;\n  border-radius: calc(var(--dsw-radius-sm) - 1px);\n  background: transparent;\n  color: var(--dsw-alias-label-secondary);\n  cursor: pointer;\n  font-size: 12px;\n  line-height: 18px;\n}\n\n._paneTab_1qy1p_847[aria-selected='true'] {\n  background: var(--dsw-alias-bg-layer-1);\n  color: var(--dsw-alias-label-primary);\n  font-weight: 500;\n}\n\n._paneTab_1qy1p_847:focus-visible {\n  outline: 2px solid var(--dsw-alias-brand-primary);\n  outline-offset: 1px;\n}\n\n@media (min-width: 1100px) {\n  ._panes_1qy1p_834 {\n    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);\n    gap: 24px;\n  }\n\n  /* Both panes are visible, so a tab strip would only repeat their headings. */\n  ._paneTabs_1qy1p_847 {\n    display: none;\n  }\n}\n\n@media (max-width: 1099px) {\n  /* The selected tab already names the pane, so the heading would say it twice. */\n  ._panes_1qy1p_834 ._sectionTitle_1qy1p_346 {\n    display: none;\n  }\n\n  ._panes_1qy1p_834[data-pane='edit'] > ._section_1qy1p_330:nth-of-type(2),\n  ._panes_1qy1p_834[data-pane='preview'] > ._section_1qy1p_330:nth-of-type(1) {\n    display: none;\n  }\n}/* Workbench card shell: the frame every card renders inside. */\n\n._card_1qbpg_3 {\n  display: flex;\n  flex-direction: column;\n  gap: 12px;\n  box-sizing: border-box;\n  height: 100%;\n  min-height: 180px;\n  padding: 16px 18px;\n  border: 1px solid var(--dsw-alias-border-l1);\n  border-radius: 12px;\n  background: var(--dsw-alias-bg-layer-1);\n  transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;\n}\n\n._spanWide_1qbpg_17 {\n  grid-column: span 2;\n}\n\n/* A card that opens something in full. The region is focusable, so it carries the\n   pointer and focus affordances a button would; it cannot BE a button, because the\n   card hosts its own controls in the head action area. */\n._activatable_1qbpg_24 {\n  cursor: pointer;\n}\n\n._activatable_1qbpg_24:hover {\n  border-color: var(--dsw-alias-brand-primary);\n  /* A lift, not a colour change: the card already changes border on hover, and the\n     shadow is what reads as \"this opens something\" before the pointer arrives. */\n  box-shadow: 0 6px 16px -6px rgb(0 0 0 / 18%);\n  transform: translateY(-1px);\n}\n\n._activatable_1qbpg_24:focus-visible {\n  outline: 2px solid var(--dsw-alias-brand-primary);\n  outline-offset: 1px;\n}\n\n._spanTall_1qbpg_41 {\n  grid-row: span 2;\n}\n\n._spanLarge_1qbpg_45 {\n  grid-column: span 2;\n  grid-row: span 2;\n}\n\n._head_1qbpg_50 {\n  display: flex;\n  flex-direction: column;\n  gap: 2px;\n  min-width: 0;\n}\n\n/* The title, the status, and the card's own controls share one line. Centring that\n   line is what puts them on a single baseline: the three boxes have different\n   heights, so top-aligning them left the status text and the button labels at\n   different offsets from the title. The subtitle sits below this line rather than\n   inside it, so a wrapping subtitle cannot drag the controls out of place. */\n._headRow_1qbpg_62 {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  min-width: 0;\n}\n\n._title_1qbpg_69 {\n  margin: 0;\n  flex: 1 1 auto;\n  min-width: 0;\n  font-size: 15px;\n  font-weight: 600;\n  line-height: 22px;\n  overflow-wrap: anywhere;\n}\n\n/* The skill name is a chip rather than a second line of grey text: it is a fact about\n   the card, not a subtitle of its name, and the chip is what separates the two levels. */\n._subtitle_1qbpg_81 {\n  display: inline-block;\n  align-self: flex-start;\n  max-width: 100%;\n  padding: 1px 8px;\n  border-radius: 6px;\n  background: var(--dsw-alias-bg-layer-2);\n  font-size: 11px;\n  line-height: 18px;\n  color: var(--dsw-alias-label-secondary);\n  overflow-wrap: anywhere;\n}\n\n._status_1qbpg_94 {\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n  flex: none;\n  font-size: 12px;\n  line-height: 18px;\n  color: var(--dsw-alias-label-secondary);\n}\n\n._headActions_1qbpg_104 {\n  display: inline-flex;\n  align-items: center;\n  gap: 4px;\n  flex: none;\n}\n\n._iconButton_1qbpg_111 {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  width: 24px;\n  height: 24px;\n  padding: 0;\n  border: 0;\n  border-radius: 6px;\n  background: transparent;\n  color: var(--dsw-alias-label-secondary);\n  cursor: pointer;\n  opacity: 0;\n}\n\n/* The card's own controls and the host's icon controls are hidden until the card is\n   hovered or focused: at rest the title is the only thing on the line. */\n._card_1qbpg_3:hover ._iconButton_1qbpg_111,\n._card_1qbpg_3:focus-within ._iconButton_1qbpg_111 {\n  opacity: 1;\n}\n\n._iconButton_1qbpg_111:hover {\n  background: var(--dsw-alias-bg-layer-2);\n  color: var(--dsw-alias-label-primary);\n}\n\n._iconButton_1qbpg_111:focus-visible {\n  outline: 2px solid var(--dsw-alias-brand-primary);\n  outline-offset: 1px;\n}\n\n/* The reorder handle reveals with the other icon controls and sits in the tertiary\n   colour, so it reads as an affordance rather than as a peer of the card's own\n   actions. Hovering it brings it back to the primary label colour, and because it is\n   inside the card, focusing it from the keyboard reveals it too. */\n._handle_1qbpg_147 {\n  color: var(--dsw-alias-label-tertiary);\n  cursor: grab;\n  touch-action: none;\n}\n\n._handle_1qbpg_147:active {\n  cursor: grabbing;\n}\n\n._body_1qbpg_157 {\n  flex: 1 1 auto;\n  min-height: 0;\n  font-size: 13px;\n  line-height: 20px;\n}\n\n._failure_1qbpg_164 {\n  display: flex;\n  flex-direction: column;\n  align-items: flex-start;\n  gap: 8px;\n  color: var(--dsw-alias-label-secondary);\n}\n\n._dragging_1qbpg_172 {\n  opacity: 0.6;\n}\n/*$vite$:1*/";
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
			skillCardProblemNotConfigured: "还没有选择 skill",
			skillCardProblemNoTemplate: "这个 skill 还没有模板",
			skillCardProblemNoSession: "没有可用的会话",
			skillCardProblemSkillMissing: "这个 skill 已经不可用",
			skillCardProblemProvider: "当前的子代理后端不支持结构化输出",
			skillCardProblemContract: "输出契约不合法",
			skillCardProblemTemplateInvalid: "模板不合法",
			skillCardProblemRunning: "已经有一个运行在进行",
			skillCardProblemRunFailed: "这次运行没有产出可用的结果",
			skillCardProblemRunUnavailable: "当前 harness 不能运行卡片：卡片运行需要提供 startActivation 的 harness（0.2.1-alpha.2 / beta 通道），已安装的 harness 没有提供",
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
			skillCardDeleteConfirm: "确认删除",
			skillCardDeleteConfirmPrompt: "删除后无法撤销，确认删除这张卡片？",
			skillCardTemplatePlaceholder: "用 HTML 写这张卡的样子，用 <!-- template-begin --> 与 <!-- template-end --> 标出要填数据的位置，并在注释里写明填写要求",
			skillCardPreview: "预览",
			skillCardSave: "保存",
			skillCardClose: "关闭",
			skillCardViolationScript: "不允许 script 标签",
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
			skillCardRunsWithPermission: "运行时权限：{mode}",
			skillCardProblemPermissionUnavailable: "这张卡要求的权限模式无法应用，运行已拒绝",
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
			runStartedAt: "开始于",
			runStopReason: "结束原因",
			runModel: "模型",
			runEditedAt: "手工编辑",
			skillCardResultEdit: "编辑",
			resultEditLabel: "结果内容",
			resultEditPlaceholder: "这里是这段区间的 HTML：改完保存，它就是这张卡的结果",
			resultEditEmpty: "结果为空，没有可保存的内容。这张卡可以再运行一次，也可以在这里直接填入区间 HTML。",
			resultEditTooLarge: "内容有 {bytes} 字节，超过 {max} 字节上限，未保存。",
			runDetailSummary: "运行详情",
			runStructured: "结构化结果",
			runRawOutput: "原始输出",
			runDiagnostic: "诊断",
			runStopCompleted: "正常结束",
			runStopError: "出错",
			runStopAborted: "已中止",
			runStructuredRest: "其余字段",
			skillCardRunningBody: "技能正在执行，完成后结果会显示在这里。",
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
			actionFieldSession: "运行所属会话",
			actionTargetCard: "卡片：{name}",
			actionTargetSkill: "skill：{name}",
			actionConfirm: "确认",
			actionCancel: "取消",
			actionCandidates: "可选：{names}",
			actionProblemMissingAction: "按钮没有带动作键，已拒绝执行",
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
			bareRunFailed: "skill 执行失败"
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
			skillCardProblemNotConfigured: "No skill selected yet",
			skillCardProblemNoTemplate: "This skill has no template",
			skillCardProblemNoSession: "No session is available",
			skillCardProblemSkillMissing: "That skill is no longer available",
			skillCardProblemProvider: "The configured subagent backend cannot return structured output",
			skillCardProblemContract: "The output contract is not valid",
			skillCardProblemTemplateInvalid: "The template is not valid",
			skillCardProblemRunning: "Another run is already in flight",
			skillCardProblemRunFailed: "The run produced no usable result",
			skillCardProblemRunUnavailable: "This harness cannot run cards: a card run needs a harness that provides startActivation (0.2.1-alpha.2, the beta channel), and the installed harness does not",
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
			skillCardDeleteConfirm: "Confirm delete",
			skillCardDeleteConfirmPrompt: "This cannot be undone. Delete this card?",
			skillCardTemplatePlaceholder: "Write this card’s HTML, marking the data region with <!-- template-begin --> and <!-- template-end -->, and say what to fill in the comments",
			skillCardPreview: "Preview",
			skillCardSave: "Save",
			skillCardClose: "Close",
			skillCardViolationScript: "script elements are not allowed",
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
			skillCardRunsWithPermission: "Runs with {mode} permission",
			skillCardProblemPermissionUnavailable: "This card’s permission mode could not be applied, so the run was refused",
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
			runStartedAt: "Started",
			runStopReason: "Stop reason",
			runModel: "Model",
			runEditedAt: "Edited by hand",
			skillCardResultEdit: "Edit",
			resultEditLabel: "Result content",
			resultEditPlaceholder: "The region’s HTML: saving it becomes this card’s result",
			resultEditEmpty: "The result is empty, so there is nothing to save. Run this card again, or type the region HTML here.",
			resultEditTooLarge: "The content is {bytes} bytes, over the {max}-byte limit, so nothing was saved.",
			runDetailSummary: "Run details",
			runStructured: "Structured result",
			runRawOutput: "Raw output",
			runDiagnostic: "Diagnostic",
			runStopCompleted: "Completed",
			runStopError: "Error",
			runStopAborted: "Aborted",
			runStructuredRest: "Other fields",
			skillCardRunningBody: "The skill is executing. Its result appears here when it finishes.",
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
			actionFieldSession: "Session",
			actionTargetCard: "Card: {name}",
			actionTargetSkill: "Skill: {name}",
			actionConfirm: "Confirm",
			actionCancel: "Cancel",
			actionCandidates: "Choices: {names}",
			actionProblemMissingAction: "The button carried no action key, so nothing ran",
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
			bareRunFailed: "The skill failed"
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
				return errorMessageOf(await readJson(response)) ?? `skill card route answered ${String(response.status)}`;
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
					const snapshot = parseSnapshot(await readJson(response));
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
							const snapshot = parseSnapshot(await readJson(response));
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
						const snapshot = parseSnapshot(await readJson(response));
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
					const body = await readJson(response);
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
					const state = parseRunResponse(await readJson(response));
					return state === void 0 ? {
						status: "unavailable",
						reason: "run response did not match the contract"
					} : {
						status: "ok",
						state
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
					const body = await readJson(response);
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
				async cancel(cardId) {
					try {
						await fetcher(`${WORKBENCH_SKILL_CARD_RUN_PATH}?cardId=${encodeURIComponent(cardId)}`, {
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
				async saveResult(cardId, html) {
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
								html
							})
						});
					} catch (error) {
						return {
							status: "unavailable",
							reason: `skill card request failed: ${messageOf(error)}`
						};
					}
					const body = await readJson(response);
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
					const body = await readJson(response);
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
		async function readJson(response) {
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
				if (!Array.isArray(entry.templateSkills) || entry.templateSkills.some((name) => typeof name !== "string")) return;
				if (entry.template !== void 0 && typeof entry.template !== "string") return void 0;
				cards.push({
					cardId: entry.cardId,
					...entry.name === void 0 ? {} : { name: entry.name },
					...entry.skill === void 0 ? {} : { skill: entry.skill },
					...model === void 0 ? {} : { model },
					...workspace === void 0 ? {} : { workspace: { path: workspace.path } },
					...permission === void 0 ? {} : { permission },
					templateSkills: entry.templateSkills,
					...entry.template === void 0 ? {} : { template: entry.template }
				});
			}
			const results = [];
			for (const raw of body.results) {
				if (typeof raw !== "object" || raw === null) return void 0;
				const entry = raw;
				if (typeof entry.cardId !== "string" || !isWorkbenchCardId(entry.cardId)) return void 0;
				if (typeof entry.skill !== "string" || typeof entry.executedAt !== "number" || typeof entry.stopReason !== "string") return;
				if (entry.model !== void 0 && !isWorkbenchCardModel(entry.model)) return void 0;
				results.push({
					...raw,
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
			const startActivation = value.startActivation;
			return typeof startActivation === "boolean" ? { startActivation } : void 0;
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
			if (typeof raw.cardId !== "string" || !isWorkbenchCardId(raw.cardId)) return void 0;
			if (typeof raw.skill !== "string" || typeof raw.executedAt !== "number" || typeof raw.stopReason !== "string") return;
			if (raw.model !== void 0 && !isWorkbenchCardModel(raw.model)) return void 0;
			if (raw.editedAt !== void 0 && (typeof raw.editedAt !== "number" || !Number.isFinite(raw.editedAt))) return;
			return {
				revision: body.revision,
				result: {
					...body.result,
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
			if (typeof body.state !== "object" || body.state === null) return void 0;
			const state = body.state;
			if (typeof state.cardId !== "string" || !isWorkbenchCardId(state.cardId)) return void 0;
			if (!RUN_PHASES.includes(state.phase)) return void 0;
			if (typeof state.retried !== "boolean") return void 0;
			return body.state;
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
					return directory === void 0 ? () => {} : directory.store.subscribe(listener);
				}
			};
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
			page: "_page_14mdo_3",
			pageHead: "_pageHead_14mdo_20",
			pageTitle: "_pageTitle_14mdo_34",
			pageIntro: "_pageIntro_14mdo_42",
			notice: "_notice_14mdo_49",
			empty: "_empty_14mdo_58",
			emptyTitle: "_emptyTitle_14mdo_67",
			emptyBody: "_emptyBody_14mdo_74",
			grid: "_grid_14mdo_81",
			cell: "_cell_14mdo_91",
			createRoot: "_createRoot_14mdo_96",
			createTile: "_createTile_14mdo_105",
			createMark: "_createMark_14mdo_134"
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
		* @returns the reason, or undefined when the element is allowed.
		*/
		function forbiddenElementReason(element) {
			const tag = element.tagName.toLowerCase();
			if (tag === "script") return "script";
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
			walk(parseTemplate(html), "root", found, html.toLowerCase());
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
			return analyzeFragment(html);
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
		*/
		function walk(node, path, found, lowerHtml) {
			for (const child of [...node.childNodes]) {
				if (child.nodeType !== Node.ELEMENT_NODE) continue;
				const element = child;
				const tag = element.tagName.toLowerCase();
				const here = `${path} > ${tag}`;
				const offset = approximateTagOffset(lowerHtml, tag);
				const at = offset === void 0 ? {} : { offset };
				const reason = forbiddenElementReason(element);
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
				walk(element, here, found, lowerHtml);
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
				reason: "malformed-payload"
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
		/**
		* Remove the template's indentation from one result's HTML.
		*
		* The child returns the content of the region it was asked to fill, so every line
		* carries the indentation the region had in the template. A template whose region sits
		* inside a table six levels deep therefore starts its content far from column zero, and
		* the code block that shows the raw region wastes that lead on every line.
		*
		* This is a display projection and nothing else: the stored value is spliced back into
		* the template verbatim, so the one thing this must never do is become the value.
		*
		* Blank lines have no indentation of their own, so they are left empty and take no part
		* in finding the prefix. A fragment whose lines share no leading whitespace is returned
		* untouched, because there is nothing to remove and `pre` is faithful by default.
		* @param html - the region HTML exactly as stored.
		* @returns the same HTML with the non-blank lines' common leading whitespace removed.
		*/
		function dedentedHtml(html) {
			const lines = html.split("\n");
			const [first = "", ...rest] = lines.filter((line) => line.trim() !== "").map((line) => /^[ \t]*/.exec(line)?.[0] ?? "");
			let prefix = first;
			for (const indent of rest) {
				let shared = 0;
				while (shared < prefix.length && shared < indent.length && prefix[shared] === indent[shared]) shared += 1;
				prefix = prefix.slice(0, shared);
				if (prefix === "") return html;
			}
			if (prefix === "") return html;
			return lines.map((line) => line.trim() === "" ? "" : line.slice(prefix.length)).join("\n");
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
			return template.slice(0, region.start) + html + template.slice(region.end);
		}
		/**
		* Render one document into a shadow root.
		* @param root - the shadow root to fill; its previous children are replaced.
		* @param html - the complete document.
		*/
		function renderTemplate(root, html) {
			const content = parseTemplate(html);
			stripForbidden(content);
			root.replaceChildren(content);
		}
		/**
		* Remove anything the document must not carry.
		*
		* Saving refuses these in a template, so removing them here covers the other source: a
		* fragment a model authored, which can carry a construct into the document that no
		* template ever held.
		* @param node - the node to clean.
		*/
		function stripForbidden(node) {
			for (const child of [...node.childNodes]) {
				if (child.nodeType !== Node.ELEMENT_NODE) continue;
				const element = child;
				if (element.tagName.toLowerCase() === "style" && hasExternalCss(element.textContent ?? "")) {
					element.remove();
					continue;
				}
				if (forbiddenElementReason(element) !== void 0) {
					element.remove();
					continue;
				}
				for (const attribute of [...element.attributes]) if (forbiddenAttributeReason(attribute.name, attribute.value) !== void 0) element.removeAttribute(attribute.name);
				stripForbidden(element);
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
		* @param props - the document, the host class, and the action handler.
		* @returns the host element.
		*/
		function ShadowHtml({ html, className, onAction }) {
			const host = (0, react.useRef)(null);
			(0, react.useEffect)(() => {
				const element = host.current;
				if (element === null) return;
				renderTemplate(element.shadowRoot ?? element.attachShadow({ mode: "open" }), html);
			}, [html]);
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
		* @param lookup - cards, skills, and liveness as of this click.
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
			if (card.running) return {
				kind: "failed",
				key,
				code: "target-busy",
				candidates: [card.name]
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
			if (!lookup.live) return {
				kind: "failed",
				key,
				code: "target-unavailable",
				candidates: [target.name]
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
		* @param api - transport. Taken here rather than bound to a controller, so this works
		* for a card that is nowhere on screen.
		* @param cardId - the card to run.
		* @param sessionId - the session the run belongs to.
		* @param payload - the clicked row's raw fields; omitted for a run no row triggered.
		* @returns the accepted run state, or the Host's own refusal.
		*/
		async function startCardRun(api, cardId, sessionId, payload) {
			return await api.start({
				cardId,
				sessionId,
				mode: { kind: "card" },
				...payload === void 0 ? {} : { payload },
				outputSchema: WORKBENCH_OUTPUT_SCHEMA
			});
		}
		/**
		* Ask any stored card to revise a result it already produced.
		*
		* The same shape as {@link startCardRun} with the refine mode in place of the card
		* mode: the template and the contract are not the client's to state, and the previous
		* HTML travels verbatim so the child revises the pixels the user is looking at. Both
		* request shapes live here so the mode union is constructed in one module.
		* @param api - transport.
		* @param cardId - the card whose result is being revised.
		* @param sessionId - the session the run belongs to.
		* @param instruction - what to change, as the user wrote it.
		* @param previous - the region HTML the revision starts from.
		* @returns the accepted run state, or the Host's own refusal.
		*/
		async function startCardRefine(api, cardId, sessionId, instruction, previous) {
			return await api.start({
				cardId,
				sessionId,
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
			const { api, cardId, session, withCatalog = false, models, workspacePicker, cardTitle = defaultCardTitle, openCard, watchRun = false } = options;
			const sessionId = session();
			const [config, setConfig] = (0, react.useState)({ kind: "loading" });
			const [run, setRun] = (0, react.useState)(void 0);
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
					setDirectory(models.read(sessionId));
				};
				read();
				return models.subscribe(sessionId, read);
			}, [models, sessionId]);
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
					if (result.status !== "ok" || result.state.phase !== "running") return;
					setRun(result.state);
				});
			}, [
				api,
				cardId,
				watchRun
			]);
			const running = run?.phase === "running";
			(0, react.useEffect)(() => {
				if (!running) return;
				let stopped = false;
				const timer = setInterval(() => {
					api.poll(cardId).then((result) => {
						if (stopped) return;
						if (result.status === "ok") {
							settleRefinement(result.state);
							setRun(result.state);
							return;
						}
						if (result.status === "missing") setRun(void 0);
					});
				}, POLL_INTERVAL_MS);
				return () => {
					stopped = true;
					clearInterval(timer);
				};
			}, [
				api,
				cardId,
				running,
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
			const stored = config.kind === "ready" ? config.snapshot.results.find((entry) => entry.cardId === cardId) : void 0;
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
			const runUnavailable = (0, react.useMemo)(() => config.kind === "ready" && config.snapshot.capabilities?.startActivation === false ? { code: "run-unavailable" } : void 0, [config]);
			const result = resultOverride ?? run?.result ?? stored;
			const previous = (0, react.useMemo)(() => {
				if (previousResult === void 0) return void 0;
				const html = resultHtml(previousResult.structured);
				return html === void 0 ? void 0 : {
					html,
					at: previousResult.executedAt
				};
			}, [previousResult]);
			const start = (0, react.useCallback)(() => {
				refinement.current = void 0;
				setResultOverride(void 0);
				setPreviousResult(void 0);
				setRefineProblem(void 0);
				const live = session();
				if (live === void 0) {
					setProblem({
						code: "session-not-live",
						detail: ""
					});
					return;
				}
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
				startCardRun(api, cardId, live).then((outcome) => {
					if (outcome.status === "ok") {
						setRun(outcome.state);
						setProblem(void 0);
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
				session,
				card?.skill,
				card?.template,
				workspaceField
			]);
			const cancel = (0, react.useCallback)(() => {
				api.cancel(cardId);
			}, [api, cardId]);
			const refine = (0, react.useCallback)((instruction) => {
				const text = instruction.trim();
				if (text === "") return;
				if (run?.phase === "running") return;
				const live = session();
				if (live === void 0) {
					setProblem({
						code: "session-not-live",
						detail: ""
					});
					return;
				}
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
				refinement.current = {
					instruction: text,
					prior: result,
					priorHtml
				};
				startCardRefine(api, cardId, live, text, priorHtml).then((outcome) => {
					if (outcome.status !== "ok") {
						refinement.current = void 0;
						setRefineProblem(refineStartProblem(outcome));
						return;
					}
					settleRefinement(outcome.state);
					setRun(outcome.state);
				});
			}, [
				api,
				card?.skill,
				card?.template,
				cardId,
				result,
				run?.phase,
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
				if (run?.phase === "running") {
					setProblem({
						code: "run-in-progress",
						detail: ""
					});
					return false;
				}
				const prior = result;
				const outcome = await api.saveResult(cardId, html);
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
				result,
				run?.phase
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
			/**
			* Ask which of the cards a declaration could mean are already running.
			*
			* The stored snapshot carries what a card *is*, never what it is doing, so the run
			* route is asked — and only about the cards the clicked key actually names.
			*/
			const runningTargets = (0, react.useCallback)(async (declaration, cards) => {
				const busy = /* @__PURE__ */ new Set();
				if (declaration?.target.kind !== "card") return busy;
				const name = declaration.target.name;
				const named = cards.filter((entry) => cardTitle(entry.cardId, entry.name) === name);
				await Promise.all(named.map(async (entry) => {
					const state = await api.poll(entry.cardId);
					if (state.status === "ok" && state.state.phase === "running") busy.add(entry.cardId);
				}));
				return busy;
			}, [api, cardTitle]);
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
				const declaration = declarations.find((item) => item.key === key);
				if (declaration?.target.kind === "skill" && catalogRead.status !== "ok") {
					setPendingAction(void 0);
					setActionProblem({
						code: "target-unavailable",
						candidates: [],
						detail: catalogRead.message
					});
					return;
				}
				const busy = await runningTargets(declaration, snapshot.cards);
				const resolution = resolveAction(declarations, {
					cards: snapshot.cards.map((entry) => ({
						cardId: entry.cardId,
						name: cardTitle(entry.cardId, entry.name),
						running: busy.has(entry.cardId)
					})),
					skills: catalogRead.status === "ok" ? catalogRead.entries.filter((entry) => entry.userInvocable).map((entry) => entry.name) : [],
					live: live !== void 0
				}, key, payload);
				if (resolution.kind === "failed") {
					setPendingAction(void 0);
					setActionProblem({
						code: resolution.code,
						candidates: resolution.candidates
					});
					return;
				}
				const skill = resolution.target.kind === "card" ? snapshot.cards.find((entry) => entry.cardId === resolution.reference)?.skill : resolution.target.name;
				if (live === void 0 || skill === void 0) {
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
					payload: resolution.payload,
					sessionId: live
				});
			}, [
				api,
				cardId,
				cardTitle,
				runningTargets,
				session
			]);
			const click = (0, react.useCallback)((event) => {
				setPendingAction(void 0);
				if (event.kind === "invalid") {
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
					startCardRun(api, pending.reference, pending.sessionId, pending.payload).then((outcome) => {
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
					sessionId: pending.sessionId,
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
				workspaceField
			]);
			const cancelAction = (0, react.useCallback)(() => {
				setPendingAction(void 0);
			}, []);
			const actions = (0, react.useMemo)(() => ({
				run: start,
				cancel,
				refine,
				undoRefine,
				saveResultEdit,
				refresh,
				chooseSkill,
				chooseModel,
				chooseWorkspace,
				choosePermission,
				saveTemplate,
				rename,
				remove,
				click,
				confirmAction,
				cancelAction
			}), [
				start,
				cancel,
				refine,
				undoRefine,
				saveResultEdit,
				refresh,
				chooseSkill,
				chooseModel,
				chooseWorkspace,
				choosePermission,
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
					...run === void 0 ? {} : { run },
					...run?.phase === "running" && refinement.current !== void 0 ? { refining: true } : {},
					...effective === void 0 ? {} : { problem: effective },
					...runUnavailable === void 0 ? {} : { runUnavailable },
					...pendingAction === void 0 ? {} : { pendingAction },
					...actionProblem === void 0 ? {} : { actionProblem },
					...bareRun === void 0 ? {} : { bareRun },
					refinements,
					previous,
					...refineProblem === void 0 ? {} : { refineProblem },
					runnable: runUnavailable === void 0 && sessionId !== void 0 && card?.skill !== void 0 && card.template !== void 0 && modelField.kind !== "unavailable" && workspaceField.kind === "ready",
					modelField,
					workspaceField,
					permission: effectiveWorkbenchSandboxMode(card?.permission),
					canChooseWorkspace,
					catalog,
					catalogStatus,
					catalogFailure,
					cardTitles: config.kind === "ready" ? config.snapshot.cards.map((entry) => cardTitle(entry.cardId, entry.name)) : []
				}), [
					config,
					run,
					problem,
					sessionId,
					card?.name,
					card?.skill,
					card?.template,
					modelField,
					workspaceField,
					card?.permission,
					canChooseWorkspace,
					result,
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
		* Read the title one card face shows, when nothing else supplies that rule.
		* @param cardId - the card.
		* @param name - its stored name, when it has one.
		* @returns the name, or the card id it falls back to.
		*/
		function defaultCardTitle(cardId, name) {
			return name ?? cardId;
		}
		/**
		* Put one written result into a snapshot's result list.
		*
		* Replaced in place rather than appended: the list is ordered by card id and one card has
		* exactly one result, so appending would show the same card twice from one read onwards.
		* @param results - the snapshot's results, ascending by card id.
		* @param written - the record the Host just stored.
		* @returns a new list holding that record.
		*/
		function replaceResult(results, written) {
			let found = false;
			const next = results.map((entry) => {
				if (entry.cardId !== written.cardId) return entry;
				found = true;
				return written;
			});
			if (!found) next.push(written);
			return next.sort((left, right) => left.cardId < right.cardId ? -1 : left.cardId > right.cardId ? 1 : 0);
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
		* A concurrent run is the one refusal with a name of its own: the click already
		* checked, so only the window between checking and starting can produce it — and the
		* Host refuses rather than queueing, which is exactly what is reported.
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
			"permission-unavailable": true
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
			template: "_template_1qy1p_4",
			body: "_body_1qy1p_8",
			cardActions: "_cardActions_1qy1p_14",
			pageView: "_pageView_1qy1p_22",
			pageViewHead: "_pageViewHead_1qy1p_30",
			pageViewTitle: "_pageViewTitle_1qy1p_37",
			pageViewSubtitle: "_pageViewSubtitle_1qy1p_47",
			runProblem: "_runProblem_1qy1p_54",
			runOutput: "_runOutput_1qy1p_65",
			runOutputSummary: "_runOutputSummary_1qy1p_70",
			runOutputLabel: "_runOutputLabel_1qy1p_76",
			runFacts: "_runFacts_1qy1p_82",
			runPre: "_runPre_1qy1p_99",
			runPreHtml: "_runPreHtml_1qy1p_115",
			resultSurface: "_resultSurface_1qy1p_136",
			resultEditor: "_resultEditor_1qy1p_148",
			composer: "_composer_1qy1p_158",
			composerRow: "_composerRow_1qy1p_169",
			composerInput: "_composerInput_1qy1p_186",
			composerProblem: "_composerProblem_1qy1p_227",
			refineLog: "_refineLog_1qy1p_235",
			refineLogHead: "_refineLogHead_1qy1p_243",
			refineLogTitle: "_refineLogTitle_1qy1p_250",
			refineLogList: "_refineLogList_1qy1p_260",
			refineLogItem: "_refineLogItem_1qy1p_272",
			refineLogInstruction: "_refineLogInstruction_1qy1p_277",
			refineLogTime: "_refineLogTime_1qy1p_282",
			refineLogNote: "_refineLogNote_1qy1p_291",
			notice: "_notice_1qy1p_298",
			noticeTitle: "_noticeTitle_1qy1p_305",
			noticeBody: "_noticeBody_1qy1p_312",
			settings: "_settings_1qy1p_321",
			section: "_section_1qy1p_330",
			sectionTitle: "_sectionTitle_1qy1p_346",
			fieldGrid: "_fieldGrid_1qy1p_358",
			field: "_field_1qy1p_358",
			fieldValue: "_fieldValue_1qy1p_383",
			fieldLabel: "_fieldLabel_1qy1p_399",
			workspaceRow: "_workspaceRow_1qy1p_407",
			workspaceValue: "_workspaceValue_1qy1p_418",
			workspaceValueInvalid: "_workspaceValueInvalid_1qy1p_435",
			workspaceLeaf: "_workspaceLeaf_1qy1p_439",
			workspacePath: "_workspacePath_1qy1p_449",
			fieldNote: "_fieldNote_1qy1p_460",
			select: "_select_1qy1p_467",
			editor: "_editor_1qy1p_468",
			editorStatus: "_editorStatus_1qy1p_491",
			editorStatusMissing: "_editorStatusMissing_1qy1p_499",
			editorStatusWarn: "_editorStatusWarn_1qy1p_504",
			editorStatusAction: "_editorStatusAction_1qy1p_510",
			editorPane: "_editorPane_1qy1p_522",
			gutter: "_gutter_1qy1p_535",
			gutterLine: "_gutterLine_1qy1p_553",
			gutterLineRegion: "_gutterLineRegion_1qy1p_573",
			gutterLineActions: "_gutterLineActions_1qy1p_581",
			violations: "_violations_1qy1p_610",
			violationJump: "_violationJump_1qy1p_620",
			previewSurface: "_previewSurface_1qy1p_640",
			previewLabel: "_previewLabel_1qy1p_652",
			preview: "_preview_1qy1p_640",
			settingsActions: "_settingsActions_1qy1p_664",
			actionBuilder: "_actionBuilder_1qy1p_671",
			builderRow: "_builderRow_1qy1p_682",
			builderField: "_builderField_1qy1p_689",
			hint: "_hint_1qy1p_699",
			hintError: "_hintError_1qy1p_706",
			configFooter: "_configFooter_1qy1p_712",
			footerActions: "_footerActions_1qy1p_726",
			footerSpacer: "_footerSpacer_1qy1p_732",
			deletePrompt: "_deletePrompt_1qy1p_737",
			deleteCard: "_deleteCard_1qy1p_745",
			writeFailure: "_writeFailure_1qy1p_755",
			permission: "_permission_1qy1p_764",
			actionPanel: "_actionPanel_1qy1p_774",
			actionFacts: "_actionFacts_1qy1p_783",
			actionPayload: "_actionPayload_1qy1p_803",
			bareRun: "_bareRun_1qy1p_819",
			panes: "_panes_1qy1p_834",
			paneTabs: "_paneTabs_1qy1p_847",
			paneTab: "_paneTab_1qy1p_847"
		};
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
			const actionsSlot = (0, react.useMemo)(() => () => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: skill_card_module_default.cardActions,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
					variant: "ghost",
					size: "sm",
					onClick: () => {
						openCard(cardId, "config");
					},
					children: t("skillCardSettings")
				})
			}), [
				cardId,
				openCard,
				t
			]);
			return renderFactorySlot("workbench.card", {
				id: cardId,
				title: cardFaceTitle({
					cardId,
					name: view.name
				}, t),
				...view.skill === void 0 ? {} : { subtitle: view.skill },
				...view.problem === void 0 ? {} : { failure: t(problemKey(view.problem.code)) },
				onActivate: () => {
					openCard(cardId, "result");
				},
				onRemove: () => {
					actions.remove().then(onCardsChanged);
				},
				reorderable: reorder?.reorderable ?? false,
				position: Math.max(1, visibleIds.indexOf(cardId) + 1),
				total: Math.max(1, visibleIds.length)
			}, { slots: { actions: actionsSlot } });
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
		function SkillCardBody({ view, t, onAction }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: skill_card_module_default.body,
				children: cardContent(view, t, onAction)
			});
		}
		/**
		* Render whichever content the card currently has.
		* @param view - the card view.
		* @param t - translator.
		* @param onAction - click outlet for buttons the document carries.
		* @returns the content element.
		*/
		function cardContent(view, t, onAction) {
			if (view.status === "loading") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Notice, {
				title: t("skillCardLoading"),
				body: t("skillCardLoadingBody")
			});
			if (view.template === void 0) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Notice, {
				title: t("skillCardNoTemplateTitle"),
				body: t("skillCardNoTemplateBody")
			});
			if (view.run?.phase === "running" && view.refining !== true) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Notice, {
				title: t("runStatusRunning"),
				body: t("skillCardRunningBody")
			});
			if (view.result === void 0) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Notice, {
				title: t("skillCardNotRunTitle"),
				body: t("skillCardNotRunBody")
			});
			const filled = resultHtml(view.result.structured);
			if (filled === void 0) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Notice, {
				title: t("skillCardNotRunTitle"),
				body: t("skillCardNotRunBody")
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ShadowHtml, {
				html: filledTemplate(view.template, filled),
				className: skill_card_module_default.template,
				onAction
			});
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
			"run-unavailable": "skillCardProblemRunUnavailable",
			"workspace-missing": "skillCardProblemWorkspaceMissing",
			"workspace-invalid": "skillCardProblemWorkspaceInvalid",
			"permission-unavailable": "skillCardProblemPermissionUnavailable",
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
		//#region src/client/skill-card/session.ts
		/**
		* Pick the session a run should hang off.
		*
		* A session the main view still holds wins, because that is the one the user is
		* working in. The rest are ranked by recency.
		*
		* A blank session is an ordinary candidate. "Blank" means no messages yet, which
		* says nothing about whether the session can run: a freshly opened session has a
		* live agent, and the Host refuses a session without one on its own terms. The
		* picker must not pre-empt that judgement, because excluding blank sessions leaves
		* a first-run user with no candidate at all.
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
			const { view, t, onChoose, onChooseModel, onChoosePermission, onChooseWorkspace, onSave, onRename, onClose, onDelete } = props;
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
			const templateId = `${base}-template`;
			const previewId = `${base}-preview`;
			const analysis = (0, react.useMemo)(() => analyzeTemplate(draft), [draft]);
			const gutter = (0, react.useRef)(null);
			const editor = (0, react.useRef)(null);
			const escaped = (0, react.useRef)(false);
			const dirty = draft !== (view.template ?? "") || name !== (view.name ?? "");
			const [pane, setPane] = (0, react.useState)("edit");
			const saveable = analysis.violations.length === 0 && draft.length > 0 && view.skill !== void 0;
			const regionLines = (0, react.useMemo)(() => {
				const region = analysis.region;
				if (region === void 0) return void 0;
				return {
					start: lineIndexAt(draft, region.start) + 1,
					end: lineIndexAt(draft, region.end) + 1
				};
			}, [analysis, draft]);
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
				const top = lineIndexAt(text, from) * 18 - element.clientHeight / 2 + 9;
				element.scrollTop = Math.max(0, top);
				if (gutter.current !== null) gutter.current.scrollTop = element.scrollTop;
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
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
										className: skill_card_module_default.sectionTitle,
										id: templateId,
										children: t("skillCardTemplateLabel")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: classes(skill_card_module_default.editorStatus, regionLines === void 0 ? skill_card_module_default.editorStatusMissing : void 0),
										"data-template-status": "",
										children: [
											regionLines === void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("skillCardRegionMissing") }) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("skillCardRegionRange", {
												start: String(regionLines.start),
												end: String(regionLines.end)
											}) }),
											" · ",
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("skillCardActionsCount", { count: String(analysis.actions.length) }) }),
											" · ",
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
											dirty ? ` · ${t("skillCardTemplateDirty")}` : "",
											draft.trim() === "" ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [" · ", /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
												type: "button",
												className: skill_card_module_default.editorStatusAction,
												onClick: insertSkeleton,
												children: t("skillCardInsertSkeleton")
											})] }) : regionLines === void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [" · ", /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
												type: "button",
												className: skill_card_module_default.editorStatusAction,
												onClick: insertRegionMarkers,
												children: t("skillCardInsertMarkers")
											})] }) : null,
											builderOpen ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [" · ", /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
												type: "button",
												className: skill_card_module_default.editorStatusAction,
												onClick: () => {
													setBuilderOpen(true);
												},
												children: t("skillCardAddAction")
											})] })
										]
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
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("pre", {
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
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
									className: skill_card_module_default.sectionTitle,
									id: previewId,
									children: t("skillCardPreview")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: skill_card_module_default.previewSurface,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: skill_card_module_default.previewLabel,
										children: t("skillCardPreviewSample")
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ShadowHtml, {
										html: draft,
										className: skill_card_module_default.preview
									})]
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
		* @param props - the card view, the translator, the label id, and the store action.
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
		* Format one moment as a 24-hour clock time.
		*
		* Written by hand rather than through `toLocaleTimeString`: the revision log reads one
		* time per line, and a locale that renders a 12-hour clock would change the shape the
		* times are scanned as.
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
		* Chinese and English copy for every stop reason this build knows by name.
		*
		* The upstream stop-reason union is merge-extensible, so this is a partial map rather
		* than an exhaustive one: a value that is not here arrived from a build newer than this
		* one, and it has no copy to borrow.
		*/
		var STOP_REASON_KEYS = {
			completed: "runStopCompleted",
			error: "runStopError",
			aborted: "runStopAborted"
		};
		/**
		* Name one run's stop reason.
		* @param reason - the reason exactly as the run reported it.
		* @param t - translator.
		* @returns the localized name, or the raw value when this build has no copy for it —
		* printing the value is honest, while a made-up label would not be.
		*/
		function stopReasonText(reason, t) {
			const key = STOP_REASON_KEYS[reason];
			return key === void 0 ? reason : t(key);
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
		* primitives expose no dialog, and the editor already works the same way. The four
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
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("actionFieldSession") }),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", {
							"data-action-field": "session",
							children: pending.sessionId
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
		* Split one structured value into the HTML it carries and what is left over.
		* @param value - the result's structured value, which is never undefined here.
		* @returns the parts to render.
		*/
		function readStructured(value) {
			if (typeof value !== "object" || value === null || Array.isArray(value)) return {
				kind: "json",
				json: JSON.stringify(value, null, 2)
			};
			const html = resultHtml(value);
			if (html === void 0) return {
				kind: "json",
				json: JSON.stringify(value, null, 2)
			};
			const rest = {};
			for (const [key, field] of Object.entries(value)) if (key !== "html") rest[key] = field;
			return Object.keys(rest).length === 0 ? {
				kind: "html",
				html
			} : {
				kind: "html",
				html,
				rest: JSON.stringify(rest, null, 2)
			};
		}
		/**
		* Render everything a finished run left behind.
		*
		* The structured value is what the template renders; the raw output, the stop reason,
		* and the provider's diagnostic are what answer "why is there no data". Every part of it
		* is omitted when it carries nothing: a row whose value is absent is a row that says
		* "empty", not a row that says what happened.
		* @param props - the card view and the translator.
		* @returns the output block.
		*/
		function RunOutput({ view, t }) {
			const result = view.result;
			if (result === void 0) return null;
			const parts = result.structured === void 0 ? void 0 : readStructured(result.structured);
			const outputText = result.outputText === void 0 || result.outputText.trim() === "" ? void 0 : result.outputText;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("details", {
				className: skill_card_module_default.runOutput,
				"data-run-detail": "",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("summary", {
						className: skill_card_module_default.runOutputSummary,
						children: t("runDetailSummary")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("dl", {
						className: skill_card_module_default.runFacts,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("runStopReason") }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", {
								"data-run-stop-reason": result.stopReason,
								children: stopReasonText(result.stopReason, t)
							}),
							result.model === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("runModel") }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("dd", {
								"data-run-model": `${result.model.provider}/${result.model.model}`,
								children: [
									result.model.provider,
									" / ",
									result.model.model
								]
							})] }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("runStartedAt") }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: new Date(result.executedAt).toLocaleString() }),
							result.editedAt === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("runEditedAt") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", {
								"data-run-edited-at": String(result.editedAt),
								children: new Date(result.editedAt).toLocaleString()
							})] }),
							result.diagnostic === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("runDiagnostic") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: result.diagnostic })] })
						]
					}),
					parts === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: skill_card_module_default.runOutputLabel,
							children: t("runStructured")
						}),
						parts.kind === "json" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("pre", {
							className: skill_card_module_default.runPre,
							children: parts.json
						}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("pre", {
							className: skill_card_module_default.runPreHtml,
							"data-run-html": "",
							children: dedentedHtml(parts.html)
						}),
						parts.kind === "html" && parts.rest !== void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: skill_card_module_default.runOutputLabel,
							children: t("runStructuredRest")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("pre", {
							className: skill_card_module_default.runPre,
							children: parts.rest
						})] }) : null
					] }),
					outputText === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: skill_card_module_default.runOutputLabel,
						children: t("runRawOutput")
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("pre", {
						className: skill_card_module_default.runPre,
						children: outputText
					})] })
				]
			});
		}
		/** Rows the revision field grows to before it scrolls instead. */
		var COMPOSER_MAX_ROWS = 4;
		/**
		* Render the composer that revises the result, and this session's revision log.
		*
		* It sits under the result because a revision is a sentence about what is on screen: the
		* user reads the result, says what to change, and reads it again. The log reads as a
		* conversation — the instruction, then when it was applied — because that is the order
		* the two were said in.
		* @param props - the card view, the translator, whether the card is busy, and the actions.
		* @returns the composer.
		*/
		function RefinePanel({ view, t, busy, onRefine, onUndo, onStop }) {
			const [instruction, setInstruction] = (0, react.useState)("");
			const field = (0, react.useRef)(null);
			const empty = instruction.trim() === "";
			const rows = Math.min(COMPOSER_MAX_ROWS, Math.max(1, instruction.split("\n").length));
			(0, react.useLayoutEffect)(() => {
				const element = field.current;
				if (element === null) return;
				element.style.height = "auto";
				if (element.scrollHeight > 0) element.style.height = `${String(element.scrollHeight)}px`;
			}, [instruction]);
			const submit = () => {
				if (empty || busy) return;
				onRefine(instruction);
				setInstruction("");
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: skill_card_module_default.composer,
				"data-refine-composer": "",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: skill_card_module_default.composerRow,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
							ref: field,
							className: skill_card_module_default.composerInput,
							rows,
							value: instruction,
							placeholder: t("refinePlaceholder"),
							"aria-label": t("refinePlaceholder"),
							disabled: busy,
							onChange: (event) => {
								setInstruction(event.target.value);
							},
							onKeyDown: (event) => {
								if (event.key !== "Enter") return;
								if (event.shiftKey) return;
								if (event.nativeEvent.isComposing) return;
								event.preventDefault();
								submit();
							}
						}), busy ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							variant: "ghost",
							size: "sm",
							onClick: onStop,
							"data-refine-stop": "",
							children: t("refineStop")
						}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							variant: "primary",
							size: "sm",
							disabled: empty,
							onClick: submit,
							children: t("refineAction")
						})]
					}),
					view.refineProblem === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("p", {
						className: skill_card_module_default.composerProblem,
						role: "alert",
						"data-refine-problem": view.refineProblem.code,
						children: [t(problemKey(view.refineProblem.code)), view.refineProblem.detail === void 0 || view.refineProblem.detail === "" ? "" : ` · ${view.refineProblem.detail}`]
					}),
					view.refinements.length === 0 && view.previous === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: skill_card_module_default.refineLog,
						"data-refine-log": "",
						children: [
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
						]
					})
				]
			});
		}
		/**
		* Render the card's result in the whole display column, with its run control.
		* @param props - transport, card identity, session resolver, title fallback, back, and `t`.
		* @returns the result page.
		*/
		function SkillCardResultPage(props) {
			const { api, cardId, runSessionId, models, workspacePicker, fallbackTitle, onBack, openCard, t } = props;
			const { view, actions } = useSkillCard({
				api,
				cardId,
				session: runSessionId,
				models,
				workspacePicker,
				openCard,
				watchRun: true,
				cardTitle: (0, react.useCallback)((id, name) => cardFaceTitle({
					cardId: id,
					name
				}, t), [t])
			});
			const running = view.run?.phase === "running";
			const bareRunning = view.bareRun?.phase === "running";
			const refinable = resultHtml(view.result?.structured) !== void 0;
			const [editing, setEditing] = (0, react.useState)(false);
			const editable = view.result !== void 0 && !running && !bareRunning;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				className: skill_card_module_default.pageView,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
						className: skill_card_module_default.pageViewHead,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
								variant: "ghost",
								size: "sm",
								onClick: onBack,
								children: t("skillCardBack")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
								className: skill_card_module_default.pageViewTitle,
								children: view.name ?? fallbackTitle
							}),
							view.skill !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: skill_card_module_default.pageViewSubtitle,
								children: view.skill
							}),
							editable && !editing ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
								variant: "ghost",
								size: "sm",
								onClick: () => {
									setEditing(true);
								},
								"data-result-edit-start": "",
								children: t("skillCardResultEdit")
							}) : null,
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
								variant: "primary",
								size: "sm",
								disabled: bareRunning || editing || !running && !view.runnable,
								onClick: running ? actions.cancel : actions.run,
								children: running ? t("skillCardCancel") : t("skillCardRun")
							})
						]
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
					view.problem === void 0 || view.refineProblem !== void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("p", {
						className: skill_card_module_default.runProblem,
						role: "alert",
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
					view.pendingAction === void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("section", {
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
								t,
								onAction: actions.click
							})
						})
					}), refinable && !editing ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(RefinePanel, {
						view,
						t,
						busy: running || bareRunning,
						onRefine: actions.refine,
						onUndo: actions.undoRefine,
						onStop: actions.cancel
					}) : null] }) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ActionPanel, {
						pending: view.pendingAction,
						t,
						onConfirm: actions.confirmAction,
						onCancel: actions.cancelAction
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(RunOutput, {
						view,
						t
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: skill_card_module_default.permission,
						"data-run-permission": view.permission,
						children: t("skillCardRunsWithPermission", { mode: t(permissionLabelKey(view.permission)) })
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
			const { api, cardId, runSessionId, models, workspacePicker, onBack, t } = props;
			const { view, actions } = useSkillCard({
				api,
				cardId,
				session: runSessionId,
				models,
				workspacePicker,
				withCatalog: true,
				cardTitle: (0, react.useCallback)((id, name) => cardFaceTitle({
					cardId: id,
					name
				}, t), [t])
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				className: skill_card_module_default.pageView,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("header", {
					className: skill_card_module_default.pageViewHead,
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
						variant: "ghost",
						size: "sm",
						onClick: onBack,
						children: t("skillCardBack")
					})
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SkillCardSettings, {
					view,
					t,
					onChoose: actions.chooseSkill,
					onChooseModel: actions.chooseModel,
					onChoosePermission: actions.choosePermission,
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
					runSessionId: skillCards.runSessionId,
					models: skillCards.models,
					workspacePicker: skillCards.workspacePicker,
					fallbackTitle: labelOf(selection.cardId),
					onBack: closeCard,
					openCard,
					t
				};
				return selection.view === "result" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SkillCardResultPage, { ...page }) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SkillCardConfigPage, { ...page });
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
			card: "_card_1qbpg_3",
			spanWide: "_spanWide_1qbpg_17",
			activatable: "_activatable_1qbpg_24",
			spanTall: "_spanTall_1qbpg_41",
			spanLarge: "_spanLarge_1qbpg_45",
			head: "_head_1qbpg_50",
			headRow: "_headRow_1qbpg_62",
			title: "_title_1qbpg_69",
			subtitle: "_subtitle_1qbpg_81",
			status: "_status_1qbpg_94",
			headActions: "_headActions_1qbpg_104",
			iconButton: "_iconButton_1qbpg_111",
			handle: "_handle_1qbpg_147",
			body: "_body_1qbpg_157",
			failure: "_failure_1qbpg_164",
			dragging: "_dragging_1qbpg_172"
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
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", {
								className: card_module_default.title,
								id: titleId,
								children: title
							}),
							statusText !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: card_module_default.status,
								children: [state !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.StateDot, { state: STATE_DOT[state] }), statusText]
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
					}), subtitle !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: card_module_default.subtitle,
						children: subtitle
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
			const selection = (0, _deepseek_ai_dsh_client_store.createSnapshotStore)(void 0);
			const openCard = (cardId, view) => {
				selection.set({
					cardId,
					view
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
						models,
						workspacePicker
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
