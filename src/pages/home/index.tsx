import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type ReactElement,
} from 'react';

interface ManufacturerFleet {
  manufacturerName: string;
  models: string[];
}

interface AirlineFleet {
  airlineName: string;
  manufacturerCount: number;
  aircraftCount: number;
  manufacturers: ManufacturerFleet[];
}

type AirplaneData = Record<string, Record<string, string[]>>;

// 公开静态数据路径，由 public/data/airplan.json 提供航司与机型映射。
const AIRPLANE_DATA_URL = '/data/airplan.json';

// 制造商筛选的默认值，表示不过滤制造商。
const ALL_MANUFACTURERS_VALUE = 'all';

// 将原始 JSON 转换为页面渲染所需的航司、制造商和机型统计结构。
const createAirlineFleets = (airplaneData: AirplaneData): AirlineFleet[] => {
  return Object.entries(airplaneData)
    .map(([airlineName, manufacturers]: [string, Record<string, string[]>]): AirlineFleet => {
      // 保留制造商层级，便于渲染时按航司和制造商分组展示机型。
      const formattedManufacturers: ManufacturerFleet[] = Object.entries(manufacturers).map(
        ([manufacturerName, models]: [string, string[]]): ManufacturerFleet => ({
          manufacturerName,
          models,
        }),
      );
      // 统计每家航司的机型数量，用于概览和条目元信息。
      const aircraftCount = formattedManufacturers.reduce(
        (total: number, manufacturer: ManufacturerFleet): number => total + manufacturer.models.length,
        0,
      );

      return {
        airlineName,
        manufacturerCount: formattedManufacturers.length,
        aircraftCount,
        manufacturers: formattedManufacturers,
      };
    })
    .sort((firstAirline: AirlineFleet, secondAirline: AirlineFleet): number =>
      firstAirline.airlineName.localeCompare(secondAirline.airlineName, 'zh-Hans-CN'),
    );
};

// 从全部航司机队中提取唯一制造商选项，供下拉筛选使用。
const getManufacturerOptions = (airlineFleets: AirlineFleet[]): string[] => {
  const manufacturerNames = new Set<string>();

  airlineFleets.forEach((airlineFleet: AirlineFleet): void => {
    airlineFleet.manufacturers.forEach((manufacturer: ManufacturerFleet): void => {
      manufacturerNames.add(manufacturer.manufacturerName);
    });
  });

  return Array.from(manufacturerNames).sort((firstName: string, secondName: string): number =>
    firstName.localeCompare(secondName, 'zh-Hans-CN'),
  );
};

// 同时根据航司搜索词和制造商筛选项过滤数据，并重新计算过滤后的统计数量。
const filterAirlineFleets = (
  airlineFleets: AirlineFleet[],
  airlineSearchTerm: string,
  selectedManufacturer: string,
): AirlineFleet[] => {
  const normalizedSearchTerm = airlineSearchTerm.trim().toLocaleLowerCase();

  return airlineFleets
    .filter((airlineFleet: AirlineFleet): boolean =>
      airlineFleet.airlineName.toLocaleLowerCase().includes(normalizedSearchTerm),
    )
    .map((airlineFleet: AirlineFleet): AirlineFleet => {
      // 制造商筛选只影响每家航司内部的制造商分组，不破坏原始数据。
      const filteredManufacturers =
        selectedManufacturer === ALL_MANUFACTURERS_VALUE
          ? airlineFleet.manufacturers
          : airlineFleet.manufacturers.filter(
              (manufacturer: ManufacturerFleet): boolean =>
                manufacturer.manufacturerName === selectedManufacturer,
            );
      const aircraftCount = filteredManufacturers.reduce(
        (total: number, manufacturer: ManufacturerFleet): number => total + manufacturer.models.length,
        0,
      );

      return {
        ...airlineFleet,
        manufacturerCount: filteredManufacturers.length,
        aircraftCount,
        manufacturers: filteredManufacturers,
      };
    })
    .filter((airlineFleet: AirlineFleet): boolean => airlineFleet.manufacturers.length > 0);
};

