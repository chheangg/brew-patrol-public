function main() {
  window.onload = async () => {
    // render los angeles
    const map = L.map('map', {
      preferCanvas: true
    }).setView([34.05, -118.24], 15);

    // set global map obj
    globalMapObj = map;

    // set dark mode base-map
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 19
    }).addTo(map);

    // prevent keyboard interaction
    map.keyboard.disable();

    // load all coffee shops
    const coffeeShops = await getCoffeeShops();
    // load coffee shops marker
    loadCoffeeShopMarkers(coffeeShops, map);
    // pan to current position
    // panToCurrentLocation();
    // search
    search();
  }
}

// call main
main();

getAllNeighborhoods();