import Head from "next/head"
import Link from "next/link"
import { FormatDate as DateComponent, today } from "@/components/date"
import Layout from "@/components/layout"
import { getAllPostIds, getPost } from "@/lib/posts"
import utilStyles from "@/styles/utils.module.css"
import { Slate, Editable, withReact } from "slate-react"
import { useCallback, useMemo, useState } from "react"
import { createEditor, Range, Transforms } from "slate"
import { withHistory } from "slate-history"
import {
  decorateCallback,
  DefaultElement,
  HoveringToolbar,
  Leaf,
  withInlines,
  withShortcuts,
} from "../../lib/slate_editor"
import { useRouter } from "next/router"
import { isKeyHotkey } from "is-hotkey"
import { canEditAndAddPosts } from "pages"
import ReactVisibilitySensor from "react-visibility-sensor"

export async function getStaticProps({ params }) {
  if (params.id === "new") {
    return {
      props: {
        postProp: {
          id: "new",
          slateValue: [
            {
              type: "paragraph",
              children: [
                {
                  text: "",
                },
              ],
            },
          ],
          title: "",
          date: today(),
          views: 0,
        },
      },
    }
  }
  return {
    props: {
      postProp: await getPost(params.id),
    },
  }
}

export async function getStaticPaths() {
  const paths = getAllPostIds()
  return {
    paths,
    fallback: false,
  }
}

const loadFromLocalStore = (post) => {
  return (
    (typeof window !== "undefined" &&
      post.id !== "new" &&
      JSON.parse(window.localStorage.getItem(`${post.id}-content`))) ||
    post.slateValue
  )
}

const Post = ({ postProp }) => {
  // TODO increment views with react-visibility-sensor when backlink to home enters viewport
  // TODO store views in postId->int map that can be updated with api call
  const [post, setPost] = useState(postProp)
  const [postId, setPostId] = useState(postProp.id)
  const [scrolledToBottom, setScrolledToBottom] = useState(false)
  const [value, setValue] = useState(loadFromLocalStore(post))
  const [inEditMode, setInEditMode] = useState(post.id === "new")
  const editor = useMemo(
    () => withShortcuts(withInlines(withReact(withHistory(createEditor())))),
    []
  )
  const decorate = useCallback(([node, path]) => decorateCallback(node, path))
  const renderElement = useCallback(
    (props) => <DefaultElement {...props} />,
    []
  )
  const renderLeaf = useCallback((props) => <Leaf {...props} />, [])
  const router = useRouter()
  const onKeyDown = (event) => {
    const { selection } = editor

    // Default left/right behavior is unit:'character'.
    // This fails to distinguish between two cursor positions, such as
    // <inline>foo<cursor/></inline> vs <inline>foo</inline><cursor/>.
    // Here we modify the behavior to unit:'offset'.
    // This lets the user step into and out of the inline without stepping over characters.
    // You may wish to customize this further to only use unit:'offset' in specific cases.
    if (selection && Range.isCollapsed(selection)) {
      const { nativeEvent } = event
      if (isKeyHotkey("left", nativeEvent)) {
        event.preventDefault()
        Transforms.move(editor, { unit: "offset", reverse: true })
        return
      }
      if (isKeyHotkey("right", nativeEvent)) {
        event.preventDefault()
        Transforms.move(editor, { unit: "offset" })
        return
      }
    }
  }
  const editButtonCallback = () => {
    if (inEditMode) {
      if (post.id === "new" && post.title === "") {
        alert("add a title for the post")
        return
      }
      fetch(`/api/posts/${post.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...post, id: postId, slateValue: value }),
      })
      router.push(post.id === "new" ? "/" : `/posts/${post.id}`)
    }
    setInEditMode(!inEditMode)
  }

  return (
    <Layout>
      <Head>{`azohc - ${post.title}`}</Head>
      <article>
        {post.id === "new" ? (
          <>
            <input
              style={{ textAlign: "center" }}
              type="text"
              value={postId}
              placeholder="post id"
              onChange={(event) => {
                setPostId(event.target.value)
              }}
            />
            <br />
            <input
              style={{ textAlign: "center" }}
              type="text"
              value={post.title}
              placeholder="post title"
              onChange={(event) =>
                setPost({ ...post, title: event.target.value })
              }
            />
          </>
        ) : (
          <h1 className={utilStyles.headingXl}>{post.title}</h1>
        )}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div className={utilStyles.lightText}>
            <DateComponent dateString={post.date} />
          </div>
          {post.id !== "new" && (
            <span className={utilStyles.lightText}>{post.views} views</span>
          )}
          {canEditAndAddPosts() && (
            <input
              type="button"
              value={inEditMode ? "save" : "edit"}
              onClick={editButtonCallback}
            />
          )}
        </div>
      </article>
      <Slate
        editor={editor}
        value={value}
        onChange={(value) => {
          setValue(value)

          const isAstChange = editor.operations.some(
            (op) => "set_selection" !== op.type
          )
          if (isAstChange) {
            // Save the value to Local Storage.
            const content = JSON.stringify(value)
            if (typeof window !== "undefined") {
              window.localStorage.setItem(`${post.id}-content`, content)
            }
          }
        }}
      >
        <HoveringToolbar />
        <Editable
          readOnly={!inEditMode}
          decorate={decorate}
          renderLeaf={renderLeaf}
          placeholder="write your post here"
          renderElement={renderElement}
          onKeyDown={onKeyDown}
        />
      </Slate>

      <ReactVisibilitySensor
        onChange={(isVisible) => {
          if (!scrolledToBottom && isVisible) {
            setScrolledToBottom(isVisible)
            setPost({ ...post, views: post.views + 1 })
            fetch(`/api/views/${postId}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ id: postId, views: post.views + 1 }),
            })
          }
        }}
      >
        <div>
          <Link href="/">
            <a>←</a>
          </Link>
        </div>
      </ReactVisibilitySensor>
    </Layout>
  )
}

export default Post
