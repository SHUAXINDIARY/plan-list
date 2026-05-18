import { Suspense, lazy, type ReactElement } from "react";
import { BrowserRouter, NavLink, Route, Routes } from "react-router";
import { CONTRIBUTION_FORM_URL } from "./constants/external-links";
import "./App.css";

interface NavigationItem {
    path: string;
    label: string;
    end: boolean;
}

// 应用主导航配置，后续新增页面时从这里扩展入口。
const NAVIGATION_ITEMS: NavigationItem[] = [
    { path: "/", label: "机型资料库", end: true },
    { path: "/personal", label: "个人记录", end: false },
];
const AUTHOR_PROFILE_URL = "https://github.com/SHUAXINDIARY";

// 页面组件按路由拆分，避免应用启动时一次性加载全部页面代码。
const HomePage = lazy(async () => import("./pages/home"));
const PersonalPage = lazy(async () => import("./pages/personal"));

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
    return (
        <BrowserRouter>
            <div className="app-shell">
                <header className="app-header">
                    <div>
                        <p className="app-kicker">Night Flight Archive</p>
                        <p className="app-title">Plane List</p>
                    </div>
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
                        {/* <a
                            className="app-nav__link app-nav__link--cta"
                            href={CONTRIBUTION_FORM_URL}
                            target="_blank"
                            rel="noreferrer"
                        >
                            补充资料
                        </a> */}
                        <a
                            className="app-nav__link"
                            href={AUTHOR_PROFILE_URL}
                            target="_blank"
                            rel="noreferrer"
                        >
                            联系作者
                        </a>
                    </nav>
                </header>

                <main className="app-main">
                    <Suspense
                        fallback={
                            <p className="route-loading">正在载入页面...</p>
                        }
                    >
                        <Routes>
                            <Route path="/" element={<HomePage />} />
                            <Route
                                path="/personal"
                                element={<PersonalPage />}
                            />
                        </Routes>
                    </Suspense>
                </main>
            </div>
        </BrowserRouter>
    );
};

export default App;
