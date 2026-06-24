# 基于 VueUse useIdle 的站点用户活跃时长统计方案

## 1. 背景与目标

当前站点需要统计用户在站点内的真实活跃时长，而不是单纯统计页面停留时间。

本方案设计一个通用 Hook，用于在用户聚焦当前站点时判断其是否真实活跃，并按区间记录活跃开始时间、结束时间和持续时长。当用户离开站点、切换 App、切换标签页或关闭页面时，强制结束当前活跃区间并触发上报。

核心目标：

- 判断用户当前是否聚焦在本站点。
- 判断用户在聚焦状态下是否真实活跃。
- 记录每段活跃区间的开始时间、结束时间和持续时长。
- 在用户持续活跃时定时上报活跃时长。
- 在用户离开站点或页面生命周期结束时强制上报最后一段活跃区间。

## 2. 核心思路

使用 VueUse 的 `useIdle` 判断用户是否长时间无操作。

同时结合浏览器页面生命周期事件判断用户是否仍然停留在当前站点：

- `visibilitychange`
- `pagehide`
- `beforeunload`
- `focus`
- `blur`

其中 `useIdle` 负责判断用户是否在当前页面内长时间无输入行为，页面生命周期事件负责判断用户是否仍然处在本站点上下文中。两者需要同时成立，才能把时间计入有效活跃区间。

最终通过一个简单状态机维护活跃区间：

```text
用户聚焦当前站点 + 未进入 idle
        ↓
开始活跃区间

用户 idle / 页面隐藏 / 窗口失焦 / 页面关闭
        ↓
结束活跃区间并上报
```

## 3. Hook 命名

推荐命名：

```ts
useActiveDurationReporter
```

如果业务中更强调用户维度，也可以命名为：

```ts
useUserActiveTimeReporter
```

## 4. Hook 职责

Hook 只负责活跃时间采集、区间切分和上报调度，不直接绑定具体业务接口。

具体接口请求由调用方通过 `report` 函数注入：

```ts
type ActiveDurationReportReason =
  | 'interval'
  | 'idle'
  | 'hidden'
  | 'blur'
  | 'pagehide'
  | 'beforeunload'
  | 'route-change'
  | 'manual';

interface ActiveDurationReportPayload {
  segmentId: string;
  startTime: number;
  endTime: number;
  duration: number;
  reason: ActiveDurationReportReason;
  reportedAt: number;
}

type ReportActiveDuration = (payload: ActiveDurationReportPayload) => Promise<void> | void;
```

## 5. 参数设计

```ts
interface UseActiveDurationReporterOptions {
  idleTimeout?: number;
  reportInterval?: number;
  minReportDuration?: number;
  maxSegmentDuration?: number;
  immediate?: boolean;
  report: ReportActiveDuration;
}
```

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `idleTimeout` | `number` | `60_000` | 多久无操作后认为用户空闲 |
| `reportInterval` | `number` | `30_000` | 活跃状态下的定时上报间隔 |
| `minReportDuration` | `number` | `1_000` | 小于该时长的活跃区间不上报 |
| `maxSegmentDuration` | `number` | `300_000` | 单段活跃区间最大时长，超过后强制切段上报 |
| `immediate` | `boolean` | `true` | 是否初始化后立即开始监听 |
| `report` | `ReportActiveDuration` | 必填 | 活跃时长上报函数 |

## 6. 返回值设计

```ts
interface UseActiveDurationReporterReturn {
  isActive: Readonly<Ref<boolean>>;
  isIdle: Readonly<Ref<boolean>>;
  activeStartTime: Readonly<Ref<number | null>>;
  start: () => void;
  stop: () => Promise<void>;
  flush: (reason?: ActiveDurationReportReason) => Promise<void>;
}
```

| 返回值 | 说明 |
| --- | --- |
| `isActive` | 当前是否处于活跃统计区间 |
| `isIdle` | VueUse `useIdle` 返回的 idle 状态 |
| `activeStartTime` | 当前活跃区间开始时间 |
| `start` | 手动开始监听 |
| `stop` | 停止监听，并结束当前活跃区间 |
| `flush` | 手动结束并上报当前活跃区间 |

## 7. 活跃判定规则

用户被认为活跃，需要同时满足：

1. 当前页面可见：`document.visibilityState === 'visible'`
2. 当前窗口处于聚焦状态：`document.hasFocus() === true`
3. VueUse `useIdle` 判断为非空闲：`idle.value === false`

即：

```ts
const shouldBeActive = () => document.visibilityState === 'visible' && document.hasFocus() && !idle.value;
```

