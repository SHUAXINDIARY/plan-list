import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import { pluginSvgr } from "@rsbuild/plugin-svgr";
import { pluginAircraftPhotoPreviews } from "./rsbuild_plugins/pluginAircraftPhotoPreviews";

// Docs: https://rsbuild.rs/config/
export default defineConfig({
    html: {
        favicon: "https://avatars.githubusercontent.com/u/32100575?v=4",
        title: "Plane List | 航司机型资料库",
        meta: {
            author: "Plane List",
            description:
                "Plane List 是面向航空爱好者的航司机型资料库与个人乘坐记录工具。",
            keywords: "航司机型,飞机型号,航空资料库,乘坐记录,Plane List",
            "theme-color": "#07111d",
            viewport:
                "width=device-width, initial-scale=1.0, viewport-fit=cover",
        },
        tags: [
            {
                tag: "script",
                head: true,
                append: false,
                children: `(function(){try{var k='plane-list-theme';var t=localStorage.getItem(k);if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`,
            },
        ],
    },
    plugins: [pluginReact(), pluginSvgr(), pluginAircraftPhotoPreviews()],
});
