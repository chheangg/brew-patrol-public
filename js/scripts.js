async function loadMap() {
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

  // handle onMoveEnd to change location
  globalMapObj.on('moveend', () => {
    filterOptions.location = { lat: globalMapObj.getCenter().lat, long: globalMapObj.getCenter().lng };
  })

  // pan to current location
  flyToCurrentLocation();
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

// initialize worker
// NOTE: this is to offload heavy work and to stop
// the main thread from being blocked
const worker = new Worker("./js/worker.js");
  
// on receiving any data from worker
worker.onmessage = async (e) => {
  // render it
  renderFrontPageCoffeeShopList(e.data)
}

let filterOptions = {
  byRatingAndRelevancy: false,
  byLocation: true,
  byNeighbourhood: false,
  byPricing: false,
  distance: 3,
  pricing: null,
}

function getHeightOfMapBound() {
  if (globalMapObj) {
    const sw = globalMapObj.getBounds().getSouthWest();
    const ne = globalMapObj.getBounds().getNorthEast();
    return (ne.lat - sw.lat) / 2;
  }
}

// post message to worker
async function handleSearch(e) {
  // if event is enter
  if (e.key === 'Enter' || e.keyCode === 13) {
    worker.postMessage({ 
      text: e.target.value, 
      ...filterOptions,
      location: globalMapObj ? { lat: globalMapObj.getCenter().lat, long: globalMapObj.getCenter().lng } : await getCurrentLocation(),
      distance: 
        filterOptions.distance 
        ?
        filterOptions.distance
        :
        getHeightOfMapBound()
      })
  }
}

// for search cnlick
async function handleSearchClick(e) {
  const searchInput = document.querySelector('.search-input');
  worker.postMessage({ 
    text: e.target.value, 
    ...filterOptions,
    location: globalMapObj ? globalMapObj.getCenter() : await getCurrentLocation(),
    distance: 
      filterOptions.distance 
      ?
      filterOptions.distance
      :
      getHeightOfMapBound()
    })
}

async function handleToggle() {
  // select front-page and map
  const frontPage = document.querySelector('#front-page');
  const map = document.querySelector('#map');

  frontPage.classList.toggle('hidden');
  map.classList.toggle('hidden');

  // if globalMapObj is not initialized
  if (!globalMapObj) {
    loadMap();
  }
}


// debounce it just in case, 300 ms
const debouncedHandleSearch = debounce((e) => handleSearch(e), 300)
const debouncedHandleSearchClick = debounce((e) => handleSearchClick(e), 300)

function handleRating(e) {
  filterOptions.byRatingAndRelevancy = e.target.value
  console.log(filterOptions)
}

function handlePricing(e) {
  filterOptions.byPricing = e.target.value !== '';
  filterOptions.pricing = e.target.value;
  console.log(filterOptions)
}

function handleDistance(e) {
  filterOptions.distance = parseFloat(e.target.value);
  console.log(filterOptions)
}

async function main() {
  // select search-input
  const searchInput = document.querySelector('.search-input');
  // add handleSearch function to search-input
  searchInput.addEventListener('keyup', debouncedHandleSearch);
  // select search btn
  const searchBtn = document.querySelector('.search-btn');
  // add handleSearchCLick function to search-btn
  searchBtn.addEventListener('click', debouncedHandleSearchClick);

  // select toggle-btn
  const toggleBtn = document.querySelector('.toggle-btn');
  // add handleToggle event function to toggle-btn
  toggleBtn.addEventListener('click', handleToggle)

  // select rating
  const ratingInput = document.querySelector('#rating');
  ratingInput.addEventListener('input', handleRating)

  // select pricing
  const pricingInput = document.querySelector('#pricing');
  pricingInput.addEventListener('input', handlePricing)

  // select by Location
  const distanceInput = document.querySelector('#distance');
  distanceInput.addEventListener('input', handleDistance)
}

// call main
main();