这里建议使用普通函数，而不是 `computed`。`document.visibilityState` 和 `document.hasFocus()` 不是 Vue 响应式数据，如果直接放入 `computed`，可能因为缓存导致页面可见性和焦点状态判断不够可靠。

## 8. 区间统计规则

### 8.1 开始活跃区间

当用户从非活跃状态进入活跃状态时，记录区间开始时间：

```ts
activeStartTime.value = Date.now();
isActive.value = true;
```

### 8.2 结束活跃区间

当出现以下情况时，结束当前活跃区间：

- 用户进入 idle。
- 页面被隐藏。
- 窗口失焦。
- 用户切换标签页。
- 用户切换 App。
- 页面刷新、跳转或关闭。
- 业务侧手动停止统计。

结束时计算：

```ts
const endTime = Date.now();
const duration = endTime - activeStartTime.value;
```

如果 `duration >= minReportDuration`，则触发上报。

### 8.3 定时上报

在活跃状态下，每隔 `reportInterval` 上报一次当前活跃区间。

定时上报后，应将新的活跃起点重置为当前时间，避免重复统计：

```ts
report({
  startTime,
  endTime: now,
  duration: now - startTime,
  reason: 'interval',
});

activeStartTime.value = now;
```

### 8.4 最大区间保护

浏览器进入后台、系统休眠、设备锁屏、网络恢复等场景可能导致单段区间异常变长。

建议增加 `maxSegmentDuration`，当当前活跃区间超过该时长时，即使还未到常规上报间隔，也应强制切段上报：

```ts
if (now - activeStartTime.value >= maxSegmentDuration) {
  await reportCurrentSegment('interval');
}
```

这样可以降低异常长区间对统计结果的污染。

## 9. 生命周期事件处理

### 9.1 visibilitychange

当页面变为隐藏时：

```ts
flush('hidden');
```

当页面重新可见时：

```ts
syncActiveState();
```

### 9.2 blur

当窗口失焦时：

```ts
flush('blur');
```

### 9.3 focus

当窗口重新聚焦时：

```ts
syncActiveState();
```

### 9.4 pagehide

当页面被卸载、进入 bfcache 或关闭时：

```ts
flush('pagehide');
```

### 9.5 beforeunload

作为页面关闭兼容兜底：

```ts
flush('beforeunload');
```

页面关闭阶段不建议依赖普通异步请求，推荐业务上报层使用 `navigator.sendBeacon`。

现代浏览器中 `beforeunload` 的触发并不总是稳定，也可能影响 bfcache。优先级建议为：

1. `visibilitychange`
2. `pagehide`
3. `beforeunload`

### 9.6 SPA 路由切换

如果活跃时长统计维度是“站点总活跃时长”，SPA 内部路由切换可以不结束区间，只更新上报上下文。

如果统计维度是“页面活跃时长”，则应在路由离开时结束当前页面区间：

```ts
await flush('route-change');
```

新页面进入后，再根据当前页面可见性、焦点状态和 idle 状态开启新的活跃区间。

## 10. 上报策略

### 10.1 常规上报

页面正常运行时，使用调用方传入的 `report` 方法：

```ts
await report(payload);
```

### 10.2 页面关闭上报

页面关闭、刷新、跳转时，异步请求可能无法完成。

建议业务层在 `report` 内部根据 `reason` 判断是否使用 `sendBeacon`：

```ts
async function reportActiveDuration(payload: ActiveDurationReportPayload) {
  const isClosingPage = payload.reason === 'pagehide' || payload.reason === 'beforeunload';

  if (isClosingPage && navigator.sendBeacon) {
    const blob = new Blob([JSON.stringify(payload)], {
      type: 'application/json',
    });

    navigator.sendBeacon('/api/active-duration', blob);
    return;
  }

  await request.post('/api/active-duration', payload);
}
```

### 10.3 并发上报与幂等

定时上报、`visibilitychange`、`blur`、`pagehide` 可能在很短时间内连续触发。为了避免重复上报或区间交叉，建议同时做两层保护：

- 前端在 `flush` 时先关闭当前活跃区间，再执行上报。
- 每个区间生成稳定的 `segmentId`，后端按 `segmentId` 幂等去重。

如果业务对顺序要求较高，可以在 Hook 内部维护一个串行上报队列：

```ts
let reportQueue = Promise.resolve();

const enqueueReport = (payload: ActiveDurationReportPayload) => {
  reportQueue = reportQueue.then(() => report(payload));
  return reportQueue;
};
```

### 10.4 失败补报

普通上报失败时，不建议直接丢弃数据。

可选策略：

