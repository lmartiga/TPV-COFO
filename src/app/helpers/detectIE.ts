function detectIE() {
    const ua = window.navigator.userAgent;
    const msie = ua.indexOf('MSIE ');

    if (msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./)) {  // If Internet Explorer, return version number
        return true;
    }
    else {  // If another browser, return 0 
        return false;
    }
}

export {detectIE};
