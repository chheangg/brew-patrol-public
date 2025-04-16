// just a simple hashMap for caching
const cache = {}
let coffeeShops;

async function getCoffeeShops() {
  if (coffeeShops) {
    return coffeeShops
  }
  // use fetch api to grab data from json
  const response = await fetch('../data/coffee_shop.json')
  coffeeShops = await response.json();
  // return json as array of obj
  return coffeeShops;
}


function renderImageAsync(url) {
  const asyncImgElement = new Image();
  asyncImgElement.src = url;

  asyncImgElement.onerror = () => {
    asyncImgElement.src = 'https://placehold.co/600x400?text=No+image+:(';
  }
  return asyncImgElement;
}


function unrenderCoffeeShopCard() {
  const content = document.querySelector('#content')
  content.innerHTML = "";
  console.log('hey')
}

function renderCoffeeShopCard(coffeeShop, prev, next) {
  // https://stackoverflow.com/questions/30796141/parse-json-array-from-string
  const categories = coffeeShop
    .categories 
    .replace(/[\[\]']/g,'')
    .split(',');

  const cardContainer = document.createElement('div');
  cardContainer.className = 'coffee-shop-card';

  cardContainer.innerHTML = `
    <button class='close btn' role="close"><i data-lucide="x"></i></button>
    <div class='coffee-shop-card-header main-font-semibold'>
      <div class='img-container'></div>
      <div class='coffee-shop-title'>
        <div class='coffee-shop-top-title'>
          <h2>${coffeeShop.name}</h2>
          <span>${coffeeShop.price}</span>
        </div>
        <div class='main-font-light address'><i class='icon' data-lucide="map-pin-house"></i> ${coffeeShop.store_add1 ? coffeeShop.store_add1 + ', ' : ''}${coffeeShop.neighbourhood}</div>
      </div>
    </div>
    <div class='coffee-shop-card-content'>
      <div class='badge-list'>
        ${
          categories.map(cat => {
            return (
              `<div class='badge'>${cat}</div>`
            )
            })
          .join('')
        }
      </div>
      <div class='coffee-shop-rating'>
        <i class='icon' data-lucide="star"></i> <div>${coffeeShop.rating} of 5 ratings, ${coffeeShop.review_count} reviews</div>
      </div>
      <a class='yelp' href=${coffeeShop.url} target="_blank">
        <i class='icon' data-lucide="external-link"></i> Yelp profile
      </a>
    </div>
  `

  const closeBtn = cardContainer.querySelector('.close');
  closeBtn.addEventListener('click', unrenderCoffeeShopCard);

  const asyncImgElement = renderImageAsync(coffeeShop.image_url)
  const imgContainer = cardContainer.querySelector('.img-container');
  imgContainer.appendChild(asyncImgElement)

  const cardWrapper = document.createElement('div');
  cardWrapper.className = 'card-wrapper';

  const pagination = document.createElement('div');
  pagination.className = 'pagination'

  cardWrapper.appendChild(cardContainer)
  cardWrapper.appendChild(pagination);
  pagination.appendChild(prev || document.createElement('div'));
  pagination.appendChild(next || document.createElement('div'));
  return cardWrapper
}

function onClickOut() {
  unrenderCoffeeShopCard();
}

function onClickCoffeeShopMarker(coffeeShop) {
  // render coffee shop card
  const content = document.querySelector('#content')
  content.innerHTML = "";
  const coffeeShopCard = renderCoffeeShopCard(coffeeShop);
  content.replaceChildren(coffeeShopCard);
  // pan to it
  if (globalMapObj) {
    const { long, lat } = coffeeShop;
    flyToLocation([lat, long], 15)
  }

  lucide.createIcons();
}

async function loadCoffeeShopMarkers(coffeeShops) {
  if (globalMapObj) {
    // go through coffee shops and return as an array of marker
    const markers = coffeeShops.map(coffeeShop => {
      // get pos [x, y]
      const pos = [coffeeShop.lat, coffeeShop.long]
      // add to marker
      const marker = L
        .marker(pos, {
          icon: L.divIcon({
            html: `<div class='coffee-shop-icon'>🏠</div>`
            +`<span class='coffee-shop-label main-font-med'>${coffeeShop.name}</span>`,
            className: 'marker-icon',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          }),
        })
        .on('click', () => onClickCoffeeShopMarker(coffeeShop))
      
      // return marker
      return marker;
    })

    // add layer group to conditional layer plugin
    L.conditionalMarkers(markers).addTo(globalMapObj);
  }
}

async function getNeighbourhoods() {
  // use fetch api to grab data from json
  const response = await fetch('../data/neighbourhoods.json')
  // return json as array of obj
  return await response.json();
}

async function getCoffeeShops() {
  if (coffeeShops) {
    return coffeeShops
  }
  // use fetch api to grab data from json
  const response = await fetch('../data/coffee_shop.json')
  coffeeShops = await response.json();
  // return json as array of obj
  return coffeeShops;
}
