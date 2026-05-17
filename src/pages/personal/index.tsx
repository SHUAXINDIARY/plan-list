import type { ReactElement } from 'react';

const PersonalPage = (): ReactElement => {
  return (
    <section className="page-panel" aria-labelledby="personal-page-title">
      <p className="page-eyebrow">Flight Log</p>
      <h1 id="personal-page-title">我的乘坐记录</h1>
      <p>
        这里将展示个人坐过的航司和机型清单，作为后续个人记录页的占位内容。
      </p>
    </section>
  );
};

export default PersonalPage;