- 优先放入内存队列，下一次上报成功后顺带重试。
- 对重要数据写入 `localStorage` 或 `IndexedDB`，页面下次启动时补报。
- 监听浏览器 `online` 事件，在网络恢复后补报。
- 页面关闭阶段尽量使用 `sendBeacon`，关闭失败不强依赖重试。

补报数据仍应携带原始 `segmentId`，避免服务端重复计数。

## 11. Hook 参考实现

```ts
import { readonly, ref, watch } from 'vue';
import { useEventListener, useIdle, useIntervalFn } from '@vueuse/core';

type ActiveDurationReportReason =
  | 'interval'
  | 'idle'
  | 'hidden'
  | 'blur'
  | 'pagehide'
  | 'beforeunload'
  | 'route-change'
  | 'manual';

interface ActiveDurationReportPayload {
  segmentId: string;
  startTime: number;
  endTime: number;
  duration: number;
  reason: ActiveDurationReportReason;
  reportedAt: number;
}

type ReportActiveDuration = (payload: ActiveDurationReportPayload) => Promise<void> | void;

interface UseActiveDurationReporterOptions {
  idleTimeout?: number;
  reportInterval?: number;
  minReportDuration?: number;
  maxSegmentDuration?: number;
  immediate?: boolean;
  report: ReportActiveDuration;
}

export function useActiveDurationReporter(options: UseActiveDurationReporterOptions) {
  const {
    idleTimeout = 60_000,
    reportInterval = 30_000,
    minReportDuration = 1_000,
    maxSegmentDuration = 300_000,
    immediate = true,
    report,
  } = options;

  const { idle } = useIdle(idleTimeout);

  const isActive = ref(false);
  const activeStartTime = ref<number | null>(null);
  const activeSegmentId = ref<string | null>(null);
  let reportQueue = Promise.resolve();

  const createSegmentId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const canBeActive = () => document.visibilityState === 'visible' && document.hasFocus() && !idle.value;

  const enqueueReport = (payload: ActiveDurationReportPayload) => {
    reportQueue = reportQueue.then(() => report(payload));
    return reportQueue;
  };

  const beginActive = () => {
    if (isActive.value) return;

    isActive.value = true;
    activeStartTime.value = Date.now();
    activeSegmentId.value = createSegmentId();
  };

  const reportCurrentSegment = async (reason: ActiveDurationReportReason) => {
    if (activeStartTime.value === null || activeSegmentId.value === null) return;

    const startTime = activeStartTime.value;
    const endTime = Date.now();
    const duration = endTime - startTime;

    if (duration < minReportDuration) return;

    await enqueueReport({
      segmentId: activeSegmentId.value,
      startTime,
      endTime,
      duration,
      reason,
      reportedAt: Date.now(),
    });
  };

  const flush = async (reason: ActiveDurationReportReason = 'manual') => {
    if (!isActive.value) return;

    isActive.value = false;

    await reportCurrentSegment(reason);

    activeStartTime.value = null;
    activeSegmentId.value = null;
  };

  const syncActiveState = async () => {
    if (canBeActive()) {
      beginActive();
      return;
    }

    await flush(idle.value ? 'idle' : 'hidden');
  };

  const { pause, resume } = useIntervalFn(
    async () => {
      if (!isActive.value || activeStartTime.value === null) return;

      const now = Date.now();
      const duration = now - activeStartTime.value;

      if (duration < minReportDuration) return;

      if (duration < reportInterval && duration < maxSegmentDuration) return;

      await reportCurrentSegment('interval');

      activeStartTime.value = now;
      activeSegmentId.value = createSegmentId();
    },
    reportInterval,
    {
      immediate,
    },
  );

  watch(idle, syncActiveState);

  useEventListener(document, 'visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flush('hidden');
      return;
    }

    syncActiveState();
  });

  useEventListener(window, 'blur', () => {
    flush('blur');
  });

  useEventListener(window, 'focus', () => {
    syncActiveState();
  });

  useEventListener(window, 'pagehide', () => {
    flush('pagehide');
  });

  useEventListener(window, 'beforeunload', () => {
    flush('beforeunload');
  });

  const start = () => {
    resume();
    syncActiveState();
  };

  const stop = async () => {
    pause();
    await flush('manual');
  };

  if (immediate) {
    start();
  }

  return {
    isActive: readonly(isActive),
    isIdle: readonly(idle),
    activeStartTime: readonly(activeStartTime),
    start,
    stop,
    flush,
  };
}
```

## 12. 推荐使用方式

```ts
useActiveDurationReporter({
  idleTimeout: 60_000,
  reportInterval: 30_000,
  minReportDuration: 1_000,
  report: reportActiveDuration,
});
```

