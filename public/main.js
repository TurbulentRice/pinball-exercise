(() => {

  /**
   * DOM refs and listeners
   */
  const view = {
    form:             document.querySelector('form'),
    submitBtn:        document.querySelector('button[type="submit"]'),
    formError:        document.getElementById('formError'),
    nearMeError:      document.getElementById('nearMeError'),
    nearMeBtn:        document.getElementById('nearMeBtn'),
    latitudeInput:    document.getElementById('latitude'),
    longitudeInput:   document.getElementById('longitude'),
    locationsHeader:  document.getElementById('locationsHeader'),
    locationsList:    document.getElementById('locationsList'),
    modal:            document.getElementById('modal'),
  }
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
      view.latitudeInput.setAttribute('value', position.coords.latitude);
      view.longitudeInput.setAttribute('value', position.coords.longitude);
      view.nearMeBtn.disabled = false;
      view.modal.style.display = "none";
    }
    function errorCallback(error) {
      showError(view.nearMeError, error.message);
      view.nearMeBtn.disabled = true;
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
      const formData = new FormData(e.target);
      const params = new URLSearchParams(formData);
      const res = await fetch('/api/closest?' + params.toString());
      if (res.status !== 200) throw new Error(res.statusText);
      const { locations, region } = await res.json();
      view.locationsHeader.innerHTML = `${locations.length} locations within ${region.effective_radius} miles of ${region.full_name}`;
      view.locationsList.innerHTML = '';
      for (const location of locations) {
        const li = document.createElement('li');
        const name = cleanHTML(`<p><strong>${location.name}</strong></p>`);
        const address = cleanHTML(`<p>${location.street}, ${location.city}, ${location.state} ${location.zip}</p>`);
        const machineCount = cleanHTML(`<p><small>Number of machines: ${location.location_machine_xrefs?.length || 0}<small></p>`);
        li.innerHTML += name;
        li.innerHTML += address;
        li.innerHTML += machineCount;
        view.locationsList.appendChild(li);
      }
    } catch(e) {
      showError(view.formError, 'Oops, something went wrong.');
    }
    view.submitBtn.disabled = false;
    view.modal.style.display = "none";
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

 /**
  * Sanitize an HTML string
  * (c) 2021 Chris Ferdinandi, MIT License, https://gomakethings.com
  * @param  {String}          str   The HTML string to sanitize
  * @param  {Boolean}         nodes If true, returns HTML nodes instead of a string
  * @return {String|NodeList}       The sanitized string or nodes
  */
  function cleanHTML (str, nodes) {

    /**
     * Convert the string to an HTML document
     * @return {Node} An HTML document
     */
    function stringToHTML () {
      let parser = new DOMParser();
      let doc = parser.parseFromString(str, 'text/html');
      return doc.body || document.createElement('body');
    }

    // Convert the string to HTML
    let html = stringToHTML();

    // Sanitize it
    removeScripts(html);

    clean(html)

    return html.innerHTML;

  }

  /**
   * Remove dangerous stuff from the HTML document's nodes
   * @param  {Node} html The HTML document
   */
  function clean (html) {
    let nodes = html.children;
    for (let node of nodes) {
      removeAttributes(node);
      clean(node);
    }
  }

  /**
   * Remove <script> elements
   * @param  {Node} html The HTML
   */
  function removeScripts (html) {
    let scripts = html.querySelectorAll('script');
    for (let script of scripts) {
      script.remove();
    }
  }

  /**
   * Remove potentially dangerous attributes from an element
   * @param  {Node} elem The element
   */
  function removeAttributes (elem) {
    let atts = elem.attributes;
    for (let {name, value} of atts) {
      if (isPossiblyDangerous(name, value)) console.log('NAME:', name)
      if (!isPossiblyDangerous(name, value)) continue;
      elem.removeAttribute(name);
    }
  }

  /**
   * Check if the attribute is potentially dangerous
   * @param  {String}  name  The attribute name
   * @param  {String}  value The attribute value
   * @return {Boolean}       If true, the attribute is potentially dangerous
   */
  function isPossiblyDangerous (name, value) {
    let val = value.replace(/\s+/g, '').toLowerCase();
    if (['src', 'href', 'xlink:href'].includes(name)) {
      if (val.includes('javascript:') || val.includes('data:text/html')) return true;
    }
    if (name.startsWith('on')) return true;
  }

})();
