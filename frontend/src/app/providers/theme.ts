import type { GlobalThemeOverrides } from 'naive-ui'
import { palette } from './palette'

type ThemeName = 'light' | 'dark'

interface ThemeColors {
  bgBody: string
  bgCard: string
  bgAction: string
  textBase: string
  text1: string
  text2: string
  text3: string
  border: string
  divider: string
  tagDefaultBg: string
  tagDefaultText: string
  tagSuccessBg: string
  tagSuccessText: string
  tagErrorBg: string
  tagErrorText: string
  tagWarningBg: string
  tagWarningText: string
  tagInfoBg: string
  tagInfoText: string
}

// Базовые поверхностные/текстовые токены темы — на их основе строятся семантические токены
const lightBase = {
  bgBody: palette.grey50,
  bgCard: '#ffffff',
  bgAction: palette.grey100,
  textBase: palette.grey900,
  text1: palette.grey900,
  text2: palette.grey600,
  text3: palette.grey500,
  border: palette.grey200,
  divider: palette.grey100,
}

const darkBase = {
  bgBody: '#101014',
  bgCard: '#18181c',
  bgAction: '#1f1f24',
  textBase: 'rgba(255, 255, 255, 0.82)',
  text1: 'rgba(255, 255, 255, 0.9)',
  text2: 'rgba(255, 255, 255, 0.7)',
  text3: 'rgba(255, 255, 255, 0.52)',
  border: '#2c2c33',
  divider: '#2c2c33',
}

const themeColors: Record<ThemeName, ThemeColors> = {
  light: {
    ...lightBase,
    tagDefaultBg: palette.grey200,
    tagDefaultText: palette.grey700,
    tagSuccessBg: palette.success50,
    tagSuccessText: palette.success700,
    tagErrorBg: palette.error50,
    tagErrorText: palette.error700,
    tagWarningBg: palette.warning50,
    tagWarningText: palette.warning700,
    tagInfoBg: palette.brandLightblue50,
    tagInfoText: palette.brandLightblue600,
  },
  dark: {
    ...darkBase,
    tagDefaultBg: palette.grey200,
    tagDefaultText: palette.grey700,
    tagSuccessBg: palette.successBgDark,
    tagSuccessText: palette.success300,
    tagErrorBg: palette.errorBgDark,
    tagErrorText: palette.error300,
    tagWarningBg: palette.warningBgDark,
    tagWarningText: palette.warning300,
    tagInfoBg: palette.infoBgDark,
    tagInfoText: palette.brandLightblue300,
  },
}

