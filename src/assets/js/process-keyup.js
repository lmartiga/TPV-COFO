
var appFrame = document.getElementById("appFrame");
var barcodeTimer;
var _time;
var checkEANFormat = true;
var timeBetweenKeyEvents = 50;
var finishReaderBarcodes = false;
var codigo = '';
var serach = document.getElementById("idsearch");
window.onmessage = function(event){
  if (event.data != undefined) {
    checkEANFormat = (event.data[0] === 'true');
    timeBetweenKeyEvents = event.data[1];
  }
};

if (window.addEventListener) {

  var buffer = '';
  window.addEventListener('keyup', function(event) {
    processkeypress(event);
  });

  appFrame.onload = function() {
    appFrame.contentWindow.addEventListener('keyup', function(event) {
      processkeypress(event);
    });
  }
} else if (window.attachEvent) {
  var buffer = '';
  window.attachEvent('keyup', function(event) {
    processkeypress(event);
  });

  appFrame.onload = function() {
    appFrame.contentWindow.attachEvent('keyup', function(event) {
      processkeypress(event);
    });
  }
}

function logTimeInfo(event) {
  var auxTime = _time;
  var timestamp = new Date().getTime();
  if(auxTime) {
    this._logHelper.logError(timestamp - auxTime);
    this._logHelper.logError(event.key);
  }
  _time = timestamp;
}

function hasInputWithVirtualKeyboard(element) {
  return element == undefined ? false : element.hasAttribute('tpvkeyboard');
}

function intercepterFinishReadBarcodes(element) {
  if (hasInputWithVirtualKeyboard(element)) {
    finishReaderBarcodes = true;
    this._logHelper.trace(element.value);
  }
}

function cleanInputIfPressEnter(element) {
  if (hasInputWithVirtualKeyboard(element)) {
    finishReaderBarcodes = false;
    element.value = '';
  }
}

function processkeypress(event) {
  if (finishReaderBarcodes) {
    cleanInputIfPressEnter(event.target);
  }
  //TextBarcode(event.key);
  if (event.key == 'Enter') {  
    intercepterFinishReadBarcodes(event.target);
    if (checkEANFormat) {
      if (isBarcode(buffer)) {
        appFrame.contentWindow.postMessage(buffer + '/Barcode', '*');
        buffer = '';
        event.preventDefault();
      } else {
        buffer = '';
      }
    } else {
      if (buffer != '' && buffer != undefined) {
        appFrame.contentWindow.postMessage(buffer + '/Barcode', '*');
        buffer = '';
        event.preventDefault();
      } else {
        buffer = '';
      } 
    }

  } else {
    buffer += event.key;
  }
  barcodeTimeout();
}

function barcodeTimeout() {
  barcodeTimer = window.setTimeout( function() {
    buffer = '';
  }, timeBetweenKeyEvents);
}

function isBarcode() {
  if (buffer.length != 8 && buffer.length != 13 &&
    buffer.length != 14 && buffer.length != 18) {
    return true;
  }

  var lastDigit = Number(buffer.charAt(buffer.length-1));
  if (isNaN(lastDigit)) { return false; } // not a valid upc/ean

  let checkSum = 0;
  let total = 0;
  const arr = buffer.substring(0, buffer.length - 1).split('').reverse();

  for (let i = 0; i < arr.length; i++) {
    if (isNaN(Number(arr[i]))) { return false; } // can't be a valid upc/ean we're checking for

    if (i % 2 == 0) { total += Number(arr[i]) * 3; }
    else { total += Number(arr[i]); }
  }
  checkSum = (10 - (total % 10)) % 10;

  // true if they are equal
  return checkSum == lastDigit;
}
function TextBarcode(barcode){
  console.warn('lectura: ' + barcode);
  if(barcode != 'Enter'){
    codigo = codigo + barcode;    
  }else{
    if(codigo.length > 6){
      console.warn('Codigo: ' + codigo);
     // window.postMessage(codigo, '*');      
    }
    codigo ='';    
  }
}
