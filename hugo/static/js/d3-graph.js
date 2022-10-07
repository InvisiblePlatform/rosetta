       const zoom = d3.zoom()
            .scaleExtent([-5, 40])
            .on("zoom", zoomed);

       var svg2 = d3.select("#key");
       var docwidth = 860;
       var svg = d3.select("#graph").attr("height", 620).attr("width", docwidth);
       var resetButton = document.getElementById('graphZoomReset').setAttribute("onclick","reset()");
       var zoomInButton = document.getElementById('graphZoomIn').setAttribute("onclick","zoomIn()");
       var zoomOutButton = document.getElementById('graphZoomOut').setAttribute("onclick","zoomOut()");
       var width = +svg.attr("width");
       var height = +svg.attr("height");
       var wikiframe = document.getElementById("wikipedia-frame");
       var wikiframeclose = document.getElementById("wikipedia-frame-close");
       var wikicardframe = document.getElementById("wikipedia-infocard-frame");
       var wikifirstframe = document.getElementById("wikipedia-first-frame");
       var graphBox = document.getElementById("graph-box");
       var graphContainer = document.getElementById("graph-container");
       var infoCardContainer = document.getElementById("wikicard-container");

       wikiframeclose.onclick = function(){
           wikiframe.style.display = "none";
           wikiframeclose.style.display = "none";
           document.getElementById("graphButtons").setAttribute("style", "")
       };

       function getMostCommon(array) {
            var count = {};
            array.forEach(function (a) {
                count[a] = (count[a] || 0) + 1;
            });
            return Object.keys(count).reduce(function (r, k, i) {
                if (!i || count[k] > count[r[0]]) {
                    return [k];
                }
                if (count[k] === count[r[0]]) {
                    r.push(k);
                }
                return r;
            }, []);
        }

       var simulation = d3.forceSimulation()
           .force("link", d3.forceLink().id(function(d) { return d.id; }).distance(50))
           .force("charge", d3.forceManyBody().strength(-400).distanceMax(400))
           .force("center", d3.forceCenter(width / 2, height / 2));

       svg.call(zoom);

        function zoomIn() {
        	d3.selectAll('svg g')
        		.transition()
        		.call(zoom.scaleBy, 2);
        }
        
        function zoomOut() {
        	d3.selectAll('svg g')
        		.transition()
        		.call(zoom.scaleBy, 0.5);
        }

       function reset() {
          svg.transition().duration(750).call(
            zoom.transform,
            d3.zoomIdentity,
            d3.zoomTransform(svg.node()).invert([width / 2, height / 2])
          );
        }

        function clicked(event, [x, y]) {
          svg.transition().duration(750).call(
            zoom.transform,
            d3.zoomIdentity.translate(width / 2, height / 2).scale(40).translate(-x, -y),
            d3.pointer(event)
          );
        }

        function zoomed({transform}) {
          d3.select('svg g').attr("transform", transform);
          d3.selectAll('svg g').attr("transform", transform);
        }

       graphLoc = document.getElementById('graphLoc').innerHTML;

       d3.json(graphLoc).then(function(graph) {
         const types = Array.from(new Set(graph.links.map(d => d.type)));
         const split = 1 / types.length;
         colors_array=[];
         d3.range(0, 1, split).forEach(function(d){
                colors_array.push(d3.interpolateSinebow(d));
         });
         var color = d3.scaleOrdinal(types, colors_array);

         svg.call(d3.zoom()
              .extent([[0, 0], [width, height]])
              .scaleExtent([-4, 8])
              .on("zoom", zoomed));

         svg.append("defs").selectAll("marker")
          .data(types).enter()
          .append("marker")
            .attr("id", d => `arrow-${d}`)
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 15)
            .attr("refY", -0.5)
            .attr("markerWidth", 6)
            .attr("markerHeight", 6)
            .attr("orient", "auto")
          .append("path")
            .attr("fill", d => color(d))
            .attr("d", "M0,-5L10,0L0,5");

         var key_y = d3.scaleOrdinal(types,d3.range(0, 15*types.length, 15));

         var key = svg2.append("div")
               .selectAll("g")
               .data(types).enter()
               .append("table");

         var key_rects = key.append("th")
               .attr("style", function(d){
                    return "background-color:" + color(d) + ";";
               });

        var key_labels = key.append("td")
           .attr("class", "key-text")
               .text(function(d){return d.replace("_"," ");})
            .attr("data-i18n", function(d){return "graph." + d.toLowerCase();});


         var urls=[];
         for (var i = document.links.length; i --> 0;)
              if(document.links[i].hostname.match(/wikidata/))
                 urls.push(document.links[i].href)

         var ids=[];
         for (var i = urls.length; i --> 0;)
             ids.push(urls[i].replace(/#.*/g,"").replace(/.*\//,""))
         
         var wikidataid = getMostCommon(ids)[0];
         var link = svg.append("g")
           .attr("stroke-width", 1.5)
		   .attr("fill", "none")
           .selectAll("path")
           .data(graph.links)
           .enter().append("path")
		   .attr("stroke", d => color(d.type))
           .attr("marker-end", d => `url(#arrow-${d.type})`);
         var node = svg.append("g")
             .attr("class", "nodes")
             .attr("fill", "currentColor")
             .attr("stroke-linecap", "round")
             .attr("stroke-linejoin", "round")
           .selectAll("g")
           .data(graph.nodes)
               .enter().append("g").attr("id", function(d){
                   if (d.id == wikidataid){
                        d.fx = width/2;
                        d.fy = height/2;
                   }
                   return d.id;
               });
              var wikichoice;
              switch (localStorage.preferred_language) {
                  case "en":
                    wikichoice = "https://en.wikipedia.org"
                  break;
                  case "fr":
                    wikichoice = "https://fr.wikipedia.org";
                  break;
                  case "ar":
                    wikichoice = "https://ar.wikipedia.org";
                  break;
                  case "es":
                    wikichoice = "https://es.wikipedia.org";
                  break;
                  case "eo":
                    wikichoice = "https://eo.wikipedia.org";
                  break;
                  case "zh":
                    wikichoice = "https://zh.wikipedia.org";
                  break;
                  case "de":
                    wikichoice = "https://de.wikipedia.org";
                  break;
                  case "hi":
                    wikichoice = "https://hi.wikipedia.org";
                  break;
                  default:
                    wikichoice = "https://en.wikipedia.org";
              }

         if (wikidataid){
              var main = d3.select("#"+wikidataid);
              var wikidataMainWiki;
              switch (localStorage.preferred_language) {
                  case "hi":
                    wikidataMainWiki = main._groups[0][0].__data__.hiwiki;
                  break;
                  case "fr":
                    wikidataMainWiki = main._groups[0][0].__data__.frwiki;
                  break;
                  case "ar":
                    wikidataMainWiki = main._groups[0][0].__data__.arwiki;
                  break;
                  case "zh":
                    wikidataMainWiki = main._groups[0][0].__data__.zhwiki;
                  break;
                  case "en":
                    wikidataMainWiki = main._groups[0][0].__data__.enwiki;
                  break;
                  case "es":
                    wikidataMainWiki = main._groups[0][0].__data__.eswiki;
                  break;
                  case "eo":
                    wikidataMainWiki = main._groups[0][0].__data__.eowiki;
                  break;
                  default:
                    wikidataMainWiki = main._groups[0][0].__data__.enwiki;
              }
             if (wikidataMainWiki.includes("wikipedia.org")){
                    wikidataMainWiki = wikidataMainWiki.split('/').slice(4).join("/");
             };
             if (wikidataMainWiki != "null"){
              let requestURL = wikichoice + "/api/rest_v1/page/mobile-sections/" + wikidataMainWiki + "?redirect=true"
              let skipsections = ["See_also", "References", "Further_reading", "External_links", "Sources", "undefined"];
              $.ajax({
                  url: requestURL
                }).done(function(data) {
                  var text = "";
                  text += data.lead.sections[0].text.replace(/href=\"/g,'href=\"' + wikichoice);
                  for (let x in data.remaining.sections) {
                      let section = data.remaining.sections[x];
                      if (!section.anchor) continue;
                      if (skipsections.includes(section.anchor)) {
                          continue;
                      }
                      let item = '<p id="' + 
                                section.anchor + 
                                '"><h2>' +
                                section.line + 
                                '</h2>'
                      if (section.text != '\n'){
                        item += '<div>' +
                                section.text.replace(/href=\"/g,'href=\"'+ wikichoice) +
                                '</div></p>';
                      };
                      text+=item;
                  }
                  wikifirstframe.innerHTML = text;
                  for (var i = wikifirstframe.children.length; i --> 0;)
                    if (wikifirstframe.children[i].classList.contains("infobox")){
                        // console.log(wikifirstframe.children[i])
                        wikicardframe.innerHTML = "";
                        wikicardframe.appendChild(wikifirstframe.children[i]);
                    }
                  var profiletext = "<h2 class='sectionTitle' id='profile-card'>Company Info</h2><div class='hideInSmall'>";
                    profiletext += wikicardframe.innerHTML + "</div><img src='/icon/profile.svg' class='iconclass' /><table><td><a href='" + wikichoice + "/wiki/" + wikidataMainWiki + "' class='source blanksource'>WIKIPEDIA</a></td></table><button type='button' onclick='loadProfileCard()' class='fullView'>FULL-VIEW</button>";
                  wikicardframe.innerHTML = profiletext;
                  var companyinfotext = "<h2 class='sectionTitle' id='company-info'>Wikipedia</h2><div class='hideInSmall'>";
                  companyinfotext += wikifirstframe.innerHTML + "</div><img src='/icon/info.svg' class='iconclass' /><table><td><a href='" + wikichoice + "/wiki/" + wikidataMainWiki + "' class='source'>WIKIPEDIA</a></td></table><button type='button' onclick='loadWikipediaPage()' class='fullView'>FULL-VIEW</button>";
                  wikifirstframe.innerHTML = companyinfotext;
                }).fail(function() {
                    console.log("oh no")
              });
              contentsLength = document.getElementsByClassName("content").length;
              lastContent = document.getElementsByClassName("content")[contentsLength - 1];
              
              lastContent.appendChild(wikifirstframe);
              lastContent.appendChild(wikicardframe);
              graphBox.innerHTML = "<h2 class='sectionTitle' id='graph-box-interior'>Network Graph</h2><img src='/icon/network.svg' class='iconclass'/><table><td><a href='https://wikidata.org/wiki/" + wikidataid + "' class='source blanksource'>WIKIDATA</a></td></table><button type='button' onclick='loadNetworkGraph()' class='fullView'>FULL-VIEW</button>";
              lastContent.appendChild(graphBox);
              if (wikifirstframe.style.display == "none"){
                   wikifirstframe.style.display = "";
              }
              if (wikicardframe.style.display == "none"){
                   wikicardframe.style.display = "";
              }
              if (graphBox.style.display == "none"){
                   graphBox.style.display = "";
              }
             };

         };


           var circles = node.append("a").attr("href", function(d){
               var wikidataWiki = "";
              switch (localStorage.preferred_language) {
                  case "hi": 
                      wikidataWiki = d.hiwiki;
                  break;
                  case "zh": 
                      wikidataWiki = d.zhwiki;
                  break;
                  case "en": 
                      wikidataWiki = d.enwiki;
                  break;
                  case "de": 
                      wikidataWiki = d.dewiki;
                  break;
                  case "es": 
                      wikidataWiki = d.eswiki;
                  break;
                  case "ar": 
                      wikidataWiki = d.arwiki;
                  break;
                  case "fr": 
                      wikidataWiki = d.frwiki;
                  break;
                  case "eo": 
                      wikidataWiki = d.eowiki;
                  break;
                  default: wikidataWiki = d.enwiki;
              };
             if (wikidataWiki.includes("wikipedia.org")){
                    wikidataWiki = wikidataWiki.split('/').slice(4).join("/");
             };
               if (wikidataWiki != "null"){
                    return wikichoice + "/wiki/" + wikidataWiki;
               } else {
                    return "https://wikidata.org/wiki/" + d.id;
               }
               return "#"
           }).attr("target", "_blank")
               .on('click', function(d,i){
                   document.getElementById("graphButtons").setAttribute("style", "width: 404px;")
                   var wikidataWiki;
                  switch (localStorage.preferred_language) {
                      case "hi": 
                          wikidataWiki = i.hiwiki;
                      break;
                      case "zh": 
                          wikidataWiki = i.zhwiki;
                      break;
                      case "de": 
                          wikidataWiki = i.dewiki;
                      break;
                      case "en": 
                          wikidataWiki = i.enwiki;
                      break;
                      case "es": 
                          wikidataWiki = i.eswiki;
                      break;
                      case "fr": 
                          wikidataWiki = i.frwiki;
                      break;
                      case "ar": 
                          wikidataWiki = i.arwiki;
                      break;
                      case "eo": 
                          wikidataWiki = i.eowiki;
                      break;
                      default: 
                          wikidataWiki = i.enwiki;
                  };
                 if (wikidataWiki.includes("wikipedia.org")){
                        wikidataWiki = wikidataWiki.split('/').slice(4).join("/");
                };
                   if (wikidataWiki == "null"){
                        return
                   }
                   d.preventDefault();
                   // console.log("clicking on", this, wikidataWiki);
                   let requestURL = wikichoice + "/api/rest_v1/page/mobile-sections/" + wikidataWiki + "?redirect=true"
                   if (wikiframe.style.display == "none"){
                        wikiframe.style.display = "block";
                        wikiframeclose.style.display = "block";
                   }
                   $.ajax({
                       url: requestURL
                     }).done(function(data) {
                       var text = data.lead.sections[0].text.replace(/href=\"/g,'href=\"' + wikichoice);
                       for (let x in data.remaining.sections) {
                           let section = data.remaining.sections[x];
                           let item = '<p id="' + 
                                     section.anchor + 
                                     '"><h2>' +
                                     section.line + 
                                     '</h2><div>' +
                                     section.text.replace(/href=\"/g,'href=\"'+ wikichoice) +
                                     '</div></p>';
                           text+=item;

                       }
                       wikiframe.innerHTML = text;
                     }).fail(function() {
                         console.log("oh no")
                   });

               })
               .append("circle")
               .attr("r", function(d){ 
                    if (d.id == wikidataid){
                        return 20;
                    }
                   if (d.groups.includes("Q5")){
                        return 6;
                   } else if (d.groups.includes("Q219577")){
                        return 15;
                   } else {
                        return 10;
                   }
               }).attr("fill", function(d){
                    if (d.id == wikidataid){
                        return "var(--c-linky-text)";
                    }
                   if (d.groups.includes("Q5")){
                        return "red";
                   } else {
                        return "var(--c-main)";
                   }
                   return "unset";

               })
           .attr("class", function(d){ return d.groups.toString().replace(/,/g,' '); });

         var lables = node.append("text")
             .attr("class", "label-text")
             .attr("text-anchor", "middle")
               .attr("z-index", function(d){
                   if (d.groups.includes("Q5")){
                        return "100";
                   } else {
                        return "101";
                   }})
               .attr("font-size", function(d){
                   if (d.groups.includes("Q5")){
                        return "6px";
                   } else {
                        return "10px";
                   }})
             .text(function(d) {
                     return d.label;
                   });


         // Create a drag handler and append it to the node object instead
         var drag_handler = d3.drag()
             .on("start", dragstarted)
             .on("drag", dragged);
             // .on("end", dragended);

         drag_handler(node);
         
         simulation
             .nodes(graph.nodes)
             .on("tick", ticked);

         simulation.force("link")
             .links(graph.links);

         function ticked() {
             link.attr("d", linkArc)
             node.attr("transform", function(d) {
                return "translate(" + d.x + "," + d.y + ")";
            })
         }
       });

       function dragstarted(event,d) {
         if (!event.active) simulation.alphaTarget(0.3).restart();
         d.fx = d.x;
         d.fy = d.y;
       }

       function dragged(event,d) {
         d.fx = event.x;
         d.fy = event.y;
         d.fixed = true;
       }

       // function dragended(event,d) {
       //   if (!event.active) simulation.alphaTarget(0);
       //   d.fx = null;
       //   d.fy = null;
       // }
	   function linkArc(d) {
	     //const r = Math.hypot(d.target.x - d.source.x, d.target.y - d.source.y);
	     const r = 0;
	     return `
		       M${d.source.x},${d.source.y}
		       A${r},${r} 0 0,1 ${d.target.x},${d.target.y}
		     `;
	   }
