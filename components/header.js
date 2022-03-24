import Link from "next/link"
import useUser from "../lib/useUser"
import { useRouter } from "next/router"
import Image from "next/image"

export default function Header() {
  const { user, mutateUser } = useUser()
  const router = useRouter()

  return (
    <header>
      <nav>
        <ul>
          <li>
            <Link href="/">
              <a>home</a>
            </Link>
          </li>
          {user?.isLoggedIn === false && (
            <li>
              <Link href="/login">
                <a>login</a>
              </Link>
            </li>
          )}
          {user?.isLoggedIn === true && (
            <>
              <li>
                <Image
                  src={user.avatarUrl}
                  width={32}
                  height={32}
                  alt="github user avatar"
                />
                you're logged in
              </li>
            </>
          )}
        </ul>
      </nav>
      <style jsx>{`
        ul {
          display: flex;
          list-style: none;
          margin-left: 0;
          padding-left: 0;
        }
        li {
          margin-right: 1rem;
          display: flex;
        }
        li:first-child {
          margin-left: auto;
        }
        a {
          color: #fff;
          text-decoration: none;
          display: flex;
          align-items: center;
        }
        a img {
          margin-right: 1em;
        }
        header {
          padding: 0.2rem;
          color: #fff;
          background-color: #333;
        }
      `}</style>
    </header>
  )
}
