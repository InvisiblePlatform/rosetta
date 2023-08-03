const toUrl = (str) => {
    return str.replace('.', '');
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


fetch('/index.json')
      .then((response) => response.json())
      .then((data) => {
        // Step 2: Set up Fuse.js
        const options = {
          keys: ['d'], // Specify the keys to search against in the JSON objects
        };
        const fuse = new Fuse(Object.values(data), options);

        // Step 3: Handle the search input
        const searchResults = document.getElementById('search-results');
        const searchInput = document.getElementById('search-input');
        const maxResults = 40;
        if (Url.get["q"] != null){
            searchInput.setAttribute("value", Url.get["q"]);
        }
        if (searchInput.value != null ){
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

        searchInput.addEventListener('input', () => {
          // Step 4: Perform the search
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
        });
      })
      .catch((error) => console.error('Error fetching data:', error));
