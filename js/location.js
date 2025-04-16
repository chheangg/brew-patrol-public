let globalMapObj;

function isGeolocationAvailable() {
  return "geolocation" in navigator;
}

function flyToLocation(position) {
  if (globalMapObj) {
    globalMapObj.flyTo(position, 16)
  }
}

async function getCurrentLocation() {
  return new Promise((res, rej) => {
    navigator.geolocation.getCurrentPosition((position) => {
      const { latitude, longitude } = position.coords;
      // pan to location
      res({ lat: latitude, long: longitude })
    });
  })
}

function flyToCurrentLocation() {
  // if geolocation is available
  if (isGeolocationAvailable()) {
    // get current position
    navigator.geolocation.getCurrentPosition((position) => {
      const { latitude, longitude } = position.coords;
      // pan to location
      flyToLocation([latitude, longitude])
    });
  }
}

function getCurrentViewpointCenterLocation() {
  if (globalMapObj) {
    return globalMapObj.getCenter();
  }
}