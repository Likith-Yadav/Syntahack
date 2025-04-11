/// <reference types="vite/client" />
/// <reference types="react" />
/// <reference types="react-dom" />

interface ImportMetaEnv {
  readonly VITE_TEMPLATE_CLIENT_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module "*.svg" {
  import * as React from 'react';
  export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}
