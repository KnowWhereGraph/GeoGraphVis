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


import { IconLayer, TextLayer, ScatterplotLayer, PathLayer } from '@deck.gl/layers';
import { EditableGeoJsonLayer } from "@nebula.gl/layers";
import { DrawPolygonMode } from "@nebula.gl/edit-modes";
import StormIco from '../assets/storm_ico.png';
import Constant from './constant';

Array.prototype.min = function(keyfunc) {
    if (this.length === 0)
        return 0;
    return keyfunc ? 
        this.map(x => keyfunc(x)).reduce((a, b) => Math.min(a, b)) :
        this.reduce((a, b) => Math.min(a, b))
}
Array.prototype.max = function(keyfunc) {
    if (this.length === 0)
        return 0;
    return keyfunc ? 
        this.map(x => keyfunc(x)).reduce((a, b) => Math.max(a, b)) :
        this.reduce((a, b) => Math.max(a, b))
}

const ICON_MAPPING_1 = { marker: {x: 0, y: 0,   width: 128, height: 128, anchorY: 128, mask: true} };
const ICON_MAPPING_2 = { marker: {x: 0, y: 128, width: 128, height: 128, anchorY: 128, mask: true} };

class Utils {
    static buildStringFromTempl(templ, value) {
        return templ.replace(Constant.RPL_PH, value);
    }
    static renderStormName(raw, nameonly) {
        let [name, year] = raw.split(' ');
        name = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
        return nameonly ? name : `${name} (${year})`;
    }
    static parseStage(stage) {
        let [main, sub] = stage.split('-');
        sub = sub || '0';
        return {main, sub};
    }
    static parseUnit(unitURI) {
        return Utils.termTranslate(unitURI.split('/').pop());
    }
    static formatNumber(num, fullfix) {
        let pf = '';
        if (num < 0) {
            return Constant.VAL_NA;
        }
        if (num > 1e9) {
            num /= 1e9;
            pf = fullfix ? ' Billion' : 'B'
        } else if (num > 1e6) {
            num /= 1e6;
            pf = fullfix ? ' Million' : 'M'
        } else if (num > 1e3) {
            num /= 1e3;
            pf = fullfix ? ' Thousand' : 'K'
        } else {
            return num
        }
        return num.toFixed(2) + pf;
    }
    static formatDecimal(num, maxDecLen, epsilon) {
        maxDecLen = maxDecLen || 6;
        epsilon = epsilon || 1e-6;
        for (let i = 0; i < maxDecLen + 1; i++) {
            if (Math.abs(parseFloat(num.toFixed(i)) - num) < epsilon)
                return num.toFixed(i);
        }
        return num.toFixed(maxDecLen);
    }
    static termTranslate(term) {
        const res = Constant.TERM_MAPPTING[term];
        return res ? res : term;
    }
    static buildStage(stage, sub) {
        if (sub === undefined)
            return `${stage}`;
        else
            return `${stage}-${sub}`;
    }
    static aggregateData(data, aggrKey, nameKey, statsKey) {
        const ind = {};
        for (const i of data) {
            if(!i[aggrKey])
                continue;
            if (ind[i[aggrKey].value] === undefined)
                ind[i[aggrKey].value] = { rec: [], stat: 0, count: 0, name: i[nameKey].value };
            ind[i[aggrKey].value].rec.push(i);
            ind[i[aggrKey].value].stat += statsKey ? (i[statsKey] ? parseFloat(i[statsKey].value) : -1) : 1;
            ind[i[aggrKey].value].count++;
        }
        const ret = Object.values(ind);
        if ( statsKey && !statsKey.startsWith(Constant.IMPACT_LAYER_PREFIX) ) {
            for (let i of ret)
                i.stat /= i.count;
        }

        return ret;
    }
    static speed2cat(ws) {
        let category = 0;
        const hurr_thres = [64, 83, 96, 113, 137];
        for (let i in hurr_thres) {
            if (ws > hurr_thres[i])
                category++;
            else
                break;
        }
        return category;
    }
    static PloyCirc = class {
        constructor(x, y, r, precision=16) {
            this.res = [];
            for (let i = 0; i < precision; i++) {
                let rad = Math.PI * 2 * i / precision;
                this.res.push([
                    Math.cos(rad) * r + x,
                    Math.sin(rad) * r + y
                ])
            }
            this.res.push(this.res[0])
        }
        
        toString() {
            return this.res.map(x => `${x[0].toFixed(3)} ${x[1].toFixed(3)}`).join(',');
        }

        get wkt() {
            return `POLYGON((${this.toString()}))`
        }

        get coords() {
            return this.res;
        }
    }
    static createLandfallLayers(data, args) {
        return [
            new IconLayer({
                id: Constant.LAYER_ID_LANDFALL,
                data,
                pickable: true,
                iconAtlas: StormIco,
                iconMapping: ICON_MAPPING_1,
                getIcon: d => 'marker',
                sizeScale: 10,
                getPosition: d => d.coordinates,
                getSize: d => 5,
                getColor: d => [255, 140, 0],
                onClick: args.onClick
            }), new TextLayer({
                id: 'landfall-text-layer',
                data,
                getPosition: d => d.coordinates,
                getText: d => `${d.name}\n${d.year}`,
                getSize: 12,
                getColor: [255, 140, 0],
                getAngle: 0,
                getTextAnchor: 'middle',
                getAlignmentBaseline: 'top'
            })
        ];
    }
    static createStormTrackLayers(data, args) {
        return [
            new ScatterplotLayer({
                id: 'track-buffer-layer',
                data,
                pickable: false,
                opacity: 0.01,
                stroked: false,
                filled: true,
                radiusScale: 5000,
                radiusMinPixels: 3,
                radiusMaxPixels: 10000,
                lineWidthMinPixels: 1,
                getPosition: d => d.coordinates,
                getRadius: d => parseInt(d.windSpeed.value),
                getFillColor: d => [255, 140, 0]
            }), new PathLayer({
                id: 'track-path-layer',
                data: data && [data.map(x => x.coordinates)],
                pickable: false,
                widthScale: 1,
                widthMinPixels: 3,
                capRounded: true,
                getPath: d => d,
                getColor: d => [100, 200, 0],
                getWidth: d => 5
            })
        ];
    }
    static createExpertLayer(data, args) {
        return [
            new IconLayer({
                id: Constant.LAYER_ID_EXPERT,
                data,
                pickable: true,
                iconAtlas: StormIco,
                iconMapping: ICON_MAPPING_2,
                getIcon: d => 'marker',
                sizeScale: 10,
                getPosition: d => d.coordinates,
                getSize: d => 3,
                getColor: d => [100, 140, 255],
            }), 
        ];
    }
    static createDrawAreaLayer(data, onUpdate, args) {
        return [
            new EditableGeoJsonLayer({
                id: Constant.LAYER_ID_DRAW,
                data: data,
                selectedFeatureIndexes: [],
                mode: DrawPolygonMode,
                
                filled: true,
                pointRadiusMinPixels: 2,
                pointRadiusScale: 2000,
                extruded: true,
                getElevation: 1000,
                getFillColor: [255, 140, 0, 150],
          
                onEdit: ({ updatedData, editType, featureIndexes, editContext }) => {
                    let len = data && data.features ? data.features.length : 0;
                    if (updatedData && updatedData.features.length > len) {
                        onUpdate({
                            type: "FeatureCollection",
                            features: updatedData.features.slice(-1)
                        });
                    }
                }
            })
        ];
    }
}

export default Utils;