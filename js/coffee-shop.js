async function getCoffeeShops() {
  // use fetch api to grab data from json
  const response = await fetch('../data/coffee_shop.json')
  // return json as array of obj
  return await response.json();
}

function imageExists(image_url){
  const http = new XMLHttpRequest();

  http.open('HEAD', image_url, false);
  http.send();

  return http.status != 403 && http.status != 404;
}

function renderCoffeeShopCard(coffeeShop) {
  const imgUrl = imageExists(coffeeShop.image_url) ? coffeeShop.image_url : 'https://placehold.co/600x400?text=No+image+:(';
  // https://stackoverflow.com/questions/30796141/parse-json-array-from-string
  const categories = coffeeShop
    .categories
    .replace(/[\[\]']/g,'')
    .split(',');
  return `
  <div class='coffee-shop-card'>
    <div class='coffee-shop-card-header main-font-semibold'>
      <img src=${imgUrl} />
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
  </div>
  `
}

function onClickCoffeeShopMarker(coffeeShop) {
  // render coffee shop card
  const content = document.querySelector('#content')
  const coffeeShopCard = renderCoffeeShopCard(coffeeShop);
  content.innerHTML = coffeeShopCard;
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