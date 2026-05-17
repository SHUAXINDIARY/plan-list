import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginAircraftPhotoPreviews } from './rsbuild_plugins/pluginAircraftPhotoPreviews';

// Docs: https://rsbuild.rs/config/
export default defineConfig({
  html: {
    favicon: 'https://avatars.githubusercontent.com/u/32100575?v=4',
    title: 'Plan List | 航司机型资料库',
    meta: {
      author: 'Plan List',
      description: 'Plan List 是面向航空爱好者的航司机型资料库与个人乘坐记录工具。',
      keywords: '航司机型,飞机型号,航空资料库,乘坐记录,Plan List',
      'theme-color': '#07111d',
      viewport: 'width=device-width, initial-scale=1.0',
    },
  },
  plugins: [pluginReact(), pluginAircraftPhotoPreviews()],
});
