import {
    Suspense,
    lazy,
    useLayoutEffect,
    useState,
    type ReactElement,
} from "react";
import {
    BrowserRouter,
    NavLink,
    Route,
    Routes,
    useLocation,
} from "react-router";
import { BackToTop } from "./components/back-to-top";
import { RouteTransitionLayout } from "./components/route-transition";
import { ThemeToggle } from "./components/theme-toggle";
import { HomePageLoadingFallback } from "./pages/home/FleetResultsSkeleton";
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
    { path: "/", label: "航司WIKI", end: true },
    { path: "/personal", label: "飞行日志", end: false },
    { path: "/photos", label: "飞机照片", end: false },
    { path: "/references", label: "参考资料", end: false },
    { path: "/plane-render", label: "模型渲染", end: false },
];
const AUTHOR_PROFILE_URL = "https://github.com/SHUAXINDIARY";

// 页面组件按路由拆分，避免应用启动时一次性加载全部页面代码。
const HomePage = lazy(async () => import("./pages/home"));
const PersonalPage = lazy(async () => import("./pages/personal"));
const PhotosPage = lazy(async () => import("./pages/photos"));
const ReferencesPage = lazy(async () => import("./pages/references"));
const PlaneRenderPage = lazy(async () => import("./pages/planeRender"));

// 根据路由激活状态生成导航类名，保持当前页面入口高亮。
const getNavigationClassName = ({
    isActive,
}: {
    isActive: boolean;
}): string => {
    return isActive ? "app-nav__link app-nav__link--active" : "app-nav__link";
};

// 根据当前路由选择懒加载 fallback：首页沿用机型资料库骨架屏，其他页面保留轻量状态提示。
const RouteLoadingFallback = (): ReactElement => {
    const location = useLocation();

    if (location.pathname === "/") {
        return <HomePageLoadingFallback />;
    }

    return <p className="route-loading">正在载入页面...</p>;
};

// 应用根组件负责装配导航、路由和页面级懒加载边界。
const App = (): ReactElement => {
    const [themePreference, setThemePreference] = useState<ThemePreference>(
        (): ThemePreference => {
            const fromAttr =
                document.documentElement.getAttribute("data-theme");
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
                    <div className="app-brand" aria-label="Aircraft Log">
                        <span className="app-brand__mark" aria-hidden="true">
                            <svg
                                className="app-brand__icon"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M10.7 14.1 4.6 20.2l-1.8-1.8 3.7-6.1-3.7-2.2 1.4-1.4 4.8.8 3.1-3.1c2.8-2.8 5.7-4.6 7-3.3 1.3 1.3-.5 4.2-3.3 7l-3.1 3.1.8 4.8-1.4 1.4-2.2-3.7Z"
                                    stroke="currentColor"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2.2"
                                />
                            </svg>
                        </span>
                        <span className="app-brand__name">Aircraft Log</span>
                    </div>
                    <div className="app-header__actions">
                        <ThemeToggle
                            preference={themePreference}
                            onToggle={(): void => {
                                setThemePreference(
                                    (previous: ThemePreference) =>
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
                    <Suspense fallback={<RouteLoadingFallback />}>
                        <Routes>
                            <Route element={<RouteTransitionLayout />}>
                                <Route path="/" element={<HomePage />} />
                                <Route
                                    path="/personal"
                                    element={<PersonalPage />}
                                />
                                <Route
                                    path="/photos"
                                    element={<PhotosPage />}
                                />
                                <Route
                                    path="/references"
                                    element={<ReferencesPage />}
                                />
                                <Route
                                    path="/plane-render"
                                    element={<PlaneRenderPage />}
                                />
                            </Route>
                        </Routes>
                    </Suspense>
                </main>
                <BackToTop />
            </div>
        </BrowserRouter>
    );
};

export default App;
