export interface LampColour {
  /** The colour of the lamp. */
  c: string;
  /** The colour of the lamp when lit. */
  l: string;
}

export interface LampText {
  /** The lamp text label */
  t: string;
  /** The optional font size (px). */
  fs?: number;
}

export interface LampPath {
  /** The SVG path for the label. */
  p: string;
}

export type LampLabelLike = LampText | LampPath;

export interface Lamp<TColour = string> {
  /** The background colour name of the lamp. */
  bg?: TColour; // Default to #252122
  /** The list of lamp labels. */
  c: (LampLabelLike & { fg?: TColour })[];
}
