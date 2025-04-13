async function getCoffeeShops() {
  // use fetch api to grab data from json
  const response = await fetch('../data/coffee_shop.json')
  // return json as array of obj
  return await response.json();
}


async function renderCoffeeShopCard() {

}

async function loadCoffeeShopMarkers(coffeeShops) {
  if (globalMapObj) {
    // go through coffee shops and return as an array of marker
    const markers = coffeeShops.map(coffeeShop => {
      // get pos [x, y]
      const pos = [coffeeShop.lat, coffeeShop.long]
      // add to marker
      const marker = L.marker(pos, {
          icon: L.divIcon({
            html: `<div class='coffee-shop-icon'>🏠</div>`
            +`<span class='coffee-shop-label main-font-med'>${coffeeShop.name}</span>`,
            className: 'marker-icon',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          })
        });
      
      // return marker
      return marker;
    })

    // add layer group to conditional layer plugin
    L.conditionalMarkers(markers).addTo(globalMapObj);
  }
}