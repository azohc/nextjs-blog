import { parseISO, format } from "date-fns"

export const FormatDate = ({ dateString }) => {
  const date = parseISO(dateString)
  return <time dateTime={dateString}>{format(date, "LLLL d, yyyy")}</time>
}

export const today = () => {
  return new Date()
    .toLocaleDateString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .split("/")
    .reverse()
    .join("-")
}
