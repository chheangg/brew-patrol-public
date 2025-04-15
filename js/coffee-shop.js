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

async function getNeighbourhoods() {
  // use fetch api to grab data from json
  const response = await fetch('../data/neighborhoods.json')
  // return json as array of obj
  return await response.json();
}

/**
 * 
 * @param {string} text1 of size m
 * @param {string} text2 of size n
 */
function levenshteinDistance(text1, text2, threshold) {
  // if length of both text exceed threshold
  if (Math.abs(text1.length - text2.length) > threshold) {
    return false;
  }
  // create array of size m + 1 x n + 1, fill it with 0
  const array = 
    (new Array(text1.length + 1).fill(0))
    .map(() => new Array(text2.length + 1).fill(0));

  // set first col to the index
  for (let i = 1; i < array.length; i++) {
    array[i][0] = i;
  }

  // set first row to the index
  for (let i = 1; i < array[0].length; i++) {
    array[0][i] = i;
  }

  // create editCost
  let editCost = 0;

  // now iterate through the whole array from index 1, 1
  for (let i = 1; i < array.length; i++) {
    for (let j = 1; j < array[0].length; j++) {
      // if both letter are the same
      if (text1[i - 1] === text2[j - 1]) {
        editCost = 0;
      } 
      // else
      else {
        editCost = 1;
      }

      // set the cost in our dps, find the min
      array[i][j] = Math.min(
        array[i - 1][j] + 1,
        array[i][j - 1] + 1,
        array[i - 1][j - 1] + editCost
      );
    }
  }

  // return if it's within reasonable threshold
  return array[array.length - 1][array[0].length - 1] <= threshold;
}

/**
 * Implement custom search, return the items in the the two orders:
 * - direct subsequence in coffee shop name
 * - common subsequence of coffee shop name with a <= 5 differences
 * - common subsequence of neighborhood name with a <= 3 differences
 * * prevent any searches until there's three letters
 * * filter any direct matches
 * * stop searches early in common sequence IF it's above the threshold
 * * implement caches in search
 */
async function search(text = "") {
  // if text length is lt 3, return empty
  if (text.length < 3) {
    return [];
  }
  // get coffeeShops
  const coffeeShops = await getCoffeeShops();
  
  // create searchList
  const searchList = [];

  // create set for checking seen element
  const set = new Set();

  // check if any of them is in the coffee shop name
  for(let i = 0; i < coffeeShops.length; i++) {
    // if name is includes text
    if (coffeeShops[i].name.includes(text)) {
      set.add(i);
      searchList.push(coffeeShops[i]);
    }
  }

  // check if any of them has a edit distance of lte 5 in names
  for(let i = 0; i < coffeeShops.length; i++) {
    // if index is already seen
    if (set.has(i)) {
      // continue
      continue;
    }
    // if levenshtein between search input and coffee name is lte 5
    if (levenshteinDistance(text, coffeeShops[i].name, 5)) {
      set.add(i);
      searchList.push(coffeeShops[i]);
    }
  }

  // check if any of them has a edit distance of lte 3 in neighborhood
  for(let i = 0; i < coffeeShops.length; i++) {
    // if index is already seen
    if (set.has(i)) {
      // continue
      continue;
    }
    // if levenshtein between search input and coffee name is lte 3
    if (levenshteinDistance(text, coffeeShops[i].neighbourhood, 3)) {
      set.add(i);
      searchList.push(coffeeShops[i]);
    }
  }

  // return searchList
  return searchList;
}