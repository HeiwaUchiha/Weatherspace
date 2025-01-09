'use strict'

import {fetchData, url} from "/api.js";
import * as module from "./module.js";

const addEventOnElements = (elements, eventType, callback) => {
  for(const element of elements) element.addEventListener(eventType, callback)
}

const navToggle = document.querySelector(".menu")
const list = document.querySelector(".city-search");
const audio = document.getElementById('menu-audio');
navToggle.addEventListener("click", () => {
  console.log('Menu is About to be Changed')  
  list.classList.toggle("active")
    audio.currentTime = 0;
    audio.play(); 
    audio.volume = 0.2
});

const mediaQuery = window.matchMedia("(max-width: 805px)");

let toggleListener;
function enableToggle() {
    toggleListener = (event) => {
        if (event.target.closest("[data-search-toggler]")) {
            if (list) list.classList.toggle("active");
            if (navToggle) navToggle.checked = false;
        }
    };    
    document.body.addEventListener("click", toggleListener);
    
}

function disableToggle() {
    if (toggleListener) {        
        toggleListener = null;
        console.log("Toggle disabled for larger screens");
    }
}

function handleScreenChange(e) {
    if (e.matches) {
        enableToggle();
    } else {
        disableToggle();
    }
}

mediaQuery.addEventListener("change", handleScreenChange);
handleScreenChange(mediaQuery);


// INPUT SYNCHRONIZATION //
const searchViewField = document.querySelector(".search-view [data-search-field]");
const citySearchField = document.querySelector(".city-search [data-search-field]");

function syncInputValues(sourceField, targetField) {
  sourceField.addEventListener("input", () => {
    targetField.value = sourceField.value;
  });
}

syncInputValues(searchViewField, citySearchField);
syncInputValues(citySearchField, searchViewField);


// SEARCH INTEGRATION //


const searchFields = document.querySelectorAll("[data-search-field]");


const searchTimeoutDuration = 500; 

searchFields.forEach((searchField) => {
  
  const searchWrapper = searchField.closest("[data-search-view]");
  const searchResult = searchWrapper.querySelector("[data-search-result]");

  let searchTimeout = null; 

  
  searchField.addEventListener("input", () => {
    
    if (searchTimeout) clearTimeout(searchTimeout);

    
    if (!searchField.value) {
      searchResult.classList.remove("active");
      searchResult.innerHTML = "";
      searchField.classList.remove("searching");
    } else {
      searchField.classList.add("searching");
    }

    
    if (searchField.value) {
      searchTimeout = setTimeout(() => {
        
        fetchData(url.geo(searchField.value), (locations) => {
          searchField.classList.remove("searching"); 
          searchResult.classList.add("active"); 

          
          searchResult.innerHTML = `
                <ul class="view-list" data-search-list></ul>
              `;
              const items = [];
              for(const {name, lat, lon, country, state} of locations){
                const searchItem = document.createElement("li");
                searchItem.classList.add("view-item")
                searchItem.innerHTML = `
                  <span class="m-icon">location_on</span>
                  <div>
                    <p class="item-title">${name}</p>
                    <p class="label-2 item-subtitle">${state || ""}, ${country}</p>
                  </div>
                  <a href="#/weather?lat=${lat}&lon=${lon}" aria-label="${name} weather" class="item-link has-state" data-search-toggler></a> 
                `;
                searchResult.querySelector("[data-search-list]").appendChild(searchItem);
                items.push(searchItem.querySelector("[data-search-toggler]"));   
              }
        });
      }, searchTimeoutDuration);
    }
  });
});

  const container = document.querySelector("[data-container]");
  const loading = document.querySelector("[data-loading]");
  const errorContent = document.querySelector("[data-error-content]");
  const currentLocationBtn = document.querySelector("[data-current-location-btn]");

