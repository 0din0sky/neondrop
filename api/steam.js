export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  const { id } = req.query;
  if (!id || !/^\d{17}$/.test(id)) {
    return res.status(400).json({ error: 'Invalid SteamID64' });
  }

  try {
    // Вариант 1: Если добавишь STEAM_API_KEY в Vercel Environment Variables (самый быстрый)
    const apiKey = process.env.STEAM_API_KEY;
    if (apiKey) {
      const apiRes = await fetch(
        `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${apiKey}&steamids=${id}`
      );
      if (apiRes.ok) {
        const data = await apiRes.json();
        const player = data?.response?.players?.[0];
        if (player) {
          return res.status(200).json({
            steamId: id,
            nickname: player.personaname,
            avatar: player.avatarfull || player.avatarmedium || player.avatar
          });
        }
      }
    }

    // Вариант 2: Прямой запрос Steam XML с сервера Vercel (без проблем с CORS на телефоне)
    const xmlRes = await fetch(`https://steamcommunity.com/profiles/${id}/?xml=1`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NeonDrop/1.0)' }
    });
    if (!xmlRes.ok) throw new Error('Steam XML unavailable');

    const xml = await xmlRes.text();
    const nameMatch = xml.match(/<steamID><!\[CDATA\[([\s\S]*?)\]\]><\/steamID>/i) ||
                      xml.match(/<steamID>([^<]+)<\/steamID>/i);
    const avatarMatch = xml.match(/<avatarFull><!\[CDATA\[([\s\S]*?)\]\]><\/avatarFull>/i) ||
                        xml.match(/<avatarFull>([^<]+)<\/avatarFull>/i);

    if (!nameMatch) throw new Error('Profile not found');

    return res.status(200).json({
      steamId: id,
      nickname: nameMatch[1].trim(),
      avatar: avatarMatch ? avatarMatch[1].trim() : ''
    });
  } catch (err) {
    return res.status(502).json({ error: 'Failed to fetch Steam profile', details: err.message });
  }
}
