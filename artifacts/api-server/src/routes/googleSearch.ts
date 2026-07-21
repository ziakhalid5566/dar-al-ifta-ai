import { Router } from "express";

const router = Router();

router.get("/google/images", async (req, res) => {
  try {
    const { q } = req.query as { q?: string };
    if (!q) { res.status(400).json({ error: "q query param required" }); return; }

    const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
    const cx = process.env.GOOGLE_SEARCH_CX;
    if (!apiKey || !cx) { res.status(500).json({ error: "Google Search not configured" }); return; }

    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(q)}&searchType=image&num=5&safe=active&imgSize=large`;
    const response = await fetch(url);
    if (!response.ok) {
      res.status(502).json({ error: `Google API error ${response.status}` }); return;
    }
    const data = await response.json() as { items?: { link: string; title: string; image: { contextLink: string } }[] };
    const images = (data.items ?? []).map(item => ({
      url: item.link,
      title: item.title,
      source: item.image?.contextLink ?? "",
    }));
    res.json({ images });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Search error" });
  }
});

export default router;
