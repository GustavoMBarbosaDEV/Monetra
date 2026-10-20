/* Tipos só para a checagem (VS Code / tsc). Este arquivo não é carregado pelo app.
   O app lê campos da tela com document.getElementById(...).value, .checked etc.;
   aqui dizemos ao TypeScript que esses elementos podem ser campos de formulário. */
interface HTMLElement { options: HTMLOptionsCollection; }
interface Element {
  value: any;
  checked: boolean;
  disabled: boolean;
  files: FileList | null;
  dataset: DOMStringMap;
  name: string;
  focus(options?: FocusOptions): void;
  click(): void;
  select(): void;
  content: string;
  type: string;
  style: CSSStyleDeclaration;
  offsetLeft: number;
  offsetTop: number;
  offsetHeight: number;
  offsetWidth: number;
  offsetParent: Element | null;
  selectionStart: number | null;
  selectionEnd: number | null;
  options: HTMLOptionsCollection;
  setSelectionRange(start: number | null, end: number | null, direction?: "forward" | "backward" | "none"): void;
}
interface EventTarget {
  value: any;
  id: string;
  name: string;
  checked: boolean;
  files: FileList | null;
  dataset: DOMStringMap;
  classList: DOMTokenList;
  tagName: string;
  closest(selectors: string): HTMLElement | null;
  matches(selectors: string): boolean;
  select(): void;
}
interface Credential { rawId?: ArrayBuffer; }
interface Window {
  /** definido em firebase-config.js */
  FIREBASE_CONFIG: any;
  /** navegadores antigos (Internet Explorer) */
  clipboardData?: any;
}
