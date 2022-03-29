import Head from "next/head"
import { FormatDate as DateComponent, today } from "@/components/date"
import Layout from "@/components/layout"
import { getAllPostIds, getPostData } from "@/lib/posts"
import utilStyles from "@/styles/utils.module.css"
import { Slate, Editable, withReact } from "slate-react"
import { useCallback, useMemo, useState } from "react"
import { createEditor } from "slate"
import { withHistory } from "slate-history"
import {
  decorateCallback,
  DefaultElement,
  Leaf,
  withShortcuts,
} from "../../lib/slate_editor"
import { useRouter } from "next/router"

export async function getStaticProps({ params }) {
  let postData
  if (params.id === "new") {
    postData = {
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
    }
    return {
      props: {
        postData,
      },
    }
  }
  postData = await getPostData(params.id)
  return {
    props: {
      postData,
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

const loadFromLocalStore = (postData) => {
  return (
    (typeof window !== "undefined" &&
      postData.id !== "new" &&
      JSON.parse(window.localStorage.getItem(`${postData.id}-content`))) ||
    postData.slateValue
  )
}

const Post = ({ postData }) => {
  const [post, setPost] = useState(postData)
  const [newPostId, setNewPostId] = useState(post.id)
  const [value, setValue] = useState(loadFromLocalStore(post))
  const [inEditMode, setInEditMode] = useState(post.id === "new")
  const editor = useMemo(
    () => withShortcuts(withReact(withHistory(createEditor()))),
    []
  )
  const decorate = useCallback(([node, path]) => decorateCallback(node, path))
  const renderElement = useCallback(
    (props) => <DefaultElement {...props} />,
    []
  )
  const renderLeaf = useCallback((props) => <Leaf {...props} />, [])
  const router = useRouter()

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
        body: JSON.stringify({ ...post, id: newPostId, slateValue: value }),
      })
      router.push("/")
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
              value={newPostId}
              placeholder="post id"
              onChange={(event) => {
                setNewPostId(event.target.value)
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
          <br />
          <input
            type="button"
            value={inEditMode ? "save" : "edit"}
            onClick={editButtonCallback}
          />
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
        <Editable
          readOnly={!inEditMode}
          decorate={decorate}
          renderLeaf={renderLeaf}
          placeholder="write your post here"
          renderElement={renderElement}
        />
      </Slate>
    </Layout>
  )
}

export default Post
