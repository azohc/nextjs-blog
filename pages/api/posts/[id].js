import { savePost } from "@/lib/posts"

export default function handler(req, res) {
  if (req.method === "POST") {
    const body = req.body
    const data = { title: body.title, date: body.date, views: body.views }
    savePost(body.id, body.slateValue, data)
    res.status(200)
  }
}