export function buildThemeOverrides(theme: ThemeName): GlobalThemeOverrides {
  const c = themeColors[theme]

  return {
    common: {
      primaryColor: palette.brandPrimary500,
      primaryColorHover: palette.brandPrimary500,
      primaryColorPressed: palette.brandPrimary600,
      primaryColorSuppl: palette.textWhite,
      errorColor: palette.error500,
      borderRadius: palette.radiusMd,
      fontFamily:
        "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
      bodyColor: c.bgBody,
      cardColor: c.bgCard,
      modalColor: c.bgCard,
      popoverColor: c.bgCard,
      tableColor: c.bgCard,
      actionColor: c.bgAction,
      textColorBase: c.textBase,
      textColor1: c.text1,
      textColor2: c.text2,
      textColor3: c.text3,
      borderColor: c.border,
      dividerColor: c.divider,
    },
    LoadingBar: {
      colorLoading: palette.brandPrimary500,
      height: '4px',
    },
    Card: {
      color: c.bgCard,
      borderColor: c.border,
      colorEmbedded: c.bgAction,
      borderRadius: palette.radiusLg,
      textColor: c.textBase,
      titleTextColor: c.text1,
    },
    Layout: {
      footerColor: palette.textWhite,
    },
    Form: {
      labelFontSizeTopMedium: '1.4rem',
      labelFontWeight: '500',
      labelTextColor: c.text2,
      feedbackFontSizeMedium: '1rem',
      feedbackTextColorError: palette.error500,
    },
    Input: {
      textColorDisabled: c.text3,
      borderDisabled: `1.5px solid ${c.border}`,
      border: `1.5px solid ${c.border}`,
      borderHover: `1.5px solid ${palette.brandPrimary400}`,
      borderFocus: `1.5px solid ${palette.brandPrimary500}`,
      borderRadius: palette.radiusMd,
      color: c.bgCard,
      colorFocus: c.bgCard,
      colorDisabled: c.bgAction,
      textColor: c.textBase,
      heightTiny: '3.2rem',
      heightSmall: '3.6rem',
      heightMedium: '4rem',
      heightLarge: '4.4rem',
      placeholderColor: c.text3,
    },
    InternalSelection: {
      placeholderColor: c.text3,
      textColorDisabled: c.text3,
      border: `1.5px solid ${c.border}`,
      borderHover: `1.5px solid ${palette.brandPrimary400}`,
      borderFocus: `1.5px solid ${palette.brandPrimary500}`,
      borderActive: `1.5px solid ${palette.brandPrimary500}`,
      arrowColor: c.text3,
      borderRadius: palette.radiusMd,
      color: c.bgCard,
      colorActive: c.bgCard,
      textColor: c.textBase,
      heightSmall: '3.6rem',
      heightMedium: '4rem',
      heightLarge: '4.4rem',
      arrowSize: '2rem',
    },
    Button: {
      paddingTiny: '0 1.6rem',
      fontSizeTiny: '1.4rem',
      fontSizeSmall: '1.4rem',
      fontSizeMedium: '1.6rem',
      heightTiny: '3.2rem',
      heightSmall: '3.6rem',
      heightMedium: '4rem',
      heightLarge: '4.4rem',
      borderRadiusTiny: palette.radiusLg,
      borderRadiusSmall: palette.radiusLg,
      borderRadiusMedium: palette.radiusLg,
      borderRadiusLarge: palette.radiusLg,
      paddingSmall: '0 1.6rem',
      fontWeight: '600',
      border: `1.5px solid ${c.border}`,
      textColor: c.text2,
      textColorTertiary: c.text2,
      colorError: palette.danger500,
      colorDisabledPrimary: palette.brandPrimary200,
      borderDisabledPrimary: palette.brandPrimary100,
    },
    Checkbox: {
      sizeMedium: '2rem',
      border: `2px solid ${c.border}`,
      borderChecked: `2px solid ${palette.brandPrimary500}`,
      borderFocus: `2px solid ${palette.brandPrimary500}`,
      borderDisabled: `2px solid ${c.border}`,
      borderDisabledChecked: `2px solid ${c.border}`,
      sizeLarge: '2.5rem',
      borderRadius: palette.radiusSm,
    },
    DataTable: {
      thColor: c.bgAction,
      thColorHover: c.bgAction,
      thFontWeight: '600',
      thTextColor: c.text2,
      tdColor: c.bgCard,
      tdColorHover: c.bgCard,
      tdColorStriped: c.bgAction,
      tdTextColor: c.textBase,
      borderColor: c.border,
      tdPaddingMedium: '2.6rem 2rem',
      thPaddingMedium: '1.3rem 2rem',
    },
    Pagination: {
      itemBorderActive: 'transparent',
      itemBorderDisabled: 'none',
      itemColorActive: c.bgAction,
      itemColorHover: c.bgAction,
      itemColorDisabled: 'transparent',
      itemTextColor: c.text2,
      itemTextColorActive: c.text1,
    },
    Dialog: {
      borderRadius: palette.radiusLg,
      closeMargin: '1.6rem 1.6rem 0 0',
      closeColorHover: 'transparent',
    },
    Carousel: {
      arrowColor: palette.brandPrimary500,
      dotColorActive: palette.brandPrimary500,
      dotColor: palette.brandPrimary300,
      dotLineWidthActive: '10rem',
      dotLineWidth: '5rem',
    },
    Skeleton: {
      borderRadius: palette.radiusLg,
      color: palette.grey50,
      colorEnd: '#eeeff2',
    },
    Alert: {
      titleTextColorError: palette.textWhite,
      contentTextColorError: palette.textWhite,
      colorError: palette.danger500,
      closeIconColorError: palette.textWhite,
      closeIconColorHoverError: palette.textWhite,

      titleTextColorSuccess: palette.textWhite,
      contentTextColorSuccess: palette.textWhite,
      colorSuccess: palette.success500,
      closeIconColorSuccess: palette.textWhite,
      closeIconColorHoverSuccess: palette.textWhite,

      titleTextColorInfo: palette.textWhite,
      contentTextColorInfo: palette.textWhite,
      colorInfo: palette.brandLightblue600,
      closeIconColorInfo: palette.textWhite,
      closeIconColorHoverInfo: palette.textWhite,

      titleTextColorWarning: palette.textWhite,
      contentTextColorWarning: palette.textWhite,
      colorWarning: palette.warning500,
      closeIconColorWarning: palette.textWhite,
      closeIconColorHoverWarning: palette.textWhite,

      borderRadius: palette.radiusMd,
    },
    Radio: {
      buttonColorActive: palette.brandPrimary500,
      buttonTextColorActive: palette.textWhite,
      buttonTextColor: palette.grey300,
      buttonTextColorHover: palette.brandPrimary500,
      buttonHeightMedium: '3rem',
      fontSizeMedium: '1.4rem',
      labelFontWeight: '500',
    },
    Tag: {
      borderRadius: palette.radiusXl,
      padding: '2px 8px',
      heightMedium: '2.2rem',
      heightLarge: '2.8rem',

      border: 'none',
      color: c.tagDefaultBg,
      colorBordered: c.tagDefaultBg,
      textColor: c.tagDefaultText,

      borderSuccess: 'none',
      colorSuccess: c.tagSuccessBg,
      colorBorderedSuccess: c.tagSuccessBg,
      textColorSuccess: c.tagSuccessText,

      borderError: 'none',
      colorError: c.tagErrorBg,
      colorBorderedError: c.tagErrorBg,
      textColorError: c.tagErrorText,

      borderWarning: 'none',
      colorWarning: c.tagWarningBg,
      colorBorderedWarning: c.tagWarningBg,
      textColorWarning: c.tagWarningText,

      borderInfo: 'none',
      colorInfo: c.tagInfoBg,
      colorBorderedInfo: c.tagInfoBg,
      textColorInfo: c.tagInfoText,
    },
    Dropdown: {
      borderRadius: palette.radiusLg,
    },
    Drawer: {
      borderRadius: '0',
      headerPadding: '1.85rem 2.4rem',
      titleFontSize: '1.8rem',
      titleFontWeight: '600',
    },
    DatePicker: {
      iconColor: c.text3,
      peers: {
        Input: {
          borderRadius: palette.radiusLg,
          border: `1.5px solid ${c.border}`,
          borderHover: `1.5px solid ${palette.brandPrimary400}`,
          borderFocus: `1.5px solid ${palette.brandPrimary500}`,
          color: c.bgCard,
          textColor: c.textBase,
          placeholderColor: c.text3,
        },
      },
    },
    Breadcrumb: {
      itemTextColor: palette.grey600,
      itemTextColorHover: palette.grey600,
      itemTextColorActive: palette.brandPrimary500,
    },
    Spin: {
      stroke: palette.brandPrimary500,
      color: palette.brandPrimary500,
    },
    Menu: {
      itemTextColorInverted: 'rgba(255, 255, 255, 0.75)',
      itemIconColorInverted: 'rgba(255, 255, 255, 0.75)',
      itemTextColorActiveInverted: palette.textWhite,
      itemColorActiveInverted: 'rgba(37, 99, 235, 0.2)',
      itemColorActiveHoverInverted: 'rgba(37, 99, 235, 0.25)',
      itemTextColorHoverInverted: palette.textWhite,
    },
  }
}

export const themeOverridesLight = buildThemeOverrides('light')
export const themeOverridesDark = buildThemeOverrides('dark')

export function getThemeOverrides(theme: ThemeName): GlobalThemeOverrides {
  return theme === 'dark' ? themeOverridesDark : themeOverridesLight
}

export const themeOverrides = themeOverridesLight
