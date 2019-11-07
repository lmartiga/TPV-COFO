function bindEvent(element, eventName, eventHandler) {
    if (element.addEventListener) {
        element.addEventListener(eventName, eventHandler, false);
    } else if (element.attachEvent) {
        element.attachEvent('on' + eventName, eventHandler);
    }
}

// bindEvent(window, 'message', function(e) {
//     // Filtramos capturas no deseadas (esperamos que e.data sea un string)
//     if (!e || !e.data || e.data === '' || e.data.type != undefined) {
//         return;
//     }
//     window.addProductByBarcode(e.data);
// });