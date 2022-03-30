import { upsertPostViews } from "@/lib/posts"

export default function handler(req, res) {
  if (req.method === "PUT") {
    upsertPostViews(req.body.id, req.body.views)
    res.status(200)
  }
}
