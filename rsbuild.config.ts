import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import { pluginSvgr } from "@rsbuild/plugin-svgr";
import { pluginAircraftPhotoPreviews } from "./rsbuild_plugins/pluginAircraftPhotoPreviews";
import { pluginSketchfabFileSizeGuard } from "./rsbuild_plugins/pluginSketchfabFileSizeGuard";
import { codeInspectorPlugin } from 'code-inspector-plugin';


// Docs: https://rsbuild.rs/config/
export default defineConfig({
    source: {
        assetsInclude: /\.(geojson|glb)$/,
    },
    html: {
        favicon: "https://avatars.githubusercontent.com/u/32100575?v=4",
        title: "Aircraft Log | Plane List",
        meta: {
            author: "Plane List",
            description:
                "Aircraft Log 是面向航空爱好者的航司机型资料库、飞机照片与个人乘坐记录工具。",
            keywords: "航司机型,飞机型号,航空资料库,飞机照片,乘坐记录,Aircraft Log,Plane List",
            "theme-color": "#07111d",
            viewport:
                "width=device-width, initial-scale=1.0, viewport-fit=cover",
        },
        tags: [
            {
                tag: "script",
                head: true,
                append: false,
                children: `(function(){try{var k='plane-list-theme';var t=localStorage.getItem(k);document.documentElement.setAttribute('data-theme',t==='light'?'light':'dark');}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`,
            },
        ],
    },
    tools: {
        rspack: {
            plugins: [
                codeInspectorPlugin({
                    bundler: 'rspack',
                })
            ]
        }
    },
    plugins: [
        pluginReact(),
        pluginSvgr(),
        pluginSketchfabFileSizeGuard(),
        pluginAircraftPhotoPreviews(),
    ],
});
