import Head from "next/head"
import Image from "next/image"
import Link from "next/link"
import Layout from "../../components/layout"

export default function FirstPost() {
  return (
    <Layout>
      <Head>
        <title>First Post</title>
      </Head>
      <h1>First Post</h1>
      <h2>
        <Link href="/">
          <a>Back to home</a>
        </Link>
      </h2>
      <Image src="/images/profile.jpg" alt="Eyeball" height={359} width={444} />
    </Layout>
  )
}
