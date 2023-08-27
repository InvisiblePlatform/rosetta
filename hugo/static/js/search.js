const toUrl = (str) => {
    return str.replaceAll('.', '');
}

Url = {
    get get(){
        var vars= {};
        if(window.location.search.length!==0)
            window.location.search.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value){
                key=decodeURIComponent(key);
                if(typeof vars[key]==="undefined") {vars[key]= decodeURIComponent(value);}
                else {vars[key]= [].concat(vars[key], decodeURIComponent(value));}
            });
        return vars;
    }
};

keyconversion = {
    'bcorp_rating': "b",
    'connections': "c",
    'glassdoor_rating': "l",
    'goodonyou': "g",
    'isin': "i",
    'mbfc': "m",
    'osid': "o",
    'polalignment': "a",
    'polideology': "p",
    'ticker': "y",
    'tosdr': "P",
    'wikidata_id': "w"
}

const filtered = true;



fetch('/index.json')
      .then((response) => response.json())
      .then((data) => {

        function reloadFilters(){
            const searchInput = document.getElementById('search-input');
            var newString = [];
            for (item in keyconversion){
              checkbox = document.getElementById(`filter-input-${item}`);
              if (checkbox.checked){
                  newString.push({"k": keyconversion[item]});
              }
            };
            console.log(newString)
            // searchInput.setAttribute("value", newString)
            const query = {$and: newString};
            const result = fuse.search(query);
            const limitedResults = result;
            const resultsNumberCont = document.getElementById('search-results-count');
            resultsNumberCont.innerHTML = `<p>${result.length}</p>`;
        
            // Display search results
            if (result.length > 0) {
              const resultList = limitedResults.map((item) => `<p><a class="button webbutton" href="/db/${toUrl(item.item.d)}">${item.item.d}</a></p>`);
              searchResults.innerHTML = resultList.join('');
            } else {
              searchResults.innerHTML = '<p>No results found</p>';
            }
        }
        
        function performSearch(){
            // Step 4: Perform the search
            const searchInput = document.getElementById('search-input');
            const searchResults = document.getElementById('search-results');
            const query = searchInput.value;
            const result = fuse.search(query);
            const limitedResults = result.slice(0, maxResults);
        
            // Display search results
            if (result.length > 0) {
              const resultList = limitedResults.map((item) => `<p><a class="button webbutton" href="/db/${toUrl(item.item.d)}">${item.item.d}</a></p>`);
              searchResults.innerHTML = resultList.join('');
            } else {
              searchResults.innerHTML = '<p>No results found</p>';
            }
        }
        // Step 2: Set up Fuse.js
        const searchResults = document.getElementById('search-results');
        const searchInput = document.getElementById('search-input');
        const filterArray = document.getElementById('input-array');
        keys_for_options = (filtered) ? ['k'] : ['d'];
        const options = {
          keys: keys_for_options, // Specify the keys to search against in the JSON objects
        };
        const fuse = new Fuse(Object.values(data), options);

        // Step 3: Handle the search input
        const maxResults = 40;
        if (Url.get["q"] != null){
            searchInput.setAttribute("value", Url.get["q"]);
        }
        var checkFilters = [];
        for (item in keyconversion){
            checkFilters += `<div class="filter"><input class="filtercheck" type="checkbox" id="filter-input-${item}" /><label class="button fbutton" for="filter-input-${item}">${item}</label></div>`;
        }
        filterArray.innerHTML = checkFilters;
        for (item in keyconversion){
            console.log(item);
            document.getElementById(`filter-input-${item}`).addEventListener("input", (event) => {
                targetLabel = event.target.id.replace("filter-input-", "");
                targetValue = event.target.checked;
                console.log([targetLabel, targetValue]);
                reloadFilters();
        });
        }

        if (filtered) {
            // searchInput.setAttribute("value", "")
        }

        if (searchInput.value != null ){
          const query = searchInput.value;
          const result = fuse.search(query);
          const limitedResults = (filtered) ? result : result.slice(0, maxResults);

          // Display search results
          if (result.length > 0) {
            const resultList = limitedResults.map((item) => `<p><a class="button webbutton" href="/db/${toUrl(item.item.d)}">${item.item.d}</a></p>`);
            searchResults.innerHTML = resultList.join('');
          } else {
            searchResults.innerHTML = '<p>No results found</p>';
          }

        }

        searchInput.addEventListener('input', performSearch);

      })
      .catch((error) => console.error('Error fetching data:', error));