export const updateWeather = function (lat, lon) {
  const currentWeatherSection = document.querySelector("[data-current-weather]");
  const highlightSection = document.querySelector("[data-highlights]");
  const hourlySection = document.querySelector("[data-hourly-forecast]");
  const forecastSection = document.querySelector("[data-5-day-forecast]");



  loading.style.display = "grid";
  container.style.overflowY = "hidden"; 
  container.classList.remove("fade-in");
  errorContent.style.display = "none"

  currentWeatherSection.innerHTML = "";
  highlightSection.innerHTML = "";
  hourlySection.innerHTML = "";
  forecastSection.innerHTML = "";

  if (window.location.hash === "#/current-location") {
    currentLocationBtn.setAttribute("disabled", "")
  }else{
    currentLocationBtn.removeAttribute("disabled")
  }

  fetchData(url.currentWeather(lat, lon), function (currentWeather) {
    const{ 
      weather,
      dt: dateUnix,
      timezone,
      sys: { sunrise: sunriseUnixUTC, sunset: sunsetUnixUTC},
      main: { temp, feels_like, pressure, humidity,},
      visibility
    } = currentWeather;
    const [{ description, icon}] = weather;
    
    const card = document.createElement("div");
    card.classList.add("card", "card-lg", "current-weather-card");

    card.innerHTML = `
      <h2 class="title-2 card-title">Now</h2>
      <div class="weapper">
          <p class="heading">${parseInt(temp)}<sup>°</sup>C</p>
          <img src="assets/weather_icons/${icon}.png" alt="${description}" width="64" height="64" class="weather-icon">
      </div>
      <p class="body-3">${description}</p>
      <ul class="meta-list">
          <li class="meta-item">
              <span class="m-icon">calendar_today</span>
              <p class="title-3 meta-text">${module.getDate(dateUnix, timezone)}</p>
          </li>
          <li class="meta-item">
              <span class="m-icon">location_on</span>
              <p class="title-3 meta-text" data-location></p>
          </li>
      </ul>
    `;
    
    fetchData(url.reverseGeo(lat, lon), function ([{name, country}]) {
      card.querySelector("[data-location]").innerHTML = `${name}, ${country}`;
    })
    currentWeatherSection.appendChild(card);



    // TODAY'S HIGHLIGHTS //
    fetchData(url.airPollution(lat, lon), function (airPollution) {
      const[{
        main: { aqi },
        components: { no2, o3, so2, pm2_5 }
      }] = airPollution.list;

      const card = document.createElement("div");
      card.classList.add("card", "card-lg");

      card.innerHTML = `
          <h2 class="title-2" id="highlights-label">Todays Highlights</h2>
          <div class="highlight-list">
              <div class="card card-sm highlight-card one">
                  <h3 class="title-3">Air Quality Index</h3>
                  <div class="wrapper">
                      <span class="m-icon">air</span>
                      <ul class="card-list">
                          <li class="card-item">
                              <p class="title-1">${Number(pm2_5).toPrecision(3)}</p>
                              <p class="label-1">PM<sub>2.5</sub></p>
                          </li>
                          <li class="card-item">
                              <p class="title-1">${so2.toPrecision(3)}</p>
                              <p class="label-1">SO<sub>2</sub></p>
                          </li>
                          <li class="card-item">
                              <p class="title-1">${no2.toPrecision(3)}</p>
                              <p class="label-1">NO<sub>2</sub></p>
                          </li>
                          <li class="card-item">
                              <p class="title-1">${o3.toPrecision(3)}</p>
                              <p class="label-1">O<sub>3</sub></p>
                          </li>
                      </ul>
                  </div>
                  <span class="badge aqi-${aqi} label-${aqi}" title="${module.aqiText[aqi].message}">
                      ${module.aqiText[aqi].level}
                  </span>
              </div>
              <div class="card card-sm highlight-card two">
                  <h3 class="title-3">Sunrise & Sunset</h3>
                  <div class="card-list">
                      <div class="card-item">
                          <span class="m-icon">clear_day</span>
                          <div>
                              <p class="label-1">Sunrise</p>
                              <p class="title-1">${module.getTime(sunriseUnixUTC, timezone)}</p>
                          </div>
                      </div>
                      <div class="card-item">
                          <span class="m-icon">clear_night</span>
                          <div>
                              <p class="label-1">Sunset</p>
                              <p class="title-1">${module.getTime(sunsetUnixUTC, timezone)}</p>
                          </div>
                      </div>
                  </div>
              </div>
              <div class="card card-sm highlight-card">
                  <h3 class="title-3">Humidity</h3>
                  <div class="wrapper">
                      <span class="m-icon">humidity_percentage</span>
                      <p class="title-1">${humidity}<sup>%</sup></p>
                  </div>
              </div>
              <div class="card card-sm highlight-card">
                  <h3 class="title-3">Pressure</h3>
                  <div class="wrapper">
                      <span class="m-icon">airwave</span>
                      <p class="title-1">${pressure}<sub>Pa</sub></p>
                  </div>
              </div>
              <div class="card card-sm highlight-card">
                  <h3 class="title-3">Visibility</h3>
                  <div class="wrapper">
                      <span class="m-icon">visibility</span>
                      <p class="title-1">${visibility / 1000}<sub>km</sub></p>
                  </div>
              </div>
              <div class="card card-sm highlight-card">
                  <h3 class="title-3">Feels Like</h3>
                  <div class="wrapper">
                      <span class="m-icon">thermometer</span>
                      <p class="title-1">${parseInt(feels_like)}<sup>°</sup>C</p>
                  </div>
              </div>
          </div>
      `;
      highlightSection.appendChild(card);
    });



    // 24HOURS FORECAST SECTION //
    fetchData(url.forecast(lat, lon), function (forecast) {
      const {
        list: forecastList,
        city: { timezone }
      } = forecast;

      hourlySection.innerHTML = `
        <h2 class="title-2">Today at</h2>
        <div class="slider-container">
            <ul class="slider-list" data-temp>
            </ul>
            <ul class="slider-list" data-wind>
            </ul>
        </div>
      `;

      for (const [index, data] of forecastList.entries()) {
        if (index > 7) break;

        const{
          dt: dateTimeUnix,
          main: { temp },
          weather, 
          wind:{ deg:windDirection, speed:windSpeed }
        } = data;
        const[{ icon, description }] = weather;

        const tempLi = document.createElement("li");
        tempLi.classList.add("slider-item");

        tempLi.innerHTML = `
          <div class="card card-sm slider-card">
            <p class="body-3">${module.getHours(dateTimeUnix, timezone)}</p>
            <img src="assets/weather_icons/${icon}.png" alt="${description}" loading="lazy" class="weather-icon" height="48" width="48" title="${description}">
            <p class="body-3">${parseInt(temp)}<sup>°</sup>C</p>
          </div>  
        `; 
        hourlySection.querySelector("[data-temp]").appendChild(tempLi);

        const windLi = document.createElement("li");
        windLi.classList.add("slider-item");

        windLi.innerHTML = `
         <div class="card card-sm slider-card">
            <p class="body-3">${module.getHours(dateTimeUnix, timezone)}</p>
            <img src="assets/weather_icons/direction.png" alt="direction" loading="lazy" class="weather-icon" height="48" width="48" style="transform: rotate(${windDirection - 180}deg)">
            <p class="body-3">${parseInt(module.mps_to_kmh(windSpeed))}km/h</p>
        </div>
        `;
        hourlySection.querySelector("[data-wind]").appendChild(windLi);
      };

      // 5 DAY FORECAST SECTION//
      forecastSection.innerHTML = `
          <h2 class="title-2" id="forecast-label">5 Days Forecast</h2>
          <div class="card card-lg forecast-card">
              <ul data-forecast-list>
              </ul>
          </div>
      `;

      for (let i = 7, len = forecastList.length; i < len; i += 8) {
        const {
          main: { temp_max },
          weather, 
          dt_txt
        } = forecastList[i];
        const [{ icon, description }] = weather;
        const date = new Date(dt_txt);

        const foreLi = document.createElement("li");
        foreLi.classList.add("card-item");
        foreLi.innerHTML = `
          <div class="icon-wrapper">
            <img src="assets/weather_icons/${icon}.png" width="36" height="36" alt="${description}" 
            class="weather-icon" title="${description}">
            <span class="span">
              <p class="title-2">${parseInt(temp_max)}<sup>°</sup></p>
            </span>
          </div>
          <p class="label-1">${date.getDate()} ${module.monthNames[date.getUTCMonth()]}</p>
          <p class="label-1">${module.weekDayNames[date.getUTCDay()]}</p>
        `;
        
        forecastSection.querySelector("[data-forecast-list]").appendChild(foreLi);
      };


      loading.style.display = "none"
      container.style.overflowY = "overlay" 
      container.classList.add("fade-in");

    });
  });
};

export const error404 =  () => {
  errorContent.style.display = "flex"    
}
