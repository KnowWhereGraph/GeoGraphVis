/********************************************************************************************
* This file is Copyright (C) 2023 CICI Lab - Arizona State University, all rights reserved.
* 
* Authors:
*   Sizhe Wang, Arizona State Unvisity
*   Wenwen Li, Arizona State Unvisity
*   Xiao Chen, Arizona State Unvisity
*   Zhining Gu, Arizona State Unvisity
*   Yuanyuan Tian, Arizona State Unvisity
*   
* If you wish to refer to the methods or results in your research, please cite the 
* following paper:  
*   Li, W.; Wang, S.; Chen, X.; Tian, Y.; Gu, Z.; Lopez-Carr, A.; Schroeder, A.; 
*   Currier, K.; Schildhauer, M.; Zhu, R. (2023). Geographvis: a knowledge graph and 
*   geovisualization empowered cyberinfrastructure to support disaster response and 
*   humanitarian aid. ISPRS International Journal of Geo-Information, 12(3), 112.
*
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*     http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.   
********************************************************************************************/


import Constant from "./constant";
import Utils from "./utils";

// const host0= 'http://cici2.lab.asu.edu:8000/repositories/storm_track_2021?query=';
const host1= 'https://staging.knowwheregraph.org/graphdb/repositories/KWG?query=';
const host2= 'https://stko-kwg.geog.ucsb.edu/graphdb/repositories/KWG?query=';
// const host2= 'https://staging.knowwheregraph.org/graphdb/repositories/KWG?query=';
// const host3= 'https://stko-kwg.geog.ucsb.edu/graphdb/repositories/DRDemo?query=';
// const token= 'GDB eyJ1c2VybmFtZSI6InN0dWRlbnRfcG9zdGRvYyIsImF1dGhlbnRpY2F0ZWRBdCI6MTY4MTE0ODA0MzE3NH0=.WrATRJ5l3KUWte9J0IJ9eLerC/xQUWD7dYd1wVe/b0g=';
const qStormList = `
PREFIX sosa: <http://www.w3.org/ns/sosa/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX time: <http://www.w3.org/2006/time#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX kwg-ont: <http://stko-kwg.geog.ucsb.edu/lod/ontology/>
select ?name ?time ?windSpeed ?pressure ?category where { 
    ?storm a kwg-ont:StormTrack ;
        rdfs:label ?name ; 
    	^sosa:hasFeatureOfInterest/sosa:hasMember ?ob1, ?ob2, ?ob3.
    ?ob1 sosa:observedProperty/rdf:type kwg-ont:StormTrackObservableProperty.maxWindSpeed;
    	sosa:hasSimpleResult ?windSpeed.
    ?ob2 sosa:observedProperty/rdf:type kwg-ont:StormTrackObservableProperty.minPressure;
        sosa:hasSimpleResult ?pressure.
    ?ob3 sosa:observedProperty/rdf:type kwg-ont:StormTrackObservableProperty.category;
        sosa:hasSimpleResult ?category.
    {
        select ?storm (min(?start) as ?st) where {
            ?storm kwg-ont:hasStormTracklet/^sosa:hasFeatureOfInterest/sosa:phenomenonTime ?start.
        } group by ?storm
    }
    ?st time:inXSDDate ?time .
    filter regex(?name, "^(?!UNNAMED)") 
}
order by desc (?st)`;
const qStormTrack = `
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX sosa: <http://www.w3.org/ns/sosa/>
PREFIX geo: <http://www.opengis.net/ont/geosparql#>
PREFIX time: <http://www.w3.org/2006/time#>
PREFIX kwg-ont: <http://stko-kwg.geog.ucsb.edu/lod/ontology/>
select ?wkt ?time ?windSpeed ?pressure ?category where { 
	?storm a kwg-ont:StormTrack;
        rdfs:label '${Constant.RPL_PH}';
		kwg-ont:hasStormTracklet ?track.
   	?track geo:hasGeometry/geo:asWKT ?wkt;
        ^sosa:hasFeatureOfInterest ?obc.
    ?obc sosa:phenomenonTime/time:inXSDDateTime ?time;
        sosa:hasMember ?ob1, ?ob2, ?ob3.
    ?ob1 sosa:observedProperty/rdf:type kwg-ont:StormTrackletObservableProperty.windSpeed;
    	sosa:hasSimpleResult ?windSpeed.
    ?ob2 sosa:observedProperty/rdf:type kwg-ont:StormTrackletObservableProperty.minPressure;
        sosa:hasSimpleResult ?pressure.
    ?ob3 sosa:observedProperty/rdf:type kwg-ont:StormTrackletObservableProperty.category;
        sosa:hasSimpleResult ?category.
} order by ?time`;
const qStormSTCounties = `
PREFIX geo: <http://www.opengis.net/ont/geosparql#>
PREFIX kwg-ont: <http://stko-kwg.geog.ucsb.edu/lod/ontology/>
PREFIX geof: <http://www.opengis.net/def/function/geosparql/>
select (group_concat(?fips;separator="|") as ?reg_str) where { 
	?loc a kwg-ont:AdministrativeRegion_3 ;
    	 kwg-ont:hasFIPS ?fips ;
         geo:hasGeometry/geo:asWKT ?wkt .
    filter (geof:sfIntersects(?wkt, '''${Constant.RPL_PH}'''^^geo:wktLiteral))
}`
const qStormSTImpacts = `
PREFIX kwg-ont: <http://stko-kwg.geog.ucsb.edu/lod/ontology/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX time: <http://www.w3.org/2006/time#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX geo: <http://www.opengis.net/ont/geosparql#>
select distinct ?event 
    ?event_label ?event_type 
    ?event_time_begin ?event_time_end
    ?event_loc_label ?event_loc_fips
where { 
	?event a kwg-ont:NOAAHazard ;
        rdfs:label ?event_label ;
    	rdf:type ?event_type .
    ?event_type rdfs:subClassOf kwg-ont:NOAAHazard.
#    optional {?event kwg-ont:hasNarrative ?event_narrative.}
    
    ?event kwg-ont:hasTemporalScope/time:hasBeginning/time:inXSDDateTime ?event_time_begin;
    	   kwg-ont:hasTemporalScope/time:hasEnd/time:inXSDDateTime ?event_time_end.
    
    ?event kwg-ont:sfWithin/(kwg-ont:sfEqual|kwg-ont:sfWithin|kwg-ont:sfOverlaps)? ?event_loc.
    ?event_loc a kwg-ont:AdministrativeRegion_3;
    		   rdfs:label ?event_loc_label;
    		   kwg-ont:hasFIPS ?event_loc_fips.
    filter (${Constant.RPL_PH})
}`
const qCountyGeo = `
PREFIX kwg-ont: <http://stko-kwg.geog.ucsb.edu/lod/ontology/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX geo: <http://www.opengis.net/ont/geosparql#>
select ?event_loc_fips ?event_loc_label ?event_loc_geometrywkt where { 
	 ?_county a kwg-ont:AdministrativeRegion_3;
        rdfs:label ?event_loc_label ;
    	kwg-ont:hasFIPS ?event_loc_fips ;
    	geo:hasGeometry/geo:asWKT ?event_loc_geometrywkt. 
    
    filter regex(?event_loc_fips, '^(${Constant.RPL_PH})')
}`;
const qStormImpactStates = `
PREFIX kwg-ont: <http://stko-kwg.geog.ucsb.edu/lod/ontology/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX geo: <http://www.opengis.net/ont/geosparql#>
PREFIX geof: <http://www.opengis.net/def/function/geosparql/>
select (group_concat(?state;separator=",") as ?states) where { 
	?loc a kwg-ont:AdministrativeRegion_2 ;
    	 rdfs:label ?state ;
         geo:hasGeometry/geo:asWKT ?wkt .
    filter (geof:sfIntersects(?wkt, '''LineString(${Constant.RPL_PH})'''^^geo:wktLiteral))
}`;
const qExpert= `
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX kwg-ont: <http://stko-kwg.geog.ucsb.edu/lod/ontology/>
PREFIX iospress: <http://ld.iospress.nl/rdf/ontology/>
PREFIX geo: <http://www.opengis.net/ont/geosparql#>
SELECT distinct ?expert ?name ?fullname ?affil ?state ?wkt ?url ?topics WHERE {
    ?expert a iospress:Contributor ;
        rdfs:label ?name ;
        kwg-ont:hasExpertise/rdfs:label ?topic ;
        kwg-ont:hasUri ?url ;
        iospress:contributorAffiliation ?org .
    optional { ?expert kwg-ont:hasDBLPID ?fullname }
    
    ?_state a kwg-ont:AdministrativeRegion_2;
    	rdfs:label ?state .
    ?org kwg-ont:sfWithin/geo:sfWithin ?_state.
    ?org geo:hasGeometry/geo:asWKT ?wkt. 
    ?org iospress:organizationName ?affil .
    
    {
        select ?expert (group_concat(?tlabel;separator=",") as ?topics) where {
            ?expert a iospress:Contributor ;
                kwg-ont:hasExpertise/rdfs:label ?tlabel ;
        } group by ?expert
    }

    filter (${Constant.RPL_PH})
}`

