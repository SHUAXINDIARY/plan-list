import type { ReactElement } from 'react';
import { BrowserRouter, NavLink, Route, Routes } from 'react-router';
import './App.css';
import HomePage from './pages/home';
import PersonalPage from './pages/personal';

interface NavigationItem {
  path: string;
  label: string;
  end: boolean;
}

// 应用主导航配置，后续新增页面时从这里扩展入口。
const NAVIGATION_ITEMS: NavigationItem[] = [
  { path: '/', label: '机型资料库', end: true },
  { path: '/personal', label: '我的乘坐记录', end: false },
];

const getNavigationClassName = ({ isActive }: { isActive: boolean }): string => {
  return isActive ? 'app-nav__link app-nav__link--active' : 'app-nav__link';
};

const App = (): ReactElement => {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <header className="app-header">
          <div>
            <p className="app-kicker">Night Flight Archive</p>
            <p className="app-title">Plan List</p>
          </div>
          <nav className="app-nav" aria-label="主导航">
            {NAVIGATION_ITEMS.map((item: NavigationItem): ReactElement => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={getNavigationClassName}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </header>

        <main className="app-main">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/personal" element={<PersonalPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;
