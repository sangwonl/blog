import type { RenderableTreeNodes } from "@markdoc/markdoc";
import Markdoc from "@markdoc/markdoc";

const { Tag: MarkdocTag } = Markdoc;

type ComponentsType = Record<
  string,
  {
    Component: any;
    props: Record<string, string | number>;
  }
>;

const ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
};

function escapeHtml(str: string): string {
  return str.replace(/[&<>"]/g, (ch) => ESCAPE_MAP[ch]);
}

export class Node {
  private node: RenderableTreeNodes;
  tag: any;
  props: Record<string, any>;
  children: any;
  components: ComponentsType | undefined;

  constructor(n: RenderableTreeNodes, components?: ComponentsType) {
    if (!n) {
      throw new Error("Missing arg: n");
    }
    this.node = n;
    this.components = components;

    let children = (this.node as any)?.children;
    if (typeof this.node === "string" || typeof this.node === "number") {
      children = escapeHtml(String(this.node));
    } else if (
      this.node === null ||
      typeof this.node !== "object" ||
      !MarkdocTag.isTag(this.node)
    ) {
      children = "";
    }
    this.children = children;

    let tag = (this.node as any)?.name;
    let props = (this.node as any)?.attributes;

    if (
      typeof (this.node as any)?.name === "string" &&
      typeof components === "object" &&
      Object.hasOwn(components, (this.node as any)?.name)
    ) {
      tag = components[(this.node as any).name].Component;
      props = {
        ...props,
        ...components[(this.node as any).name].props,
        children: this.children,
      };
    } else if (typeof (this.node as any)?.name === "string") {
      tag = (this.node as any).name;
      props = { ...(this.node as any).attributes };
    }
    this.tag = tag;
    this.props = props;
  }

  validateElement() {
    if (
      typeof (this.node as any)?.name === "string" &&
      (this.node as any).name.charAt(0).toLowerCase() !==
        (this.node as any).name.charAt(0) &&
      typeof this.components === "object" &&
      !Object.hasOwn(this.components, (this.node as any).name)
    ) {
      throw new Error(
        `No renderer provided for element: ${(this.node as any).name}`
      );
    }
  }

  hasChildren() {
    return Array.isArray((this.node as any)?.children);
  }

  shouldRenderChildren() {
    return (
      !Array.isArray(this.node) &&
      (typeof this.node === "string" ||
        typeof this.node === "number" ||
        this.node === null ||
        typeof this.node !== "object" ||
        !MarkdocTag.isTag(this.node))
    );
  }

  shouldRenderSelf() {
    return Array.isArray(this.node);
  }

  shouldRenderTag() {
    return !!this.tag;
  }
}