// 首页负责加载公开机型数据，并提供航司搜索、制造商筛选和分组展示。
const HomePage = (): ReactElement => {
  const [airlineFleets, setAirlineFleets] = useState<AirlineFleet[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [airlineSearchTerm, setAirlineSearchTerm] = useState<string>('');
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>(ALL_MANUFACTURERS_VALUE);

  useEffect((): (() => void) => {
    let isMounted = true;

    // 异步读取 public 目录中的 JSON 数据，并避免组件卸载后继续写入状态。
    const loadAirplaneData = async (): Promise<void> => {
      try {
        setIsLoading(true);

        const response = await fetch(AIRPLANE_DATA_URL);

        if (!response.ok) {
          throw new Error('Airplane data request failed.');
        }

        const airplaneData: AirplaneData = await response.json();

        if (isMounted) {
          setAirlineFleets(createAirlineFleets(airplaneData));
          setErrorMessage('');
        }
      } catch {
        if (isMounted) {
          setErrorMessage('机型数据暂时无法加载，请稍后重试。');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadAirplaneData();

    return (): void => {
      isMounted = false;
    };
  }, []);

  // 只在原始航司机队变化时重新计算制造商下拉选项，避免每次输入都重复整理选项。
  const manufacturerOptions = useMemo((): string[] => {
    return getManufacturerOptions(airlineFleets);
  }, [airlineFleets]);

  // 根据当前搜索词和制造商筛选项生成页面实际展示的数据。
  const filteredAirlineFleets = useMemo((): AirlineFleet[] => {
    return filterAirlineFleets(airlineFleets, airlineSearchTerm, selectedManufacturer);
  }, [airlineFleets, airlineSearchTerm, selectedManufacturer]);

  // 统计过滤结果中的机型数量，用于让概览数字与当前列表保持一致。
  const totalAircraftCount = useMemo((): number => {
    return filteredAirlineFleets.reduce(
      (total: number, airlineFleet: AirlineFleet): number => total + airlineFleet.aircraftCount,
      0,
    );
  }, [filteredAirlineFleets]);

  // 航司搜索输入实时写入状态，驱动列表过滤。
  const handleAirlineSearchChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setAirlineSearchTerm(event.target.value);
  };

  // 制造商下拉切换后立即更新过滤条件。
  const handleManufacturerChange = (event: ChangeEvent<HTMLSelectElement>): void => {
    setSelectedManufacturer(event.target.value);
  };

  return (
    <section className="page-panel aircraft-wiki" aria-labelledby="home-page-title">
      <p className="page-eyebrow">Aircraft Wiki</p>
      <h1 id="home-page-title">航司机型资料库</h1>
      <p>
        按航司浏览当前机队中的制造商与机型，后续可继续扩展到机型详情和个人乘坐状态。
      </p>

      {isLoading ? <p className="data-state data-state--loading">正在载入机型数据...</p> : null}

      {errorMessage ? <p className="data-state data-state--error">{errorMessage}</p> : null}

      {!isLoading && !errorMessage && airlineFleets.length > 0 ? (
        <div className="fleet-toolbar" aria-label="机型数据筛选与概览">
          <div className="fleet-summary" aria-label="机型数据概览">
            <span>{filteredAirlineFleets.length} 家航司</span>
            <span>{totalAircraftCount} 个机型记录</span>
          </div>

          <div className="fleet-filters">
            <label className="fleet-filter">
              <span>航司搜索</span>
              <input
                type="search"
                value={airlineSearchTerm}
                onChange={handleAirlineSearchChange}
                placeholder="输入航司名称"
              />
            </label>

            <label className="fleet-filter">
              <span>机型制造商</span>
              <select value={selectedManufacturer} onChange={handleManufacturerChange}>
                <option value={ALL_MANUFACTURERS_VALUE}>全部制造商</option>
                {manufacturerOptions.map((manufacturerName: string): ReactElement => (
                  <option key={manufacturerName} value={manufacturerName}>
                    {manufacturerName}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      ) : null}

      {!isLoading && !errorMessage && airlineFleets.length === 0 ? (
        <p className="data-state">暂无机型数据。</p>
      ) : null}

      {!isLoading && !errorMessage && airlineFleets.length > 0 && filteredAirlineFleets.length === 0 ? (
        <p className="data-state">没有匹配当前筛选条件的航司或机型。</p>
      ) : null}

      <div className="airline-list">
        {filteredAirlineFleets.map((airlineFleet: AirlineFleet): ReactElement => (
          <article className="airline-entry" key={airlineFleet.airlineName}>
            <header className="airline-entry__header">
              <h2>{airlineFleet.airlineName}</h2>
              <span>
                {airlineFleet.manufacturerCount} 个制造商 / {airlineFleet.aircraftCount} 个机型
              </span>
            </header>

            <div className="manufacturer-list">
              {airlineFleet.manufacturers.map((manufacturer: ManufacturerFleet): ReactElement => (
                <section className="manufacturer-block" key={manufacturer.manufacturerName}>
                  <h3>{manufacturer.manufacturerName}</h3>
                  <ul className="aircraft-model-list">
                    {manufacturer.models.map((model: string): ReactElement => (
                      <li key={`${airlineFleet.airlineName}-${manufacturer.manufacturerName}-${model}`}>
                        {model}
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default HomePage;
