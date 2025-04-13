function main() {
  window.onload = () => {
    // render los angeles
    const map = L.map('map').setView([34.05, -118.24], 15);
    // set dark mode base-map
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);
  }
}

// call main
main();
