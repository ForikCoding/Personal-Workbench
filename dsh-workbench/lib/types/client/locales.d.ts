/**
 * `workbench` locale dictionaries: the sidebar row, the panel page, the card
 * shell, the result and configuration pages, the creation tile, and the
 * accessibility announcements.
 * @module dsh-workbench/client/locales
 */
/** Chinese dictionary. */
export declare const zh: {
    panel: string;
    title: string;
    subtitle: string;
    refreshAll: string;
    dragHandle: string;
    announceMoved: string;
    writeFailed: string;
    mergedElsewhere: string;
    cardFailed: string;
    statusIdle: string;
    statusOngoing: string;
    statusDone: string;
    statusWarning: string;
    statusError: string;
    skillCardTitle: string;
    skillCardRun: string;
    skillCardCancel: string;
    skillCardLoading: string;
    skillCardLoadingBody: string;
    skillCardNoTemplateTitle: string;
    skillCardNoTemplateBody: string;
    skillCardNotRunTitle: string;
    skillCardNotRunBody: string;
    skillCardProblemNotConfigured: string;
    skillCardProblemNoTemplate: string;
    skillCardProblemNoSession: string;
    skillCardProblemSkillMissing: string;
    skillCardProblemProvider: string;
    skillCardProblemContract: string;
    skillCardProblemTemplateInvalid: string;
    skillCardProblemRunning: string;
    skillCardProblemRunFailed: string;
    skillCardProblemTooLarge: string;
    skillCardProblemUnavailable: string;
    skillCardProblemGeneric: string;
    skillCardSettings: string;
    skillCardSelectSkill: string;
    skillCardSelectPlaceholder: string;
    skillCardCatalogLoading: string;
    skillCardCatalogFailed: string;
    skillCardCatalogEmpty: string;
    skillCardNoSession: string;
    skillCardTemplateLabel: string;
    skillCardTemplatePlaceholder: string;
    skillCardPreview: string;
    skillCardSave: string;
    skillCardClose: string;
    skillCardViolationScript: string;
    skillCardViolationEvent: string;
    skillCardViolationUrl: string;
    skillCardViolationExternal: string;
    skillCardViolationCss: string;
    skillCardViolationRegionMissing: string;
    skillCardViolationRegionUnclosed: string;
    skillCardViolationRegionRepeated: string;
    skillCardViolationPlaceholder: string;
    skillCardPermission: string;
    skillCardBack: string;
    skillCardCardName: string;
    skillCardNamePlaceholder: string;
    createCard: string;
    createCardCancel: string;
    cardTypeSkill: string;
    cardTypeTest: string;
    cardTypeMemory: string;
    skillCardDelete: string;
    removeCard: string;
    runStatusIdle: string;
    runStatusRunning: string;
    runStatusDone: string;
    runStatusCancelled: string;
    runStatusFailed: string;
    runStartedAt: string;
    runStopReason: string;
    runStructured: string;
    runRawOutput: string;
    runDiagnostic: string;
    runNoOutput: string;
    skillCardRunningBody: string;
};
/** English dictionary; the annotation keeps both dictionaries on one key set. */
export declare const en: Record<keyof typeof zh, string>;
/** Key union of the `workbench` namespace. */
export type WorkbenchLocaleKey = keyof typeof zh;
