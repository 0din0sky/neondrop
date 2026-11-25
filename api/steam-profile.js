export default async function handler(req, res) {
  const { steamid } = req.query;

  if (!steamid || !/^\d{17}$/.test(steamid)) {
    return res.status(400).json({ error: 'Invalid steamid' });
  }

  const apiKey = process.env.STEAM_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'STEAM_API_KEY is not configured' });
  }

  try {
    const url = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${apiKey}&steamids=${steamid}`;
    const response = await fetch(url);
    const data = await response.json();
    const player = data?.response?.players?.[0];

    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    return res.status(200).json({
      nickname: player.personaname,
      avatar: player.avatarfull || player.avatarmedium
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch Steam profile' });
  }
}
