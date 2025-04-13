let globalMapObj = null;

function isGeolocationAvailable() {
  return "geolocation" in navigator;
}

function flyToLocation(position) {
  if (globalMapObj) {
    globalMapObj.flyTo(position, 16)
  }
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