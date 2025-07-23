import React, { ComponentPropsWithoutRef } from "react";
import Link from "next/link";
import { highlight } from "sugar-high";

type HeadingProps = ComponentPropsWithoutRef<"h1">;
type ParagraphProps = ComponentPropsWithoutRef<"p">;
type ListProps = ComponentPropsWithoutRef<"ul">;
type ListItemProps = ComponentPropsWithoutRef<"li">;
type AnchorProps = ComponentPropsWithoutRef<"a">;
type BlockquoteProps = ComponentPropsWithoutRef<"blockquote">;

const components = {
  h1: (props: HeadingProps) => (
    <h1
      className="scroll-m-20 text-3xl font-bold tracking-tight text-high-contrast-text mb-4"
      {...props}
    />
  ),
  h2: (props: HeadingProps) => (
    <h2
      className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0 mb-4"
      {...props}
    />
  ),
  h3: (props: HeadingProps) => (
    <h3
      className="scroll-m-20 text-2xl font-semibold tracking-tight mb-4"
      {...props}
    />
  ),
  h4: (props: HeadingProps) => (
    <h4
      className="scroll-m-20 text-xl font-semibold tracking-tight mb-4"
      {...props}
    />
  ),
  p: (props: ParagraphProps) => (
    <p className="leading-7 text-low-contrast-text mb-4" {...props} />
  ),
  ol: (props: ListProps) => (
    <ol className="my-4 ml-6 list-decimal" {...props} />
  ),
  ul: (props: ListProps) => <ul className="my-4 ml-6 list-disc" {...props} />,
  li: (props: ListItemProps) => (
    <li className="pl-1 text-low-contrast-text mb-2" {...props} />
  ),
  em: (props: ComponentPropsWithoutRef<"em">) => (
    <em className="font-medium" {...props} />
  ),
  strong: (props: ComponentPropsWithoutRef<"strong">) => (
    <strong className="font-medium text-high-contrast-text" {...props} />
  ),
  a: ({ href, children, ...props }: AnchorProps) => {
    const className =
      "transition duration-200 hover:opacity-90 text-high-contrast-text";
    if (href?.startsWith("/")) {
      return (
        <Link href={href} className={className} {...props}>
          {children}
        </Link>
      );
    }
    if (href?.startsWith("#")) {
      return (
        <a href={href} className={className} {...props}>
          {children}
        </a>
      );
    }
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        {...props}
      >
        {children}
      </a>
    );
  },
  code: ({ children, ...props }: ComponentPropsWithoutRef<"code">) => {
    const codeHTML = highlight(children as string);
    console.log(codeHTML);
    return <code dangerouslySetInnerHTML={{ __html: codeHTML }} {...props} />;
  },
  Table: ({ data }: { data: { headers: string[]; rows: string[][] } }) => (
    <table>
      <thead>
        <tr>
          {data.headers.map((header, index) => (
            <th key={index}>{header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.rows.map((row, index) => (
          <tr key={index}>
            {row.map((cell, cellIndex) => (
              <td key={cellIndex}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ),
  blockquote: (props: BlockquoteProps) => (
    <blockquote
      className="mt-6 border-l-2 pl-6 italic text-high-contrast-text"
      {...props}
    />
  ),
  // ... rest of the code remains the same
};

export function useMDXComponents(): MDXProvidedComponents {
  return components;
}
declare global {
  type MDXProvidedComponents = typeof components;
}
