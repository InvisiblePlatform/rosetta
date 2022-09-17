var translator = new Translator({
    debug: true,
    persist: true
});
translator.fetch(["eo", "en", "es", "de", "zh", "hi"]).then(() => {
    translator.translatePageTo();
    registerLanguageToggle();
});

function registerLanguageToggle() {
    var select = document.getElementById("langselect");
    console.log(select);
    select.addEventListener("change", evt => {
      var language = evt.target.value;
      if (language == "-" ){ return; };
      translator.translatePageTo(language);
    });
}
