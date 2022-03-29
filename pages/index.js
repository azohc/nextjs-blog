import Head from "next/head"
import Layout, { siteTitle } from "@/components/layout"
import utilStyles from "@/styles/utils.module.css"

import { getSortedPostsData } from "@/lib/posts"
import Link from "next/link"
import { FormatDate } from "@/components/date"

export async function getStaticProps() {
  const allPostsData = getSortedPostsData()
  return {
    props: {
      allPostsData,
    },
  }
}

export default function Home({ allPostsData }) {
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
      <Link href="/posts/new">
        <a>new post</a>
      </Link>
      <h2 className={utilStyles.headingLg}>Blog</h2>
      {/* TODO change Blog -> "posts ordered newest/oldest first" 
        w/ 'newest/oldest' clickable so as to toggle with oldest*/}
      <ul className={utilStyles.list}>
        {allPostsData.map(({ id, date, title }) => (
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
            <small className={utilStyles.lightText}>
              <FormatDate dateString={date} />
            </small>
          </li>
        ))}
      </ul>
    </Layout>
  )
}
