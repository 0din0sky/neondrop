import fs from 'node:fs';

async function importAllSkins() {
  console.log('1. Загружаю базу скинов CS2...');
  const skinsRes = await fetch(
    'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/skins_not_grouped.json'
  );
  if (!skinsRes.ok) throw new Error(`Ошибка CSGO-API: ${skinsRes.status}`);
  const rawSkins = await skinsRes.json();

  console.log('2. Загружаю рыночные цены (USD)...');
  const pricesRes = await fetch(
    'https://api.skinport.com/v1/items?app_id=730&currency=USD',
    { headers: { 'Accept-Encoding': 'br' } }
  );
  if (!pricesRes.ok) throw new Error(`Ошибка Skinport API: ${pricesRes.status}`);
  const rawPrices = await pricesRes.json();

  const priceMap = new Map();
  for (const item of rawPrices) {
    const price = item.suggested_price || item.min_price || item.median_price;
    if (price > 0) {
      priceMap.set(item.market_hash_name, Number(price.toFixed(2)));
    }
  }

  const catalog = [];
  for (const skin of rawSkins) {
    const hashName = skin.market_hash_name;
    const price = priceMap.get(hashName);
    if (!price || !skin.image) continue;

    catalog.push({
      id: skin.id,
      name: hashName,
      weapon: skin.weapon?.name || '',
      wear: skin.wear?.name || '',
      stattrak: Boolean(skin.stattrak),
      rarity: skin.rarity?.name || 'Consumer Grade',
      color: skin.rarity?.color || '#b0c3d9',
      price,
      image: skin.image
    });
  }

  catalog.sort((a, b) => b.price - a.price);

  fs.writeFileSync('skins.json', JSON.stringify(catalog));
  console.log(`Готово! Сохранено скинов в skins.json: ${catalog.length}`);
}

importAllSkins().catch((err) => {
  console.error(err);
  process.exit(1);
});
