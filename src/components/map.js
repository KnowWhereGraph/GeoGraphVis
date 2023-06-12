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


import React from 'react';
import DeckGL from '@deck.gl/react';
import { Map } from 'react-map-gl';

import Utils from '../util/utils';
import SparqlQuery from '../util/query';
import Constant from '../util/constant';
import NOAADisaster from '../datasets/NOAADisaster';


let isFetching = false;
let currStorm = '';
let trackData = null;
let dataset = null;

function setLayer(props) {
    let {stage, stormName, sendMessage} = props;
    let name = Utils.renderStormName(stormName, true);
    stage = Utils.parseStage(stage);
    
    switch (stage.main) {
        case '1':
           return Utils.createLandfallLayers(Constant.IL_DATA, {onClick: (info, e) => {
                const {name, year} = info.object;
                sendMessage('checkpoint');
                sendMessage('setStage', Utils.buildStage(2));
                sendMessage('setStorm', `${name.toUpperCase()} ${year}`);
            }});
        case '2':
            if (stage.sub === '0') {
                if (!isFetching && currStorm !== stormName) {
                    isFetching = true;
                    setTimeout(() => props.sendMessage('loading', true), 0);

                    const onload = data => { 
                        isFetching = false;
                        currStorm = stormName;
                        trackData = data;
                        dataset = null;
                        props.sendMessage('loading', false);
                    } 
                    if (parseInt(stormName.split(' ')[1]) > 2021) {
                        fetch('//cici.lab.asu.edu/gfs_data/storm_track_latest.json')
                                .then($ => $.json())
                                .then(onload);
                    } else {
                        SparqlQuery.stormTrack(stormName, onload)
                    }
                    return [];
                } else {
                    return Utils.createStormTrackLayers(trackData);
                }
            } else if (stage.sub === '1') {
                return props.drawnImpactArea ? Utils.createDrawAreaLayer(props.drawnImpactArea, data => {
                    props.sendMessage('setDrawnImpactArea', data)
                }) : [];
            }
            break;
        case '3':
            let layers = [];
            if (!isFetching && props.data === null) {
                isFetching = true;
                setTimeout(() => props.sendMessage('loading', true), 0);

                const onload = d => {
                    dataset = new NOAADisaster([d[0].results.bindings, d[1]]);
                    props.sendMessage('loading', false);
                    props.sendMessage('setData', dataset);
                    isFetching = false;

                    const linestr = trackData.map(x => x.coordinates.join(' ')).join(',');
                    SparqlQuery.stormImpactStates(linestr, data => {
                        props.sendMessage('setImpactStates', data);
                    });
                }

                if (Constant.__hurr_list.indexOf(stormName.toLowerCase()) < 0) {
                    SparqlQuery.stormImpactSpatial(trackData, impactCounties => {
                        fetch(`./data/health_ranking_2021.json`).then($ => $.json()).then(d_health => {
                            const counties = [...new Set(impactCounties.map(x => x[1]).join('|').split('|'))];
                            SparqlQuery.countyGeometry(counties, d_geo => {
                                for (let i of d_geo.results.bindings) {
                                    let t = impactCounties.filter(x => x[1].indexOf(i.event_loc_fips.value) > -1);
                                    i.event_time_begin_xsd = {value: t[0][0]};
                                    i.event_time_end_xsd = {value: t[t.length - 1][0]};
                                }
                                onload([d_geo, d_health]);
                            })
                        });
                    });
                } else {
                    Promise.all([
                        fetch(`./impact_res/${name}.json`).then($ => $.json()),
                        fetch(`./data/health_ranking_2021.json`).then($ => $.json())
                    ]).then(onload);
                }
            } else {
                if (props.visKey && dataset)
                    layers = dataset.getVisualizations()[props.visKey]
                        .getLayers(props.data, {
                            is3d: props.is3d,
                            statsKey: props.statsKey
                        });
            }
            if (props.enableExperts) {
                layers = [...layers, Utils.createExpertLayer(props.expertData)];
            }
            return layers;
        default:
            return [];
    }
}

function _Map(props) {
    const deck = React.useRef();
    const [viewState, setViewState] = React.useState(
        props.is3d ? Constant.VIEW_STATE_3D : Constant.VIEW_STATE_2D);
    // console.log(deck.current.deck)

    const currPitch = props.is3d ? Constant.PITCH_3D : Constant.PITCH_2D; 
    if (viewState.pitch !== currPitch)
        setViewState({...viewState, pitch: currPitch});
    
    const onViewStateChange = React.useCallback(({viewState}) => {
        setViewState(viewState);
    }, []); 

    const getTooltip = ({layer, object}) => {
        if (!layer || !object) 
            return null;

        const style = { backgroundColor: 'rgba(0,0,0,0)' };

        let html = `<div class='tooltip'>`
        switch (layer.id) {
            case Constant.LAYER_ID_LANDFALL:
                html += `<p>${object.name}</p>`;
                break;
            case Constant.LAYER_ID_CHOROP:
                html += `<p>${object.name}</p>`;
                if (dataset && object.stat) {
                    const stInfo = dataset.getStatInfoByKey(props.statsKey); 
                    const stNum = Utils.formatNumber(Utils.formatDecimal(object.stat * (stInfo.scalar || 1), 2), true);
                    html += `<p>
                        ${stInfo.name}: ${stNum} 
                        ${stNum === Constant.VAL_NA ? '' : (stInfo.unit || '')}
                    </p>`;
                }
                break;  
            case Constant.LAYER_ID_EXPERT:
                html += `<p>${(object.fullname || object.name).value}</p>`;
                break;
            default:
                return null;
        }
        html += '</div>';

        return { html, style };
    }

    const onClick = ({layer, object}) => {
        if (!layer)
            return;
        
        switch (layer.id) {
            case Constant.LAYER_ID_CHOROP:
                props.sendMessage('setImpactDetail', object);
                break;  
            case Constant.LAYER_ID_EXPERT:
                props.sendMessage('setExpertId', object.expert.value);     
                break;
            default:
                break;
        }
    }

    const getCursor = ({isDragging, isHovering}) => {
        if (props.drawnImpactArea)
            return 'crosshair';
        else
            return isDragging ? 'grabbing' : (isHovering ? 'pointer' : 'grab')
    };

    return ( 
        <DeckGL ref={deck}
                viewState={viewState}
                controller={{ doubleClickZoom: false }} 
                layers={setLayer(props)}
                getCursor={getCursor}
                getTooltip={getTooltip} 
                onClick={onClick}
                onViewStateChange={onViewStateChange} >
                      
            <Map 
                mapboxAccessToken={Constant.MAP_TOKEN} 
                mapStyle={Constant.MAP_STYLE}
                attributionControl={false} />
        </DeckGL>
    );
}
 
export default _Map;