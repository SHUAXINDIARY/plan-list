import type { AirlineReferenceSource } from "../home/type.d.ts";

export enum cate_enum {
    brand = "brand",
    dealer = "dealer",
    other = "other",
    community = "community",
    wiki = "wiki",
    offical = "offical",
}

export const CATE_MAP = {
    [cate_enum.brand]: "模型品牌",
    [cate_enum.dealer]: "模型店家",
    [cate_enum.community]: "社区",
    [cate_enum.other]: "其他",
    [cate_enum.wiki]: "维基百科",
    [cate_enum.offical]: "官网",
};

// 部分航司数据的补充参考来源，用于在页面底部集中展示外部出处。
export const AIRLINE_REFERENCE_SOURCES: AirlineReferenceSource[] = [
    {
        airlineName: "flightradar24",
        category: cate_enum.community,
        urls: ["https://www.flightradar24.com/"],
    },
    {
        airlineName: "航机影像与开放媒体",
        category: cate_enum.community,
        urls: [
            "https://www.jetphotos.com/",
            "https://commons.wikimedia.org/",
            "https://www.planespotters.net/",
        ],
    },
    {
        airlineName: "模型品牌官网",
        category: cate_enum.brand,
        urls: [
            "https://inflight200-models.com/",
            "https://www.geminijets.com/",
            "https://yywings.com/",
            "https://www.jcwings.com/",
            "https://www.sqwings.com/",
            "https://www.herpa.de/en/buy-products/wings",
            "https://ngmodels.com/database",
        ],
    },
    {
        airlineName: "模型店家自营官网",
        category: cate_enum.dealer,
        urls: [
            "https://hikoukicyann.stores.jp/",
            "https://www.aviationmegastore.com/en/",
            "https://futurewingsmodel.com/",
            "https://top-gun.jp/zh",
            "https://www.modelaircraftdatabase.com",
            "https://www.collectorwingsmodel.com",
            "https://www.top-gun.jp/",
        ],
    },
    {
        airlineName: "民航休息小站",
        category: cate_enum.community,
        urls: ["http://www.xmyzl.com/index.php"],
    },
    // 官网 + wiki
    {
        airlineName: "全局机队统计",
        category: cate_enum.offical,
        urls: [
            "https://www.caac.gov.cn/XXGK/XXGK/TJSJ/202604/P020260417665629030648.pdf",
        ],
    },
    {
        airlineName: "sky team virtual",
        category: cate_enum.community,
        urls: ["https://skyteamvirtual.org/"],
    },
    {
        airlineName: "oneworld virtual",
        category: cate_enum.community,
        urls: ["https://oneworldvirtual.org/"],
    },

    {
        airlineName: "中国东方航空",
        category: cate_enum.wiki,
        urls: ["https://en.wikipedia.org/wiki/China_Eastern_Airlines"],
    },
    {
        airlineName: "中国南方航空",
        category: cate_enum.wiki,
        urls: ["https://en.wikipedia.org/wiki/China_Southern_Airlines"],
    },
    {
        airlineName: "中国国际航空",
        category: cate_enum.offical,
        urls: [
            "https://ru.airchina.com/RU/GB/about-us/profile/",
            "https://en.wikipedia.org/wiki/Air_China",
        ],
    },
    {
        airlineName: "海南航空",
        category: cate_enum.offical,
        urls: [
            "https://www.hainanairlines.com/HUPortal/dyn/portal/DisplayPage?COUNTRY_SITE=INT&LANGUAGE=GB&PAGE=FLET&SITE=CBHZCBHZ",
            "https://en.wikipedia.org/wiki/Hainan_Airlines",
        ],
    },
    {
        airlineName: "深圳航空",
        category: cate_enum.wiki,
        urls: ["https://en.wikipedia.org/wiki/Shenzhen_Airlines"],
    },
    {
        airlineName: "四川航空",
        category: cate_enum.wiki,
        urls: ["https://en.wikipedia.org/wiki/Sichuan_Airlines"],
    },
    {
        airlineName: "厦门航空",
        category: cate_enum.wiki,
        urls: ["https://en.wikipedia.org/wiki/XiamenAir"],
    },
    {
        airlineName: "国泰航空",
        category: cate_enum.offical,
        urls: [
            "https://www.cathaypacific.com/content/dam/cx/about-us/investor-relations/interim-annual-reports/en/2025_cx_annual_report_en.pdf",
            "https://www.cathaypacific.com/cx/en_GB/flying-with-us/aircraft-and-fleet.html",
            "https://en.wikipedia.org/wiki/Cathay_Pacific_fleet",
        ],
    },
    {
        airlineName: "山东航空",
        category: cate_enum.wiki,
        urls: ["https://en.wikipedia.org/wiki/Shandong_Airlines"],
    },
    {
        airlineName: "春秋航空",
        category: cate_enum.wiki,
        urls: [
            "https://www.planespotters.net/airline/Spring-Airlines",
            "https://en.wikipedia.org/wiki/Spring_Airlines",
        ],
    },
    {
        airlineName: "春秋航空日本",
        category: cate_enum.wiki,
        urls: [
            "https://www.planespotters.net/airline/Spring-Japan",
            "https://en.wikipedia.org/wiki/Spring_Japan",
        ],
    },
    {
        airlineName: "天津航空",
        category: cate_enum.wiki,
        urls: ["https://en.wikipedia.org/wiki/Tianjin_Airlines"],
    },
    {
        airlineName: "吉祥航空",
        category: cate_enum.wiki,
        urls: ["https://en.wikipedia.org/wiki/Juneyao_Air"],
    },
    {
        airlineName: "上海航空",
        category: cate_enum.wiki,
        urls: ["https://en.wikipedia.org/wiki/Shanghai_Airlines"],
    },
    {
        airlineName: "成都航空",
        category: cate_enum.wiki,
        urls: ["https://en.wikipedia.org/wiki/Chengdu_Airlines"],
    },
    {
        airlineName: "首都航空",
        category: cate_enum.wiki,
        urls: ["https://en.wikipedia.org/wiki/Beijing_Capital_Airlines"],
    },
    {
        airlineName: "华夏航空",
        category: cate_enum.wiki,
        urls: ["https://en.wikipedia.org/wiki/China_Express_Airlines"],
    },
    {
        airlineName: "长龙航空",
        category: cate_enum.wiki,
        urls: ["https://en.wikipedia.org/wiki/Loong_Air"],
    },
    {
        airlineName: "中国联合航空",
        category: cate_enum.wiki,
        urls: ["https://en.wikipedia.org/wiki/China_United_Airlines"],
    },
    {
        airlineName: "祥鹏航空",
        category: cate_enum.wiki,
        urls: ["https://en.wikipedia.org/wiki/Lucky_Air_(airline)"],
    },
    {
        airlineName: "西藏航空",
        category: cate_enum.wiki,
        urls: ["https://en.wikipedia.org/wiki/Tibet_Airlines"],
    },
    {
        airlineName: "西部航空",
        category: cate_enum.wiki,
        urls: ["https://en.wikipedia.org/wiki/West_Air_(China)"],
    },
    {
        airlineName: "香港快运航空",
        category: cate_enum.offical,
        urls: [
            "https://www.hkexpress.com/en-HK/Plan/Travel/Our-Fleet",
            "https://en.wikipedia.org/wiki/HK_Express",
        ],
    },
    {
        airlineName: "青岛航空",
        category: cate_enum.wiki,
        urls: ["https://en.wikipedia.org/wiki/Qingdao_Airlines"],
    },
    {
        airlineName: "昆明航空",
        category: cate_enum.wiki,
        urls: ["https://en.wikipedia.org/wiki/Kunming_Airlines"],
    },
    {
        airlineName: "香港航空",
        category: cate_enum.wiki,
        urls: ["https://en.wikipedia.org/wiki/Hong_Kong_Airlines"],
    },
    {
        airlineName: "重庆航空",
        category: cate_enum.wiki,
        urls: ["https://en.wikipedia.org/wiki/Chongqing_Airlines"],
    },
    {
        airlineName: "河北航空",
        category: cate_enum.wiki,
        urls: ["https://en.wikipedia.org/wiki/Hebei_Airlines"],
    },
    {
        airlineName: "九元航空",
        category: cate_enum.wiki,
        urls: ["https://en.wikipedia.org/wiki/9_Air"],
    },
    {
        airlineName: "瑞丽航空",
        category: cate_enum.wiki,
        urls: ["https://en.wikipedia.org/wiki/Ruili_Airlines"],
    },
    {
        airlineName: "北部湾航空",
        category: cate_enum.wiki,
        urls: ["https://en.wikipedia.org/wiki/Guangxi_Beibu_Gulf_Airlines"],
    },
    {
        airlineName: "澳门航空",
        category: cate_enum.wiki,
        urls: ["https://en.wikipedia.org/wiki/Air_Macau"],
    },
    {
        airlineName: "东海航空",
        category: cate_enum.wiki,
        urls: ["https://en.wikipedia.org/wiki/Donghai_Airlines"],
    },
    {
        airlineName: "奥凯航空",
        category: cate_enum.wiki,
        urls: ["https://en.wikipedia.org/wiki/Okay_Airways"],
    },
    {
        airlineName: "多彩贵州航空",
        category: cate_enum.wiki,
        urls: ["https://en.wikipedia.org/wiki/Colorful_Guizhou_Airlines"],
    },
    {
        airlineName: "江西航空",
        category: cate_enum.wiki,
        urls: ["https://en.wikipedia.org/wiki/Jiangxi_Air"],
    },
    {
        airlineName: "乌鲁木齐航空",
        category: cate_enum.wiki,
        urls: ["https://en.wikipedia.org/wiki/Urumqi_Air"],
    },
    {
        airlineName: "福州航空",
        category: cate_enum.wiki,
        urls: ["https://en.wikipedia.org/wiki/Fuzhou_Airlines"],
    },
    {
        airlineName: "湖南航空",
        category: cate_enum.wiki,
        urls: ["https://en.wikipedia.org/wiki/Hunan_Airlines"],
    },
    {
        airlineName: "长安航空",
        category: cate_enum.wiki,
        urls: ["https://en.wikipedia.org/wiki/Air_Changan"],
    },
    {
        airlineName: "金鹏航空",
        category: cate_enum.wiki,
        urls: ["https://en.wikipedia.org/wiki/Suparna_Airlines"],
    },
    {
        airlineName: "桂林航空",
        category: cate_enum.wiki,
        urls: ["https://en.wikipedia.org/wiki/Guilin_Airlines"],
    },
    {
        airlineName: "龙江航空",
        category: cate_enum.wiki,
        urls: ["https://en.wikipedia.org/wiki/Longjiang_Airlines"],
    },
    {
        airlineName: "大湾区航空",
        category: cate_enum.wiki,
        urls: ["https://en.wikipedia.org/wiki/Greater_Bay_Airlines"],
    },
    {
        airlineName: "天骄航空",
        category: cate_enum.wiki,
        urls: ["https://en.wikipedia.org/wiki/Genghis_Khan_Airlines"],
    },
    {
        airlineName: "大新华航空",
        category: cate_enum.wiki,
        urls: ["https://en.wikipedia.org/wiki/Grand_China_Air"],
    },
    {
        airlineName: "香港华民航空",
        category: cate_enum.wiki,
        urls: ["https://en.wikipedia.org/wiki/Air_Hong_Kong"],
    },
    {
        airlineName: "瑞安航空",
        category: cate_enum.offical,
        urls: [
            "https://www.sec.gov/Archives/edgar/data/1038683/000155837025007966/tmb-20250331x20f.htm",
            "https://corporate.ryanair.com/about-us/our-fleet/",
            "https://corporate.ryanair.com/news/ryanair-2025-26-pat-rises-40-to-e2-26bn-pre-except-traffic-grows-4-to-208m-despite-boeing-delays/",
            "https://en.wikipedia.org/wiki/Ryanair",
        ],
    },
    {
        airlineName: "全日空",
        category: cate_enum.offical,
        urls: [
            "https://www.ana.co.jp/group/en/company/ana/scale/",
            "https://en.wikipedia.org/wiki/All_Nippon_Airways",
        ],
    },
    {
        airlineName: "阿联酋航空",
        category: cate_enum.offical,
        urls: [
            "https://www.emirates.com/us/english/experience/our-fleet/",
            "https://en.wikipedia.org/wiki/Emirates_fleet",
        ],
    },
    {
        airlineName: "亚洲航空",
        category: cate_enum.offical,
        urls: [
            "https://www.capitala.com/financial_performance.html/year/2025",
            "https://newsroom.airasia.com/news/airasia-fuels-growth-with-the-arrival-of-four-new-a321neos",
            "https://newsroom.airasia.com/about-us",
            "https://en.wikipedia.org/wiki/AirAsia",
        ],
    },
    {
        airlineName: "新加坡航空",
        category: cate_enum.offical,
        urls: [
            "https://www.singaporeair.com/en_UK/us/flying-withus/our-story/our-fleet/",
            "https://en.wikipedia.org/wiki/Singapore_Airlines_fleet",
        ],
    },
    {
        airlineName: "泰国航空",
        category: cate_enum.offical,
        urls: [
            "https://www.thaiairways.com/en-us/content/sustainable-development/goal-and-achievements/",
            "https://www.flightradar24.com/blog/aviation-news/thai-airways-fleet/",
            "https://www.thaiairways.com/en_JP/exp_thai/ouraircraft_index.page",
            "https://en.wikipedia.org/wiki/Thai_Airways_International_fleet",
        ],
    },
    {
        airlineName: "泛航航空",
        category: cate_enum.offical,
        urls: [
            "https://news.transavia.com/en/fleet/",
            "https://www.transavia.com/help/en-uk/about-transavia/fleet/fleet-details",
            "https://en.wikipedia.org/wiki/Transavia",
        ],
    },
    {
        airlineName: "泰国狮子航空",
        category: cate_enum.offical,
        urls: [
            "https://www.lionairthai.com/en/ThaiLionAir-Experience/Seating",
            "https://www.lionairthai.com/en/ThaiLionAir-Experience/Aircraft",
            "https://en.wikipedia.org/wiki/Thai_Lion_Air",
        ],
    },
    {
        airlineName: "中华航空",
        category: cate_enum.offical,
        urls: [
            "https://emo.china-airlines.com/lang-en/our_fleet_en.html",
            "https://en.wikipedia.org/wiki/China_Airlines",
        ],
    },
    {
        airlineName: "汉莎航空",
        category: cate_enum.offical,
        urls: [
            "https://www.lufthansagroup.com/en/company/fleet/lufthansa-and-regional-partners.html",
            "https://en.wikipedia.org/wiki/Lufthansa_fleet",
        ],
    },
    {
        airlineName: "日本航空",
        category: cate_enum.offical,
        urls: [
            "https://www.jal.com/en/company/outline/aircraft.html",
            "https://www.jal.com/en/investor/library/annualreport/",
            "https://en.wikipedia.org/wiki/Japan_Airlines_fleet",
        ],
    },
    {
        airlineName: "新西兰航空",
        category: cate_enum.offical,
        urls: [
            "https://www.airnewzealand.co.nz/fleet",
            "https://en.wikipedia.org/wiki/Air_New_Zealand_fleet",
        ],
    },
    {
        airlineName: "摩洛哥皇家航空",
        category: cate_enum.offical,
        urls: [
            "https://pre.royalairmaroc.com/ma-fr/notre-flotte",
            "https://www.planespotters.net/airline/Royal-Air-Maroc",
            "https://en.wikipedia.org/wiki/Royal_Air_Maroc_fleet",
        ],
    },
    {
        airlineName: "美国航空",
        category: cate_enum.offical,
        urls: [
            "https://www.aa.com/i18n/travel-info/experience/planes/planes.jsp",
            "https://www.planespotters.net/airline/American-Airlines",
            "https://en.wikipedia.org/wiki/American_Airlines_fleet",
        ],
    },
    {
        airlineName: "达美航空",
        category: cate_enum.offical,
        urls: [
            "https://www.delta.com/us/en/aircraft/overview",
            "https://www.planespotters.net/airline/Delta-Air-Lines",
            "https://en.wikipedia.org/wiki/Delta_Air_Lines_fleet",
        ],
    },
    {
        airlineName: "美国联合航空",
        category: cate_enum.offical,
        urls: [
            "https://www.united.com/en/us/fly/company/aircraft.html",
            "https://www.planespotters.net/airline/United-Airlines",
            "https://en.wikipedia.org/wiki/United_Airlines_fleet",
        ],
    },
    {
        airlineName: "西南航空",
        category: cate_enum.offical,
        urls: [
            "https://www.southwest.com/aircraft/",
            "https://www.planespotters.net/airline/Southwest-Airlines",
            "https://en.wikipedia.org/wiki/Southwest_Airlines_fleet",
        ],
    },
    {
        airlineName: "阿拉斯加航空",
        category: cate_enum.offical,
        urls: [
            "https://news.alaskaair.com/fleet/",
            "https://www.planespotters.net/airline/Alaska-Airlines",
            "https://en.wikipedia.org/wiki/Alaska_Airlines_fleet",
        ],
    },
    {
        airlineName: "捷蓝航空",
        category: cate_enum.offical,
        urls: [
            "https://www.jetblue.com/flying-with-us/our-planes",
            "https://www.planespotters.net/airline/JetBlue-Airways",
            "https://en.wikipedia.org/wiki/JetBlue_fleet",
        ],
    },
    {
        airlineName: "边疆航空",
        category: cate_enum.offical,
        urls: [
            "https://www.flyfrontier.com/plane-tails/airbus-a320/",
            "https://www.planespotters.net/airline/Frontier-Airlines",
            "https://en.wikipedia.org/wiki/Frontier_Airlines_fleet",
        ],
    },
    {
        airlineName: "夏威夷航空",
        category: cate_enum.offical,
        urls: [
            "https://www.hawaiianairlines.com/our-services/at-the-airport/our-fleet",
            "https://www.planespotters.net/airline/Hawaiian-Airlines",
            "https://en.wikipedia.org/wiki/Hawaiian_Airlines_fleet",
        ],
    },
    {
        airlineName: "忠实航空",
        category: cate_enum.offical,
        urls: [
            "https://www.allegiantair.com/aircraft",
            "https://www.planespotters.net/airline/Allegiant-Air",
            "https://en.wikipedia.org/wiki/Allegiant_Air_fleet",
        ],
    },
];
