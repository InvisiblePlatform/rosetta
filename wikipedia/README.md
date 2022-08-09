SELECT DISTINCT ?homepage WHERE     {        
?site foaf:isPrimaryTopicOf ?filmlink ;
                 foaf:homepage ?homepage .   
minus {filter contains(str(?homepage), "%")} 
minus {filter contains(str(?homepage), "archive")}   
filter (!regex(str(?homepage), "http[s]*://[^/]*/[^/]*","i")).
 } 
 # 211282
 
 
 SELECT DISTINCT ?homepage WHERE     {        
?site foaf:isPrimaryTopicOf ?filmlink ;
                 foaf:homepage ?homepage .   
minus {filter contains(str(?homepage), "%")} 
minus {filter contains(str(?homepage), "archive")}   
filter (regex(str(?homepage), "http[s]*://[^/]*/$","i")).
 } 
 # 284569
 
 SELECT DISTINCT count(?homepage) WHERE     {        
?site foaf:isPrimaryTopicOf ?filmlink ;
                 foaf:homepage ?homepage .   
minus {filter contains(str(?homepage), "%")} 
minus {filter contains(str(?homepage), "archive")}   
filter (!regex(str(?homepage), "http[s]*://[^/]*/[^/]*","i")).
filter (regex(str(?homepage), "http[s]*://www.[b-j]","i")).
 }  
 
 SELECT DISTINCT count(?homepage) WHERE     {        
?site foaf:isPrimaryTopicOf ?filmlink ;
                 foaf:homepage ?homepage .   
minus {filter contains(str(?homepage), "%")} 
minus {filter contains(str(?homepage), "archive")}   
filter (regex(str(?homepage), "http[s]*://[^/]*/$","i")).
filter (regex(str(?homepage), "http[s]*://[a]","i")).
 }  
