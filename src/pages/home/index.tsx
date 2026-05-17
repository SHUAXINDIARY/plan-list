import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactElement,
} from 'react';
import './index.css';

interface ManufacturerFleet {
  manufacturerName: string;
  models: string[];
}

interface AirlineFleet {
  airlineName: string;
  passengerAircraftCount: number;
  imgs: string[];
  manufacturerCount: number;
  aircraftCount: number;
  manufacturers: ManufacturerFleet[];
}

interface AirplaneDataItem {
  airline: string;
  passengerAircraftCount: number;
  imgs: string[];
  models: Record<string, string[]>;
}

interface AirlineReferenceSource {
  airlineName: string;
  urls: string[];
}

type AirplaneData = AirplaneDataItem[];

type PassengerAircraftSortOrder = 'passenger-desc' | 'passenger-asc';

// 公开静态数据路径，由 public/data/airplan.json 提供航司与机型映射。
const AIRPLANE_DATA_URL = '/data/airplan.json';

// 制造商筛选的默认值，表示不过滤制造商。
const ALL_MANUFACTURERS_VALUE = 'all';

// 默认按照公开数据中的客机数量从多到少排序，优先展示规模更大的航司。
const DEFAULT_PASSENGER_AIRCRAFT_SORT_ORDER: PassengerAircraftSortOrder = 'passenger-desc';

// 部分航司数据的补充参考来源，用于在页面底部集中展示外部出处。
const AIRLINE_REFERENCE_SOURCES: AirlineReferenceSource[] = [
  {
    airlineName: '全局机队统计',
    urls: ['https://www.caac.gov.cn/XXGK/XXGK/TJSJ/202604/P020260417665629030648.pdf'],
  },
  {
    airlineName: '瑞安航空',
    urls: [
      'https://www.sec.gov/Archives/edgar/data/1038683/000155837025007966/tmb-20250331x20f.htm',
      'https://corporate.ryanair.com/about-us/our-fleet/',
    ],
  },
  {
    airlineName: '全日空',
    urls: ['https://www.ana.co.jp/group/en/company/ana/scale/'],
  },
  {
    airlineName: '亚洲航空',
    urls: [
      'https://www.capitala.com/financial_performance.html/year/2025',
      'https://newsroom.airasia.com/news/airasia-fuels-growth-with-the-arrival-of-four-new-a321neos',
    ],
  },
  {
    airlineName: '泰国航空',
    urls: [
      'https://www.thaiairways.com/en-us/content/sustainable-development/goal-and-achievements/',
      'https://www.flightradar24.com/blog/aviation-news/thai-airways-fleet/',
    ],
  },
  {
    airlineName: '泛航航空',
    urls: ['https://news.transavia.com/en/fleet/'],
  },
  {
    airlineName: '泰国狮子航空',
    urls: [
      'https://www.lionairthai.com/en/ThaiLionAir-Experience/Seating',
      'https://www.lionairthai.com/en/ThaiLionAir-Experience/Aircraft',
    ],
  },
  {
    airlineName: '国泰航空',
    urls: [
      'https://www.cathaypacific.com/content/dam/cx/about-us/investor-relations/interim-annual-reports/en/2025_cx_annual_report_en.pdf',
      'https://www.cathaypacific.com/cx/en_GB/flying-with-us/aircraft-and-fleet.html',
    ],
  },
];

// 判断下拉值是否为受支持的客机数量排序方式，避免直接信任 DOM 字符串。
const isPassengerAircraftSortOrder = (value: string): value is PassengerAircraftSortOrder => {
  return value === 'passenger-desc' || value === 'passenger-asc';
};

// 将原始 JSON 转换为页面渲染所需的航司、制造商和机型统计结构。
const createAirlineFleets = (airplaneData: AirplaneData): AirlineFleet[] => {
  return airplaneData
    .map((airplaneDataItem: AirplaneDataItem): AirlineFleet => {
      // 保留制造商层级，便于渲染时按航司和制造商分组展示机型。
      const formattedManufacturers: ManufacturerFleet[] = Object.entries(airplaneDataItem.models).map(
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
        airlineName: airplaneDataItem.airline,
        passengerAircraftCount: airplaneDataItem.passengerAircraftCount,
        imgs: airplaneDataItem.imgs,
        manufacturerCount: formattedManufacturers.length,
        aircraftCount,
        manufacturers: formattedManufacturers,
      };
    })
    .sort((firstAirline: AirlineFleet, secondAirline: AirlineFleet): number =>
      firstAirline.airlineName.localeCompare(secondAirline.airlineName, 'zh-Hans-CN'),
    );
};

