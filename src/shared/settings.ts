/** AIDE application settings — single source of truth for all configurable values */

export interface AideSettings {
  /** Font settings */
  font: {
    family: string;
    uiSize: number;           // px — base font size for UI elements
    terminalSize: number;     // px — terminal font size
    terminalWeight: string;   // CSS font-weight for terminal
    terminalBoldWeight: string; // CSS font-weight for bold text in terminal
  };

  /** Terminal appearance */
  terminal: {
    cursorBlink: boolean;
    padding: number;          // px
    scrollback: number;       // lines
    theme: {
      background: string;
      foreground: string;
      cursor: string;
      selectionBackground: string;
      black: string;
      red: string;
      green: string;
      yellow: string;
      blue: string;
      magenta: string;
      cyan: string;
      white: string;
      brightBlack: string;
      brightRed: string;
      brightGreen: string;
      brightYellow: string;
      brightBlue: string;
      brightMagenta: string;
      brightCyan: string;
      brightWhite: string;
    };
  };

  /** UI theme colors */
  themes: {
    dark: ThemeColors;
    light: ThemeColors;
  };

  /** Layout dimensions */
  layout: {
    titleBarHeight: number;     // px
    tabBarHeight: number;       // px
    statusBarHeight: number;    // px
    activityBarWidth: number;   // px
    activityBarIconSize: number;
    sidebarDefaultWidth: number;
    sidebarMinWidth: number;
    sidebarMaxWidth: number;
    splitMinSize: number;       // px — minimum pane size
    borderWidth: number;        // px — app frame border
    scrollbarWidth: number;     // px
    scrollbarRadius: number;    // px
  };

  /** Claude */
  claude: {
    contextWindowSize: number;  // tokens — default context window for % display
  };

  /** Timing */
  timing: {
    autoSaveInterval: number;       // ms
    gitPollInterval: number;        // ms
    focusFollowsMouseDelay: number; // ms
    tabSwitcherDelay: number;       // ms
    claudeInputRefocusDelay: number; // ms — refocus input after selecting text in chat
    terminalInitDelay: number;       // ms — delay before cd to cwd on terminal creation
  };

  /** Icon sizes */
  icons: {
    activityBar: number;
    sidebar: number;
    tabBar: number;
    inline: number;
    small: number;
  };
}

export interface ThemeColors {
  bgPrimary: string;
  bgSecondary: string;
  bgSurface: string;
  bgOverlay: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentHover: string;
  border: string;
  success: string;
  warning: string;
  error: string;
}

export const DEFAULT_SETTINGS: AideSettings = {
  font: {
    family: "'JetBrainsMono Nerd Font Mono', 'JetBrains Mono', Menlo, Monaco, monospace",
    uiSize: 16,
    terminalSize: 16,
    terminalWeight: '200',
    terminalBoldWeight: '400',
  },

  terminal: {
    cursorBlink: true,
    padding: 4,
    scrollback: 5000,
    theme: {
      background: '#1e1e2e',
      foreground: '#cdd6f4',
      cursor: '#f5e0dc',
      selectionBackground: '#45475a',
      black: '#45475a',
      red: '#f38ba8',
      green: '#a6e3a1',
      yellow: '#f9e2af',
      blue: '#89b4fa',
      magenta: '#f5c2e7',
      cyan: '#94e2d5',
      white: '#bac2de',
      brightBlack: '#585b70',
      brightRed: '#f38ba8',
      brightGreen: '#a6e3a1',
      brightYellow: '#f9e2af',
      brightBlue: '#89b4fa',
      brightMagenta: '#f5c2e7',
      brightCyan: '#94e2d5',
      brightWhite: '#a6adc8',
    },
  },

  themes: {
    dark: {
      bgPrimary: '#1e1e2e',
      bgSecondary: '#181825',
      bgSurface: '#313244',
      bgOverlay: '#45475a',
      textPrimary: '#cdd6f4',
      textSecondary: '#a6adc8',
      textMuted: '#6c7086',
      accent: '#89b4fa',
      accentHover: '#74c7ec',
      border: '#45475a',
      success: '#a6e3a1',
      warning: '#f9e2af',
      error: '#f38ba8',
    },
    light: {
      bgPrimary: '#eff1f5',
      bgSecondary: '#e6e9ef',
      bgSurface: '#ccd0da',
      bgOverlay: '#bcc0cc',
      textPrimary: '#4c4f69',
      textSecondary: '#5c5f77',
      textMuted: '#8c8fa1',
      accent: '#1e66f5',
      accentHover: '#209fb5',
      border: '#bcc0cc',
      success: '#40a02b',
      warning: '#df8e1d',
      error: '#d20f39',
    },
  },

  layout: {
    titleBarHeight: 32,
    tabBarHeight: 36,
    statusBarHeight: 24,
    activityBarWidth: 56,
    activityBarIconSize: 24,
    sidebarDefaultWidth: 250,
    sidebarMinWidth: 150,
    sidebarMaxWidth: 500,
    splitMinSize: 100,
    borderWidth: 1,
    scrollbarWidth: 8,
    scrollbarRadius: 4,
  },

  claude: {
    contextWindowSize: 200_000,
  },

  timing: {
    autoSaveInterval: 30_000,
    gitPollInterval: 5_000,
    focusFollowsMouseDelay: 200,
    tabSwitcherDelay: 200,
    claudeInputRefocusDelay: 2_000,
    terminalInitDelay: 150,
  },

  icons: {
    activityBar: 24,
    sidebar: 18,
    tabBar: 14,
    inline: 16,
    small: 12,
  },
};
