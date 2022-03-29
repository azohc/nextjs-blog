import fs from "fs"
import path from "path"
import matter from "gray-matter"

const postsDirectory = path.join(process.cwd(), "posts")

export function getAllPostsSorted(newestFirst = true) {
  const fileNames = fs.readdirSync(postsDirectory)
  const allPostsData = fileNames.map((fn) => {
    const id = fn.replace(/\.md$/, "")

    const fullPath = path.join(postsDirectory, fn)
    const fileContents = fs.readFileSync(fullPath, "utf8")

    const matterResult = matter(fileContents)

    return {
      id,
      ...matterResult.data,
    }
  })

  const sortedPosts = allPostsData.sort(({ date: a }, { date: b }) => {
    if (a < b) {
      return 1
    } else if (a > b) {
      return -1
    }
    return 0
  })
  return newestFirst ? sortedPosts : sortedPosts.reverse()
}

export function getAllPostIds() {
  const fileNames = fs.readdirSync(postsDirectory)

  // The returned list must contain objects,
  // and each one must have the params key and
  // contain an object with the id key
  // (because we’re using [id] in pages/posts/[id].js)
  // Otherwise, getStaticPaths will fail.
  // [
  //   {
  //     params: {
  //       id: 'ssg-ssr'
  //     }
  //   },
  //   {
  //     params: {
  //       id: 'pre-rendering'
  //     }
  //   }
  // ]
  return fileNames
    .map((fileName) => {
      return {
        params: {
          id: fileName.replace(/\.md$/, ""),
        },
      }
    })
    .concat({
      params: {
        id: "new",
      },
    })
}

export async function getPost(id) {
  const fullPath = path.join(postsDirectory, `${id}.md`)
  const fileContents = fs.readFileSync(fullPath, "utf8")

  // Use gray-matter to parse the post metadata section
  const matterResult = matter(fileContents)

  const slateValue = JSON.parse(matterResult.content)

  // Combine the data with the id and contentHtml
  return {
    id,
    slateValue,
    ...matterResult.data,
  }
}

export async function savePost(id, slateValue, data) {
  const fullPath = path.join(postsDirectory, `${id}.md`)
  const matterResult = matter.stringify(JSON.stringify(slateValue), data)
  fs.writeFileSync(fullPath, matterResult)
}