class SparqlQuery {
    static stormList(onResult) {
        fetch(host1 + encodeURIComponent(qStormList), {
            headers: {'Accept': 'application/json'}
        })
        .then($ => $.json())
        .then(data => {
            const res = data.results.bindings;
            for (const i of res) {
                i.title = Utils.renderStormName(i.name.value);
            }      
            onResult(res);
        });
    }

    static stormTrack(name, onResult) {
        fetch(host1 + encodeURIComponent(Utils.buildStringFromTempl(qStormTrack, name)), {
            headers: {'Accept': 'application/json'}
        })
        .then($ => $.json())
        .then(data => {
            const res = data.results.bindings;
            for (const i of res) {
                let coord = i.wkt.value.replace(/.+ ?\((.+)\)/g, '$1');
                i.coordinates = coord.split(' ').map(x => parseFloat(x));
                i.utcTime = i.time.value;
            }      
            onResult(res);
        });
    }

    static stormImpactSpatial(track, onResult) {
        const polys = track.map(i => {
            const radius = Utils.speed2cat(i.windSpeed.value) + 1;
            const [x, y] = i.coordinates;
            return new Utils.PloyCirc(x, y, radius).wkt;
        })
        Promise.all(polys.map(x => 
            fetch(host2 + encodeURIComponent(Utils.buildStringFromTempl(qStormSTCounties, x)), {
                headers: {'Accept': 'application/json'}
            }).then($ => $.json())
        )).then(d => {
            const st = track.map((x, i) => [x.utcTime, d[i].results.bindings[0].reg_str.value])
                            .filter(x => x[1].length > 0);
            onResult(st);
        });
    }

