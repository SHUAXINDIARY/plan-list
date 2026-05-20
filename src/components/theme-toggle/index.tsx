import { type ReactElement } from "react";
import type { ThemePreference } from "../../utils/themePreference";

/**
 * 主题切换按钮的输入属性（均由父级 `App` 注入）。
 */
interface ThemeToggleProps {
    /** 当前生效的主题，决定图标、文案与 `aria-pressed`。 */
    preference: ThemePreference;
    /** 用户激活按钮时在父级切换主题。 */
    onToggle: () => void;
}

/**
 * 顶栏用浅色/深色切换：图标区分昼夜，配套无障碍说明。
 */
export const ThemeToggle = ({
    preference,
    onToggle,
}: ThemeToggleProps): ReactElement => {
    const isDark = preference === "dark";
    const nextLabel = isDark ? "切换到亮色主题" : "切换到深色主题";

    return (
        <button
            type="button"
            className="theme-toggle"
            onClick={onToggle}
            aria-pressed={preference === "light"}
            aria-label={nextLabel}
            title={nextLabel}
        >
            <span className="theme-toggle__icon" aria-hidden>
                {isDark ? <IconSun /> : <IconMoon />}
            </span>
        </button>
    );
};

/**
 * 亮色（太阳）图示，当前为深色主题时使用，表示可切到亮色。
 */
const IconSun = (): ReactElement => (
    <svg
        className="theme-toggle__svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.75" />
        <path
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M4.2 19.8l1.8-1.8M18 6l1.8-1.8"
        />
    </svg>
);

/**
 * 深色（月亮）图示，当前为亮色主题时使用，表示可切回深色。
 */
const IconMoon = (): ReactElement => (
    <svg
        className="theme-toggle__svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 13.2A8.5 8.5 0 0111.8 3a6.8 6.8 0 109 10.2z"
        />
    </svg>
);
