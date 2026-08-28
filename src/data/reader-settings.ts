import type { UiTranslationKey } from "../i18n/ui";
import { SKINS } from "../skins";
import { LAYOUTS } from "../types/layout";

/**
 * The pills for the skin and layout axes are derived from those axes' own
 * constants rather than listed again here. Two copies of the same list is
 * how a new skin ends up declared, styled, and invisible: the panel only
 * ever offered what this file had been told about.
 *
 * Written out per axis rather than through one helper, and with the return
 * type annotated and no assertion, so `skin.${name}` is genuinely checked
 * against UiTranslationKey - a skin or layout added without its zh/en label
 * fails `astro check` instead of rendering a raw key. A shared helper would
 * have to widen the prefix to "skin" | "layout", which admits the nonsense
 * pairs (layout.minimal) and takes the check away again.
 */
type ChoiceOption = { value: string; labelKey: UiTranslationKey };

/**
 * What a reader is allowed to change about how this site reads.
 *
 * The distinction that shapes this file: site.config.ts is the author's
 * assembly - what exists on the page - and this is the reader's layer on top
 * of it. Nothing here adds or removes a block; every entry moves a value the
 * stylesheet was already reading, so a setting can never leave the page in a
 * state the author did not build.
 *
 * Two kinds of target, because there are two mechanisms already in place:
 *
 *   siteTheme  axes BaseHead.astro already owns and persists - theme, skin,
 *              layout. Delegated rather than duplicated; the header's theme
 *              button and this panel drive the same code.
 *   cssVar     a custom property set inline on <html>. Inline beats any
 *              stylesheet rule, so a reader value wins over the skin's
 *              default without either knowing about the other, and clearing
 *              the property hands control straight back to the skin.
 *
 * Every cssVar below is a property something already reads. Check before
 * adding one - a knob wired to a property no rule consumes moves a slider
 * and changes nothing:
 *   --prose-width         src/styles/global.css:140  (.prose max-width)
 *   --prose-line-height   src/styles/global.css:143  (.prose line-height)
 *   font-size on <html>   src/styles/global.css:38   (the rem basis)
 */
export type SettingTarget =
  | { kind: "siteTheme"; axis: "theme" | "skin" | "layout" }
  | { kind: "locale" }
  | { kind: "cssVar"; property: string };

export type SettingControl =
  /** Named values, shown as a row of pills with the current one marked. */
  | { kind: "choice"; options: ChoiceOption[] }
  /** A continuous range, shown as a slider with its value beside it. */
  | {
      kind: "range";
      min: number;
      max: number;
      step: number;
      /** Appended to the number when the value is displayed. */
      unit: string;
      /** Appended to the number when the value is written to CSS. */
      cssUnit: string;
    };

export interface ReaderSetting {
  id: string;
  labelKey: UiTranslationKey;
  /** One line under the label saying what it affects. Omit when obvious. */
  hintKey?: UiTranslationKey;
  groupKey: UiTranslationKey;
  target: SettingTarget;
  control: SettingControl;
  /**
   * Where the slider sits before the reader touches it. Matches the skin
   * token so the control opens showing the truth rather than jumping the
   * page the first time it is moved.
   */
  fallback?: number;
}

/** localStorage key holding the reader's cssVar overrides as one JSON blob. */
export const READER_PREFS_KEY = "reader-prefs";

export const READER_SETTINGS: ReaderSetting[] = [
  // --- Reading ---
  {
    id: "font-size",
    labelKey: "reader.fontSize",
    hintKey: "reader.fontSizeHint",
    groupKey: "reader.groupReading",
    // Not .prose font-size: everything on the page is sized in rem from this
    // one value, so scaling it moves the sidebar and the nav with the text
    // instead of leaving a large article inside small furniture.
    target: { kind: "cssVar", property: "font-size" },
    control: {
      kind: "range",
      min: 14,
      max: 20,
      step: 1,
      unit: "px",
      cssUnit: "px",
    },
    fallback: 16,
  },
  {
    id: "line-height",
    labelKey: "reader.lineHeight",
    hintKey: "reader.lineHeightHint",
    groupKey: "reader.groupReading",
    target: { kind: "cssVar", property: "--prose-line-height" },
    control: {
      kind: "range",
      min: 1.4,
      max: 2.2,
      step: 0.05,
      unit: "",
      cssUnit: "",
    },
    fallback: 1.76,
  },
  {
    id: "prose-width",
    labelKey: "reader.proseWidth",
    hintKey: "reader.proseWidthHint",
    groupKey: "reader.groupReading",
    // ch, not px: the comfortable measure is a count of characters, and ch
    // tracks the font the reader just resized rather than fighting it.
    target: { kind: "cssVar", property: "--prose-width" },
    control: {
      kind: "range",
      min: 52,
      max: 90,
      step: 2,
      unit: "ch",
      cssUnit: "ch",
    },
    fallback: 66,
  },

  // --- Appearance ---
  {
    id: "theme",
    labelKey: "reader.theme",
    groupKey: "reader.groupAppearance",
    target: { kind: "siteTheme", axis: "theme" },
    control: {
      kind: "choice",
      options: [
        { value: "light", labelKey: "reader.themeLight" },
        { value: "dark", labelKey: "reader.themeDark" },
      ],
    },
  },
  {
    id: "skin",
    labelKey: "reader.skin",
    hintKey: "reader.skinHint",
    groupKey: "reader.groupAppearance",
    target: { kind: "siteTheme", axis: "skin" },
    control: {
      kind: "choice",
      options: SKINS.map(
        (name): ChoiceOption => ({ value: name, labelKey: `skin.${name}` }),
      ),
    },
  },
  {
    id: "locale",
    labelKey: "reader.locale",
    groupKey: "reader.groupAppearance",
    target: { kind: "locale" },
    control: {
      kind: "choice",
      options: [
        { value: "zh", labelKey: "reader.localeZh" },
        { value: "en", labelKey: "reader.localeEn" },
      ],
    },
  },

  // --- Post list ---
  {
    id: "layout",
    labelKey: "reader.layout",
    hintKey: "reader.layoutHint",
    groupKey: "reader.groupLayout",
    target: { kind: "siteTheme", axis: "layout" },
    control: {
      kind: "choice",
      options: LAYOUTS.map(
        (name): ChoiceOption => ({ value: name, labelKey: `layout.${name}` }),
      ),
    },
  },
];