    static countyGeometry(fips_list, onResult) {
        const reg_str = fips_list.join('|')
        fetch(host2 + encodeURIComponent(Utils.buildStringFromTempl(qCountyGeo, reg_str)), {
            headers: {'Accept': 'application/json'}
        })
        .then($ => $.json())
        .then(data => {
            onResult(data);
        });
    }

    static stormImpactSpatiotemporal(track, onResult) {
        const times = track.map(x => x.time.value);
        const polys = track.map(i => {
            const radius = Utils.speed2cat(i.windSpeed.value) + 1;
            const [x, y] = i.coordinates;
            return new Utils.PloyCirc(x, y, radius).wkt;
        })
        Promise.all(polys.map(x => 
            fetch(host2 + encodeURIComponent(Utils.buildStringFromTempl(qStormSTCounties, x)), {
                headers: {'Accept': 'application/json'}
            }).then($ => $.json())
        )).then(d => {
            const st = times.map((x, i) => [new Date(x), d[i].results.bindings[0].reg_str.value])
                            .filter(x => x[1].length > 0);
            console.log(st);

            const filters = st.map(x => {
                const min_t = new Date(x[0].getTime() - 86400000).toISOString(); // -24 hours offset
                const max_t = x[0].toISOString();
                const p = x[1];
                return `regex(?event_loc_fips, '^(${p})') && ?event_time_begin > "${min_t}"^^xsd:dateTime && ?event_time_begin < "${max_t}"^^xsd:dateTime`
            }).join(' || ');

            fetch(host2.split('?')[0], {
                method: 'POST', 
                body: 'query=' + encodeURIComponent(Utils.buildStringFromTempl(qStormSTImpacts, filters)),
                headers: {'Content-type': 'application/x-www-form-urlencoded', 'Accept': 'application/json'}
            })
            .then($ => $.json())
            .then(data => {
                console.log(data.results.bindings);
            })
        })
    }

    static stormImpactStates(stormName, onResult) {
        fetch(host2 + encodeURIComponent(Utils.buildStringFromTempl(qStormImpactStates, stormName)), {
            headers: {'Accept': 'application/json'}
        })
        .then($ => $.json())
        .then(data => {
            const res = data.results.bindings;
            let states = [];
            if (res.length > 0) {
                const row = res[0];
                states = [...new Set(row.states.value.split(','))]
            } 
            onResult(states);
        });
    }

    static experts(topics, state, onResult) {
        let filter = topics.map(x => `regex(?topics, "${x}")`).join('&&');
        if (state) {
            filter += `&&regex(?state, "(?i:${state})")`
        }

        fetch(host2 + encodeURIComponent(Utils.buildStringFromTempl(qExpert, filter)), {
            headers: {
                'Accept': 'application/json',
                // 'Authorization': token
            }
        })
        .then($ => $.json())
        .then(data => {
            const res = data.results.bindings;
            for (const i of res) {
                let coord = i.wkt.value.replace(/.+ ?\((.+)\)/g, '$1');
                i.coordinates = coord.split(' ').map(x => parseFloat(x));
            }      
            onResult(res);
        });
    }
}

export default SparqlQuery;