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
            <span
                className="theme-toggle__icon"
                key={preference}
                aria-hidden
            >
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
        <circle
            cx="12"
            cy="12"
            r="4"
            stroke="currentColor"
            strokeWidth="1.75"
        />
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
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        <path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"></path>
    </svg>
);
