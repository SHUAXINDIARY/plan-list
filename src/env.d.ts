/// <reference types="@rsbuild/core/types" />

/**
 * Imports the SVG file as a React component.
 * @requires [@rsbuild/plugin-svgr](https://npmjs.com/package/@rsbuild/plugin-svgr)
 */
declare module '*.svg?react' {
  import type React from 'react';
  const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  export default ReactComponent;
}

/** 将 SVG 作为静态资源 URL 导入，供 Canvas 位图加载使用。 */
declare module '*.svg?url' {
  const assetUrl: string;
  export default assetUrl;
}
