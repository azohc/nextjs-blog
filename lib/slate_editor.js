import React, { useRef, useEffect } from "react"
import Prism from "prismjs"
import { css, cx } from "@emotion/css"
import {
  Editor,
  Transforms,
  Range,
  Point,
  Element as SlateElement,
  Text,
} from "slate"
import { useFocused, useSelected, useSlate } from "slate-react"
import reactDom from "react-dom"
import isUrl from "is-url"
import { canEditAndAddPosts } from "pages"

// eslint-disable-next-line
Prism.languages.markdown=Prism.languages.extend("markup",{}),Prism.languages.insertBefore("markdown","prolog",{blockquote:{pattern:/^>(?:[\t ]*>)*/m,alias:"punctuation"},code:[{pattern:/^(?: {4}|\t).+/m,alias:"keyword"},{pattern:/``.+?``|`[^`\n]+`/,alias:"keyword"}],title:[{pattern:/\w+.*(?:\r?\n|\r)(?:==+|--+)/,alias:"important",inside:{punctuation:/==+$|--+$/}},{pattern:/(^\s*)#+.+/m,lookbehind:!0,alias:"important",inside:{punctuation:/^#+|#+$/}}],hr:{pattern:/(^\s*)([*-])([\t ]*\2){2,}(?=\s*$)/m,lookbehind:!0,alias:"punctuation"},list:{pattern:/(^\s*)(?:[*+-]|\d+\.)(?=[\t ].)/m,lookbehind:!0,alias:"punctuation"},"url-reference":{pattern:/!?\[[^\]]+\]:[\t ]+(?:\S+|<(?:\\.|[^>\\])+>)(?:[\t ]+(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\((?:\\.|[^)\\])*\)))?/,inside:{variable:{pattern:/^(!?\[)[^\]]+/,lookbehind:!0},string:/(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\((?:\\.|[^)\\])*\))$/,punctuation:/^[\[\]!:]|[<>]/},alias:"url"},bold:{pattern:/(^|[^\\])(\*\*|__)(?:(?:\r?\n|\r)(?!\r?\n|\r)|.)+?\2/,lookbehind:!0,inside:{punctuation:/^\*\*|^__|\*\*$|__$/}},italic:{pattern:/(^|[^\\])([*_])(?:(?:\r?\n|\r)(?!\r?\n|\r)|.)+?\2/,lookbehind:!0,inside:{punctuation:/^[*_]|[*_]$/}},url:{pattern:/!?\[[^\]]+\](?:\([^\s)]+(?:[\t ]+"(?:\\.|[^"\\])*")?\)| ?\[[^\]\n]*\])/,inside:{variable:{pattern:/(!?\[)[^\]]+(?=\]$)/,lookbehind:!0},string:{pattern:/"(?:\\.|[^"\\])*"(?=\)$)/}}}}),Prism.languages.markdown.bold.inside.url=Prism.util.clone(Prism.languages.markdown.url),Prism.languages.markdown.italic.inside.url=Prism.util.clone(Prism.languages.markdown.url),Prism.languages.markdown.bold.inside.italic=Prism.util.clone(Prism.languages.markdown.italic),Prism.languages.markdown.italic.inside.bold=Prism.util.clone(Prism.languages.markdown.bold); // prettier-ignore

const SHORTCUTS = {
  "*": "list_item",
  "-": "list_item",
  "+": "list_item",
  ">": "block_quote",
  "#": "heading_one",
  "##": "heading_two",
  "###": "heading_three",
  "####": "heading_four",
  "#####": "heading_five",
  "######": "heading_six",
}

export const decorateCallback = (node, path) => {
  const ranges = []

  if (!Text.isText(node)) {
    return ranges
  }

  const getLength = (token) => {
    if (typeof token === "string") {
      return token.length
    } else if (typeof token.content === "string") {
      return token.content.length
    } else {
      return token.content.reduce((l, t) => l + getLength(t), 0)
    }
  }

  const tokens = Prism.tokenize(node.text, Prism.languages.markdown)
  let start = 0

  for (const token of tokens) {
    const length = getLength(token)
    const end = start + length

    if (typeof token !== "string") {
      ranges.push({
        [token.type]: true,
        anchor: { path, offset: start },
        focus: { path, offset: end },
      })
    }

    start = end
  }

  return ranges
}

export const withShortcuts = (editor) => {
  const { deleteBackward, insertText } = editor

  editor.insertText = (text) => {
    const { selection } = editor

    if (text === " " && selection && Range.isCollapsed(selection)) {
      const { anchor } = selection
      const block = Editor.above(editor, {
        match: (n) => Editor.isBlock(editor, n),
      })
      const path = block ? block[1] : []
      const start = Editor.start(editor, path)
      const range = { anchor, focus: start }
      const beforeText = Editor.string(editor, range)
      const type = SHORTCUTS[beforeText]

      if (type) {
        Transforms.select(editor, range)
        Transforms.delete(editor)
        const newProperties = {
          type,
        }
        Transforms.setNodes(editor, newProperties, {
          match: (n) => Editor.isBlock(editor, n),
        })

        if (type === "list_item") {
          const list = {
            type: "bulleted_list",
            children: [],
          }
          Transforms.wrapNodes(editor, list, {
            match: (n) =>
              !Editor.isEditor(n) &&
              SlateElement.isElement(n) &&
              n.type === "list_item",
          })
        }

        return
      }
    }

    insertText(text)
  }

  editor.deleteBackward = (...args) => {
    const { selection } = editor

    if (selection && Range.isCollapsed(selection)) {
      const match = Editor.above(editor, {
        match: (n) => Editor.isBlock(editor, n),
      })

      if (match) {
        const [block, path] = match
        const start = Editor.start(editor, path)

        if (
          !Editor.isEditor(block) &&
          SlateElement.isElement(block) &&
          block.type !== "paragraph" &&
          Point.equals(selection.anchor, start)
        ) {
          const newProperties = {
            type: "paragraph",
          }
          Transforms.setNodes(editor, newProperties)

          if (block.type === "list_item") {
            Transforms.unwrapNodes(editor, {
              match: (n) =>
                !Editor.isEditor(n) &&
                SlateElement.isElement(n) &&
                n.type === "bulleted_list",
              split: true,
            })
          }

          return
        }
      }

      deleteBackward(...args)
    }
  }

  return editor
}

const isLinkActive = (editor) => {
  const [link] = Editor.nodes(editor, {
    match: (n) =>
      !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === "link",
  })
  return !!link
}

export const Menu = React.forwardRef(({ className, ...props }, ref) => (
  <div
    {...props}
    ref={ref}
    className={cx(
      className,
      css`
        & > * {
          display: inline-block;
        }
        & > * + * {
          margin-left: 15px;
        }
      `
    )}
  />
))

export const Portal = ({ children }) => {
  return typeof document === "object"
    ? reactDom.createPortal(children, document.body)
    : null
}

export const withInlines = (editor) => {
  const { insertData, insertText, isInline } = editor

  editor.isInline = (element) =>
    ["link", "button"].includes(element.type) || isInline(element)

  editor.insertText = (text) => {
    if (text && isUrl(text)) {
      wrapLink(editor, text)
    } else {
      insertText(text)
    }
  }

  editor.insertData = (data) => {
    const text = data.getData("text/plain")

    if (text && isUrl(text)) {
      wrapLink(editor, text)
    } else {
      insertData(data)
    }
  }

  return editor
}

export const insertLink = (editor, url) => {
  if (editor.selection) {
    wrapLink(editor, url)
  }
}

export const DefaultElement = (props) => {
  const { attributes, children, element } = props
  switch (element.type) {
    case "block_quote":
      return <blockquote {...attributes}>{children}</blockquote>
    case "bulleted_list":
      return <ul {...attributes}>{children}</ul>
    case "heading_one":
      return <h1 {...attributes}>{children}</h1>
    case "heading_two":
      return <h2 {...attributes}>{children}</h2>
    case "heading_three":
      return <h3 {...attributes}>{children}</h3>
    case "heading_four":
      return <h4 {...attributes}>{children}</h4>
    case "heading_five":
      return <h5 {...attributes}>{children}</h5>
    case "heading_six":
      return <h6 {...attributes}>{children}</h6>
    case "list_item":
      return <li {...attributes}>{children}</li>
    case "link":
      return <LinkComponent {...props} />
    default:
      return <p {...attributes}>{children}</p>
  }
}

export const Leaf = ({ attributes, children, leaf }) => {
  return (
    <span
      {...attributes}
      className={css`
        font-weight: ${leaf.bold && "bold"};
        font-style: ${leaf.italic && "italic"};
        text-decoration: ${leaf.underlined && "underline"};
        ${leaf.title &&
        css`
          display: inline-block;
          font-weight: bold;
          font-size: 20px;
          margin: 20px 0 10px 0;
        `}
        ${leaf.list &&
        css`
          padding-left: 10px;
          font-size: 20px;
          line-height: 10px;
        `}
        ${leaf.hr &&
        css`
          display: block;
          text-align: center;
          border-bottom: 2px solid #ddd;
        `}
        ${leaf.blockquote &&
        css`
          display: inline-block;
          border-left: 2px solid #ddd;
          padding-left: 10px;
          color: #aaa;
          font-style: italic;
        `}
        ${leaf.code &&
        css`
          font-family: monospace;
          background-color: #eee;
          padding: 3px;
        `}
      `}
    >
      {children}
    </span>
  )
}

export const HoveringToolbar = () => {
  const ref = useRef()
  const editor = useSlate()
  const inFocus = useFocused()

  useEffect(() => {
    const el = ref.current
    const { selection } = editor

    if (!el) {
      return
    }

    if (
      !selection ||
      !inFocus ||
      Range.isCollapsed(selection) ||
      Editor.string(editor, selection) === ""
    ) {
      el.removeAttribute("style")
      return
    }

    const domSelection = window.getSelection()
    const domRange = domSelection.getRangeAt(0)
    const rect = domRange.getBoundingClientRect()
    el.style.opacity = "1"
    el.style.top = `${rect.top + window.pageYOffset - el.offsetHeight}px`
    el.style.left = `${
      rect.left + window.pageXOffset - el.offsetWidth / 2 + rect.width / 2
    }px`
  })

  return (
    <Portal>
      <Menu
        ref={ref}
        className={css`
          padding: 8px 7px 6px;
          position: absolute;
          z-index: 1;
          top: -10000px;
          left: -10000px;
          margin-top: -6px;
          opacity: 0;
          background-color: #222;
          border-radius: 4px;
          transition: opacity 0.75s;
        `}
        onMouseDown={(e) => {
          // prevent toolbar from taking focus away from editor
          e.preventDefault()
        }}
      >
        <AddLinkButton />
      </Menu>
    </Portal>
  )
}

export const Button = React.forwardRef(
  ({ className, active, reversed, ...props }, ref) => (
    <span
      {...props}
      ref={ref}
      className={cx(
        className,
        css`
          cursor: pointer;
          color: ${reversed
            ? active
              ? "white"
              : "#aaa"
            : active
            ? "black"
            : "#ccc"};
        `
      )}
    />
  )
)

export const Icon = React.forwardRef(({ className, ...props }, ref) => (
  <span
    {...props}
    ref={ref}
    className={cx(
      "material-icons",
      className,
      css`
        font-size: 18px;
        vertical-align: text-bottom;
      `
    )}
  />
))
export const AddLinkButton = () => {
  const editor = useSlate()
  return (
    canEditAndAddPosts() && (
      <Button
        active={isLinkActive(editor)}
        onMouseDown={(event) => {
          event.preventDefault()
          const url = window.prompt("Enter the URL of the link:")
          if (!url) return
          insertLink(editor, url)
        }}
      >
        <Icon>link</Icon>
      </Button>
    )
  )
}

export const wrapLink = (editor, url) => {
  if (isLinkActive(editor)) {
    unwrapLink(editor)
  }

  const { selection } = editor
  const isCollapsed = selection && Range.isCollapsed(selection)
  const link = {
    type: "link",
    url,
    children: isCollapsed ? [{ text: url }] : [],
  }

  if (isCollapsed) {
    Transforms.insertNodes(editor, link)
  } else {
    Transforms.wrapNodes(editor, link, { split: true })
    Transforms.collapse(editor, { edge: "end" })
  }
}

// Put this at the start and end of an inline component to work around this Chromium bug:
// https://bugs.chromium.org/p/chromium/issues/detail?id=1249405
export const InlineChromiumBugfix = () => (
  <span
    contentEditable={false}
    className={css`
      font-size: 0;
    `}
  >
    ${String.fromCodePoint(160) /* Non-breaking space */}
  </span>
)

export const LinkComponent = ({ attributes, children, element }) => {
  const selected = useSelected()
  return (
    <a
      {...attributes}
      href={element.url}
      className={
        selected
          ? css`
              box-shadow: 0 0 0 3px #ddd;
            `
          : ""
      }
    >
      <InlineChromiumBugfix />
      {children}
      <InlineChromiumBugfix />
    </a>
  )
}