如果需要按页面、模块或路由区分活跃时长，可以在业务上报函数中补充上下文：

```ts
async function reportActiveDuration(payload: ActiveDurationReportPayload) {
  await request.post('/api/active-duration', {
    ...payload,
    pageUrl: window.location.href,
    routeName: route.name,
    sessionId,
  });
}
```

## 13. 数据结构建议

```ts
interface ActiveDurationReportDTO {
  segmentId: string;
  userId?: string;
  pageUrl: string;
  pageTitle?: string;
  routeName?: string;
  sessionId?: string;
  appVersion?: string;
  clientTimeZone: string;
  startTime: number;
  endTime: number;
  duration: number;
  reason: ActiveDurationReportReason;
  reportedAt: number;
}
```

建议按业务需要补充：

- 当前路由。
- 页面模块。
- 业务场景 ID。
- 登录用户 ID。
- session ID。
- 客户端时区。
- 应用版本。
- 客户端时间戳与服务端接收时间。

## 14. 风险与注意事项

### 14.1 避免重复上报

定时上报后必须重置 `activeStartTime`，否则会重复统计已上报时间。

### 14.2 页面关闭时请求可能丢失

`beforeunload` 和 `pagehide` 中不应依赖普通异步请求。

推荐使用：

```ts
navigator.sendBeacon();
```

### 14.3 idle 不等于离开页面

`useIdle` 只能判断用户是否长时间没有输入行为。

用户切换 App、切换标签页、关闭页面等行为，需要结合页面生命周期事件处理。

### 14.4 页面重新聚焦后需要重新开段

用户从隐藏、失焦或 idle 状态恢复后，如果页面重新可见、窗口重新聚焦且用户不处于 idle，应创建新的活跃区间，而不是复用旧区间。

### 14.5 后端应支持幂等和容错

由于浏览器生命周期事件存在不确定性，后端建议支持：

- 小时间段合并。
- 重复区间去重。
- 异常超长区间截断。
- 客户端时间和服务端时间偏差处理。

### 14.6 明确 idle 事件范围

需要确认产品定义中的“活跃”是否包含滚动阅读、触摸滑动、键盘输入和鼠标移动等行为。

如果业务认为“滚动阅读”也算活跃，应确认 `useIdle` 的事件监听范围覆盖 `scroll`、`wheel`、`touchstart` 等输入事件；如果默认行为不满足，应在 Hook 中额外补充事件监听并调用重置逻辑。

### 14.7 明确统计粒度

在接入前需要明确统计粒度：

- 站点级：整个 SPA 会话内持续统计，路由切换不结束区间。
- 页面级：路由切换时结束当前页面区间，并为新页面重新开段。
- 业务模块级：由业务模块显式调用 `start`、`stop` 或 `flush` 控制区间边界。

## 15. 验收建议

建议至少覆盖以下场景：

| 场景 | 预期结果 |
| --- | --- |
| 用户进入页面并持续操作 | 开始活跃区间，并按 `reportInterval` 定时上报 |
| 用户超过 `idleTimeout` 无操作 | 结束当前区间，以上报原因 `idle` 上报 |
| 用户切换浏览器标签页 | 结束当前区间，以上报原因 `hidden` 上报 |
| 用户切换到其他 App | 结束当前区间，以上报原因 `blur` 或 `hidden` 上报 |
| 用户重新回到页面 | 如果满足活跃条件，则开启新的活跃区间 |
| 用户刷新或关闭页面 | 强制结束当前区间，并尽量通过 `sendBeacon` 上报 |
| 活跃时间小于 `minReportDuration` | 不触发上报 |
| 活跃时间超过 `maxSegmentDuration` | 强制切段上报，避免异常长区间 |
| 定时上报和页面隐藏同时触发 | 不出现重复区间，后端可通过 `segmentId` 幂等去重 |
| SPA 页面路由切换 | 按统计粒度决定继续站点区间或以 `route-change` 结束页面区间 |
| 网络失败后恢复 | 普通上报失败的数据可通过缓存队列补报 |

## 16. 总结

该方案通过 VueUse `useIdle` 判断用户是否真实活跃，通过浏览器页面生命周期事件判断用户是否仍聚焦本站点。

整体可以覆盖：

- 用户持续活跃时的定时上报。
- 用户 idle 后的结束上报。
- 切换标签页或 App 后的强制结束。
- 页面刷新、关闭、跳转时的兜底上报。
- SPA 路由切换时的页面级统计。
- 异常长区间、并发上报和失败补报场景。

最终可以得到比页面停留时间更接近真实使用行为的站点活跃时长数据。
