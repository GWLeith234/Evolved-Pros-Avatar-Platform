import "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "mux-player": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          "playback-id"?: string;
          "stream-type"?: string;
        },
        HTMLElement
      >;
    }
  }
}
