// just a simple hashMap for caching
let coffeeShops;
let neighbourhoods;

//https://ognjen.io/formula-for-sorting-by-average-rating-and-number-of-ratings/


async function getCoffeeShops() {
  if (coffeeShops) {
    return coffeeShops;
  }
  // use fetch api to grab data from json
  const response = await fetch('../data/coffee_shop.json')
  coffeeShops = await response.json();
  // return json as array of obj
  return coffeeShops;
}

async function getNeighbourhoods() {
  if (neighbourhoods) {
    return neighbourhoods;
  }
  // use fetch api to grab data from json
  const response = await fetch('../data/neighbourhoods.json')
  neighbourhoods = await response.json()
  // return json as array of obj
  return neighbourhoods;
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
    // create smallestInCell
    let smallestCell = Infinity;
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
      // check if it's the smallest cell within the row
      smallestCell = Math.min(smallestCell, array[i][j]);
    }

    // if greater than threshold, exit early
    if (smallestCell > threshold) {
      // return false
      return false;
    }
  }

  // return if it's within reasonable threshold
  return array[array.length - 1][array[0].length - 1] <= threshold;
}

let m = null;
let C = null;

// https://www.algolia.com/doc/guides/managing-results/must-do/custom-ranking/how-to/bayesian-average/
function bayesAvg(rating, review_count, coffeeShops) {
  // average rating for all stores
  m = m ? m : coffeeShops.reduce((prev, curr) => prev + curr.rating, 0) / coffeeShops.reduce((prev, curr) => prev + curr.review_count, 0);
  // 25th percentile's rating
  C = C ? C : [...coffeeShops].sort((c1, c2) => c1.rating - c2.rating)[Math.floor(coffeeShops.length * 25 / 100)].review_count;

  return (rating * review_count + C * m) / (review_count + C);
}

function isClose(c, cf, d) {
  // 1 mile = 69 deg
  return ((c.lat - cf.lat) ** 2 + (c.long - cf.long) ** 2) <= (d / 69) ** 2
}

/**
 * coffeeShops,
 * byDistance, (cannot be turend on the same time as byViewpoint or by Neighbourhood)
 * byViewpoint, (cannot be turned on the same time as byDistance or byNeighbourhood)
 * byNeighbourhood, (cannot be turned on the same time as byDistance or byViewpoint)
 * distance = [5 mi, 10 mi, 15 mi, 20 mi, custom],
 * byRatingAndRelevancy,
 * byPrice
 */
function filterCoffeeShops({
  coffeeShops,
  byRatingAndRelevancy,
  byLocation,
  byNeighbourhood,
  byPricing,
  location = { lat: 34.0549, long: -118.24 },
  distance = 3,
  neighbourhood,
  pricing = [1, 2, 3]
}) {
  let filteredCoffeeShops = coffeeShops;
  
  // if byRatingAndRelevancy
  if (byRatingAndRelevancy) {
    // reset the cache
    m = null;
    C = null;
    filteredCoffeeShops = 
      filteredCoffeeShops
        .sort((cf1, cf2) => 
          bayesAvg(cf2.rating, cf2.review_count, filteredCoffeeShops)
          - 
          bayesAvg(cf1.rating, cf1.review_count, filteredCoffeeShops) 
        )
  }

  // byNeighbourhood
  if (byNeighbourhood) {
    filteredCoffeeShops = 
      filteredCoffeeShops
        .filter(cf => cf.neighbourhood.toLowerCase() === neighbourhood.toLowerCase());
  }
  // or use byLocation
  else if (byLocation) {
    filteredCoffeeShops =
    filteredCoffeeShops
        .filter(cf => {
          return isClose(location, { lat: cf.lat, long: cf.long }, distance)
        })
  } 


  // if byPricing
  if (byPricing) {
    filteredCoffeeShops = 
      filteredCoffeeShops
          .filter(cf => cf.price_int && pricing.includes(cf.price_int))
  }

  return filteredCoffeeShops;
} 

/**
 * GOOD ENOUGH SEARCH FUNCTION :D
 * Implement custom search, return the items in the the two orders:
 * - common subsequence of neighborhood name with a <= 3 differences, then use it to filter by neighborhoods if exists
 * - a direct subsequence of coffee shop name
 * - common subsequence of coffee shop name with a <= 5 differences
 * * prevent any searches until there's three letters
 * * filter any direct matches
 * * stop searches early in common sequence IF it's above the threshold
 * * implement caches in search
 */
async function search({ 
  text = "",
  byPricing = false, 
  byRatingAndRelevancy = false, 
  byLocation = false,
  location,
  distance,
  pricing,
}) {
  // if text length is lt 3, return empty
  if (text.length < 3 && !byLocation) {
    return [];
  }

  // get neighbourhoods
  const neighbourhoods = await getNeighbourhoods();

  // create selectedNeighbourhood variable
  let selectedNeighbourhood;
  // check if any neighborhood is referenced
  for(let i = 0; i < neighbourhoods.length; i++) {
    // if levenshtein between search input and neighbourhoods is lte 3
    if (levenshteinDistance(text.toLowerCase(), neighbourhoods[i].toLowerCase(), 3)) {
      // set selected neighborhood
      selectedNeighbourhood = neighbourhoods[i];
      // break
      break;
    }
  }

  const byNeighbourhood = !!selectedNeighbourhood

  // get coffeeShops
  const coffeeShops = await getCoffeeShops();

  // get filtered coffee shops
  let filteredCoffeeShops = filterCoffeeShops({ 
    coffeeShops, 
    byRatingAndRelevancy,
    byLocation,
    byNeighbourhood,
    byPricing,
    location,
    distance,
    neighbourhood: selectedNeighbourhood,
    pricing
  });
  
  // create searchList
  let searchList = [];

  // create set for checking seen element
  const set = new Set();
  console.log(text, filteredCoffeeShops)
  // check if any of them has text as a subset of it
  if (text && filteredCoffeeShops.length > 0) {
    for(let i = 0; i < filteredCoffeeShops.length; i++) {
      // if levenshtein between search input and coffee name is lte 3
      if (
        filteredCoffeeShops[i].name.toLowerCase().includes(text.toLowerCase())
        ||
        (byNeighbourhood && (filteredCoffeeShops[i].neighbourhood === selectedNeighbourhood))
      ) {
        set.add(i);
        searchList.push(filteredCoffeeShops[i]);
      }
    }
  } 
  // otherwise if filtered is empty
  else if (text && filteredCoffeeShops.length === 0) {
    console.log("CALLED")
    filteredCoffeeShops = coffeeShops
    for(let i = 0; i < filteredCoffeeShops.length; i++) {
      // if levenshtein between search input and coffee name is lte 3
      if (
        filteredCoffeeShops[i].name.toLowerCase().includes(text.toLowerCase())
      ) {
        set.add(i);
        searchList.push(filteredCoffeeShops[i]);
      }
    }

    console.log(searchList)
  }
  // else
  else {
    searchList = filteredCoffeeShops
  }

  // return searchList
  return searchList;
}

onmessage = async (e) => {
  const coffeeShops = await search(e.data);
  postMessage(coffeeShops)
}