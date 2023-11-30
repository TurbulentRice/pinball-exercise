(() => {

  /**
   * DOM refs and listeners
   */
  const view = {
    form:             document.querySelector('form'),
    formError:        document.getElementById('formError'),
    nearMeError:      document.getElementById('nearMeError'),
    nearMeBtn:        document.getElementById('nearMeBtn'),
    submitBtn:        document.querySelector('button[type="submit"]'),
    latitudeInput:    document.getElementById('latitude'),
    longitudeInput:   document.getElementById('longitude'),
    locationsHeader:  document.getElementById('locationsHeader'),
    locationsList:    document.getElementById('locationsList'),
    modal:            document.getElementById('modal'),
  };
  view.nearMeBtn.addEventListener('click', handleNearMeClick);
  view.form.addEventListener('submit', handleSubmit);

  /**
   * Initialize placeholders with random US coordinate examples
   */
  const getRandomLatitude = () => (Math.random() * (49.384358 - 24.396308) + 24.396308).toFixed(7);
  const getRandomLongitude = () => (Math.random() * (-66.934570 + 125.000000) - 125.000000).toFixed(7);
  view.latitudeInput.setAttribute('placeholder', `e.g. ${getRandomLatitude()}`);
  view.longitudeInput.setAttribute('placeholder', `e.g. ${getRandomLongitude()}`);

  /**
   * Check browser support for GPS
   */
  if (navigator.geolocation) {
    destroyError(view.nearMeError);
  } else {
    showError(view.nearMeError, 'Browser does not support GPS location.');
    view.nearMeBtn.disabled = true;
  }

  /**
   * Get user's GPS location
   */
  function handleNearMeClick() {
    destroyError(view.nearMeError);
    view.nearMeBtn.disabled = true;
    view.modal.style.display = "flex";
    
    navigator.geolocation.getCurrentPosition(successCallback, errorCallback);

    function successCallback(position) {
      view.latitudeInput.value = position.coords.latitude;
      view.longitudeInput.value = position.coords.longitude;
      view.nearMeBtn.disabled = false;
      view.modal.style.display = "none";
    }
    function errorCallback(error) {
      let message = "Something very strange has happened.";
      switch (error.code) {
        case error.PERMISSION_DENIED:
          message = "Geolocation is disabled. Enable it in browser settings to get your coordinates.";
          break;
        case error.POSITION_UNAVAILABLE:
          message = "Sorry! Your location information is unavailable.";
          break;
        case error.TIMEOUT:
          message = "It took longer than expected to find your location.";
          break;
      }
      showError(view.nearMeError, message);
      view.nearMeBtn.disabled = false;
      view.modal.style.display = "none";
    }
  }
  
  /**
   * Handle search form submit
   * @param {Event} e 
   */
  async function handleSubmit(e) {
    e.preventDefault();
    destroyError(view.formError);
    view.submitBtn.disabled = true;
    view.modal.style.display = "flex";
    try {
      // Get region and location data from back-end
      const formData = new FormData(e.target);
      const params = new URLSearchParams(formData);
      const res = await fetch('/api/closest?' + params.toString());
      if (res.status !== 200) throw new Error(res.statusText);
      const { locations, region } = await res.json();

      // Update UI
      view.locationsHeader.innerHTML = cleanHTML(
        `${locations.length} locations within ${region.effective_radius} miles of ${region.full_name}`
      );
      view.locationsList.innerHTML = '';
      for (const location of locations) {
        const li = LocationListItem(location);
        view.locationsList.appendChild(li);
      }
    } catch(e) {
      showError(view.formError, 'Oops, something went wrong.');
    }
    view.submitBtn.disabled = false;
    view.modal.style.display = "none";
  }

  /**
   * Returns a sanitized list item element from location data
   * @param {Object}        location  Location object returned from API
   * @returns {HTMLElement}           Sanitized DOM node
   */
  function LocationListItem({ name, street, city, state, zip, location_machine_xrefs }) {
    const html = cleanHTML(
      `<li>
        <p><strong>${name}</strong></p>
        <p>${street}, ${city}, ${state} ${zip}</p>
        <p><small>Number of machines: ${location_machine_xrefs?.length || 0}</small></p>
      </li>`
    , true);
    return html.item(0);
  }
  
  /**
   * Unhide and update error
   * @param {HTMLElement} error 
   * @param {String} message 
   */
  function showError(error, message) {
    error.innerHTML = message;
    error.classList.remove("hidden");
  }
  /**
   * Hide and overwrite error
   * @param {HTMLElement} error 
   */
  function destroyError(error) {
    error.innerHTML = '';
    error.classList.add("hidden");
  }

})();
