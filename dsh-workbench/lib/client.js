window.__ModuleLoader__.load({
	id: "dsh-workbench",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
// The Loader never fetches a sibling stylesheet, so this one ships inside
// the factory and installs on first evaluation.
{
  const css = "/* Workbench page: a centred column with its head row and the card grid. */\n\n._page_11k4i_3 {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  gap: 24px;\n  box-sizing: border-box;\n  height: 100%;\n  overflow: auto;\n  padding: 0 clamp(24px, 4vw, 48px) 48px;\n  color: var(--dsw-alias-label-primary);\n}\n\n._page_11k4i_3 > * {\n  width: 100%;\n  max-width: 1100px;\n}\n\n._pageHead_11k4i_20 {\n  display: flex;\n  align-items: flex-start;\n  justify-content: space-between;\n  gap: 16px;\n  box-sizing: border-box;\n  /* The page's top inset lives here so the strip above the content drags the window. */\n  padding-top: 28px;\n}\n\n[data-platform='darwin'] ._pageHead_11k4i_20 {\n  padding-top: calc(28px + var(--dsh-frame-top-clearance, 0px));\n}\n\n._pageTitle_11k4i_34 {\n  margin: 0;\n  font-size: 20px;\n  font-weight: 500;\n  line-height: 28px;\n}\n\n._pageIntro_11k4i_41 {\n  margin: 4px 0 0;\n  font-size: 13px;\n  line-height: 20px;\n  color: var(--dsw-alias-label-secondary);\n}\n\n._toolbar_11k4i_48 {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n}\n\n._control_11k4i_54 {\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n  height: 28px;\n  padding: 0 10px;\n  border: 1px solid var(--dsw-alias-border-l1);\n  border-radius: 8px;\n  background: transparent;\n  color: var(--dsw-alias-label-primary);\n  font-size: 13px;\n  line-height: 20px;\n  cursor: pointer;\n}\n\n._control_11k4i_54:hover {\n  background: var(--dsw-alias-bg-layer-2);\n}\n\n._control_11k4i_54:focus-visible {\n  outline: 2px solid var(--dsw-alias-border-focus);\n  outline-offset: 1px;\n}\n\n._notice_11k4i_78 {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  font-size: 12px;\n  line-height: 18px;\n  color: var(--dsw-alias-label-secondary);\n}\n\n._empty_11k4i_87 {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  gap: 8px;\n  padding: 64px 16px;\n  text-align: center;\n}\n\n._emptyTitle_11k4i_96 {\n  margin: 0;\n  font-size: 15px;\n  font-weight: 500;\n  line-height: 22px;\n}\n\n._emptyBody_11k4i_103 {\n  margin: 0;\n  font-size: 13px;\n  line-height: 20px;\n  color: var(--dsw-alias-label-secondary);\n}\n\n._grid_11k4i_110 {\n  display: grid;\n  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));\n  gap: 16px;\n  align-content: start;\n}\n\n/* A cell is a one-track grid so whatever it holds fills it on both axes. A flex\n   container would size the child to its content along the main axis, which left the\n   cards narrow and the columns wide. */\n._cell_11k4i_120 {\n  display: grid;\n  min-width: 0;\n}\n\n._createRoot_11k4i_125 {\n  display: flex;\n  flex: 1 1 auto;\n  min-width: 0;\n}\n\n/* The creation entry is a grid tile, so it reads as the place cards come from\n   rather than as a toolbar action detached from the grid. */\n\n._createTile_11k4i_134 {\n  display: flex;\n  flex: 1 1 auto;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  gap: 8px;\n  box-sizing: border-box;\n  width: 100%;\n  min-height: 132px;\n  padding: 14px 16px;\n  border: 1px dashed var(--dsw-alias-border-l1);\n  border-radius: 12px;\n  background: transparent;\n  color: var(--dsw-alias-label-secondary);\n  cursor: pointer;\n  font-size: 13px;\n}\n\n._createTile_11k4i_134:hover {\n  border-color: var(--dsw-alias-border-focus);\n  color: var(--dsw-alias-label-primary);\n}\n\n._createTile_11k4i_134:focus-visible {\n  outline: 2px solid var(--dsw-alias-border-focus);\n  outline-offset: 1px;\n}\n\n@media (max-width: 720px) {\n  ._grid_11k4i_110 {\n    grid-template-columns: 1fr;\n  }\n}\n/* Skill card content. The frame and the reorder/removal controls belong to the\r\n   shared shell, so this sheet styles only the body and the card's own actions. */\r\n\r\n._template_xa84d_7 {\r\n  display: block;\r\n}\r\n\r\n._body_xa84d_15 {\r\n  display: flex;\r\n  flex-direction: column;\r\n  min-width: 0;\r\n}\r\n\r\n._cardActions_xa84d_27 {\r\n  display: inline-flex;\r\n  gap: 4px;\r\n}\r\n\r\n/* One full-panel view: the card's result or its configuration, in the whole\r\n   display column rather than a grid cell. */\r\n\r\n._pageView_xa84d_43 {\r\n  display: flex;\r\n  flex-direction: column;\r\n  gap: 16px;\r\n  width: 100%;\r\n  min-width: 0;\r\n}\r\n\r\n._pageViewHead_xa84d_59 {\r\n  display: flex;\r\n  align-items: center;\r\n  gap: 8px;\r\n  min-width: 0;\r\n}\r\n\r\n._pageViewTitle_xa84d_73 {\r\n  margin: 0;\r\n  flex: 1 1 auto;\r\n  min-width: 0;\r\n  font-size: 16px;\r\n  font-weight: 500;\r\n  line-height: 24px;\r\n  overflow-wrap: anywhere;\r\n}\r\n\r\n._pageViewSubtitle_xa84d_93 {\r\n  flex: none;\r\n  color: var(--dsw-alias-label-secondary);\r\n  font-size: 12px;\r\n  line-height: 18px;\r\n}\r\n\r\n/* What the run is doing, stated at every moment. */\r\n\r\n._runStatus_xa84d_111 {\r\n  margin: 0;\r\n  color: var(--dsw-alias-label-secondary);\r\n  font-size: 12px;\r\n  line-height: 18px;\r\n}\r\n\r\n._runStatus_xa84d_111[data-run-status='running'] {\r\n  color: var(--dsw-alias-label-primary);\r\n}\r\n\r\n._runProblem_xa84d_133 {\r\n  margin: 0;\r\n  padding: 8px 10px;\r\n  border: 1px solid var(--dsw-alias-border-focus);\r\n  border-radius: var(--dsw-radius-sm);\r\n  color: var(--dsw-alias-label-primary);\r\n  font-size: 12px;\r\n  line-height: 18px;\r\n}\r\n\r\n._runOutput_xa84d_153 {\r\n  border-top: 1px solid var(--dsw-alias-border-l1);\r\n  padding-top: 8px;\r\n}\r\n\r\n._runOutputSummary_xa84d_163 {\r\n  cursor: pointer;\r\n  color: var(--dsw-alias-label-secondary);\r\n  font-size: 12px;\r\n}\r\n\r\n._runOutputLabel_xa84d_175 {\r\n  margin: 8px 0 4px;\r\n  color: var(--dsw-alias-label-secondary);\r\n  font-size: 12px;\r\n}\r\n\r\n._runFacts_xa84d_187 {\r\n  display: grid;\r\n  grid-template-columns: max-content 1fr;\r\n  gap: 2px 12px;\r\n  margin: 8px 0 0;\r\n  font-size: 12px;\r\n}\r\n\r\n._runFacts_xa84d_187 dt {\r\n  color: var(--dsw-alias-label-secondary);\r\n}\r\n\r\n._runFacts_xa84d_187 dd {\r\n  margin: 0;\r\n  overflow-wrap: anywhere;\r\n}\r\n\r\n._runPre_xa84d_221 {\r\n  max-height: 320px;\r\n  margin: 0;\r\n  padding: 8px;\r\n  border: 1px solid var(--dsw-alias-border-l1);\r\n  border-radius: var(--dsw-radius-sm);\r\n  background: var(--dsw-alias-bg-layer-2);\r\n  overflow: auto;\r\n  font-family: monospace;\r\n  font-size: 12px;\r\n  white-space: pre-wrap;\r\n  overflow-wrap: anywhere;\r\n}\r\n\r\n._notice_xa84d_249 {\r\n  display: flex;\r\n  flex-direction: column;\r\n  gap: 4px;\r\n  padding: 4px 0;\r\n}\r\n\r\n._noticeTitle_xa84d_263 {\r\n  margin: 0;\r\n  color: var(--dsw-alias-label-primary);\r\n  font-size: 13px;\r\n  font-weight: 500;\r\n}\r\n\r\n._noticeBody_xa84d_277 {\r\n  margin: 0;\r\n  color: var(--dsw-alias-label-tertiary);\r\n  font-size: 12px;\r\n  line-height: 1.5;\r\n}\r\n\r\n/* The editor opens in place of the body, so it inherits the card's width. */\r\n\r\n._settings_xa84d_295 {\r\n  display: flex;\r\n  flex-direction: column;\r\n  gap: 8px;\r\n  min-width: 0;\r\n}\r\n\r\n._field_xa84d_309 {\r\n  display: flex;\r\n  flex-direction: column;\r\n  gap: 4px;\r\n}\r\n\r\n._fieldLabel_xa84d_321 {\r\n  color: var(--dsw-alias-label-secondary);\r\n  font-size: 12px;\r\n}\r\n\r\n._select_xa84d_331,\r\n._editor_xa84d_333 {\r\n  border: 1px solid var(--dsw-alias-border-l1);\r\n  border-radius: var(--dsw-radius-sm);\r\n  background: var(--dsw-alias-bg-layer-1);\r\n  color: var(--dsw-alias-label-primary);\r\n  font-size: 12px;\r\n}\r\n\r\n._select_xa84d_331 {\r\n  height: 28px;\r\n  padding: 0 6px;\r\n}\r\n\r\n._editor_xa84d_333 {\r\n  min-height: 120px;\r\n  padding: 6px;\r\n  font-family: monospace;\r\n  resize: vertical;\r\n}\r\n\r\n._editor_xa84d_333:focus-visible,\r\n._select_xa84d_331:focus-visible {\r\n  border-color: var(--dsw-alias-border-focus);\r\n  outline: none;\r\n}\r\n\r\n._violations_xa84d_385 {\r\n  margin: 0;\r\n  padding-left: 18px;\r\n  color: var(--dsw-alias-label-primary);\r\n  font-size: 12px;\r\n  line-height: 1.6;\r\n}\r\n\r\n._previewPane_xa84d_401 {\r\n  display: flex;\r\n  flex-direction: column;\r\n  gap: 4px;\r\n}\r\n\r\n._preview_xa84d_401 {\r\n  border: 1px dashed var(--dsw-alias-border-l1);\r\n  border-radius: var(--dsw-radius-sm);\r\n  padding: 6px;\r\n}\r\n\r\n._settingsActions_xa84d_425 {\r\n  display: flex;\r\n  gap: 6px;\r\n}\r\n\r\n._permission_xa84d_435 {\r\n  margin: 8px 0 0;\r\n  color: var(--dsw-alias-label-tertiary);\r\n  font-size: 11px;\r\n}\r\n/* Workbench card shell: the frame every card renders inside. */\n\n._card_1nk72_3 {\n  display: flex;\n  flex-direction: column;\n  gap: 12px;\n  box-sizing: border-box;\n  height: 100%;\n  min-height: 132px;\n  padding: 14px 16px;\n  border: 1px solid var(--dsw-alias-border-l1);\n  border-radius: 12px;\n  background: var(--dsw-alias-bg-layer-1);\n}\n\n._spanWide_1nk72_16 {\n  grid-column: span 2;\n}\n\n/* A card that opens something in full. The region is focusable, so it carries the\n   pointer and focus affordances a button would; it cannot BE a button, because the\n   card hosts its own controls in the head action area. */\n._activatable_1nk72_23 {\n  cursor: pointer;\n}\n\n._activatable_1nk72_23:hover {\n  border-color: var(--dsw-alias-border-focus);\n}\n\n._activatable_1nk72_23:focus-visible {\n  outline: 2px solid var(--dsw-alias-border-focus);\n  outline-offset: 1px;\n}\n\n._spanTall_1nk72_36 {\n  grid-row: span 2;\n}\n\n._spanLarge_1nk72_40 {\n  grid-column: span 2;\n  grid-row: span 2;\n}\n\n._head_1nk72_45 {\n  display: flex;\n  flex-direction: column;\n  gap: 2px;\n  min-width: 0;\n}\n\n/* The title, the status, and the card's own controls share one line. Centring that\n   line is what puts them on a single baseline: the three boxes have different\n   heights, so top-aligning them left the status text and the button labels at\n   different offsets from the title. The subtitle sits below this line rather than\n   inside it, so a wrapping subtitle cannot drag the controls out of place. */\n._headRow_1nk72_57 {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  min-width: 0;\n}\n\n._title_1nk72_64 {\n  margin: 0;\n  flex: 1 1 auto;\n  min-width: 0;\n  font-size: 14px;\n  font-weight: 500;\n  line-height: 20px;\n  overflow-wrap: anywhere;\n}\n\n._subtitle_1nk72_74 {\n  font-size: 12px;\n  line-height: 18px;\n  color: var(--dsw-alias-label-secondary);\n  overflow-wrap: anywhere;\n}\n\n._status_1nk72_81 {\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n  flex: none;\n  font-size: 12px;\n  line-height: 18px;\n  color: var(--dsw-alias-label-secondary);\n}\n\n._headActions_1nk72_91 {\n  display: inline-flex;\n  align-items: center;\n  gap: 4px;\n  flex: none;\n}\n\n._iconButton_1nk72_98 {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  width: 24px;\n  height: 24px;\n  padding: 0;\n  border: 0;\n  border-radius: 6px;\n  background: transparent;\n  color: var(--dsw-alias-label-secondary);\n  cursor: pointer;\n  opacity: 0;\n}\n\n._card_1nk72_3:hover ._iconButton_1nk72_98,\n._card_1nk72_3:focus-within ._iconButton_1nk72_98,\n._handle_1nk72_115 {\n  opacity: 1;\n}\n\n._iconButton_1nk72_98:hover {\n  background: var(--dsw-alias-bg-layer-2);\n  color: var(--dsw-alias-label-primary);\n}\n\n._iconButton_1nk72_98:focus-visible {\n  outline: 2px solid var(--dsw-alias-border-focus);\n  outline-offset: 1px;\n}\n\n._handle_1nk72_115 {\n  cursor: grab;\n  touch-action: none;\n}\n\n._handle_1nk72_115:active {\n  cursor: grabbing;\n}\n\n._body_1nk72_138 {\n  flex: 1 1 auto;\n  min-height: 0;\n  font-size: 13px;\n  line-height: 20px;\n}\n\n._failure_1nk72_145 {\n  display: flex;\n  flex-direction: column;\n  align-items: flex-start;\n  gap: 8px;\n  color: var(--dsw-alias-label-secondary);\n}\n\n._dragging_1nk72_153 {\n  opacity: 0.6;\n}\n/*$vite$:1*/";
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
			skillCardPermission: "运行时使用当前会话的完整工具权限",
			skillCardBack: "返回",
			skillCardCardName: "卡片名称",
			skillCardNamePlaceholder: "给这张卡起个名字",
			createCard: "创建卡片",
			createCardCancel: "取消",
			cardTypeSkill: "技能卡片",
			cardTypeTest: "测试卡片",
			cardTypeMemory: "记忆卡片",
			skillCardDelete: "删除卡片",
			removeCard: "删除卡片",
			runStatusIdle: "未运行",
			runStatusRunning: "运行中",
			runStatusDone: "已完成",
			runStatusCancelled: "已取消",
			runStatusFailed: "失败",
			runStartedAt: "开始于",
			runStopReason: "结束原因",
			runStructured: "结构化结果",
			runRawOutput: "原始输出",
			runDiagnostic: "诊断",
			runNoOutput: "这次运行没有留下输出。",
			skillCardRunningBody: "技能正在执行，完成后结果会显示在这里。"
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
			skillCardPermission: "Runs with the current session’s full tool permissions",
			skillCardBack: "Back",
			skillCardCardName: "Card name",
			skillCardNamePlaceholder: "Name this card",
			createCard: "Create card",
			createCardCancel: "Cancel",
			cardTypeSkill: "Skill card",
			cardTypeTest: "Test card",
			cardTypeMemory: "Memory card",
			skillCardDelete: "Delete card",
			removeCard: "Delete card",
			runStatusIdle: "Not run yet",
			runStatusRunning: "Running",
			runStatusDone: "Finished",
			runStatusCancelled: "Cancelled",
			runStatusFailed: "Failed",
			runStartedAt: "Started",
			runStopReason: "Stop reason",
			runStructured: "Structured result",
			runRawOutput: "Raw output",
			runDiagnostic: "Diagnostic",
			runNoOutput: "This run left no output behind.",
			skillCardRunningBody: "The skill is executing. Its result appears here when it finishes."
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
			const cards = [];
			for (const raw of body.cards) {
				if (typeof raw !== "object" || raw === null) return void 0;
				const entry = raw;
				if (typeof entry.cardId !== "string" || !isWorkbenchCardId(entry.cardId)) return void 0;
				if (entry.name !== void 0 && (typeof entry.name !== "string" || !isWorkbenchCardName(entry.name))) return;
				if (entry.skill !== void 0 && (typeof entry.skill !== "string" || !isWorkbenchSkillName(entry.skill))) return;
				if (!Array.isArray(entry.templateSkills) || entry.templateSkills.some((name) => typeof name !== "string")) return;
				if (entry.template !== void 0 && typeof entry.template !== "string") return void 0;
				cards.push({
					cardId: entry.cardId,
					...entry.name === void 0 ? {} : { name: entry.name },
					...entry.skill === void 0 ? {} : { skill: entry.skill },
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
				results.push({
					...raw,
					cardId: entry.cardId
				});
			}
			return {
				cards,
				results,
				revision: body.revision
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
		var workbench_module_default = {
			page: "_page_11k4i_3",
			pageHead: "_pageHead_11k4i_20",
			pageTitle: "_pageTitle_11k4i_34",
			pageIntro: "_pageIntro_11k4i_41",
			toolbar: "_toolbar_11k4i_48",
			control: "_control_11k4i_54",
			notice: "_notice_11k4i_78",
			empty: "_empty_11k4i_87",
			emptyTitle: "_emptyTitle_11k4i_96",
			emptyBody: "_emptyBody_11k4i_103",
			grid: "_grid_11k4i_110",
			cell: "_cell_11k4i_120",
			createRoot: "_createRoot_11k4i_125",
			createTile: "_createTile_11k4i_134"
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
			if (opens.length > 1 || closes.length > 1) return { kind: "repeated" };
			const open = opens[0];
			const close = closes[0];
			if (open === void 0) return {
				kind: "unclosed",
				token: close[0]
			};
			if (close === void 0) return {
				kind: "unclosed",
				token: open[0]
			};
			const start = open.index + open[0].length;
			const end = close.index;
			if (end < start) return {
				kind: "unclosed",
				token: close[0]
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
		* @returns the region it declares and every reason it cannot run.
		*/
		function analyzeTemplate(html) {
			const scan = scanRegion(html);
			const violations = [];
			if (scan.kind === "missing") violations.push({
				code: "region-missing",
				location: "document"
			});
			if (scan.kind === "unclosed") violations.push({
				code: "region-unclosed",
				location: "document",
				token: scan.token
			});
			if (scan.kind === "repeated") violations.push({
				code: "region-repeated",
				location: "document"
			});
			const leftover = /\{\{[^{}]*\}\}/u.exec(html);
			if (leftover !== null) violations.push({
				code: "placeholder-syntax",
				location: "document",
				token: leftover[0]
			});
			violations.push(...contentViolations(html));
			return {
				region: scan.kind === "ok" ? scan.region : void 0,
				violations
			};
		}
		/**
		* Read every content-policy violation one document carries.
		* @param html - the template text.
		* @returns the violations, outermost first.
		*/
		function contentViolations(html) {
			const found = [];
			walk(parseTemplate(html), "root", found);
			return found;
		}
		/**
		* Report forbidden elements and attributes throughout one node.
		* @param node - the node to inspect.
		* @param path - the path to its parent, for the report.
		* @param found - the accumulator.
		*/
		function walk(node, path, found) {
			for (const child of [...node.childNodes]) {
				if (child.nodeType !== Node.ELEMENT_NODE) continue;
				const element = child;
				const here = `${path} > ${element.tagName.toLowerCase()}`;
				const reason = forbiddenElementReason(element);
				if (reason !== void 0) {
					found.push({
						code: reason,
						location: here,
						token: element.tagName.toLowerCase()
					});
					continue;
				}
				for (const attribute of [...element.attributes]) {
					const why = forbiddenAttributeReason(attribute.name, attribute.value);
					if (why !== void 0) found.push({
						code: why,
						location: here,
						token: attribute.name
					});
				}
				if (element.tagName.toLowerCase() === "style" && hasExternalCss(element.textContent ?? "")) found.push({
					code: "external-css",
					location: here,
					token: "style"
				});
				walk(element, here, found);
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
		* @module dsh-workbench/client/skill-card/ShadowHtml
		*/
		/**
		* Render one document inside a shadow root.
		* @param props - the document and the host class.
		* @returns the host element.
		*/
		function ShadowHtml({ html, className }) {
			const host = (0, react.useRef)(null);
			(0, react.useEffect)(() => {
				const element = host.current;
				if (element === null) return;
				renderTemplate(element.shadowRoot ?? element.attachShadow({ mode: "open" }), html);
			}, [html]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				ref: host,
				className
			});
		}
		//#endregion
		//#region src/client/skill-card/controller.ts
		/**
		* Skill card state: what one card shows and what it can do.
		*
		* The card never talks to the Host directly; it renders this view and calls these
		* actions. Failures travel as codes so the component localizes them, with the
		* Host's own text kept as secondary detail.
		* @module dsh-workbench/client/skill-card/controller
		*/
		/** How often a running card asks the Host for its state. */
		var POLL_INTERVAL_MS = 1e3;
		/**
		* Drive one skill card.
		* @param options - transport, card identity, session, and panel activity.
		* @returns the card's view and actions.
		*/
		function useSkillCard(options) {
			const { api, cardId, sessionId, withCatalog = false } = options;
			const [config, setConfig] = (0, react.useState)({ kind: "loading" });
			const [run, setRun] = (0, react.useState)(void 0);
			const [problem, setProblem] = (0, react.useState)(void 0);
			const [catalog, setCatalog] = (0, react.useState)([]);
			const [catalogStatus, setCatalogStatus] = (0, react.useState)("idle");
			const [catalogFailure, setCatalogFailure] = (0, react.useState)(void 0);
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
			const running = run?.phase === "running";
			(0, react.useEffect)(() => {
				if (!running) return;
				let stopped = false;
				const timer = setInterval(() => {
					api.poll(cardId).then((result) => {
						if (stopped) return;
						if (result.status === "ok") {
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
				running
			]);
			const card = config.kind === "ready" ? config.snapshot.cards.find((entry) => entry.cardId === cardId) : void 0;
			const stored = config.kind === "ready" ? config.snapshot.results.find((entry) => entry.cardId === cardId) : void 0;
			const start = (0, react.useCallback)(() => {
				if (sessionId === void 0) {
					setProblem({
						code: "session-not-live",
						detail: ""
					});
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
				api.start({
					cardId,
					sessionId,
					outputSchema: WORKBENCH_OUTPUT_SCHEMA
				}).then((outcome) => {
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
				sessionId,
				card?.skill,
				card?.template
			]);
			const cancel = (0, react.useCallback)(() => {
				api.cancel(cardId);
			}, [api, cardId]);
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
			const saveTemplate = (0, react.useCallback)((template) => {
				const skill = card?.skill;
				if (revision === void 0 || skill === void 0) return;
				api.write({
					baseRevision: revision,
					cardId,
					skill,
					template: {
						skill,
						html: template
					}
				}).then(applyWrite);
			}, [
				api,
				applyWrite,
				cardId,
				revision,
				card?.skill
			]);
			const rename = (0, react.useCallback)((name) => {
				if (revision === void 0) return;
				api.write({
					baseRevision: revision,
					cardId,
					name: name.trim() === "" ? null : name
				}).then(applyWrite);
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
			const actions = (0, react.useMemo)(() => ({
				run: start,
				cancel,
				refresh,
				chooseSkill,
				saveTemplate,
				rename,
				remove
			}), [
				start,
				cancel,
				refresh,
				chooseSkill,
				saveTemplate,
				rename,
				remove
			]);
			const result = run?.result ?? stored;
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
					...effective === void 0 ? {} : { problem: effective },
					runnable: sessionId !== void 0 && card?.skill !== void 0 && card.template !== void 0,
					catalog,
					catalogStatus,
					catalogFailure
				}), [
					config,
					run,
					problem,
					sessionId,
					card?.name,
					card?.skill,
					card?.template,
					result,
					catalog,
					catalogStatus,
					catalogFailure
				]),
				actions
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
			"schema-rejected": true,
			"run-in-progress": true
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
			template: "_template_xa84d_7",
			body: "_body_xa84d_15",
			cardActions: "_cardActions_xa84d_27",
			pageView: "_pageView_xa84d_43",
			pageViewHead: "_pageViewHead_xa84d_59",
			pageViewTitle: "_pageViewTitle_xa84d_73",
			pageViewSubtitle: "_pageViewSubtitle_xa84d_93",
			runStatus: "_runStatus_xa84d_111",
			runProblem: "_runProblem_xa84d_133",
			runOutput: "_runOutput_xa84d_153",
			runOutputSummary: "_runOutputSummary_xa84d_163",
			runOutputLabel: "_runOutputLabel_xa84d_175",
			runFacts: "_runFacts_xa84d_187",
			runPre: "_runPre_xa84d_221",
			notice: "_notice_xa84d_249",
			noticeTitle: "_noticeTitle_xa84d_263",
			noticeBody: "_noticeBody_xa84d_277",
			settings: "_settings_xa84d_295",
			field: "_field_xa84d_309",
			fieldLabel: "_fieldLabel_xa84d_321",
			select: "_select_xa84d_331",
			editor: "_editor_xa84d_333",
			violations: "_violations_xa84d_385",
			previewPane: "_previewPane_xa84d_401",
			preview: "_preview_xa84d_401",
			settingsActions: "_settingsActions_xa84d_425",
			permission: "_permission_xa84d_435"
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
				sessionId: runSessionId()
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
				title: view.name ?? (cardId === "skill-card" ? t("skillCardTitle") : cardId),
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
		* @param props - the view and `t`.
		* @returns the body element.
		*/
		function SkillCardBody({ view, t }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: skill_card_module_default.body,
				children: [cardContent(view, t), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
					className: skill_card_module_default.permission,
					children: t("skillCardPermission")
				})]
			});
		}
		/**
		* Render whichever content the card currently has.
		* @param view - the card view.
		* @param t - translator.
		* @returns the content element.
		*/
		function cardContent(view, t) {
			if (view.status === "loading") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Notice, {
				title: t("skillCardLoading"),
				body: t("skillCardLoadingBody")
			});
			if (view.template === void 0) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Notice, {
				title: t("skillCardNoTemplateTitle"),
				body: t("skillCardNoTemplateBody")
			});
			if (view.run?.phase === "running") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Notice, {
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
				className: skill_card_module_default.template
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
			"schema-rejected": "skillCardProblemContract",
			"template-invalid": "skillCardProblemTemplateInvalid",
			"run-in-progress": "skillCardProblemRunning",
			"run-failed": "skillCardProblemRunFailed",
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
					anchor: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: workbench_module_default.createTile,
						"aria-haspopup": "menu",
						"aria-expanded": menuOpen,
						onClick: () => {
							setMenuOpen((previous) => !previous);
						},
						children: label
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
		* @module dsh-workbench/client/skill-card/SkillCardSettings
		*/
		/**
		* Render the card editor.
		*
		* The card remounts this component when the selected skill changes, so the draft
		* always starts from that skill's stored template.
		* @param props - the view, `t`, and the three actions.
		* @returns the editor element.
		*/
		function SkillCardSettings(props) {
			const { view, t, onChoose, onSave, onRename, onClose } = props;
			const [draft, setDraft] = (0, react.useState)(view.template ?? "");
			const [name, setName] = (0, react.useState)(view.name ?? "");
			const analysis = (0, react.useMemo)(() => analyzeTemplate(draft), [draft]);
			const options = view.catalog.filter((entry) => entry.userInvocable);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: skill_card_module_default.settings,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
						className: skill_card_module_default.field,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: skill_card_module_default.fieldLabel,
							children: t("skillCardCardName")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
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
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
						className: skill_card_module_default.field,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: skill_card_module_default.fieldLabel,
							children: t("skillCardSelectSkill")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
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
					catalogNotice(view, options.length, t),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
						className: skill_card_module_default.editor,
						value: draft,
						spellCheck: false,
						"aria-label": t("skillCardTemplateLabel"),
						placeholder: t("skillCardTemplatePlaceholder"),
						onChange: (event) => {
							setDraft(event.target.value);
						}
					}),
					analysis.violations.length === 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", {
						className: skill_card_module_default.violations,
						children: analysis.violations.map((violation, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", { children: [
							t(violationKey(violation.code)),
							" · ",
							violation.location
						] }, `${violation.code}-${String(index)}`))
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: skill_card_module_default.previewPane,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: skill_card_module_default.fieldLabel,
							children: t("skillCardPreview")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ShadowHtml, {
							html: draft,
							className: skill_card_module_default.preview
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: skill_card_module_default.settingsActions,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							variant: "primary",
							size: "sm",
							disabled: analysis.violations.length > 0 || draft.length === 0 || view.skill === void 0,
							onClick: () => {
								onSave(draft);
							},
							children: t("skillCardSave")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							variant: "ghost",
							size: "sm",
							onClick: onClose,
							children: t("skillCardClose")
						})]
					})
				]
			});
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
		* compilation here until it has copy.
		*/
		var VIOLATION_KEYS = {
			"script": "skillCardViolationScript",
			"event-attribute": "skillCardViolationEvent",
			"unsafe-url": "skillCardViolationUrl",
			"external-element": "skillCardViolationExternal",
			"external-css": "skillCardViolationCss",
			"region-missing": "skillCardViolationRegionMissing",
			"region-unclosed": "skillCardViolationRegionUnclosed",
			"region-repeated": "skillCardViolationRegionRepeated",
			"placeholder-syntax": "skillCardViolationPlaceholder"
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
		* Count the seconds a run has been in flight.
		* @param startedAt - the run's start, or undefined when nothing is running.
		* @returns whole elapsed seconds, ticking once a second, or undefined.
		*/
		function useElapsedSeconds(startedAt) {
			const [now, setNow] = (0, react.useState)(() => Date.now());
			(0, react.useEffect)(() => {
				if (startedAt === void 0) return;
				const timer = setInterval(() => {
					setNow(Date.now());
				}, 1e3);
				return () => {
					clearInterval(timer);
				};
			}, [startedAt]);
			return startedAt === void 0 ? void 0 : Math.max(0, Math.floor((now - startedAt) / 1e3));
		}
		/**
		* State one line of text for whatever the run is doing.
		*
		* A run has to be legible at every moment: an inert page after pressing Run is what
		* this whole panel exists to prevent.
		* @param view - the card view.
		* @param elapsed - elapsed seconds while a run is in flight.
		* @param t - translator.
		* @returns the status text.
		*/
		function runStatusText(view, elapsed, t) {
			if (view.run?.phase === "running") return elapsed === void 0 ? t("runStatusRunning") : `${t("runStatusRunning")} 路 ${String(elapsed)}s`;
			if (view.problem !== void 0) return t("runStatusFailed");
			if (view.run?.phase === "cancelled") return t("runStatusCancelled");
			if (view.result !== void 0) return t("runStatusDone");
			return t("runStatusIdle");
		}
		/**
		* Render everything a finished run left behind.
		*
		* The structured value is what the template renders; the raw output, the stop reason,
		* and the provider's diagnostic are what answer "why is there no data".
		* @param props - the card view and the translator.
		* @returns the output block.
		*/
		function RunOutput({ view, t }) {
			const result = view.result;
			if (result === void 0) return null;
			const structured = result.structured === void 0 ? void 0 : JSON.stringify(result.structured, null, 2);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("details", {
				className: skill_card_module_default.runOutput,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("summary", {
						className: skill_card_module_default.runOutputSummary,
						children: t("runRawOutput")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("dl", {
						className: skill_card_module_default.runFacts,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("runStopReason") }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: result.stopReason }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("runStartedAt") }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: new Date(result.executedAt).toLocaleString() }),
							result.diagnostic === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("runDiagnostic") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: result.diagnostic })] })
						]
					}),
					structured === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: skill_card_module_default.runOutputLabel,
						children: t("runStructured")
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("pre", {
						className: skill_card_module_default.runPre,
						children: structured
					})] }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: skill_card_module_default.runOutputLabel,
						children: t("runRawOutput")
					}),
					result.outputText === void 0 || result.outputText.trim() === "" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: skill_card_module_default.noticeBody,
						children: t("runNoOutput")
					}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("pre", {
						className: skill_card_module_default.runPre,
						children: result.outputText
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
			const { api, cardId, runSessionId, fallbackTitle, onBack, t } = props;
			const { view, actions } = useSkillCard({
				api,
				cardId,
				sessionId: runSessionId()
			});
			const running = view.run?.phase === "running";
			const elapsed = useElapsedSeconds(running ? view.run?.startedAt : void 0);
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
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
								variant: "primary",
								size: "sm",
								disabled: !running && !view.runnable,
								onClick: running ? actions.cancel : actions.run,
								children: running ? t("skillCardCancel") : t("skillCardRun")
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: skill_card_module_default.runStatus,
						"data-run-status": view.run?.phase ?? "idle",
						children: runStatusText(view, elapsed, t)
					}),
					view.problem === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("p", {
						className: skill_card_module_default.runProblem,
						role: "alert",
						children: [t(problemKey(view.problem.code)), view.problem.detail === "" ? "" : ` 路 ${view.problem.detail}`]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(SkillCardBody, {
						view,
						t
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(RunOutput, {
						view,
						t
					})
				]
			});
		}
		/**
		* Render the card's configuration in the whole display column.
		* @param props - transport, card identity, session resolver, title fallback, back, and `t`.
		* @returns the configuration page.
		*/
		function SkillCardConfigPage(props) {
			const { api, cardId, runSessionId, fallbackTitle, onBack, t } = props;
			const { view, actions } = useSkillCard({
				api,
				cardId,
				sessionId: runSessionId(),
				withCatalog: true
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				className: skill_card_module_default.pageView,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
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
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							variant: "ghost",
							size: "sm",
							onClick: () => {
								actions.remove().then(onBack);
							},
							children: t("skillCardDelete")
						})
					]
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SkillCardSettings, {
					view,
					t,
					onChoose: actions.chooseSkill,
					onSave: actions.saveTemplate,
					onRename: actions.rename,
					onClose: onBack
				}, view.skill ?? "")]
			});
		}
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
			const { useCards, useSelection, api, skillCards, closeCard, renderSlot, t, usePanelInfo } = props;
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
					fallbackTitle: labelOf(selection.cardId),
					onBack: closeCard,
					t
				};
				return selection.view === "result" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SkillCardResultPage, { ...page }) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SkillCardConfigPage, { ...page });
			})();
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: workbench_module_default.page,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
					className: workbench_module_default.pageHead,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h1", {
						className: workbench_module_default.pageTitle,
						children: t("title")
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: workbench_module_default.pageIntro,
						children: t("subtitle")
					})] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: workbench_module_default.toolbar,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: workbench_module_default.control,
							onClick: () => {
								actions.refresh();
							},
							children: t("refreshAll")
						})
					})]
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
		var card_module_default = {
			card: "_card_1nk72_3",
			spanWide: "_spanWide_1nk72_16",
			activatable: "_activatable_1nk72_23",
			spanTall: "_spanTall_1nk72_36",
			spanLarge: "_spanLarge_1nk72_40",
			head: "_head_1nk72_45",
			headRow: "_headRow_1nk72_57",
			title: "_title_1nk72_64",
			subtitle: "_subtitle_1nk72_74",
			status: "_status_1nk72_81",
			headActions: "_headActions_1nk72_91",
			iconButton: "_iconButton_1nk72_98",
			handle: "_handle_1nk72_115",
			body: "_body_1nk72_138",
			failure: "_failure_1nk72_145",
			dragging: "_dragging_1nk72_153"
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
									}),
									onRemove !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
										variant: "ghost",
										size: "sm",
										className: card_module_default.iconButton,
										"data-workbench-remove": id,
										"aria-label": t("removeCard"),
										onClick: onRemove,
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCloseOutlineMedium, { size: 14 })
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
						runSessionId
					},
					closeCard
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
