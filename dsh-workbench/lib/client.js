window.__ModuleLoader__.load({
	id: "dsh-workbench",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
// The Loader never fetches a sibling stylesheet, so this one ships inside
// the factory and installs on first evaluation.
{
  const css = "/* Workbench page: a centred column with its head row and the card grid. */\n\n._page_nfmcv_3 {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  gap: 24px;\n  box-sizing: border-box;\n  height: 100%;\n  overflow: auto;\n  padding: 0 clamp(24px, 4vw, 48px) 48px;\n  color: var(--dsw-alias-label-primary);\n}\n\n._page_nfmcv_3 > * {\n  width: 100%;\n  max-width: 1200px;\n}\n\n._pageHead_nfmcv_20 {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 16px;\n  box-sizing: border-box;\n  /* The page's top inset lives here so the strip above the content drags the window. */\n  padding-top: 28px;\n}\n\n[data-platform='darwin'] ._pageHead_nfmcv_20 {\n  padding-top: calc(28px + var(--dsh-frame-top-clearance, 0px));\n}\n\n._pageTitle_nfmcv_34 {\n  margin: 0;\n  font-size: 24px;\n  font-weight: 600;\n  line-height: 32px;\n  letter-spacing: -0.01em;\n}\n\n._pageIntro_nfmcv_42 {\n  margin: 6px 0 0;\n  font-size: 13px;\n  line-height: 20px;\n  color: var(--dsw-alias-label-secondary);\n}\n\n._notice_nfmcv_49 {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  font-size: 12px;\n  line-height: 18px;\n  color: var(--dsw-alias-label-secondary);\n}\n\n._empty_nfmcv_58 {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  gap: 8px;\n  padding: 64px 16px;\n  text-align: center;\n}\n\n._emptyTitle_nfmcv_67 {\n  margin: 0;\n  font-size: 15px;\n  font-weight: 500;\n  line-height: 22px;\n}\n\n._emptyBody_nfmcv_74 {\n  margin: 0;\n  font-size: 13px;\n  line-height: 20px;\n  color: var(--dsw-alias-label-secondary);\n}\n\n._grid_nfmcv_81 {\n  display: grid;\n  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));\n  gap: 24px;\n  align-content: start;\n}\n\n/* A cell is a one-track grid so whatever it holds fills it on both axes. A flex\n   container would size the child to its content along the main axis, which left the\n   cards narrow and the columns wide.\n   \n   The track is stated rather than left implicit: an implicit `auto` track sizes itself\n   from the item's content, so the creation tile — whose only content is a mark and a\n   short word — collapsed into a narrow column while the cards beside it stayed wide. */\n._cell_nfmcv_95 {\n  display: grid;\n  grid-template-columns: minmax(0, 1fr);\n  min-width: 0;\n}\n\n._createRoot_nfmcv_101 {\n  display: flex;\n  flex: 1 1 auto;\n  min-width: 0;\n}\n\n/* The creation entry is a grid tile, so it reads as the place cards come from\n   rather than as a toolbar action detached from the grid. */\n\n/* Same frame as a card, drawn as an outline: it belongs in the row of cards without\n   claiming to be one of them. */\n._createTile_nfmcv_112 {\n  display: flex;\n  flex: 1 1 auto;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  gap: 12px;\n  box-sizing: border-box;\n  width: 100%;\n  min-height: 168px;\n  padding: 16px 18px;\n  border: 1px dashed var(--dsw-alias-border-l1);\n  border-radius: 12px;\n  background: transparent;\n  color: var(--dsw-alias-label-secondary);\n  cursor: pointer;\n  font-size: 13px;\n  transition: border-color 0.15s ease, background 0.15s ease, color 0.15s ease,\n    transform 0.15s ease;\n}\n\n._createTile_nfmcv_112:hover {\n  border-color: var(--dsw-alias-brand-primary);\n  border-style: solid;\n  background: var(--dsw-alias-bg-layer-2);\n  color: var(--dsw-alias-label-primary);\n  transform: translateY(-1px);\n}\n\n/* The mark is what turns the tile from \"empty slot\" into \"entry\". Without it the\n   dashed box reads as something that failed to load. It is the size and shape of the\n   monogram every card carries, which is what makes the tile read as a peer of the cards\n   rather than as a hole in the grid. */\n._createMark_nfmcv_145 {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  width: 28px;\n  height: 28px;\n  border-radius: 9px;\n  /* Mixed from the label colour, not filled with a layer token: the light theme's layers\n     are all the same white as the tile, which would leave the mark with no shape. */\n  background: color-mix(in srgb, var(--dsw-alias-label-primary) 6%, transparent);\n  font-size: 16px;\n  line-height: 1;\n  color: var(--dsw-alias-label-tertiary);\n  transition: background 0.15s ease, color 0.15s ease;\n}\n\n._createTile_nfmcv_112:hover ._createMark_nfmcv_145 {\n  background: color-mix(in srgb, var(--dsw-alias-brand-primary) 10%, transparent);\n  color: var(--dsw-alias-brand-primary);\n}\n\n._createTile_nfmcv_112:focus-visible {\n  outline: 2px solid var(--dsw-alias-brand-primary);\n  outline-offset: 1px;\n}\n\n@media (max-width: 720px) {\n  ._grid_nfmcv_81 {\n    grid-template-columns: 1fr;\n  }\n}\n\n/* ---------------------------------------------------------------------------\n   The pipeline workbench: a rail of pipelines and single cards, a canvas of\n   steps, and an inspector that mounts one card's own views.\n\n   Three fixed columns rather than one flowing column: the rail is a list, the\n   canvas is a sequence, and the inspector is a document — each scrolls on its\n   own, so a long run history never pushes the canvas out of view.\n   --------------------------------------------------------------------------- */\n\n/* The page's own frame when it hosts the pipeline: the surface is one panel that fills\n   it exactly — own head, two columns, run bar — so the page adds no gutter, no gap and\n   no scrollbar of its own. `position: relative` is what the panel anchors to: it covers\n   the whole page whatever height the host hands down, so the run bar cannot fall below\n   the fold. */\n._pagePipeline_nfmcv_191 {\n  /* One grid row sized `minmax(0, 1fr)`: the panel is handed the page's exact height and\n     may be shorter than its content, which is what keeps the run bar on screen. A flex\n     column would have sized the panel to its content instead, and clipped the bar. */\n  display: grid;\n  grid-template-rows: minmax(0, 1fr);\n  align-items: stretch;\n  gap: 0;\n  height: 100%;\n  min-height: 0;\n  overflow: hidden;\n  padding: 0;\n  position: relative;\n}\n\n._shell_nfmcv_206 {\n  display: grid;\n  flex: 1 1 auto;\n  grid-template-columns: 196px minmax(216px, 268px) minmax(0, 1fr);\n  box-sizing: border-box;\n  min-height: 0;\n  border: 1px solid var(--dsw-alias-border-l1);\n  border-radius: 12px;\n  overflow: hidden;\n}\n\n@media (max-width: 760px) {\n  /* Below the panel's own minimum the inspector is what has to survive: the rail\n     folds away and the canvas narrows, because a pipeline you cannot read is worse\n     than one you cannot switch. */\n  ._shell_nfmcv_206 {\n    grid-template-columns: minmax(180px, 220px) minmax(0, 1fr);\n  }\n\n  ._rail_nfmcv_225 {\n    display: none;\n  }\n}\n\n/* --- rail ---------------------------------------------------------------- */\n\n._rail_nfmcv_225 {\n  display: flex;\n  flex-direction: column;\n  gap: 8px;\n  box-sizing: border-box;\n  min-height: 0;\n  padding: 10px 8px;\n  border-right: 1px solid var(--dsw-alias-border-l1);\n  background: var(--dsw-alias-bg-layer-1);\n  overflow: auto;\n}\n\n._railHead_nfmcv_244 {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 6px;\n  padding: 4px 6px 2px;\n}\n\n._railTitle_nfmcv_252 {\n  font-size: 12px;\n  font-weight: 500;\n  line-height: 18px;\n  color: var(--dsw-alias-label-tertiary);\n}\n\n._railAction_nfmcv_259,\n._linkBtn_nfmcv_260 {\n  padding: 2px 4px;\n  border: none;\n  background: none;\n  color: var(--dsw-alias-label-secondary);\n  font-family: inherit;\n  font-size: 12px;\n  line-height: 18px;\n  cursor: pointer;\n  border-radius: 6px;\n}\n\n._railAction_nfmcv_259:hover,\n._linkBtn_nfmcv_260:hover {\n  background: var(--dsw-alias-bg-fill-hover);\n  color: var(--dsw-alias-label-primary);\n}\n\n._railAction_nfmcv_259:focus-visible,\n._linkBtn_nfmcv_260:focus-visible,\n._menuBtn_nfmcv_280:focus-visible,\n._toolBtn_nfmcv_281:focus-visible,\n._stepBadge_nfmcv_282:focus-visible,\n._stepMain_nfmcv_283:focus-visible,\n._railRowMain_nfmcv_284:focus-visible,\n._railRowTask_nfmcv_285:focus-visible,\n._tab_nfmcv_286:focus-visible,\n._primaryBtn_nfmcv_287:focus-visible,\n._stopBtn_nfmcv_288:focus-visible,\n._addStep_nfmcv_289:focus-visible,\n._pickerRow_nfmcv_290:focus-visible {\n  outline: 2px solid var(--dsw-alias-brand-primary);\n  outline-offset: 1px;\n}\n\n._railList_nfmcv_295 {\n  display: flex;\n  flex-direction: column;\n  gap: 2px;\n  margin: 0;\n  padding: 0;\n  list-style: none;\n}\n\n._railEmpty_nfmcv_304 {\n  margin: 0;\n  padding: 6px;\n  font-size: 12px;\n  line-height: 18px;\n  color: var(--dsw-alias-label-tertiary);\n}\n\n._railRow_nfmcv_284 {\n  display: flex;\n  align-items: center;\n  gap: 2px;\n  border-radius: 8px;\n}\n\n._railRowActive_nfmcv_319 {\n  background: var(--dsw-alias-bg-fill-hover);\n}\n\n._railRowMain_nfmcv_284 {\n  display: flex;\n  flex: 1 1 auto;\n  flex-direction: column;\n  gap: 1px;\n  box-sizing: border-box;\n  min-width: 0;\n  padding: 6px 8px;\n  border: none;\n  border-radius: 8px;\n  background: none;\n  color: var(--dsw-alias-label-primary);\n  font-family: inherit;\n  font-size: 13px;\n  line-height: 18px;\n  text-align: left;\n  cursor: pointer;\n}\n\n._railRowTask_nfmcv_285 {\n  width: 100%;\n  padding: 6px 8px;\n  border: none;\n  background: none;\n  color: var(--dsw-alias-label-primary);\n  font-family: inherit;\n  font-size: 13px;\n  line-height: 18px;\n  text-align: left;\n  cursor: pointer;\n  border-radius: 8px;\n}\n\n._railRowTask_nfmcv_285:hover,\n._railRowMain_nfmcv_284:hover {\n  background: var(--dsw-alias-bg-fill-hover);\n}\n\n._railRowName_nfmcv_361 {\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n._railCount_nfmcv_367 {\n  font-size: 11px;\n  line-height: 16px;\n  color: var(--dsw-alias-label-tertiary);\n}\n\n._menuBtn_nfmcv_280 {\n  flex: none;\n  width: 24px;\n  height: 24px;\n  padding: 0;\n  border: none;\n  border-radius: 6px;\n  background: none;\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 14px;\n  line-height: 1;\n  cursor: pointer;\n}\n\n._menuBtn_nfmcv_280:hover {\n  background: var(--dsw-alias-bg-fill-hover);\n  color: var(--dsw-alias-label-primary);\n}\n\n._menu_nfmcv_280 {\n  position: absolute;\n  z-index: 2;\n  margin-top: 32px;\n  display: flex;\n  flex-direction: column;\n  min-width: 132px;\n  padding: 4px;\n  border: 1px solid var(--dsw-alias-border-l2);\n  border-radius: 10px;\n  background: var(--dsw-alias-bg-layer-2);\n  box-shadow: 0 8px 24px color-mix(in srgb, var(--dsw-alias-label-primary) 16%, transparent);\n}\n\n._menuRow_nfmcv_406 {\n  padding: 6px 8px;\n  border: none;\n  border-radius: 6px;\n  background: none;\n  color: var(--dsw-alias-label-primary);\n  font-family: inherit;\n  font-size: 13px;\n  line-height: 18px;\n  text-align: left;\n  cursor: pointer;\n}\n\n._menuRow_nfmcv_406:hover {\n  background: var(--dsw-alias-bg-fill-hover);\n}\n\n._menuRowDanger_nfmcv_423 {\n  color: var(--dsw-alias-state-error-primary);\n}\n\n._renameInput_nfmcv_427 {\n  box-sizing: border-box;\n  width: 100%;\n  padding: 6px 8px;\n  border: 1px solid var(--dsw-alias-brand-primary);\n  border-radius: 8px;\n  background: var(--dsw-alias-bg-base);\n  color: var(--dsw-alias-label-primary);\n  font-family: var(--dsw-font-family);\n  font-size: 13px;\n  line-height: 18px;\n}\n\n/* --- canvas -------------------------------------------------------------- */\n\n._canvas_nfmcv_442 {\n  display: flex;\n  flex-direction: column;\n  gap: 10px;\n  box-sizing: border-box;\n  min-height: 0;\n  padding: 12px 12px 16px;\n  border-right: 1px solid var(--dsw-alias-border-l1);\n  overflow: auto;\n}\n\n._canvasHead_nfmcv_453 {\n  display: flex;\n  align-items: flex-start;\n  justify-content: space-between;\n  gap: 8px;\n}\n\n._canvasTitleGroup_nfmcv_460 {\n  display: flex;\n  flex-direction: column;\n  gap: 2px;\n  min-width: 0;\n}\n\n._canvasTitle_nfmcv_460 {\n  margin: 0;\n  overflow: hidden;\n  font-size: 15px;\n  font-weight: 500;\n  line-height: 22px;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  color: var(--dsw-alias-label-primary);\n}\n\n._canvasMeta_nfmcv_478,\n._canvasHint_nfmcv_479 {\n  margin: 0;\n  font-size: 12px;\n  line-height: 18px;\n  color: var(--dsw-alias-label-tertiary);\n}\n\n._canvasHint_nfmcv_479 {\n  padding: 8px 2px;\n  color: var(--dsw-alias-label-secondary);\n}\n\n._runBar_nfmcv_491 {\n  display: flex;\n  flex: none;\n  gap: 6px;\n}\n\n._primaryBtn_nfmcv_287,\n._stopBtn_nfmcv_288 {\n  padding: 4px 10px;\n  border: 1px solid transparent;\n  border-radius: 8px;\n  background: var(--dsw-alias-brand-primary);\n  color: #fff;\n  font-family: inherit;\n  font-size: 12px;\n  line-height: 18px;\n  cursor: pointer;\n}\n\n._primaryBtn_nfmcv_287:hover {\n  filter: brightness(1.06);\n}\n\n._primaryBtn_nfmcv_287:disabled {\n  background: var(--dsw-alias-bg-layer-2);\n  color: var(--dsw-alias-label-tertiary);\n  cursor: default;\n}\n\n._stopBtn_nfmcv_288 {\n  background: none;\n  border-color: var(--dsw-alias-border-l2);\n  color: var(--dsw-alias-state-error-primary);\n}\n\n._chainLine_nfmcv_526 {\n  margin: 0;\n  padding: 6px 8px;\n  border-radius: 8px;\n  background: var(--dsw-alias-bg-layer-1);\n  font-size: 12px;\n  line-height: 18px;\n  color: var(--dsw-alias-label-secondary);\n}\n\n._chainLineFailed_nfmcv_536 {\n  color: var(--dsw-alias-state-error-primary);\n}\n\n._stepList_nfmcv_540 {\n  display: flex;\n  flex-direction: column;\n  gap: 0;\n  margin: 0;\n  padding: 0;\n  list-style: none;\n}\n\n._step_nfmcv_282 {\n  position: relative;\n  display: flex;\n  flex-direction: column;\n  gap: 2px;\n  padding: 6px 6px 6px 4px;\n  border: 1px solid transparent;\n  border-radius: 10px;\n}\n\n._stepSelected_nfmcv_559 {\n  border-color: var(--dsw-alias-border-l1);\n  background: var(--dsw-alias-bg-layer-1);\n}\n\n._stepRow_nfmcv_564 {\n  display: flex;\n  align-items: flex-start;\n  gap: 8px;\n  min-width: 0;\n}\n\n._stepBadge_nfmcv_282 {\n  flex: none;\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  width: 20px;\n  height: 20px;\n  margin-top: 2px;\n  border: none;\n  border-radius: 7px;\n  background: color-mix(in srgb, var(--dsw-alias-label-primary) 8%, transparent);\n  color: var(--dsw-alias-label-secondary);\n  font-family: inherit;\n  font-size: 11px;\n  line-height: 1;\n  cursor: pointer;\n}\n\n._stepMain_nfmcv_283 {\n  display: flex;\n  flex: 1 1 auto;\n  flex-direction: column;\n  gap: 3px;\n  box-sizing: border-box;\n  min-width: 0;\n  padding: 0;\n  border: none;\n  background: none;\n  color: var(--dsw-alias-label-primary);\n  font-family: inherit;\n  text-align: left;\n  cursor: pointer;\n}\n\n._stepName_nfmcv_605 {\n  overflow: hidden;\n  font-size: 13px;\n  line-height: 18px;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n._stepNameMissing_nfmcv_613 {\n  color: var(--dsw-alias-label-tertiary);\n  text-decoration: line-through;\n}\n\n._stepSub_nfmcv_618 {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  min-width: 0;\n  font-size: 11px;\n  line-height: 16px;\n  color: var(--dsw-alias-label-tertiary);\n}\n\n._stepAsk_nfmcv_628 {\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n._stepTook_nfmcv_634 {\n  font-variant-numeric: tabular-nums;\n}\n\n._chip_nfmcv_638 {\n  flex: none;\n  padding: 1px 6px;\n  border-radius: 999px;\n  font-size: 11px;\n  line-height: 14px;\n}\n\n._chipIdle_nfmcv_646 {\n  background: color-mix(in srgb, var(--dsw-alias-label-primary) 7%, transparent);\n  color: var(--dsw-alias-label-secondary);\n}\n\n._chipQueued_nfmcv_651 {\n  background: color-mix(in srgb, var(--dsw-alias-label-primary) 7%, transparent);\n  color: var(--dsw-alias-label-secondary);\n}\n\n._chipRunning_nfmcv_656 {\n  background: color-mix(in srgb, var(--dsw-alias-brand-primary) 12%, transparent);\n  color: var(--dsw-alias-brand-primary);\n}\n\n._chipDone_nfmcv_661 {\n  background: color-mix(in srgb, var(--dsw-alias-label-primary) 9%, transparent);\n  color: var(--dsw-alias-label-primary);\n}\n\n._chipFailed_nfmcv_666 {\n  background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 12%, transparent);\n  color: var(--dsw-alias-state-error-primary);\n}\n\n._chipStopped_nfmcv_671 {\n  background: color-mix(in srgb, var(--dsw-alias-label-primary) 7%, transparent);\n  color: var(--dsw-alias-label-tertiary);\n}\n\n/* The per-step controls appear on hover or focus: a canvas of six steps showing six\n   toolbars reads as a settings form rather than as an order of operations. */\n._stepTools_nfmcv_678 {\n  display: flex;\n  gap: 4px;\n  padding-left: 28px;\n  opacity: 0;\n  transition: opacity 0.12s ease;\n}\n\n._step_nfmcv_282:hover ._stepTools_nfmcv_678,\n._step_nfmcv_282:focus-within ._stepTools_nfmcv_678,\n._stepSelected_nfmcv_559 ._stepTools_nfmcv_678 {\n  opacity: 1;\n}\n\n._toolBtn_nfmcv_281 {\n  padding: 1px 6px;\n  border: 1px solid var(--dsw-alias-border-l1);\n  border-radius: 6px;\n  background: var(--dsw-alias-bg-base);\n  color: var(--dsw-alias-label-secondary);\n  font-family: inherit;\n  font-size: 11px;\n  line-height: 16px;\n  cursor: pointer;\n}\n\n._toolBtn_nfmcv_281:hover {\n  border-color: var(--dsw-alias-border-l2);\n  color: var(--dsw-alias-label-primary);\n}\n\n._connector_nfmcv_709 {\n  display: block;\n  width: 1px;\n  height: 10px;\n  margin: 2px 0 2px 14px;\n  background: var(--dsw-alias-border-l2);\n}\n\n._addStep_nfmcv_289 {\n  padding: 6px 10px;\n  border: 1px dashed var(--dsw-alias-border-l1);\n  border-radius: 10px;\n  background: none;\n  color: var(--dsw-alias-label-secondary);\n  font-family: inherit;\n  font-size: 12px;\n  line-height: 18px;\n  cursor: pointer;\n}\n\n._addStep_nfmcv_289:hover {\n  border-color: var(--dsw-alias-brand-primary);\n  border-style: solid;\n  color: var(--dsw-alias-label-primary);\n}\n\n._picker_nfmcv_290 {\n  display: flex;\n  flex-direction: column;\n  gap: 2px;\n  padding: 6px;\n  border: 1px solid var(--dsw-alias-border-l1);\n  border-radius: 10px;\n  background: var(--dsw-alias-bg-layer-2);\n}\n\n._pickerHead_nfmcv_745 {\n  padding: 2px 6px 4px;\n  font-size: 11px;\n  line-height: 16px;\n  color: var(--dsw-alias-label-tertiary);\n}\n\n._pickerRow_nfmcv_290 {\n  padding: 5px 8px;\n  border: none;\n  border-radius: 6px;\n  background: none;\n  color: var(--dsw-alias-label-primary);\n  font-family: inherit;\n  font-size: 13px;\n  line-height: 18px;\n  text-align: left;\n  cursor: pointer;\n}\n\n._pickerRow_nfmcv_290:hover {\n  background: var(--dsw-alias-bg-fill-hover);\n}\n\n._pickerEmpty_nfmcv_769 {\n  margin: 0;\n  padding: 6px;\n  font-size: 12px;\n  line-height: 18px;\n  color: var(--dsw-alias-label-tertiary);\n}\n\n/* --- inspector ----------------------------------------------------------- */\n\n._inspector_nfmcv_779 {\n  display: flex;\n  flex-direction: column;\n  box-sizing: border-box;\n  min-height: 0;\n  min-width: 0;\n}\n\n._tabs_nfmcv_787 {\n  display: flex;\n  flex: none;\n  gap: 2px;\n  padding: 8px 12px 0;\n  border-bottom: 1px solid var(--dsw-alias-border-l1);\n}\n\n._tab_nfmcv_286 {\n  padding: 6px 10px;\n  border: none;\n  border-bottom: 2px solid transparent;\n  background: none;\n  color: var(--dsw-alias-label-secondary);\n  font-family: inherit;\n  font-size: 13px;\n  line-height: 18px;\n  cursor: pointer;\n}\n\n._tab_nfmcv_286:hover {\n  color: var(--dsw-alias-label-primary);\n}\n\n._tabActive_nfmcv_811 {\n  border-bottom-color: var(--dsw-alias-brand-primary);\n  color: var(--dsw-alias-label-primary);\n  font-weight: 500;\n}\n\n/* The mounted card view brings its own padding and its own scroller; this box only\n   has to give it a bounded height so it can own both. */\n._tabBody_nfmcv_819 {\n  display: flex;\n  flex: 1 1 auto;\n  flex-direction: column;\n  min-height: 0;\n  overflow: hidden;\n}\n\n._tabBody_nfmcv_819 > * {\n  min-height: 0;\n}\n\n._noFocus_nfmcv_831 {\n  display: flex;\n  flex-direction: column;\n  gap: 6px;\n  padding: 40px 16px;\n  text-align: center;\n}\n/* Skill card content. The frame and the reorder/removal controls belong to the\n   shared shell, so this sheet styles only the body and the card's own actions. */\n\n._template_1865q_4 {\n  display: block;\n}\n\n._body_1865q_8 {\n  display: flex;\n  flex-direction: column;\n  min-width: 0;\n}\n\n/* The face's way into configuration, as a quiet pill rather than a bare word: at rest it\n   is a control with an edge, and the grid stops reading as three titles with a stray\n   \"配置\" floating at the end of each. */\n._cardActions_1865q_17 {\n  display: inline-flex;\n  gap: 4px;\n}\n\n/* The tint is mixed from the label colour rather than taken from a layer token: in the\n   light theme every layer token is the same white as the card, so a control filled with\n   one would have no edge at all. */\n._cardActions_1865q_17 button {\n  height: 24px;\n  padding: 0 9px;\n  border-radius: 6px;\n  font-size: 12px;\n  font-weight: 500;\n  color: var(--dsw-alias-label-secondary);\n  background: color-mix(in srgb, var(--dsw-alias-label-primary) 5%, transparent);\n  transition: background 0.15s ease, color 0.15s ease;\n}\n\n._cardActions_1865q_17 button:hover {\n  background: color-mix(in srgb, var(--dsw-alias-label-primary) 9%, transparent);\n  color: var(--dsw-alias-label-primary);\n}\n\n/* What the face fills its frame with: the line the last run produced, and the two facts\n   a glance at the grid wants. Both are secondary; the card's name is the only primary\n   thing on it. */\n._faceBody_1865q_44 {\n  display: flex;\n  flex-direction: column;\n  gap: 6px;\n  min-width: 0;\n  /* Fills the shell's body slot so the footer can be pushed to the bottom: the run\n     count then sits on one line across the whole grid, whether the card's summary ran\n     to two lines or to none. */\n  height: 100%;\n}\n\n._faceSummary_1865q_55 {\n  display: -webkit-box;\n  margin: 2px 0 0;\n  overflow: hidden;\n  -webkit-box-orient: vertical;\n  -webkit-line-clamp: 2;\n  font-size: 13px;\n  line-height: 20px;\n  color: var(--dsw-alias-label-secondary);\n}\n\n/* An invitation is not a summary: it sits a level quieter than the text a run produced. */\n._faceSummary_1865q_55[data-face-summary='empty'] {\n  color: var(--dsw-alias-label-tertiary);\n}\n\n/* A card that cannot run has three things to say in a cell sized for two: the result it\n   last produced, why 运行 is closed, and how many runs there have been. The summary gives up\n   a line, because the reason is the part the user can act on. */\n._faceBody_1865q_44[data-face-blocked] ._faceSummary_1865q_55 {\n  -webkit-line-clamp: 1;\n}\n\n/* Why the card's run control is closed. Two lines at most, clamped: the face is an index\n   entry, and a card that shouted the whole sentence would out-shout the result under it.\n   Tinted like the run pages' version, so the two read as one statement in two sizes. */\n._faceProblem_1865q_81 {\n  display: -webkit-box;\n  margin: 0;\n  padding: 4px 8px;\n  overflow: hidden;\n  border-radius: var(--dsw-radius-sm);\n  background: color-mix(in srgb, var(--dsw-alias-label-primary) 4%, transparent);\n  -webkit-box-orient: vertical;\n  -webkit-line-clamp: 2;\n  color: var(--dsw-alias-label-secondary);\n  font-size: 12px;\n  line-height: 18px;\n}\n\n/* Tabular figures keep the times in one column across the grid. */\n._faceFoot_1865q_96 {\n  margin: auto 0 0;\n  font-size: 11px;\n  line-height: 16px;\n  font-variant-numeric: tabular-nums;\n  color: var(--dsw-alias-label-tertiary);\n}\n\n/* One full-panel view: the card's result or its configuration, in the whole\n   display column rather than a grid cell. */\n\n._pageView_1865q_107 {\n  display: flex;\n  flex-direction: column;\n  /* One step of rhythm between the zones — head, composer, document, its actions, the\n     trace — so the document does not read as stuck to the composer above it. */\n  gap: 18px;\n  width: 100%;\n  min-width: 0;\n}\n\n/* The head every full-panel view opens with, in tiers: the way back, then the title\n   with its own controls, then the facts about the view.\n\n   The crumb used to sit inline before the title, so the heading started one button's\n   width in from the page's left edge while every row of the list under it started at\n   that edge: two left margins on one page, and the list appeared to hang out to the left\n   of the title it belongs to. Above the title, the crumb reads as a margin note and the\n   title, the meta, and the rows all share one left edge. */\n._pageHead_1865q_125 {\n  /* Pinned: these views grow with the document under them, and the way back and the card's\n     name used to scroll out of sight within one long report. The scrollport is the workbench\n     panel, which is this head's ancestor. */\n  position: sticky;\n  top: 0;\n  z-index: 2;\n  display: flex;\n  flex-direction: column;\n  gap: 4px;\n  min-width: 0;\n  /* The head is opaque because the document scrolls under it, and the hairline is what\n     separates the two once it is pinned. */\n  padding: 4px 0 10px;\n  background: var(--dsw-alias-bg-base);\n  border-bottom: 1px solid var(--dsw-alias-border-l1);\n}\n\n._pageHeadBar_1865q_143 {\n  display: flex;\n  align-items: center;\n  /* Cancels the button's own inset so the chevron's edge, not its padding, lands on the\n     page's left edge. */\n  margin-left: -6px;\n}\n\n._pageHeadTitle_1865q_151 {\n  margin: 0;\n  flex: 1 1 auto;\n  min-width: 0;\n  font-size: 20px;\n  font-weight: 600;\n  line-height: 28px;\n  letter-spacing: -0.01em;\n  overflow-wrap: anywhere;\n}\n\n\n/* The facts under the title, separated by a middot: three values set in the same grey\n   with nothing between them read as one sentence, and the eye cannot tell where the\n   count ends and the moment begins. */\n._pageHeadMeta_1865q_166 {\n  display: flex;\n  align-items: center;\n  flex-wrap: wrap;\n  min-width: 0;\n  color: var(--dsw-alias-label-secondary);\n  font-size: 12px;\n  line-height: 18px;\n}\n\n._pageHeadMeta_1865q_166 > * + *::before {\n  content: '·';\n  margin: 0 8px;\n  color: var(--dsw-alias-label-caption);\n}\n\n/* The skill a card runs: a chip, because it is a name rather than part of a sentence.\n\n   The separator above is drawn by a pseudo element on the item, and on a chip that lands\n   *inside* the box: the dot sat against the chip's own left padding, with the box starting\n   flush against the word before it. A box is its own separator, so it takes a margin on\n   that side instead. */\n._pageHeadChip_1865q_188 {\n  flex: none;\n  padding: 1px 7px;\n  border-radius: 6px;\n  background: color-mix(in srgb, var(--dsw-alias-label-primary) 5%, transparent);\n  color: var(--dsw-alias-label-secondary);\n  font-size: 11px;\n  line-height: 16px;\n}\n\n._pageHeadMeta_1865q_166 > ._pageHeadChip_1865q_188::before {\n  content: none;\n}\n\n._pageHeadMeta_1865q_166 > ._pageHeadChip_1865q_188:not(:first-child) {\n  margin-left: 10px;\n}\n\n._runProblem_1865q_206 {\n  margin: 0;\n  padding: 8px 10px;\n  border: 1px solid var(--dsw-alias-brand-primary);\n  border-radius: var(--dsw-radius-sm);\n  color: var(--dsw-alias-label-primary);\n  font-size: 12px;\n  line-height: 18px;\n}\n\n/* The run's output section: the trace beneath the result.\n *\n * No box. It was a tinted slab with a hairline, and next to the act dock — the same tint,\n * the same radius, the same weight — the two read as one banded form under the document, so\n * neither the place to write nor the record of how the document was made stood out. The\n * dock took the surface for writing; this keeps none and is what it is: one line of history\n * under the place that acts, with the trace folded behind it. */\n\n/* The run's activity stream: one row per entry — a tool call, a span of the model's own\n   words, or the marker — read top to bottom. The rows wear the conversation's run-record\n   chrome: a leading icon, a title, a 2x2 separator, and a one-line summary that expands,\n   so a long trace reads like the chat it came from rather than a log dump.\n\n   The list is not bounded: like the conversation's own run record, it grows with its\n   content and the page scrolls, so a long reasoning span opens to its full text rather\n   than a narrow frame. */\n._runTraceList_1865q_232 {\n  display: flex;\n  flex-direction: column;\n  min-width: 0;\n}\n\n._activityList_1865q_238 {\n  display: flex;\n  flex-direction: column;\n  gap: 2px;\n  margin: 4px 0 0;\n  padding: 0;\n  list-style: none;\n}\n\n._activityItem_1865q_247 {\n  display: block;\n  min-width: 0;\n}\n\n/* The tool's own name, unshrunk: it is the column a reader scans. */\n._activityToolRow_1865q_253 {\n  min-width: 0;\n}\n\n/* One trace row's shared chrome: the conversation DisclosureRow keeps its own 24px header\n   with the secondary tier; the workbench only sizes the pieces it supplies. */\n._activityRow_1865q_259 {\n  min-width: 0;\n}\n\n._activityTitle_1865q_263 {\n  font-weight: 400;\n}\n\n/* The 2x2 separator between the title and the collapsed summary, matching the\n   conversation's run rows. */\n._activitySep_1865q_269 {\n  flex: none;\n  width: 2px;\n  height: 2px;\n  margin: 0 8px;\n  border-radius: 1px;\n  background: var(--dsw-alias-label-caption);\n}\n\n/* The one-line collapsed summary: secondary tier, ellipsized, filling the row. */\n._activitySummary_1865q_279 {\n  flex: 1 1 auto;\n  min-width: 0;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  font-size: var(--dsh-content-font-size-secondary, 13px);\n  line-height: calc(24px + var(--dsh-content-font-delta, 0px));\n}\n\n/* The expanded body under a row: the full stored text, wrapped, at the secondary tier. */\n._activityBody_1865q_290 {\n  display: flex;\n  flex-direction: column;\n  gap: 4px;\n  min-width: 0;\n  padding: 4px 0 4px 22px;\n}\n\n._activityBodyLabel_1865q_298 {\n  color: var(--dsw-alias-label-tertiary);\n  font-size: var(--dsh-content-font-size-secondary, 13px);\n  line-height: calc(20px + var(--dsh-content-font-delta-secondary, 0px));\n}\n\n._activityBodyText_1865q_304 {\n  min-width: 0;\n  overflow-wrap: anywhere;\n  color: var(--dsw-alias-label-secondary);\n  font-size: var(--dsh-content-font-size-secondary, 13px);\n  line-height: calc(20px + var(--dsh-content-font-delta-secondary, 0px));\n}\n\n/* The model thinking: a disclosure row like the conversation's, set apart from the calls\n   because it is what the card is *reasoning*, not what it is doing. */\n._activityReasoning_1865q_314 {\n  min-width: 0;\n}\n\n/* The model speaking to the user: plain narration, no chrome — it is the reply, not a\n   step. Reads like an assistant message in the conversation. */\n._activityNarration_1865q_320 {\n  min-width: 0;\n  margin: 0;\n  color: var(--dsw-alias-label-secondary);\n  font-size: var(--dsh-content-font-size, 14px);\n  line-height: calc(22px + var(--dsh-content-font-delta, 0px));\n  overflow-wrap: anywhere;\n}\n\n/* A bounded trace's own row. Set apart from the calls because it is not one. */\n._activityTruncated_1865q_330 {\n  color: var(--dsw-alias-label-tertiary);\n  font-size: var(--dsh-content-font-size-secondary, 13px);\n  line-height: calc(20px + var(--dsh-content-font-delta-secondary, 0px));\n}\n\n/* The settled turn-process header above a trace, matching the conversation's Turn process\n   row: a full-width button with the outcome word and a chevron that folds the whole stream. */\n/* No rule of its own any more: the block's edge is the boundary, and the header is the\n   block's first line. It carries a step count because 已完成 alone gave no reason to open\n   it — the summary said how the run ended and nothing about what was inside. */\n/* A chip, not a bar. Full width put the chevron a page away from the words it folds, which\n   is the one thing on the line nobody could connect to it; sized to its own text, the\n   outcome, the count and the chevron read as one control and its hover area agrees with\n   what it looks like. The negative start padding is only so the chip's own inset does not\n   push its text off the document's left edge. */\n._turnProcess_1865q_346 {\n  display: inline-flex;\n  align-items: center;\n  gap: 5px;\n  width: auto;\n  max-width: 100%;\n  margin-left: -4px;\n  padding: 3px 8px 3px 4px;\n  border: none;\n  border-radius: 6px;\n  background: none;\n  color: var(--dsw-alias-label-secondary);\n  font: inherit;\n  font-size: 12px;\n  font-weight: 500;\n  cursor: pointer;\n  text-align: left;\n  transition: color 100ms ease, background 100ms ease;\n}\n\n._turnProcess_1865q_346:hover {\n  background: color-mix(in srgb, var(--dsw-alias-label-primary) 5%, transparent);\n  color: var(--dsw-alias-label-primary);\n}\n\n/* The outcome at a glance, before the word is read: a quiet dot for a settled run and the\n   warning colour for one that failed or was stopped. */\n._turnProcessDot_1865q_373 {\n  flex: none;\n  width: 6px;\n  height: 6px;\n  border-radius: 50%;\n  background: color-mix(in srgb, var(--dsw-alias-label-primary) 24%, transparent);\n}\n\n._turnProcess_1865q_346[data-turn-process=\"failed\"] ._turnProcessDot_1865q_373 {\n  background: var(--dsw-alias-state-warn-label);\n}\n\n._turnProcessLabel_1865q_385 {\n  min-width: 0;\n  overflow: hidden;\n  font-size: inherit;\n  line-height: 18px;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n/* How many entries the fold hides, in the colour of a count rather than of the outcome. */\n._turnProcessSteps_1865q_395 {\n  flex: none;\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 11px;\n  font-weight: 400;\n  font-variant-numeric: tabular-nums;\n}\n\n/* Right after the count: the chevron belongs to the words it folds. */\n._turnProcessChevron_1865q_404 {\n  flex: none;\n  width: 14px;\n  height: 14px;\n  color: inherit;\n  transition: transform 100ms ease;\n}\n\n._turnProcess_1865q_346[data-open] ._turnProcessChevron_1865q_404 {\n  transform: rotate(180deg);\n}\n\n@media (prefers-reduced-motion: reduce) {\n  ._turnProcess_1865q_346,\n  ._turnProcessChevron_1865q_404 {\n    transition: none;\n  }\n}\n\n/* The card's rendered document sits in its own frame. Without a border the template's\n   content reads as the page's own. Nothing inside it is styled here: the document is\n   the user's, inside its own shadow root.\n\n   The boundary rests on the padding alone: this surface carried a heading row with a\n   hairline under it until the product owner removed that row as noise, and what keeps\n   the rendered document — which brings its own shadow and radius — off the border is\n   now the 12px gutter around it. Lowering it would leave the document flush. */\n._resultSurface_1865q_431 {\n  display: flex;\n  flex-direction: column;\n  padding: 12px;\n  border: 1px solid var(--dsw-alias-border-l1);\n  border-radius: var(--dsw-radius-md);\n  min-width: 0;\n}\n\n/* The result's own editor, which takes the surface's content slot where the rendered\n   document was. Gaps rather than margins: the status line, the field, the refusals and the\n   two controls are one column of four things. */\n._resultEditor_1865q_443 {\n  display: flex;\n  flex-direction: column;\n  gap: 10px;\n  min-width: 0;\n}\n\n/* The page's one place to act: three quiet controls where the document they change ends, and\n   the revision log under them. It was a selector plus a dock with a field in it; choosing a\n   way of changing the result now opens a dialog, so there is nothing to write here and\n   nothing to frame.\n\n   The row is the shape the chat's own message actions have: icons with their labels, quiet at\n   rest, one tinted pill under the pointer. Its controls are the page's only way to act on\n   what is above them, so they stay readable rather than waiting for a hover — hiding them\n   would leave a page that looks like it cannot do anything. */\n._actBlock_1865q_459 {\n  display: flex;\n  flex-direction: column;\n  gap: 8px;\n  min-width: 0;\n}\n\n._actRow_1865q_466 {\n  display: flex;\n  flex-wrap: wrap;\n  align-items: center;\n  gap: 2px;\n  margin-left: -8px;\n  min-width: 0;\n}\n\n/* The run's fold sits on the same line as the ways of changing the result, and it is not one\n   of them: it says how the run behind the result ended and opens its steps. So it keeps the\n   gap the actions have between them on its left and its own padding on its right, rather\n   than hanging off the row at the page's edge the way it did when it headed a section. */\n._actRow_1865q_466 ._turnProcess_1865q_346 {\n  margin-left: 6px;\n}\n\n._actAction_1865q_483 {\n  display: inline-flex;\n  align-items: center;\n  gap: 5px;\n  padding: 4px 8px;\n  border: 0;\n  border-radius: var(--dsw-radius-sm);\n  background: transparent;\n  color: var(--dsw-alias-label-secondary);\n  font-family: var(--dsw-font-family);\n  font-size: 12px;\n  font-weight: 500;\n  line-height: 18px;\n  cursor: pointer;\n  transition: background 100ms ease, color 100ms ease;\n}\n\n._actAction_1865q_483:hover {\n  background: color-mix(in srgb, var(--dsw-alias-label-primary) 5%, transparent);\n  color: var(--dsw-alias-label-primary);\n}\n\n._actAction_1865q_483:focus-visible {\n  outline: 2px solid var(--dsw-alias-brand-primary);\n  outline-offset: 1px;\n}\n\n/* A way of changing the result that this one cannot offer — nothing to revise, or a run\n   already holding the card — reads as unavailable rather than disappearing, so the row keeps\n   the same length whichever state the page is in. */\n._actAction_1865q_483:disabled {\n  color: var(--dsw-alias-label-caption);\n  cursor: not-allowed;\n}\n\n._actAction_1865q_483:disabled:hover {\n  background: transparent;\n  color: var(--dsw-alias-label-caption);\n}\n\n/* The dialog a sentence is written in. Portalled to the body by `PromptDialog`, so these\n   classes are not nested under anything the page controls. */\n._dialogOverlay_1865q_525 {\n  position: fixed;\n  inset: 0;\n  z-index: 60;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  padding: 24px;\n  background: color-mix(in srgb, var(--dsw-alias-label-primary) 28%, transparent);\n}\n\n._dialogPanel_1865q_536 {\n  display: flex;\n  flex-direction: column;\n  gap: 10px;\n  box-sizing: border-box;\n  width: min(560px, 100%);\n  max-height: calc(100vh - 48px);\n  padding: 18px 18px 16px;\n  border: 1px solid var(--dsw-alias-border-l2);\n  border-radius: var(--dsw-radius-panel);\n  background: var(--dsw-alias-bg-layer-1);\n  box-shadow: 0 24px 48px -20px color-mix(in srgb, var(--dsw-alias-label-primary) 45%, transparent);\n  overflow: hidden;\n}\n\n/* Keyboard users land on the panel when it holds no field; the field takes the caret itself. */\n._dialogPanel_1865q_536:focus-visible {\n  outline: none;\n}\n\n/* The window that holds a document instead of a form: as wide as the window allows and as\n   tall as the viewport does, because what is inside was laid out for a screen rather than\n   for a column. The height is stated rather than left to the content so that a short\n   document does not shrink the panel and a long one scrolls inside the well. */\n._dialogPanel_1865q_536[data-dialog-size='wide'] {\n  width: min(1040px, 100%);\n  height: min(84vh, 900px);\n  max-height: calc(100vh - 48px);\n}\n\n._dialogHead_1865q_566 {\n  display: flex;\n  align-items: flex-start;\n  gap: 8px;\n  min-width: 0;\n}\n\n._dialogTitle_1865q_573 {\n  flex: 1 1 auto;\n  margin: 0;\n  color: var(--dsw-alias-label-primary);\n  font-size: 15px;\n  font-weight: 600;\n  line-height: 22px;\n  min-width: 0;\n}\n\n._dialogClose_1865q_583 {\n  flex: none;\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  width: 24px;\n  height: 24px;\n  margin: -2px -2px 0 0;\n  padding: 0;\n  border: 0;\n  border-radius: 6px;\n  background: transparent;\n  color: var(--dsw-alias-label-tertiary);\n  cursor: pointer;\n}\n\n._dialogClose_1865q_583:hover {\n  background: color-mix(in srgb, var(--dsw-alias-label-primary) 6%, transparent);\n  color: var(--dsw-alias-label-primary);\n}\n\n._dialogClose_1865q_583:focus-visible {\n  outline: 2px solid var(--dsw-alias-brand-primary);\n  outline-offset: 1px;\n}\n\n._dialogHint_1865q_609 {\n  margin: 0;\n  color: var(--dsw-alias-label-secondary);\n  font-size: 12px;\n  line-height: 18px;\n}\n\n/* A refusal, inside the dialog rather than beside the page: the form was submitted and the\n   Host would not take it, which is the same sentence the run bar states in its own layout.\n   It is the error colour, not the hint's grey, because it is about the press and not the\n   form. */\n._dialogProblem_1865q_620 {\n  margin: 0;\n  color: var(--dsw-alias-state-error-primary);\n  font-size: 12px;\n  line-height: 18px;\n}\n\n/* The form's own surface: unlike the row, this *is* written into, so it carries the frame the\n   block used to. Taller than the bar's field because the dialog exists to give a sentence\n   room. */\n._dialogField_1865q_630 {\n  box-sizing: border-box;\n  width: 100%;\n  min-height: 96px;\n  max-height: 40vh;\n  padding: 10px 12px;\n  border: 1px solid var(--dsw-alias-border-secondary);\n  border-radius: var(--dsw-radius-md);\n  background: var(--dsw-specific-input-major);\n  color: var(--dsw-alias-label-primary);\n  font-family: var(--dsw-font-family);\n  font-size: 13px;\n  line-height: 20px;\n  resize: none;\n  overflow-y: auto;\n}\n\n._dialogField_1865q_630::placeholder {\n  color: var(--dsw-alias-label-tertiary);\n}\n\n._dialogField_1865q_630:disabled {\n  color: var(--dsw-alias-label-tertiary);\n  cursor: not-allowed;\n}\n\n._dialogField_1865q_630:focus-visible {\n  border-color: color-mix(in srgb, var(--dsw-alias-label-primary) 30%, transparent);\n  outline: 2px solid color-mix(in srgb, var(--dsw-alias-brand-primary) 22%, transparent);\n  outline-offset: 1px;\n}\n\n/* The two ways out, at the end the form submits from. */\n._dialogFoot_1865q_663 {\n  display: flex;\n  justify-content: flex-end;\n  gap: 8px;\n  padding-top: 2px;\n}\n\n/* The directory this run happens in, at the top of the run dialog: a label, the value, and the\n   picker beside it. The same three pieces the configuration page's workspace field draws, so\n   the dialog and the page it writes to cannot describe one directory two ways. */\n._runWorkspace_1865q_673 {\n  display: flex;\n  flex-direction: column;\n  gap: 6px;\n  min-width: 0;\n}\n\n/* The picker keeps its own width whatever the path beside it is: two characters of a button\n   wrapping onto a second line is the one thing that makes the row look broken. */\n._runWorkspace_1865q_673 button {\n  flex: none;\n  white-space: nowrap;\n}\n\n/* Where a result happened: one item in the head's row of facts, beside the skill that made it.\n   The path is the exact one and never the folder's name, because the name is a display\n   convenience and the directory that ran is the whole path. Quiet enough to read as a fact\n   rather than a warning — unless the directory is gone, which the path's own colour says. */\n._runWorkspaceLine_1865q_691 {\n  display: inline-flex;\n  align-items: baseline;\n  gap: 4px;\n  min-width: 0;\n  max-width: 100%;\n}\n\n._runWorkspaceLineLabel_1865q_699 {\n  flex: none;\n}\n\n._runWorkspaceLinePath_1865q_703 {\n  min-width: 0;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n._runWorkspaceLine_1865q_691[data-run-workspace-line='invalid'] ._runWorkspaceLinePath_1865q_703 {\n  color: var(--dsw-alias-state-warn-label);\n}\n\n/* The instructions this card was recently given, offered back as chips in the run dialog.\n   A shortcut for the common case — the same ask again, with a small edit — so a click refills\n   the field rather than starting a run. */\n._runChips_1865q_717 {\n  display: flex;\n  flex-wrap: wrap;\n  align-items: center;\n  gap: 6px;\n  min-width: 0;\n}\n\n._runChipsLabel_1865q_725 {\n  flex: none;\n  color: var(--dsw-alias-label-caption);\n  font-size: 12px;\n  line-height: 18px;\n}\n\n._runChip_1865q_717 {\n  max-width: 220px;\n  padding: 2px 8px;\n  border: 1px solid var(--dsw-alias-border-l2);\n  border-radius: 999px;\n  background: none;\n  color: var(--dsw-alias-label-secondary);\n  font-family: var(--dsw-font-family);\n  font-size: 12px;\n  line-height: 16px;\n  white-space: nowrap;\n  text-overflow: ellipsis;\n  overflow: hidden;\n  cursor: pointer;\n}\n\n._runChip_1865q_717:hover {\n  border-color: var(--dsw-alias-border-l3);\n  color: var(--dsw-alias-label-primary);\n}\n\n._runChip_1865q_717:focus-visible {\n  outline: 2px solid var(--dsw-alias-brand-primary);\n  outline-offset: 1px;\n}\n\n/* A refusal of the last revision, stated where the ask was made. */\n._composerProblem_1865q_759 {\n  margin: 0;\n  color: var(--dsw-alias-state-error-primary);\n  font-size: 12px;\n  line-height: 18px;\n}\n\n/* The log reads as a conversation: the instruction, then when it was applied. */\n._refineLog_1865q_767 {\n  display: flex;\n  flex-direction: column;\n  gap: 6px;\n  min-width: 0;\n}\n\n/* The log's header: how many revisions it holds, and the one step back they allow. */\n._refineLogHead_1865q_775 {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  min-width: 0;\n}\n\n._refineLogTitle_1865q_782 {\n  flex: 1 1 auto;\n  min-width: 0;\n  margin: 0;\n  color: var(--dsw-alias-label-secondary);\n  font-size: 12px;\n  font-weight: 500;\n  line-height: 18px;\n}\n\n._refineLogList_1865q_792 {\n  display: flex;\n  flex-direction: column;\n  gap: 4px;\n  margin: 0;\n  padding: 0;\n  list-style: none;\n}\n\n/* One entry is a sentence and its moment, in that order. The row used to be a flex line\n   with the time pushed to the far edge, which put the two facts at opposite ends of a\n   full-width row and made the time look like a column of its own. */\n._refineLogItem_1865q_804 {\n  font-size: 12px;\n  line-height: 18px;\n}\n\n._refineLogInstruction_1865q_809 {\n  color: var(--dsw-alias-label-primary);\n  overflow-wrap: anywhere;\n}\n\n._refineLogTime_1865q_814 {\n  margin-left: 6px;\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 11px;\n  font-variant-numeric: tabular-nums;\n  white-space: nowrap;\n}\n\n/* The block's last line, and the only place that says how long any of it lives. */\n._refineLogNote_1865q_823 {\n  margin: 0;\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 11px;\n  line-height: 16px;\n}\n\n._notice_1865q_830 {\n  display: flex;\n  flex-direction: column;\n  gap: 4px;\n  padding: 4px 0;\n}\n\n._noticeTitle_1865q_837 {\n  margin: 0;\n  color: var(--dsw-alias-label-primary);\n  font-size: 13px;\n  font-weight: 500;\n}\n\n._noticeBody_1865q_844 {\n  margin: 0;\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 12px;\n  line-height: 1.5;\n}\n\n/* The editor opens in place of the body, so it inherits the card's width. */\n\n._settings_1865q_853 {\n  display: flex;\n  flex-direction: column;\n  min-width: 0;\n}\n\n/* One group of the configuration page: a heading, its controls, and a hairline above\n   every group but the first. Groups rather than nested cards — a card inside the\n   page's own surface reads as a second frame around the same thing. */\n._section_1865q_862 {\n  display: flex;\n  flex-direction: column;\n  gap: 10px;\n  min-width: 0;\n  padding: 18px 0;\n}\n\n/* A group's first line: its name, and whatever belongs to the group as a whole — the\n   template's three actions, the preview's caption. The controls used to sit inside the\n   sentence about the region and the byte count, where an underlined 添加动作 read as one\n   more fact instead of the one thing on the line a user could press. */\n._sectionHead_1865q_874 {\n  display: flex;\n  align-items: center;\n  flex-wrap: wrap;\n  gap: 12px;\n  min-width: 0;\n}\n\n._sectionTools_1865q_882 {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  margin-left: auto;\n  min-width: 0;\n}\n\n/* Not flush against the head: the head is pinned and carries a hairline, and a section\n   title one line under it reads as part of the head rather than as the first group. */\n._section_1865q_862:first-child {\n  padding-top: 18px;\n}\n\n._section_1865q_862 + ._section_1865q_862 {\n  border-top: 1px solid var(--dsw-alias-border-l1);\n}\n\n._sectionTitle_1865q_900 {\n  margin: 0;\n  color: var(--dsw-alias-label-primary);\n  font-size: 13px;\n  font-weight: 600;\n  line-height: 20px;\n}\n\n/* Four fields, laid out as two rows of two. One row of four crowded every label against\n   the next control and pushed the last field past the page's edge; a grid makes the shape\n   explicit instead of leaving it to how the labels happen to wrap, and each cell is wide\n   enough for a long name or a full path. */\n._fieldGrid_1865q_912 {\n  display: grid;\n  grid-template-columns: repeat(2, minmax(0, 1fr));\n  gap: 16px 24px;\n  min-width: 0;\n}\n\n/* Narrower than two comfortable fields, one per row: half a phone's width per field is\n   worse than a longer page. */\n@media (max-width: 640px) {\n  ._fieldGrid_1865q_912 {\n    grid-template-columns: minmax(0, 1fr);\n  }\n}\n\n._field_1865q_912 {\n  display: flex;\n  flex-direction: column;\n  min-width: 0;\n  gap: 6px;\n}\n\n/* The model field has two states that are text rather than a control: a route the card\n   cannot offer, and no route at all. Both occupy the place the picker would, at the same\n   height, so the row does not jump between the three states. */\n._fieldValue_1865q_937 {\n  margin: 0;\n  box-sizing: border-box;\n  display: flex;\n  align-items: center;\n  height: 32px;\n  padding: 0 8px;\n  border: 1px solid var(--dsw-alias-border-l2);\n  border-radius: var(--dsw-radius-sm);\n  background: var(--dsw-alias-bg-layer-1);\n  color: var(--dsw-alias-label-secondary);\n  font-size: 13px;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n._fieldLabel_1865q_954 {\n  margin: 0;\n  color: var(--dsw-alias-label-secondary);\n  font-size: 12px;\n}\n\n/* The workspace value and the button that changes it share one row: the value is the\n   widest thing in the field, and the button reads as the action on it. */\n._workspaceRow_1865q_962 {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  min-width: 0;\n}\n\n/* Two lines in the space one control occupies: the leaf name is what the user scans, and\n   the full path underneath is the exact directory. It matches `.fieldValue`'s border and\n   background so the four fields of this group read as one set, but it is taller because it\n   carries two lines. */\n/* One line, like every other control in the grid: the leaf name on the left, the exact\n   path flushing right. Two lines made this cell taller than its neighbour, so no two rows\n   of the group ever lined up — and the row's whole purpose is that they do. */\n._workspaceValue_1865q_976 {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 10px;\n  box-sizing: border-box;\n  flex: 1 1 auto;\n  min-width: 0;\n  height: 32px;\n  padding: 0 8px;\n  border: 1px solid var(--dsw-alias-border-l2);\n  border-radius: var(--dsw-radius-sm);\n  background: var(--dsw-alias-bg-layer-1);\n  overflow: hidden;\n}\n\n/* A path that is no longer a directory is stated by the value itself, in the same warn\n   colour the template's own warnings use: the field is a fact about the card, not an\n   alert to dismiss. */\n._workspaceValueInvalid_1865q_995 {\n  border-color: var(--dsw-alias-state-warn-label);\n}\n\n/* The same row, with a field to type into instead of a value to read. It matches the value\n   control's height and border so a card on a build without a chooser does not look like a\n   different kind of card, and it takes the space the button beside it does not. */\n._workspaceInput_1865q_1002 {\n  box-sizing: border-box;\n  flex: 1 1 auto;\n  min-width: 0;\n  height: 32px;\n  padding: 0 8px;\n  border: 1px solid var(--dsw-alias-border-l2);\n  border-radius: var(--dsw-radius-sm);\n  background: var(--dsw-alias-bg-layer-1);\n  color: var(--dsw-alias-label-primary);\n  font-family: inherit;\n  font-size: 12px;\n  line-height: 18px;\n}\n\n._workspaceInput_1865q_1002:focus {\n  outline: none;\n  border-color: var(--dsw-alias-brand-primary);\n}\n\n._workspaceInputInvalid_1865q_1022 {\n  border-color: var(--dsw-alias-state-warn-label);\n}\n\n._workspaceInput_1865q_1002::placeholder {\n  color: var(--dsw-alias-label-tertiary);\n}\n\n._workspaceLeaf_1865q_1030 {\n  flex: none;\n  max-width: 62%;\n  color: var(--dsw-alias-label-primary);\n  font-size: 13px;\n  line-height: 18px;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n/* Tertiary and small: the exact path, always readable, never competing with the name. */\n._workspacePath_1865q_1042 {\n  flex: 1 1 auto;\n  min-width: 0;\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 11px;\n  line-height: 14px;\n  text-align: right;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n/* A field's own note: what is wrong with this value, or why the control beside it cannot\n   be used. Under the value, because that is what it is about. */\n._fieldNote_1865q_1056 {\n  margin: 0;\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 11px;\n  line-height: 16px;\n}\n\n/* The page's controls are one size and one surface: a form whose fields are 28px tall\n   reads as a settings list from a denser app, and a name field the height of a table row\n   is not obviously a place you can type. */\n._select_1865q_1066,\n._editor_1865q_1067 {\n  border: 1px solid var(--dsw-alias-border-l2);\n  border-radius: var(--dsw-radius-sm);\n  background: var(--dsw-alias-bg-layer-1);\n  color: var(--dsw-alias-label-primary);\n  font-family: var(--dsw-font-family);\n  font-size: 13px;\n}\n\n._select_1865q_1066 {\n  box-sizing: border-box;\n  height: 32px;\n  padding: 0 8px;\n}\n\n/* Tall enough to hold a page of template on a laptop window without pushing the save bar\n   half way up the screen, and still growing on a large one.\n\n   The height comes from the pane's stated row; the field fills it and, with the content\n   taller than the box, scrolls inside it. `min-height: 0` is what lets a text area shrink\n   into a row instead of pushing the row open to fit its text. */\n._editor_1865q_1067 {\n  min-height: 0;\n  padding: 6px;\n  font-family: monospace;\n  /* Not resizable: dragging the handle wrote a height on the field, the pane's row stayed as\n     stated and clipped it, so the handle was a control that broke the layout it sat in. */\n  resize: none;\n}\n\n/* The editor's status rail, at the foot of the pane: where the region is, what the\n   template declares, and how much of the size budget it uses. These are readings of the\n   text above them, so they belong under it — a line of facts above a code block reads as\n   a caption for the section, and it took a whole row away from the editor. */\n._editorStatus_1865q_1101 {\n  grid-column: 1 / -1;\n  display: flex;\n  align-items: center;\n  flex-wrap: wrap;\n  gap: 2px 10px;\n  box-sizing: border-box;\n  padding: 5px 10px;\n  border-top: 1px solid var(--dsw-alias-border-l1);\n  background: color-mix(in srgb, var(--dsw-alias-label-primary) 2%, transparent);\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 11px;\n  line-height: 16px;\n}\n\n/* Pushed to the rail's far end: it is about the whole file, not about the region's range. */\n._editorStatusDirty_1865q_1117 {\n  margin-left: auto;\n  color: var(--dsw-alias-label-secondary);\n}\n\n/* A template with no region cannot run at all, so the whole line turns into the\n   warning rather than one clause of it. */\n._editorStatusMissing_1865q_1124 {\n  color: var(--dsw-alias-state-warn-label);\n}\n\n/* Above 85% of the byte budget the count is the fact that matters. */\n._editorStatusWarn_1865q_1129 {\n  color: var(--dsw-alias-state-warn-label);\n}\n\n/* The template read as structure. Same metrics as the field it replaces, so switching\n   between the two does not move the text a line up or down, and the same tinted number\n   column, so the two views read as one pane. */\n._foldView_1865q_1136 {\n  grid-column: 1 / -1;\n  /* Fills the pane's stated row, like the field it replaces: the two presentations have to be\n     the same size to read as one pane, and a view that grows with its document is a page. */\n  min-height: 0;\n  padding: 6px 0;\n  overflow: auto;\n  font-family: ui-monospace, \"Cascadia Mono\", Consolas, \"Courier New\", monospace;\n  font-size: 12px;\n  line-height: 18px;\n  /* The scrollbar a long document brings must not narrow the code mid-read. */\n  scrollbar-gutter: stable;\n}\n\n._foldRow_1865q_1150 {\n  display: flex;\n  align-items: flex-start;\n  min-width: max-content;\n}\n\n/* Fills the rest of the row so the row's hover tint covers the whole width, while the\n   count stays against the text it belongs to instead of at the far edge of a long pane. */\n._foldRow_1865q_1150::after {\n  content: '';\n  flex: 1 1 auto;\n}\n\n._foldRow_1865q_1150:hover {\n  background: color-mix(in srgb, var(--dsw-alias-label-primary) 3%, transparent);\n}\n\n/* The number column, the caret, and the text are three buttons in one row. Nothing here is\n   a tab stop: the row's job is to hand a line to the field, and the field is a keyboard\n   control on its own. */\n._foldNumber_1865q_1170,\n._foldCaret_1865q_1171,\n._foldText_1865q_1172 {\n  margin: 0;\n  border: 0;\n  background: transparent;\n  font: inherit;\n  line-height: inherit;\n  cursor: pointer;\n}\n\n._foldNumber_1865q_1170 {\n  flex: none;\n  width: 44px;\n  padding: 0 8px;\n  border-right: 1px solid var(--dsw-alias-border-l1);\n  background: color-mix(in srgb, var(--dsw-alias-label-primary) 3%, transparent);\n  color: var(--dsw-alias-label-tertiary);\n  text-align: right;\n  user-select: none;\n}\n\n._foldCaret_1865q_1171,\n._foldCaretBlank_1865q_1193 {\n  flex: none;\n  width: 18px;\n  padding: 0;\n  color: var(--dsw-alias-label-secondary);\n  text-align: center;\n  user-select: none;\n}\n\n._foldText_1865q_1172 {\n  flex: 0 0 auto;\n  padding: 0 10px 0 0;\n  color: var(--dsw-alias-label-primary);\n  text-align: left;\n  white-space: pre;\n}\n\n/* What one folded line stands for: the size of what is hidden, so a fold that swallowed\n   the whole stylesheet cannot be mistaken for a fold that hid three lines. */\n._foldCount_1865q_1212 {\n  flex: none;\n  padding: 0 12px 0 6px;\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 11px;\n  white-space: nowrap;\n}\n\n/* Gutter and text on the first row, the status rail under both of them. The gutter and\n   the text must share font, size, line height and vertical padding, or the numbers stop\n   lining up with the lines they label.\n\n   The first row's height is stated rather than divided. `minmax(0, 1fr)` inside a grid that\n   is as tall as its own content has nothing to divide, so the row grew to the code's full\n   height: a three-hundred-line template made a five-thousand-pixel field, the page scrolled\n   instead of the field, and a jump selected a line that was nowhere on screen. A stated row\n   makes the field and the gutter the scrollers, and keeps the page a page. */\n._editorPane_1865q_1229 {\n  display: grid;\n  grid-template-columns: auto minmax(0, 1fr);\n  grid-template-rows: clamp(280px, 44vh, 560px) auto;\n  border: 1px solid var(--dsw-alias-border-l2);\n  border-radius: var(--dsw-radius-md);\n  background: var(--dsw-alias-bg-layer-1);\n  overflow: hidden;\n}\n\n/* The gutter. Its lines are separate elements so one band can be drawn across the\n   region's lines and a second, subtler one across the action block. Font, size, line\n   height and vertical padding are restated on the lines themselves, because a band\n   that changes any of them pulls the numbers off the text they label. */\n._gutter_1865q_1243 {\n  margin: 0;\n  padding: 6px 0;\n  border-right: 1px solid var(--dsw-alias-border-l1);\n  /* A tint rather than a layer token: both layer tokens are the same white in this theme,\n     which left the numbers floating in the code with nothing separating them. */\n  background: color-mix(in srgb, var(--dsw-alias-label-primary) 3%, transparent);\n  color: var(--dsw-alias-label-tertiary);\n  font-family: monospace;\n  font-size: 12px;\n  line-height: 18px;\n  text-align: right;\n  /* Scrolling happens in the text area; the gutter follows it in code. */\n  overflow: hidden;\n  user-select: none;\n}\n\n/* One numbered line, which is also its own click target. The transparent left border\n   is what keeps every number in one column once a banded line adds a coloured border\n   of the same width. */\n._gutterLine_1865q_1263 {\n  display: block;\n  width: 100%;\n  margin: 0;\n  padding: 0 8px;\n  border: 0;\n  border-left: 2px solid transparent;\n  background: none;\n  color: inherit;\n  font: inherit;\n  line-height: inherit;\n  text-align: right;\n  cursor: pointer;\n}\n\n._gutterLine_1865q_1263:hover {\n  color: var(--dsw-alias-label-primary);\n}\n\n/* The region a child fills: the two marker lines and everything between them. */\n._gutterLineRegion_1865q_1283 {\n  background: color-mix(in srgb, var(--dsw-alias-brand-primary) 12%, transparent);\n  border-left-color: var(--dsw-alias-brand-primary);\n  color: var(--dsw-alias-label-primary);\n}\n\n/* The action declaration block, drawn more faintly so the two bands stay\n   distinguishable in a template that has both. */\n._gutterLineActions_1865q_1291 {\n  background: color-mix(in srgb, var(--dsw-alias-label-tertiary) 14%, transparent);\n  border-left-color: var(--dsw-alias-label-tertiary);\n}\n\n._editorPane_1865q_1229 ._editor_1865q_1067 {\n  border: 0;\n  border-radius: 0;\n  background: transparent;\n  font-size: 12px;\n  line-height: 18px;\n  padding: 6px 8px;\n  /* A number labels a row only while one line of the file is one row on screen: a wrapped\n     line pushed every number under it onto its neighbour's line, and indentation read as\n     ragged because the glyphs were not on a grid. Long lines scroll sideways instead, in a\n     stack that is monospaced on every Windows without the shell's default font deciding. */\n  white-space: pre;\n  overflow-wrap: normal;\n  /* Both axes are stated: a long file scrolls inside the field, and a jump moves that scroll.\n     Leaving the vertical axis to be inferred from the horizontal one made the pane's own\n     scroller a candidate for a jump, and a jump that scrolls the wrong box looks like a jump\n     that did nothing. */\n  overflow-x: auto;\n  overflow-y: auto;\n  tab-size: 2;\n  font-family: ui-monospace, \"Cascadia Mono\", Consolas, \"Courier New\", monospace;\n  /* The scrollbar that appears with a long file must not narrow the text mid-edit. */\n  scrollbar-gutter: stable;\n}\n\n._editorPane_1865q_1229 ._editor_1865q_1067:focus-visible {\n  border: 0;\n  outline: none;\n}\n\n._editorPane_1865q_1229:focus-within {\n  border-color: var(--dsw-alias-brand-primary);\n}\n\n._editor_1865q_1067:focus-visible,\n._select_1865q_1066:focus-visible {\n  border-color: var(--dsw-alias-brand-primary);\n  outline: none;\n}\n\n._violations_1865q_1336 {\n  margin: 0;\n  padding-left: 18px;\n  color: var(--dsw-alias-label-primary);\n  font-size: 12px;\n  line-height: 1.6;\n}\n\n/* A violation is a jump target: clicking it puts the caret on the construct it names.\n   It keeps the list's own type and colour so the list still reads as a list. */\n._violationJump_1865q_1346 {\n  padding: 0;\n  border: 0;\n  background: none;\n  color: inherit;\n  font: inherit;\n  text-align: left;\n  text-decoration: underline;\n  text-decoration-style: dotted;\n  cursor: pointer;\n}\n\n._violationJump_1865q_1346:hover,\n._violationJump_1865q_1346:focus-visible {\n  color: var(--dsw-alias-label-primary);\n  text-decoration-style: solid;\n}\n\n/* The frame the document is drawn in, inside the preview window: tinted, inset, and the one\n   thing in the panel that scrolls, so a document taller than the window scrolls inside it\n   rather than pushing the head and the footer out of view. */\n._previewFrame_1865q_1367 {\n  display: flex;\n  flex-direction: column;\n  gap: 8px;\n  box-sizing: border-box;\n  flex: 1 1 auto;\n  min-width: 0;\n  min-height: 0;\n  padding: 10px;\n  border: 1px solid var(--dsw-alias-border-l1);\n  border-radius: var(--dsw-radius-md);\n  background: color-mix(in srgb, var(--dsw-alias-label-primary) 2%, transparent);\n}\n\n/* The well the document is drawn in: white on the tinted frame, so the user's own card\n   reads as the document and the frame reads as the page around it. */\n._preview_1865q_1367 {\n  flex: 1 1 auto;\n  box-sizing: border-box;\n  min-height: 0;\n  padding: 8px;\n  border: 1px dashed var(--dsw-alias-border-l2);\n  border-radius: var(--dsw-radius-sm);\n  background: var(--dsw-alias-bg-layer-1);\n  overflow: auto;\n}\n\n\n._settingsActions_1865q_1395 {\n  display: flex;\n  gap: 6px;\n}\n\n/* The declaration builder: a small form that writes one line into the template. */\n\n._actionBuilder_1865q_1402 {\n  display: flex;\n  flex-direction: column;\n  gap: 10px;\n  box-sizing: border-box;\n  padding: 12px;\n  border: 1px solid var(--dsw-alias-border-l1);\n  border-radius: var(--dsw-radius-sm);\n  background: var(--dsw-alias-bg-layer-2);\n}\n\n._builderRow_1865q_1413 {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 16px;\n  min-width: 0;\n}\n\n._builderField_1865q_1420 {\n  display: flex;\n  flex: 1 1 160px;\n  flex-direction: column;\n  gap: 6px;\n  min-width: 0;\n}\n\n/* The key's grammar, and the reason the confirm button is disabled. It is a line of\n   text rather than a tooltip because it has to be readable while typing. */\n._hint_1865q_1430 {\n  margin: 0;\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 11px;\n  line-height: 16px;\n}\n\n._hintError_1865q_1437 {\n  color: var(--dsw-alias-state-error-primary);\n}\n\n/* The page's footer, pinned to the bottom of the scroll container: saving must not\n   depend on scrolling past a preview that can be arbitrarily tall.\n\n   Sticky insets resolve against the scrollport's *content* edge, so `bottom: 0` pinned\n   this bar one page-padding up (48px, from the panel's own `.page`) — and the template's\n   lines kept scrolling through the strip underneath it, which read as the bar cutting the\n   editor in half. The negative inset puts the reference back on the padding's outer edge,\n   which is the window's own bottom. */\n._configFooter_1865q_1449 {\n  position: sticky;\n  bottom: -48px;\n  z-index: 1;\n  display: flex;\n  flex-direction: column;\n  gap: 6px;\n  box-sizing: border-box;\n  margin-top: 8px;\n  padding: 12px 0 14px;\n  border-top: 1px solid var(--dsw-alias-border-l1);\n  background: var(--dsw-alias-bg-base);\n  /* A hairline alone left the editor's last lines looking cut rather than covered: the bar\n     and the page are the same white, so the bar has to cast something to read as a bar. */\n  box-shadow: 0 -12px 20px -18px color-mix(in srgb, var(--dsw-alias-label-primary) 55%, transparent);\n}\n\n/* What the save button would keep, stated beside it. */\n._footerHint_1865q_1467 {\n  margin-left: 4px;\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 11px;\n  line-height: 16px;\n}\n\n._footerActions_1865q_1474 {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n}\n\n._footerSpacer_1865q_1480 {\n  flex: 1 1 auto;\n}\n\n/* What the second press will do, stated where the press happens. */\n._deletePrompt_1865q_1485 {\n  color: var(--dsw-alias-state-error-primary);\n  font-size: 11px;\n  line-height: 16px;\n}\n\n/* Both selectors carry two classes so the colour wins over the shared Button's own\n   `color` and `:hover` rules whatever order the two stylesheets load in. */\n._footerActions_1865q_1474 ._deleteCard_1865q_1493 {\n  color: var(--dsw-alias-state-error-primary);\n}\n\n._footerActions_1865q_1474 ._deleteCard_1865q_1493:hover:not(:disabled) {\n  background: var(--dsw-alias-interactive-bg-hover-danger);\n  color: var(--dsw-alias-state-error-primary);\n}\n\n/* A write the controller refused used to leave the page looking untouched. */\n._writeFailure_1865q_1503 {\n  margin: 0;\n  color: var(--dsw-alias-state-error-primary);\n  font-size: 12px;\n  line-height: 18px;\n}\n\n/* The in-place confirmation panel, which takes the card's display area the way the\n   editor does. */\n\n._actionPanel_1865q_1513 {\n  display: flex;\n  flex-direction: column;\n  gap: 10px;\n  padding: 10px;\n  border: 1px solid var(--dsw-alias-border-l1);\n  border-radius: var(--dsw-radius-sm);\n}\n\n._actionFacts_1865q_1522 {\n  display: grid;\n  grid-template-columns: max-content 1fr;\n  gap: 6px 12px;\n  margin: 0;\n  font-size: 12px;\n}\n\n._actionFacts_1865q_1522 dt {\n  color: var(--dsw-alias-label-secondary);\n}\n\n._actionFacts_1865q_1522 dd {\n  margin: 0;\n  min-width: 0;\n  overflow-wrap: anywhere;\n}\n\n/* The directory the panel proposes, and the sentence saying what it is for: the field is the\n   same one the card's own page uses, so only the breathing room under it is set here. */\n._actionFacts_1865q_1522 [data-action-workspace-note] {\n  margin-top: 4px;\n}\n\n/* The payload whole: scrollable, never truncated, never collapsed. It is the one thing\n   standing between a model-authored row and the run that receives it. */\n._actionPayload_1865q_1548 {\n  max-height: 240px;\n  margin: 0;\n  padding: 8px;\n  border: 1px solid var(--dsw-alias-border-l1);\n  border-radius: var(--dsw-radius-sm);\n  background: var(--dsw-alias-bg-layer-2);\n  overflow: auto;\n  font-family: monospace;\n  font-size: 12px;\n  white-space: pre-wrap;\n  overflow-wrap: anywhere;\n}\n\n/* A bare run's one line: whether it is still going, and how it ended. */\n\n._bareRun_1865q_1564 {\n  margin: 0;\n  color: var(--dsw-alias-label-primary);\n  font-size: 12px;\n  line-height: 18px;\n  overflow-wrap: anywhere;\n}\n\n._bareRun_1865q_1564[data-bare-run='settled'] {\n  color: var(--dsw-alias-label-secondary);\n}\n\n\n/* The run-history page: its heading, the count line, the empty state, and the runs.\n\n   The list is read as days: one heading per day, rows under it, a hairline between rows.\n   A row is two lines of its own — what the run produced, then the facts that tell it\n   apart from its neighbours — with the outcome opposite, so a reader scanning for a run\n   lands on content rather than on seven identical completion words. */\n\n._runsHeadText_1865q_1584 {\n  display: flex;\n  flex-direction: column;\n  gap: 2px;\n  flex: 1 1 auto;\n  min-width: 0;\n}\n\n._runsHeadTitle_1865q_1592 {\n  margin: 0;\n  font-size: 18px;\n  font-weight: 600;\n  line-height: 26px;\n  overflow-wrap: anywhere;\n}\n\n._runsHeadMeta_1865q_1600 {\n  display: flex;\n  flex-wrap: wrap;\n  align-items: baseline;\n  gap: 8px;\n  margin: 0;\n  min-width: 0;\n}\n\n._runHistoryCount_1865q_1609 {\n  margin: 0;\n  color: var(--dsw-alias-label-secondary);\n  font-size: 12px;\n  line-height: 18px;\n}\n\n._runHistoryEmpty_1865q_1616 {\n  margin: 0;\n  padding: 32px 12px;\n  border: 1px dashed var(--dsw-alias-border-l2);\n  border-radius: var(--dsw-radius-sm);\n  color: var(--dsw-alias-label-secondary);\n  font-size: 13px;\n  line-height: 20px;\n  text-align: center;\n}\n\n._runHistoryList_1865q_1627 {\n  display: flex;\n  flex-direction: column;\n  gap: 14px;\n  min-width: 0;\n}\n\n._runHistoryGroup_1865q_1634 {\n  display: flex;\n  flex-direction: column;\n  gap: 4px;\n  min-width: 0;\n}\n\n/* The day a group of rows completed on. It is a caption, not a title: the rows below it\n   are what the page is about, and a heavier heading would make the list read as days.\n\n   It sticks to the top of the list while its own group scrolls past, because a long\n   history is read one day at a time and the rows themselves carry only a clock: without\n   the caption on screen, \"22:47\" is a time on no particular day. */\n._runHistoryDay_1865q_1647 {\n  position: sticky;\n  top: 0;\n  z-index: 1;\n  margin: 0;\n  padding: 5px 10px 6px;\n  background: var(--dsw-alias-bg-base);\n  color: var(--dsw-alias-label-caption);\n  font-size: 11px;\n  font-weight: 500;\n  line-height: 16px;\n  letter-spacing: 0.04em;\n}\n\n._runHistoryItems_1865q_1661 {\n  margin: 0;\n  padding: 0;\n  list-style: none;\n  min-width: 0;\n}\n\n._runHistoryItem_1865q_1661 {\n  min-width: 0;\n}\n\n/* Rows separate by a hairline rather than by their own borders: seven outlined boxes\n   read as seven unrelated cards, while one column of rows reads as one day's work. */\n._runHistoryItem_1865q_1661 + ._runHistoryItem_1865q_1661 {\n  border-top: 1px solid var(--dsw-alias-border-l1);\n}\n\n/* The row is a container rather than the button itself: a run in flight carries a stop\n   control of its own, and a button inside a button is not a thing a browser can draw. */\n._runHistoryRow_1865q_1680 {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  width: 100%;\n  min-width: 0;\n  margin: 0;\n  padding: 10px;\n  border-radius: var(--dsw-radius-sm);\n}\n\n._runHistoryRow_1865q_1680:hover {\n  background: var(--dsw-alias-bg-fill-hover);\n}\n\n._runHistoryOpen_1865q_1695 {\n  position: relative;\n  display: flex;\n  align-items: center;\n  gap: 12px;\n  flex: 1 1 auto;\n  min-width: 0;\n  margin: 0;\n  padding: 0;\n  border: 0;\n  background: none;\n  color: inherit;\n  font: inherit;\n  text-align: left;\n  cursor: pointer;\n}\n\n/* A run that did not finish earns a mark on the row's edge.\n\n   Seven rows of one card are mostly the same shape, and the one that failed differs\n   only in a small word on the far right: the eye scanning the titles had nothing to\n   catch on. The bar is that catch, and it is drawn inside the row's padding so that no\n   row's text moves — the list keeps one left edge, marked rows included. */\n._runHistoryOpen_1865q_1695::before {\n  content: '';\n  position: absolute;\n  /* On the row's own left edge, one row's padding away from the text: far enough that it\n     reads as a margin mark rather than as part of the first glyph. */\n  left: -10px;\n  top: 50%;\n  width: 2px;\n  height: 18px;\n  margin-top: -9px;\n  border-radius: 1px;\n  background: transparent;\n}\n\n._runHistoryOpen_1865q_1695[data-run-outcome='aborted']::before {\n  background: var(--dsw-alias-state-warn-label);\n}\n\n._runHistoryOpen_1865q_1695[data-run-outcome='error']::before,\n._runHistoryOpen_1865q_1695[data-run-outcome='failed']::before {\n  background: var(--dsw-alias-state-error-primary);\n}\n\n._runHistoryOpen_1865q_1695[data-run-outcome='running']::before {\n  background: var(--dsw-alias-link);\n}\n\n/* The stop control is quiet until it is wanted: it sits beside the outcome it ends, and\n   only the row of a run in flight has one. */\n._runHistoryStop_1865q_1747 {\n  flex: none;\n  margin: 0;\n  padding: 2px 8px;\n  border: 1px solid var(--dsw-alias-border-secondary);\n  border-radius: var(--dsw-radius-sm);\n  background: none;\n  color: var(--dsw-alias-label-secondary);\n  font: inherit;\n  font-size: 11px;\n  line-height: 16px;\n  cursor: pointer;\n}\n\n._runHistoryStop_1865q_1747:hover {\n  color: var(--dsw-alias-label-primary);\n  border-color: var(--dsw-alias-border-primary);\n}\n\n._runHistoryBody_1865q_1766 {\n  display: flex;\n  flex-direction: column;\n  gap: 1px;\n  flex: 1 1 auto;\n  min-width: 0;\n}\n\n/* The run's content is the row's title: the only line at reading weight, and the only\n   one allowed to be the first thing the eye lands on. */\n._runHistoryTitle_1865q_1776 {\n  min-width: 0;\n  color: var(--dsw-alias-label-primary);\n  font-size: 14px;\n  font-weight: 500;\n  line-height: 21px;\n  /* One line: a two-line clamp let one long title stand taller than its neighbours and\n     made the rhythm of the list ragged. */\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n/* A run that stored nothing still owns the row's first line. Without it the row was a\n   lone grey meta line, which read as a row that had failed to load rather than a run that\n   had nothing to say. */\n._runHistoryTitle_1865q_1776[data-empty='true'] {\n  font-weight: 400;\n  color: var(--dsw-alias-label-tertiary);\n}\n\n._runHistoryMeta_1865q_1797 {\n  display: flex;\n  align-items: baseline;\n  min-width: 0;\n  flex-wrap: wrap;\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 11px;\n  line-height: 16px;\n}\n\n/* The same middot the page head uses between its facts, for the same reason: a clock, a\n   model id, and an ordinal set in one grey with only space between them read as one\n   string. */\n._runHistoryMeta_1865q_1797 > * + *::before {\n  content: '·';\n  margin: 0 6px;\n  color: var(--dsw-alias-label-caption);\n}\n\n/* The clock is the one fact on this line a reader compares across rows, so it is a step\n   above the model id and the ordinal, in figures that line up column-wise. */\n._runHistoryTime_1865q_1818 {\n  color: var(--dsw-alias-label-secondary);\n  font-size: 12px;\n  font-variant-numeric: tabular-nums;\n  white-space: nowrap;\n}\n\n._runHistoryModel_1865q_1825 {\n  /* Wide enough for a real model id — `GLM-FLASH-LATEST` — so the truncation lands on a\n     name that is actually long rather than on the one this workbench runs. */\n  max-width: 24ch;\n  color: var(--dsw-alias-label-tertiary);\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n._runHistoryOrdinal_1865q_1835,\n._runHistoryEdited_1865q_1836 {\n  flex: none;\n  color: var(--dsw-alias-label-tertiary);\n  white-space: nowrap;\n}\n\n/* What the run was asked for: one line under the row's own meta, because two runs of one\n   card differ by this and a wrapped quote would make every row's height depend on how much\n   was typed. The full text is on the result page that opens from the row. */\n._runHistoryInstruction_1865q_1845 {\n  display: block;\n  max-width: 100%;\n  color: var(--dsw-alias-label-secondary);\n  font-size: 11px;\n  line-height: 16px;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n._runHistorySide_1865q_1856 {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  flex: none;\n}\n\n/* The outcome is a quiet dot and a word. Only a run that did not complete earns a\n   hearing: a wall of neutral \"已完成\" would compete with the titles it sits beside.\n\n   Right-aligned in a column of its own width, so the dots and the words line up down the\n   right edge instead of starting wherever each word's length puts them. */\n._runHistoryOutcome_1865q_1868 {\n  display: inline-flex;\n  align-items: center;\n  justify-content: flex-end;\n  gap: 5px;\n  min-width: 4em;\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 11px;\n  line-height: 16px;\n  white-space: nowrap;\n}\n\n._runHistoryDot_1865q_1880 {\n  width: 6px;\n  height: 6px;\n  flex: none;\n  border-radius: 50%;\n  background: currentColor;\n}\n\n._runHistoryRow_1865q_1680 [data-run-outcome='aborted'] ._runHistoryOutcome_1865q_1868 {\n  color: var(--dsw-alias-state-warn-label);\n}\n\n._runHistoryRow_1865q_1680 [data-run-outcome='error'] ._runHistoryOutcome_1865q_1868,\n._runHistoryRow_1865q_1680 [data-run-outcome='failed'] ._runHistoryOutcome_1865q_1868 {\n  color: var(--dsw-alias-state-error-primary);\n}\n\n._runHistoryRow_1865q_1680 [data-run-outcome='running'] ._runHistoryOutcome_1865q_1868 {\n  color: var(--dsw-alias-link);\n}\n\n._runHistoryRow_1865q_1680 [data-run-outcome='running'] ._runHistoryDot_1865q_1880 {\n  animation: _runHistoryPulse_1865q_1 1.4s ease-in-out infinite;\n}\n\n@keyframes _runHistoryPulse_1865q_1 {\n  0%, 100% { opacity: 1; }\n  50% { opacity: 0.25; }\n}\n\n@media (prefers-reduced-motion: reduce) {\n  ._runHistoryRow_1865q_1680[data-run-outcome='running'] ._runHistoryDot_1865q_1880 {\n    animation: none;\n  }\n}\n\n/* The way in, quiet at rest and nudged on hover: the whole row is the control, and this\n   only has to say which direction it goes. */\n._runHistoryChevron_1865q_1918 {\n  display: inline-flex;\n  flex: none;\n  color: var(--dsw-alias-label-caption);\n  line-height: 1;\n  transition: color 0.15s ease, transform 0.15s ease;\n}\n\n._runHistoryRow_1865q_1680:hover ._runHistoryChevron_1865q_1918,\n._runHistoryOpen_1865q_1695:focus-visible ._runHistoryChevron_1865q_1918 {\n  color: var(--dsw-alias-label-secondary);\n  transform: translateX(2px);\n}/* ==========================================================================\n   宸ヤ綔鍙?路 娴佹按绾块潰鏉?   --------------------------------------------------------------------------\n   鍘熷瀷 docs/prototypes/workbench-pipeline-v2.html 鐨勬牱寮忥紝閫愭潯鎼繃鏉ワ紝鍙敼浜嗕袱澶勶細\n\n   1. 绫诲悕鍓嶇紑 wb-銆傚師鍨嬫槸鐙珛椤甸潰锛屾彃浠惰鍜屽涓荤殑鏍峰紡鍚屽涓€寮犺〃锛涘墠缂€鏄敮涓€鐨?      鍛藉悕绌洪棿锛屼篃鎰忓懗鐫€ DOM 閲岀殑绫诲悕灏辨槸杩欎釜鏂囦欢閲岀殑绫诲悕锛屼笉缁忚繃鍝堝笇杩欎竴灞傘€?   2. 閰嶈壊涓嶅啀鍐欐涓ゅ鑹叉澘锛屾敼涓?DSH 鐨勮璁′护鐗岋紙瑙?.wb-root锛夈€傛繁娴呰壊璺熼殢 DSH\n      鑷繁鍒囨崲锛屾彃浠朵笉缁存姢绗簩濂楅鑹层€?\n   鍏朵綑閫夋嫨鍣ㄣ€佹暟鍊笺€侀棿璺濅繚鎸佸師鍨嬪師鏍凤紝鏂逛究閫愭潯瀵圭収銆?   ========================================================================== */\n/**\n * 流水线工作台的样式，逐条取自 docs/prototypes/workbench-pipeline-v2.html。\n *\n * 原型自带两套固定色板（浅色/深色写在 body[data-theme] 上）。这里把它的令牌改写为\n * DSH 的同义令牌，于是插件跟 DSH 一起换肤，不必再维护第二套颜色。除此之外，选择器、\n * 数值、间距、圆角、阴影都保持原型的写法，改起来仍能一句一句对回原型。\n */\n\n.wb-root {\n  /* 字体 */\n  --f-sans: var(--dsw-font-family);\n  --f-mono: ui-monospace, SFMono-Regular, 'Cascadia Mono', Consolas, monospace;\n\n  /* 底色：面板、凹槽、卡片。原型里 pane 与 base 同为白，分界只靠那条竖线，\n     所以这里也不再给检查器垫底灰——保持原型的样子。 */\n  --base: var(--dsw-alias-bg-base);\n  --pane: var(--dsw-alias-bg-base);\n  --rail: color-mix(in srgb, var(--dsw-alias-label-primary) 3%, transparent);\n  --card-bg: var(--dsw-alias-bg-base);\n  --recess: color-mix(in srgb, var(--dsw-alias-label-primary) 3%, transparent);\n\n  /* 交互。宿主的 hover 底色叫 -interactive-bg-hover（rgba(38,49,72,.06) / rgba(255,255,255,.08)），\n     正是原型 --hover 的两个值；此前挂的 -bg-fill-hover 在宿主里根本没有定义，\n     var() 失效又不报错，于是标签底色、空态方块、各行 hover 一律变成透明。 */\n  --hover: var(--dsw-alias-interactive-bg-hover);\n  --hover-strong: color-mix(in srgb, var(--dsw-alias-label-primary) 9%, transparent);\n\n  /* 文字 */\n  font-family: var(--f-sans);\n\n  --ink: var(--dsw-alias-label-primary);\n  --ink2: var(--dsw-alias-label-secondary);\n  /* 原型 ink3（浅色 rgb(92,97,103)）比 ink2 再深一点，宿主的 -label-tertiary 在浅色里是\n     rgb(129,133,140)（比 secondary 还浅），只有 -label-secondary 对得上；深色下会略亮，认了。 */\n  --ink3: var(--dsw-alias-label-secondary);\n  --ink4: var(--dsw-alias-label-tertiary);\n\n  /* 分隔与边框。宿主给的 border-l1 在浅色主题里只有百分之二的黑，等于没有；\n     原型是 rgba(0,0,0,.1) / .08，这里按墨色混出同样的浓度，深浅主题都成立。 */\n  --hairline: color-mix(in srgb, var(--dsw-alias-label-primary) 10%, transparent);\n  --divider: color-mix(in srgb, var(--dsw-alias-label-primary) 8%, transparent);\n\n  /* 强调与状态 */\n  /* -brand-primary 在宿主浅色主题里是 rgb(15,17,21)（近黑），原型是蓝的：选中的页签、\n     下划线、运行中的分段条全靠它，黑着就等于没强调。-state-business-primary 是宿主的强调蓝\n     （浅色 rgb(65,118,230)，深色 rgb(122,170,255)——和原型深色精确相同）。 */\n  --accent: var(--dsw-alias-state-business-primary);\n  --accent-soft: color-mix(in srgb, var(--dsw-alias-brand-primary) 16%, transparent);\n  --accent-wash: color-mix(in srgb, var(--dsw-alias-brand-primary) 7%, transparent);\n  --success: #22c55e;\n  --warn: #f59e0b;\n  --danger: var(--dsw-alias-state-error-primary);\n  --danger-wash: color-mix(in srgb, var(--dsw-alias-state-error-primary) 7%, transparent);\n  --idle: color-mix(in srgb, var(--dsw-alias-label-primary) 17%, transparent);\n\n  /* 主按钮、阴影、遮罩 */\n  --primary-bg: var(--dsw-alias-label-primary);\n  --primary-ink: var(--dsw-alias-bg-base);\n  --shadow-menu: 0 12px 32px color-mix(in srgb, #000 14%, transparent), 0 2px 8px color-mix(in srgb, #000 6%, transparent);\n  --shadow-node: 0 1px 2px color-mix(in srgb, #000 5%, transparent);\n  --scrim: color-mix(in srgb, #000 24%, transparent);\n  --scroll: color-mix(in srgb, var(--dsw-alias-label-primary) 14%, transparent);\n}\n/* ==========================================================================\n   工作台原型 · 两栏版\n   --------------------------------------------------------------------------\n   与原版（workbench-pipeline.html）的差别只有一件事：宽度按 DSH Desktop\n   主面板的真实可用宽度来设计，不再假设一个 1348px 的壳。\n\n   插件占的就是主面板那一列，整块、无内部侧栏；DSH 自己的左侧栏在插件外面，\n   不属于这个插件。所以下面这个原型框 = 面板本身，宽度可切。\n\n   面板宽度取自仓库代码（窗口宽 - 侧栏 - 右侧面板）：\n     大窗口（最大化）        → 约 1280\n     窗口默认 1280x840      → 侧栏 280 → 1000   （settings-bridge.ts:158）\n     窗口最小 900x640       → 侧栏 56  → 844    （columns.ts:13/19/23）\n     TaskManagerPage 断点   → 760               （其 module.css:1439）\n     右侧面板打开           → 424（CENTER_MIN 400 托底）\n\n   因此：\n     - 常驻三栏取消。任务库变弹出选择器。\n     - 画布 + 检查器并排需 >=820；更窄时检查器滑动覆盖。\n     - 断点用容器查询（@container），因为面板宽度 != 视口宽度。\n   ========================================================================== */\n\n.wb-root *, .wb-root *::before, .wb-root *::after { box-sizing: border-box; }\n.wb-root [hidden] { display: none !important; }\n\n/* 内联 svg 的兜底尺寸：任何一处忘了单独指定的图标都不会撑成一块黑板。\n   具体规则（.wb-btn svg / .wb-iconBtn svg …）单类选择器优先级更高，照常覆盖。 */\n.wb-root svg { flex: none; width: 14px; height: 14px; }\n\n\n\n/* ---------------------------------------------------------------- 主题令牌 */\n\n\n\n/* ---------------------------------------------------------------- 原型外壳 */\n\n\n\n\n\n\n\n\n\n\n\n/* ------------------------------------------------------------------ 应用帧 */\n/* 原型框 = 面板本身。DSH 左侧栏（新会话 / 插件 / 工作台 / 工作区）在插件外面，\n   不属于这个插件，所以这里不画，宽度就是切换器标的那个数。 */\n\n\n/* -------------------------------------------------------------------- 面板 */\n/* 高度由宿主那一格给死（见 workbench.module.css 的 .wb-pagePipeline 网格行）：\n   .wb-panel 只负责把这一格分给 面板头 / 两栏 / 运行条，自己绝不被内容撑高 */\n.wb-panel {\n  flex: 1;\n  min-height: 0;\n  min-width: 0;\n  display: flex;\n  flex-direction: column;\n  position: relative;\n  overflow: hidden;\n  background: var(--base);\n  color: var(--ink);\n  font-size: 13px;\n  /* 断点跟着面板走，不跟视口走 */\n  container-type: inline-size;\n  container-name: panel;\n}\n\n.wb-panelHead {\n  flex: none;\n  display: flex;\n  align-items: center;\n  gap: 10px;\n  height: 58px;\n  padding: 0 18px;\n  border-bottom: 0.5px solid var(--hairline);\n}\n.wb-panelHead h1 {\n  margin: 0;\n  font-size: 20px;\n  line-height: 28px;\n  font-weight: 500;\n  letter-spacing: -.01em;\n  white-space: nowrap;\n}\n.wb-headSpacer { flex: 1; }\n.wb-btn {\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n  height: 30px;\n  padding: 0 12px;\n  border: 0;\n  border-radius: 8px;\n  background: transparent;\n  color: var(--ink);\n  font: inherit;\n  font-size: 13px;\n  white-space: nowrap;\n  cursor: pointer;\n}\n.wb-btn svg { width: 14px; height: 14px; flex: none; }\n.wb-btn:hover { background: var(--hover); }\n.wb-btn.wb-ghost { border: 0.5px solid var(--hairline); }\n.wb-btn.wb-ghost:hover { background: var(--hover-strong); }\n.wb-btn.wb-primary { background: var(--primary-bg); color: var(--primary-ink); font-weight: 500; }\n.wb-btn.wb-primary:hover { opacity: .86; }\n/* 禁用态要看得出来。审核弹框靠它表达「先写要求」这件事。 */\n.wb-btn:disabled { opacity: .38; cursor: default; }\n.wb-btn:disabled:hover { background: transparent; opacity: .38; }\n.wb-btn.wb-ghost:disabled:hover { background: transparent; }\n.wb-btn.wb-primary:disabled:hover { opacity: .38; }\n\n.wb-panelBody { flex: 1; min-height: 0; display: flex; }\n/* 只剩一个视图了，不再需要切换用的 display 开关 */\n.wb-pipelineView { flex: 1; min-width: 0; display: flex; flex-direction: column; }\n\n/* -------------------------------------------------------------- 步骤轨道 + 结果 */\n/* 执行时看的是产出。步骤是导航，结果是主体，所以这里反过来：\n   轨道固定窄，结果吃掉剩余全部宽度。 */\n.wb-panes { position: relative; flex: 1; min-height: 0; display: flex; }\n\n.wb-canvas {\n  flex: none;\n  width: 280px;\n  min-width: 0;\n  display: flex;\n  flex-direction: column;\n  border-right: 0.5px solid var(--divider);\n}\n\n.wb-canvasHead {\n  flex: none;\n  position: relative;\n  display: flex;\n  align-items: flex-start;\n  gap: 8px;\n  padding: 12px 14px 10px;\n  border-bottom: 0.5px solid var(--divider);\n}\n.wb-canvasTitleRow { display: flex; align-items: center; gap: 8px; min-width: 0; }\n.wb-canvasTitleBtn {\n  display: inline-flex;\n  align-items: center;\n  gap: 5px;\n  padding: 0;\n  border: 0;\n  background: transparent;\n  color: var(--ink);\n  font: inherit;\n  font-size: 15px;\n  font-weight: 500;\n  cursor: pointer;\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n}\n.wb-canvasTitleBtn svg { width: 13px; height: 13px; flex: none; color: var(--ink3); }\n.wb-canvasTitleBtn:hover svg { color: var(--ink); }\n.wb-chipState {\n  display: inline-flex;\n  align-items: center;\n  gap: 5px;\n  height: 20px;\n  padding: 0 8px;\n  border-radius: 10px;\n  background: var(--hover);\n  color: var(--ink2);\n  font-size: 12px;\n  white-space: nowrap;\n}\n.wb-chipState[data-s=\"running\"] { background: var(--accent-wash); color: var(--accent); }\n.wb-chipState[data-s=\"done\"] { background: color-mix(in srgb, var(--success) 12%, transparent); color: color-mix(in srgb, var(--success) 82%, var(--ink)); }\n.wb-chipState[data-s=\"failed\"] { background: var(--danger-wash); color: var(--danger); }\n.wb-chipState[data-s=\"idle\"], .wb-chipState[data-s=\"stopped\"] { background: var(--hover); color: var(--ink2); }\n/* 整条跑过 = 填实；只跑过其中几步 = 描边。形状先说话，颜色只是补一句：\n   单步跑过描绿，已有结果描灰——后者连\"怎么跑出来的\"都还不确定，不该用绿 */\n.wb-chipState[data-s=\"solo\"] {\n  background: transparent;\n  box-shadow: inset 0 0 0 0.5px color-mix(in srgb, var(--success) 55%, transparent);\n  color: color-mix(in srgb, var(--success) 60%, var(--ink));\n}\n.wb-chipState[data-s=\"kept\"] {\n  background: transparent;\n  box-shadow: inset 0 0 0 0.5px var(--hairline);\n  color: var(--ink3);\n}\n/* 这行字是运行记录的入口：它本来就在说\"上一次运行改了什么\"，所以让它能点 */\n.wb-canvasMeta {\n  display: block;\n  width: 100%;\n  margin-top: 4px;\n  padding: 0;\n  border: 0;\n  background: none;\n  color: var(--ink3);\n  font: inherit;\n  font-size: 12px;\n  text-align: left;\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  cursor: pointer;\n}\n.wb-canvasMeta:not(:disabled):hover { color: var(--ink); }\n.wb-canvasMeta:disabled { cursor: default; }\n.wb-iconBtn {\n  width: 26px; height: 26px;\n  padding: 0;\n  display: grid; place-items: center;\n  border: 0;\n  border-radius: 7px;\n  background: transparent;\n  color: var(--ink3);\n  cursor: pointer;\n}\n.wb-iconBtn svg { width: 15px; height: 15px; }\n.wb-iconBtn:hover { background: var(--hover); color: var(--ink); }\n\n.wb-canvasScroll { flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; }\n.wb-flow { padding: 12px 14px 16px; }\n\n/* 节点 */\n.wb-node {\n  position: relative;\n  display: block;\n  width: 100%;\n  text-align: left;\n  padding: 9px 11px 0;\n  border: 0.5px solid var(--hairline);\n  border-radius: 12px;\n  background: var(--card-bg);\n  box-shadow: var(--shadow-node);\n  font: inherit;\n  color: inherit;\n  cursor: pointer;\n  transition: border-color .12s, box-shadow .12s;\n}\n.wb-node::before {\n  content: \"\";\n  position: absolute;\n  left: 0;\n  top: 13px;\n  bottom: 13px;\n  width: 2px;\n  border-radius: 0 2px 2px 0;\n  background: var(--idle);\n}\n.wb-node[data-s=\"done\"]::before { background: var(--success); }\n.wb-node[data-s=\"running\"]::before { background: var(--accent); }\n.wb-node[data-s=\"failed\"]::before { background: var(--danger); }\n.wb-node:hover { border-color: color-mix(in srgb, var(--ink) 22%, transparent); }\n.wb-node[aria-selected=\"true\"] { border-color: var(--accent); box-shadow: 0 0 0 1.5px var(--accent-soft); }\n/* 待运行：位置留好了、还没启动，所以是虚线框和空心序号，不是灰掉的实心卡片 */\n.wb-node[data-s=\"idle\"] { border-style: dashed; }\n.wb-node[data-s=\"idle\"] .wb-nodeIndex { background: transparent; box-shadow: inset 0 0 0 0.5px var(--hairline); color: var(--ink4); }\n.wb-node[data-s=\"idle\"] .wb-nodeState { color: var(--ink3); }\n.wb-node[data-s=\"idle\"] .wb-nodeDur { color: var(--ink4); }\n\n.wb-nodeTop { display: flex; align-items: center; gap: 7px; }\n.wb-nodeIndex {\n  flex: none;\n  width: 18px; height: 18px;\n  display: grid; place-items: center;\n  border-radius: 5px;\n  background: var(--hover);\n  color: var(--ink3);\n  font-family: var(--f-mono);\n  font-size: 11px;\n}\n.wb-node[data-s=\"running\"] .wb-nodeIndex { background: var(--accent-wash); color: var(--accent); }\n.wb-node[data-s=\"done\"] .wb-nodeIndex { color: var(--ink2); }\n.wb-nodeTitle {\n  min-width: 0;\n  font-size: 13px;\n  font-weight: 500;\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n}\n/* 就地改名：边框 + 光晕，跟只读标题分开；字号跟标题一致，换的时候不跳 */\n.wb-nodeNameInput {\n  flex: 1 1 0;\n  min-width: 40px;\n  margin: -3px 0;\n  padding: 2px 6px;\n  border: 1px solid var(--accent);\n  border-radius: 6px;\n  background: var(--base);\n  color: var(--ink);\n  font: inherit;\n  font-size: 13px;\n  font-weight: 500;\n  outline: none;\n  box-shadow: 0 0 0 2px var(--accent-soft);\n}\n.wb-nodeState {\n  margin-left: auto;\n  flex: none;\n  display: inline-flex;\n  align-items: center;\n  gap: 3px;\n  font-size: 11px;\n  color: var(--ink3);\n  white-space: nowrap;\n}\n.wb-nodeState svg { width: 12px; height: 12px; }\n.wb-node[data-s=\"done\"] .wb-nodeState { color: color-mix(in srgb, var(--success) 72%, var(--ink)); }\n.wb-node[data-s=\"running\"] .wb-nodeState { color: var(--accent); }\n.wb-node[data-s=\"failed\"] .wb-nodeState { color: var(--danger); }\n.wb-nodeDur {\n  flex: none;\n  min-width: 44px;\n  text-align: right;\n  font-family: var(--f-mono);\n  font-size: 11px;\n  color: var(--ink4);\n  font-variant-numeric: tabular-nums;\n}\n/* 轨道上放不下「技能·模型·权限」这一行，技能 id 交给右侧检查器头部显示 */\n.wb-nodeFoot {\n  margin: 7px -11px 0;\n  padding: 5px 11px;\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  border-top: 0.5px solid var(--divider);\n  border-radius: 0 0 12px 12px;\n  background: var(--recess);\n  font-size: 11px;\n  color: var(--ink3);\n  min-height: 24px;\n}\n.wb-node[data-s=\"failed\"] .wb-nodeFoot { background: var(--danger-wash); color: var(--danger); }\n.wb-node[data-s=\"running\"] .wb-nodeFoot { background: var(--accent-wash); color: var(--accent); }\n.wb-nodeFoot span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n/* 这一步的产物来自哪次运行。单点重跑之后只有它会变 */\n.wb-nodeRun { flex: none; font-family: var(--f-mono); font-size: 11px; color: var(--ink4); }\n/* 产物来自单独跑的那一次：脚注写「单步 #1」，和整条运行的「#4」分开读 */\n.wb-nodeRun[data-solo=\"1\"] { color: color-mix(in srgb, var(--success) 50%, var(--ink4)); }\n.wb-nodeProg { flex: none; width: 34px; height: 3px; border-radius: 2px; background: var(--accent-soft); overflow: hidden; }\n.wb-nodeProg i { display: block; height: 100%; width: 40%; border-radius: 2px; background: var(--accent); animation: prog 1.5s ease-in-out infinite; }\n@keyframes prog { 0% { transform: translateX(-100%) } 100% { transform: translateX(280%) } }\n\n/* 连接线 + 插入点：线和按钮叠在同一个 grid 单元格里，居中靠布局而不是靠绝对定位猜 */\n.wb-connector {\n  position: relative;\n  height: 24px;\n  display: grid;\n  place-items: center;\n}\n.wb-connector::before {\n  content: \"\";\n  grid-area: 1 / 1;\n  width: 1px;\n  height: 100%;\n  background: var(--divider);\n}\n.wb-insertBtn {\n  grid-area: 1 / 1;\n  z-index: 1;\n  width: 20px;\n  height: 20px;\n  /* button 元素自带 UA padding，不清零会把图标挤出边框 */\n  padding: 0;\n  display: grid;\n  place-items: center;\n  border: 0.5px solid var(--hairline);\n  border-radius: 50%;\n  background: var(--base);\n  color: var(--ink3);\n  cursor: pointer;\n  /* 每条连接线上都挂一个 +，五步就是四个噪点。默认藏起来，鼠标过来或者键盘\n     聚焦时才浮出；真的想加步骤，底下常驻的「添加步骤」永远在那儿 */\n  opacity: 0;\n  pointer-events: none;\n  transition: opacity .12s, color .12s, background .12s, border-color .12s;\n}\n.wb-connector:hover .wb-insertBtn,\n.wb-connector:focus-within .wb-insertBtn {\n  opacity: 1;\n  pointer-events: auto;\n}\n.wb-insertBtn svg { width: 11px; height: 11px; }\n.wb-connector:hover .wb-insertBtn {\n  opacity: 1;\n  border-color: color-mix(in srgb, var(--accent) 38%, transparent);\n  color: var(--accent);\n}\n.wb-insertBtn:hover { background: var(--accent-wash); color: var(--accent); }\n\n.wb-connectorShort { height: 14px; display: flex; justify-content: center; }\n.wb-connectorShort::before { content: \"\"; width: 1px; height: 100%; background: var(--divider); }\n\n/* 空流水线 */\n.wb-emptyFlow {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  text-align: center;\n  padding: 34px 24px;\n  border: 1px dashed var(--hairline);\n  border-radius: 12px;\n  color: var(--ink3);\n}\n.wb-emptyMark {\n  width: 36px; height: 36px;\n  display: grid; place-items: center;\n  border-radius: 10px;\n  background: var(--hover);\n  color: var(--ink3);\n  margin-bottom: 11px;\n}\n.wb-emptyMark svg { width: 17px; height: 17px; }\n.wb-emptyFlow h4 { margin: 0 0 5px; font-size: 13px; font-weight: 500; color: var(--ink); }\n.wb-emptyFlow p { margin: 0 0 14px; max-width: 300px; font-size: 12px; line-height: 19px; }\n\n.wb-addStep {\n  width: 100%;\n  height: 42px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  gap: 6px;\n  border: 1px dashed var(--hairline);\n  border-radius: 12px;\n  background: transparent;\n  color: var(--ink3);\n  font: inherit;\n  font-size: 13px;\n  cursor: pointer;\n}\n.wb-addStep svg { width: 13px; height: 13px; }\n.wb-addStep:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-wash); }\n\n/* ------------------------------------------------------------------ 检查器 */\n/* 结果区吃掉剩余全部宽度。执行时看的是产出，不是步骤定义。 */\n.wb-inspector {\n  flex: 1;\n  min-width: 0;\n  display: flex;\n  flex-direction: column;\n  min-height: 0;\n  background: var(--pane);\n}\n\n.wb-inspHead {\n  flex: none;\n  position: relative;\n  padding: 12px 16px 0;\n}\n\n/* 当前步骤的操作菜单：上移 / 下移 / 移除 */\n.wb-stepMenu {\n  position: absolute;\n  /* 落在标题行下沿：kicker + 标题行高度稳定，用固定偏移比百分比可靠 */\n  top: 62px;\n  right: 14px;\n  z-index: 60;\n  width: 184px;\n  padding: 5px;\n  border-radius: 10px;\n  background: var(--base);\n  border: 0.5px solid var(--hairline);\n  box-shadow: var(--shadow-menu);\n}\n.wb-stepMenuRow {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  width: 100%;\n  padding: 7px 9px;\n  border: 0;\n  border-radius: 6px;\n  background: transparent;\n  color: var(--ink);\n  font: inherit;\n  font-size: 13px;\n  text-align: left;\n  cursor: pointer;\n}\n.wb-stepMenuRow svg { width: 13px; height: 13px; color: var(--ink3); }\n.wb-stepMenuRow:hover { background: var(--hover); }\n.wb-stepMenuRow[data-danger] { color: var(--danger); }\n.wb-stepMenuRow[data-danger] svg { color: var(--danger); }\n.wb-stepMenuRow[data-danger]:hover { background: var(--danger-wash); }\n.wb-stepMenuRow[disabled] { opacity: .38; cursor: default; }\n.wb-stepMenuRow[disabled]:hover { background: transparent; }\n.wb-stepMenuSep { height: 0.5px; margin: 4px 8px; background: var(--divider); }\n.wb-stepMenuNote {\n  padding: 6px 9px 3px;\n  color: var(--ink4);\n  font-size: 11px;\n  line-height: 15px;\n}\n.wb-inspKicker {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  color: var(--ink3);\n  font-size: 12px;\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n}\n.wb-inspKicker b { font-weight: 500; color: var(--ink2); }\n.wb-inspTitleRow { display: flex; align-items: center; gap: 8px; margin-top: 6px; }\n.wb-inspTitle {\n  min-width: 0;\n  margin: 0;\n  font-size: 15px;\n  font-weight: 500;\n  line-height: 22px;\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n}\n.wb-runOne {\n  margin-left: auto;\n  flex: none;\n  display: inline-flex;\n  align-items: center;\n  gap: 5px;\n  height: 26px;\n  padding: 0 10px;\n  border: 0.5px solid var(--hairline);\n  border-radius: 13px;\n  background: transparent;\n  color: var(--ink);\n  font: inherit;\n  font-size: 12px;\n  white-space: nowrap;\n  cursor: pointer;\n}\n.wb-runOne svg { width: 11px; height: 11px; }\n.wb-runOne:hover { background: var(--hover-strong); }\n.wb-inspMeta {\n  margin-top: 5px;\n  display: flex;\n  align-items: center;\n  gap: 5px;\n  font-size: 11px;\n  color: var(--ink4);\n  white-space: nowrap;\n  overflow: hidden;\n}\n.wb-inspMeta code { font-family: var(--f-mono); font-size: 11px; color: var(--ink3); }\n.wb-chipTag {\n  display: inline-flex;\n  align-items: center;\n  height: 18px;\n  padding: 0 7px;\n  border-radius: 9px;\n  background: var(--hover);\n  color: var(--ink2);\n  font-size: 11px;\n}\n.wb-chipTag svg { flex: none; width: 10px; height: 10px; }\n.wb-chipTag[data-s=\"running\"] { background: var(--accent-wash); color: var(--accent); }\n.wb-chipTag[data-s=\"done\"] { background: color-mix(in srgb, var(--success) 12%, transparent); color: color-mix(in srgb, var(--success) 78%, var(--ink)); }\n.wb-chipTag[data-s=\"failed\"] { background: var(--danger-wash); color: var(--danger); }\n/* 待运行 / 排队中都是灰的，所以标签也换画法：描边不填底 vs 浅灰填底 */\n.wb-chipTag[data-s=\"idle\"] { background: transparent; box-shadow: inset 0 0 0 0.5px var(--hairline); color: var(--ink3); }\n\n.wb-inspTabs {\n  flex: none;\n  display: flex;\n  gap: 16px;\n  margin-top: 10px;\n  padding: 0 16px;\n  border-bottom: 0.5px solid var(--divider);\n}\n.wb-inspTab {\n  height: 34px;\n  padding: 0;\n  border: 0;\n  border-bottom: 2px solid transparent;\n  background: transparent;\n  color: var(--ink2);\n  font: inherit;\n  font-size: 13px;\n  cursor: pointer;\n  white-space: nowrap;\n}\n.wb-inspTab:hover { color: var(--ink); }\n.wb-inspTab[aria-selected=\"true\"] { color: var(--accent); border-bottom-color: var(--accent); font-weight: 500; }\n.wb-inspTab em { font-style: normal; color: var(--ink4); margin-left: 3px; }\n\n.wb-inspScroll { flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; }\n\n/* 结果面板 */\n.wb-resultPanel { padding: 12px 16px 18px; }\n.wb-resultBar { display: flex; align-items: center; gap: 4px; margin-bottom: 9px; }\n/* 宽屏阅读跟 预览/源码 是一组：都是\"换个读法\"，所以贴着放，不甩到右边去 */\n.wb-resultBar .wb-iconBtn { width: 24px; height: 24px; }\n\n/* 重生成之后的痕迹：留着「这次是按什么要求改的」，否则改了什么会丢 */\n.wb-revised {\n  display: flex;\n  align-items: baseline;\n  gap: 6px;\n  margin-bottom: 11px;\n  padding: 6px 9px;\n  border-radius: 7px;\n  background: var(--accent-wash);\n  font-size: 11px;\n}\n.wb-revised span { flex: none; color: var(--accent); }\n.wb-revised em {\n  font-style: normal;\n  min-width: 0;\n  color: var(--ink2);\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n/* 结果区两块：这次的结果（清单）/ 模板（预览·源码）。中间一条发丝线分开。 */\n.wb-resBlock + .wb-resBlock { margin-top: 18px; padding-top: 15px; border-top: 0.5px solid var(--divider); }\n.wb-resBlockHead { display: flex; align-items: center; gap: 8px; margin-bottom: 9px; font-size: 12px; font-weight: 500; }\n.wb-resBlockHead > em {\n  min-width: 0;\n  font-style: normal;\n  font-weight: 400;\n  font-size: 11px;\n  color: var(--ink4);\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n}\n.wb-resBlockHead .wb-segTiny { margin-left: auto; }\n\n/* 这次交出来的东西：一行一个文件。窄栏只列清单，正文去阅读器读 */\n.wb-resList { display: flex; flex-direction: column; gap: 4px; }\n.wb-resItem {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  width: 100%;\n  padding: 8px 10px;\n  border: 0.5px solid var(--hairline);\n  border-radius: 8px;\n  background: var(--card-bg);\n  color: var(--ink);\n  font: inherit;\n  font-size: 12px;\n  text-align: left;\n  cursor: pointer;\n}\n.wb-resItem:hover { background: var(--hover); border-color: color-mix(in srgb, var(--ink) 18%, transparent); }\n.wb-resItem > svg:first-child { flex: none; width: 13px; height: 13px; color: var(--ink3); }\n.wb-resItemName { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.wb-resItemSize { flex: none; font-family: var(--f-mono); font-size: 11px; color: var(--ink4); }\n/* 目录读不到时的原因：没有这一行，这一步看起来只是「目录里没有文件」 */\n.wb-resProblem { margin: 2px 0 0; font-size: 11.5px; line-height: 17px; color: var(--danger); }\n/* 箭头朝右 = 进去读，不是展开 */\n.wb-resItem > svg:last-child { flex: none; width: 12px; height: 12px; color: var(--ink4); transform: rotate(-90deg); }\n/* 无目录的步骤：没有清单可列，就一个按钮进去读。摘要那行在区块标题右边 */\n.wb-resOpen {\n  display: inline-flex;\n  align-items: center;\n  /* 放在 column flex 里不被拉满，按钮就是按钮的宽度 */\n  align-self: flex-start;\n  gap: 6px;\n  height: 28px;\n  padding: 0 10px;\n  border: 0.5px solid var(--hairline);\n  border-radius: 7px;\n  background: transparent;\n  color: var(--ink2);\n  font: inherit;\n  font-size: 12px;\n  cursor: pointer;\n  transition: background .12s, color .12s, border-color .12s;\n}\n.wb-resOpen:hover {\n  background: var(--hover);\n  color: var(--ink);\n  border-color: color-mix(in srgb, var(--accent) 34%, transparent);\n}\n.wb-resOpen svg:first-child { flex: none; width: 13px; height: 13px; color: var(--ink3); }\n/* 摘要跟在动作后面，是同一行里的补充，不是另一句\"有结果了\" */\n.wb-resOpen em { font-style: normal; font-size: 11px; color: var(--ink4); max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.wb-resOpen svg:last-child { flex: none; width: 12px; height: 12px; color: var(--ink4); transform: rotate(-90deg); }\n.wb-resOpen:hover svg:first-child { color: var(--accent); }\n.wb-resEmpty { padding: 10px 2px; font-size: 12px; line-height: 19px; color: var(--ink3); }\n.wb-resEmpty em { display: block; font-style: normal; font-family: var(--f-mono); font-size: 11px; color: var(--ink4); }\n\n/* 模板预览：一块标了名字的空位。不用骨架条，那不是\"占位\"，那是\"加载中\" */\n.wb-tplSlotLabel { margin-bottom: 7px; font-size: 11px; color: var(--ink4); }\n.wb-tplSlotBox {\n  display: flex;\n  align-items: center;\n  gap: 9px;\n  padding: 18px 14px;\n  border: 0.5px dashed var(--hairline);\n  border-radius: 9px;\n  background: var(--recess);\n}\n.wb-tplSlotTag {\n  flex: none;\n  padding: 2px 7px;\n  border-radius: 5px;\n  background: var(--hover-strong);\n  font-size: 11px;\n  color: var(--ink2);\n}\n.wb-tplSlotText { min-width: 0; font-size: 12px; line-height: 17px; color: var(--ink3); }\n\n/* 源头说明：告诉读者「源码」只是区域片段，文件正文不在里面 */\n.wb-srcNote {\n  /* 横向 padding 由 .wb-resultPanel 给，这里只补下方间距 */\n  padding: 0 0 9px;\n  font-size: 11px;\n  line-height: 16px;\n  color: var(--ink4);\n}\n.wb-srcNote code { font-family: var(--f-mono); font-size: 11px; }\n\n/* 源码那一栏：卡片的 HTML 模板全文，等宽、可滚、底色压暗。\n   区域标记之间就是模型每次执行要替换的那段。 */\n/* 编辑框：字是原型那套（等宽 11px / 17px 行高 / 圆角 10px），但底色和字色得是\n   「可以在这里打字」的样子——压暗的底 + 次要墨色读起来就是个禁用的块。 */\n.wb-docSrc {\n  display: block;\n  width: 100%;\n  box-sizing: border-box;\n  margin: 0;\n  padding: 10px 12px;\n  border: 0.5px solid var(--divider);\n  border-radius: 10px;\n  background: var(--card-bg);\n  color: var(--ink);\n  font-family: var(--f-mono);\n  font-size: 11px;\n  line-height: 17px;\n  white-space: pre-wrap;\n  overflow-wrap: anywhere;\n  max-height: 420px;\n  min-height: 160px;\n  overflow-y: auto;\n  resize: vertical;\n  cursor: text;\n}\n.wb-docSrc:focus {\n  outline: none;\n  border-color: var(--accent);\n  box-shadow: 0 0 0 2px var(--accent-wash);\n}\n\n/* 预览是模板自己的渲染：外面这层只负责给个框和滚动，里面长什么样由模板决定 */\n.wb-tplPreviewBody {\n  border: 0.5px solid var(--divider);\n  border-radius: 10px;\n  background: var(--card-bg);\n  max-height: 420px;\n  overflow-y: auto;\n}\n.wb-tplPreviewFrame { display: block; min-height: 120px; }\n\n/* 区域说明：模板里没有区域标记的时候，把它放在框下面，而不是什么都不放 */\n.wb-tplRegion {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  margin: 10px 0 0;\n  padding: 12px;\n  border: 1px dashed color-mix(in srgb, var(--ink) 22%, transparent);\n  border-radius: 8px;\n}\n.wb-tplRegionTag {\n  padding: 2px 7px;\n  border-radius: 5px;\n  background: var(--hover);\n  color: var(--ink2);\n  font-family: var(--f-mono);\n  font-size: 11px;\n}\n.wb-tplRegionText { font-size: 11px; color: var(--ink3); }\n.wb-segTiny { display: flex; gap: 1px; padding: 1px; border-radius: 6px; background: var(--hover); }\n.wb-segTiny button {\n  border: 0;\n  padding: 2px 8px;\n  border-radius: 5px;\n  background: transparent;\n  color: var(--ink3);\n  font: inherit;\n  font-size: 11px;\n  cursor: pointer;\n}\n.wb-segTiny button[aria-pressed=\"true\"] { background: var(--base); color: var(--ink); box-shadow: 0 1px 2px rgba(0, 0, 0, .08); }\n.wb-resultBar .wb-spacer { flex: 1; }\n.wb-docPad {\n  border: 0.5px solid var(--divider);\n  border-radius: 10px;\n  background: var(--base);\n  padding: 12px 14px 14px;\n}\n.wb-docPad[data-tone=\"danger\"] { background: var(--danger-wash); border-color: color-mix(in srgb, var(--danger) 28%, transparent); }\n\n/* 结果文档 */\n.wb-doc { color: var(--ink); font-size: 13px; line-height: 20px; }\n.wb-doc h5 { margin: 0 0 7px; font-size: 13px; font-weight: 500; line-height: 20px; }\n.wb-doc h6 { margin: 11px 0 5px; font-size: 11px; font-weight: 500; color: var(--ink3); letter-spacing: .02em; }\n.wb-doc p { margin: 0 0 9px; }\n.wb-doc ul { margin: 0 0 8px; padding-left: 16px; }\n.wb-doc li { margin-bottom: 3px; }\n.wb-doc code { font-family: var(--f-mono); font-size: 11px; padding: 1px 4px; border-radius: 4px; background: var(--hover); }\n.wb-doc strong { font-weight: 500; }\n.wb-doc table { width: 100%; border-collapse: collapse; table-layout: fixed; margin: 0 0 9px; font-size: 12px; }\n.wb-doc th:nth-child(1), .wb-doc td:nth-child(1) { width: 44%; }\n.wb-doc th:nth-child(2), .wb-doc td:nth-child(2) { width: 34%; }\n.wb-doc th:nth-child(3), .wb-doc td:nth-child(3) { width: 22%; }\n.wb-doc th {\n  text-align: left;\n  font-weight: 400;\n  font-size: 11px;\n  color: var(--ink4);\n  padding: 0 0 5px;\n  border-bottom: 0.5px solid var(--divider);\n}\n.wb-doc td { padding: 6px 0; border-bottom: 0.5px solid var(--divider); vertical-align: top; overflow-wrap: anywhere; }\n.wb-doc tr:last-child td { border-bottom: 0; }\n.wb-doc .wb-num { text-align: right; font-family: var(--f-mono); font-size: 11px; }\n.wb-doc .wb-add { color: rgb(34, 160, 90); }\n.wb-doc .wb-del { color: var(--danger); }\n.wb-doc .wb-callout {\n  margin: 9px 0 0;\n  padding: 8px 10px;\n  border-radius: 8px;\n  background: var(--accent-wash);\n  color: var(--ink2);\n  font-size: 12px;\n  line-height: 18px;\n}\n.wb-doc .wb-checks { margin: 0; }\n.wb-doc .wb-check { display: flex; align-items: flex-start; gap: 7px; padding: 5px 0; font-size: 12px; border-bottom: 0.5px solid var(--divider); }\n.wb-doc .wb-check:last-child { border-bottom: 0; }\n.wb-doc .wb-check i { flex: none; width: 11px; height: 11px; margin-top: 4px; border-radius: 50%; background: var(--success); }\n.wb-doc .wb-check[data-s=\"todo\"] i { background: var(--idle); }\n.wb-doc .wb-check span { flex: 1; min-width: 0; }\n.wb-doc .wb-check em { flex: none; font-style: normal; font-family: var(--f-mono); font-size: 11px; color: var(--ink4); }\n.wb-doc .wb-metrics { display: flex; gap: 8px; margin: 0 0 9px; }\n.wb-doc .wb-metric { flex: 1; padding: 8px 10px; border-radius: 8px; background: var(--hover); }\n.wb-doc .wb-metric .wb-k { display: block; font-size: 11px; color: var(--ink3); }\n.wb-doc .wb-metric .wb-v { display: block; margin-top: 1px; font-size: 17px; font-weight: 500; line-height: 22px; }\n.wb-doc .wb-metric small { font-size: 11px; font-weight: 400; color: var(--ink4); }\n\n\n/* 结果占位：运行中 / 排队 / 未运行 / 失败 */\n.wb-stateBlock { display: flex; flex-direction: column; align-items: flex-start; gap: 8px; padding: 4px 0 2px; }\n.wb-stateBlock h6 { margin: 0; font-size: 13px; font-weight: 500; color: var(--ink); }\n.wb-stateBlock p { margin: 0; color: var(--ink3); font-size: 12px; line-height: 19px; }\n.wb-skel { display: flex; flex-direction: column; gap: 7px; }\n.wb-skel i {\n  display: block;\n  height: 9px;\n  border-radius: 5px;\n  background: linear-gradient(90deg, var(--hover) 25%, var(--hover-strong) 37%, var(--hover) 63%);\n  background-size: 400% 100%;\n  animation: shimmer 1.4s ease-in-out infinite;\n}\n@keyframes shimmer { 0% { background-position: 100% 0 } 100% { background-position: 0 0 } }\n.wb-inlineFail {\n  display: flex;\n  align-items: flex-start;\n  gap: 8px;\n  padding: 9px 11px;\n  border-radius: 9px;\n  background: var(--danger-wash);\n  color: var(--danger);\n  font-size: 12px;\n  line-height: 18px;\n}\n.wb-inlineFail svg { flex: none; width: 14px; height: 14px; margin-top: 2px; }\n.wb-inlineFail b { display: block; font-weight: 500; }\n.wb-inlineFail em { display: block; font-style: normal; color: var(--ink2); margin-top: 2px; }\n\n/* 活动时间线 */\n.wb-activityPanel { padding: 10px 16px 18px; }\n.wb-actList { display: flex; flex-direction: column; }\n.wb-act {\n  position: relative;\n  display: flex;\n  gap: 9px;\n  padding: 0 0 13px;\n}\n.wb-act:last-child { padding-bottom: 0; }\n.wb-act::before {\n  content: \"\";\n  position: absolute;\n  left: 6px;\n  top: 16px;\n  bottom: 0;\n  width: 1px;\n  background: var(--divider);\n}\n.wb-act:last-child::before { display: none; }\n.wb-actIcon {\n  position: relative;\n  z-index: 1;\n  flex: none;\n  width: 13px; height: 13px;\n  margin-top: 2px;\n  display: grid;\n  place-items: center;\n  background: var(--pane);\n  color: var(--ink4);\n}\n.wb-actIcon svg { width: 11px; height: 11px; }\n.wb-act[data-k=\"done\"] .wb-actIcon { color: var(--success); }\n.wb-act[data-k=\"fail\"] .wb-actIcon { color: var(--danger); }\n.wb-act[data-k=\"write\"] .wb-actIcon { color: var(--accent); }\n.wb-actBody { min-width: 0; flex: 1; }\n.wb-actTop { display: flex; align-items: baseline; gap: 6px; }\n.wb-actName { font-size: 12px; color: var(--ink); white-space: nowrap; }\n.wb-actArg {\n  min-width: 0;\n  font-family: var(--f-mono);\n  font-size: 11px;\n  color: var(--ink3);\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n.wb-actT { margin-left: auto; flex: none; font-family: var(--f-mono); font-size: 11px; color: var(--ink4); }\n.wb-actMsg { margin-top: 2px; color: var(--ink2); font-size: 12px; line-height: 17px; }\n.wb-actDur { margin-top: 1px; font-family: var(--f-mono); font-size: 11px; color: var(--ink4); }\n\n/* 配置面板 */\n.wb-configPanel { padding: 12px 16px 18px; }\n/* 配置分三层：整条流水线 / 这一步 / 模板。三层之间一条发丝线。 */\n.wb-cfgBlock + .wb-cfgBlock { margin-top: 16px; padding-top: 14px; border-top: 0.5px solid var(--divider); }\n.wb-cfgBlockHead {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  margin-bottom: 2px;\n  font-size: 12px;\n  font-weight: 500;\n  color: var(--ink);\n}\n.wb-cfgBlockHead > em { min-width: 0; font-style: normal; font-weight: 400; font-size: 11px; color: var(--ink4); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n.wb-cfgBlockHead .wb-segTiny { margin-left: auto; }\n/* 真下拉，不是长得像下拉的死按钮 */\n.wb-ruleSelect {\n  display: block;\n  max-width: 240px;\n  padding: 4px 8px;\n  border: 0.5px solid var(--hairline);\n  border-radius: 7px;\n  background: var(--card-bg);\n  color: var(--ink);\n  font: inherit;\n  font-size: 12px;\n  cursor: pointer;\n}\n.wb-ruleSelect:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }\n/* 能改的行里放文本的地方：路径和指令，边框和下拉同一套 */\n/* 写不进去时的一句话：在出错的那一块里，不在别处 */\n.wb-cfgProblem {\n  margin: 0 0 4px;\n  padding: 6px 9px;\n  border-radius: 7px;\n  background: var(--danger-wash);\n  color: var(--danger);\n  font-size: 11px;\n  line-height: 1.5;\n}\n\n/* 工作目录：一行可点的选择器，左边是确认过的路径，右边是「选择目录」 */\n.wb-rulePath {\n  display: flex;\n  align-items: center;\n  gap: 10px;\n  width: 100%;\n  max-width: 420px;\n  padding: 6px 10px;\n  border: 0.5px solid var(--hairline);\n  border-radius: 7px;\n  background: var(--card-bg);\n  color: var(--ink);\n  font: inherit;\n  text-align: left;\n  cursor: pointer;\n}\n.wb-rulePath:hover:not(:disabled) { border-color: var(--divider); background: var(--hover); }\n.wb-rulePath:disabled { cursor: default; color: var(--ink4); }\n.wb-rulePath:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }\n.wb-rulePathText { flex: 1; min-width: 0; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n.wb-rulePathText.wb-mono { font-family: var(--f-mono); font-size: 12px; }\n.wb-rulePathPick { flex: none; font-size: 11px; color: var(--accent); }\n.wb-rulePath:disabled .wb-rulePathPick { color: var(--ink4); }\n\n.wb-ruleInput,\n.wb-ruleArea {\n  display: block;\n  width: 100%;\n  max-width: 420px;\n  padding: 5px 8px;\n  border: 0.5px solid var(--hairline);\n  border-radius: 7px;\n  background: var(--card-bg);\n  color: var(--ink);\n  font: inherit;\n  font-size: 12px;\n}\n.wb-ruleInput { font-family: var(--f-mono); }\n.wb-ruleArea { max-width: 100%; line-height: 1.5; resize: vertical; }\n.wb-ruleInput:hover,\n.wb-ruleArea:hover { border-color: var(--hairline-strong, var(--divider)); }\n.wb-ruleInput:focus-visible,\n.wb-ruleArea:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }\n\n.wb-ruleRow {\n  display: flex;\n  align-items: center;\n  gap: 12px;\n  min-height: 46px;\n  padding: 10px 0;\n  border-bottom: 0.5px solid var(--divider);\n}\n.wb-ruleRow:last-child { border-bottom: 0; }\n.wb-ruleLabel { flex: none; width: 76px; color: var(--ink3); font-size: 12px; }\n.wb-ruleValue { flex: 1; min-width: 0; }\n.wb-ruleValue .wb-val {\n  display: block;\n  font-size: 13px;\n  color: var(--ink);\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n}\n.wb-ruleValue .wb-val.wb-mono { font-family: var(--f-mono); font-size: 12px; }\n.wb-ruleValue .wb-hint { display: block; margin-top: 1px; color: var(--ink4); font-size: 11px; }\n\n/* ----------------------------------------------------------------- 运行条 */\n.wb-runbar {\n  flex: none;\n  display: flex;\n  align-items: center;\n  gap: 10px;\n  height: 46px;\n  padding: 0 16px;\n  border-top: 0.5px solid var(--hairline);\n  background: var(--pane);\n}\n.wb-segBar { flex: none; display: flex; gap: 3px; }\n/* 运行条不只靠颜色区分状态：完成了是实心，排队是空心的点阵，失败是斜纹 */\n.wb-segBar i { display: block; width: 22px; height: 4px; border-radius: 2px; background: var(--divider); }\n.wb-segBar i[data-s=\"done\"] { background: var(--success); }\n.wb-segBar i[data-s=\"running\"] {\n  background: repeating-linear-gradient(90deg, var(--accent) 0 4px, color-mix(in srgb, var(--accent) 38%, transparent) 4px 8px);\n}\n.wb-segBar i[data-s=\"failed\"] {\n  background: repeating-linear-gradient(45deg, var(--danger) 0 2px, transparent 2px 5px);\n  box-shadow: inset 0 0 0 0.5px var(--danger);\n}\n.wb-segBar i[data-s=\"queued\"] {\n  background: repeating-linear-gradient(90deg, var(--ink4) 0 1.5px, transparent 1.5px 4px);\n  opacity: .75;\n}\n/* 单独跑过的一步：段不满，是描边的。整条跑完的段才填实，\n   4px 高的条上只描一圈太淡，所以里面留一层很浅的绿 */\n.wb-segBar i[data-s=\"solo\"] {\n  background: color-mix(in srgb, var(--success) 22%, transparent);\n  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--success) 58%, transparent);\n}\n.wb-runNoise { flex: 1; min-width: 0; display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--ink2); white-space: nowrap; overflow: hidden; }\n.wb-runNoise b { font-weight: 500; color: var(--ink); }\n.wb-runNoise .wb-timer { font-family: var(--f-mono); font-size: 12px; color: var(--ink); font-variant-numeric: tabular-nums; }\n.wb-runActions { flex: none; display: flex; align-items: center; gap: 6px; }\n\n/* 点 */\n.wb-dot { flex: none; width: 6px; height: 6px; border-radius: 50%; background: var(--idle); }\n.wb-dot[data-s=\"done\"] { background: var(--success); }\n.wb-dot[data-s=\"running\"] { background: var(--accent); }\n.wb-dot[data-s=\"failed\"] { background: var(--danger); }\n.wb-dot[data-s=\"queued\"] { background: var(--idle); }\n.wb-dot[data-s=\"stopped\"] { background: var(--ink4); }\n/* 6px 上也看得出实心/空心 */\n.wb-dot[data-s=\"idle\"] { background: transparent; box-shadow: inset 0 0 0 1px var(--ink4); }\n/* 只跑过其中几步：空心绿。填满的绿点才是整条跑完 */\n.wb-dot[data-s=\"solo\"] { background: transparent; box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--success) 70%, transparent); }\n.wb-dot[data-s=\"kept\"] { background: transparent; box-shadow: inset 0 0 0 1px var(--ink3); }\n\n/* ------------------------------------------------------------- 标题下拉菜单 */\n.wb-renameInput {\n  width: 190px;\n  max-width: 100%;\n  padding: 2px 6px;\n  border: 0.5px solid var(--accent);\n  border-radius: 6px;\n  background: var(--base);\n  color: var(--ink);\n  font: inherit;\n  font-size: 15px;\n  outline: none;\n}\n.wb-pickerUsed { flex: none; font-size: 11px; color: var(--ink4); }\n.wb-canvasMenu {\n  position: absolute;\n  top: calc(100% - 2px);\n  left: 18px;\n  z-index: 60;\n  width: min(330px, calc(100% - 36px));\n  max-height: min(440px, calc(100vh - 220px));\n  overflow-y: auto;\n  padding: 5px;\n  border-radius: 12px;\n  background: var(--base);\n  border: 0.5px solid var(--hairline);\n  box-shadow: var(--shadow-menu);\n}\n.wb-menuSect {\n  padding: 6px 8px 4px;\n  color: var(--ink4);\n  font-size: 11px;\n  letter-spacing: .02em;\n}\n.wb-menuRow {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  width: 100%;\n  padding: 7px 8px;\n  border: 0;\n  border-radius: 7px;\n  background: transparent;\n  color: var(--ink);\n  font: inherit;\n  font-size: 13px;\n  text-align: left;\n  cursor: pointer;\n}\n.wb-menuRow:hover { background: var(--hover); }\n.wb-menuRow[aria-current=\"true\"] { background: var(--hover-strong); }\n.wb-menuRowMain { flex: 1; min-width: 0; }\n.wb-menuRowTitle { display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n.wb-menuRowSub { display: block; margin-top: 1px; color: var(--ink4); font-size: 11px; font-family: var(--f-mono); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n.wb-menuRowTail { flex: none; display: flex; align-items: center; gap: 6px; color: var(--ink4); font-size: 11px; }\n.wb-menuRun {\n  flex: none;\n  width: 22px; height: 22px;\n  display: grid; place-items: center;\n  border: 0;\n  border-radius: 6px;\n  background: transparent;\n  color: var(--ink3);\n  cursor: pointer;\n  opacity: 0;\n}\n.wb-menuRun svg { width: 11px; height: 11px; }\n.wb-menuRow:hover .wb-menuRun { opacity: 1; }\n.wb-menuRun:hover { background: var(--hover-strong); color: var(--ink); }\n.wb-menuSep { height: 0.5px; margin: 5px 8px; background: var(--divider); }\n\n/* ------------------------------------------------------------ 任务选择器 */\n.wb-pickerWrap { position: absolute; inset: 0; z-index: 80; display: flex; align-items: flex-start; justify-content: center; padding-top: 84px; }\n.wb-pickerScrim { position: absolute; inset: 0; background: var(--scrim); }\n.wb-picker {\n  position: relative;\n  width: min(400px, calc(100% - 32px));\n  max-height: min(430px, calc(100% - 140px));\n  display: flex;\n  flex-direction: column;\n  border-radius: 14px;\n  background: var(--base);\n  border: 0.5px solid var(--hairline);\n  box-shadow: var(--shadow-menu);\n  overflow: hidden;\n}\n.wb-pickerHead { flex: none; padding: 11px 12px 9px; border-bottom: 0.5px solid var(--divider); }\n.wb-pickerTitle { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-size: 13px; font-weight: 500; }\n.wb-pickerTitle span { flex: 1; min-width: 0; }\n.wb-pickerTitle em { font-style: normal; font-weight: 400; color: var(--ink4); font-size: 11px; }\n.wb-searchField {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  height: 30px;\n  padding: 0 9px;\n  border-radius: 8px;\n  background: var(--recess);\n  border: 0.5px solid var(--divider);\n}\n.wb-searchField svg { flex: none; width: 13px; height: 13px; color: var(--ink4); }\n.wb-searchField input {\n  flex: 1;\n  min-width: 0;\n  border: 0;\n  background: transparent;\n  color: var(--ink);\n  font: inherit;\n  font-size: 13px;\n  outline: none;\n}\n.wb-searchField input::placeholder { color: var(--ink4); }\n.wb-pickerList { flex: 1; min-height: 0; overflow-y: auto; padding: 5px; }\n.wb-pickerRow {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  width: 100%;\n  padding: 8px;\n  border: 0;\n  border-radius: 8px;\n  background: transparent;\n  color: var(--ink);\n  font: inherit;\n  text-align: left;\n  cursor: pointer;\n}\n.wb-pickerRow:hover { background: var(--hover); }\n.wb-pickerRow svg { width: 13px; height: 13px; color: var(--ink4); }\n.wb-pickerRow:hover svg { color: var(--accent); }\n.wb-pickerRowMain { flex: 1; min-width: 0; }\n.wb-pickerRowTitle { display: block; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n.wb-pickerRowDesc { display: block; margin-top: 1px; font-size: 11px; color: var(--ink3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n.wb-pickerEmpty { padding: 16px 8px; text-align: center; color: var(--ink4); font-size: 12px; }\n/* 加了没加上：原因写在点它的地方，而不是让按钮看着像坏了 */\n.wb-pickerProblem {\n  margin: 6px 2px 2px;\n  padding: 6px 8px;\n  border-radius: 6px;\n  background: var(--err-bg, rgba(198, 40, 40, 0.08));\n  color: var(--err, #c62828);\n  font-size: 12px;\n  line-height: 18px;\n}\n\n/* ------------------------------------------------------------ 运行记录 */\n/*\n * 一条记录 = 一次流水线运行 = 它当时每一步的状态与产物快照。\n * 回看某一次，看到的是那天的文件，不是今天被改过的同一份——所以产物必须跟着\n * 那次运行存，而不是回读磁盘。\n */\n.wb-histBody { flex: 1; min-height: 0; overflow-y: auto; }\n\n.wb-histDay {\n  position: sticky;\n  top: 0;\n  z-index: 1;\n  padding: 9px 14px 6px;\n  background: var(--base);\n  font-size: 11px;\n  color: var(--ink4);\n  border-bottom: 0.5px solid var(--divider);\n}\n\n.wb-histRow {\n  display: flex;\n  align-items: center;\n  gap: 10px;\n  width: 100%;\n  padding: 11px 14px;\n  font: inherit;\n  text-align: left;\n  background: transparent;\n  border: 0;\n  border-bottom: 0.5px solid var(--divider);\n  cursor: pointer;\n}\n.wb-histRow:hover { background: var(--hover); }\n.wb-histNo { flex: none; width: 28px; font-family: var(--f-mono); font-size: 11px; color: var(--ink4); }\n.wb-histWhen { flex: none; width: 92px; font-size: 12px; }\n.wb-histSum {\n  flex: 1;\n  min-width: 0;\n  font-size: 12px;\n  color: var(--ink3);\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n}\n.wb-histTook { flex: none; font-family: var(--f-mono); font-size: 11px; color: var(--ink4); }\n.wb-histBadge { flex: none; width: 44px; font-size: 11px; }\n.wb-histBadge[data-s=\"ok\"] { color: rgb(34, 160, 90); }\n.wb-histBadge[data-s=\"fail\"] { color: var(--danger); }\n.wb-histBadge[data-s=\"running\"] { color: var(--accent); }\n.wb-histBadge[data-s=\"stopped\"] { color: var(--ink3); }\n.wb-histRow > svg { flex: none; width: 12px; height: 12px; color: var(--ink4); }\n\n/* 详情 */\n.wb-histTop {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  padding: 10px 14px;\n  border-bottom: 0.5px solid var(--divider);\n}\n.wb-histTopWhen { font-size: 12px; font-weight: 500; }\n.wb-histTopMeta { min-width: 0; font-size: 11px; color: var(--ink4); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n.wb-histReadonly {\n  flex: none;\n  margin-left: auto;\n  padding: 2px 7px;\n  border-radius: 20px;\n  background: var(--recess);\n  font-size: 11px;\n  color: var(--ink3);\n}\n\n/* 重生成那条运行带着\"要改什么\"，回看时它就是这次改动的由来 */\n.wb-histAsk {\n  padding: 9px 14px;\n  background: var(--accent-wash);\n  font-size: 12px;\n  line-height: 17px;\n  color: var(--ink2);\n  border-bottom: 0.5px solid var(--divider);\n}\n\n.wb-hStep {\n  position: relative;\n  border-bottom: 0.5px solid var(--divider);\n}\n.wb-hStep:last-child { border-bottom: 0; }\n/* 失败的那一步在快照里没有产物可读，但可以现在就重跑 */\n.wb-hStepRetry {\n  position: absolute;\n  top: 50%;\n  right: 12px;\n  transform: translateY(-50%);\n  padding: 2px 9px;\n  border: 0.5px solid var(--hairline);\n  border-radius: 6px;\n  background: var(--base);\n  color: var(--ink2);\n  font: inherit;\n  font-size: 11px;\n  cursor: pointer;\n}\n.wb-hStepRetry:hover { background: var(--hover); color: var(--ink); }\n.wb-hStepMuted { padding-right: 82px; }\n.wb-hStepHead {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  width: 100%;\n  padding: 11px 14px;\n  font: inherit;\n  text-align: left;\n  background: transparent;\n  border: 0;\n  cursor: pointer;\n}\n.wb-hStepHead:hover { background: var(--hover); }\n.wb-hStepNo { flex: none; width: 15px; font-family: var(--f-mono); font-size: 11px; color: var(--ink4); }\n.wb-hStepName { flex: none; font-size: 13px; }\n.wb-hStepMeta { flex: 1; min-width: 0; font-size: 11px; color: var(--ink4); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n.wb-hStepTook { flex: none; font-family: var(--f-mono); font-size: 11px; color: var(--ink4); }\n/* 这一步的产物是点开看的：箭头朝右表示\"进去\"，不是一个会展开的手风琴 */\n.wb-hStepHead > svg { flex: none; width: 12px; height: 12px; color: var(--ink4); transform: rotate(-90deg); transition: transform .14s; }\n.wb-hStepHead:hover > svg { transform: rotate(-90deg) translateY(-2px); }\n\n/* 返回箭头：chev 朝下，转 90° 朝左 */\n.wb-histBack svg { transform: rotate(90deg); }\n\n/* 没东西可点的那一步（还没跑）：同样的格子，但不是按钮 */\n.wb-hStepMuted { cursor: default; }\n.wb-hStepMuted:hover { background: transparent; }\n.wb-hStepMuted .wb-hStepName { color: var(--ink3); }\n\n.wb-hError {\n  padding: 9px 11px;\n  border-radius: 8px;\n  background: var(--danger-wash);\n  font-size: 12px;\n  color: var(--danger);\n}\n/* ------------------------------------------------------------ 阅读器 */\n/*\n * 读长文的唯一地方。\n *\n * 结果区那列最宽 690，去掉留白只剩 650——一份五万字的文档摆进去就是条窄带子，\n * 所以正文要在宽的场合读：从结果区打开读「现在这份」，从运行记录打开读「第 N 次那份」。\n * 两处是同一个阅读器，只是身份不同（live / snapshot），差别只在标题和一条只读提示。\n */\n.wb-zoomWrap { position: absolute; inset: 0; z-index: 78; display: flex; padding: 10px; }\n/* 阅读器会盖在运行记录上面（从历史里点开一步就是），所以它得在上一级 */\n/* 闃呰鍣ㄤ笌杩愯璁板綍涓嶅悓鏃跺嚭鐜帮紝涓嶉渶瑕侀澶栫殑灞傜骇 */\n.wb-zoomScrim { position: absolute; inset: 0; background: var(--scrim); }\n.wb-zoom {\n  position: relative;\n  flex: 1;\n  min-width: 0;\n  display: flex;\n  flex-direction: column;\n  border-radius: 14px;\n  background: var(--base);\n  border: 0.5px solid var(--hairline);\n  box-shadow: var(--shadow-menu);\n  overflow: hidden;\n}\n.wb-zoomHead {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  padding: 11px 14px 10px;\n  border-bottom: 0.5px solid var(--divider);\n}\n.wb-zoomKicker { flex: none; font-size: 13px; font-weight: 500; }\n.wb-zoomMeta {\n  min-width: 0;\n  font-family: var(--f-mono);\n  font-size: 11px;\n  color: var(--ink4);\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n}\n.wb-zoomHint { flex: none; margin-left: auto; font-size: 11px; color: var(--ink4); }\n\n/* 文件清单照旧横向排、长名省略号，只是宽裕了所以能放得更长 */\n.wb-zoomFiles { display: flex; flex-wrap: wrap; gap: 5px; padding: 10px 14px; border-bottom: 0.5px solid var(--divider); }\n.wb-zoomFiles:empty { display: none; }\n.wb-zFile {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  max-width: 380px;\n  min-width: 0;\n  padding: 6px 10px;\n  border: 0.5px solid var(--divider);\n  border-radius: 8px;\n  background: transparent;\n  color: var(--ink3);\n  font: inherit;\n  font-size: 12px;\n  cursor: pointer;\n}\n.wb-zFile svg { flex: none; width: 13px; height: 13px; color: var(--ink4); }\n.wb-zFile:hover { background: var(--hover); color: var(--ink); }\n.wb-zFile[aria-pressed=\"true\"] { background: var(--hover-strong); border-color: var(--hairline); color: var(--ink); }\n.wb-zFile[aria-pressed=\"true\"] svg { color: var(--accent); }\n.wb-zName { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.wb-zFile[aria-pressed=\"true\"] .wb-zName { font-weight: 500; }\n.wb-zSize { flex: none; font-family: var(--f-mono); font-size: 11px; color: var(--ink4); }\n\n.wb-zoomBody { flex: 1; min-height: 0; overflow-y: auto; padding: 16px 18px 26px; }\n/* 历史快照：说清楚\"这不是现在磁盘上的那份\" */\n.wb-zoomWarn {\n  flex: none;\n  padding: 8px 18px;\n  border-bottom: 0.5px solid var(--divider);\n  background: var(--recess);\n  font-size: 11px;\n  line-height: 16px;\n  color: var(--ink3);\n}\n\n/* 面积大了一倍，正文也该松一档，不然字全挤在左边一小条里 */\n.wb-zoomBody .wb-doc { font-size: 13px; line-height: 22px; }\n.wb-zoomBody .wb-doc h5 { margin-bottom: 9px; font-size: 15px; line-height: 22px; }\n.wb-zoomBody .wb-doc h6 { margin: 16px 0 6px; font-size: 12px; }\n.wb-zoomBody .wb-doc p { margin-bottom: 11px; }\n.wb-zoomBody .wb-doc td { padding: 8px 14px 8px 0; }\n.wb-zoomBody .wb-doc td:last-child { padding-right: 0; }\n/* 结果区的表格是固定比例（给窄列用的），放大后按内容分 */\n.wb-zoomBody .wb-doc table { table-layout: auto; font-size: 13px; }\n.wb-zoomBody .wb-doc th:nth-child(1), .wb-zoomBody .wb-doc td:nth-child(1),\n.wb-zoomBody .wb-doc th:nth-child(2), .wb-zoomBody .wb-doc td:nth-child(2),\n.wb-zoomBody .wb-doc th:nth-child(3), .wb-zoomBody .wb-doc td:nth-child(3) { width: auto; }\n\n/* ------------------------------------------------------------ 审核（提要求重生成） */\n/* 和任务选择器同一套外壳：同一块面板里，两个浮层的形状不该有两套语言 */\n.wb-reviewWrap { position: absolute; inset: 0; z-index: 85; display: flex; align-items: flex-start; justify-content: center; padding-top: 84px; }\n.wb-reviewScrim { position: absolute; inset: 0; background: var(--scrim); }\n.wb-review {\n  position: relative;\n  width: min(420px, calc(100% - 32px));\n  display: flex;\n  flex-direction: column;\n  border-radius: 14px;\n  background: var(--base);\n  border: 0.5px solid var(--hairline);\n  box-shadow: var(--shadow-menu);\n  overflow: hidden;\n}\n.wb-reviewHead { padding: 12px 13px 10px; border-bottom: 0.5px solid var(--divider); }\n.wb-reviewTitle { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 500; }\n.wb-reviewTitle span { flex: 1; min-width: 0; }\n.wb-reviewTitle em { font-style: normal; font-weight: 400; color: var(--ink4); font-size: 11px; }\n.wb-reviewWho {\n  margin-top: 5px;\n  font-family: var(--f-mono);\n  font-size: 11px;\n  color: var(--ink3);\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n}\n.wb-reviewBody { padding: 11px 13px 0; }\n.wb-reviewArea {\n  display: block;\n  width: 100%;\n  min-height: 84px;\n  max-height: 180px;\n  padding: 9px 10px;\n  border: 0.5px solid var(--divider);\n  border-radius: 9px;\n  background: var(--recess);\n  color: var(--ink);\n  font: inherit;\n  font-size: 13px;\n  line-height: 19px;\n  resize: vertical;\n  outline: none;\n}\n.wb-reviewArea::placeholder { color: var(--ink4); }\n.wb-reviewArea:focus { border-color: color-mix(in srgb, var(--accent) 42%, transparent); }\n.wb-reviewChips { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 9px; }\n.wb-reviewChip {\n  padding: 4px 9px;\n  border: 0.5px solid var(--hairline);\n  border-radius: 7px;\n  background: transparent;\n  color: var(--ink3);\n  font: inherit;\n  font-size: 12px;\n  cursor: pointer;\n}\n.wb-reviewChip:hover { background: var(--hover); color: var(--ink); }\n.wb-reviewNote { margin-top: 9px; font-size: 11px; line-height: 16px; color: var(--ink4); }\n/* 从历史快照点进来的：先讲清楚\"重做的是现在这一步，不是那条记录\" */\n.wb-reviewFrom {\n  margin: 0 0 9px;\n  padding: 7px 10px;\n  border-radius: 8px;\n  background: var(--recess);\n  font-size: 11px;\n  line-height: 16px;\n  color: var(--ink3);\n}\n.wb-zoomHead .wb-zoomReview { flex: none; height: 24px; padding: 0 9px; font-size: 12px; }\n.wb-reviewFoot {\n  display: flex;\n  align-items: center;\n  gap: 7px;\n  padding: 11px 13px;\n}\n.wb-reviewFoot .wb-spacer { flex: 1; }\n\n/* ============================ 断点（容器查询，按面板宽度） ============================ */\n/* 轨道宽度阶梯：面板越宽，轨道稍微放宽一点，但永远是配角；\n   低于 700 时轨道改成横向条，结果仍然占满整块。 */\n\n@container panel (min-width: 1200px) {\n  .wb-canvas { width: 312px; }\n  .wb-flow { padding: 14px 16px 18px; }\n}\n\n@container panel (min-width: 900px) and (max-width: 1199.98px) {\n  .wb-canvas { width: 280px; }\n}\n\n@container panel (min-width: 700px) and (max-width: 899.98px) {\n  .wb-canvas { width: 248px; }\n  .wb-flow { padding: 11px 12px 14px; }\n  .wb-canvasHead { padding: 11px 12px 9px; }\n}\n\n/* < 700：竖轨道放不下，改成顶部横向步骤条，结果独占整块 */\n@container panel (max-width: 699.98px) {\n  .wb-panes { flex-direction: column; }\n  .wb-canvas {\n    width: 100%;\n    border-right: 0;\n    border-bottom: 0.5px solid var(--divider);\n  }\n  .wb-canvasScroll { display: none; }\n  .wb-stepStrip { display: flex; }\n  .wb-canvasHead { padding: 10px 12px 8px; }\n  .wb-panelHead { height: 52px; padding: 0 14px; }\n  .wb-panelHead h1 { font-size: 17px; }\n  .wb-headLabel { display: none; }\n  .wb-runbar { padding: 0 12px; gap: 8px; }\n  .wb-segBar i { width: 14px; }\n}\n\n/* ---------------------------------------------------------------- 步骤横条 */\n.wb-stepStrip {\n  display: none;\n  gap: 6px;\n  overflow-x: auto;\n  padding: 7px 12px;\n  scrollbar-width: none;\n}\n.wb-stepStrip::-webkit-scrollbar { display: none; }\n.wb-stepChip {\n  flex: none;\n  display: inline-flex;\n  align-items: center;\n  gap: 5px;\n  height: 30px;\n  padding: 0 10px;\n  border: 0.5px solid var(--hairline);\n  border-radius: 8px;\n  background: var(--card-bg);\n  color: var(--ink2);\n  font: inherit;\n  font-size: 12px;\n  white-space: nowrap;\n  cursor: pointer;\n}\n.wb-stepChip b {\n  font-weight: 500;\n  font-family: var(--f-mono);\n  font-size: 11px;\n  color: var(--ink4);\n}\n.wb-stepChip:hover { background: var(--hover); }\n.wb-stepChip[aria-selected=\"true\"] { border-color: var(--accent); color: var(--ink); background: var(--accent-wash); }\n.wb-stepChip[aria-selected=\"true\"] b { color: var(--accent); }\n.wb-stepChip[data-s=\"failed\"] { color: var(--danger); }\n.wb-stepChip[data-s=\"failed\"] .wb-dot { background: var(--danger); }\n\n/* ---------------------------------------------------------------- 滚动条 */\n.wb-scroll::-webkit-scrollbar, .wb-canvasScroll::-webkit-scrollbar, .wb-inspScroll::-webkit-scrollbar,\n.wb-histBody::-webkit-scrollbar, .wb-zoomBody::-webkit-scrollbar,\n.wb-pickerList::-webkit-scrollbar, .wb-canvasMenu::-webkit-scrollbar { width: 9px; height: 9px; }\n.wb-scroll::-webkit-scrollbar-thumb, .wb-canvasScroll::-webkit-scrollbar-thumb, .wb-inspScroll::-webkit-scrollbar-thumb,\n.wb-histBody::-webkit-scrollbar-thumb, .wb-zoomBody::-webkit-scrollbar-thumb,\n.wb-pickerList::-webkit-scrollbar-thumb, .wb-canvasMenu::-webkit-scrollbar-thumb {\n  border: 2px solid transparent;\n  border-radius: 6px;\n  background: var(--scroll);\n  background-clip: content-box;\n}\n/* Workbench card shell: the frame every card renders inside. */\n\n._card_13mto_3 {\n  display: flex;\n  flex-direction: column;\n  gap: 10px;\n  box-sizing: border-box;\n  height: 100%;\n  /* A card is an index entry, not a panel: with the name, the meta line, and the body\n     it carries it does not need the height an empty cell used to ask for, and the\n     shorter frame is what stops three cards from reading as three blanks. */\n  min-height: 168px;\n  padding: 16px 18px;\n  border: 1px solid var(--dsw-alias-border-l1);\n  border-radius: 12px;\n  background: var(--dsw-alias-bg-layer-1);\n  transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;\n}\n\n._spanWide_13mto_20 {\n  grid-column: span 2;\n}\n\n/* A card that opens something in full. The region is focusable, so it carries the\n   pointer and focus affordances a button would; it cannot BE a button, because the\n   card hosts its own controls in the head action area. */\n._activatable_13mto_27 {\n  cursor: pointer;\n}\n\n._activatable_13mto_27:hover {\n  border-color: var(--dsw-alias-brand-primary);\n  /* A lift, not a colour change: the card already changes border on hover, and the\n     shadow is what reads as \"this opens something\" before the pointer arrives. */\n  box-shadow: 0 6px 16px -6px rgb(0 0 0 / 18%);\n  transform: translateY(-1px);\n}\n\n._activatable_13mto_27:focus-visible {\n  outline: 2px solid var(--dsw-alias-brand-primary);\n  outline-offset: 1px;\n}\n\n._spanTall_13mto_44 {\n  grid-row: span 2;\n}\n\n._spanLarge_13mto_48 {\n  grid-column: span 2;\n  grid-row: span 2;\n}\n\n._head_13mto_53 {\n  display: flex;\n  flex-direction: column;\n  gap: 6px;\n  min-width: 0;\n}\n\n/* The card's monogram: the first character of the user's own name for the card, on a\n   tint that is stable per card.\n   \n   Three cards of one workbench differ only in their titles, and a title is read rather\n   than seen — so the grid needed one mark each that the eye can pick out before the\n   text is read. The hue comes from the card id (see the shell), never from the name: a\n   card keeps its colour when it is renamed. Tints are mixed from a single hue so the\n   mark works in both themes without a second set of tokens. */\n._mark_13mto_68 {\n  flex: none;\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  width: 28px;\n  height: 28px;\n  border-radius: 9px;\n  background: color-mix(in srgb, hsl(var(--wb-hue, 250) 68% 52%) 16%, transparent);\n  color: color-mix(in srgb, hsl(var(--wb-hue, 250) 66% 42%) 78%, var(--dsw-alias-label-primary));\n  font-size: 13px;\n  font-weight: 600;\n  line-height: 1;\n  user-select: none;\n}\n\n/* The title, the status, and the card's own controls share one line. Centring that\n   line is what puts them on a single baseline: the three boxes have different\n   heights, so top-aligning them left the status text and the button labels at\n   different offsets from the title. The subtitle sits below this line rather than\n   inside it, so a wrapping subtitle cannot drag the controls out of place. */\n._headRow_13mto_89 {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  min-width: 0;\n}\n\n._title_13mto_96 {\n  margin: 0;\n  flex: 1 1 auto;\n  min-width: 0;\n  font-size: 15px;\n  font-weight: 600;\n  line-height: 22px;\n  overflow-wrap: anywhere;\n}\n\n/* Everything the card states about itself that is not its name: the skill it runs and\n   the run it last finished. One row under the title, in the secondary colour, so the\n   title keeps the whole width and the facts line up across the grid. */\n._meta_13mto_109 {\n  display: flex;\n  align-items: center;\n  flex-wrap: wrap;\n  gap: 4px 10px;\n  min-width: 0;\n}\n\n/* The skill name is a chip rather than a second line of grey text: it is a fact about\n   the card, not a subtitle of its name, and the chip is what separates the two levels. */\n._subtitle_13mto_119 {\n  display: inline-block;\n  align-self: flex-start;\n  max-width: 100%;\n  padding: 1px 8px;\n  border-radius: 6px;\n  background: var(--dsw-alias-bg-layer-2);\n  font-size: 11px;\n  line-height: 18px;\n  color: var(--dsw-alias-label-secondary);\n  overflow-wrap: anywhere;\n}\n\n._status_13mto_132 {\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n  flex: none;\n  font-size: 12px;\n  line-height: 18px;\n  color: var(--dsw-alias-label-secondary);\n}\n\n._headActions_13mto_142 {\n  display: inline-flex;\n  align-items: center;\n  gap: 4px;\n  flex: none;\n}\n\n._iconButton_13mto_149 {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  width: 24px;\n  height: 24px;\n  padding: 0;\n  border: 0;\n  border-radius: 6px;\n  background: transparent;\n  color: var(--dsw-alias-label-secondary);\n  cursor: pointer;\n  opacity: 0;\n}\n\n/* The card's own controls and the host's icon controls are hidden until the card is\n   hovered or focused: at rest the title is the only thing on the line. */\n._card_13mto_3:hover ._iconButton_13mto_149,\n._card_13mto_3:focus-within ._iconButton_13mto_149 {\n  opacity: 1;\n}\n\n._iconButton_13mto_149:hover {\n  background: var(--dsw-alias-bg-layer-2);\n  color: var(--dsw-alias-label-primary);\n}\n\n._iconButton_13mto_149:focus-visible {\n  outline: 2px solid var(--dsw-alias-brand-primary);\n  outline-offset: 1px;\n}\n\n/* The reorder handle reveals with the other icon controls and sits in the tertiary\n   colour, so it reads as an affordance rather than as a peer of the card's own\n   actions. Hovering it brings it back to the primary label colour, and because it is\n   inside the card, focusing it from the keyboard reveals it too. */\n._handle_13mto_185 {\n  color: var(--dsw-alias-label-tertiary);\n  cursor: grab;\n  touch-action: none;\n}\n\n._handle_13mto_185:active {\n  cursor: grabbing;\n}\n\n._body_13mto_195 {\n  flex: 1 1 auto;\n  min-height: 0;\n  font-size: 13px;\n  line-height: 20px;\n  color: var(--dsw-alias-label-secondary);\n}\n\n._failure_13mto_203 {\n  display: flex;\n  flex-direction: column;\n  align-items: flex-start;\n  gap: 8px;\n  color: var(--dsw-alias-label-secondary);\n}\n\n._dragging_13mto_211 {\n  opacity: 0.6;\n}\n/*$vite$:1*/";
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
							reason: `layout request failed: ${messageOf$2(error)}`
						};
					}
					if (response.status === 409) {
						const snapshot = await readSnapshot$1(response);
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
					const snapshot = await readSnapshot$1(response);
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
							reason: `layout request failed: ${messageOf$2(error)}`
						};
					}
					if (!response.ok) return {
						status: "unavailable",
						reason: `layout route answered ${String(response.status)}`
					};
					const snapshot = await readSnapshot$1(response);
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
		async function readSnapshot$1(response) {
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
		function messageOf$2(error) {
			return error instanceof Error ? error.message : String(error);
		}
		//#endregion
		//#region src/pipeline-contract.ts
		/**
		* Wire contract for the workbench's pipeline definitions.
		*
		* A pipeline is an ordered list of card ids. Each step runs the card it names, and the
		* card already carries the skill, template, directory, model and permission the step
		* needs — so a step is a reference plus, optionally, the instruction for that step.
		*
		* No run state lives here. A pipeline's runs are its cards' runs: this module stores
		* what the user arranged, never what happened.
		* @module dsh-workbench/pipeline-contract
		*/
		/** Private route this plugin serves pipeline definitions on. */
		var WORKBENCH_PIPELINE_PATH = "/api/workbench/pipeline";
		/**
		* Whether a value is a usable pipeline identity.
		*
		* Same slug rule as a card id: these are storage keys and record keys, and two rules for
		* "a safe key" is one rule too many.
		* @param value - candidate identity.
		* @returns whether the value may be used as a pipeline id.
		*/
		function isWorkbenchPipelineId(value) {
			return isWorkbenchCardId(value);
		}
		//#endregion
		//#region src/client/pipeline-api.ts
		/**
		* Build the pipeline API.
		* @param options - transport seam.
		* @returns the read/write face.
		*/
		function createWorkbenchPipelineApi(options = {}) {
			const fetcher = options.fetcher ?? ((input, init) => globalThis.fetch(input, init));
			let tail = Promise.resolve({
				status: "failed",
				reason: "no write was issued"
			});
			const send = async (patch) => {
				let response;
				try {
					response = await fetcher(WORKBENCH_PIPELINE_PATH, {
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
						reason: `pipeline request failed: ${messageOf$1(error)}`
					};
				}
				if (response.status === 409) {
					const snapshot = await readSnapshot(response);
					return snapshot === void 0 ? {
						status: "failed",
						reason: "pipeline write was based on a stale revision"
					} : {
						status: "conflict",
						snapshot
					};
				}
				if (!response.ok) return {
					status: "failed",
					reason: await reasonOf(response)
				};
				const snapshot = await readSnapshot(response);
				return snapshot === void 0 ? {
					status: "failed",
					reason: "pipeline response could not be read"
				} : {
					status: "ok",
					snapshot
				};
			};
			return {
				async read(signal) {
					let response;
					try {
						response = await fetcher(WORKBENCH_PIPELINE_PATH, {
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
							reason: `pipeline request failed: ${messageOf$1(error)}`
						};
					}
					if (!response.ok) return {
						status: "unavailable",
						reason: await reasonOf(response)
					};
					const snapshot = await readSnapshot(response);
					return snapshot === void 0 ? {
						status: "unavailable",
						reason: "pipeline response could not be read"
					} : {
						status: "ok",
						snapshot
					};
				},
				write(patch) {
					const next = tail.then(async () => await send(patch));
					tail = next;
					return next;
				}
			};
		}
		/**
		* Read one response body as a snapshot.
		* @param response - the response to read.
		* @returns the snapshot, or undefined when the body is not one.
		*/
		async function readSnapshot(response) {
			let body;
			try {
				body = await response.json();
			} catch {
				return;
			}
			return decodeSnapshot(body);
		}
		/**
		* Validate one decoded snapshot.
		* @param value - decoded body.
		* @returns the snapshot, or undefined when a field is outside the contract.
		*/
		function decodeSnapshot(value) {
			if (typeof value !== "object" || value === null || Array.isArray(value)) return void 0;
			const body = value;
			if (body.apiVersion !== 1) return void 0;
			if (typeof body.revision !== "string") return void 0;
			const pipelines = decodeList(body.pipelines);
			if (pipelines === void 0) return void 0;
			return {
				apiVersion: 1,
				revision: body.revision,
				pipelines
			};
		}
		/**
		* Validate one decoded pipeline list.
		* @param value - decoded `pipelines` field.
		* @returns the list, or undefined when an entry is outside the contract.
		*/
		function decodeList(value) {
			if (!Array.isArray(value) || value.length > 64) return void 0;
			const pipelines = [];
			for (const raw of value) {
				if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return void 0;
				const entry = raw;
				if (typeof entry.id !== "string" || !isWorkbenchPipelineId(entry.id)) return void 0;
				if (typeof entry.name !== "string" || typeof entry.updatedAt !== "number") return void 0;
				if (!Array.isArray(entry.steps)) return void 0;
				const steps = [];
				for (const rawStep of entry.steps) {
					if (typeof rawStep !== "object" || rawStep === null || Array.isArray(rawStep)) return void 0;
					const step = rawStep;
					if (typeof step.cardId !== "string" || !isWorkbenchCardId(step.cardId)) return void 0;
					if (step.instruction !== void 0 && typeof step.instruction !== "string") return void 0;
					steps.push({
						cardId: step.cardId,
						...step.instruction === void 0 ? {} : { instruction: step.instruction }
					});
				}
				pipelines.push({
					id: entry.id,
					name: entry.name,
					steps,
					updatedAt: entry.updatedAt
				});
			}
			return pipelines;
		}
		/**
		* Read one failure body's message.
		* @param response - the failed response.
		* @returns the Host's own message, or the status.
		*/
		async function reasonOf(response) {
			try {
				const message = (await response.json()).error?.message;
				if (typeof message === "string" && message.length > 0) return message;
			} catch {}
			return `pipeline request failed with ${String(response.status)}`;
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
			skillCardWorkspacePickerUnavailable: "这个环境没有目录选择器，直接填完整路径就行",
			skillCardWorkspacePathPlaceholder: "例如 D:\\Git\\my-project",
			skillCardWorkspaceApply: "使用这个目录",
			skillCardWorkspaceTypedInvalid: "这不是一个完整的路径，得从盘符开始",
			skillCardWorkspaceTypedMissing: "这个目录不存在，或者不是文件夹",
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
			runHistoryRunningTitle: "正在运行，结果出来后显示在这里",
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
			promptFreshHint: "这次在哪个目录下运行。改目录会更新这张卡的配置，不改就直接运行。",
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
			actionFieldWorkspace: "工作目录",
			actionWorkspaceNote: "只用于这一次调用，目标卡片自己的目录不变",
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
			documentFootnotes: "脚注",
			pipeRailPipelines: "流水线",
			pipeRailTasks: "单任务",
			pipeRailNoPipelines: "还没有流水线",
			pipeRailMenu: "这条流水线",
			pipeNewPipeline: "新建流水线",
			pipeNewPipelineName: "新流水线",
			pipeCreateCard: "创建卡片",
			pipeNoPipeline: "还没有流水线",
			pipeColumnLabel: "流水线",
			pipeNoSteps: "还没有步骤",
			pipeEmptyTitle: "这条流水线还没有步骤",
			pipeEmptyBody: "步骤按顺序串行执行，前一步的会话就是后一步的上下文。先挑一个任务当第一步。",
			pipeEmptyPipelineBody: "一条流水线把若干张卡片按顺序串起来：前一步的产出自动成为后一步的输入。",
			pipeAddFirstStep: "添加第一个步骤",
			pipeAddStep: "添加步骤",
			pipeInsertHere: "插在第 {at} 位",
			pipeMetaNoPipeline: "新建一条流水线开始",
			pipeMetaNoSteps: "0 个步骤 · 串行执行，失败即停",
			pipeMetaSteps: "{count} 个步骤 · 串行执行，失败即停",
			pipeMetaRan: "最近运行 #{no} · {count} 个步骤 · {when} 更新",
			pipeRunAll: "运行",
			pipeRunOne: "单独运行",
			pipeRunThisStep: "单独运行这一步",
			pipeRetryStep: "重试这一步",
			pipeStop: "停止",
			pipeRunningStep: "运行中 · 第 {at} 步 / 共 {count} 步",
			pipeFailedAt: "{done} / {count} 步完成 · 第 {at} 步失败，后续未执行",
			pipeStopped: "{done} / {count} 步完成 · 已手动停止",
			pipeAllDone: "{count} 步全部完成",
			pipeAllDoneAt: "{count} 步全部完成 · 用时 {took}",
			pipeStand_idle: "未整体运行",
			pipeStand_solo: "单步跑过",
			pipeStand_kept: "已有结果",
			pipeStand_running: "运行中",
			pipeStand_done: "已完成",
			pipeStand_failed: "失败",
			pipeStand_stopped: "已停止",
			pipeRunningOne: "单独运行 · 第 {at} 步",
			pipeBarIdle: "{count} 步都还没启动 · 点右上角「运行」按顺序跑完",
			pipeBarSoloHead: "整条还没跑过",
			pipeBarSoloWhich: "第 {steps} 步单独跑过",
			pipeBarKeptWhich: "第 {steps} 步有结果",
			pipeBarSoloNextAll: "点「运行」会从头再跑一遍",
			pipeBarSoloNextFirst: "点「运行」从第 1 步开始，跑过的那一步会重跑",
			pipeBarSoloNextResume: "点「运行」从第 {at} 步接着跑",
			pipeListSeparator: "、",
			pipeRunOf: "这一步的产物来自第 {no} 次运行",
			pipeRunOfSingle: "单步 #{no}",
			pipeRunOfSingleTitle: "这一步的产物来自第 {no} 次运行，那次只跑了这一步",
			pipeStepKicker: "第 {at} 步 / 共 {count} 步 · {name}",
			pipeNoStepKicker: "这条流水线还没有步骤",
			pipeNoStep: "未选择步骤",
			pipeCardKicker: "单独运行 · 不属于任何流水线",
			pipeCardPanel: "这张卡片",
			pipeCardPanelNote: "它不在任何流水线里，单独打开看它的结果。",
			pipeStepMenu: "步骤操作",
			pipeMoveUp: "上移一位",
			pipeMoveDown: "下移一位",
			pipeRenameStep: "重命名这一步",
			pipeRemoveStep: "从流水线中移除",
			pipeRemoveStepArmed: "再点一次确认移除",
			pipeRemoveNote: "移除后这一步的产物会一起从结果里消失",
			pipeRemoveNoteName: "将移除「{name}」，这一步的产物会一起从结果里消失",
			pipeRenameHint: "回车保存 · Esc 放弃",
			pipeStepNameLabel: "任务名称",
			pipeTabsLabel: "这一步的视图",
			pipeTabActivity: "活动",
			pipeTabConfig: "配置",
			pipeTabResult: "结果",
			pipeStepState_idle: "待运行",
			pipeStepState_queued: "等待中",
			pipeStepState_running: "运行中",
			pipeStepState_done: "已完成",
			pipeStepState_failed: "失败",
			pipeStepState_stopped: "已停止",
			pipeMenuSub: "{count} 个步骤 · {state}",
			pipeRunState_ok: "成功",
			pipeRunState_fail: "失败",
			pipeRunState_running: "运行中",
			pipeRunState_stopped: "已停止",
			pipeScopeOnly: "仅 {name}",
			pipeScopeRefined: "{name} · 重新生成",
			pipeRunOfSingleNo: "单步",
			pipeRunOfSingleNoTitle: "这一步是单独跑的，运行记录不在本页",
			pipeAddProblem: "这一步没加上：{reason}",
			pipeQueued: "等待前一步完成",
			pipeWorking: "正在生成",
			pipeNeverRan: "还没启动过",
			pipeFailed: "失败",
			pipeNoProduct: "没有产物",
			pipeInlineProduct: "区域内容",
			pipeEmptyPanelTitle: "先加一个步骤",
			pipeEmptyPanelBody: "每个步骤就是一张卡片。加进来以后，这里显示它的结果、活动与配置。",
			pipeActivityRunning: "正在运行",
			pipeActivityRunningBody: "跑完这里会列出它调用了什么、说了什么。",
			pipeActivityFailed: "这一步失败了",
			pipeActivityNone: "还没有活动记录",
			pipeActivityNoneBody: "这一步没有留下调用记录。跑一次之后，这里会列出它的每一步动作。",
			pipeActivityTruncated: "更早的记录已省略",
			pipeActivityNarration: "模型输出",
			pipeOpenRuns: "打开完整运行记录",
			pipeCfgPipeline: "整条流水线",
			pipeCfgPipelineNote: "改一次，每一步都跟着",
			pipeCfgModel: "模型",
			pipeCfgModelInherit: "跟随会话",
			pipeCfgModelInheritNote: "这一步没有单独指定，跟着流水线走",
			pipeCfgPermissionNote: "写入限制在工作目录内",
			pipeCfgWorkspaceNote: "每一步都跑在这个目录里",
			pipeCfgWorkspacePick: "选择目录",
			pipeCfgWriteFailed: "这一次没有写进去，再试一次",
			pipeCfgPickerRefused: "目录选择器没有打开，这条路走不通",
			pipeCfgWorkspaceNoPicker: "这里没有目录选择器",
			pipeCfgInstruction: "运行指令",
			pipeCfgInstructionNote: "这句话会跟着这一步一起交给技能",
			pipeCfgSkillNoNote: "这条技能没有说明",
			pipeCfgPermission: "权限模式",
			pipeCfgWorkspace: "工作目录",
			pipeCfgNoWorkspace: "还没有设置",
			pipeCfgStep: "这一步",
			pipeCfgStepNote: "第 {at} 步",
			pipeCfgSkill: "技能",
			pipeCfgNoSkill: "还没有选技能",
			pipeCfgFailure: "失败处理",
			pipeCfgFailureStop: "停止后续步骤",
			pipeCfgFailureNote: "串行编排，失败即停",
			pipeCfgTemplate: "模板",
			pipeCfgPreview: "预览",
			pipeCfgSource: "源码",
			pipeCfgPreviewNote: "模板预览 · 不含本次产物",
			pipeCfgRegion: "区域内容",
			pipeCfgRegionBody: "运行时由模型生成，模板把它替换进这块位置",
			pipeCfgNoTemplate: "这张卡片还没有模板。先给它写一个 HTML 模板。",
			pipeCfgEdit: "编辑模板与设置",
			pipeResultRunning: "正在生成结果",
			pipeResultRunningBody: "写完这里会列出它交出了什么。",
			pipeResultQueued: "这一步还没有运行",
			pipeResultQueuedBody: "串行编排会等第 {at} 步完成后自动开始。也可以现在就单独运行它。",
			pipeResultFailed: "这一步没有交出结果",
			pipeResultNone: "还没有结果",
			pipeResultNoneBody: "单独运行一次，或者跑整条流水线。",
			pipeResultWhat: "这次的结果",
			pipeResultEdited: "这份结果被手工改过",
			pipeResultOpenInline: "查看结果",
			pipeResultFilesProblem: "读不到这个目录：{reason}",
			pipeOpenResult: "打开结果",
			pipeReaderBack: "返回工作台",
			pipeHistoryTitle: "运行记录",
			pipeHistoryRun: "第 {no} 次运行",
			pipeHistoryEmptyMeta: "还没有记录",
			pipeHistoryCount: "{count} 次运行 · 点一行看那一次交了什么",
			pipeHistoryEmpty: "这条流水线还没跑过。整条运行、或者单独运行其中一步之后，记录会出现在这里。",
			pipeHistoryBack: "返回列表",
			pipePickerTitle: "添加步骤",
			pipePickerAt: "插在第 {at} 位",
			pipePickerSearch: "搜索任务或技能",
			pipePickerEmpty: "没有可用的卡片，先到「单任务」里创建一张。",
			pipePickerUsed: "已在流水线里",
			pipeClose: "关闭",
			pipeRename: "重命名",
			pipeRenameLabel: "流水线名称",
			pipeDelete: "删除这条流水线",
			pipeDeleteConfirm: "再点一次确认删除",
			pipeReaderTitle: "阅读结果",
			pipeEscHint: "Esc 关闭",
			pipeReviewTitle: "重新生成",
			pipeReviewSubtitle: "说明要改哪里，其余保持原样",
			pipeReviewPlaceholder: "例如：表格换成三列，金额右对齐",
			pipeChipEdges: "两侧留白再宽一点",
			pipeChipTable: "表格换成三列",
			pipeChipShorter: "篇幅再短一半",
			pipeReviewWarn: "重新生成会覆盖这一步现在的产物，之前的结果仍留在运行记录里。",
			pipeCancel: "取消",
			pipeRegenerate: "重新生成"
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
			skillCardWorkspacePickerUnavailable: "This environment has no directory picker — type the full path instead",
			skillCardWorkspacePathPlaceholder: "e.g. D:\\Git\\my-project",
			skillCardWorkspaceApply: "Use this directory",
			skillCardWorkspaceTypedInvalid: "That is not a full path — it has to start at a drive",
			skillCardWorkspaceTypedMissing: "There is no directory there, or it is not a folder",
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
			runHistoryRunningTitle: "Running — the result appears here when it finishes",
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
			promptFreshHint: "Where this run happens. Changing the directory updates the card; leaving it runs as configured.",
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
			actionFieldWorkspace: "Working directory",
			actionWorkspaceNote: "This invocation only — the target card keeps its own directory",
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
			documentFootnotes: "Footnotes",
			pipeRailPipelines: "Pipelines",
			pipeRailTasks: "Single tasks",
			pipeRailNoPipelines: "No pipelines yet",
			pipeRailMenu: "This pipeline",
			pipeNewPipeline: "New pipeline",
			pipeNewPipelineName: "New pipeline",
			pipeCreateCard: "Create card",
			pipeNoPipeline: "No pipeline yet",
			pipeColumnLabel: "Pipeline",
			pipeNoSteps: "No steps yet",
			pipeEmptyTitle: "This pipeline has no steps yet",
			pipeEmptyBody: "Steps run in order, one at a time; a step continues the session the one before it opened. Pick a task for the first step.",
			pipeEmptyPipelineBody: "A pipeline strings cards together in order: what one step produces becomes the input of the next.",
			pipeAddFirstStep: "Add the first step",
			pipeAddStep: "Add a step",
			pipeInsertHere: "Insert at position {at}",
			pipeMetaNoPipeline: "Create a pipeline to begin",
			pipeMetaNoSteps: "0 steps · runs in order, stops on failure",
			pipeMetaSteps: "{count} steps · runs in order, stops on failure",
			pipeMetaRan: "Last run #{no} · {count} steps · updated {when}",
			pipeRunAll: "Run",
			pipeRunOne: "Run alone",
			pipeRunThisStep: "Run this step alone",
			pipeRetryStep: "Retry this step",
			pipeStop: "Stop",
			pipeRunningStep: "Running · step {at} of {count}",
			pipeFailedAt: "{done} of {count} steps done · step {at} failed, nothing after it ran",
			pipeStopped: "{done} of {count} steps done · stopped by hand",
			pipeAllDone: "All {count} steps done",
			pipeAllDoneAt: "All {count} steps done · took {took}",
			pipeStand_idle: "Not run as a whole",
			pipeStand_solo: "Single steps only",
			pipeStand_kept: "Steps have results",
			pipeStand_running: "Running",
			pipeStand_done: "Done",
			pipeStand_failed: "Failed",
			pipeStand_stopped: "Stopped",
			pipeRunningOne: "Running one step · step {at}",
			pipeBarIdle: "none of the {count} steps has started · press Run to take them in order",
			pipeBarSoloHead: "The whole chain has not run",
			pipeBarSoloWhich: "step {steps} ran on its own",
			pipeBarKeptWhich: "step {steps} has a result",
			pipeBarSoloNextAll: "Run starts over from the beginning",
			pipeBarSoloNextFirst: "Run starts at step 1 and takes the finished step again",
			pipeBarSoloNextResume: "Run continues from step {at}",
			pipeListSeparator: ", ",
			pipeRunOf: "This step’s product comes from run #{no}",
			pipeRunOfSingle: "#{no} · single",
			pipeRunOfSingleTitle: "This step’s product comes from run #{no}, which ran this step alone",
			pipeStepKicker: "Step {at} of {count} · {name}",
			pipeNoStepKicker: "This pipeline has no steps yet",
			pipeNoStep: "No step selected",
			pipeCardKicker: "Runs alone · not part of any pipeline",
			pipeCardPanel: "This card",
			pipeCardPanelNote: "It is not in a pipeline. Open it to read its result.",
			pipeStepMenu: "Step actions",
			pipeMoveUp: "Move up one",
			pipeMoveDown: "Move down one",
			pipeRenameStep: "Rename this step",
			pipeRemoveStep: "Remove from pipeline",
			pipeRemoveStepArmed: "Click again to remove",
			pipeRemoveNote: "Removing it takes its product out of the results too",
			pipeRemoveNoteName: "Removing \"{name}\" takes its product out of the results too",
			pipeRenameHint: "Enter to save · Esc to cancel",
			pipeStepNameLabel: "Task name",
			pipeTabsLabel: "Views of this step",
			pipeTabActivity: "Activity",
			pipeTabConfig: "Config",
			pipeTabResult: "Result",
			pipeStepState_idle: "Ready to run",
			pipeStepState_queued: "Queued",
			pipeStepState_running: "Running",
			pipeStepState_done: "Done",
			pipeStepState_failed: "Failed",
			pipeStepState_stopped: "Stopped",
			pipeMenuSub: "{count} steps · {state}",
			pipeRunState_ok: "OK",
			pipeRunState_fail: "Failed",
			pipeRunState_running: "Running",
			pipeRunState_stopped: "Stopped",
			pipeScopeOnly: "only {name}",
			pipeScopeRefined: "{name} · regenerated",
			pipeRunOfSingleNo: "on its own",
			pipeRunOfSingleNoTitle: "This step ran on its own; the run record is not on this page",
			pipeAddProblem: "This step was not added: {reason}",
			pipeQueued: "Waiting for the step before it",
			pipeWorking: "Writing",
			pipeNeverRan: "Not started yet",
			pipeFailed: "Failed",
			pipeNoProduct: "No product",
			pipeInlineProduct: "Region content",
			pipeEmptyPanelTitle: "Add a step first",
			pipeEmptyPanelBody: "Every step is a card. Once one is in, this shows its result, activity and config.",
			pipeActivityRunning: "Running",
			pipeActivityRunningBody: "What it called and said will be listed here once it finishes.",
			pipeActivityFailed: "This step failed",
			pipeActivityNone: "No activity recorded",
			pipeActivityNoneBody: "This step left no trace. After one run, its every action is listed here.",
			pipeActivityTruncated: "Earlier entries omitted",
			pipeActivityNarration: "Model output",
			pipeOpenRuns: "Open the full run record",
			pipeCfgPipeline: "Whole pipeline",
			pipeCfgPipelineNote: "Change once, every step follows",
			pipeCfgModel: "Model",
			pipeCfgModelInherit: "Follows the session",
			pipeCfgModelInheritNote: "This step sets none of its own; it follows the pipeline",
			pipeCfgPermissionNote: "Writes stay inside the workspace",
			pipeCfgWorkspaceNote: "Every step runs in this directory",
			pipeCfgWorkspacePick: "Choose",
			pipeCfgWriteFailed: "That change did not land; try it again",
			pipeCfgPickerRefused: "The directory chooser refused to open",
			pipeCfgWorkspaceNoPicker: "No chooser here",
			pipeCfgInstruction: "Instruction",
			pipeCfgInstructionNote: "This sentence is handed to the skill with the step",
			pipeCfgSkillNoNote: "This skill has no description",
			pipeCfgPermission: "Permission",
			pipeCfgWorkspace: "Workspace",
			pipeCfgNoWorkspace: "Not set",
			pipeCfgStep: "This step",
			pipeCfgStepNote: "Step {at}",
			pipeCfgSkill: "Skill",
			pipeCfgNoSkill: "No skill selected",
			pipeCfgFailure: "On failure",
			pipeCfgFailureStop: "Stop the remaining steps",
			pipeCfgFailureNote: "Runs in order, stops on failure",
			pipeCfgTemplate: "Template",
			pipeCfgPreview: "Preview",
			pipeCfgSource: "Source",
			pipeCfgPreviewNote: "Template preview · without this run’s product",
			pipeCfgRegion: "Region content",
			pipeCfgRegionBody: "Generated by the model at run time, substituted into this place",
			pipeCfgNoTemplate: "This card has no template yet. Write it an HTML template first.",
			pipeCfgEdit: "Edit template and settings",
			pipeResultRunning: "Generating the result",
			pipeResultRunningBody: "What it hands over is listed here when it is written.",
			pipeResultQueued: "This step has not run",
			pipeResultQueuedBody: "The chain starts it once step {at} is done. You can also run it alone now.",
			pipeResultFailed: "This step handed over nothing",
			pipeResultNone: "No result yet",
			pipeResultNoneBody: "Run it alone, or run the whole pipeline.",
			pipeResultWhat: "This run’s result",
			pipeResultEdited: "This result was edited by hand",
			pipeResultOpenInline: "Open the result",
			pipeResultFilesProblem: "This directory could not be listed: {reason}",
			pipeOpenResult: "Open the result",
			pipeReaderBack: "Back to the workbench",
			pipeHistoryTitle: "Run record",
			pipeHistoryRun: "Run #{no}",
			pipeHistoryEmptyMeta: "No record yet",
			pipeHistoryCount: "{count} runs · pick one to see what it handed over",
			pipeHistoryEmpty: "This pipeline has not run yet. Run the chain, or one of its steps, and the record appears here.",
			pipeHistoryBack: "Back to the list",
			pipePickerTitle: "Add a step",
			pipePickerAt: "Inserts at position {at}",
			pipePickerSearch: "Search tasks or skills",
			pipePickerEmpty: "No cards available. Create one under “Single tasks” first.",
			pipePickerUsed: "Already in the pipeline",
			pipeClose: "Close",
			pipeRename: "Rename",
			pipeRenameLabel: "Pipeline name",
			pipeDelete: "Delete this pipeline",
			pipeDeleteConfirm: "Click again to delete",
			pipeReaderTitle: "Result",
			pipeEscHint: "Esc to close",
			pipeReviewTitle: "Regenerate",
			pipeReviewSubtitle: "Say what should change; everything else stays as it is",
			pipeReviewPlaceholder: "e.g. Make the table three columns and right-align the amounts",
			pipeChipEdges: "Wider margins",
			pipeChipTable: "Three-column table",
			pipeChipShorter: "Half the length",
			pipeReviewWarn: "Regenerating replaces the current output of this step; earlier results stay in the run history.",
			pipeCancel: "Cancel",
			pipeRegenerate: "Regenerate"
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
		* Whether a value is a usable card instruction.
		*
		* Whitespace is not part of it, and a value that is only whitespace is no instruction at
		* all: the card then runs on its skill's own reading of the work, exactly as it did before
		* this field existed.
		* @param value - candidate instruction.
		* @returns whether the value holds visible text within the length limit.
		*/
		function isWorkbenchCardInstruction(value) {
			return value.trim().length > 0 && value.length <= 2e3;
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
		//#region src/client/skill-card/files-wire.ts
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
				},
				async listFiles(cardId, path, signal) {
					const query = `?cardId=${encodeURIComponent(cardId)}&path=${encodeURIComponent(path)}`;
					let response;
					try {
						response = await fetcher(`${WORKBENCH_SKILL_CARD_FILES_PATH}${query}`, {
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
					const listing = parseListing(body);
					return listing === void 0 ? {
						status: "unavailable",
						reason: "listing response did not match the contract"
					} : {
						status: "ok",
						listing
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
				const instruction = entry.instruction;
				if (instruction !== void 0 && (typeof instruction !== "string" || !isWorkbenchCardInstruction(instruction))) return;
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
					...instruction === void 0 ? {} : { instruction },
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
			page: "_page_nfmcv_3",
			pageHead: "_pageHead_nfmcv_20",
			pageTitle: "_pageTitle_nfmcv_34",
			pageIntro: "_pageIntro_nfmcv_42",
			notice: "_notice_nfmcv_49",
			empty: "_empty_nfmcv_58",
			emptyTitle: "_emptyTitle_nfmcv_67",
			emptyBody: "_emptyBody_nfmcv_74",
			grid: "_grid_nfmcv_81",
			cell: "_cell_nfmcv_95",
			createRoot: "_createRoot_nfmcv_101",
			createTile: "_createTile_nfmcv_112",
			createMark: "_createMark_nfmcv_145",
			pagePipeline: "_pagePipeline_nfmcv_191",
			shell: "_shell_nfmcv_206",
			rail: "_rail_nfmcv_225",
			railHead: "_railHead_nfmcv_244",
			railTitle: "_railTitle_nfmcv_252",
			railAction: "_railAction_nfmcv_259",
			linkBtn: "_linkBtn_nfmcv_260",
			menuBtn: "_menuBtn_nfmcv_280",
			toolBtn: "_toolBtn_nfmcv_281",
			stepBadge: "_stepBadge_nfmcv_282",
			stepMain: "_stepMain_nfmcv_283",
			railRowMain: "_railRowMain_nfmcv_284",
			railRowTask: "_railRowTask_nfmcv_285",
			tab: "_tab_nfmcv_286",
			primaryBtn: "_primaryBtn_nfmcv_287",
			stopBtn: "_stopBtn_nfmcv_288",
			addStep: "_addStep_nfmcv_289",
			pickerRow: "_pickerRow_nfmcv_290",
			railList: "_railList_nfmcv_295",
			railEmpty: "_railEmpty_nfmcv_304",
			railRow: "_railRow_nfmcv_284",
			railRowActive: "_railRowActive_nfmcv_319",
			railRowName: "_railRowName_nfmcv_361",
			railCount: "_railCount_nfmcv_367",
			menu: "_menu_nfmcv_280",
			menuRow: "_menuRow_nfmcv_406",
			menuRowDanger: "_menuRowDanger_nfmcv_423",
			renameInput: "_renameInput_nfmcv_427",
			canvas: "_canvas_nfmcv_442",
			canvasHead: "_canvasHead_nfmcv_453",
			canvasTitleGroup: "_canvasTitleGroup_nfmcv_460",
			canvasTitle: "_canvasTitle_nfmcv_460",
			canvasMeta: "_canvasMeta_nfmcv_478",
			canvasHint: "_canvasHint_nfmcv_479",
			runBar: "_runBar_nfmcv_491",
			chainLine: "_chainLine_nfmcv_526",
			chainLineFailed: "_chainLineFailed_nfmcv_536",
			stepList: "_stepList_nfmcv_540",
			step: "_step_nfmcv_282",
			stepSelected: "_stepSelected_nfmcv_559",
			stepRow: "_stepRow_nfmcv_564",
			stepName: "_stepName_nfmcv_605",
			stepNameMissing: "_stepNameMissing_nfmcv_613",
			stepSub: "_stepSub_nfmcv_618",
			stepAsk: "_stepAsk_nfmcv_628",
			stepTook: "_stepTook_nfmcv_634",
			chip: "_chip_nfmcv_638",
			chipIdle: "_chipIdle_nfmcv_646",
			chipQueued: "_chipQueued_nfmcv_651",
			chipRunning: "_chipRunning_nfmcv_656",
			chipDone: "_chipDone_nfmcv_661",
			chipFailed: "_chipFailed_nfmcv_666",
			chipStopped: "_chipStopped_nfmcv_671",
			stepTools: "_stepTools_nfmcv_678",
			connector: "_connector_nfmcv_709",
			picker: "_picker_nfmcv_290",
			pickerHead: "_pickerHead_nfmcv_745",
			pickerEmpty: "_pickerEmpty_nfmcv_769",
			inspector: "_inspector_nfmcv_779",
			tabs: "_tabs_nfmcv_787",
			tabActive: "_tabActive_nfmcv_811",
			tabBody: "_tabBody_nfmcv_819",
			noFocus: "_noFocus_nfmcv_831"
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
		/**
		* A line that is only an identifier — a task number, a defect key, a bare number.
		*
		* The suffix is part of the identifier: this backlog numbers sub-tasks `T202611024092-1`, and
		* the pattern used to accept only the prefix, so the very rows the rule exists to skip came
		* back. Four digits or fewer stay prose: `2026-10-27` is a date, not an identifier.
		*/
		var IDENTIFIER_LINE = /^(?:[A-Za-z]{1,4}[-_]?)?\d{5,}(?:[-_]\d{1,3})?$/;
		/**
		* The same identifier where a line *starts* with one and then says something.
		*
		* A table cell order puts the number and the name on one line — `<td>T202611024092-1</td>
		* <td>「开发」…</td>` reads as `T202611024092-1「开发」…` — so the number is a prefix of the
		* prose rather than a line of its own, and a rule about whole lines could not see it. The
		* separator is optional because the cells run together with no space between them.
		*/
		var IDENTIFIER_PREFIX = /^(?:[A-Za-z]{1,4}[-_]?)?\d{5,}(?:[-_]\d{1,3})?[\s:：]*/u;
		var BLOCK_BOUNDARY = /<\/(p|h[1-6]|div|li|td|th|tr|blockquote|pre|ul|ol|table|section|article|header|footer)>/gi;
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
				const said = part.replace(IDENTIFIER_PREFIX, "");
				if (said !== "") candidates.push(said);
				else if (part !== "") candidates.push(part);
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
				...runtime.openFile === void 0 ? {} : { openFile: runtime.openFile },
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
		function ShadowHtml({ html, className, onAction, cardId, runId, openFile, documents }) {
			const host = (0, react.useRef)(null);
			(0, react.useEffect)(() => {
				const element = host.current;
				if (element === null) return;
				renderTemplate(element.shadowRoot ?? element.attachShadow({ mode: "open" }), html, cardId === void 0 || documents === void 0 ? void 0 : {
					cardId,
					...runId === void 0 ? {} : { runId },
					...openFile === void 0 ? {} : { openFile },
					bind: documents
				});
			}, [
				html,
				cardId,
				runId,
				openFile,
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
		* @param ask - what else travels with the run: the clicked row, the instruction the user
		* wrote for it, and the directory this one invocation happens in. All optional and
		* independent — a run may act on a row, on a sentence, on both, or on neither, and it
		* happens in the card's own directory unless one is named.
		* @returns the accepted run state, or the Host's own refusal.
		*/
		async function startCardRun(api, cardId, scopeSessionId, ask = {}) {
			const { payload, instruction, workspace } = ask;
			const trimmed = instruction?.trim();
			return await api.start({
				cardId,
				...scopeSessionId === void 0 ? {} : { scopeSessionId },
				mode: { kind: "card" },
				...payload === void 0 ? {} : { payload },
				...trimmed === void 0 || trimmed === "" ? {} : { instruction: trimmed },
				...workspace === void 0 ? {} : { workspace },
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
		var POLL_INTERVAL_MS$1 = 1e3;
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
			const [workspaceTypedProblem, setWorkspaceTypedProblem] = (0, react.useState)(void 0);
			const [actionWorkspaceProblem, setActionWorkspaceProblem] = (0, react.useState)(void 0);
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
				}, POLL_INTERVAL_MS$1);
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
				}, POLL_INTERVAL_MS$1);
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
			/**
			* Store one confirmed directory as this card's workspace.
			* @param path - the directory, already checked.
			*/
			const writeWorkspace = (0, react.useCallback)((path) => {
				setWorkspaceTypedProblem(void 0);
				const send = (baseRevision) => {
					api.write({
						baseRevision,
						cardId,
						workspace: { path }
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
					writeWorkspace(picked.path);
				});
			}, [workspacePicker, writeWorkspace]);
			const setWorkspace = (0, react.useCallback)((path) => {
				const trimmed = path.trim();
				if (!isWorkbenchWorkspacePath(trimmed)) {
					setWorkspaceTypedProblem("invalid-path");
					return;
				}
				setWorkspaceTypedProblem(void 0);
				api.statDirectory(trimmed).then((outcome) => {
					if (outcome.status !== "ok") {
						setProblem({
							code: "unavailable",
							detail: outcome.reason
						});
						return;
					}
					if (!outcome.stat.exists || !outcome.stat.isDirectory) {
						setWorkspaceTypedProblem("not-directory");
						return;
					}
					writeWorkspace(trimmed);
				});
			}, [api, writeWorkspace]);
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
				const proposed = workspaceField.kind === "ready" ? workspaceField.path : runnerCard?.workspace?.path;
				if (proposed === void 0) {
					setPendingAction(void 0);
					setActionProblem({
						code: "target-workspace-missing",
						candidates: []
					});
					return;
				}
				const stat = await api.statDirectory(proposed);
				const field = resolveWorkspaceField({ path: proposed }, stat.status === "ok" ? stat.stat : NO_DIRECTORY_STAT);
				if (field.kind !== "ready") {
					setPendingAction(void 0);
					setActionProblem({
						code: "target-workspace-invalid",
						candidates: [],
						detail: proposed
					});
					return;
				}
				setActionWorkspaceProblem(void 0);
				setPendingAction({
					key: resolution.key,
					target: resolution.target,
					reference: resolution.reference,
					skill,
					payload: resolution.payload,
					workspace: field.path
				});
			}, [
				api,
				cardId,
				cardTitle,
				session,
				workspaceField
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
					startCardRun(api, pending.reference, session(), {
						payload: pending.payload,
						workspace: pending.workspace
					}).then((outcome) => {
						if (outcome.status !== "ok") {
							setActionProblem(startProblem(outcome));
							return;
						}
						openCard?.(pending.reference, "result");
					});
					return;
				}
				api.start({
					cardId,
					mode: {
						kind: "bare",
						skill: pending.skill
					},
					payload: pending.payload,
					workspace: pending.workspace
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
			/**
			* Change the directory this one invocation will happen in.
			*
			* The same two checks the card's own field makes, for the same reason and with one
			* difference: this path is not stored anywhere. A refused one therefore leaves the card
			* exactly as it was and the panel still open on what it showed, which is all a directory
			* that belongs to no record can be refused with.
			* @param path - the directory as typed into the panel.
			*/
			const setActionWorkspace = (0, react.useCallback)((path) => {
				const trimmed = path.trim();
				if (!isWorkbenchWorkspacePath(trimmed)) {
					setActionWorkspaceProblem("invalid-path");
					return;
				}
				setActionWorkspaceProblem(void 0);
				api.statDirectory(trimmed).then((outcome) => {
					if (outcome.status !== "ok") {
						setProblem({
							code: "unavailable",
							detail: outcome.reason
						});
						return;
					}
					if (!outcome.stat.exists || !outcome.stat.isDirectory) {
						setActionWorkspaceProblem("not-directory");
						return;
					}
					setPendingAction((current) => current === void 0 ? current : {
						...current,
						workspace: trimmed
					});
				});
			}, [api]);
			const cancelAction = (0, react.useCallback)(() => {
				setPendingAction(void 0);
				setActionWorkspaceProblem(void 0);
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
				setWorkspace,
				choosePermission,
				chooseInstructionMode,
				saveTemplate,
				rename,
				remove,
				click,
				confirmAction,
				cancelAction,
				setActionWorkspace
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
				setWorkspace,
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
					runnable: runUnavailable === void 0 && card?.skill !== void 0 && card.template !== void 0 && modelField.kind !== "unavailable",
					modelField,
					workspaceField,
					permission: effectiveWorkbenchSandboxMode(card?.permission),
					instructionMode: effectiveWorkbenchInstructionMode(card?.instructionMode),
					recentInstructions,
					canChooseWorkspace,
					workspaceTypedProblem,
					actionWorkspaceProblem,
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
					workspaceTypedProblem,
					actionWorkspaceProblem,
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
		//#endregion
		//#region src/client/skill-card/class-names.ts
		/**
		* One element's class names, joined.
		*
		* The CSS module is typed as an index signature, so every lookup may be undefined; dropping
		* the absent ones keeps a literal `undefined` out of the DOM. Shared rather than written per
		* module: the workspace value, the gutter line, and the document's own frame all dress one
		* element in a base class and a conditional one, and three copies of this are three places
		* for the filter to be forgotten.
		* @param names - candidate class names.
		* @returns the class attribute value.
		*/
		function classes(...names) {
			return names.filter((name) => name !== void 0).join(" ");
		}
		var skill_card_module_default = {
			template: "_template_1865q_4",
			body: "_body_1865q_8",
			cardActions: "_cardActions_1865q_17",
			faceBody: "_faceBody_1865q_44",
			faceSummary: "_faceSummary_1865q_55",
			faceProblem: "_faceProblem_1865q_81",
			faceFoot: "_faceFoot_1865q_96",
			pageView: "_pageView_1865q_107",
			pageHead: "_pageHead_1865q_125",
			pageHeadBar: "_pageHeadBar_1865q_143",
			pageHeadTitle: "_pageHeadTitle_1865q_151",
			pageHeadMeta: "_pageHeadMeta_1865q_166",
			pageHeadChip: "_pageHeadChip_1865q_188",
			runProblem: "_runProblem_1865q_206",
			runTraceList: "_runTraceList_1865q_232",
			activityList: "_activityList_1865q_238",
			activityItem: "_activityItem_1865q_247",
			activityToolRow: "_activityToolRow_1865q_253",
			activityRow: "_activityRow_1865q_259",
			activityTitle: "_activityTitle_1865q_263",
			activitySep: "_activitySep_1865q_269",
			activitySummary: "_activitySummary_1865q_279",
			activityBody: "_activityBody_1865q_290",
			activityBodyLabel: "_activityBodyLabel_1865q_298",
			activityBodyText: "_activityBodyText_1865q_304",
			activityReasoning: "_activityReasoning_1865q_314",
			activityNarration: "_activityNarration_1865q_320",
			activityTruncated: "_activityTruncated_1865q_330",
			turnProcess: "_turnProcess_1865q_346",
			turnProcessDot: "_turnProcessDot_1865q_373",
			turnProcessLabel: "_turnProcessLabel_1865q_385",
			turnProcessSteps: "_turnProcessSteps_1865q_395",
			turnProcessChevron: "_turnProcessChevron_1865q_404",
			resultSurface: "_resultSurface_1865q_431",
			resultEditor: "_resultEditor_1865q_443",
			actBlock: "_actBlock_1865q_459",
			actRow: "_actRow_1865q_466",
			actAction: "_actAction_1865q_483",
			dialogOverlay: "_dialogOverlay_1865q_525",
			dialogPanel: "_dialogPanel_1865q_536",
			dialogHead: "_dialogHead_1865q_566",
			dialogTitle: "_dialogTitle_1865q_573",
			dialogClose: "_dialogClose_1865q_583",
			dialogHint: "_dialogHint_1865q_609",
			dialogProblem: "_dialogProblem_1865q_620",
			dialogField: "_dialogField_1865q_630",
			dialogFoot: "_dialogFoot_1865q_663",
			runWorkspace: "_runWorkspace_1865q_673",
			runWorkspaceLine: "_runWorkspaceLine_1865q_691",
			runWorkspaceLineLabel: "_runWorkspaceLineLabel_1865q_699",
			runWorkspaceLinePath: "_runWorkspaceLinePath_1865q_703",
			runChips: "_runChips_1865q_717",
			runChipsLabel: "_runChipsLabel_1865q_725",
			runChip: "_runChip_1865q_717",
			composerProblem: "_composerProblem_1865q_759",
			refineLog: "_refineLog_1865q_767",
			refineLogHead: "_refineLogHead_1865q_775",
			refineLogTitle: "_refineLogTitle_1865q_782",
			refineLogList: "_refineLogList_1865q_792",
			refineLogItem: "_refineLogItem_1865q_804",
			refineLogInstruction: "_refineLogInstruction_1865q_809",
			refineLogTime: "_refineLogTime_1865q_814",
			refineLogNote: "_refineLogNote_1865q_823",
			notice: "_notice_1865q_830",
			noticeTitle: "_noticeTitle_1865q_837",
			noticeBody: "_noticeBody_1865q_844",
			settings: "_settings_1865q_853",
			section: "_section_1865q_862",
			sectionHead: "_sectionHead_1865q_874",
			sectionTools: "_sectionTools_1865q_882",
			sectionTitle: "_sectionTitle_1865q_900",
			fieldGrid: "_fieldGrid_1865q_912",
			field: "_field_1865q_912",
			fieldValue: "_fieldValue_1865q_937",
			fieldLabel: "_fieldLabel_1865q_954",
			workspaceRow: "_workspaceRow_1865q_962",
			workspaceValue: "_workspaceValue_1865q_976",
			workspaceValueInvalid: "_workspaceValueInvalid_1865q_995",
			workspaceInput: "_workspaceInput_1865q_1002",
			workspaceInputInvalid: "_workspaceInputInvalid_1865q_1022",
			workspaceLeaf: "_workspaceLeaf_1865q_1030",
			workspacePath: "_workspacePath_1865q_1042",
			fieldNote: "_fieldNote_1865q_1056",
			select: "_select_1865q_1066",
			editor: "_editor_1865q_1067",
			editorStatus: "_editorStatus_1865q_1101",
			editorStatusDirty: "_editorStatusDirty_1865q_1117",
			editorStatusMissing: "_editorStatusMissing_1865q_1124",
			editorStatusWarn: "_editorStatusWarn_1865q_1129",
			foldView: "_foldView_1865q_1136",
			foldRow: "_foldRow_1865q_1150",
			foldNumber: "_foldNumber_1865q_1170",
			foldCaret: "_foldCaret_1865q_1171",
			foldText: "_foldText_1865q_1172",
			foldCaretBlank: "_foldCaretBlank_1865q_1193",
			foldCount: "_foldCount_1865q_1212",
			editorPane: "_editorPane_1865q_1229",
			gutter: "_gutter_1865q_1243",
			gutterLine: "_gutterLine_1865q_1263",
			gutterLineRegion: "_gutterLineRegion_1865q_1283",
			gutterLineActions: "_gutterLineActions_1865q_1291",
			violations: "_violations_1865q_1336",
			violationJump: "_violationJump_1865q_1346",
			previewFrame: "_previewFrame_1865q_1367",
			preview: "_preview_1865q_1367",
			settingsActions: "_settingsActions_1865q_1395",
			actionBuilder: "_actionBuilder_1865q_1402",
			builderRow: "_builderRow_1865q_1413",
			builderField: "_builderField_1865q_1420",
			hint: "_hint_1865q_1430",
			hintError: "_hintError_1865q_1437",
			configFooter: "_configFooter_1865q_1449",
			footerHint: "_footerHint_1865q_1467",
			footerActions: "_footerActions_1865q_1474",
			footerSpacer: "_footerSpacer_1865q_1480",
			deletePrompt: "_deletePrompt_1865q_1485",
			deleteCard: "_deleteCard_1865q_1493",
			writeFailure: "_writeFailure_1865q_1503",
			actionPanel: "_actionPanel_1865q_1513",
			actionFacts: "_actionFacts_1865q_1522",
			actionPayload: "_actionPayload_1865q_1548",
			bareRun: "_bareRun_1865q_1564",
			runsHeadText: "_runsHeadText_1865q_1584",
			runsHeadTitle: "_runsHeadTitle_1865q_1592",
			runsHeadMeta: "_runsHeadMeta_1865q_1600",
			runHistoryCount: "_runHistoryCount_1865q_1609",
			runHistoryEmpty: "_runHistoryEmpty_1865q_1616",
			runHistoryList: "_runHistoryList_1865q_1627",
			runHistoryGroup: "_runHistoryGroup_1865q_1634",
			runHistoryDay: "_runHistoryDay_1865q_1647",
			runHistoryItems: "_runHistoryItems_1865q_1661",
			runHistoryItem: "_runHistoryItem_1865q_1661",
			runHistoryRow: "_runHistoryRow_1865q_1680",
			runHistoryOpen: "_runHistoryOpen_1865q_1695",
			runHistoryStop: "_runHistoryStop_1865q_1747",
			runHistoryBody: "_runHistoryBody_1865q_1766",
			runHistoryTitle: "_runHistoryTitle_1865q_1776",
			runHistoryMeta: "_runHistoryMeta_1865q_1797",
			runHistoryTime: "_runHistoryTime_1865q_1818",
			runHistoryModel: "_runHistoryModel_1865q_1825",
			runHistoryOrdinal: "_runHistoryOrdinal_1865q_1835",
			runHistoryEdited: "_runHistoryEdited_1865q_1836",
			runHistoryInstruction: "_runHistoryInstruction_1865q_1845",
			runHistorySide: "_runHistorySide_1865q_1856",
			runHistoryOutcome: "_runHistoryOutcome_1865q_1868",
			runHistoryDot: "_runHistoryDot_1865q_1880",
			runHistoryPulse: "_runHistoryPulse_1865q_1",
			runHistoryChevron: "_runHistoryChevron_1865q_1918"
		};
		//#endregion
		//#region src/client/skill-card/WorkspaceField.tsx
		/**
		* The directory something runs in, and the two ways of naming it.
		*
		* A picker when the build ships one, a field when it does not. Both are in one component
		* because the question is one question: the configuration page, the run dialog and the
		* confirmation panel all ask it, and a card that could pick a directory on one screen and
		* only read it on the other would be the bug this file exists to prevent — a card whose
		* folder is wrong, and no way to say otherwise on the screen where the run is pressed.
		*
		* A typed path is not the unconfirmed path this feature refused earlier: the Host is asked
		* whether it is a directory before anything is stored, the same check a run is gated on, so a
		* typo is answered rather than persisted.
		* @module dsh-workbench/client/skill-card/WorkspaceField
		*/
		/** The sentence for a typed path that was not taken. */
		var TYPED_PROBLEMS = {
			"invalid-path": "skillCardWorkspaceTypedInvalid",
			"not-directory": "skillCardWorkspaceTypedMissing"
		};
		/**
		* The field that takes a typed path, with its own answer to a path it did not take.
		*
		* Shared rather than written twice: the card's own directory and an invocation's directory are
		* asked the same way, refused for the same reasons, and should say so in the same words. What
		* differs is only where a confirmed path goes — the card's record, or this one run.
		* @param props - the resting value, the field's state, the note to show, and the commit.
		* @returns the input, its button, and the sentence explaining a refusal.
		*/
		function WorkspacePathField({ value, fieldKind, problem, t, onCommit }) {
			const [typed, setTyped] = (0, react.useState)(value);
			(0, react.useEffect)(() => {
				setTyped(value);
			}, [value]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: skill_card_module_default.workspaceRow,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
					type: "text",
					className: classes(skill_card_module_default.workspaceInput, fieldKind === "invalid" || problem !== void 0 ? skill_card_module_default.workspaceInputInvalid : void 0),
					value: typed,
					spellCheck: false,
					autoComplete: "off",
					placeholder: t("skillCardWorkspacePathPlaceholder"),
					"aria-label": t("skillCardWorkspace"),
					"data-workspace-field": fieldKind,
					"data-workspace-input": "",
					onChange: (event) => {
						setTyped(event.target.value);
					},
					onKeyDown: (event) => {
						if (event.key !== "Enter") return;
						event.preventDefault();
						onCommit(typed);
					}
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
					variant: "ghost",
					size: "sm",
					"data-workspace-apply": "",
					onClick: () => {
						onCommit(typed);
					},
					children: t("skillCardWorkspaceApply")
				})]
			}), problem === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				className: skill_card_module_default.fieldNote,
				"data-workspace-typed-problem": problem,
				children: t(TYPED_PROBLEMS[problem])
			})] });
		}
		/**
		* Render the card's directory field.
		* @param props - the card view, the translator, and the two ways of naming a directory.
		* @returns the field.
		*/
		function WorkspaceField({ view, t, onChooseWorkspace, onSetWorkspace }) {
			const field = view.workspaceField;
			const stored = field.kind === "missing" ? "" : field.path;
			const problem = view.workspaceTypedProblem;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
					className: skill_card_module_default.fieldLabel,
					children: t("skillCardWorkspace")
				}),
				view.canChooseWorkspace ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: skill_card_module_default.workspaceRow,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: classes(skill_card_module_default.workspaceValue, field.kind === "invalid" || problem !== void 0 ? skill_card_module_default.workspaceValueInvalid : void 0),
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
						onClick: onChooseWorkspace,
						"data-workspace-pick": "",
						children: t("skillCardChooseDirectory")
					})]
				}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(WorkspacePathField, {
					value: stored,
					fieldKind: field.kind,
					problem,
					t,
					onCommit: onSetWorkspace
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
		//#endregion
		//#region src/client/skill-card/Dialog.tsx
		/**
		* The product has no dialog primitive, so the one this plugin needs is here: a panel
		* portalled to `document.body` rather than rendered in place, because a page lives inside
		* whatever scroll container and stacking context the shell gave its slot, and a
		* `position: fixed` element inside a transformed ancestor is positioned against that
		* ancestor instead of the window.
		*
		* What a dialog owes the keyboard is not decoration: Escape closes it, Tab stays inside it,
		* opening it moves focus in, and closing it returns focus to the control that opened it. The
		* backdrop closes on a click, and only on the backdrop itself — a mousedown that started
		* inside the panel and ended on the overlay is a select-drag, not a dismissal.
		*
		* Two panels are built on it: the form that writes a sentence (`PromptDialog`) and the
		* preview that shows a card's template (`TemplatePreviewDialog`). They differ in width and
		* in what sits under the body, so the shell keeps only what the keyboard contract needs.
		* @module dsh-workbench/client/skill-card/Dialog
		*/
		/**
		* Render the dialog over the page.
		* @param props - the copy, the size, the way out, and the body.
		* @returns the dialog, portalled to the document body.
		*/
		function Dialog({ title, hint, closeLabel, size = "form", busy = false, footer, onClose, children }) {
			const titleId = (0, react.useId)();
			const hintId = (0, react.useId)();
			const panel = (0, react.useRef)(null);
			(0, react.useEffect)(() => {
				const onKeyDown = (event) => {
					if (event.key !== "Escape") return;
					event.preventDefault();
					event.stopPropagation();
					onClose();
				};
				document.addEventListener("keydown", onKeyDown, true);
				return () => {
					document.removeEventListener("keydown", onKeyDown, true);
				};
			}, [onClose]);
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
					if (event.target === event.currentTarget) onClose();
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
					"data-dialog-size": size,
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
								onClick: onClose,
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCloseOutlineMedium, { size: 16 })
							})]
						}),
						hint === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: skill_card_module_default.dialogHint,
							id: hintId,
							children: hint
						}),
						children,
						footer === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: skill_card_module_default.dialogFoot,
							children: footer
						})
					]
				})
			}), document.body);
		}
		//#endregion
		//#region src/client/skill-card/PromptDialog.tsx
		/**
		* A modal form, over the whole window, for the sentences a card or a result is changed with:
		* one line saying what submitting will do, the field, and the two ways out.
		*
		* The shell — the portal, the overlay, Escape, the Tab trap, and focus going back to the
		* control that opened it — is {@link Dialog}'s. This file is the form: the two buttons, and
		* the refusal that appears under the field when the Host would not take what was written.
		* @module dsh-workbench/client/skill-card/PromptDialog
		*/
		/**
		* Render the dialog over the page.
		* @param props - the copy, the two ways out, and the form.
		* @returns the dialog, portalled to the document body.
		*/
		function PromptDialog({ title, hint, submitLabel, submitDisabled = false, cancelLabel, closeLabel, problem, busy = false, focusSubmit = false, onCancel, onSubmit, children }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(Dialog, {
				title,
				hint,
				closeLabel,
				busy,
				onClose: onCancel,
				footer: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
					variant: "ghost",
					size: "md",
					onClick: onCancel,
					children: cancelLabel
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
					variant: "primary",
					size: "md",
					disabled: submitDisabled || busy,
					"data-prompt-submit": "",
					...focusSubmit ? { "data-prompt-focus": "" } : {},
					onClick: onSubmit,
					children: submitLabel
				})] }),
				children: [children, problem === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
					className: skill_card_module_default.dialogProblem,
					role: "alert",
					"data-prompt-problem": "",
					children: problem
				})]
			});
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
		* The dialog a run is started from.
		*
		* Every run opens it now, whatever the card's instruction mode: the sentence was the reason
		* it existed, and the directory is the second — where a run happens is the one precondition a
		* user can answer at the moment of pressing 运行, so it is asked here rather than being a
		* check that closes the control from a distance. A card that needs no instruction gets the
		* same dialog without a field: the directory, then 运行.
		*
		* The directory shown is the card's own, so a user who is happy with it presses 运行 without
		* touching anything. Picking another one writes it to the card's configuration through the
		* same path the 配置 page uses — a run in a directory the card does not name would leave the
		* result's own reading of "where this happened" wrong.
		* @param props - the card, its view, the mode, the recent asks, and the two ways out.
		* @returns the dialog.
		*/
		function RunPrompt({ cardId, title, view, mode, recent, t, onChooseWorkspace, onSetWorkspace, onRun, onCancel }) {
			const [text, setText] = (0, react.useState)(() => readDraft(cardId));
			const [refused, setRefused] = (0, react.useState)(false);
			const empty = text.trim() === "";
			const asks = mode !== "none";
			const ready = view.workspaceField.kind === "ready";
			const submit = () => {
				if (!ready) return;
				if (empty && mode === "required") {
					setRefused(true);
					return;
				}
				setText("");
				writeDraft(cardId, "");
				if (!asks) {
					onRun();
					return;
				}
				onRun(empty ? "" : text);
			};
			const field = view.workspaceField;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(PromptDialog, {
				title,
				hint: t("promptFreshHint"),
				submitLabel: t("skillCardRun"),
				cancelLabel: t("skillCardCancel"),
				closeLabel: t("promptClose"),
				problem: refused ? t("runInstructionRequired") : void 0,
				busy: !ready,
				focusSubmit: !asks,
				onCancel,
				onSubmit: submit,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: skill_card_module_default.runWorkspace,
					"data-dialog-workspace": "",
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(WorkspaceField, {
						view,
						t,
						onChooseWorkspace,
						onSetWorkspace
					}), field.kind === "missing" && view.canChooseWorkspace ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: skill_card_module_default.fieldNote,
						"data-dialog-workspace-missing": "",
						children: t("skillCardProblemWorkspaceMissing")
					}) : null]
				}), asks ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(InstructionField, {
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
				})] }) : null]
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
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)(_deepseek_ai_dsh_client_ui_primitives.Button, {
				variant: "ghost",
				size: "sm",
				"data-card-run": "start",
				disabled,
				onClick: () => {
					setAsking(true);
				},
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconPlayOutlineRegular, { size: 14 }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("skillCardRun") })]
			}), asking ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(RunPrompt, {
				cardId,
				title: t("runPromptTitle"),
				view,
				mode: view.instructionMode,
				recent: view.recentInstructions,
				t,
				onChooseWorkspace: () => {
					actions.chooseWorkspace();
				},
				onSetWorkspace: (path) => {
					actions.setWorkspace(path);
				},
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
			const runProblem = runProblemOf(view);
			const bodySlot = (0, react.useMemo)(() => () => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: skill_card_module_default.faceBody,
				"data-face-blocked": runProblem === void 0 ? void 0 : "",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: skill_card_module_default.faceSummary,
						"data-face-summary": headline === void 0 ? "empty" : "text",
						children: headline ?? t("skillCardNotRunBody")
					}),
					runProblem === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("p", {
						className: skill_card_module_default.faceProblem,
						"data-face-problem": runProblem.code,
						children: [t(problemKey(runProblem.code)), runProblem.detail === void 0 ? "" : ` · ${runProblem.detail}`]
					}),
					latest === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: skill_card_module_default.faceFoot,
						children: t("runHistoryCount", { count: view.runs.length })
					})
				]
			}), [
				headline,
				latest,
				runProblem,
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
		function SkillCardBody({ view, cardId, t, onAction, documents, openFile }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: skill_card_module_default.body,
				children: cardContent(view, cardId, t, onAction, documents, openFile)
			});
		}
		/**
		* Render whichever content the card currently has.
		* @param view - the card view.
		* @param cardId - the card the body belongs to.
		* @param t - translator.
		* @param onAction - click outlet for buttons the document carries.
		* @param documents - binding factory for the rendered document's own script.
		* @param openFile - the file the app asked the document to open on.
		* @returns the content element.
		*/
		function cardContent(view, cardId, t, onAction, documents, openFile) {
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
				openFile,
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
		* Every reason this card cannot start a run, in the order a user fixes them.
		*
		* The list is the single answer to "why is 运行 grey": the run pages print all of it, and a
		* card face has room for the first line only. Written once because the two places used to
		* carry their own copies of the four conditions, and a face that named a different reason
		* from the page under it would be worse than no sentence at all.
		*
		* The precedence is deliberate and it is the reason the list is written once: the directory
		* is this card's own fact and the one a sentence can point at ("that path is not there"), so
		* it is named first; a card with no model at all is the broader fact and is named after it;
		* and a harness without an activation seam is the one thing the user cannot fix from this
		* page, so it comes last. A face that said "no model is available" over a card whose folder
		* had been copied from another machine would send its reader to the wrong setting.
		* @param view - what the card currently shows.
		* @returns the reasons, most important first; empty when the control is open.
		*/
		function runProblemsOf(view) {
			const problems = [];
			if (view.workspaceField.kind === "missing") problems.push({ code: "workspace-missing" });
			if (view.workspaceField.kind === "invalid" && view.workspaceField.checked) problems.push({
				code: "workspace-invalid",
				detail: view.workspaceField.path
			});
			if (view.modelField.kind === "unavailable") problems.push({ code: "model-unavailable" });
			if (view.runUnavailable !== void 0) problems.push({ code: view.runUnavailable.code });
			return problems;
		}
		/**
		* The first of {@link runProblemsOf}, for a face with room for one line.
		* @param view - what the card currently shows.
		* @returns the reason to name, or undefined when the card can run.
		*/
		function runProblemOf(view) {
			return runProblemsOf(view)[0];
		}
		/**
		* Render the reasons a run cannot start, each under the control it explains.
		* @param props - the card's view and the translator.
		* @param props.view - what the card currently shows.
		* @param props.t - translator.
		* @returns the sentences, or nothing when the control is open.
		*/
		function RunProblemLines({ view, t }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
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
				view.modelField.kind === "unavailable" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
					className: skill_card_module_default.runProblem,
					"data-run-model-unavailable": "",
					children: t("skillCardModelUnavailable")
				}) : null,
				view.runUnavailable === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
					className: skill_card_module_default.runProblem,
					"data-run-unavailable": "",
					children: t(problemKey(view.runUnavailable.code))
				})
			] });
		}
		/**
		* State the directory a result was produced in.
		*
		* The one run fact that is neither in the document nor in the run record: a result says what
		* the skill produced, the history says when and for how long, and neither says *where*. It
		* matters most exactly when it is least obvious — a card whose folder was changed, or copied
		* from another machine — so it is printed as the full path rather than the folder's name, and
		* it is printed from the card, which is where the run dialog writes the answer.
		* @param props - the card's view and the translator.
		* @param props.view - what the card currently shows.
		* @param props.t - translator.
		* @returns the line, or nothing for a card that has no directory to name.
		*/
		function RunWorkspaceLine({ view, t }) {
			const field = view.workspaceField;
			const own = view.result?.workspace;
			const kind = own === void 0 ? field.kind : "ready";
			const text = own ?? (field.kind === "missing" ? t("skillCardWorkspaceNotSet") : field.path);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
				className: skill_card_module_default.runWorkspaceLine,
				"data-run-workspace-line": kind,
				"data-run-workspace-own": own === void 0 ? void 0 : "true",
				title: kind === "missing" ? void 0 : text,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: skill_card_module_default.runWorkspaceLineLabel,
					children: t("skillCardWorkspace")
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: skill_card_module_default.runWorkspaceLinePath,
					children: text
				})]
			});
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
		//#region src/client/pipeline-controller.ts
		/**
		* The pipeline definitions the workbench page arranges, and the mutations it offers.
		*
		* The controller owns one snapshot and one revision, and every mutation is expressed as
		* "the complete set I would like to store". That is the route's shape, and it keeps the
		* awkward part of concurrent writes in one place: the revision a write was based on.
		*
		* Mutations are queued rather than fired in parallel. Two edits racing would both build
		* their next set from the same snapshot, so the second would silently undo the first —
		* the queue makes each one see the state the one before it committed.
		* @module dsh-workbench/client/pipeline-controller
		*/
		/** Where a user-created pipeline id starts. */
		var PIPELINE_ID_BASE = "pipeline";
		/**
		* Choose an unused pipeline id.
		* @param taken - ids already in use.
		* @returns the first free `pipeline-N`.
		*/
		function nextPipelineId(taken) {
			let index = 1;
			while (taken.has(`${PIPELINE_ID_BASE}-${String(index)}`)) index += 1;
			return `${PIPELINE_ID_BASE}-${String(index)}`;
		}
		/**
		* Trim a name and clamp it to the contract's length.
		* @param name - the name as typed.
		* @returns the name as it may be stored; empty when nothing is left.
		*/
		function clampPipelineName(name) {
			return name.trim().slice(0, 60);
		}
		/**
		* Read and mutate the stored pipelines.
		* @param api - pipeline transport.
		* @returns the current state plus the mutations.
		*/
		function usePipelines(api) {
			const [state, setState] = (0, react.useState)({
				phase: "loading",
				pipelines: []
			});
			const tail = (0, react.useRef)(Promise.resolve());
			const newest = (0, react.useRef)(void 0);
			const tickets = (0, react.useRef)(0);
			const apply = (0, react.useCallback)((snapshot, notice) => {
				tickets.current += 1;
				newest.current = snapshot;
				setState({
					phase: "ready",
					pipelines: snapshot.pipelines,
					...notice === void 0 ? {} : { notice }
				});
			}, []);
			const reload = (0, react.useCallback)(() => {
				tickets.current += 1;
				const mine = tickets.current;
				api.read().then((result) => {
					if (result.status !== "ok") {
						if (tickets.current !== mine) return;
						setState({
							phase: "unavailable",
							pipelines: [],
							reason: result.reason
						});
						return;
					}
					if (tickets.current !== mine) return;
					apply(result.snapshot);
				});
			}, [api, apply]);
			(0, react.useEffect)(() => {
				reload();
			}, [reload]);
			const mutate = (0, react.useCallback)(async (change) => {
				let written = false;
				const task = tail.current.then(async () => {
					for (let attempt = 0; attempt < 2; attempt += 1) {
						const snapshot = newest.current;
						if (snapshot === void 0) return;
						const next = change(snapshot.pipelines);
						if (next === void 0) return;
						const result = await api.write({
							baseRevision: snapshot.revision,
							pipelines: next
						});
						if (result.status === "failed") {
							setState((current) => ({
								...current,
								notice: result.reason
							}));
							return;
						}
						if (result.status === "conflict" && attempt === 0) {
							apply(result.snapshot);
							continue;
						}
						apply(result.snapshot, result.status === "conflict" ? "conflict" : void 0);
						written = result.status === "ok";
						return;
					}
				});
				tail.current = task.catch(() => void 0);
				await task.catch(() => void 0);
				return written;
			}, [api, apply]);
			const create = (0, react.useCallback)(async (name) => {
				const taken = new Set((newest.current?.pipelines ?? []).map((pipeline) => pipeline.id));
				if (taken.size >= 64) return void 0;
				const id = nextPipelineId(taken);
				const trimmed = clampPipelineName(name);
				await mutate((current) => [...current, {
					id,
					name: trimmed.length === 0 ? id : trimmed,
					steps: [],
					updatedAt: Date.now()
				}]);
				return id;
			}, [mutate]);
			const rename = (0, react.useCallback)(async (id, name) => {
				const trimmed = clampPipelineName(name);
				if (trimmed.length === 0) return;
				await mutate((current) => current.map((pipeline) => pipeline.id === id ? {
					...pipeline,
					name: trimmed,
					updatedAt: Date.now()
				} : pipeline));
			}, [mutate]);
			const remove = (0, react.useCallback)(async (id) => {
				await mutate((current) => current.filter((pipeline) => pipeline.id !== id));
			}, [mutate]);
			const setSteps = (0, react.useCallback)(async (id, steps) => await mutate((current) => current.map((pipeline) => pipeline.id === id ? {
				...pipeline,
				steps,
				updatedAt: Date.now()
			} : pipeline)), [mutate]);
			return {
				...state,
				create,
				rename,
				remove,
				setSteps,
				reload
			};
		}
		//#endregion
		//#region src/client/pipeline/pipeline-run.ts
		/**
		* Running a pipeline: one step at a time, one session for the whole chain.
		*
		* The sequencing lives in {@link runSteps}, which knows nothing about React or transport
		* seams beyond the two functions it is handed. That is deliberate: the rule that matters
		* — a step's session is the one the step before it settled in, and a chain stops at the
		* first step that does not settle — is testable without a component or a server.
		*
		* The chain stops rather than continues on failure. A step that failed produced no
		* result for the next one to read, and a pipeline that ran on would be answering with
		* whatever the previous conversation happened to contain.
		* @module dsh-workbench/client/pipeline/pipeline-run
		*/
		/**
		* Run one contiguous slice of a pipeline's steps.
		*
		* The session travels forward through this function, not through the caller: a step is
		* started in the session the step before it settled in, and nothing else decides that.
		* @param steps - the complete step list.
		* @param from - first step index to run.
		* @param to - last step index to run.
		* @param seams - the start, settle, report, clock and cancellation seams.
		* @returns how the chain ended, with every step's state.
		*/
		async function runSteps(steps, from, to, seams) {
			const outcomes = steps.map((_unused, index) => index < from || index > to ? { phase: "idle" } : { phase: "queued" });
			let sessionId = from > 0 ? seams.resume : void 0;
			/** The chain as it stands, with the session the last settled step used. */
			const ended = (phase) => ({
				phase,
				steps: outcomes,
				...sessionId === void 0 ? {} : { sessionId }
			});
			for (let index = from; index <= to; index += 1) {
				const step = steps[index];
				if (step === void 0) continue;
				if (seams.signal.aborted) return ended("stopped");
				const startedAt = seams.now();
				outcomes[index] = {
					phase: "running",
					startedAt
				};
				seams.onStep(index, outcomes[index]);
				const started = await seams.start(index, step, {
					...sessionId === void 0 ? {} : { sessionId },
					terminal: index === to,
					...step.instruction === void 0 ? {} : { instruction: step.instruction }
				});
				if (started.status === "refused") {
					const failed = {
						phase: "failed",
						startedAt,
						tookMs: seams.now() - startedAt,
						failure: started.reason
					};
					outcomes[index] = failed;
					seams.onStep(index, failed);
					return {
						...ended("failed"),
						failureIndex: index,
						failure: started.reason
					};
				}
				const settled = await seams.settle(step.cardId, started.runId, seams.signal);
				const tookMs = seams.now() - startedAt;
				const runId = started.runId === void 0 ? {} : { runId: started.runId };
				if (seams.signal.aborted || settled.phase === "cancelled") {
					const stopped = {
						phase: "stopped",
						startedAt,
						tookMs,
						...runId
					};
					outcomes[index] = stopped;
					seams.onStep(index, stopped);
					return ended("stopped");
				}
				if (settled.phase === "failed" || settled.failure !== void 0) {
					const reason = settled.failure ?? "the run failed";
					const failed = {
						phase: "failed",
						startedAt,
						tookMs,
						failure: reason,
						...runId
					};
					outcomes[index] = failed;
					seams.onStep(index, failed);
					return {
						...ended("failed"),
						failureIndex: index,
						failure: reason
					};
				}
				sessionId = settled.sessionId ?? sessionId;
				const done = {
					phase: "done",
					startedAt,
					tookMs,
					...runId,
					...settled.sessionId === void 0 ? {} : { sessionId: settled.sessionId }
				};
				outcomes[index] = done;
				seams.onStep(index, done);
			}
			return ended("settled");
		}
		/** How many runs one pipeline keeps in this page, newest first. */
		var HISTORY_LIMIT = 20;
		/** What a pipeline with no runs answers. */
		var EMPTY_HISTORY = [];
		/** How often a running step is polled. */
		var POLL_INTERVAL_MS = 1200;
		/** How many reads a chain waits for a run id the card no longer reports. */
		var MISS_LIMIT = 3;
		/**
		* Drive one pipeline run from the page.
		* @param options - transport, scope session, and polling interval.
		* @returns the chain plus the three controls.
		*/
		function usePipelineRun(options) {
			const { api, scopeSessionId } = options;
			const pollIntervalMs = options.pollIntervalMs ?? POLL_INTERVAL_MS;
			const [chain, setChain] = (0, react.useState)(void 0);
			const [historyOf, setHistory] = (0, react.useState)({});
			const token = (0, react.useRef)(0);
			const abort = (0, react.useRef)(void 0);
			(0, react.useEffect)(() => () => {
				abort.current?.abort();
			}, []);
			/**
			* Record one finished run, with what each step left behind.
			*
			* The snapshot is read once, after the run, from the results the Host already stores: a
			* run's own record has no history behind it, and the reader needs the region as it was.
			* A read that fails still records the run — the step list is worth keeping even when the
			* products can no longer be shown.
			*/
			const finish = (0, react.useCallback)(async (pipeline, result, ask, from, startedAt) => {
				const products = /* @__PURE__ */ new Map();
				const read = await api.read();
				if (read.status === "ok") for (const stored of read.snapshot.results) {
					const html = htmlOf(stored.structured);
					if (html !== void 0 && !products.has(stored.cardId)) products.set(stored.cardId, html);
				}
				const steps = [];
				result.steps.forEach((outcome, index) => {
					if (outcome.phase === "idle") return;
					const cardId = pipeline.steps[index]?.cardId;
					if (cardId === void 0) return;
					const html = products.get(cardId);
					steps.push({
						cardId,
						phase: outcome.phase,
						...outcome.tookMs === void 0 ? {} : { tookMs: outcome.tookMs },
						...outcome.failure === void 0 ? {} : { failure: outcome.failure },
						...html === void 0 ? {} : { html }
					});
				});
				const entry = {
					no: 0,
					startedAt,
					tookMs: Date.now() - startedAt,
					phase: result.phase === "settled" ? "settled" : result.phase === "failed" ? "failed" : "stopped",
					scope: ask.scope,
					...ask.scope === "full" ? {} : { only: from },
					...ask.instruction === void 0 ? {} : { instruction: ask.instruction },
					steps
				};
				setHistory((current) => {
					const list = current[pipeline.id] ?? [];
					const numbered = {
						...entry,
						no: list.length + 1
					};
					return {
						...current,
						[pipeline.id]: [numbered, ...list].slice(0, HISTORY_LIMIT)
					};
				});
			}, [api]);
			const start = (0, react.useCallback)((pipeline, from, to, ask) => {
				if (pipeline.steps.length === 0 || from > to) return;
				token.current += 1;
				const mine = token.current;
				abort.current?.abort();
				const controller = new AbortController();
				abort.current = controller;
				const startedAt = Date.now();
				const initial = {
					pipelineId: pipeline.id,
					scope: ask.scope,
					startedAt,
					steps: pipeline.steps.map((_unused, index) => index < from || index > to ? { phase: "idle" } : { phase: "queued" }),
					activeIndex: from,
					phase: "running"
				};
				setChain(initial);
				runSteps(pipeline.steps, from, to, {
					now: () => Date.now(),
					signal: controller.signal,
					...ask.resume === void 0 ? {} : { resume: ask.resume },
					onStep: (index, outcome) => {
						if (token.current !== mine) return;
						setChain((current) => current === void 0 ? current : {
							...current,
							steps: current.steps.map((entry, at) => at === index ? outcome : entry),
							activeIndex: index
						});
					},
					start: async (index, step, seam) => {
						const scope = scopeSessionId?.();
						const regenerate = ask.previous !== void 0 && ask.instruction !== void 0;
						const cover = ask.scope === "refine" ? "single" : ask.scope;
						const result = await api.start({
							cardId: step.cardId,
							...seam.sessionId === void 0 ? {} : { sessionId: seam.sessionId },
							...scope === void 0 ? {} : { scopeSessionId: scope },
							mode: regenerate ? {
								kind: "refine",
								instruction: ask.instruction,
								previous: ask.previous,
								handoff: {
									pipelineId: pipeline.id,
									step: index
								}
							} : {
								kind: "step",
								terminal: seam.terminal,
								join: seam.sessionId !== void 0,
								handoff: {
									pipelineId: pipeline.id,
									step: index,
									scope: cover
								}
							},
							...seam.instruction === void 0 ? {} : { instruction: seam.instruction },
							outputSchema: WORKBENCH_OUTPUT_SCHEMA
						});
						if (result.status === "ok") return {
							status: "started",
							...result.state.runId === void 0 ? {} : { runId: result.state.runId }
						};
						if (result.status === "rejected") return {
							status: "refused",
							reason: result.message
						};
						return {
							status: "refused",
							reason: result.reason
						};
					},
					settle: async (cardId, runId, signal) => await settleRun(api, cardId, runId, signal, pollIntervalMs)
				}).then((result) => {
					if (token.current !== mine) return;
					setChain((current) => current === void 0 ? current : {
						...current,
						steps: result.steps,
						phase: result.phase,
						...result.failureIndex === void 0 ? {} : {
							activeIndex: result.failureIndex,
							failureIndex: result.failureIndex
						},
						...result.sessionId === void 0 ? {} : { sessionId: result.sessionId },
						...result.failure === void 0 ? {} : { failure: result.failure }
					});
					finish(pipeline, result, ask, from, startedAt);
				});
			}, [
				api,
				pollIntervalMs,
				scopeSessionId,
				finish
			]);
			const runAll = (0, react.useCallback)((pipeline, from = 0, resume) => {
				const at = from < 0 || from >= pipeline.steps.length ? 0 : from;
				start(pipeline, at, pipeline.steps.length - 1, {
					scope: "full",
					...at > 0 && resume !== void 0 ? { resume } : {}
				});
			}, [start]);
			const runOne = (0, react.useCallback)((pipeline, index) => {
				start(pipeline, index, index, { scope: "single" });
			}, [start]);
			const refine = (0, react.useCallback)((pipeline, index, instruction) => {
				(async () => {
					const read = await api.read();
					if (read.status !== "ok") return;
					const cardId = pipeline.steps[index]?.cardId;
					if (cardId === void 0) return;
					const previous = htmlOf(read.snapshot.results.find((entry) => entry.cardId === cardId)?.structured);
					if (previous === void 0 || previous.trim() === "") return;
					start(pipeline, index, index, {
						scope: "refine",
						instruction,
						previous
					});
				})();
			}, [api, start]);
			const history = (0, react.useCallback)((pipelineId) => historyOf[pipelineId] ?? EMPTY_HISTORY, [historyOf]);
			return {
				chain,
				runAll,
				runOne,
				stop: (0, react.useCallback)(() => {
					token.current += 1;
					abort.current?.abort();
					setChain((current) => current === void 0 ? current : {
						...current,
						phase: "stopped"
					});
				}, []),
				refine,
				history
			};
		}
		/**
		* Wait for one card's run to reach a terminal phase.
		* @param api - skill card transport.
		* @param cardId - the card whose run it is.
		* @param runId - the run to follow; absent follows the card's newest run.
		* @param signal - cancellation.
		* @param intervalMs - how long to wait between reads.
		* @returns how the run ended.
		*/
		async function settleRun(api, cardId, runId, signal, intervalMs) {
			let misses = 0;
			for (;;) {
				if (signal.aborted) return { phase: "cancelled" };
				const read = await api.poll(cardId, signal).catch(() => void 0);
				if (signal.aborted) return { phase: "cancelled" };
				if (read === void 0 || read.status !== "ok") return {
					phase: "failed",
					failure: "the run could not be read"
				};
				const state = pickRun(read.state, runId);
				if (state !== void 0 && (state.phase === "settled" || state.phase === "cancelled")) return outcomeOf(state);
				if (state === void 0) {
					misses += 1;
					if (misses >= MISS_LIMIT && (read.state.phase === "settled" || read.state.phase === "cancelled")) return outcomeOf(read.state);
				} else misses = 0;
				await sleep(intervalMs);
			}
		}
		/**
		* Choose the run a chain is following out of one poll answer.
		* @param newest - the card's newest run, as the wire reports it.
		* @param runId - the run to follow, when one is named.
		* @returns the run's state, or undefined while the answer does not carry it.
		*/
		function pickRun(newest, runId) {
			if (runId === void 0) return newest;
			if (newest.runId === runId) return newest;
		}
		/**
		* Read one terminal run state as a chain outcome.
		* @param state - the settled run.
		* @returns its session and, when it failed, why.
		*/
		function outcomeOf(state) {
			const sessionId = state.result?.sessionId;
			if (state.phase === "cancelled") return {
				phase: "cancelled",
				...sessionId === void 0 ? {} : { sessionId }
			};
			if (state.failure !== void 0) return {
				phase: "failed",
				failure: state.failure,
				...sessionId === void 0 ? {} : { sessionId }
			};
			return {
				phase: "settled",
				...sessionId === void 0 ? {} : { sessionId }
			};
		}
		/**
		* Wait for a while.
		* @param ms - how long.
		* @returns resolution after the delay.
		*/
		async function sleep(ms) {
			await new Promise((resolve) => {
				setTimeout(resolve, ms);
			});
		}
		/**
		* The region a stored result carries.
		*
		* The output contract is `{ html }`, so a result's product is a string under that key. It
		* is read defensively anyway: a record written by an older build has no such field, and a
		* reader that assumed one would throw on a card nobody has re-run since.
		* @param structured - the result's structured answer, when it kept one.
		* @returns the region HTML, or undefined when the record carries none.
		*/
		function htmlOf(structured) {
			if (typeof structured !== "object" || structured === null) return void 0;
			const value = structured.html;
			return typeof value === "string" ? value : void 0;
		}
		//#endregion
		//#region src/client/pipeline-classes.ts
		/**
		* The pipeline surface's class names.
		*
		* A plain object rather than a CSS-module export on purpose: `pipeline.css` speaks these
		* same literal names, so an element can never carry a name that no rule answers to.
		*/
		var css = {
			act: "wb-act",
			actArg: "wb-actArg",
			actBody: "wb-actBody",
			actDur: "wb-actDur",
			actIcon: "wb-actIcon",
			activityPanel: "wb-activityPanel",
			actList: "wb-actList",
			actMsg: "wb-actMsg",
			actName: "wb-actName",
			actT: "wb-actT",
			actTop: "wb-actTop",
			add: "wb-add",
			addStep: "wb-addStep",
			btn: "wb-btn",
			callout: "wb-callout",
			canvas: "wb-canvas",
			canvasHead: "wb-canvasHead",
			canvasMenu: "wb-canvasMenu",
			canvasMeta: "wb-canvasMeta",
			canvasScroll: "wb-canvasScroll",
			canvasTitleBtn: "wb-canvasTitleBtn",
			canvasTitleRow: "wb-canvasTitleRow",
			cfgBlock: "wb-cfgBlock",
			cfgBlockHead: "wb-cfgBlockHead",
			check: "wb-check",
			checks: "wb-checks",
			chipState: "wb-chipState",
			chipTag: "wb-chipTag",
			configPanel: "wb-configPanel",
			connector: "wb-connector",
			connectorShort: "wb-connectorShort",
			del: "wb-del",
			doc: "wb-doc",
			docPad: "wb-docPad",
			docSrc: "wb-docSrc",
			tplPreviewBody: "wb-tplPreviewBody",
			tplRegion: "wb-tplRegion",
			tplRegionTag: "wb-tplRegionTag",
			tplRegionText: "wb-tplRegionText",
			tplPreviewFrame: "wb-tplPreviewFrame",
			dot: "wb-dot",
			emptyFlow: "wb-emptyFlow",
			emptyMark: "wb-emptyMark",
			flow: "wb-flow",
			ghost: "wb-ghost",
			headLabel: "wb-headLabel",
			headSpacer: "wb-headSpacer",
			hError: "wb-hError",
			hint: "wb-hint",
			histAsk: "wb-histAsk",
			histBack: "wb-histBack",
			histBadge: "wb-histBadge",
			histBody: "wb-histBody",
			histDay: "wb-histDay",
			histNo: "wb-histNo",
			histReadonly: "wb-histReadonly",
			histRow: "wb-histRow",
			histSum: "wb-histSum",
			histTook: "wb-histTook",
			histTop: "wb-histTop",
			histTopMeta: "wb-histTopMeta",
			histTopWhen: "wb-histTopWhen",
			histWhen: "wb-histWhen",
			hStep: "wb-hStep",
			hStepHead: "wb-hStepHead",
			hStepMeta: "wb-hStepMeta",
			hStepMuted: "wb-hStepMuted",
			hStepName: "wb-hStepName",
			hStepNo: "wb-hStepNo",
			hStepRetry: "wb-hStepRetry",
			hStepTook: "wb-hStepTook",
			iconBtn: "wb-iconBtn",
			inlineFail: "wb-inlineFail",
			insertBtn: "wb-insertBtn",
			inspector: "wb-inspector",
			inspHead: "wb-inspHead",
			inspKicker: "wb-inspKicker",
			inspMeta: "wb-inspMeta",
			inspScroll: "wb-inspScroll",
			inspTab: "wb-inspTab",
			inspTabs: "wb-inspTabs",
			inspTitle: "wb-inspTitle",
			inspTitleRow: "wb-inspTitleRow",
			k: "wb-k",
			menuRow: "wb-menuRow",
			menuRowMain: "wb-menuRowMain",
			menuRowSub: "wb-menuRowSub",
			menuRowTail: "wb-menuRowTail",
			menuRowTitle: "wb-menuRowTitle",
			menuRun: "wb-menuRun",
			menuSect: "wb-menuSect",
			menuSep: "wb-menuSep",
			metric: "wb-metric",
			metrics: "wb-metrics",
			mono: "wb-mono",
			node: "wb-node",
			nodeDur: "wb-nodeDur",
			nodeFoot: "wb-nodeFoot",
			nodeIndex: "wb-nodeIndex",
			nodeProg: "wb-nodeProg",
			nodeRun: "wb-nodeRun",
			nodeState: "wb-nodeState",
			nodeTitle: "wb-nodeTitle",
			nodeNameInput: "wb-nodeNameInput",
			nodeTop: "wb-nodeTop",
			num: "wb-num",
			pagePipeline: "wb-pagePipeline",
			panel: "wb-panel",
			panelBody: "wb-panelBody",
			panelHead: "wb-panelHead",
			panes: "wb-panes",
			picker: "wb-picker",
			pickerEmpty: "wb-pickerEmpty",
			pickerHead: "wb-pickerHead",
			pickerList: "wb-pickerList",
			pickerProblem: "wb-pickerProblem",
			pickerRow: "wb-pickerRow",
			pickerRowDesc: "wb-pickerRowDesc",
			pickerRowMain: "wb-pickerRowMain",
			pickerRowTitle: "wb-pickerRowTitle",
			pickerScrim: "wb-pickerScrim",
			pickerTitle: "wb-pickerTitle",
			pickerUsed: "wb-pickerUsed",
			pickerWrap: "wb-pickerWrap",
			pipelineView: "wb-pipelineView",
			primary: "wb-primary",
			renameInput: "wb-renameInput",
			resBlock: "wb-resBlock",
			resBlockHead: "wb-resBlockHead",
			resEmpty: "wb-resEmpty",
			resItem: "wb-resItem",
			resItemName: "wb-resItemName",
			resItemSize: "wb-resItemSize",
			resProblem: "wb-resProblem",
			resList: "wb-resList",
			resOpen: "wb-resOpen",
			resultBar: "wb-resultBar",
			resultPanel: "wb-resultPanel",
			review: "wb-review",
			reviewArea: "wb-reviewArea",
			reviewBody: "wb-reviewBody",
			reviewChip: "wb-reviewChip",
			reviewChips: "wb-reviewChips",
			reviewFoot: "wb-reviewFoot",
			reviewFrom: "wb-reviewFrom",
			reviewHead: "wb-reviewHead",
			reviewNote: "wb-reviewNote",
			reviewScrim: "wb-reviewScrim",
			reviewTitle: "wb-reviewTitle",
			reviewWho: "wb-reviewWho",
			reviewWrap: "wb-reviewWrap",
			revised: "wb-revised",
			root: "wb-root",
			ruleLabel: "wb-ruleLabel",
			ruleRow: "wb-ruleRow",
			ruleSelect: "wb-ruleSelect",
			ruleInput: "wb-ruleInput",
			ruleArea: "wb-ruleArea",
			rulePath: "wb-rulePath",
			cfgProblem: "wb-cfgProblem",
			rulePathText: "wb-rulePathText",
			rulePathPick: "wb-rulePathPick",
			ruleValue: "wb-ruleValue",
			runActions: "wb-runActions",
			runbar: "wb-runbar",
			runNoise: "wb-runNoise",
			runOne: "wb-runOne",
			scroll: "wb-scroll",
			searchField: "wb-searchField",
			segBar: "wb-segBar",
			segTiny: "wb-segTiny",
			skel: "wb-skel",
			spacer: "wb-spacer",
			srcNote: "wb-srcNote",
			stateBlock: "wb-stateBlock",
			stepChip: "wb-stepChip",
			stepMenu: "wb-stepMenu",
			stepMenuNote: "wb-stepMenuNote",
			stepMenuRow: "wb-stepMenuRow",
			stepMenuSep: "wb-stepMenuSep",
			stepStrip: "wb-stepStrip",
			timer: "wb-timer",
			tplSlotBox: "wb-tplSlotBox",
			tplSlotLabel: "wb-tplSlotLabel",
			tplSlotTag: "wb-tplSlotTag",
			tplSlotText: "wb-tplSlotText",
			v: "wb-v",
			val: "wb-val",
			zFile: "wb-zFile",
			zName: "wb-zName",
			zoom: "wb-zoom",
			zoomBody: "wb-zoomBody",
			zoomFiles: "wb-zoomFiles",
			zoomHead: "wb-zoomHead",
			zoomHint: "wb-zoomHint",
			zoomKicker: "wb-zoomKicker",
			zoomMeta: "wb-zoomMeta",
			zoomReview: "wb-zoomReview",
			zoomScrim: "wb-zoomScrim",
			zoomWarn: "wb-zoomWarn",
			zoomWrap: "wb-zoomWrap",
			zSize: "wb-zSize"
		};
		//#endregion
		//#region src/client/pipeline/pipeline-view.ts
		/** The state a step is drawn in. */
		var STATE_VIEW = {
			idle: {
				key: "idle",
				mark: "slot"
			},
			queued: {
				key: "queued",
				mark: "dash"
			},
			running: {
				key: "running",
				mark: "clock"
			},
			done: {
				key: "done",
				mark: "check"
			},
			failed: {
				key: "failed",
				mark: "warn"
			},
			stopped: {
				key: "stopped",
				mark: "x"
			}
		};
		/**
		* How one step's state reads.
		* @param phase - the step's phase.
		* @returns its text key and mark.
		*/
		function stateView(phase) {
			return STATE_VIEW[phase];
		}
		/** Several identical characters, for the duration column. */
		var DASH = "—";
		/**
		* Format a duration for a column that must not jump as the number grows.
		* @param ms - elapsed milliseconds; absent means nothing has elapsed yet.
		* @returns `12.4s`, `1m 08s`, or a dash.
		*/
		function formatDuration(ms) {
			if (ms === void 0 || !Number.isFinite(ms) || ms < 0) return DASH;
			if (ms < 1e3) return `${(ms / 1e3).toFixed(1)}s`;
			const seconds = Math.round(ms / 1e3);
			if (seconds < 60) return `${seconds}s`;
			const minutes = Math.floor(seconds / 60);
			const rest = seconds % 60;
			if (minutes < 60) return `${minutes}m ${String(rest).padStart(2, "0")}s`;
			return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}m`;
		}
		/**
		* Format a moment the way a run list groups by day.
		*
		* Today and yesterday are named, because "今天 14:07" is what someone means by "recent";
		* anything older carries its date, and a different year carries the year.
		* @param at - epoch milliseconds.
		* @param now - the clock to compare against.
		* @returns a short, grouped label.
		*/
		function formatWhen(at, now) {
			const when = new Date(at);
			const today = new Date(now);
			const time = `${String(when.getHours()).padStart(2, "0")}:${String(when.getMinutes()).padStart(2, "0")}`;
			const dayKey = (date) => date.getFullYear() * 1e4 + (date.getMonth() + 1) * 100 + date.getDate();
			if (dayKey(when) === dayKey(today)) return time;
			const yesterday = /* @__PURE__ */ new Date(today.getTime() - 864e5);
			if (dayKey(when) === dayKey(yesterday)) return `昨天 ${time}`;
			const sameYear = when.getFullYear() === today.getFullYear();
			const month = when.getMonth() + 1;
			const day = when.getDate();
			return sameYear ? `${String(month)}/${String(day)} ${time}` : `${String(when.getFullYear())}/${String(month)}/${String(day)}`;
		}
		/** How far into a result document a directory pointer may sit. */
		var POINTER = /data-dsh-files\s*=\s*"([^"]{1,512})"/i;
		/**
		* Read the directory a document points at.
		*
		* The pointer is the template's own statement that this card's results are files in a
		* directory, and it sits outside the region so a run cannot remove it. A run's stored region
		* may carry one too — that is how results written before the pointer moved are still read.
		* @param document - a template, or a stored region.
		* @returns the directory the document points at, or undefined when it points at none.
		*/
		function pointerPath(document) {
			if (document === void 0) return void 0;
			const path = POINTER.exec(document)?.[1]?.trim();
			return path === void 0 || path === "" ? void 0 : path;
		}
		/**
		* The directory a step's result covers.
		*
		* Asked of the card's template first: the template is where the pointer belongs, and it is
		* the only place a run cannot overwrite. The stored region is the second answer, so results
		* from before the pointer moved out of the region keep their file list.
		* @param template - the card's template as stored; absent when it has none.
		* @param product - what the run's own region produced.
		* @returns the directory to list, or undefined when this result is not a directory's files.
		*/
		function resultDirectory(template, product) {
			const fromTemplate = pointerPath(template);
			if (fromTemplate !== void 0) return fromTemplate;
			return product.kind === "directory" ? product.path : void 0;
		}
		/**
		* A byte count as the row beside a file name shows it.
		*
		* One decimal above a kilobyte and none below it: a listing is read for its shape, and
		* `56.5 KB` beside a name says as much as `57812` does without being counted out.
		* @param bytes - the size to label; absent or not positive gives an empty label.
		* @returns the label, empty when there is no size to show.
		*/
		function formatBytes(bytes) {
			if (bytes === void 0 || bytes <= 0) return "";
			if (bytes < 1024) return `${String(bytes)} B`;
			if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
			return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
		}
		/**
		* Read what a step produced out of the result it stored.
		*
		* A run returns the region of its card's document, so the region is what "produced" means
		* here: either it points at a directory the document will list and read for itself, or it
		* is the content itself. That distinction is the panel's whole job — a directory gets one
		* row that opens the document, an inline result gets one row that opens the same document.
		* @param html - the region HTML the run stored; absent when it stored none.
		* @returns the product, or `none` when the run left nothing to read.
		*/
		function productOf(html) {
			if (html === void 0 || html.trim() === "") return { kind: "none" };
			const path = pointerPath(html);
			if (path !== void 0) return {
				kind: "directory",
				path
			};
			const text = textOf(html);
			return text === "" ? { kind: "none" } : {
				kind: "inline",
				text
			};
		}
		/**
		* Read the text a region carries, without the markup.
		*
		* The row under the step name is a summary, not a rendering, so tags come out and runs of
		* whitespace collapse. It is deliberately not a parser: the document is rendered in the
		* reader, and a preview that half-parsed HTML would be a second renderer to keep honest.
		* @param html - the region HTML.
		* @returns its text, on one line, cut to something a row can hold.
		*/
		function textOf(html) {
			const text = html.replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&amp;/gi, "&").replace(/\s+/g, " ").trim();
			return text.length > SUMMARY_MAX ? `${text.slice(0, SUMMARY_MAX - 1)}…` : text;
		}
		/** How much of a step's text the canvas foot shows. */
		var SUMMARY_MAX = 64;
		/**
		* Read how a whole pipeline stands.
		*
		* The run in flight is authoritative while it is whole: it is what just happened. A run of
		* one step is not a verdict on the pipeline, so once the chain is a slice the answer falls
		* back to the records — and when there are none, the steps holding a result are all that is
		* left to read, which is why that case gets a word of its own instead of a claim about how
		* those results came to be.
		* @param input - steps, their results, the run in flight, and the runs seen.
		* @returns how the pipeline stands.
		*/
		function standOf(input) {
			const { chain, doneCount, runs, stepCount } = input;
			if (chain !== void 0) {
				if (chain.phase === "running") return "running";
				if (chain.whole) {
					if (chain.phase === "failed") return "failed";
					if (chain.phase === "stopped") return "stopped";
					return "done";
				}
			}
			const whole = runs.find((entry) => entry.scope === "full");
			if (whole !== void 0) {
				if (whole.phase === "failed") return "failed";
				if (whole.phase === "stopped") return "stopped";
				if (whole.phase === "settled") return "done";
			}
			if (stepCount === 0 || doneCount === 0) return "idle";
			if (runs.length > 0) return "solo";
			const scopes = input.scopes ?? [];
			const failedAt = input.failedAt ?? -1;
			if (failedAt >= 0 && scopes[failedAt] === "full") return "failed";
			if (doneCount === stepCount && scopes.every((scope) => scope === "full")) return "done";
			if (scopes.some((scope) => scope !== void 0)) return "solo";
			return "kept";
		}
		/**
		* Where a whole run would start: the first step that does not hold a result.
		*
		* The run bar says this out loud, and it must agree with the engine, so both read it here.
		* A pipeline whose steps all hold a result starts over from the first, which is why the
		* fallback is 0 rather than "nowhere".
		* @param phases - one phase per step, in step order.
		* @returns the zero-based index to start at.
		*/
		function resumeFrom(phases) {
			const first = phases.findIndex((phase) => phase !== "done");
			return first < 0 ? 0 : first;
		}
		//#endregion
		//#region src/client/pipeline-memory.ts
		/** Key the open pipeline id is kept under. */
		var OPEN_PIPELINE_KEY = "dsh-workbench:open-pipeline";
		/**
		* Read the pipeline id the workbench last opened.
		* @returns the remembered id, or undefined when nothing was kept or storage is unavailable.
		*/
		function readOpenPipeline() {
			try {
				const kept = globalThis.localStorage?.getItem(OPEN_PIPELINE_KEY);
				return kept === null || kept === void 0 || kept === "" ? void 0 : kept;
			} catch {
				return;
			}
		}
		/**
		* Keep or clear the pipeline id the workbench opens.
		* @param id - the pipeline the user is looking at; an empty string clears the memory.
		*/
		function rememberOpenPipeline(id) {
			try {
				if (id === "") globalThis.localStorage?.removeItem(OPEN_PIPELINE_KEY);
				else globalThis.localStorage?.setItem(OPEN_PIPELINE_KEY, id);
			} catch {}
		}
		/**
		* Pick the pipeline the panel shows.
		*
		* The remembered id wins while it still names a stored pipeline. Otherwise the pipeline
		* changed most recently is the one the user was working on — order in storage is creation
		* order, which would open the oldest one forever.
		* @param pipelines - the stored pipelines, in storage order.
		* @param remembered - the id the panel last showed.
		* @returns the pipeline to show, or undefined when nothing is stored.
		*/
		function pickOpenPipeline(pipelines, remembered) {
			if (remembered !== void 0) {
				const found = pipelines.find((pipeline) => pipeline.id === remembered);
				if (found !== void 0) return found;
			}
			let newest;
			for (const pipeline of pipelines) if (newest === void 0 || pipeline.updatedAt > newest.updatedAt) newest = pipeline;
			return newest;
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
		//#endregion
		//#region src/client/WorkbenchPipeline.tsx
		/**
		* 流水线工作台：左边是这条流水线本身，右边是选中的这一步。
		*
		* 结构与 `docs/prototypes/workbench-pipeline-v2.html` 一一对应：面板头 → 两栏（画布 + 检查器）
		* → 运行条，四个弹层（阅读器 / 运行记录 / 审核 / 选择器）都是面板内的覆盖层，不另开窗口。
		* 样式逐条取自原型，只把原型的固定色板换成 DSH 令牌，于是插件跟 DSH 一起换肤。
		*
		* 步骤的“是什么”全在它自己的卡片里（模板、技能、模型、工作目录），流水线只记住顺序，
		* 所以这里从不编辑卡片的模板：要改就进卡片自己的页面。
		* @module dsh-workbench/client/WorkbenchPipeline
		*/
		/** How long a delete confirmation stays armed. */
		var CONFIRM_MS = 4e3;
		/**
		* What the preview puts where the model will write.
		*
		* Inline-styled on purpose: it is rendered inside the card's own shadow root, where the
		* workbench's stylesheet does not reach and the template's rules would restyle it. The words
		* come from the locale, because this note is read by a person, not by the template.
		*
		* The shape depends on where the region sits. A `div` inside `tbody` is not a table row, and a
		* parser asked to make sense of one lifts it out of the table entirely — which is how the note
		* ends up above the header it belongs under. So a region inside a table becomes a row.
		* @param template - the stored template, used only to read the region's surroundings.
		* @param region - the label for the region, e.g. "区域内容".
		* @param body - what happens to the region at run time.
		* @returns the placeholder markup, valid where the region is.
		*/
		function regionPlaceholder(template, region, body) {
			const note = `<div style="margin:12px 0;padding:12px;border:1px dashed rgba(128,131,138,0.5);border-radius:8px"><span style="display:inline-block;padding:2px 7px;border-radius:5px;background:rgba(128,131,138,0.14);font-family:ui-monospace,monospace;font-size:11px">${escapeHtml(region)}</span> <span style="font-size:11px;color:#8a8f98">${escapeHtml(body)}</span></div>`;
			const bounds = findRegion(template);
			if (bounds === void 0) return note;
			const before = template.slice(0, bounds.start).toLowerCase();
			const open = (tag) => before.split(`<${tag}`).length > before.split(`</${tag}`).length;
			const span = columnCount(template);
			if (open("td") || open("th")) return `<td colspan="${span}" style="padding:4px">${note}</td>`;
			if (open("tr") || open("tbody") || open("thead") || open("table")) return `<tr><td colspan="${span}" style="padding:4px">${note}</td></tr>`;
			return note;
		}
		/**
		* How many columns the template's table has.
		* @param template - the stored template.
		* @returns the header cell count, else the colgroup count, else the first row's, at least 1.
		*/
		function columnCount(template) {
			const cells = (scope) => (scope.match(/<t[hd][\s>]/gi) ?? []).length;
			const fromHead = cells(/<thead[\s\S]*?<\/thead>/i.exec(template)?.[0] ?? "");
			if (fromHead > 0) return fromHead;
			const fromCols = (template.match(/<col[\s>]/gi) ?? []).length;
			if (fromCols > 0) return fromCols;
			const fromRow = cells(/<tr[\s\S]*?<\/tr>/i.exec(template)?.[0] ?? "");
			return Math.max(1, Math.min(24, fromRow > 0 ? fromRow : 1));
		}
		/**
		* Escape the three characters that would end the text early inside a generated document.
		* @param text - a locale string.
		* @returns it, safe to splice into HTML.
		*/
		function escapeHtml(text) {
			return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
		}
		/** The permission modes in the order the row offers them: ordinary first, broad last. */
		var PERMISSION_ORDER = [
			"workspace-write",
			"read-only",
			"danger-full-access"
		];
		/**
		* Render the pipeline workbench.
		* @param props - stored pipelines, run engine, cards, transport, card views, and `t`.
		* @returns the two-column surface with its overlays.
		*/
		function WorkbenchPipeline(props) {
			const { pipelines, run, facts, api, renderCard, onCreateCard, t, catalog, catalogStatus, catalogFailure, onCatalogNeeded, createCardForSkill, renameStepCard, patchStepCards, modelGroups, workspacePicker, saveStepTemplate, removeCard } = props;
			const [activeId, setActiveId] = (0, react.useState)(() => readOpenPipeline());
			const [focus, setFocus] = (0, react.useState)(void 0);
			const [tab, setTab] = (0, react.useState)("activity");
			const [cards, setCards] = (0, react.useState)([]);
			const [results, setResults] = (0, react.useState)([]);
			const [menuOpen, setMenuOpen] = (0, react.useState)(false);
			const [stepMenu, setStepMenu] = (0, react.useState)(void 0);
			const [stepRename, setStepRename] = (0, react.useState)(void 0);
			const [confirmRemove, setConfirmRemove] = (0, react.useState)(void 0);
			/** Why the last config write did not land, stated where the user made it. */
			const [configProblem, setConfigProblem] = (0, react.useState)(void 0);
			const [confirmDelete, setConfirmDelete] = (0, react.useState)(void 0);
			const [renaming, setRenaming] = (0, react.useState)(void 0);
			const [picker, setPicker] = (0, react.useState)(void 0);
			const [pickerQuery, setPickerQuery] = (0, react.useState)("");
			/** Why the step the user just picked was not added, stated in the picker that asked. */
			const [pickerProblem, setPickerProblem] = (0, react.useState)(void 0);
			const [reader, setReader] = (0, react.useState)(void 0);
			const [historyOpen, setHistoryOpen] = (0, react.useState)(false);
			const [historyAt, setHistoryAt] = (0, react.useState)(void 0);
			const [review, setReview] = (0, react.useState)(void 0);
			const [reviewText, setReviewText] = (0, react.useState)("");
			const active = (0, react.useMemo)(() => pickOpenPipeline(pipelines.pipelines, activeId), [activeId, pipelines.pipelines]);
			const activeKey = active?.id;
			(0, react.useEffect)(() => {
				if (activeKey === void 0) return;
				rememberOpenPipeline(activeKey);
			}, [activeKey]);
			const menuFacts = (0, react.useMemo)(() => {
				const seen = /* @__PURE__ */ new Set();
				return facts.filter((fact) => {
					if (seen.has(fact.id)) return false;
					seen.add(fact.id);
					return true;
				});
			}, [facts]);
			const labelOf = (0, react.useCallback)((cardId) => {
				const label = menuFacts.find((entry) => entry.id === cardId)?.label ?? "";
				return label.length === 0 ? cardId : label;
			}, [menuFacts]);
			/** Read the stored cards and results, which every panel reads from. */
			const reload = (0, react.useCallback)(async () => {
				const read = await api.read();
				if (read.status !== "ok") return;
				setCards(read.snapshot.cards);
				setResults(read.snapshot.results);
			}, [api]);
			(0, react.useEffect)(() => {
				reload();
			}, [reload]);
			const chainPhase = run.chain?.phase;
			(0, react.useEffect)(() => {
				if (chainPhase === "settled" || chainPhase === "failed" || chainPhase === "stopped") reload();
			}, [chainPhase, reload]);
			(0, react.useEffect)(() => {
				if (confirmDelete === void 0) return;
				const timer = setTimeout(() => {
					setConfirmDelete(void 0);
				}, CONFIRM_MS);
				return () => {
					clearTimeout(timer);
				};
			}, [confirmDelete]);
			(0, react.useEffect)(() => {
				if (confirmRemove === void 0) return;
				const timer = setTimeout(() => {
					setConfirmRemove(void 0);
				}, CONFIRM_MS);
				return () => {
					clearTimeout(timer);
				};
			}, [confirmRemove]);
			(0, react.useEffect)(() => {
				setStepRename(void 0);
				setConfirmRemove(void 0);
			}, [active?.id]);
			(0, react.useEffect)(() => {
				if (!menuOpen && stepMenu === void 0) return;
				const close = (event) => {
					const from = event.target;
					if (from instanceof Element && from.closest("[data-title-menu], [data-step-menu]") !== null) return;
					setMenuOpen(false);
					setStepMenu(void 0);
					setConfirmRemove(void 0);
				};
				document.addEventListener("pointerdown", close);
				return () => {
					document.removeEventListener("pointerdown", close);
				};
			}, [menuOpen, stepMenu]);
			const anyOverlay = reader !== void 0 || historyOpen || review !== void 0 || picker !== void 0;
			(0, react.useEffect)(() => {
				if (!anyOverlay) return;
				const onKey = (event) => {
					if (event.key !== "Escape") return;
					setReader(void 0);
					setHistoryOpen(false);
					setReview(void 0);
					setPicker(void 0);
				};
				document.addEventListener("keydown", onKey);
				return () => {
					document.removeEventListener("keydown", onKey);
				};
			}, [anyOverlay]);
			const chain = run.chain !== void 0 && active !== void 0 && run.chain.pipelineId === active.id ? run.chain : void 0;
			const running = chain?.phase === "running";
			const history = (0, react.useMemo)(() => active === void 0 ? [] : run.history(active.id), [
				active,
				run,
				chainPhase
			]);
			/** One step's stored result, if the card has one. */
			const resultOf = (0, react.useCallback)((cardId) => results.find((entry) => entry.cardId === cardId), [results]);
			const stepViews = (0, react.useMemo)(() => {
				if (active === void 0) return [];
				return active.steps.map((step, index) => {
					const card = cards.find((entry) => entry.cardId === step.cardId);
					const result = resultOf(step.cardId);
					const html = resultHtml(result?.structured);
					const chainStep = chain?.steps[index];
					const phase = chainStep !== void 0 && chainStep.phase !== "idle" ? chainStep.phase : result === void 0 ? "idle" : "done";
					const producing = history.find((entry) => entry.steps.some((item) => item.cardId === step.cardId && item.phase === "done"));
					const keptScope = result?.pipeline?.id === active.id ? result.pipeline.scope : void 0;
					return {
						index,
						cardId: step.cardId,
						label: labelOf(step.cardId),
						skill: card?.skill,
						phase,
						tookMs: chainStep?.tookMs,
						failure: chainStep?.failure ?? result?.failure,
						product: productOf(html),
						html,
						card,
						result,
						runNo: producing?.no,
						runScope: producing?.scope ?? keptScope
					};
				});
			}, [
				active,
				cards,
				chain,
				history,
				labelOf,
				resultOf
			]);
			const selectedIndex = focus?.kind === "step" ? focus.index : 0;
			const selected = stepViews[selectedIndex];
			const usedSkills = (0, react.useMemo)(() => {
				const used = /* @__PURE__ */ new Set();
				for (const step of stepViews) if (step.skill !== void 0) used.add(step.skill);
				return used;
			}, [stepViews]);
			const pickerRows = (0, react.useMemo)(() => {
				const query = pickerQuery.trim().toLowerCase();
				if (query === "") return catalog;
				return catalog.filter((entry) => entry.name.toLowerCase().includes(query) || entry.description.toLowerCase().includes(query));
			}, [catalog, pickerQuery]);
			/** What the picker says instead of rows: a catalogue on its way, one that failed, or no match. */
			const pickerEmptyText = () => {
				if (catalogStatus === "idle" || catalogStatus === "loading") return t("skillCardCatalogLoading");
				if (catalogStatus === "failed") return t(catalogFailure === "session-not-live" ? "skillCardNoSession" : "skillCardCatalogFailed");
				return pickerQuery.trim() === "" ? t("skillCardCatalogEmpty") : t("pipePickerEmpty");
			};
			const writeSteps = (0, react.useCallback)(async (steps) => {
				if (active === void 0) return false;
				return await pipelines.setSteps(active.id, steps);
			}, [active, pipelines]);
			/**
			* Put one card into the pipeline at a slot.
			*
			* The picker closes only after the steps are stored: a step that failed to write would
			* otherwise leave the dialog gone and the canvas unchanged, which reads as a click that
			* did nothing at all.
			* @param cardId - the card the step runs.
			* @param at - zero-based slot.
			* @returns whether the steps were stored.
			*/
			const insertStep = (0, react.useCallback)(async (cardId, at) => {
				if (active === void 0) return false;
				if (active.steps.some((step) => step.cardId === cardId)) return false;
				const next = [...active.steps];
				next.splice(at, 0, { cardId });
				if (!await writeSteps(next)) return false;
				setPicker(void 0);
				setPickerQuery("");
				setFocus({
					kind: "step",
					index: at
				});
				return true;
			}, [active, writeSteps]);
			/** Open the picker at one slot, and make sure the skills it lists are the current ones. */
			const openPicker = (0, react.useCallback)((at) => {
				onCatalogNeeded();
				setPicker({ at });
				setPickerQuery("");
				setPickerProblem(void 0);
			}, [onCatalogNeeded]);
			/**
			* Turn one picked skill into a step: the card is what carries the skill, so the card is
			* made first and the step is the new card's place in the pipeline.
			* @param skill - the picked skill.
			*/
			const addSkillStep = (0, react.useCallback)(async (skill) => {
				if (picker === void 0) return;
				const at = picker.at;
				setPickerProblem(void 0);
				const made = await createCardForSkill(skill);
				if ("reason" in made) {
					setPickerProblem(t("pipeAddProblem", { reason: made.reason }));
					return;
				}
				if (await insertStep(made.cardId, at)) return;
				await removeCard(made.cardId);
				setPickerProblem(t("pipeAddProblem", { reason: t("pipeCfgWriteFailed") }));
			}, [
				createCardForSkill,
				insertStep,
				picker,
				removeCard,
				t
			]);
			const moveStep = (0, react.useCallback)(async (index, delta) => {
				if (active === void 0) return;
				const target = index + delta;
				if (target < 0 || target >= active.steps.length) return;
				const next = [...active.steps];
				const moved = next[index];
				const displaced = next[target];
				if (moved === void 0 || displaced === void 0) return;
				next[index] = displaced;
				next[target] = moved;
				await writeSteps(next);
				setFocus({
					kind: "step",
					index: target
				});
			}, [active, writeSteps]);
			const removeStep = (0, react.useCallback)(async (index) => {
				if (active === void 0) return;
				const next = active.steps.filter((_step, at) => at !== index);
				await writeSteps(next);
				setFocus(next.length === 0 ? void 0 : {
					kind: "step",
					index: Math.min(index, next.length - 1)
				});
			}, [active, writeSteps]);
			/**
			* Commit one inline step name. An empty or unchanged name is not a rename, and the
			* step's card keeps the name it had.
			* @param cardId - the step's card.
			* @param name - the typed name.
			*/
			const canPickWorkspace = workspacePicker !== void 0 && workspacePicker.available();
			const applyPatch = (0, react.useCallback)((patch) => {
				patchStepCards(stepViews.map((view) => view.cardId), patch).then((written) => {
					if (!written) {
						setConfigProblem(t("pipeCfgWriteFailed"));
						return;
					}
					setConfigProblem(void 0);
					reload();
				});
			}, [
				patchStepCards,
				reload,
				stepViews,
				t
			]);
			const chooseWorkspaceForSteps = (0, react.useCallback)(() => {
				if (workspacePicker === void 0) return;
				workspacePicker.pick().then((picked) => {
					if (picked.status === "cancelled") return;
					if (picked.status === "unavailable") {
						setConfigProblem(t("pipeCfgPickerRefused"));
						return;
					}
					applyPatch({ workspace: { path: picked.path } });
				});
			}, [
				applyPatch,
				t,
				workspacePicker
			]);
			const commitStepRename = (0, react.useCallback)((cardId, name) => {
				setStepRename(void 0);
				const current = stepViews.find((step) => step.cardId === cardId);
				if (name === "" || name === current?.label) return;
				renameStepCard(cardId, name);
			}, [renameStepCard, stepViews]);
			const createPipeline = (0, react.useCallback)(() => {
				(async () => {
					const created = await pipelines.create(t("pipeNewPipelineName"));
					if (created !== void 0) {
						setActiveId(created);
						setFocus(void 0);
					}
				})();
			}, [pipelines, t]);
			const stateText = (phase) => t(`pipeStepState_${stateView(phase).key}`);
			const markOf = (phase) => MARK[stateView(phase).mark];
			const chainWhole = chain !== void 0 && active !== void 0 && chain.pipelineId === active.id && chain.scope === "full";
			const stepCount = active?.steps.length ?? 0;
			const doneCount = stepViews.filter((step) => step.phase === "done").length;
			const failedAt = chain?.failureIndex ?? stepViews.findIndex((step) => step.phase === "failed");
			const stand = standOf({
				stepCount,
				doneCount,
				...chain === void 0 ? {} : { chain: {
					phase: chain.phase,
					whole: chainWhole
				} },
				runs: history,
				scopes: stepViews.map((step) => step.runScope),
				failedAt: stepViews.findIndex((step) => step.phase === "failed")
			});
			const alone = stepViews.filter((step) => step.phase === "done" && step.runScope !== "full").map((step) => step.index + 1);
			const resumeAt = resumeFrom(stepViews.map((step) => step.phase));
			/** Session a resumed run continues: the one the step before its first step settled in. */
			const priorSession = resumeAt > 0 ? chain?.steps[resumeAt - 1]?.sessionId : void 0;
			/**
			* How any stored pipeline stands, for the menu rows.
			*
			* The one on screen answers with the same reading the canvas title uses, so the row and
			* the title can never disagree; the others are read from their records alone.
			* @param pipeline - the pipeline to read.
			* @returns how it stands.
			*/
			const standOfId = (pipeline) => {
				if (pipeline.id === active?.id) return stand;
				const mine = chain !== void 0 && chain.pipelineId === pipeline.id ? chain : void 0;
				const whole = mine !== void 0 && mine.scope === "full";
				const scopes = pipeline.steps.map((step) => {
					const result = results.find((entry) => entry.cardId === step.cardId);
					return result?.pipeline?.id === pipeline.id ? result.pipeline.scope : void 0;
				});
				return standOf({
					stepCount: pipeline.steps.length,
					doneCount: pipeline.steps.filter((step) => results.some((entry) => entry.cardId === step.cardId)).length,
					...mine === void 0 ? {} : { chain: {
						phase: mine.phase,
						whole
					} },
					runs: run.history(pipeline.id),
					scopes,
					failedAt: pipeline.steps.findIndex((step) => results.some((entry) => entry.cardId === step.cardId && entry.failure !== void 0))
				});
			};
			/**
			* How long the run that finished the pipeline took.
			*
			* The steps' own durations added up, so the bar and the canvas cannot tell two different
			* stories about the same run; a pipeline with no timing reads as unknown, not as zero.
			*/
			const runTook = chain !== void 0 ? chain.phase === "running" ? void 0 : chain.steps.reduce((sum, step) => step.tookMs === void 0 ? sum : (sum ?? 0) + step.tookMs, void 0) : history[0]?.tookMs;
			/** What one run-bar segment is drawn as; `solo` is the hollow one. */
			const segState = (phase) => phase === "done" && (stand === "solo" || stand === "kept") ? "solo" : phase;
			/**
			* How a finished run reads in the run list.
			*
			* A chain's own word for its outcome ("settled") is not a word a reader knows, and the
			* list's colour rule is keyed on this smaller set, so the two are chosen together here.
			* @param phase - how the run ended.
			* @returns the colour key and the locale key that names it.
			*/
			const runStateOf = (phase) => phase === "settled" ? {
				s: "ok",
				key: "pipeRunState_ok"
			} : phase === "failed" ? {
				s: "fail",
				key: "pipeRunState_fail"
			} : phase === "stopped" ? {
				s: "stopped",
				key: "pipeRunState_stopped"
			} : {
				s: "running",
				key: "pipeRunState_running"
			};
			/**
			* What one run covered, named rather than numbered.
			*
			* A whole run lists the steps it took in order; a run of one step names that step, which
			* is the only thing that tells the two apart in a list of otherwise identical rows.
			* @param entry - the run.
			* @returns a phrase for the row.
			*/
			const runScopeOf = (entry) => {
				if (entry.scope === "full") return entry.steps.map((step) => labelOf(step.cardId)).join(" → ");
				const name = labelOf(entry.steps[0]?.cardId ?? "");
				return entry.scope === "single" ? t("pipeScopeOnly", { name }) : t("pipeScopeRefined", { name });
			};
			/**
			* One run's header line: when, what it covered, how long, how it ended.
			* @param entry - the run, when one is open.
			* @returns the line, or nothing while no run is open.
			*/
			const runMetaOf = (entry) => entry === void 0 ? "" : [
				formatWhen(entry.startedAt, Date.now()),
				runScopeOf(entry),
				formatDuration(entry.tookMs),
				t(runStateOf(entry.phase).key)
			].join(" · ");
			const metaOf = (pipeline) => {
				const runs = run.history(pipeline.id);
				const count = pipeline.steps.length;
				if (count === 0) return t("pipeMetaNoSteps");
				if (runs.length === 0) return t("pipeMetaSteps", { count });
				return t("pipeMetaRan", {
					no: runs[0]?.no ?? 0,
					count,
					when: formatWhen(runs[0]?.startedAt ?? Date.now(), Date.now())
				});
			};
			const runNoise = () => {
				if (stepCount === 0) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("pipeNoSteps") });
				if (stand === "running") {
					const at = (chain?.activeIndex ?? 0) + 1;
					return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: chainWhole ? t("pipeRunningStep", {
						at,
						count: stepCount
					}) : t("pipeRunningOne", { at }) });
				}
				if (stand === "failed") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("pipeFailedAt", {
					done: doneCount,
					count: stepCount,
					at: (failedAt < 0 ? doneCount : failedAt) + 1
				}) });
				if (stand === "stopped") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("pipeStopped", {
					done: doneCount,
					count: stepCount
				}) });
				if (stand === "done") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: runTook === void 0 ? t("pipeAllDone", { count: stepCount }) : t("pipeAllDoneAt", {
					count: stepCount,
					took: formatDuration(runTook)
				}) });
				if (stand === "idle") return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("pipeStand_idle") }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "·" }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("pipeBarIdle", { count: stepCount }) })
				] });
				const which = stand === "kept" ? t("pipeBarKeptWhich", { steps: alone.join(t("pipeListSeparator")) }) : t("pipeBarSoloWhich", { steps: alone.join(t("pipeListSeparator")) });
				const next = doneCount === stepCount ? t("pipeBarSoloNextAll") : resumeAt === 0 ? t("pipeBarSoloNextFirst") : t("pipeBarSoloNextResume", { at: resumeAt + 1 });
				return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
					stand === "solo" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("pipeBarSoloHead") }) : null,
					stand === "solo" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "·" }) : null,
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: which }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "·" }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: next })
				] });
			};
			const openReader = (cardId, file) => {
				setReader(file === void 0 ? { cardId } : {
					cardId,
					file
				});
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: `${css.root} ${css.panel}`,
				"data-workbench-pipeline": "",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
						className: css.panelHead,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h1", { children: t("title") }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { className: css.headSpacer }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								className: `${css.btn} ${css.ghost}`,
								"data-head-new-pipeline": "",
								onClick: createPipeline,
								children: [MARK.plus, /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: css.headLabel,
									children: t("pipeNewPipeline")
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								className: `${css.btn} ${css.primary}`,
								"data-run-all": "",
								disabled: running || active === void 0 || active.steps.length === 0,
								onClick: () => {
									if (active !== void 0) run.runAll(active, resumeAt, priorSession);
								},
								children: [MARK.play, /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: css.headLabel,
									children: t("pipeRunAll")
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: css.panelBody,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
							className: css.pipelineView,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: css.panes,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: css.canvas,
									"data-canvas": "",
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: css.canvasHead,
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
												style: {
													minWidth: 0,
													flex: 1
												},
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
													className: css.canvasTitleRow,
													children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: renaming !== void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(RenameField, {
														t,
														initial: active?.name ?? "",
														onCommit: (name) => {
															setRenaming(void 0);
															if (name !== "" && name !== active?.name) pipelines.rename(renaming, name);
														},
														onCancel: () => {
															setRenaming(void 0);
														}
													}) : active === void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
														className: css.canvasTitleBtn,
														children: t("pipeColumnLabel")
													}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
														type: "button",
														className: css.canvasTitleBtn,
														"data-canvas-title": "",
														"aria-expanded": menuOpen,
														"aria-haspopup": "menu",
														onClick: (event) => {
															event.stopPropagation();
															setMenuOpen(!menuOpen);
														},
														children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: active.name }), MARK.chev]
													}) }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
														className: css.chipState,
														"data-s": stand,
														"data-canvas-state": stand,
														children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
															className: css.dot,
															"data-s": stand
														}), t(`pipeStand_${stand}`)]
													})]
												}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
													type: "button",
													className: css.canvasMeta,
													"data-canvas-meta": "",
													"aria-label": t("pipeHistoryTitle"),
													disabled: active === void 0 || active.steps.length === 0,
													onClick: () => {
														setHistoryOpen(true);
														setHistoryAt(void 0);
													},
													children: active === void 0 ? t("pipeMetaNoPipeline") : metaOf(active)
												})]
											}), menuOpen ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
												className: css.canvasMenu,
												"data-title-menu": "",
												role: "menu",
												children: [
													pipelines.pipelines.map((pipeline) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
														type: "button",
														className: css.menuRow,
														role: "menuitem",
														"data-pipeline-row": pipeline.id,
														"aria-current": pipeline.id === active?.id,
														onClick: () => {
															setMenuOpen(false);
															setActiveId(pipeline.id);
															setFocus(void 0);
														},
														children: [
															/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
																className: css.dot,
																"data-s": standOfId(pipeline)
															}),
															/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
																className: css.menuRowMain,
																children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
																	className: css.menuRowTitle,
																	children: pipeline.name
																}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
																	className: css.menuRowSub,
																	children: t("pipeMenuSub", {
																		count: pipeline.steps.length,
																		state: t(`pipeStand_${standOfId(pipeline)}`)
																	})
																})]
															}),
															/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
																className: css.menuRowTail,
																children: formatWhen(pipeline.updatedAt, Date.now())
															})
														]
													}, pipeline.id)),
													/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
														type: "button",
														className: css.menuRow,
														role: "menuitem",
														"data-new-pipeline": "",
														onClick: () => {
															setMenuOpen(false);
															createPipeline();
														},
														children: [MARK.plus, /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
															className: css.menuRowMain,
															children: t("pipeNewPipeline")
														})]
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { className: css.menuSep }),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
														className: css.menuSect,
														children: t("pipeRailTasks")
													}),
													menuFacts.map((fact) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
														type: "button",
														className: css.menuRow,
														role: "menuitem",
														"data-card-row": fact.id,
														onClick: () => {
															setMenuOpen(false);
															setFocus({
																kind: "card",
																cardId: fact.id
															});
															setTab("result");
														},
														children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
															className: css.menuRowMain,
															children: fact.label
														}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
															className: css.menuRun,
															children: MARK.play
														})]
													}, fact.id)),
													/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
														type: "button",
														className: css.menuRow,
														role: "menuitem",
														"data-create-card": "",
														onClick: () => {
															setMenuOpen(false);
															onCreateCard();
														},
														children: [MARK.plus, /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
															className: css.menuRowMain,
															children: t("pipeCreateCard")
														})]
													}),
													active === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
														/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { className: css.menuSep }),
														/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
															type: "button",
															className: css.menuRow,
															role: "menuitem",
															onClick: () => {
																setMenuOpen(false);
																setRenaming(active.id);
															},
															children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
																className: css.menuRowMain,
																children: t("pipeRename")
															})
														}),
														/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
															type: "button",
															className: confirmDelete === active.id ? `${css.menuRow} ${css.hError}` : css.menuRow,
															role: "menuitem",
															"data-delete-pipeline": "",
															onClick: () => {
																if (confirmDelete !== active.id) {
																	setConfirmDelete(active.id);
																	return;
																}
																setConfirmDelete(void 0);
																setMenuOpen(false);
																pipelines.remove(active.id);
																setFocus(void 0);
															},
															children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
																className: css.menuRowMain,
																children: confirmDelete === active.id ? t("pipeDeleteConfirm") : t("pipeDelete")
															})
														})
													] })
												]
											}) : null]
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
											className: `${css.canvasScroll} ${css.scroll}`,
											children: active === void 0 || active.steps.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
												className: css.emptyFlow,
												"data-empty-pipeline": "",
												children: [
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
														className: css.emptyMark,
														children: MARK.plus
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h4", { children: active === void 0 ? t("pipeNoPipeline") : t("pipeEmptyTitle") }),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: active === void 0 ? t("pipeEmptyPipelineBody") : t("pipeEmptyBody") }),
													active === void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
														type: "button",
														className: `${css.btn} ${css.primary}`,
														"data-new-pipeline": "",
														onClick: createPipeline,
														children: [MARK.plus, t("pipeNewPipeline")]
													}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
														type: "button",
														className: `${css.btn} ${css.primary}`,
														"data-add-step": "0",
														onClick: () => {
															openPicker(0);
														},
														children: [MARK.plus, t("pipeAddFirstStep")]
													})
												]
											}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
												className: css.flow,
												children: [
													stepViews.map((step) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [step.index > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
														className: css.connector,
														children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
															type: "button",
															className: css.insertBtn,
															"data-insert-step": step.index,
															"aria-label": t("pipeInsertHere", { at: step.index + 1 }),
															onClick: () => {
																openPicker(step.index);
															},
															children: MARK.plus
														})
													}) : null, /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
														className: css.node,
														"data-node": step.index,
														"data-step-index": step.index,
														"data-s": step.phase,
														role: "button",
														tabIndex: 0,
														"aria-selected": step.index === selectedIndex,
														onClick: () => {
															setFocus({
																kind: "step",
																index: step.index
															});
															setStepMenu(void 0);
															setConfirmRemove(void 0);
														},
														onKeyDown: (event) => {
															if (event.key !== "Enter" && event.key !== " ") return;
															event.preventDefault();
															setFocus({
																kind: "step",
																index: step.index
															});
															setStepMenu(void 0);
														},
														children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
															className: css.nodeTop,
															children: [
																/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
																	className: css.nodeIndex,
																	children: String(step.index + 1).padStart(2, "0")
																}),
																stepRename === step.index ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(RenameField, {
																	className: css.nodeNameInput,
																	t,
																	label: t("pipeStepNameLabel"),
																	initial: step.label,
																	onCommit: (name) => {
																		commitStepRename(step.cardId, name);
																	},
																	onCancel: () => {
																		setStepRename(void 0);
																	}
																}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
																	className: css.nodeTitle,
																	children: step.label
																}),
																/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
																	className: css.nodeState,
																	children: [markOf(step.phase), stateText(step.phase)]
																}),
																/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
																	className: css.nodeDur,
																	children: step.phase === "running" ? "…" : formatDuration(step.tookMs)
																})
															]
														}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
															className: css.nodeFoot,
															"data-s": step.phase,
															children: [stepRename === step.index ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("pipeRenameHint") }) : footOf(step, t), step.runScope === "full" && step.runNo !== void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
																className: css.nodeRun,
																title: t("pipeRunOf", { no: step.runNo }),
																children: `#${String(step.runNo)}`
															}) : step.runScope === void 0 ? null : step.runNo === void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
																className: css.nodeRun,
																"data-solo": "1",
																title: t("pipeRunOfSingleNoTitle"),
																children: t("pipeRunOfSingleNo")
															}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
																className: css.nodeRun,
																"data-solo": "1",
																title: t("pipeRunOfSingleTitle", { no: step.runNo }),
																children: t("pipeRunOfSingle", { no: step.runNo })
															})]
														})]
													})] }, `${step.cardId}-${String(step.index)}`)),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { className: css.connectorShort }),
													/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
														type: "button",
														className: css.addStep,
														"data-add-step": String(active.steps.length),
														onClick: () => {
															openPicker(active.steps.length);
														},
														children: [
															MARK.plus,
															" ",
															t("pipeAddStep")
														]
													})
												]
											})
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
											className: css.stepStrip,
											role: "tablist",
											"aria-label": t("pipeTabsLabel"),
											children: stepViews.map((step) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
												type: "button",
												role: "tab",
												className: css.stepChip,
												"data-s": step.phase,
												"data-strip-step": step.index,
												"aria-selected": step.index === selectedIndex,
												onClick: () => {
													setFocus({
														kind: "step",
														index: step.index
													});
												},
												children: [
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("b", { children: String(step.index + 1).padStart(2, "0") }),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
														className: css.dot,
														"data-s": step.phase
													}),
													step.label
												]
											}, `strip-${step.cardId}`))
										})
									]
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("aside", {
									className: css.inspector,
									"data-inspector": "",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: css.inspHead,
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
												className: css.inspKicker,
												"data-insp-kicker": "",
												children: focus?.kind === "card" ? t("pipeCardKicker") : selected === void 0 ? t("pipeNoStepKicker") : t("pipeStepKicker", {
													at: selected.index + 1,
													count: active?.steps.length ?? 0,
													name: active?.name ?? ""
												})
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
												className: css.inspTitleRow,
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
													className: css.inspTitle,
													"data-insp-title": "",
													children: focus?.kind === "card" ? labelOf(focus.cardId) : selected?.label ?? t("pipeNoStep")
												}), selected === void 0 || focus?.kind === "card" ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
													type: "button",
													className: css.runOne,
													"data-run-one": "",
													disabled: running,
													onClick: () => {
														if (active !== void 0) run.runOne(active, selected.index);
													},
													children: [MARK.play, t("pipeRunOne")]
												}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
													type: "button",
													className: css.iconBtn,
													"aria-label": t("pipeStepMenu"),
													"aria-haspopup": "menu",
													"aria-expanded": stepMenu === selectedIndex,
													"data-step-menu-btn": "",
													onClick: () => {
														setStepMenu(stepMenu === selectedIndex ? void 0 : selectedIndex);
													},
													children: MARK.dots
												})] })]
											}),
											stepMenu !== void 0 && stepMenu === selectedIndex && selected !== void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
												className: css.stepMenu,
												role: "menu",
												"data-step-menu": "",
												children: [
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
														type: "button",
														className: css.stepMenuRow,
														role: "menuitem",
														"data-move-up": "",
														disabled: selected.index === 0,
														onClick: () => {
															setStepMenu(void 0);
															moveStep(selected.index, -1);
														},
														children: t("pipeMoveUp")
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
														type: "button",
														className: css.stepMenuRow,
														role: "menuitem",
														"data-move-down": "",
														disabled: selected.index === (active?.steps.length ?? 1) - 1,
														onClick: () => {
															setStepMenu(void 0);
															moveStep(selected.index, 1);
														},
														children: t("pipeMoveDown")
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { className: css.stepMenuSep }),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
														type: "button",
														className: css.stepMenuRow,
														role: "menuitem",
														"data-rename-step": "",
														onClick: () => {
															setConfirmRemove(void 0);
															setStepMenu(void 0);
															setStepRename(selected.index);
														},
														children: t("pipeRenameStep")
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
														type: "button",
														className: `${css.stepMenuRow} ${css.hError}`,
														role: "menuitem",
														"aria-label": confirmRemove === selected.index ? t("pipeRemoveStepArmed") : t("pipeRemoveStep"),
														"data-remove-step": "",
														"data-armed": confirmRemove === selected.index ? "" : void 0,
														onClick: () => {
															if (confirmRemove !== selected.index) {
																setConfirmRemove(selected.index);
																return;
															}
															setConfirmRemove(void 0);
															setStepMenu(void 0);
															removeStep(selected.index);
														},
														children: confirmRemove === selected.index ? t("pipeRemoveStepArmed") : t("pipeRemoveStep")
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
														className: css.stepMenuNote,
														children: confirmRemove === selected.index ? t("pipeRemoveNoteName", { name: selected.label }) : t("pipeRemoveNote")
													})
												]
											}) : null,
											selected === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
												className: css.inspMeta,
												"data-insp-meta": "",
												children: [
													selected.skill === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", {
														className: css.mono,
														children: selected.skill
													}),
													selected.card?.model === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: `${selected.card.model.provider}/${selected.card.model.model}` }),
													/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
														className: css.chipTag,
														"data-s": selected.phase,
														children: [markOf(selected.phase), stateText(selected.phase)]
													})
												]
											}),
											focus?.kind === "card" ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
												className: css.inspTabs,
												role: "tablist",
												"aria-label": t("pipeTabsLabel"),
												children: [
													"activity",
													"config",
													"result"
												].map((key) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
													type: "button",
													role: "tab",
													className: css.inspTab,
													"data-insp-tab": key,
													"aria-selected": tab === key,
													"aria-controls": `pipe-panel-${key}`,
													tabIndex: tab === key ? 0 : -1,
													onClick: () => {
														setTab(key);
													},
													children: [t(TAB_KEY[key]), key === "activity" && selected?.result !== void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("em", { children: selected.result.activity?.length ?? 0 }) : null]
												}, key))
											})
										]
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: `${css.inspScroll} ${css.scroll}`,
										children: focus?.kind === "card" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
											className: css.resultPanel,
											"data-panel": "card",
											children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
												className: css.cfgBlock,
												children: [
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
														className: css.cfgBlockHead,
														children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("pipeCardPanel") })
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
														className: css.hint,
														children: t("pipeCardPanelNote")
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
														type: "button",
														className: `${css.btn} ${css.ghost}`,
														"data-open-card": "",
														onClick: () => {
															openReader(focus.cardId);
														},
														children: t("pipeOpenResult")
													})
												]
											})
										}) : selected === void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
											className: css.resultPanel,
											"data-panel": "empty",
											children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
												className: css.stateBlock,
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h6", { children: t("pipeEmptyPanelTitle") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("pipeEmptyPanelBody") })]
											})
										}) : tab === "activity" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
											className: css.activityPanel,
											id: "pipe-panel-activity",
											role: "tabpanel",
											"data-panel": "activity",
											children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ActivityPanel, {
												step: selected,
												t,
												onOpenCard: () => {
													openReader(selected.cardId);
												}
											})
										}) : tab === "config" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
											className: css.configPanel,
											id: "pipe-panel-config",
											role: "tabpanel",
											"data-panel": "config",
											children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ConfigPanel, {
												step: selected,
												shared: stepViews[0]?.card,
												models: modelGroups,
												skills: catalog,
												onPickWorkspace: workspacePicker === void 0 || !canPickWorkspace ? void 0 : () => {
													chooseWorkspaceForSteps();
												},
												problem: configProblem,
												t,
												onSaveTemplate: (html) => {
													const skill = selected.skill;
													if (skill === void 0) return;
													saveStepTemplate(selected.cardId, html, skill).then((written) => {
														if (!written) {
															setConfigProblem(t("pipeCfgWriteFailed"));
															return;
														}
														setConfigProblem(void 0);
														reload();
													});
												},
												onPatch: applyPatch
											})
										}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
											className: css.resultPanel,
											id: "pipe-panel-result",
											role: "tabpanel",
											"data-panel": "result",
											children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ResultPanel, {
												step: selected,
												t,
												template: cards.find((card) => card.cardId === selected.cardId)?.template,
												listFiles: api.listFiles,
												onOpen: (file) => {
													openReader(selected.cardId, file);
												},
												onRun: () => {
													if (active !== void 0) run.runOne(active, selected.index);
												}
											})
										})
									})]
								})]
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: css.runbar,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: css.segBar,
										children: stepViews.map((step) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("i", {
											"data-seg": String(step.index),
											"data-s": segState(step.phase)
										}, `seg-${step.cardId}`))
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: css.runNoise,
										"data-run-noise": chain?.phase ?? "idle",
										children: runNoise()
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: css.runActions,
										children: running ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: `${css.btn} ${css.ghost}`,
											"data-stop": "",
											onClick: () => {
												run.stop();
											},
											children: t("pipeStop")
										}) : null
									})
								]
							})]
						})
					}),
					reader === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: css.zoomWrap,
						"data-reader": reader.cardId,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: css.zoomScrim,
							onClick: () => {
								setReader(void 0);
							}
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: css.zoom,
							role: "dialog",
							"aria-modal": "true",
							"aria-labelledby": "pipe-zoom-title",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: css.zoomHead,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: css.zoomKicker,
										id: "pipe-zoom-title",
										children: t("pipeReaderTitle")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: css.zoomMeta,
										children: labelOf(reader.cardId)
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: css.zoomHint,
										children: t("pipeEscHint")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: `${css.btn} ${css.ghost} ${css.zoomReview}`,
										"data-review-open": "",
										onClick: () => {
											setReview({ cardId: reader.cardId });
											setReviewText("");
										},
										children: t("pipeReviewTitle")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: css.iconBtn,
										"aria-label": t("pipeClose"),
										"data-reader-back": "",
										onClick: () => {
											setReader(void 0);
										},
										children: MARK.x
									})
								]
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: css.zoomBody,
								children: renderCard(reader.cardId, "result", () => {
									setReader(void 0);
								}, reader.file)
							})]
						})]
					}),
					historyOpen ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: css.zoomWrap,
						"data-history": "",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: css.zoomScrim,
							onClick: () => {
								setHistoryOpen(false);
							}
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: css.zoom,
							role: "dialog",
							"aria-modal": "true",
							"aria-labelledby": "pipe-hist-title",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: css.zoomHead,
								children: [
									historyAt === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: `${css.iconBtn} ${css.histBack}`,
										"aria-label": t("pipeHistoryBack"),
										onClick: () => {
											setHistoryAt(void 0);
										},
										children: MARK.back
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: css.zoomKicker,
										id: "pipe-hist-title",
										"data-hist-title": "",
										children: historyAt === void 0 ? t("pipeHistoryTitle") : t("pipeHistoryRun", { no: history[historyAt]?.no ?? 0 })
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: css.zoomMeta,
										"data-hist-meta": "",
										children: historyAt === void 0 ? history.length === 0 ? t("pipeHistoryEmptyMeta") : t("pipeHistoryCount", { count: history.length }) : runMetaOf(history[historyAt])
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: css.zoomHint,
										children: t("pipeEscHint")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: css.iconBtn,
										"aria-label": t("pipeClose"),
										onClick: () => {
											setHistoryOpen(false);
										},
										children: MARK.x
									})
								]
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: css.histBody,
								children: historyAt === void 0 ? history.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: css.stateBlock,
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("pipeHistoryEmpty") })
								}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { children: history.map((entry, at) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
									type: "button",
									className: css.histRow,
									"data-hist-run": at,
									onClick: () => {
										setHistoryAt(at);
									},
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: css.histNo,
											children: `#${String(entry.no)}`
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: css.histWhen,
											children: formatWhen(entry.startedAt, Date.now())
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: css.histSum,
											children: runScopeOf(entry)
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: css.histTook,
											children: formatDuration(entry.tookMs)
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: css.histBadge,
											"data-s": runStateOf(entry.phase).s,
											children: t(runStateOf(entry.phase).key)
										})
									]
								}, `hist-${String(entry.no)}`)) }) : (history[historyAt]?.steps ?? []).map((step, at) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: css.hStep,
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
										type: "button",
										className: css.hStepHead,
										"data-hist-step": at,
										onClick: () => {
											setHistoryOpen(false);
											openReader(step.cardId);
										},
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: css.hStepNo,
												children: String(at + 1)
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: css.hStepName,
												children: labelOf(step.cardId)
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: css.hStepMeta,
												children: productLine(step.html, t)
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: css.hStepTook,
												children: formatDuration(step.tookMs)
											})
										]
									})
								}, `hist-step-${String(at)}`))
							})]
						})]
					}) : null,
					review === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: css.reviewWrap,
						"data-review": "",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: css.reviewScrim,
							onClick: () => {
								setReview(void 0);
							}
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: css.review,
							role: "dialog",
							"aria-modal": "true",
							"aria-label": t("pipeReviewTitle"),
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: css.reviewHead,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: css.reviewTitle,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("pipeReviewTitle") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("em", { children: t("pipeReviewSubtitle") })]
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: css.reviewWho,
										children: labelOf(review.cardId)
									})]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: css.reviewBody,
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
											className: css.reviewArea,
											rows: 3,
											value: reviewText,
											"data-review-text": "",
											placeholder: t("pipeReviewPlaceholder"),
											onChange: (event) => {
												setReviewText(event.target.value);
											}
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
											className: css.reviewChips,
											children: [
												"pipeChipEdges",
												"pipeChipTable",
												"pipeChipShorter"
											].map((key) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
												type: "button",
												className: css.reviewChip,
												onClick: () => {
													setReviewText((prev) => prev.trim() === "" ? t(key) : `${prev}，${t(key)}`);
												},
												children: t(key)
											}, key))
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
											className: css.reviewNote,
											children: t("pipeReviewWarn")
										})
									]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: css.reviewFoot,
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { className: css.spacer }),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: `${css.btn} ${css.ghost}`,
											onClick: () => {
												setReview(void 0);
											},
											children: t("pipeCancel")
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: `${css.btn} ${css.primary}`,
											"data-review-submit": "",
											disabled: reviewText.trim() === "",
											onClick: () => {
												const at = stepViews.findIndex((step) => step.cardId === review.cardId);
												const instruction = reviewText.trim();
												setReview(void 0);
												setReviewText("");
												if (active === void 0 || at < 0 || instruction === "") return;
												setReader(void 0);
												run.refine(active, at, instruction);
											},
											children: t("pipeRegenerate")
										})
									]
								})
							]
						})]
					}),
					picker === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: css.pickerWrap,
						"data-picker": "",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: css.pickerScrim,
							onClick: () => {
								setPicker(void 0);
							}
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: css.picker,
							role: "dialog",
							"aria-modal": "true",
							"aria-labelledby": "pipe-picker-title",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: css.pickerHead,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: css.pickerTitle,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										id: "pipe-picker-title",
										"data-picker-title": "",
										children: t("pipePickerTitle")
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("em", { children: t("pipePickerAt", { at: picker.at + 1 }) })]
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
									className: css.searchField,
									children: [MARK.search, /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										type: "text",
										autoFocus: true,
										value: pickerQuery,
										"data-picker-search": "",
										placeholder: t("pipePickerSearch"),
										autoComplete: "off",
										onChange: (event) => {
											setPickerQuery(event.target.value);
										}
									})]
								})]
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: css.pickerList,
								children: [
									pickerRows.map((entry) => {
										const used = usedSkills.has(entry.name);
										return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
											type: "button",
											className: css.pickerRow,
											"data-pick-skill": entry.name,
											disabled: used,
											onClick: () => {
												addSkillStep(entry.name);
											},
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
												className: css.pickerRowMain,
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													className: css.pickerRowTitle,
													children: entry.name
												}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													className: css.pickerRowDesc,
													children: entry.description
												})]
											}), used ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: css.pickerUsed,
												children: t("pipePickerUsed")
											}) : MARK.plus]
										}, entry.name);
									}),
									pickerRows.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
										className: css.pickerEmpty,
										children: pickerEmptyText()
									}) : null,
									pickerProblem === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
										className: css.pickerProblem,
										"data-picker-problem": "",
										children: pickerProblem
									})
								]
							})]
						})]
					})
				]
			});
		}
		/**
		* Render one step's foot line: what it produced, or why it stopped.
		* @param step - the step.
		* @param t - translator.
		* @returns the line.
		*/
		function footOf(step, t) {
			if (step.phase === "failed") return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [MARK.warn, /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: step.failure ?? t("pipeFailed") })] });
			if (step.phase === "queued") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("pipeQueued", { at: step.index }) });
			if (step.phase === "running") return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
				className: css.nodeProg,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("i", {})
			}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("pipeWorking") })] });
			if (step.phase === "stopped") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("pipeStepState_stopped") });
			if (step.phase === "idle") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("pipeNeverRan") });
			if (step.product.kind === "directory") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: step.product.path });
			if (step.product.kind === "inline") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: step.product.text });
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("pipeNoProduct") });
		}
		/**
		* Read one run step's product as a single line.
		* @param html - the step's stored region.
		* @param t - translator.
		* @returns the path for a directory product, otherwise what the region is.
		*/
		function productLine(html, t) {
			const product = productOf(html);
			if (product.kind === "directory") return product.path;
			return product.kind === "inline" ? t("pipeInlineProduct") : t("pipeNoProduct");
		}
		/** The marks a state is drawn with, so colour is never the only signal. */
		var MARK = {
			slot: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
				viewBox: "0 0 16 16",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.5",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("rect", {
					x: "3.4",
					y: "3.4",
					width: "9.2",
					height: "9.2",
					rx: "1"
				})
			}),
			dash: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
				viewBox: "0 0 16 16",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.4",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
					cx: "8",
					cy: "8",
					r: "5.3",
					strokeDasharray: "2.2 2.2"
				})
			}),
			clock: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				viewBox: "0 0 16 16",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.5",
				strokeLinecap: "round",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
					cx: "8",
					cy: "8",
					r: "5.7"
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M8 4.8V8l2.2 1.4" })]
			}),
			file: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				viewBox: "0 0 16 16",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.4",
				strokeLinecap: "round",
				strokeLinejoin: "round",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M9.2 2.4H4.6a1 1 0 0 0-1 1v9.2a1 1 0 0 0 1 1h6.8a1 1 0 0 0 1-1V5.6z" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M9.2 2.4v3.2h3.2" })]
			}),
			check: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
				viewBox: "0 0 16 16",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.7",
				strokeLinecap: "round",
				strokeLinejoin: "round",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "m3.6 8.4 2.8 2.6 5.9-6" })
			}),
			warn: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				viewBox: "0 0 16 16",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.5",
				strokeLinecap: "round",
				strokeLinejoin: "round",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M8 2.6l5.6 9.8H2.4z" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M8 6.2v3.2M8 11.2v.1" })]
			}),
			x: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
				viewBox: "0 0 16 16",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.6",
				strokeLinecap: "round",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M4.4 4.4l7.2 7.2M11.6 4.4l-7.2 7.2" })
			}),
			plus: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
				viewBox: "0 0 16 16",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.5",
				strokeLinecap: "round",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M8 3.4v9.2M3.4 8h9.2" })
			}),
			play: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
				viewBox: "0 0 16 16",
				fill: "currentColor",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M4.6 2.9c0-.5.5-.8.9-.6l7.1 4.2c.4.2.4.8 0 1l-7.1 4.2c-.4.2-.9-.1-.9-.6z" })
			}),
			chev: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
				viewBox: "0 0 16 16",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.6",
				strokeLinecap: "round",
				strokeLinejoin: "round",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "m4.4 6.4 3.6 3.4 3.6-3.4" })
			}),
			search: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				viewBox: "0 0 16 16",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.5",
				strokeLinecap: "round",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
					cx: "7.2",
					cy: "7.2",
					r: "4.4"
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "m10.6 10.6 2.6 2.6" })]
			}),
			dots: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				viewBox: "0 0 16 16",
				fill: "currentColor",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
						cx: "3.4",
						cy: "8",
						r: "1.15"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
						cx: "8",
						cy: "8",
						r: "1.15"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
						cx: "12.6",
						cy: "8",
						r: "1.15"
					})
				]
			}),
			back: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
				viewBox: "0 0 16 16",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.6",
				strokeLinecap: "round",
				strokeLinejoin: "round",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M9.6 3.6 5.2 8l4.4 4.4" })
			})
		};
		/** Tab titles by tab. */
		var TAB_KEY = {
			activity: "pipeTabActivity",
			config: "pipeTabConfig",
			result: "pipeTabResult"
		};
		/** What one step's activity panel shows: what it did, in order. */
		function ActivityPanel(props) {
			const { step, t, onOpenCard } = props;
			const activity = step.result?.activity ?? [];
			if (step.phase === "running") return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: css.stateBlock,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h6", { children: t("pipeActivityRunning") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("pipeActivityRunningBody") })]
			});
			if (step.phase === "failed") return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: css.stateBlock,
				"data-tone": "danger",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h6", { children: t("pipeActivityFailed") }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: step.failure ?? t("pipeNoProduct") }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: `${css.btn} ${css.ghost}`,
						onClick: onOpenCard,
						children: t("pipeOpenRuns")
					})
				]
			});
			if (activity.length === 0) return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: css.stateBlock,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h6", { children: t("pipeActivityNone") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("pipeActivityNoneBody") })]
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: css.actList,
				children: activity.map((entry, at) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: css.act,
					"data-kind": entry.kind,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: css.actIcon,
						children: entry.kind === "tool" ? MARK.dash : MARK.clock
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: css.actBody,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: css.actTop,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: css.actName,
								children: entry.kind === "tool" ? entry.tool : entry.kind === "truncated" ? t("pipeActivityTruncated") : t("pipeActivityNarration")
							}), entry.kind === "tool" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: css.actArg,
								children: entry.argument
							}) : null]
						}), entry.kind === "tool" ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: css.actMsg,
							children: entry.kind === "truncated" ? "" : entry.text
						})]
					})]
				}, `act-${String(at)}`))
			});
		}
		/** What one step's config panel shows: what it is, and what its document looks like. */
		function ConfigPanel(props) {
			const { step, shared, models, skills, t, onSaveTemplate, onPatch, onPickWorkspace, problem } = props;
			const template = step.card?.template;
			const [draft, setDraft] = (0, react.useState)(template ?? "");
			(0, react.useEffect)(() => {
				setDraft(template ?? "");
			}, [template]);
			const [view, setView] = (0, react.useState)("preview");
			const placeholder = regionPlaceholder(template ?? "", t("pipeCfgRegion"), t("pipeCfgRegionBody"));
			const rendered = template === void 0 ? "" : filledTemplate(template, placeholder);
			const regionInTemplate = template !== void 0 && rendered !== template;
			const model = shared?.model;
			const permission = shared?.permission ?? "workspace-write";
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: css.cfgBlock,
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: css.cfgBlockHead,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("pipeCfgPipeline") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("em", { children: t("pipeCfgPipelineNote") })]
						}),
						problem === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: css.cfgProblem,
							"data-cfg-problem": true,
							children: problem
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: css.ruleRow,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: css.ruleLabel,
								children: t("pipeCfgModel")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: css.ruleValue,
								children: [models.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: css.val,
									children: model === void 0 ? t("pipeCfgModelInherit") : `${model.provider}/${model.model}`
								}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
									className: css.ruleSelect,
									"data-cfg-model": "",
									"aria-label": t("pipeCfgModel"),
									value: model === void 0 ? "" : modelKey(model),
									onChange: (event) => {
										onPatch({ model: event.target.value === "" ? null : parseModelKey(event.target.value) ?? null });
									},
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
										value: "",
										children: t("pipeCfgModelInherit")
									}), models.map((group) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("optgroup", {
										label: group.name,
										children: group.models.map((entry) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
											value: modelKey({
												provider: group.id,
												model: entry.id
											}),
											children: entry.name
										}, entry.id))
									}, group.id))]
								}), model === void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: css.hint,
									children: t("pipeCfgModelInheritNote")
								}) : null]
							})]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: css.ruleRow,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: css.ruleLabel,
								children: t("pipeCfgPermission")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: css.ruleValue,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("select", {
									className: css.ruleSelect,
									"data-cfg-permission": "",
									"aria-label": t("pipeCfgPermission"),
									value: permission,
									onChange: (event) => {
										const next = event.target.value;
										if (next === "read-only" || next === "workspace-write" || next === "danger-full-access") onPatch({ permission: next });
									},
									children: PERMISSION_ORDER.map((mode) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
										value: mode,
										children: t(permissionLabelKey(mode))
									}, mode))
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: css.hint,
									children: t("pipeCfgPermissionNote")
								})]
							})]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: css.ruleRow,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: css.ruleLabel,
								children: t("pipeCfgWorkspace")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: css.ruleValue,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
									type: "button",
									className: css.rulePath,
									"data-cfg-workspace": "",
									"aria-label": t("pipeCfgWorkspacePick"),
									disabled: onPickWorkspace === void 0,
									onClick: () => {
										onPickWorkspace?.();
									},
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: `${css.rulePathText} ${shared?.workspace === void 0 ? "" : css.mono}`,
										children: shared?.workspace?.path ?? t("pipeCfgNoWorkspace")
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: css.rulePathPick,
										children: onPickWorkspace === void 0 ? t("pipeCfgWorkspaceNoPicker") : t("pipeCfgWorkspacePick")
									})]
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: css.hint,
									children: t("pipeCfgWorkspaceNote")
								})]
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: css.cfgBlock,
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: css.cfgBlockHead,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("pipeCfgStep") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("em", { children: t("pipeCfgStepNote", { at: step.index + 1 }) })]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: css.ruleRow,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: css.ruleLabel,
								children: t("pipeCfgSkill")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: css.ruleValue,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
									className: css.ruleSelect,
									"data-cfg-skill": "",
									"aria-label": t("pipeCfgSkill"),
									value: shared?.skill ?? "",
									onChange: (event) => {
										const next = event.target.value;
										onPatch({ skill: next === "" ? null : next });
									},
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
										value: "",
										children: t("pipeCfgNoSkill")
									}), skills.filter((entry) => entry.userInvocable).map((entry) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
										value: entry.name,
										children: entry.name
									}, entry.name))]
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: css.hint,
									children: shared?.skill === void 0 ? t("pipeCfgSkillNoNote") : skills.find((entry) => entry.name === shared.skill)?.description ?? t("pipeCfgSkillNoNote")
								})]
							})]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: css.ruleRow,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: css.ruleLabel,
								children: t("pipeCfgInstruction")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: css.ruleValue,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
									className: css.ruleArea,
									"data-cfg-instruction": "",
									"aria-label": t("pipeCfgInstruction"),
									rows: 2,
									spellCheck: false,
									defaultValue: shared?.instruction ?? "",
									onBlur: (event) => {
										const next = event.currentTarget.value.trim();
										if (next === (shared?.instruction ?? "")) return;
										onPatch({ instruction: next === "" ? null : next });
									}
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: css.hint,
									children: t("pipeCfgInstructionNote")
								})]
							})]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: css.ruleRow,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: css.ruleLabel,
								children: t("pipeCfgFailure")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: css.ruleValue,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: css.val,
									children: t("pipeCfgFailureStop")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: css.hint,
									children: t("pipeCfgFailureNote")
								})]
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: css.cfgBlock,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: css.cfgBlockHead,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("pipeCfgTemplate") }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							className: css.segTiny,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								"data-cfg-view": "preview",
								"aria-pressed": view === "preview",
								onClick: () => {
									setView("preview");
								},
								children: t("pipeCfgPreview")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								"data-cfg-view": "source",
								"aria-pressed": view === "source",
								onClick: () => {
									setView("source");
								},
								children: t("pipeCfgSource")
							})]
						})]
					}), view === "preview" ? template === void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: css.hint,
						"data-cfg-empty": "",
						children: t("pipeCfgNoTemplate")
					}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: css.tplSlotLabel,
							"data-cfg-preview-note": "",
							children: t("pipeCfgPreviewNote")
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: css.tplPreviewBody,
							"data-cfg-preview": "",
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ShadowHtml, {
								html: rendered,
								className: css.tplPreviewFrame
							})
						}),
						regionInTemplate ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: css.tplRegion,
							"data-cfg-region": "",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: css.tplRegionTag,
								children: t("pipeCfgRegion")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: css.tplRegionText,
								children: t("pipeCfgRegionBody")
							})]
						})
					] }) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
						className: css.docSrc,
						"data-cfg-template": "",
						"aria-label": t("pipeCfgSource"),
						spellCheck: false,
						placeholder: t("pipeCfgNoTemplate"),
						value: draft,
						onChange: (event) => {
							setDraft(event.target.value);
						},
						onBlur: () => {
							if (draft.trim() === "" || draft === template) return;
							onSaveTemplate(draft);
						}
					})]
				})
			] });
		}
		/** What one step's result panel shows: what it handed over, and how to read it. */
		function ResultPanel(props) {
			const { step, t, template, listFiles, onOpen, onRun } = props;
			if (step.phase === "running") return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: css.stateBlock,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h6", { children: t("pipeResultRunning") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("pipeResultRunningBody") })]
			});
			if (step.phase === "queued") return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: css.stateBlock,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h6", { children: t("pipeResultQueued") }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("pipeResultQueuedBody", { at: step.index }) }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: `${css.btn} ${css.ghost}`,
						onClick: onRun,
						children: t("pipeRunThisStep")
					})
				]
			});
			if (step.phase === "failed") return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: css.stateBlock,
				"data-tone": "danger",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h6", { children: t("pipeResultFailed") }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: step.failure ?? t("pipeNoProduct") }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: `${css.btn} ${css.ghost}`,
						onClick: onRun,
						children: t("pipeRetryStep")
					})
				]
			});
			if (step.phase === "idle" || step.result === void 0) return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: css.stateBlock,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h6", { children: t("pipeResultNone") }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("pipeResultNoneBody") }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: `${css.btn} ${css.ghost}`,
						onClick: onRun,
						children: t("pipeRunOne")
					})
				]
			});
			const product = step.product;
			const summary = product.kind === "inline" && product.text !== "" ? product.text : t("pipeInlineProduct");
			const dir = resultDirectory(template, product);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: css.resBlock,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: css.resBlockHead,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("pipeResultWhat") }), dir === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("em", { children: dir })]
					}),
					step.result.editedAt === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: css.revised,
						"data-edited": "",
						children: t("pipeResultEdited")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: css.resList,
						children: dir === void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							className: css.resOpen,
							"data-open-result": "",
							onClick: () => {
								onOpen();
							},
							children: [
								MARK.file,
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("pipeResultOpenInline") }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("em", {
									"data-result-summary": "",
									children: summary
								}),
								MARK.chev
							]
						}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ResultFiles, {
							cardId: step.cardId,
							dir,
							t,
							listFiles,
							onOpen
						})
					})
				]
			});
		}
		/**
		* One row per file the result's directory holds, and the row that opens the reader.
		*
		* The directory is listed once and the rows are drawn from it, because "3 个文件" is a fact
		* the panel would otherwise state without naming them. Reading is the first state rather
		* than a spinner: the directory row is already a working way into the reader, so the list
		* arriving late replaces a usable row instead of gating it.
		*/
		function ResultFiles(props) {
			const { cardId, dir, t, listFiles, onOpen } = props;
			const [read, setRead] = (0, react.useState)({ phase: "reading" });
			(0, react.useEffect)(() => {
				let live = true;
				setRead({ phase: "reading" });
				listFiles(cardId, dir).then((result) => {
					if (!live) return;
					if (result.status !== "ok") {
						setRead({
							phase: "failed",
							reason: result.reason
						});
						return;
					}
					setRead({
						phase: "ready",
						files: result.listing.entries.filter((entry) => entry.type === "file")
					});
				});
				return () => {
					live = false;
				};
			}, [
				cardId,
				dir,
				listFiles
			]);
			const wholeDirectory = /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
				type: "button",
				className: css.resItem,
				"data-open-result": "",
				onClick: () => {
					onOpen();
				},
				children: [
					MARK.file,
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: css.resItemName,
						children: baseName(dir)
					}),
					MARK.chev
				]
			});
			if (read.phase !== "ready" || read.files.length === 0) return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [wholeDirectory, read.phase === "failed" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				className: css.resProblem,
				"data-files-problem": "",
				children: t("pipeResultFilesProblem", { reason: read.reason })
			}) : null] });
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(react_jsx_runtime.Fragment, { children: read.files.map((entry) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
				type: "button",
				className: css.resItem,
				"data-result-file": entry.path,
				onClick: () => {
					onOpen(entry.path);
				},
				children: [
					MARK.file,
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: css.resItemName,
						children: entry.name
					}),
					entry.size === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("em", {
						className: css.resItemSize,
						"data-result-size": "",
						children: formatBytes(entry.size)
					}),
					MARK.chev
				]
			}, entry.path)) });
		}
		/**
		* The last segment of a stored path, for a row that names one file.
		* @param path - an absolute path in either separator.
		* @returns the last segment, or the path when it has none.
		*/
		function baseName(path) {
			const parts = path.split(/[\\/]/).filter((part) => part !== "");
			return parts[parts.length - 1] ?? path;
		}
		/** The inline rename field: Enter or blur commits, Escape abandons. */
		function RenameField(props) {
			const { initial, onCommit, onCancel, t, className, label } = props;
			const [value, setValue] = (0, react.useState)(initial);
			const [abandoned, setAbandoned] = (0, react.useState)(false);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
				className: className ?? css.renameInput,
				value,
				"aria-label": label ?? t("pipeRenameLabel"),
				maxLength: 24,
				autoFocus: true,
				onChange: (event) => {
					setValue(event.target.value);
				},
				onKeyDown: (event) => {
					event.stopPropagation();
					if (event.key === "Enter") onCommit(value.trim());
					if (event.key === "Escape") {
						setAbandoned(true);
						onCancel();
					}
				},
				onBlur: () => {
					if (!abandoned) onCommit(value.trim());
				}
			});
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
		//#region src/client/skill-card/TemplatePreview.tsx
		/**
		* The card's template, drawn: what 预览 opens.
		*
		* The configuration page used to keep a live copy of this beside the editor, which meant a
		* shadow root per keystroke and — for a template that reads the workspace — a directory read
		* starting before the user had touched anything. The document is worth seeing, but it is
		* worth seeing on request, in a window of its own where it can be as tall as it likes
		* without stealing the editor's width.
		*
		* What is drawn is the draft, not the stored template: a user previewing a change wants the
		* change. Nothing here saves it.
		* @module dsh-workbench/client/skill-card/TemplatePreview
		*/
		/**
		* Render the preview over the configuration page.
		* @param props - the document, its caption, the translator, and the way out.
		* @returns the preview dialog, portalled to the document body.
		*/
		function TemplatePreviewDialog({ html, caption, t, onClose }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Dialog, {
				title: t("skillCardPreview"),
				hint: caption,
				closeLabel: t("promptClose"),
				size: "wide",
				onClose,
				footer: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
					variant: "ghost",
					size: "md",
					onClick: onClose,
					children: t("skillCardClose")
				}),
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: skill_card_module_default.previewFrame,
					"data-template-preview-body": "",
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ShadowHtml, {
						html,
						className: skill_card_module_default.preview
					})
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
			const { view, t, onChoose, onChooseModel, onChoosePermission, onChooseInstructionMode, onChooseWorkspace, onSetWorkspace, onSave, onRename, onClose, onDelete } = props;
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
			const analysis = (0, react.useMemo)(() => analyzeTemplate(draft), [draft]);
			const gutter = (0, react.useRef)(null);
			const editor = (0, react.useRef)(null);
			const escaped = (0, react.useRef)(false);
			const dirty = draft !== (view.template ?? "") || name !== (view.name ?? "");
			const [previewOpen, setPreviewOpen] = (0, react.useState)(false);
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
											onChooseWorkspace,
											onSetWorkspace
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
										draft.trim() === "" ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
											regionLines === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
												variant: "outline",
												size: "sm",
												"data-template-jump": "",
												onClick: jumpToTemplate,
												children: t("skillCardTemplateJump")
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
												variant: "outline",
												size: "sm",
												"aria-pressed": folded,
												onClick: () => {
													setFolded((value) => !value);
												},
												children: folded ? t("skillCardTemplateEditView") : t("skillCardTemplateFoldView")
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
												variant: "outline",
												size: "sm",
												"data-template-preview": "",
												onClick: () => {
													setPreviewOpen(true);
												},
												children: t("skillCardPreview")
											})
										] }),
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
					previewOpen ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(TemplatePreviewDialog, {
						html: draft,
						caption: regionEmpty ? t("skillCardPreviewSample") : t("skillCardPreviewLive"),
						t,
						onClose: () => {
							setPreviewOpen(false);
						}
					}) : null,
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
		function ActionPanel({ pending, workspaceProblem, t, onSetWorkspace, onConfirm, onCancel }) {
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
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("actionFieldWorkspace") }),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("dd", {
							"data-action-field": "workspace",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								"data-action-workspace": "",
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(WorkspacePathField, {
									value: pending.workspace,
									fieldKind: "ready",
									problem: workspaceProblem,
									t,
									onCommit: onSetWorkspace
								})
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: skill_card_module_default.fieldNote,
								"data-action-workspace-note": "",
								children: t("actionWorkspaceNote")
							})]
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
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(RunProblemLines, {
						view,
						t
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
			const running = run.stopReason === "running";
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
								headline === void 0 ? running ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: skill_card_module_default.runHistoryTitle,
									"data-run-history-pending": "",
									children: t("runHistoryRunningTitle")
								}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
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
			const { api, cardId, runSessionId, pickerSessionId, models, workspacePicker, fallbackTitle, onBack, openCard, t, documents, openFile } = props;
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
						meta: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [view.skill === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: skill_card_module_default.pageHeadChip,
							children: view.skill
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(RunWorkspaceLine, {
							view,
							t
						})] })
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
								documents,
								openFile
							})
						})
					}) }) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ActionPanel, {
						pending: view.pendingAction,
						workspaceProblem: view.actionWorkspaceProblem,
						t,
						onSetWorkspace: actions.setActionWorkspace,
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
											setPrompt("fresh");
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
					prompt === "fresh" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(RunPrompt, {
						cardId,
						title: t("resultFreshMode"),
						view,
						mode: view.instructionMode,
						recent: view.recentInstructions,
						t,
						onChooseWorkspace: actions.chooseWorkspace,
						onSetWorkspace: actions.setWorkspace,
						onRun: (instruction) => {
							actions.run(instruction);
							setPrompt(void 0);
						},
						onCancel: () => {
							setPrompt(void 0);
						}
					}) : null,
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(RunProblemLines, {
						view,
						t
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
					onSetWorkspace: actions.setWorkspace,
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
		* The workbench panel page: its head, and the pipeline workbench below it.
		*
		* The panel is one surface with two states. Normally it is the pipeline workbench — the
		* rail, the canvas and the inspector. When something outside the panel opens a card's own
		* view (a card action whose target is another card), that view takes the whole surface and
		* the workbench stands behind it, which is what the injected `selection` says.
		* @module dsh-workbench/client/WorkbenchPage
		*/
		/** Owner where a user-created card instance sorts before any stored position. */
		var INSTANCE_ORDER_BASE = 1e4;
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
		* @param props - owner props, injected cards and transports, and `t`.
		* @returns the page element.
		*/
		function WorkbenchPage(props) {
			const { useCards, useSelection, skillCards, pipelines: pipelineApi, closeCard, openCard, t } = props;
			const cards = useCards((snapshot) => snapshot);
			const selection = useSelection((snapshot) => snapshot);
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
			const labelOf = (0, react.useMemo)(() => {
				const labels = new Map(facts.map((card) => [card.id, card.label]));
				return (id) => {
					const label = labels.get(id);
					return label === void 0 || label.length === 0 ? id : label;
				};
			}, [facts]);
			const createCard = (0, react.useCallback)(() => {
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
			const [catalog, setCatalog] = (0, react.useState)([]);
			const [catalogStatus, setCatalogStatus] = (0, react.useState)("idle");
			const [catalogFailure, setCatalogFailure] = (0, react.useState)(void 0);
			const catalogTicket = (0, react.useRef)(0);
			const reloadCatalog = (0, react.useCallback)(() => {
				catalogTicket.current += 1;
				const mine = catalogTicket.current;
				setCatalogStatus("loading");
				skillCards.api.catalog(skillCards.runSessionId()).then((result) => {
					if (catalogTicket.current !== mine) return;
					if (result.status === "ok") {
						setCatalog(result.entries.filter((entry) => entry.userInvocable));
						setCatalogStatus("ready");
						setCatalogFailure(void 0);
						return;
					}
					setCatalogStatus("failed");
					setCatalogFailure(result.code);
				});
			}, [skillCards.api, skillCards.runSessionId]);
			(0, react.useEffect)(() => {
				reloadCatalog();
			}, [reloadCatalog]);
			/**
			* Send one card write, and retry it once when the revision it names is out of date.
			*
			* The page's revision is only as fresh as the last snapshot it applied, and another writer
			* moves it: a finished run stores its result in the same domain, so every cached revision
			* of the card store is out of date the moment a step finishes. Treating that as a failure
			* is what made "add a step" do nothing at all after a run — the write was refused as a
			* conflict and the refusal was dropped. A conflict is answered with the state the Host
			* really holds, so the page can adopt it and ask once more.
			* @param send - builds the write for one base revision.
			* @returns the write that landed, or the last refusal.
			*/
			const writeCard = (0, react.useCallback)(async (send) => {
				let base = revision;
				for (let attempt = 0;; attempt += 1) {
					const result = await skillCards.api.write(send(base));
					if (result.status === "ok") {
						applySnapshot(result.snapshot);
						return {
							status: "ok",
							snapshot: result.snapshot
						};
					}
					if (result.status !== "conflict") return {
						status: "failed",
						reason: result.reason
					};
					applySnapshot(result.snapshot);
					base = result.snapshot.revision;
					if (attempt >= 1) return {
						status: "failed",
						reason: "the stored cards kept changing",
						snapshot: result.snapshot
					};
				}
			}, [
				applySnapshot,
				revision,
				skillCards.api
			]);
			/**
			* Make the card one skill runs as, so a picked skill becomes a step.
			*
			* A step holds a card id, not a skill, because the card is where the template, model and
			* workspace live. The name starts as the skill's own name, which is what the step then
			* shows; the user can rename it on the card.
			* @param skill - the picked skill.
			* @returns the new card's id, or why no card could be made.
			*/
			const createCardForSkill = (0, react.useCallback)(async (skill) => {
				let known = facts.map((card) => card.id);
				let reason = "no card could be made";
				for (let attempt = 0; attempt < 2; attempt += 1) {
					const taken = new Set(known);
					let index = 1;
					while (taken.has(`${SKILL_CARD_ID}-${String(index)}`)) index += 1;
					const cardId = `${SKILL_CARD_ID}-${String(index)}`;
					const written = await writeCard((base) => ({
						baseRevision: base,
						cardId,
						name: skill,
						skill
					}));
					if (written.status === "ok") return { cardId };
					reason = written.reason;
					known = written.snapshot === void 0 ? known : written.snapshot.cards.map((card) => card.cardId);
				}
				return { reason };
			}, [facts, writeCard]);
			/**
			* Take back one card this page made a moment ago.
			*
			* Used when the card was made for a step and the step could not be stored: leaving it
			* would put a card on the board that nothing asked for, one per failed click.
			* @param cardId - the card to remove.
			* @returns whether it is gone.
			*/
			const removeCard = (0, react.useCallback)(async (cardId) => {
				return (await writeCard((base) => ({
					baseRevision: base,
					cardId,
					remove: true
				}))).status === "ok";
			}, [writeCard]);
			/**
			* Rename one card, which is what a step's name is.
			*
			* A step holds a card id, and the card's name is what the step shows; renaming the step
			* therefore renames the card, and the new name is the one the card grid shows too.
			* @param cardId - the card to rename.
			* @param name - the new name.
			*/
			const renameCard = (0, react.useCallback)((cardId, name) => {
				writeCard((base) => ({
					baseRevision: base,
					cardId,
					name
				}));
			}, [writeCard]);
			const patchStepCards = (0, react.useCallback)(async (cardIds, patch) => {
				for (const cardId of cardIds) if ((await writeCard((base) => ({
					baseRevision: base,
					cardId,
					...patch
				}))).status !== "ok") return false;
				return true;
			}, [writeCard]);
			/**
			* Store one card's template.
			*
			* A template travels with the skill it was written for, so the write carries both: a
			* template whose skill changed underneath it would be filled by a different contract.
			* @param cardId - the card to write.
			* @param html - the template, exactly as the user left it.
			* @param skill - the skill the template is written for.
			* @returns whether the write landed.
			*/
			const saveStepTemplate = (0, react.useCallback)(async (cardId, html, skill) => {
				return (await writeCard((base) => ({
					baseRevision: base,
					cardId,
					template: {
						skill,
						html
					}
				}))).status === "ok";
			}, [writeCard]);
			const [modelGroups, setModelGroups] = (0, react.useState)([]);
			(0, react.useEffect)(() => {
				const sessionId = skillCards.runSessionId();
				const read = () => {
					setModelGroups(skillCards.models.read(sessionId).groups);
				};
				read();
				return skillCards.models.subscribe(sessionId, read);
			}, [skillCards.models, skillCards.runSessionId]);
			const pipelines = usePipelines(pipelineApi);
			const run = usePipelineRun({
				api: skillCards.api,
				scopeSessionId: skillCards.runSessionId
			});
			const renderCard = (0, react.useCallback)((cardId, view, onBack, openFile) => {
				const page = {
					api: skillCards.api,
					cardId,
					runSessionId: skillCards.runSessionId,
					...skillCards.pickerSessionId === void 0 ? {} : { pickerSessionId: skillCards.pickerSessionId },
					models: skillCards.models,
					workspacePicker: skillCards.workspacePicker,
					fallbackTitle: labelOf(cardId),
					openCard,
					t,
					...skillCards.documents === void 0 ? {} : { documents: skillCards.documents },
					...openFile === void 0 ? {} : { openFile },
					onBack
				};
				if (view === "result") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SkillCardResultPage, { ...page });
				if (view === "runs") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SkillCardRunsPage, { ...page });
				return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SkillCardConfigPage, { ...page });
			}, [
				labelOf,
				openCard,
				skillCards,
				t
			]);
			const content = selection === void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(WorkbenchPipeline, {
				pipelines,
				run,
				api: skillCards.api,
				facts,
				renderCard,
				onCreateCard: createCard,
				catalog,
				catalogStatus,
				catalogFailure,
				onCatalogNeeded: reloadCatalog,
				createCardForSkill,
				removeCard,
				renameStepCard: renameCard,
				patchStepCards,
				modelGroups,
				workspacePicker: skillCards.workspacePicker,
				saveStepTemplate,
				t
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
				className: selection === void 0 ? `${workbench_module_default.page} ${workbench_module_default.pagePipeline}` : workbench_module_default.page,
				children: [selection === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("header", {
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
			const pipelineApi = createWorkbenchPipelineApi();
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
					pipelines: pipelineApi,
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
