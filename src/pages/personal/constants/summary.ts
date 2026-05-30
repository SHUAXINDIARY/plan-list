import { CHECKED_AIRPORTS } from "../../../constants/external-links";
import type { AirportCountryGroup, CheckedAirport } from "../type";

export { CHECKED_AIRPORTS };

// 根据描述中的国家前缀提取分组名称，让机场列表保持地理层级。
const getAirportCountryName = (airport: CheckedAirport): string => {
    const countryNameMatch = airport.description.match(
        /^(中国|日本|泰国|西班牙|意大利|法国|摩洛哥|韩国)/,
    );

    return countryNameMatch ? countryNameMatch[1] : "其他地区";
};

// 按国家或地区聚合机场，并让打卡数更多的分组优先展示。
const groupAirportsByCountry = (
    airports: CheckedAirport[],
): AirportCountryGroup[] => {
    const airportGroups = new Map<string, CheckedAirport[]>();

    airports.forEach((airport: CheckedAirport): void => {
        const countryName = getAirportCountryName(airport);
        const groupedAirports = airportGroups.get(countryName) ?? [];
        airportGroups.set(countryName, [...groupedAirports, airport]);
    });

    return Array.from(airportGroups.entries())
        .map(
            ([countryName, groupedAirports]: [
                string,
                CheckedAirport[],
            ]): AirportCountryGroup => ({
                countryName,
                airports: groupedAirports,
            }),
        )
        .sort(
            (
                firstGroup: AirportCountryGroup,
                secondGroup: AirportCountryGroup,
            ): number => {
                const airportCountDifference =
                    secondGroup.airports.length - firstGroup.airports.length;

                if (airportCountDifference !== 0) {
                    return airportCountDifference;
                }

                return firstGroup.countryName.localeCompare(
                    secondGroup.countryName,
                    "zh-Hans-CN",
                );
            },
        );
};

/** 个人页按国家或地区分组后的机场打卡列表，供列表区与统计展示复用。 */
export const airportCountryGroups: AirportCountryGroup[] =
    groupAirportsByCountry(CHECKED_AIRPORTS);

/** 机场打卡涉及的国家或地区数量，与 `airportCountryGroups` 长度一致。 */
export const checkedCountryCount: number = airportCountryGroups.length;
