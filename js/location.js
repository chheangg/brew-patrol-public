let globalMapObj = null;

function isGeolocationAvailable() {
  return "geolocation" in navigator;
}

function panToLocation(position) {
  if (globalMapObj) {
    globalMapObj.panTo(position)
  }
}

function panToCurrentLocation() {
  // if geolocation is available
  if (isGeolocationAvailable()) {
    // get current position
    navigator.geolocation.getCurrentPosition((position) => {
      console.log(position.coords)
      const { latitude, longitude } = position.coords;
      // pan to location
      panToLocation([latitude, longitude])
    });
  }
}