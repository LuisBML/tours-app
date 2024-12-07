export const displayMap = (tourLocations) => {
    maptilersdk.config.apiKey = 'EiHcmPqC82SAPImepzJo';

    const boundingBox = new maptilersdk.LngLatBounds(
        [
            tourLocations[0].coordinates,
            tourLocations[tourLocations.length - 1].coordinates
        ]
    );

    const map = new maptilersdk.Map({
        container: 'map', // container's id or the HTML element in which the SDK will render the map
        style: 'dataviz',
        zoom: 4, // starting zoom
        scrollZoom: false
    });

    // Pans and zooms the map to contain its visible area within the specified geographical bounds.
    map.fitBounds(boundingBox, {
        padding: { top: 200, bottom: 150, left: 100, right: 100 }
    });

    for (const tourLocation of tourLocations) {
        new maptilersdk.Marker()
            .setLngLat(tourLocation.coordinates)
            .addTo(map);

        new maptilersdk.Popup({ offset: 30, closeOnClick: false, closeButton: false })
            .setLngLat(tourLocation.coordinates)
            .setHTML(`<p><strong>Day ${tourLocation.day}</strong>: ${tourLocation.description}</p>`)
            .addTo(map);
    }
}