// 按客机数量对航司机队排序，数量相同时用航司名称保证排序稳定。
const sortAirlineFleetsByPassengerAircraftCount = (
  airlineFleets: AirlineFleet[],
  sortOrder: PassengerAircraftSortOrder,
): AirlineFleet[] => {
  return [...airlineFleets].sort((firstAirline: AirlineFleet, secondAirline: AirlineFleet): number => {
    const passengerAircraftDifference =
      sortOrder === 'passenger-desc'
        ? secondAirline.passengerAircraftCount - firstAirline.passengerAircraftCount
        : firstAirline.passengerAircraftCount - secondAirline.passengerAircraftCount;

    if (passengerAircraftDifference !== 0) {
      return passengerAircraftDifference;
    }

    return firstAirline.airlineName.localeCompare(secondAirline.airlineName, 'zh-Hans-CN');
  });
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
  sortOrder: PassengerAircraftSortOrder,
): AirlineFleet[] => {
  const normalizedSearchTerm = airlineSearchTerm.trim().toLocaleLowerCase();

  const filteredAirlineFleets = airlineFleets
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

  return sortAirlineFleetsByPassengerAircraftCount(filteredAirlineFleets, sortOrder);
};

// 首页负责加载公开机型数据，并提供航司搜索、制造商筛选和分组展示。
const HomePage = (): ReactElement => {
  const [airlineFleets, setAirlineFleets] = useState<AirlineFleet[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [airlineSearchTerm, setAirlineSearchTerm] = useState<string>('');
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>(ALL_MANUFACTURERS_VALUE);
  const [selectedSortOrder, setSelectedSortOrder] = useState<PassengerAircraftSortOrder>(
    DEFAULT_PASSENGER_AIRCRAFT_SORT_ORDER,
  );
  const [selectedImageFleet, setSelectedImageFleet] = useState<AirlineFleet | null>(null);
  const fleetResultsRef = useRef<HTMLDivElement | null>(null);

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
    return filterAirlineFleets(airlineFleets, airlineSearchTerm, selectedManufacturer, selectedSortOrder);
  }, [airlineFleets, airlineSearchTerm, selectedManufacturer, selectedSortOrder]);

  // 统计过滤结果中的机型数量，用于让概览数字与当前列表保持一致。
  const totalAircraftCount = useMemo((): number => {
    return filteredAirlineFleets.reduce(
      (total: number, airlineFleet: AirlineFleet): number => total + airlineFleet.aircraftCount,
      0,
    );
  }, [filteredAirlineFleets]);

  // 统计过滤结果中的客机数量，用于呈现新数据结构提供的机队规模。
  const totalPassengerAircraftCount = useMemo((): number => {
    return filteredAirlineFleets.reduce(
      (total: number, airlineFleet: AirlineFleet): number =>
        total + airlineFleet.passengerAircraftCount,
      0,
    );
  }, [filteredAirlineFleets]);

  // 将筛选条件组合成视图 key，让结果区在数据切换时执行进入过渡。
  const filteredViewKey = `${airlineSearchTerm.trim()}-${selectedManufacturer}-${selectedSortOrder}`;

  useEffect((): void => {
    // 筛选条件变化后重置结果区滚动位置，避免新结果停留在旧列表的中段。
    if (fleetResultsRef.current) {
      fleetResultsRef.current.scrollTop = 0;
    }
  }, [filteredViewKey]);

  // 航司搜索输入实时写入状态，驱动列表过滤。
  const handleAirlineSearchChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setAirlineSearchTerm(event.target.value);
  };

  // 制造商下拉切换后立即更新过滤条件。
  const handleManufacturerChange = (event: ChangeEvent<HTMLSelectElement>): void => {
    setSelectedManufacturer(event.target.value);
  };

  // 排序下拉切换后按客机数量重新组织当前过滤结果。
  const handleSortOrderChange = (event: ChangeEvent<HTMLSelectElement>): void => {
    if (isPassengerAircraftSortOrder(event.target.value)) {
      setSelectedSortOrder(event.target.value);
    }
  };

  // 打开当前航司的图片弹窗，弹窗内部根据 imgs 数组渲染图片或空状态。
  const handleImageDialogOpen = (airlineFleet: AirlineFleet): void => {
    setSelectedImageFleet(airlineFleet);
  };

  // 关闭图片弹窗并清理当前选中的航司。
  const handleImageDialogClose = (): void => {
    setSelectedImageFleet(null);
  };

  useEffect((): (() => void) => {
    // 弹窗打开时允许用户使用 Escape 快速关闭，保持键盘操作可用。
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setSelectedImageFleet(null);
      }
    };

    if (selectedImageFleet) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return (): void => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedImageFleet]);

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
            <span>{totalPassengerAircraftCount} 架客机</span>
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

            <label className="fleet-filter">
              <span>客机数量排序</span>
              <select value={selectedSortOrder} onChange={handleSortOrderChange}>
                <option value="passenger-desc">由多到少</option>
                <option value="passenger-asc">由少到多</option>
              </select>
            </label>
          </div>
        </div>
      ) : null}

      {!isLoading && !errorMessage && airlineFleets.length === 0 ? (
        <p className="data-state">暂无机型数据。</p>
      ) : null}

      {!isLoading && !errorMessage && airlineFleets.length > 0 ? (
        <div className="fleet-results" ref={fleetResultsRef} aria-live="polite">
          {filteredAirlineFleets.length === 0 ? (
            <p className="data-state data-state--filtered-empty" key={`empty-${filteredViewKey}`}>
              没有匹配当前筛选条件的航司或机型。
            </p>
          ) : (
            <div className="airline-list" key={`list-${filteredViewKey}`}>
              {filteredAirlineFleets.map((airlineFleet: AirlineFleet): ReactElement => (
                <article className="airline-entry" key={airlineFleet.airlineName}>
                  <header className="airline-entry__header">
                    <div className="airline-entry__title">
                      <h2>{airlineFleet.airlineName}</h2>
                      <span>
                        {airlineFleet.passengerAircraftCount} 架客机 / {airlineFleet.manufacturerCount}{' '}
                        个制造商 / {airlineFleet.aircraftCount} 个机型
                      </span>
                    </div>
                    <button
                      className="airline-entry__image-button"
                      type="button"
                      onClick={(): void => handleImageDialogOpen(airlineFleet)}
                    >
                      查看图片
                    </button>
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
          )}
        </div>
      ) : null}

      <details className="reference-sources">
        <summary className="reference-sources__summary">
          <span>
            <span className="reference-sources__eyebrow">References</span>
            <span className="reference-sources__title">数据参考来源</span>
          </span>
          <span className="reference-sources__summary-note">
            {AIRLINE_REFERENCE_SOURCES.length} 组来源，点击展开
          </span>
        </summary>
        <div className="reference-sources__list">
          {AIRLINE_REFERENCE_SOURCES.map(
            (referenceSource: AirlineReferenceSource): ReactElement => (
              <article className="reference-source" key={referenceSource.airlineName}>
                <h3>{referenceSource.airlineName}</h3>
                <ul>
                  {referenceSource.urls.map((referenceUrl: string, referenceIndex: number): ReactElement => (
                    <li key={`${referenceSource.airlineName}-${referenceUrl}`}>
                      <a href={referenceUrl} target="_blank" rel="noreferrer">
                        参考来源 {referenceIndex + 1}
                      </a>
                    </li>
                  ))}
                </ul>
              </article>
            ),
          )}
        </div>
      </details>

      {selectedImageFleet ? (
        <div className="image-dialog-backdrop" role="presentation">
          <section
            className="image-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="image-dialog-title"
          >
            <header className="image-dialog__header">
              <div>
                <p className="image-dialog__eyebrow">Airline Images</p>
                <h2 id="image-dialog-title">{selectedImageFleet.airlineName} 图片</h2>
              </div>
              <button
                className="image-dialog__close"
                type="button"
                onClick={handleImageDialogClose}
                aria-label="关闭图片弹窗"
              >
                关闭
              </button>
            </header>

            {selectedImageFleet.imgs.length > 0 ? (
              <div className="image-dialog__grid">
                {selectedImageFleet.imgs.map((imageUrl: string, imageIndex: number): ReactElement => (
                  <img
                    key={`${selectedImageFleet.airlineName}-image-${imageUrl}`}
                    src={imageUrl}
                    alt={`${selectedImageFleet.airlineName} 图片 ${imageIndex + 1}`}
                    loading="lazy"
                  />
                ))}
              </div>
            ) : (
              <p className="image-dialog__empty">当前航司暂未录入图片。</p>
            )}
          </section>
        </div>
      ) : null}
    </section>
  );
};

export default HomePage;
