setTimeout(function(){ var b=document.getElementById("boot"); if(b){ b.classList.add("sai"); setTimeout(function(){ b.remove(); },400); } },6000);
if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () { navigator.serviceWorker.register("./sw.js", { scope: "./" }).catch(function () {}); });
}
