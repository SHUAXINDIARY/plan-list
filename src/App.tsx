import {
    Suspense,
    lazy,
    useLayoutEffect,
    useState,
    type ReactElement,
} from "react";
import { BrowserRouter, NavLink, Route, Routes } from "react-router";
import { RouteTransitionLayout } from "./components/route-transition";
import { ThemeToggle } from "./components/theme-toggle";
import "./App.css";
import {
    applyThemePreference,
    readThemePreferenceFromStorage,
    updateDocumentThemeColor,
    writeThemePreferenceToStorage,
    type ThemePreference,
} from "./utils/themePreference";

interface NavigationItem {
    /** 路由路径，用于 NavLink 跳转和 key。 */
    path: string;
    /** 导航中展示的中文页面名称。 */
    label: string;
    /** 是否只在完全匹配路径时激活当前导航项。 */
    end: boolean;
}

// 应用主导航配置，后续新增页面时从这里扩展入口。
const NAVIGATION_ITEMS: NavigationItem[] = [
    { path: "/", label: "机型资料库", end: true },
    { path: "/personal", label: "站长记录", end: false },
    { path: "/references", label: "参考资料", end: false },
];
const AUTHOR_PROFILE_URL = "https://github.com/SHUAXINDIARY";

// 页面组件按路由拆分，避免应用启动时一次性加载全部页面代码。
const HomePage = lazy(async () => import("./pages/home"));
const PersonalPage = lazy(async () => import("./pages/personal"));
const ReferencesPage = lazy(async () => import("./pages/references"));

// 根据路由激活状态生成导航类名，保持当前页面入口高亮。
const getNavigationClassName = ({
    isActive,
}: {
    isActive: boolean;
}): string => {
    return isActive ? "app-nav__link app-nav__link--active" : "app-nav__link";
};

// 应用根组件负责装配导航、路由和页面级懒加载边界。
const App = (): ReactElement => {
    const [themePreference, setThemePreference] = useState<ThemePreference>(
        (): ThemePreference => {
            const fromAttr = document.documentElement.getAttribute("data-theme");
            if (fromAttr === "light" || fromAttr === "dark") {
                return fromAttr;
            }
            return readThemePreferenceFromStorage();
        },
    );

    useLayoutEffect(() => {
        applyThemePreference(themePreference);
        writeThemePreferenceToStorage(themePreference);
        updateDocumentThemeColor(themePreference);
    }, [themePreference]);

    return (
        <BrowserRouter>
            <div className="app-shell">
                <header className="app-header">
                    <div>
                        <p className="app-kicker">Night Flight Archive</p>
                        <p className="app-title">Plane List</p>
                    </div>
                    <div className="app-header__actions">
                        <ThemeToggle
                            preference={themePreference}
                            onToggle={(): void => {
                                setThemePreference((previous: ThemePreference) =>
                                    previous === "dark" ? "light" : "dark",
                                );
                            }}
                        />
                        <nav className="app-nav" aria-label="主导航">
                            {NAVIGATION_ITEMS.map(
                                (item: NavigationItem): ReactElement => (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        end={item.end}
                                        className={getNavigationClassName}
                                    >
                                        {item.label}
                                    </NavLink>
                                ),
                            )}
                            <a
                                className="app-nav__link"
                                href={AUTHOR_PROFILE_URL}
                                target="_blank"
                                rel="noreferrer"
                            >
                                联系作者
                            </a>
                        </nav>
                    </div>
                </header>

                <main className="app-main">
                    <Suspense
                        fallback={
                            <p className="route-loading">正在载入页面...</p>
                        }
                    >
                        <Routes>
                            <Route element={<RouteTransitionLayout />}>
                                <Route path="/" element={<HomePage />} />
                                <Route
                                    path="/personal"
                                    element={<PersonalPage />}
                                />
                                <Route
                                    path="/references"
                                    element={<ReferencesPage />}
                                />
                            </Route>
                        </Routes>
                    </Suspense>
                </main>
            </div>
        </BrowserRouter>
    );
};

export default App;
