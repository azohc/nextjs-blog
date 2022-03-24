import { SWRConfig } from "swr"
import "../styles/global.css"
import fetchJson from "../lib/fetchJson"

export default function App({ Component, pageProps }) {
  return (
    <SWRConfig
      value={{
        fetcher: fetchJson,
        onError: (err) => {
          console.log(err)
        },
      }}
    >
      <Component {...pageProps} />
    </SWRConfig>
  )
}
