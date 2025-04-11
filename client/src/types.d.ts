import { ArrowDownIcon, SparklesIcon, ShieldCheckIcon, RocketLaunchIcon } from "@heroicons/react/24/outline";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      div: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
      section: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      img: React.DetailedHTMLProps<React.ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>;
      h1: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
      h2: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
      h3: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
      p: React.DetailedHTMLProps<React.HTMLAttributes<HTMLParagraphElement>, HTMLParagraphElement>;
      br: React.DetailedHTMLProps<React.HTMLAttributes<HTMLBRElement>, HTMLBRElement>;
      button: React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>;
    }
  }
}

declare module "@heroicons/react/24/outline" {
  export const ArrowDownIcon: (props: React.SVGProps<SVGSVGElement>) => JSX.Element;
  export const SparklesIcon: (props: React.SVGProps<SVGSVGElement>) => JSX.Element;
  export const ShieldCheckIcon: (props: React.SVGProps<SVGSVGElement>) => JSX.Element;
  export const RocketLaunchIcon: (props: React.SVGProps<SVGSVGElement>) => JSX.Element;
} 