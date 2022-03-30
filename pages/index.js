import Head from "next/head"
import Layout, { siteTitle } from "@/components/layout"
import utilStyles from "@/styles/utils.module.css"

import { getAllPostsSorted } from "@/lib/posts"
import Link from "next/link"
import { FormatDate } from "@/components/date"

export async function getStaticProps() {
  const allPosts = await getAllPostsSorted()
  return {
    props: {
      allPosts,
    },
  }
}
export function canEditAndAddPosts() {
  return process.env.NEXT_PUBLIC_EDIT_ADD_POSTS_ENABLED === "true"
}
export default function Home({ allPosts }) {
  return (
    <Layout home>
      <Head>
        <title>{siteTitle}</title>
      </Head>
      <section className={utilStyles.headingMd}>
        <p>
          shoutout to <a href="https://nextjs.org/learn">Next.js</a> for helping
          to build this site
        </p>
      </section>
      {canEditAndAddPosts() && (
        <Link href="/posts/new">
          <a>new post</a>
        </Link>
      )}
      <h2 className={utilStyles.headingLg}>Blog</h2>
      {/* TODO change Blog -> "posts ordered newest/oldest first" 
        w/ 'newest/oldest' clickable so as to toggle with oldest*/}
      <ul className={utilStyles.list}>
        {allPosts.map(({ id, date, title, views }) => (
          <li
            className={utilStyles.listItem}
            key={id}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Link href={`/posts/${id}`}>
              <a>{title}</a>
            </Link>
            <small className={utilStyles.lightText}>{views} views</small>
            <small className={utilStyles.lightText}>
              <FormatDate dateString={date} />
            </small>
          </li>
        ))}
      </ul>
    </Layout>
  )
}
