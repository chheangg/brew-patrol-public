function loadMap() {
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


function renderFrontPageCoffeeShopList(coffeeShops = []) {
  const frontPageList = document.querySelector('.front-page-list');
  const coffeeShopCards = coffeeShops.map(cf => renderCoffeeShopCard(cf));
  frontPageList.innerHTML = '';
  coffeeShopCards.forEach(cf => frontPageList.appendChild(cf));
  // generate icon
  lucide.createIcons();
}

// https://www.freecodecamp.org/news/javascript-debounce-example/
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => { fn.apply(this, args); }, delay);
  };
}

const worker = new Worker("./js/worker.js");
  
worker.onmessage = async (e) => {
  renderFrontPageCoffeeShopList(e.data)
}

async function handleSearch(e) {
  worker.postMessage(e.target.value)
}

const debouncedHandleSearch = debounce((e) => handleSearch(e), 300)

async function main() {
  // select search-input
  const searchInput = document.querySelector('.search-input');
  // add onSearch function to search-input
  searchInput.addEventListener('input', debouncedHandleSearch)
}

// call main
main();