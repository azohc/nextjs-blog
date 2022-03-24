import { useEffect } from "react/cjs/react.production.min"
import useSWR from "swr"
import Router from "next/router"

export default function useUser({
  redirectTo = "",
  redirectIfFound = false,
} = {}) {
  const { data: user, mutate: mutateUser } = useSWR("/api/user")

  useEffect(() => {
    // if no redirect needed (e.g. on /)
    // or user data not fetched yet, return
    if (!redirectTo || !user) return
    if (
      (redirectTo && !redirectIfFound && !user?.isLoggedIn) ||
      (redirectIfFound && user?.isLoggedIn)
    ) {
      Router.push(redirectTo)
    }
  }, [user, redirectIfFound, redirectTo])

  return { user, mutateUser }
}
