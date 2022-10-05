var translator = new Translator({
    persist: true
});
translator.fetch(["ar","fr","eo", "en", "es", "de", "zh", "hi"]).then(() => {
    translator.translatePageTo();
    registerLanguageToggle();
});

function registerLanguageToggle() {
    var select = document.getElementById("langselect");
    for (var i = 0, len = select.childElementCount; i<len; ++i ){
        if (select.children[i].value == localStorage.preferred_language) {
            select.selectedIndex = i;
        };
    }

    // console.log(select);
    select.addEventListener("change", evt => {
      var language = evt.target.value;
      if (language == "-" ){ return; };
      translator.translatePageTo(language);
    });
}
