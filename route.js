'use strict';

import {updateWeather, error404} from "./app.js";
const defaultLocation = "#/weather?lat=6.339185&lon=5.617447" // Benin City as Default Location

const currentLocation = function () {
    window.navigator.geolocation.getCurrentPosition(
        res => {
            const { latitude, longitude } = res.coords;
            updateWeather(`lat=${latitude}`, `lon=${longitude}`);
        },
        err => {
            console.error("Geolocation error:", err);
            window.location.hash = defaultLocation;
        }
    );
};

const searchedLocation = query => updateWeather(...query.split("&"));

const routes = new Map([
    ["/current-location", currentLocation],
    ["/weather", searchedLocation],
]);

const checkHash = function () {
    const requestUrl = window.location.hash.slice(1);
    const [route, query] = requestUrl.includes("?") ? requestUrl.split("?") : [requestUrl];

    routes.get(route) ? routes.get(route)(query) : error404();
};

window.addEventListener("hashchange", checkHash);
window.addEventListener("load", function () {
    if (!window.location.hash) {
        window.location.hash = "#/current-location";
    } else {
        checkHash();
    }
});
