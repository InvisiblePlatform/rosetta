const toUrl = (str) => {
    return str.replace('.', '');
}

fetch('/index.json')
      .then((response) => response.json())
      .then((data) => {
        // Step 2: Set up Fuse.js
        const options = {
          keys: ['d'], // Specify the keys to search against in the JSON objects
        };
        const fuse = new Fuse(Object.values(data), options);

        // Step 3: Handle the search input
        const searchInput = document.getElementById('search-input');
        const searchResults = document.getElementById('search-results');
        const maxResults = 40;

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
